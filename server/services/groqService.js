import Groq from "groq-sdk";
import ApiError from "../utils/ApiError.js";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Checks whether process.env.GROQ_API_KEY is configured
 */
export function isConfigured() {
  const key = process.env.GROQ_API_KEY;
  return Boolean(key && typeof key === "string" && key.trim().length > 0);
}

/**
 * Gets configured Groq model name
 */
export function getModel() {
  return (process.env.GROQ_MODEL || DEFAULT_MODEL).trim();
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
 * Invokes Groq Chat Completions API using official groq-sdk
 */
export async function generateChatCompletion({ systemInstruction, messages = [] }) {
  if (!isConfigured()) {
    logApiKeyStatus();
    throw new ApiError(400, "Missing GROQ_API_KEY in backend environment");
  }

  const apiKey = process.env.GROQ_API_KEY.trim();
  const model = getModel();

  const groq = new Groq({ apiKey });

  // Build standard chat completion messages payload
  const formattedMessages = [];
  if (systemInstruction) {
    formattedMessages.push({ role: "system", content: systemInstruction });
  }

  if (Array.isArray(messages)) {
    messages.forEach((msg) => {
      if (msg.role && msg.content) {
        formattedMessages.push({
          role: msg.role === "bot" ? "assistant" : msg.role,
          content: msg.content,
        });
      }
    });
  }

  try {
    console.log(`[Chatbot/Groq] Requesting completion (Model: ${model})...`);
    const completion = await groq.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.2,
      max_tokens: 1000,
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (!reply) {
      throw new ApiError(500, "Groq API returned an empty response.");
    }

    console.log(`[Chatbot/Groq] Chat completion succeeded (Model: ${model})`);
    return reply;
  } catch (err) {
    console.error("[Chatbot/Groq] SDK Error:", {
      name: err.name,
      status: err.status,
      message: err.message,
    });

    if (err instanceof ApiError) {
      throw err;
    }

    const status = err.status || 500;
    const msg = err.message || "Groq API error";

    if (status === 401 || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("unauthorized")) {
      throw new ApiError(401, "Invalid Groq API key");
    }

    if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
      throw new ApiError(429, "Groq API rate limit or quota exceeded");
    }

    if (status === 400 || status === 404 || msg.toLowerCase().includes("model")) {
      throw new ApiError(400, `Invalid or unsupported Groq model: "${model}"`);
    }

    if (err.name === "APIConnectionError" || err.name === "APIConnectionTimeoutError" || msg.toLowerCase().includes("fetch")) {
      throw new ApiError(502, `Groq API service network failure or unreachable: ${msg}`);
    }

    throw new ApiError(status >= 400 && status < 600 ? status : 500, `Groq AI Error: ${msg}`);
  }
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

    return {
      server: "OK",
      provider: "Groq",
      configured: true,
      model,
      reachable: Boolean(pingResponse),
    };
  } catch (err) {
    return {
      server: "OK",
      provider: "Groq",
      configured: true,
      model,
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
