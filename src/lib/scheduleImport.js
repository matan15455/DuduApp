import { dayInfo, iso, parse } from "./schedule";

export const IMPORT_CODES = {
  ב: "morning",
  צ: "afternoon",
  ל: "night",
  ח: "off",
};
const clean = (value) => (typeof value === "string" ? value.trim() : "");
const validYear = (value) =>
  Number.isInteger(value) && value >= 2000 && value <= 2100;
const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && iso(parse(value)) === value;

// Treat model output as an untrusted proposal, never as writes to the schedule.
export function validateImport(raw, suppliedYear = null) {
  if (
    !raw ||
    raw.employeeFound !== true ||
    raw.employeeAmbiguous !== false ||
    !/(^|\s)דודו($|\s)/.test(clean(raw.employeeName))
  ) {
    throw new Error(
      "לא זוהה סקשן חד־משמעי של דודו. בחר תמונה ברורה עם השם וכותרת החודש, או גיליון אחר.",
    );
  }
  const year = suppliedYear || raw.year;
  if (
    !validYear(year) ||
    !Number.isInteger(raw.month) ||
    raw.month < 1 ||
    raw.month > 12
  ) {
    throw new Error(
      "החודש או השנה לא זוהו בבירור. ודא שכותרת החודש מופיעה. אם השנה חסרה, אפשר להזין אותה ולזהות שוב.",
    );
  }
  if (!Array.isArray(raw.days) || !raw.days.length || raw.days.length > 62) {
    throw new Error(
      "לא זוהו תאריכים לייבוא, או שזוהה טווח גדול מדי. בחר סדר עבודה של חודש אחד.",
    );
  }
  const occurrences = new Map();
  raw.days.forEach((row) => {
    const date = clean(row?.date);
    occurrences.set(date, (occurrences.get(date) || 0) + 1);
  });
  const rows = raw.days
    .map((row, index) => {
      row = row || {};
      const date = clean(row?.date),
        code = clean(row?.code);
      const issues = [];
      const dateValid = validDate(date);
      if (!dateValid) issues.push("תאריך חסר או לא תקין");
      if (dateValid) {
        const d = parse(date),
          offset = (d.getFullYear() - year) * 12 + d.getMonth() + 1 - raw.month;
        if (Math.abs(offset) > 1)
          issues.push("התאריך אינו מתאים לחודש שבכותרת");
        if (row.printedDay !== d.getDate())
          issues.push("מספר היום אינו תואם לתאריך שזוהה");
        if (
          !Number.isInteger(row.weekday) ||
          row.weekday < 0 ||
          row.weekday > 6 ||
          row.weekday !== d.getDay()
        ) {
          issues.push("היום בשבוע חסר או אינו תואם לתאריך");
        }
      }
      if (occurrences.get(date) > 1) issues.push("התאריך מופיע יותר מפעם אחת");
      const dateBlocked = issues.length > 0;
      if (!Object.hasOwn(IMPORT_CODES, code))
        issues.push("אות המשמרת אינה ברורה");
      if (row.confident !== true) issues.push("הזיהוי דורש בדיקה מול המקור");
      if (clean(row.warning)) issues.push(clean(row.warning).slice(0, 300));
      return {
        id: String(index),
        date,
        code,
        type: Object.hasOwn(IMPORT_CODES, code) ? IMPORT_CODES[code] : null,
        evidence: clean(row.evidence).slice(0, 400),
        issues,
        dateBlocked,
        selected: issues.length === 0,
        reviewed: false,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    employeeName: clean(raw.employeeName),
    month: raw.month,
    year,
    header: clean(raw.header).slice(0, 250),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.filter((w) => typeof w === "string").slice(0, 12)
      : [],
    rows,
  };
}

export function importChanges(data, rows) {
  return rows.filter(
    (row) =>
      row.selected &&
      !row.dateBlocked &&
      (row.issues.length === 0 || row.reviewed) &&
      Object.values(IMPORT_CODES).includes(row.type) &&
      dayInfo(data, row.date).type !== row.type,
  );
}

export function applyImport(data, rows) {
  const overrides = { ...data.overrides };
  for (const row of importChanges(data, rows)) {
    const previous = overrides[row.date] || {};
    // New shift types use their default hours; notes are personal and survive.
    // Identical shift types never disturb existing one-off hours.
    const next = { ...previous, type: row.type };
    delete next.start;
    delete next.end;
    overrides[row.date] = next;
  }
  return { ...data, overrides };
}
