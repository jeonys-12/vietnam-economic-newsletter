import assert from "node:assert/strict";
import test from "node:test";
import { createOpenAiResponse, extractOutputText } from "./openai-response.js";

test("calls the Responses endpoint without the OpenAI SDK", async () => {
  let request;
  const result = await createOpenAiResponse({
    apiKey: "test-key",
    body: { model: "gpt-4o-mini", input: "test", max_output_tokens: 300 },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ output_text: "{\"items\":[]}", usage: { total_tokens: 1 } }));
    }
  });

  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.authorization, "Bearer test-key");
  assert.equal(JSON.parse(request.options.body).max_output_tokens, 300);
  assert.equal(extractOutputText(result), "{\"items\":[]}");
});

test("extracts raw output content and redacts API keys in errors", async () => {
  assert.equal(extractOutputText({ output: [{ content: [{ type: "output_text", text: "ok" }] }] }), "ok");

  await assert.rejects(
    createOpenAiResponse({
      apiKey: "secret-key",
      body: {},
      fetchImpl: async () => new Response("failed secret-key", { status: 400 })
    }),
    (error) => error.message.includes("[REDACTED]") && !error.message.includes("secret-key")
  );
});
