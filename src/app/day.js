import React, { useState } from "react";
import { KeyboardAvoidingView, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../state/AppProvider";
import {
  dayInfo,
  longDate,
  META,
  parse,
  resetOverride,
  TYPES,
} from "../lib/schedule";
import { hebrewDate } from "../lib/hebrew";
import { Button, Card, PickerField, Row, Screen, T } from "../components/ui";
import ShiftCard from "../components/ShiftCard";
export default function Day() {
  const params = useLocalSearchParams(),
    { data, today, theme, editDay, notify } = useApp();
  const day =
    typeof params.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.date) &&
    !Number.isNaN(parse(params.date).getTime())
      ? params.date
      : today;
  const info = dayInfo(data, day),
    [mode, setMode] = useState("details"),
    [start, setStart] = useState(info.start),
    [end, setEnd] = useState(info.end),
    [note, setNote] = useState(info.note);
  const done = (message) => {
    setMode("details");
    notify(message);
  };
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, direction: "ltr" }}
    >
      <Screen style={{ paddingTop: 28 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <T size={23} weight="heavy">
            {mode === "details"
              ? longDate(day)
              : mode === "shift"
                ? "שנה משמרת"
                : mode === "hours"
                  ? "שעות ליום הזה"
                  : "הערה ליום"}
          </T>
          <Button
            title="סגור"
            onPress={() => router.back()}
            style={{ minHeight: 44 }}
          />
        </Row>
        {data.showHeb && (
          <T muted size={14}>
            {hebrewDate(day)}
          </T>
        )}
        {mode === "details" && (
          <>
            <ShiftCard info={info} tint />
            <Button title="שנה משמרת" onPress={() => setMode("shift")} />
            {info.work && (
              <Button
                title="שנה שעות ליום הזה"
                onPress={() => {
                  setStart(info.start);
                  setEnd(info.end);
                  setMode("hours");
                }}
              />
            )}
            {(info.work || info.type === "taken") && (
              <Button
                title={
                  info.type === "taken"
                    ? "בטל את החופש שנלקח"
                    : "סמן כחופש שנלקח"
                }
                onPress={() => {
                  editDay(day, (o) =>
                    info.type === "taken"
                      ? resetOverride(o)
                      : { note: o.note, type: "taken" },
                  );
                  done("היום עודכן");
                }}
              />
            )}
            <Button
              title={info.note ? "ערוך הערה" : "הוסף הערה"}
              onPress={() => {
                setNote(info.note);
                setMode("note");
              }}
            />
            {info.changed && (
              <Button
                primary
                title="החזר לפי הסבב"
                onPress={() => {
                  editDay(day, resetOverride);
                  done("היום הוחזר לפי הסבב. ההערה נשמרה.");
                }}
              />
            )}
          </>
        )}
        {mode === "shift" && (
          <>
            <T muted>השינוי חל רק על היום הזה. הסבב ממשיך כרגיל.</T>
            {TYPES.filter(
              (type) =>
                type !== "taken" ||
                info.base !== "off" ||
                info.work ||
                info.type === "taken",
            ).map((type) => (
              <Card key={type} style={{ padding: 0 }}>
                <Button
                  icon={META[type].icon}
                  title={`${META[type].label}${data.hours[type] ? ` · ${data.hours[type].join("–")}` : ""}`}
                  selected={info.type === type}
                  onPress={() => {
                    editDay(day, (o) => ({
                      note: o.note,
                      ...(type !== info.base ? { type } : {}),
                    }));
                    done("המשמרת עודכנה ליום הזה");
                  }}
                />
              </Card>
            ))}
          </>
        )}
        {mode === "hours" && (
          <>
            <T muted>
              שעות חריגות ל־{longDate(day)} בלבד. שעות {META[info.type].label}{" "}
              הרגילות לא ישתנו.
            </T>
            <Card>
              <PickerField
                mode="time"
                label="התחלה"
                value={start}
                onChange={setStart}
              />
              <PickerField
                mode="time"
                label="סיום"
                value={end}
                onChange={setEnd}
              />
            </Card>
            {end <= start && (
              <T muted size={14}>
                המשמרת מסתיימת ביום הבא.
              </T>
            )}
            <Button
              title="שמור שעות ליום הזה"
              primary
              onPress={() => {
                editDay(day, (o) => ({ ...o, start, end }));
                done("השעות נשמרו ליום הזה");
              }}
            />
          </>
        )}
        {mode === "note" && (
          <>
            <T muted>ההערה לא משנה את המשמרת ולא נכנסת לשיתוף.</T>
            <TextInput
              accessibilityLabel="הערה אישית ליום"
              multiline
              value={note}
              onChangeText={setNote}
              maxLength={2000}
              placeholder="מה חשוב לזכור?"
              placeholderTextColor={theme.muted}
              style={{
                minHeight: 160,
                padding: 16,
                backgroundColor: theme.soft,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 18,
                color: theme.ink,
                fontFamily: "Assistant_400Regular",
                fontSize: 18,
                textAlign: "right",
                writingDirection: "rtl",
                textAlignVertical: "top",
              }}
            />
            <Button
              title="שמור הערה"
              primary
              onPress={() => {
                editDay(day, (o) => ({ ...o, note: note.trim() }));
                done(note.trim() ? "ההערה נשמרה" : "ההערה הוסרה");
              }}
            />
          </>
        )}
        {mode !== "details" && (
          <Button title="ביטול" onPress={() => setMode("details")} />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
