import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonth,
  cycleIndex,
  dayInfo,
  diffDays,
  initialData,
  nextShift,
  reminderPlan,
  resetOverride,
  shareText,
} from "../src/lib/schedule.js";
import { hebrewDate, holiday } from "../src/lib/hebrew.js";
const fixture = () => ({
  ...initialData(),
  configured: true,
  cycleStart: "2026-09-15",
});

test("16-day cycle repeats forwards and backwards without DST drift", () => {
  const data = fixture();
  for (let offset = -400; offset <= 400; offset++) {
    const day = addDays(data.cycleStart, offset);
    assert.equal(diffDays(day, data.cycleStart), offset);
    assert.equal(
      dayInfo(data, day).type,
      ["morning", "afternoon", "night", "off"][
        Math.floor((((offset % 16) + 16) % 16) / 4)
      ],
    );
  }
  assert.equal(cycleIndex("2026-09-14", data.cycleStart), 15);
});
test("daily overrides preserve the cycle and global hours", () => {
  const data = fixture();
  data.overrides["2026-09-24"] = { start: "23:00", end: "07:00" };
  assert.equal(dayInfo(data, "2026-09-24").hours, "23:00–07:00");
  assert.equal(dayInfo(data, "2026-09-24").overnight, true);
  assert.equal(dayInfo(data, "2026-09-25").hours, "22:00–06:00");
  assert.deepEqual(data.hours.night, ["22:00", "06:00"]);
});
test("taken leave retains original shift and reset preserves notes", () => {
  const data = fixture();
  data.overrides["2026-09-25"] = { type: "taken", note: "פרטי" };
  assert.equal(dayInfo(data, "2026-09-25").base, "night");
  assert.equal(dayInfo(data, "2026-09-25").work, false);
  data.overrides["2026-09-25"] = resetOverride(data.overrides["2026-09-25"]);
  assert.equal(dayInfo(data, "2026-09-25").type, "night");
  assert.equal(dayInfo(data, "2026-09-25").note, "פרטי");
  assert.equal(dayInfo(data, "2026-09-25").changed, false);
});
test("next shift includes today only when its start is in the future", () => {
  assert.equal(
    nextShift(fixture(), new Date("2026-09-22T13:00:00")).day,
    "2026-09-22",
  );
  assert.equal(
    nextShift(fixture(), new Date("2026-09-22T14:00:00")).day,
    "2026-09-23",
  );
});
test("share reflects actual hours and leave, with no personal notes or original shifts", () => {
  const data = fixture();
  data.overrides["2026-09-24"] = { start: "23:00", end: "07:00", note: "סוד" };
  data.overrides["2026-09-25"] = { type: "taken" };
  const text = shareText(data, "2026-09-24", "2026-09-25");
  assert.match(text, /23:00–07:00/);
  assert.match(text, /חופש שנלקח/);
  assert.doesNotMatch(text, /סוד|22:00/);
  assert.doesNotMatch(
    shareText(data, "2026-09-24", "2026-09-25", false),
    /23:00/,
  );
  assert.equal(shareText(data, "2026-09-25", "2026-09-24"), "");
});
test("reminders track custom starts, type changes, and cancellation for leave", () => {
  const data = fixture();
  data.reminder.on = true;
  data.overrides["2026-09-24"] = { start: "23:00", end: "07:00" };
  data.overrides["2026-09-25"] = { type: "taken" };
  const plan = reminderPlan(data, new Date("2026-09-22T12:00:00"));
  assert.equal(plan.find((p) => p.day === "2026-09-24").date.getHours(), 22);
  assert.equal(
    plan.some((p) => p.day === "2026-09-25"),
    false,
  );
  assert.equal(plan.length, 60);
  data.reminder.mode = "day";
  data.reminder.at = "20:30";
  const r = reminderPlan(data, new Date("2026-09-22T12:00:00")).find(
    (p) => p.day === "2026-09-24",
  );
  assert.equal(r.date.getDate(), 23);
  assert.equal(r.date.getHours(), 20);
  assert.equal(r.date.getMinutes(), 30);
  data.reminder.on = false;
  assert.deepEqual(reminderPlan(data), []);
});
test("calendar month shortcut clamps to last valid day", () => {
  assert.equal(addMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonth("2028-01-31", 1), "2028-02-29");
});
test("Hebrew dates and Israel holidays include eve, intermediate and shifted dates", () => {
  assert.match(hebrewDate("2026-09-22"), /תשרי/);
  assert.equal(holiday("2026-09-25"), "ערב סוכות");
  assert.equal(holiday("2026-09-26"), "סוכות");
  assert.equal(holiday("2026-09-27"), "חול המועד סוכות");
  assert.equal(holiday("2026-10-02"), "הושענא רבה");
  assert.equal(holiday("2026-10-03"), "שמחת תורה");
  assert.equal(holiday("2026-04-08"), "שביעי של פסח");
  assert.equal(holiday("2026-04-22"), "יום העצמאות");
  assert.equal(dayInfo(fixture(), "2026-09-26").type, "night");
});
