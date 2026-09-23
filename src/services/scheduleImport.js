import { validateImport } from "../lib/scheduleImport";

export function importConfigured() {
  return (
    /^https:\/\//.test(process.env.EXPO_PUBLIC_IMPORT_URL || "") &&
    !!process.env.EXPO_PUBLIC_IMPORT_TOKEN
  );
}

const messages = {
  FREE_QUOTA_EXHAUSTED:
    "מכסת הזיהוי החינמית של Gemini מוצתה כרגע. נסה שוב מאוחר יותר. הלוח לא השתנה.",
  TOO_MANY_REQUESTS:
    "בוצעו כמה ניסיונות ברצף. המתן דקה ונסה שוב. הלוח לא השתנה.",
  NOT_CONFIGURED:
    "שירות הזיהוי עדיין לא הוגדר. יש לפנות למי שהתקין את האפליקציה.",
  UNAUTHORIZED: "החיבור לשירות הזיהוי דורש עדכון של האפליקציה.",
  PROVIDER_ACCESS:
    "אין כרגע גישה למודל בפרויקט Google שהוגדר. יש לבדוק את הגדרת השירות. הלוח לא השתנה.",
  UNREADABLE: "לא התקבל זיהוי מלא. נסה צילום ברור יותר או את קובץ ה־Excel.",
  INVALID_INPUT:
    "הקובץ אינו מתאים או גדול מדי. נסה תמונה אחרת או גיליון קטן יותר.",
};

export async function recognizeSchedule(source, year, rowPolicy, signal) {
  if (!importConfigured()) throw new Error(messages.NOT_CONFIGURED);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal.aborted) cancel();
  signal.addEventListener("abort", cancel);
  const timer = setTimeout(cancel, 100000);
  try {
    const payload =
      source.kind === "image"
        ? { kind: "image", base64: source.base64, year, rowPolicy }
        : { kind: "excel", text: source.text, year, rowPolicy };
    const response = await fetch(process.env.EXPO_PUBLIC_IMPORT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_IMPORT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        messages[body.code] ||
          "שירות הזיהוי אינו זמין כרגע. נסה שוב מאוחר יותר. הלוח לא השתנה.",
      );
    return validateImport(body.result, year);
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("הזיהוי בוטל או שההמתנה הסתיימה. הלוח לא השתנה.");
    if (error instanceof TypeError)
      throw new Error(
        "לא ניתן להתחבר לשירות הזיהוי. בדוק את החיבור לאינטרנט ונסה שוב.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
