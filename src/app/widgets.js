import React from "react";
import { View } from "react-native";
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
import DayRows from "../components/DayRows";
import { widgetsAvailable } from "../services/widgets";
export default function Widgets() {
  const { data, today, now } = useApp(),
    next = nextShift(data, now);
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
      <Section>קטן · המשמרת הבאה</Section>
      <Card style={{ width: 175, minHeight: 165, alignSelf: "flex-end" }}>
        <T muted size={13}>
          המשמרת הבאה
        </T>
        <T size={29} weight="heavy">
          {next ? META[next.type].label : "אין משמרת"}
        </T>
        {next && (
          <>
            <T muted>{relativeDay(next.day, today)}</T>
            <T size={24} style={s.numbers}>
              {next.start}
            </T>
            {next.customHours && (
              <T size={12} weight="bold">
                ◷ שעות חריגות
              </T>
            )}
          </>
        )}
      </Card>
      <Section>בינוני · היום, מחר ומחרתיים</Section>
      <Card>
        <Row>
          {[today, addDays(today, 1), addDays(today, 2)].map((day, index) => {
            const info = dayInfo(data, day);
            return (
              <View key={day} style={[s.grow, { gap: 6, minWidth: 0 }]}>
                <T muted size={13}>
                  {index === 2 ? "מחרתיים" : relativeDay(day, today)}
                </T>
                <T size={11} muted>
                  {shortDate(day)}
                </T>
                <T size={20} weight="heavy">
                  {META[info.type].label}
                </T>
                <T size={12} style={info.work ? s.numbers : undefined}>
                  {info.hours}
                </T>
                {info.customHours && (
                  <T size={11} weight="bold">
                    ◷ שעות חריגות
                  </T>
                )}
              </View>
            );
          })}
        </Row>
      </Card>
      <Section>גדול · הימים הקרובים</Section>
      <Card>
        <DayRows
          days={Array.from({ length: 7 }, (_, i) => addDays(today, i))}
        />
      </Card>
    </Screen>
  );
}
