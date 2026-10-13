import "dotenv/config";

const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || "openai/gpt-oss-20b").trim();
const GROQ_BASE_URL = (
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\\/$, "");

export function getAIStatus() {
  return {
    provider: "Groq",
    configured: Boolean(GROQ_API_KEY),
    model: GROQ_MODEL,
    message: GROQ_API_KEY
      ? "AI provider credentials are configured. A live request is needed to verify provider/model access."
      : "AI is not configured. Add GROQ_API_KEY to the backend environment variables and redeploy.",
  };
}

export async function generateAIText({
  system,
  prompt,
  temperature = 0.3,
  maxTokens = 1400,
}) {
  if (!GROQ_API_KEY) {
    const error = new Error(
      "AI tools are not configured on the server. Add GROQ_API_KEY in Render → your backend service → Environment, then redeploy.",
    );
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  let response;

  try {
    response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: String(system || "You are CareerHub AI. Be accurate, useful, and explicit about uncertainty."),
          },
          {
            role: "user",
            content: String(prompt || ""),
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (cause) {
    const message = cause?.name === "AbortError"
      ? "AI request timed out after 45 seconds. Please try again."
      : `Could not connect to Groq AI: ${cause?.message || "network error"}`;
    const error = new Error(message);
    error.status = 502;
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.error?.message || parsed?.message || body;
    } catch {
      // Keep the provider's text response.
    }
    const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 503 : 502;
    const message = response.status === 401 || response.status === 403
      ? "Groq rejected the API key. Verify GROQ_API_KEY in the backend environment."
      : response.status === 404
        ? `Groq could not find model "${GROQ_MODEL}". Set GROQ_MODEL to a model enabled for your Groq account.`
        : response.status === 429
          ? "Groq rate limit or quota reached. Check your Groq account limits and try again later."
          : `Groq API error (HTTP ${response.status}): ${String(detail).slice(0, 350)}`;
    const error = new Error(message);
    error.status = status;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error("Groq returned an unreadable response. Please retry.");
    error.status = 502;
    throw error;
  }

  const result = data.choices?.[0]?.message?.content;
  const text = Array.isArray(result)
    ? result.map((part) => typeof part === "string" ? part : part?.text || "").join("").trim()
    : typeof result === "string"
      ? result.trim()
      : "";

  if (!text) {
    const error = new Error("Groq returned an empty response. Check GROQ_MODEL and provider access.");
    error.status = 502;
    throw error;
  }

  return text;
}
