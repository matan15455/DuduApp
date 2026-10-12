import { dayInfo, iso, parse, rangeDays } from "./schedule.js";

// Amounts are in agorot. These are the owner's payroll rules, not tax/net pay rules.
export const FIXED_PAY = [
  ["משכורת בסיסית", 1593010],
  ["תוספת אתרית", 238952],
  ["מקדמת פרמיה", 366773],
  ["תוספת אחמ״ש", 146557],
  ["תוספת טכנאים א׳", 50000],
  ["אחזקת רכב", 137500],
  ["אחזקת טלפון", 6000],
];
export const RATE_DAY = 81421;
export const RATE_HOUR = 10178;
const premiums = [
  ["afternoonWeek", "משמרת ב׳ חול · 25%", RATE_DAY * 0.25],
  ["nightWeek", "משמרת ג׳ חול · 56.3%", RATE_DAY * 0.563],
  ["morningWeekend", "משמרת א׳ שבת · 100%", RATE_DAY],
  ["afternoonWeekend", "משמרת ב׳ שבת · 125%", RATE_DAY * 1.25],
  ["nightWeekend", "משמרת ג׳ שבת · 150%", RATE_DAY * 1.5],
];
const overtime = [
  ["ot125", "שעות נוספות · 125%", RATE_HOUR * 1.25],
  ["ot150", "שעות נוספות · 150%", RATE_HOUR * 1.5],
  ["ot200", "שעות נוספות · 200%", RATE_HOUR * 2],
  ["compensation", "פיצוי משמרת · 400%", RATE_HOUR * 4],
];
export function payrollPeriod(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Invalid payroll month");
  const date = parse(`${month}-01`);
  return {
    from: iso(new Date(date.getFullYear(), date.getMonth() - 1, 26, 12)),
    to: `${month}-25`,
  };
}
const duration = (start, end) => {
  const minutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  return (minutes(end) - minutes(start) + 1440) % 1440;
};

export function estimateSalary(data, month) {
  const period = payrollPeriod(month);
  const counts = Object.fromEntries(
    [...premiums, ...overtime].map(([key]) => [key, 0]),
  );
  let workedDays = 0,
    vacationDays = 0;
  const unresolved = [],
    estimatedDays = [];
  const add = (key, count = 1) => {
    counts[key] += count;
  };
  for (const day of rangeDays(period.from, period.to)) {
    const info = dayInfo(data, day);
    if (!info.work) {
      if (info.paidLeave) vacationDays++;
      continue;
    }
    workedDays++;
    const dow = parse(day).getDay(),
      weekend = dow >= 5;
    const hours = duration(info.start, info.end) / 60;
    if (!Number.isFinite(hours) || hours <= 0) {
      unresolved.push({ day, reason: "יש להגדיר שעות למשמרת" });
      continue;
    }
    const specialDouble = info.start === "11:00" && info.end === "23:00";
    const double =
      ["morningAfternoon", "afternoonNight"].includes(info.type) ||
      (info.type === "special" && specialDouble);
    if (double && hours === 12) {
      const night = info.type === "afternoonNight";
      if (!weekend) {
        add(night ? "nightWeek" : "afternoonWeek");
        add("ot125", 2);
        add("ot150", 2);
      } else {
        add(
          dow === 5
            ? night
              ? "nightWeekend"
              : "afternoonWeekend"
            : night
              ? "afternoonWeekend"
              : "morningWeekend",
        );
        add("ot200", 4);
        add("compensation");
      }
    } else if (info.type === "special" || info.customHours || double) {
      estimatedDays.push({ day, isEstimatedCustomShift: true });
      const start =
        Number(info.start.slice(0, 2)) + Number(info.start.slice(3)) / 60;
      const end = start + hours;
      const night = end > 23 || (start < 6 && end <= 15);
      if (dow === 6)
        add(end > 15 || night ? "afternoonWeekend" : "morningWeekend");
      else if (dow === 5) {
        if (hours <= 8) add("ot125", Math.max(0, end - Math.max(start, 15)));
        else add(night ? "nightWeekend" : "afternoonWeekend");
      } else if (night) add("nightWeek");
      else if (end > 15) add("afternoonWeek");
      const extra = Math.max(0, hours - 8);
      if (weekend) {
        add("ot200", extra);
        if (hours >= 12) add("compensation");
      } else {
        add("ot125", Math.min(extra, 2));
        add("ot150", Math.max(0, extra - 2));
      }
    } else if (info.type === "morning") {
      if (dow === 6) add("morningWeekend");
    } else if (info.type === "afternoon")
      add(weekend ? "afternoonWeekend" : "afternoonWeek");
    else if (info.type === "night") add(weekend ? "nightWeekend" : "nightWeek");
  }
  const lines = (definitions) =>
    definitions.map(([key, label, rate]) => ({
      key,
      label,
      count: counts[key],
      amount: Math.round(counts[key] * Number(rate)),
    }));
  const shiftLines = lines(premiums),
    overtimeLines = lines(overtime);
  const fixed = FIXED_PAY.reduce(
    (total, [, value]) => total + Number(value),
    0,
  );
  const shiftPay = shiftLines.reduce((total, line) => total + line.amount, 0);
  const overtimePay = overtimeLines.reduce(
    (total, line) => total + line.amount,
    0,
  );
  const travel = workedDays * 12100,
    waiting = workedDays * 5089;
  const vacation = vacationDays * 37300,
    imputed = 84700;
  const seasonal = month.endsWith("-08") ? 915981 : 0;
  const adjustment = Number.isSafeInteger(data.salaryAdjustments?.[month])
    ? data.salaryAdjustments[month]
    : 0;
  return {
    month,
    ...period,
    workedDays,
    vacationDays,
    unresolved,
    estimatedDays,
    fixed,
    shiftLines,
    overtimeLines,
    shiftPay,
    overtimePay,
    travel,
    waiting,
    vacation,
    imputed,
    seasonal,
    adjustment,
    total:
      fixed +
      shiftPay +
      overtimePay +
      travel +
      waiting +
      vacation +
      imputed +
      seasonal +
      adjustment,
  };
}
export const money = (cents) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
  }).format(cents / 100);
