import chatbotService from "../services/chatbotService.js";
import groqService from "../services/groqService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";

// In-memory rate limiting map: key = userId or IP, value = { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

// Cleanup stale rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/v1/chatbot/health
 * Health check endpoint for Groq AI integration
 */
export const getHealth = catchAsync(async (req, res) => {
  groqService.logApiKeyStatus();
  const health = await groqService.testGroqHealth();

  return res.status(200).json({
    server: "OK",
    provider: "Groq",
    configured: health.configured,
    model: health.model,
    ...(health.reachable !== undefined ? { reachable: health.reachable } : {}),
    ...(health.error ? { error: health.error } : {}),
  });
});

/**
 * POST /api/v1/chatbot/message
 * Protected endpoint for processing chatbot user messages
 */
export const handleChatMessage = catchAsync(async (req, res) => {
  const userId = req.user?._id?.toString() || req.ip;

  groqService.logApiKeyStatus();
  console.log(`[ChatbotController] Processing chat request from user: "${req.user?.fullName || userId}"`);

  // 1. Rate Limit Check
  if (!checkRateLimit(userId)) {
    console.warn(`[ChatbotController] Rate limit exceeded for user ${userId}`);
    return res.status(429).json({
      success: false,
      error: "Groq API rate limit or quota exceeded. Please wait a minute before sending more messages.",
    });
  }

  const { message, history } = req.body;

  // 2. Input Validation
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "Invalid request body: Message text is required.",
    });
  }

  // 3. Process Message via Chatbot Service
  try {
    const result = await chatbotService.processChatMessage({
      message,
      history: Array.isArray(history) ? history : [],
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Chat response generated successfully",
      data: result,
    });
  } catch (err) {
    console.error("[ChatbotController] Error handling chat message:", {
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: err.stack,
    });

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Internal server error while processing chat message",
    });
  }
});

export default {
  getHealth,
  handleChatMessage,
};
