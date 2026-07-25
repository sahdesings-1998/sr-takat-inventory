import Groq from "groq-sdk";
import ApiError from "../utils/ApiError.js";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// Ordered list of Groq production models for automatic fallback
const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama-3.1-70b-versatile",
  "llama3-8b-8192",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

// In-memory cache of currently confirmed working Groq model
let activeWorkingModel = null;

/**
 * Checks whether process.env.GROQ_API_KEY is configured
 */
export function isConfigured() {
  const key = process.env.GROQ_API_KEY;
  return Boolean(key && typeof key === "string" && key.trim().length > 0);
}

/**
 * Gets configured or active Groq model name
 */
export function getModel() {
  if (activeWorkingModel) return activeWorkingModel;
  const envModel = (process.env.GROQ_MODEL || "").trim();
  return envModel || DEFAULT_MODEL;
}

/**
 * Logs presence of GROQ_API_KEY without exposing key string
 */
export function logApiKeyStatus() {
  if (isConfigured()) {
    console.log("[Chatbot/Groq] API key status: API key found");
  } else {
    console.warn("[Chatbot/Groq] API key status: API key missing (GROQ_API_KEY)");
  }
}

/**
 * Checks if an error is a Groq model availability / unsupported model error
 */
function isModelError(err) {
  if (!err) return false;
  const status = err.status || err.statusCode || 0;
  const msg = (err.message || "").toLowerCase();
  return (
    status === 400 ||
    status === 404 ||
    msg.includes("model") ||
    msg.includes("decommissioned") ||
    msg.includes("unsupported") ||
    msg.includes("not_found") ||
    msg.includes("invalid_request_error")
  );
}

/**
 * Helper to execute a single Groq completion call for a given model
 */
async function callGroqSDK(groq, model, payload) {
  console.log(`[Chatbot/Groq] Invoking model: "${model}"...`);
  const completion = await groq.chat.completions.create({
    ...payload,
    model,
  });
  const choice = completion.choices?.[0]?.message;
  if (!choice) {
    throw new Error("Groq API returned empty response choice.");
  }
  return choice;
}

/**
 * Invokes Groq Chat Completions API with automatic model fallback & validation
 */
export async function generateChatCompletion({ systemInstruction, messages = [], tools = null }) {
  if (!isConfigured()) {
    logApiKeyStatus();
    throw new ApiError(400, "Missing GROQ_API_KEY in backend environment");
  }

  const apiKey = process.env.GROQ_API_KEY.trim();
  const groq = new Groq({ apiKey });

  // Build standard chat completion messages payload
  const formattedMessages = [];
  if (systemInstruction) {
    formattedMessages.push({ role: "system", content: systemInstruction });
  }

  if (Array.isArray(messages)) {
    messages.forEach((msg) => {
      if (msg.role && (msg.content !== undefined || msg.tool_calls || msg.tool_call_id)) {
        const item = {
          role: msg.role === "bot" ? "assistant" : msg.role,
        };
        if (msg.content !== undefined) item.content = msg.content;
        if (msg.tool_calls) item.tool_calls = msg.tool_calls;
        if (msg.tool_call_id) item.tool_call_id = msg.tool_call_id;
        if (msg.name) item.name = msg.name;
        formattedMessages.push(item);
      }
    });
  }

  const basePayload = {
    messages: formattedMessages,
    temperature: 0.2,
    max_tokens: 1200,
  };

  if (tools && Array.isArray(tools) && tools.length > 0) {
    basePayload.tools = tools;
    basePayload.tool_choice = "auto";
  }

  // Build candidate model list starting with configured or active model
  const primaryModel = getModel();
  const candidateModels = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError = null;

  // Iterate candidate models with automatic fallback
  for (const modelCandidate of candidateModels) {
    try {
      const choice = await callGroqSDK(groq, modelCandidate, basePayload);
      // Mark working model in cache
      activeWorkingModel = modelCandidate;
      console.log(`[Chatbot/Groq] Chat completion succeeded using model: "${modelCandidate}"`);
      return choice;
    } catch (err) {
      lastError = err;
      console.warn(`[Chatbot/Groq] Model "${modelCandidate}" failed: ${err.message}`);

      // If it's NOT a model error (e.g. rate limit 429 or auth 401), don't keep looping model fallbacks
      if (!isModelError(err)) {
        break;
      }
    }
  }

  // Error handling mapping
  console.error("[Chatbot/Groq] All model candidates failed:", lastError?.message);

  const status = lastError?.status || lastError?.statusCode || 500;
  const msg = lastError?.message || "Groq API error";

  if (status === 401 || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("unauthorized")) {
    throw new ApiError(401, "Invalid Groq API key configured on backend");
  }

  if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
    throw new ApiError(429, "Groq AI service rate limit exceeded. Please try again shortly.");
  }

  if (isModelError(lastError)) {
    throw new ApiError(400, `Groq AI models currently unavailable. Fallback models tested: ${candidateModels.join(", ")}`);
  }

  throw new ApiError(status >= 400 && status < 600 ? status : 500, `Groq AI Service Error: ${msg}`);
}

/**
 * Health Check test for GET /chatbot/health
 */
export async function testGroqHealth() {
  const configured = isConfigured();
  const model = getModel();

  if (!configured) {
    return {
      server: "OK",
      provider: "Groq",
      configured: false,
      model,
      error: "Missing GROQ_API_KEY in backend environment",
    };
  }

  try {
    const pingResponse = await generateChatCompletion({
      systemInstruction: "Respond with OK",
      messages: [{ role: "user", content: "ping" }],
    });

    const isOk = Boolean(pingResponse?.content || pingResponse);

    return {
      server: "OK",
      provider: "Groq",
      configured: true,
      model: getModel(),
      reachable: isOk,
    };
  } catch (err) {
    return {
      server: "OK",
      provider: "Groq",
      configured: true,
      model: getModel(),
      reachable: false,
      error: err.message,
      statusCode: err.statusCode || 500,
    };
  }
}

export default {
  isConfigured,
  getModel,
  logApiKeyStatus,
  generateChatCompletion,
  testGroqHealth,
};
