import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../state/AppProvider";
import {
  addDays,
  cycleIndex,
  dayInfo,
  longDate,
  META,
  nextShift,
  relativeDay,
  resetOverride,
  TYPES,
} from "../../lib/schedule";
import { hebrewDate } from "../../lib/hebrew";
import { Button, Card, Row, s, Screen, Section, T } from "../../components/ui";
import ShiftCard from "../../components/ShiftCard";
import DayRows from "../../components/DayRows";
export default function Today() {
  const { data, today, now, theme, editDay, notify } = useApp(),
    info = dayInfo(data, today),
    next = nextShift(data, now),
    index = cycleIndex(today, data.cycleStart);
  return (
    <Screen>
      <View style={{ gap: 3 }}>
        <Section>היום</Section>
        <T size={24} weight="bold">
          {longDate(today)}
        </T>
        {data.showHeb && (
          <T muted size={14}>
            {hebrewDate(today)}
          </T>
        )}
      </View>
      <ShiftCard info={info} hero>
        <Row style={{ marginTop: 4 }}>
          <Button
            title="ערוך את היום"
            primary
            style={s.grow}
            onPress={() =>
              router.push({ pathname: "/day", params: { date: today } })
            }
          />
          <Button
            title={info.type === "taken" ? "בטל חופש" : "קח חופש היום"}
            disabled={!info.work && info.type !== "taken"}
            style={s.grow}
            onPress={() => {
              editDay(today, (o) =>
                info.type === "taken"
                  ? resetOverride(o)
                  : { note: o.note, type: "taken" },
              );
              notify(
                info.type === "taken"
                  ? "היום הוחזר לפי הסבב"
                  : "היום סומן כחופש שנלקח",
              );
            }}
          />
        </Row>
      </ShiftCard>
      <Card>
        <Row>
          <View style={s.grow}>
            <Section>המשמרת הבאה</Section>
            <T size={20} weight="bold">
              {next
                ? `${relativeDay(next.day, today)} · ${META[next.type].label}`
                : "אין משמרת קרובה"}
            </T>
          </View>
          {next && (
            <T size={16} muted style={s.numbers}>
              {next.hours}
            </T>
          )}
        </Row>
      </Card>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Section>מקום בסבב</Section>
          <T weight="bold" size={14}>
            {META[info.base].short} · {(index % 4) + 1} מתוך 4
          </T>
        </Row>
        <Row style={{ gap: 4 }}>
          {Array.from({ length: 16 }, (_, i) => {
            const m = META[TYPES[Math.floor(i / 4)]];
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: theme.dark ? m.dark : m.color,
                  opacity: i === index ? 1 : 0.28,
                  borderWidth: i === index ? 2 : 0,
                  borderColor: theme.ink,
                }}
              />
            );
          })}
        </Row>
      </Card>
      <Card style={{ paddingBottom: 0 }}>
        <Section>הימים הקרובים</Section>
        <DayRows
          days={Array.from({ length: 7 }, (_, i) => addDays(today, i))}
        />
      </Card>
    </Screen>
  );
}
