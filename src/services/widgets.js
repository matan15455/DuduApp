import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import {
  addDays,
  dayInfo,
  iso,
  META,
  nextShift,
  relativeDay,
  shortDate,
  shiftStart,
} from "../lib/schedule";
import { holiday } from "../lib/hebrew";

export function widgetsAvailable() {
  return (
    Platform.OS === "ios" && requireOptionalNativeModule("ExpoWidgets") !== null
  );
}

export function widgetProps(data, now) {
  const today = iso(now),
    next = nextShift(data, now);
  return {
    theme: data.theme,
    next: next
      ? {
          label: META[next.type].label,
          fill: META[next.type].vividBg,
          ink: META[next.type].vividInk,
          symbol: META[next.type].symbol,
          when: `${relativeDay(next.day, today)} · ${shortDate(next.day)}`,
          start: next.start,
          customHours: next.customHours,
        }
      : null,
    rows: Array.from({ length: 7 }, (_, index) => {
      const day = addDays(today, index),
        info = dayInfo(data, day);
      return {
        day,
        date: shortDate(day),
        customHours: info.customHours,
        label: META[info.type].label,
        fill: META[info.type].vividBg,
        ink: META[info.type].vividInk,
        symbol: META[info.type].symbol,
        when: index === 2 ? "מחרתיים" : relativeDay(day, today),
        hours: info.work ? info.hours : "—",
        holiday: data.showHeb ? holiday(day) : "",
      };
    }),
  };
}
export function syncWidgets(data) {
  if (!data.configured || !widgetsAvailable()) return;
  // Importing this module creates a native widget immediately. Keep it behind
  // the capability check, including when reached through the background task.
  const ShiftsWidget = require("../widgets/ShiftsWidget").default;
  const now = new Date(),
    moments = [now];
  // Midnight updates today's rows; shift-start updates the next-shift card.
  for (let n = 0; n < 40; n++) {
    const day = addDays(iso(now), n),
      midnight = new Date(`${day}T00:00:00`),
      info = dayInfo(data, day);
    if (midnight > now) moments.push(midnight);
    if (info.work && shiftStart(info) > now) moments.push(shiftStart(info));
  }
  moments.sort((a, b) => a.getTime() - b.getTime());
  ShiftsWidget.updateTimeline([
    ...moments.map((date) => ({ date, props: widgetProps(data, date) })),
    {
      date: new Date(`${addDays(iso(now), 40)}T00:00:00`),
      props: { theme: data.theme, expired: true },
    },
  ]);
}
