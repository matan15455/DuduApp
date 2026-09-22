import { HDate, HebrewCalendar } from "@hebcal/core";
import { iso, parse } from "./schedule.js";

const years = new Map();
const strip = (text) => text.replace(/[\u0591-\u05C7]/g, "");
export function hebrewDate(day) {
  return strip(new HDate(parse(day)).renderGematriya());
}
export function holiday(day) {
  const year = parse(day).getFullYear();
  if (!years.has(year)) {
    const map = new Map();
    const events = HebrewCalendar.calendar({
      year,
      il: true,
      candlelighting: false,
      noRoshChodesh: true,
      noMinorFast: true,
      noSpecialShabbat: true,
    });
    for (const event of events) {
      const name = event.getDesc();
      if (
        !/^(Erev (Rosh Hashana|Yom Kippur|Sukkot|Pesach|Shavuot)|Rosh Hashana|Yom Kippur|Sukkot|Shmini Atzeret|Simchat Torah|Chanukah|Purim$|Pesach|Shavuot|Yom HaZikaron|Yom HaAtzma.ut|Lag BaOmer|Tish.a B.Av)/.test(
          name,
        )
      )
        continue;
      let label = strip(event.render("he"));
      const names = {
        "Erev Sukkot": "ערב סוכות",
        "Erev Yom Kippur": "ערב יום כיפור",
        "Yom Kippur": "יום כיפור",
        "Yom HaZikaron": "יום הזיכרון",
        "Yom HaAtzma'ut": "יום העצמאות",
        "Lag BaOmer": "ל״ג בעומר",
      };
      label = names[name] || label;
      if (/Sukkot.*CH/.test(name)) label = "חול המועד סוכות";
      if (/Sukkot.*Hoshana/.test(name)) label = "הושענא רבה";
      if (/Sukkot I$/.test(name)) label = "סוכות";
      if (/Pesach.*CH/.test(name)) label = "חול המועד פסח";
      if (name === "Pesach I") label = "פסח";
      if (name === "Pesach VII") label = "שביעי של פסח";
      if (/Shmini Atzeret|Simchat Torah/.test(name)) label = "שמחת תורה";
      if (/Chanukah/.test(name))
        label = name.startsWith("Chanukah: 1 Candle") ? "ערב חנוכה" : "חנוכה";
      map.set(iso(event.getDate().greg()), label);
    }
    years.set(year, map);
  }
  return years.get(year).get(day) || "";
}
