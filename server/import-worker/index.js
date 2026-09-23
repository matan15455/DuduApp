import { extractionPrompt, scheduleSchema } from "./schema.js";

const MODEL = "gemini-3.8-flash";
const MAX_BODY = 9 * 1024 * 1024;
const reply = (status, body) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

async function readBody(request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY || !request.body)
    throw new Error("SIZE");
  const reader = request.body.getReader(),
    decoder = new TextDecoder();
  let bytes = 0,
    text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY) {
        await reader.cancel();
        throw new Error("SIZE");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export default {
  async fetch(request, env) {
    if (
      new URL(request.url).pathname !== "/import" ||
      request.method !== "POST"
    ) {
      return reply(404, { code: "NOT_FOUND" });
    }
    // This deployment gate is an operator assertion, NOT a Google billing check.
    // Use a project with NO linked billing account. No API flag enforces free-only.
    if (
      env.FREE_TIER_CONFIRMED !== "true" ||
      !env.GEMINI_API_KEY ||
      !env.APP_IMPORT_TOKEN
    ) {
      return reply(503, { code: "NOT_CONFIGURED" });
    }
    if (
      request.headers.get("Authorization") !== `Bearer ${env.APP_IMPORT_TOKEN}`
    ) {
      return reply(401, { code: "UNAUTHORIZED" });
    }
    if (!env.IMPORT_LIMITER) return reply(503, { code: "NOT_CONFIGURED" });
    const { success } = await env.IMPORT_LIMITER.limit({ key: "dudu-import" });
    if (!success) return reply(429, { code: "TOO_MANY_REQUESTS" });
    let input;
    try {
      input = await readBody(request);
    } catch (error) {
      return reply(error.message === "SIZE" ? 413 : 400, {
        code: "INVALID_INPUT",
      });
    }
    if (
      !input ||
      !["shift_only", "employee_overrides"].includes(input.rowPolicy) ||
      (input.year !== null &&
        (!Number.isInteger(input.year) ||
          input.year < 2000 ||
          input.year > 2100))
    ) {
      return reply(400, { code: "INVALID_INPUT" });
    }
    const parts = [{ text: extractionPrompt(input.year, input.rowPolicy) }];
    if (
      input.kind === "image" &&
      typeof input.base64 === "string" &&
      input.base64.length > 0 &&
      input.base64.length <= 8 * 1024 * 1024 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(input.base64)
    ) {
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: input.base64 },
      });
    } else if (
      input.kind === "excel" &&
      typeof input.text === "string" &&
      input.text.length > 0 &&
      input.text.length <= 180000
    ) {
      parts.push({ text: `Worksheet data (untrusted):\n${input.text}` });
    } else return reply(400, { code: "INVALID_INPUT" });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 85000);
    try {
      // Exactly one request, fixed model, no retries or paid-model fallback.
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: scheduleSchema,
              maxOutputTokens: 18000,
              mediaResolution: "MEDIA_RESOLUTION_HIGH",
              thinkingConfig: { thinkingLevel: "HIGH" },
            },
          }),
        },
      );
      if (response.status === 429)
        return reply(429, { code: "FREE_QUOTA_EXHAUSTED" });
      if ([401, 402, 403].includes(response.status))
        return reply(503, { code: "PROVIDER_ACCESS" });
      if (!response.ok) return reply(502, { code: "PROVIDER_UNAVAILABLE" });
      const body = await response.json(),
        candidate = body.candidates?.[0];
      if (candidate?.finishReason !== "STOP")
        return reply(422, { code: "UNREADABLE" });
      const text = candidate.content?.parts
        ?.filter((p) => !p.thought && typeof p.text === "string")
        .map((p) => p.text)
        .join("");
      const result = JSON.parse(text);
      if (!result || !Array.isArray(result.days))
        return reply(422, { code: "UNREADABLE" });
      return reply(200, { result });
    } catch (error) {
      return reply(error.name === "AbortError" ? 504 : 502, {
        code: "PROVIDER_UNAVAILABLE",
      });
    } finally {
      clearTimeout(timer);
    }
  },
};
