import React from "react";
import { View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import {
  addDays,
  dayInfo,
  META,
  nextShift,
  relativeDay,
  shortDate,
} from "../lib/schedule";
import { Button, Card, Row, s, Screen, Section, T } from "../components/ui";
import { holiday } from "../lib/hebrew";
import { widgetsAvailable } from "../services/widgets";
export default function Widgets() {
  const { data, today, now } = useApp(),
    next = nextShift(data, now),
    nextMeta = next ? META[next.type] : null;
  return (
    <Screen title="ווידג׳טים">
      <Button title="› חזרה להגדרות" onPress={() => router.back()} />
      <Card>
        {!widgetsAvailable() ? (
          <>
            <T weight="bold">תצוגה מקדימה בלבד</T>
            <T>
              הגרסה הפתוחה כרגע אינה תומכת בווידג׳טים למסך הבית. אפשר לצפות
              בדוגמאות כאן; להוספת ווידג׳ט נדרשת התקנה של גרסת האפליקציה הכוללת
              תמיכה בווידג׳טים.
            </T>
          </>
        ) : (
          <>
            <T weight="bold">איך מוסיפים?</T>
            <T>
              לחץ לחיצה ארוכה על מסך הבית ב־iPhone, בחר ״עריכה״ ואז ״הוסף
              ווידג׳ט״. חפש ״משמרות״ ובחר את הגודל שמתאים לך.
            </T>
          </>
        )}
      </Card>
      <T muted size={13}>
        לתצוגת הרקעים בצבעים מלאים בחר מראה בהיר או כהה בהתאמה האישית של מסך
        הבית. במצב שקוף או עם גוון, iOS עשוי לשנות את הרקעים; סמלי המשמרות
        נשארים לזיהוי.
      </T>
      <Section>קטן · המשמרת הבאה</Section>
      <Card
        style={{
          width: 175,
          minHeight: 165,
          alignSelf: "flex-end",
          backgroundColor: nextMeta?.vividBg,
          borderColor: nextMeta?.vividBg,
        }}
      >
        <T size={13} style={{ color: nextMeta?.vividInk }}>
          המשמרת הבאה
        </T>
        {nextMeta && (
          <Feather
            name={nextMeta.icon}
            size={26}
            color={nextMeta.vividInk}
            style={{ alignSelf: "flex-end" }}
          />
        )}
        <T size={29} weight="heavy" style={{ color: nextMeta?.vividInk }}>
          {next ? META[next.type].label : "אין משמרת"}
        </T>
        {next && (
          <>
            <T style={{ color: nextMeta.vividInk }}>
              {relativeDay(next.day, today)}
            </T>
            <T size={24} style={[s.numbers, { color: nextMeta.vividInk }]}>
              {next.start}
            </T>
            {next.customHours && (
              <T size={12} weight="bold" style={{ color: nextMeta.vividInk }}>
                ◷ שעות חריגות
              </T>
            )}
          </>
        )}
      </Card>
      <Section>בינוני · היום, מחר ומחרתיים</Section>
      <Card style={{ padding: 8 }}>
        <Row style={{ gap: 6, alignItems: "stretch" }}>
          {[today, addDays(today, 1), addDays(today, 2)].map((day, index) => {
            const info = dayInfo(data, day),
              meta = META[info.type];
            return (
              <View
                key={day}
                style={[
                  s.grow,
                  {
                    gap: 6,
                    minWidth: 0,
                    padding: 6,
                    borderRadius: 12,
                    backgroundColor: meta.vividBg,
                  },
                ]}
              >
                <T size={13} style={{ color: meta.vividInk }}>
                  {index === 2 ? "מחרתיים" : relativeDay(day, today)}
                </T>
                <T size={11} style={{ color: meta.vividInk }}>
                  {shortDate(day)}
                </T>
                <Feather
                  name={meta.icon}
                  size={18}
                  color={meta.vividInk}
                  style={{ alignSelf: "flex-end" }}
                />
                <T
                  size={20}
                  weight="heavy"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ color: meta.vividInk }}
                >
                  {META[info.type].label}
                </T>
                <T
                  size={12}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    info.work ? s.numbers : undefined,
                    { color: meta.vividInk },
                  ]}
                >
                  {info.hours}
                </T>
                {info.customHours && (
                  <T size={11} weight="bold" style={{ color: meta.vividInk }}>
                    ◷ שעות חריגות
                  </T>
                )}
              </View>
            );
          })}
        </Row>
      </Card>
      <Section>גדול · הימים הקרובים</Section>
      <Card style={{ padding: 8 }}>
        {Array.from({ length: 7 }, (_, index) => {
          const day = addDays(today, index),
            info = dayInfo(data, day),
            meta = META[info.type],
            name = data.showHeb ? holiday(day) : "";
          return (
            <Row
              key={day}
              style={{
                backgroundColor: meta.vividBg,
                borderRadius: 9,
                padding: 8,
                gap: 8,
              }}
            >
              <Feather name={meta.icon} size={18} color={meta.vividInk} />
              <View style={{ width: 60 }}>
                <T size={13} style={{ color: meta.vividInk }}>
                  {index === 2 ? "מחרתיים" : relativeDay(day, today)}
                </T>
                <T size={11} style={{ color: meta.vividInk }}>
                  {shortDate(day)}
                </T>
              </View>
              <View style={[s.grow, { minWidth: 0 }]}>
                <T size={14} weight="bold" style={{ color: meta.vividInk }}>
                  {meta.label}
                </T>
                {!!name && (
                  <T
                    size={10}
                    numberOfLines={1}
                    style={{ color: meta.vividInk }}
                  >
                    {name}
                  </T>
                )}
              </View>
              <View>
                <T size={12} style={[s.numbers, { color: meta.vividInk }]}>
                  {info.work ? info.hours : "—"}
                </T>
                {info.customHours && (
                  <T size={10} weight="bold" style={{ color: meta.vividInk }}>
                    ◷ שעות חריגות
                  </T>
                )}
              </View>
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
