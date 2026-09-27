import { schema, instructions } from "./prompt.mjs";

const MODEL = "gemini-3.1-flash-lite";
const json = (value, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

async function readInput(request) {
  if (!request.body) throw new Error("body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) {
        await reader.cancel();
        throw new RangeError("size");
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  const input = JSON.parse(text + decoder.decode());
  if (
    !Array.isArray(input?.entries) ||
    !input.entries.length ||
    input.entries.length > 35
  )
    throw new Error("entries");
  const seen = new Set();
  const entries = input.entries.map((entry) => {
    if (
      !entry ||
      typeof entry.day !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.day) ||
      !Number.isFinite(Date.parse(entry.day)) ||
      new Date(entry.day).toISOString().slice(0, 10) !== entry.day ||
      seen.has(entry.day) ||
      typeof entry.base !== "string" ||
      entry.base.length > 200 ||
      typeof entry.change !== "string" ||
      entry.change.length > 200 ||
      typeof entry.red !== "boolean"
    )
      throw new Error("entry");
    seen.add(entry.day);
    return {
      day: entry.day,
      base: entry.base,
      change: entry.change,
      red: entry.red,
    };
  });
  return { employee: "דודו", entries };
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/import")
      return json({ error: "not_found" }, 404);
    if (request.method !== "POST") return json({ error: "method" }, 405);
    if (
      !env.GEMINI_API_KEY ||
      !/^[a-f0-9]{64}$/.test(env.APP_IMPORT_TOKEN || "") ||
      !env.IMPORT_LIMIT
    )
      return json({ error: "setup" }, 503);
    if (
      request.headers.get("Authorization") !== `Bearer ${env.APP_IMPORT_TOKEN}`
    )
      return json({ error: "unauthorized" }, 401);
    if (!request.headers.get("Content-Type")?.startsWith("application/json"))
      return json({ error: "input" }, 400);
    let input;
    try {
      input = await readInput(request);
    } catch (error) {
      return json({ error: "input" }, error instanceof RangeError ? 413 : 400);
    }
    try {
      if (!(await env.IMPORT_LIMIT.limit({ key: "dudu-import" })).success)
        return json({ error: "rate_limit" }, 429);
    } catch {
      return json({ error: "unavailable" }, 503);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          signal: controller.signal,
          redirect: "manual",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: instructions }] },
            contents: [
              { role: "user", parts: [{ text: JSON.stringify(input) }] },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: schema,
              maxOutputTokens: 8192,
              thinkingConfig: { thinkingLevel: "low" },
            },
          }),
        },
      );
      if (!response.ok) {
        // Never forward Google's raw error body: it may contain request data.
        const codes = {
          400: "gemini_request",
          401: "gemini_key",
          403: "gemini_access",
          404: "gemini_model",
          429: "gemini_quota",
        };
        return json(
          {
            error: codes[response.status] || "gemini_unavailable",
            upstreamStatus: response.status,
          },
          response.status === 429 ? 429 : 502,
        );
      }
      const body = await response.json();
      const candidate = body.candidates?.[0];
      if (candidate?.finishReason !== "STOP")
        return json(
          {
            error:
              candidate?.finishReason === "MAX_TOKENS"
                ? "gemini_truncated"
                : "gemini_incomplete",
          },
          502,
        );
      const parsed = JSON.parse(
        candidate.content.parts
          .filter((p) => !p.thought)
          .map((p) => p.text || "")
          .join(""),
      );
      if (
        !Array.isArray(parsed?.entries) ||
        parsed.entries.length !== input.entries.length
      )
        throw new Error("Gemini returned an unexpected entry count");
      const days = new Set(input.entries.map((e) => e.day));
      const types = schema.properties.entries.items.properties.type.enum;
      const entries = parsed.entries.map((e) => {
        if (
          !e ||
          !days.delete(e.day) ||
          !types.includes(e.type) ||
          typeof e.needsReview !== "boolean" ||
          typeof e.start !== "string" ||
          typeof e.end !== "string" ||
          e.start.length > 5 ||
          e.end.length > 5
        )
          throw new Error("output");
        return {
          day: e.day,
          type: e.type,
          start: e.start,
          end: e.end,
          needsReview: e.needsReview,
        };
      });
      return json({ entries });
    } catch (error) {
      return json(
        {
          error: controller.signal.aborted
            ? "timeout"
            : error?.message === "output" ||
                error?.message ===
                  "Gemini returned an unexpected entry count" ||
                error instanceof SyntaxError
              ? "gemini_invalid_output"
              : "gemini_network",
        },
        controller.signal.aborted ? 504 : 502,
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};
