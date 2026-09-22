/** @typedef {'morning'|'afternoon'|'night'|'off'|'taken'} ShiftType */
/** @typedef {{type?: ShiftType, start?: string, end?: string, note?: string}} Override */
/** @typedef {{version: number, configured: boolean, cycleStart: string, hours: Record<string, string[]>, overrides: Record<string, Override>, reminder: {on: boolean, mode: string, lead: number, at: string}, showHeb: boolean, theme: string}} AppData */

export const TYPES = /** @type {ShiftType[]} */ ([
  "morning",
  "afternoon",
  "night",
  "off",
]);
export const META = {
  morning: {
    label: "בוקר",
    short: "בוקר",
    icon: "sun",
    color: "#B07A15",
    bg: "#FBF0D8",
    dark: "#E8B35A",
    darkBg: "#2E2718",
  },
  afternoon: {
    label: "צהריים",
    short: "צהריים",
    icon: "sunset",
    color: "#C2562F",
    bg: "#FBE5DA",
    dark: "#EE8A62",
    darkBg: "#31201A",
  },
  night: {
    label: "לילה",
    short: "לילה",
    icon: "moon",
    color: "#4351A8",
    bg: "#E4E6F7",
    dark: "#92A0EE",
    darkBg: "#1E2237",
  },
  off: {
    label: "חופש",
    short: "חופש",
    icon: "home",
    color: "#3E7D5E",
    bg: "#E2F0E7",
    dark: "#74C29A",
    darkBg: "#182720",
  },
};
export const DOW = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const iso = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const parse = (day) => new Date(`${day}T12:00:00`);
export function addDays(day, count) {
  const d = parse(day);
  d.setDate(d.getDate() + count);
  return iso(d);
}
export function addMonth(day, count) {
  const d = parse(day);
  const n = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + count);
  d.setDate(
    Math.min(n, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()),
  );
  return iso(d);
}
export function diffDays(a, b) {
  const x = parse(a),
    y = parse(b);
  return (
    (Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) -
      Date.UTC(y.getFullYear(), y.getMonth(), y.getDate())) /
    86400000
  );
}
export const shortDate = (day) =>
  `${parse(day).getDate()}.${parse(day).getMonth() + 1}`;
export const longDate = (day) =>
  new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parse(day));
export const relativeDay = (day, today = iso()) =>
  day === today
    ? "היום"
    : day === addDays(today, 1)
      ? "מחר"
      : `יום ${DOW[parse(day).getDay()]}`;
/** @returns {AppData} */
export function initialData() {
  return {
    version: 1,
    configured: false,
    cycleStart: iso(),
    hours: {
      morning: ["06:00", "14:00"],
      afternoon: ["14:00", "22:00"],
      night: ["22:00", "06:00"],
    },
    overrides: {},
    reminder: { on: false, mode: "before", lead: 60, at: "20:00" },
    showHeb: true,
    theme: "system",
  };
}
export const cycleIndex = (day, start) =>
  ((diffDays(day, start) % 16) + 16) % 16;
/** @param {AppData} data */
export function dayInfo(data, day) {
  const index = cycleIndex(day, data.cycleStart),
    base = TYPES[Math.floor(index / 4)];
  const override = data.overrides[day] || {},
    // Keep previously saved leave days compatible with the unified off type.
    type = override.type === "taken" ? "off" : override.type || base;
  const work = ["morning", "afternoon", "night"].includes(type),
    defaults = data.hours[type];
  const start = work ? override.start || defaults[0] : "",
    end = work ? override.end || defaults[1] : "";
  const customHours =
    work &&
    !!(override.start || override.end) &&
    (start !== defaults[0] || end !== defaults[1]);
  return {
    day,
    index,
    base,
    type,
    work,
    start,
    end,
    hours: work ? `${start}–${end}` : "ללא משמרת",
    note: override.note || "",
    customHours,
    typeChanged: type !== base,
    changed: !!(override.type || override.start || override.end),
    overnight: work && end <= start,
  };
}
export function shiftStart(info) {
  return new Date(`${info.day}T${info.start}:00`);
}
export function nextShift(data, now = new Date()) {
  for (let n = 0; n < 400; n++) {
    const info = dayInfo(data, addDays(iso(now), n));
    if (info.work && shiftStart(info) > now) return info;
  }
  return null;
}
export function resetOverride(override = {}) {
  return override.note ? { note: override.note } : {};
}
export function rangeDays(from, to) {
  const count = diffDays(to, from);
  if (!Number.isFinite(count) || count < 0 || count > 365) return [];
  return Array.from({ length: count + 1 }, (_, i) => addDays(from, i));
}
export function shareText(data, from, to, detailed = false) {
  const days = rangeDays(from, to);
  if (!days.length) return "";
  return (
    `המשמרות שלי: ${shortDate(from)}–${shortDate(to)}\n\n` +
    days
      .map((day) => {
        const i = dayInfo(data, day);
        return `${DOW[parse(day).getDay()]} ${shortDate(day)} — ${META[i.type].label}${detailed && i.work ? ` ${i.hours}${i.overnight ? ` (סיום ב־${shortDate(addDays(day, 1))})` : ""}` : ""}`;
      })
      .join("\n")
  );
}
export function reminderPlan(data, now = new Date()) {
  if (!data.reminder.on || !data.configured) return [];
  const result = [];
  for (let n = 0; n < 100 && result.length < 60; n++) {
    const info = dayInfo(data, addDays(iso(now), n));
    if (!info.work) continue;
    const date =
      data.reminder.mode === "day"
        ? new Date(`${addDays(info.day, -1)}T${data.reminder.at}:00`)
        : new Date(shiftStart(info).getTime() - data.reminder.lead * 60000);
    if (date > now)
      result.push({
        day: info.day,
        date,
        title: `משמרת ${META[info.type].label}`,
        body: `${longDate(info.day)} · ${info.hours}${info.overnight ? ` · סיום ב־${shortDate(addDays(info.day, 1))}` : ""}`,
      });
  }
  return result;
}
