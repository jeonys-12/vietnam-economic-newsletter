const RESPONSES_URL = "https://api.openai.com/v1/responses";

export function extractOutputText(response = {}) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  return (response.output || [])
    .flatMap((item) => item?.content || [])
    .filter((content) => content?.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("");
}

export async function createOpenAiResponse({ apiKey, body, fetchImpl = fetch, timeoutMs = 30000 }) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");

  const response = await fetchImpl(RESPONSES_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const raw = await response.text();
  if (!response.ok) {
    const safeError = raw.replaceAll(apiKey, "[REDACTED]").replace(/\s+/g, " ").trim().slice(0, 500);
    throw new Error(`OpenAI Responses API ${response.status}: ${safeError || response.statusText}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("OpenAI Responses API returned invalid JSON");
  }
}
