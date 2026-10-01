import "dotenv/config";

const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const GROQ_BASE_URL = (
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/$/, "");

export async function generateAIText({
  system,
  prompt,
  temperature = 0.4,
  maxTokens = 1400,
}) {
  if (!GROQ_API_KEY) {
    const error = new Error(
      "Groq AI is not configured. Add GROQ_API_KEY to Backend/backend/.env.",
    );
    error.status = 503;
    throw error;
  }

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
            content: String(
              system || "You are CareerHub AI. Be accurate and useful.",
            ),
          },
          {
            role: "user",
            content: String(prompt || ""),
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (cause) {
    const error = new Error(
      cause?.name === "TimeoutError" || cause?.name === "AbortError"
        ? "Groq API request timed out. Please try again."
        : `Could not connect to Groq API: ${cause?.message || "Network error"}`,
    );
    error.status = 502;
    throw error;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(
      `Groq API returned HTTP ${response.status}${
        body ? `: ${body.slice(0, 400)}` : ""
      }`,
    );

    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;

  const text = Array.isArray(result)
    ? result
        .map((part) => (typeof part === "string" ? part : part.text || ""))
        .join("")
        .trim()
    : typeof result === "string"
      ? result.trim()
      : "";

  if (!text) {
    const error = new Error(
      "Groq returned an empty response. Check the model and API access.",
    );
    error.status = 502;
    throw error;
  }

  return text;
}
