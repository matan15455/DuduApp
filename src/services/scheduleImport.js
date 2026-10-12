import { requireOptionalNativeModule } from "expo";
import { extractSchedule, reviewResponse } from "../lib/scheduleImport";

const importUrl = () => (process.env.EXPO_PUBLIC_IMPORT_URL || "").trim();
const importToken = () => (process.env.EXPO_PUBLIC_IMPORT_TOKEN || "").trim();

function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new Error("בוטל"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve(undefined);
    }, ms);
    signal?.addEventListener("abort", abort);
    if (signal?.aborted) abort();
  });
}

// Keep the deployed Worker's 35-day / 3-per-minute limits. No partial result
// is returned on cancellation/failure and the calendar is never written here.
export async function recognizeSchedule(
  source,
  data,
  signal,
  onProgress = (_done, _total) => {},
) {
  const result = [],
    total = source.entries.length;
  for (let offset = 0; offset < total;) {
    if (signal?.aborted) throw new Error("בוטל");
    if (offset) await pause(21000, signal);
    onProgress(offset, total);
    let count = Math.min(35, total - offset);
    // Three bytes per UTF-16 code unit is a conservative UTF-8 upper bound.
    // Leave headroom under the Worker's 32KB request limit.
    while (
      count > 1 &&
      JSON.stringify({
        entries: source.entries
          .slice(offset, offset + count)
          .map(({ day, base, change, red }) => ({ day, base, change, red })),
      }).length *
        3 >
        30000
    )
      count--;
    const rows = await recognizeBatch(
      { ...source, entries: source.entries.slice(offset, offset + count) },
      data,
      signal,
    );
    result.push(...rows);
    offset += count;
    onProgress(result.length, total);
  }
  return result;
}
export function importSetupError() {
  try {
    const url = new URL(importUrl());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/import" ||
      url.search ||
      url.hash
    )
      throw new Error();
  } catch {
    return "שירות הייבוא טרם הוגדר";
  }
  if (!importToken()) return "חסר אסימון גישה לייבוא";
  return "";
}

export async function pickSchedule(months = 1) {
  if (!requireOptionalNativeModule("ExpoDocumentPicker"))
    throw new Error("נדרשת בניית פיתוח חדשה כדי להוסיף את בוחר הקבצים.");
  const DocumentPicker = require("expo-document-picker");
  const { File, Paths } = require("expo-file-system");
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  try {
    if (!/\.xlsx$/i.test(asset.name))
      throw new Error("בחר קובץ Excel בסיומת xlsx.");
    if (file.size > 5 * 1024 * 1024) throw new Error("בחר קובץ עד 5MB.");
    return {
      ...extractSchedule(await file.bytes(), new Date(), months),
      fileName: asset.name,
    };
  } finally {
    // Delete only the picker-owned cache copy, never the user's source file.
    if (
      file.uri.startsWith(
        Paths.cache.uri.endsWith("/") ? Paths.cache.uri : Paths.cache.uri + "/",
      )
    ) {
      try {
        file.delete();
      } catch {
        /* OS can clear remaining cache. */
      }
    }
  }
}

async function recognizeBatch(source, data, signal) {
  const setupError = importSetupError();
  if (setupError) throw new Error(setupError);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 60000);
  try {
    const response = await fetch(importUrl(), {
      method: "POST",
      redirect: "error",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${importToken()}`,
      },
      body: JSON.stringify({
        entries: source.entries.map(({ day, base, change, red }) => ({
          day,
          base,
          change,
          red,
        })),
      }),
    });
    if (!response.ok) {
      let detail = "";
      try {
        detail = (await response.json())?.error || "";
      } catch {
        /* body is not JSON */
      }
      const messages = {
        gemini_request: "Google דחתה את הגדרות בקשת הזיהוי (400).",
        gemini_key: "מפתח Gemini שבשרת אינו תקף (401).",
        gemini_access:
          "אין לשרת הרשאה להשתמש ב־Gemini. בדוק את המפתח והפרויקט (403).",
        gemini_model: "מודל Gemini שהוגדר בשרת אינו זמין (404).",
        gemini_quota: "מכסת Gemini מוצתה. נסה מאוחר יותר.",
        gemini_unavailable: "שירות Gemini אינו זמין כרגע.",
        gemini_truncated: "תשובת הזיהוי נקטעה לפני סיום.",
        gemini_incomplete: "Gemini לא החזיר זיהוי מלא.",
        gemini_invalid_output:
          "הזיהוי לא תאם לתאריכים או למבנה הנדרש. הלוח לא שונה.",
        gemini_network: "השרת לא הצליח להשלים את החיבור ל־Gemini.",
        unauthorized: "אסימון הגישה באפליקציה אינו תואם לשרת.",
        setup: "חיבור השרת טרם הושלם.",
        rate_limit: "נשלחו יותר מדי בקשות. המתן דקה ונסה שוב.",
        timeout: "הזיהוי ארך זמן רב מדי.",
        upstream: "השרת מחזיר שגיאה כללית. יש לפרוס את גרסת השרת המעודכנת.",
      };
      throw new Error(
        messages[detail] || `הזיהוי לא הושלם (${response.status}).`,
      );
    }
    return reviewResponse(source, await response.json(), data);
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(signal?.aborted ? "בוטל" : "הזיהוי ארך זמן רב מדי.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
