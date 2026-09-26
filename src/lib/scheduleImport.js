import * as XLSX from "xlsx";
import { addDays, dayInfo, iso, META, parse, TYPES } from "./schedule.js";

export const MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];
const codes = {
  ב: "morning",
  צ: "afternoon",
  ל: "night",
  ח: "off",
  בצ: "morningAfternoon",
  צל: "afternoonNight",
};
const clean = (value) =>
  String(value ?? "")
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .trim();
const compact = (value) => clean(value).replace(/\s/g, "");
export const validTime = (value) =>
  typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

function cellAt(sheet, row, col) {
  const merge = (sheet["!merges"] || []).find(
    (m) => row >= m.s.r && row <= m.e.r && col >= m.s.c && col <= m.e.c,
  );
  const address = XLSX.utils.encode_cell(merge ? merge.s : { r: row, c: col });
  const cell = sheet[address];
  if (cell?.f && cell.v == null)
    throw new Error(
      "בקובץ יש נוסחה ללא תוצאה שמורה. פתח ושמור אותו ב־Excel ונסה שוב.",
    );
  return { cell, address, text: clean(cell?.v) };
}

function redFill(cell) {
  const fill = cell?.s;
  const rgb = fill?.fgColor?.rgb;
  if (fill?.patternType !== "solid") return false;
  if (!rgb) return [2, 10].includes(fill?.fgColor?.indexed);
  const hex = rgb.slice(-6);
  const r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  return r >= 160 && r > g * 1.6 && r > b * 1.6;
}

function extractSheet(bytes, sheetName, year, month) {
  const book = XLSX.read(bytes, {
    type: "array",
    sheets: [sheetName],
    cellStyles: true,
    sheetStubs: true,
    cellFormula: true,
    cellHTML: false,
    sheetRows: 251,
  });
  const sheet = book.Sheets[sheetName];
  const bounds = XLSX.utils.decode_range(
    sheet["!fullref"] || sheet["!ref"] || "A1",
  );
  if (bounds.e.r > 249 || bounds.e.c > 99)
    throw new Error("הגיליון גדול מהמבנה הנתמך (250 שורות ו־100 עמודות).");
  const people = Object.keys(sheet).filter((address) => {
    if (address.startsWith("!") || compact(sheet[address]?.v) !== "דודו")
      return false;
    const position = XLSX.utils.decode_cell(address);
    // His name can also appear as someone else's backup. Only a labelled
    // employee block has date/day/shift labels above the name in this column.
    const labels = [];
    for (let r = Math.max(0, position.r - 8); r < position.r; r++)
      labels.push(compact(cellAt(sheet, r, position.c).text));
    return ["תאריך", "יום", "משמרת"].every((label) => labels.includes(label));
  });
  if (people.length !== 1)
    throw new Error(
      "לא נמצאה שורה יחידה בשם דודו. ודא שהשם מופיע פעם אחת בגיליון.",
    );
  const person = XLSX.utils.decode_cell(people[0]);
  const findRow = (label) => {
    for (let r = person.r - 1; r >= Math.max(0, person.r - 8); r--) {
      if (compact(cellAt(sheet, r, person.c).text) === label) return r;
    }
    throw new Error(`לא נמצאה שורת ${label} מעל דודו.`);
  };
  const datesRow = findRow("תאריך"),
    weekdaysRow = findRow("יום"),
    shiftsRow = findRow("משמרת");
  if (!(
    datesRow < weekdaysRow &&
    weekdaysRow < shiftsRow &&
    shiftsRow < person.r
  ))
    throw new Error("מבנה השורות של דודו אינו ברור.");
  const columns = [];
  for (let c = 0; c <= bounds.e.c; c++) {
    if (c === person.c) continue;
    const value = cellAt(sheet, datesRow, c).text;
    if (/^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 31)
      columns.push({ col: c, num: Number(value) });
  }
  if (columns.length < 2 || columns.length > 35)
    throw new Error("טווח התאריכים בגיליון אינו ברור.");
  // Support both column directions, but require consecutive dates afterwards.
  if (columns[1].num !== columns[0].num + 1 && columns[1].num !== 1)
    columns.reverse();
  const rollover = columns.findIndex(
    (c, i) => i > 0 && c.num < columns[i - 1].num,
  );
  const startDate = new Date(
    year,
    month - (rollover >= 0 ? 1 : 0),
    columns[0].num,
    12,
  );
  const startDay = iso(startDate);
  const weekdays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  const entries = columns.map(({ col, num }, index) => {
    const day = addDays(startDay, index);
    if (parse(day).getDate() !== num)
      throw new Error(
        "התאריכים אינם רציפים. לא ניתן לקבוע בבטחה את החודש לכל יום.",
      );
    const wd = cellAt(sheet, weekdaysRow, col)
      .text.replace(/[׳'״"\s]/g, "")
      .replace(/^יום/, "");
    if (wd !== weekdays[parse(day).getDay()])
      throw new Error(
        `יום השבוע בתאריך ${day} אינו תואם לשנה הנוכחית. בדוק שהקובץ מעודכן.`,
      );
    const base = cellAt(sheet, shiftsRow, col),
      change = cellAt(sheet, person.r, col);
    if (base.text.length > 200 || change.text.length > 200)
      throw new Error("נמצא טקסט ארוך שאינו מתאים לתא משמרת.");
    return {
      day,
      base: base.text,
      change: change.text,
      red: redFill(change.cell),
      sourceCell: change.address,
      baseCell: base.address,
    };
  });
  if (!entries.some((entry) => parse(entry.day).getMonth() === month))
    throw new Error(`אין בגיליון ${sheetName} תאריכים מהחודש שלו.`);
  return entries;
}

const WINDOW_DAYS = 30;

// Reads every sheet needed to cover today + 29 days. Years in the workbook are
// legacy template content; dates use the device year.
export function extractSchedule(bytes, now = new Date()) {
  if (bytes.length > 5 * 1024 * 1024) throw new Error("בחר קובץ עד 5MB.");
  const names = XLSX.read(bytes, {
    type: "array",
    bookSheets: true,
  }).SheetNames;
  const created = iso(now);
  const windowDays = Array.from({ length: WINDOW_DAYS }, (_, i) =>
    addDays(created, i),
  );
  const first = parse(windowDays[0]),
    last = parse(windowDays[WINDOW_DAYS - 1]);
  const end = new Date(last.getFullYear(), last.getMonth() + 1, 1);
  const byDay = new Map(),
    used = [],
    errors = [];
  for (
    let d = new Date(first.getFullYear(), first.getMonth(), 1);
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    const matches = names.filter((name) =>
      clean(name)
        .split(/[\s\d\-_./]+/)
        .includes(MONTHS[d.getMonth()]),
    );
    if (matches.length > 1) {
      errors.push(
        new Error(`נמצאו כמה גיליונות ${MONTHS[d.getMonth()]}. השאר אחד.`),
      );
      continue;
    }
    if (!matches.length) continue;
    try {
      const entries = extractSheet(
        bytes,
        matches[0],
        d.getFullYear(),
        d.getMonth(),
      );
      used.push(matches[0]);
      for (const entry of entries) {
        const seen = byDay.get(entry.day);
        if (!seen) byDay.set(entry.day, entry);
        else if (
          seen.base !== entry.base ||
          seen.change !== entry.change ||
          seen.red !== entry.red
        )
          seen.conflict = true;
      }
    } catch (error) {
      errors.push(error);
    }
  }
  const entries = windowDays
    .filter((day) => byDay.has(day))
    .map((day) => byDay.get(day));
  if (!entries.length)
    throw errors[0] || new Error("אין בקובץ ימים מ־30 הימים הקרובים.");
  // A sheet that exists but cannot be read must never silently shrink the range.
  if (errors.length && entries.length < WINDOW_DAYS) throw errors[0];
  return {
    sheetName: used.join(", "),
    year: now.getFullYear(),
    created,
    from: entries[0].day,
    to: entries[entries.length - 1].day,
    employee: "דודו",
    entries,
  };
}

export function sourceMeaning(entry) {
  const text = compact(entry.change || (entry.red ? "ח" : entry.base));
  if (codes[text]) return { type: codes[text], start: "", end: "" };
  const time = text.match(
    /^מ?(\d{1,2}(?::\d{2})?)(?:עד|[-–—])(?:ל)?(\d{1,2}(?::\d{2})?)$/,
  );
  if (time) {
    const format = (t) =>
      t.includes(":") ? t.padStart(5, "0") : `${t.padStart(2, "0")}:00`;
    const start = format(time[1]),
      end = format(time[2]);
    if (validTime(start) && validTime(end) && start !== end)
      return { type: "special", start, end };
  }
  return null;
}

export function reviewResponse(source, response, data) {
  if (
    !response ||
    !Array.isArray(response.entries) ||
    response.entries.length !== source.entries.length
  )
    throw new Error("הזיהוי לא החזיר את כל הימים. הלוח לא שונה; נסה שוב.");
  const allowed = new Set(source.entries.map((entry) => entry.day));
  const found = new Map();
  for (const item of response.entries) {
    if (
      !item ||
      typeof item.day !== "string" ||
      typeof item.type !== "string" ||
      typeof item.start !== "string" ||
      typeof item.end !== "string" ||
      typeof item.needsReview !== "boolean"
    )
      throw new Error("הזיהוי החזיר מבנה לא תקין. הלוח לא שונה.");
    if (!allowed.has(item.day) || found.has(item.day))
      throw new Error(
        "הזיהוי החזיר תאריכים לא צפויים או כפולים. הלוח לא שונה.",
      );
    found.set(item.day, item);
  }
  return source.entries.map((entry) => {
    const item = found.get(entry.day),
      known = sourceMeaning(entry);
    const recognized = TYPES.includes(item.type);
    const timesOK =
      item.type === "special"
        ? validTime(item.start) &&
          validTime(item.end) &&
          item.start !== item.end
        : item.start === "" && item.end === "";
    const matchesSource =
      known &&
      known.type === item.type &&
      known.start === item.start &&
      known.end === item.end;
    // Unknown free text and disagreements always require a human decision.
    const needsReview =
      !recognized ||
      !timesOK ||
      !matchesSource ||
      entry.conflict ||
      item.needsReview !== false;
    const type = recognized ? item.type : known?.type || "";
    const hours =
      type === "special"
        ? [item.start || known?.start || "", item.end || known?.end || ""]
        : data.hours[type] || ["", ""];
    return {
      ...entry,
      type,
      start: hours[0],
      end: hours[1],
      selected: !needsReview,
      needsReview,
      reason: needsReview
        ? "יש להשוות למקור ולבחור משמרת ושעות לפני אישור היום."
        : "",
      before: dayInfo(data, entry.day),
    };
  });
}

export function validImportRow(row) {
  return (
    TYPES.includes(row.type) &&
    !row.needsReview &&
    (row.type === "off" ||
      (validTime(row.start) && validTime(row.end) && row.start !== row.end))
  );
}

export function applyImport(data, rows, sheetName) {
  const selected = rows.filter((row) => row.selected);
  if (!selected.length || selected.some((row) => !validImportRow(row)))
    throw new Error("יש לתקן את הימים המסומנים לפני השמירה.");
  const overrides = { ...data.overrides },
    changes = [];
  for (const row of selected) {
    const current = dayInfo(data, row.day);
    const defaults = data.hours[row.type];
    const hoursOverride =
      row.type !== "off" &&
      (row.type === "special" ||
        row.start !== defaults?.[0] ||
        row.end !== defaults?.[1]);
    const after = {
      ...(overrides[row.day]?.note ? { note: overrides[row.day].note } : {}),
      type: row.type,
      ...(hoursOverride ? { start: row.start, end: row.end } : {}),
    };
    if (
      current.type === row.type &&
      current.start === (row.type === "off" ? "" : row.start) &&
      current.end === (row.type === "off" ? "" : row.end)
    )
      continue;
    changes.push({ day: row.day, before: overrides[row.day] || null, after });
    overrides[row.day] = after;
  }
  return changes.length
    ? {
        ...data,
        overrides,
        lastImport: { sheetName, at: new Date().toISOString(), changes },
      }
    : data;
}

export function undoImport(data) {
  if (!data.lastImport) return data;
  const overrides = { ...data.overrides };
  for (const change of data.lastImport.changes) {
    const current = overrides[change.day] || {};
    // Preserve any shifts/hours edited after import, and always preserve notes.
    if (
      ["type", "start", "end"].some((key) => current[key] !== change.after[key])
    )
      continue;
    const restored = { ...(change.before || {}) };
    if (current.note) restored.note = current.note;
    else delete restored.note;
    if (Object.keys(restored).length) overrides[change.day] = restored;
    else delete overrides[change.day];
  }
  return { ...data, overrides, lastImport: null };
}

export const rowLabel = (row) =>
  row.type
    ? `${META[row.type].label}${row.type !== "off" ? ` · ${row.start}–${row.end}` : ""}`
    : "נדרשת בחירה";
