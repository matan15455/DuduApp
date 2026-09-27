import React, { useState } from "react";
import { KeyboardAvoidingView, TextInput, View } from "react-native";
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
  const [special, setSpecial] = useState(false);
  const done = (message) => {
    setMode("details");
    notify(message);
  };
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, direction: "ltr" }}
    >
      <Screen
        header={
          <Row
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
              gap: 6,
              width: "100%",
              minHeight: 88,
              flexShrink: 0,
              backgroundColor: theme.bg,
            }}
          >
            <Button
              title="חזור"
              onPress={() =>
                mode === "details" ? router.back() : setMode("details")
              }
              style={{ width: 64, flexShrink: 0, paddingHorizontal: 6 }}
            />
            <View style={{ flex: 1, minWidth: 0, overflow: "hidden", gap: 2 }}>
              <T
                size={19}
                weight="heavy"
                numberOfLines={2}
                adjustsFontSizeToFit
                style={{ textAlign: "center" }}
              >
                {longDate(day)}
              </T>
              {data.showHeb && (
                <T
                  muted
                  size={12}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ textAlign: "center" }}
                >
                  {hebrewDate(day)}
                </T>
              )}
            </View>
            <Button
              title="סגור"
              onPress={() => router.back()}
              style={{ width: 64, flexShrink: 0, paddingHorizontal: 6 }}
            />
          </Row>
        }
      >
        {mode !== "details" && (
          <T size={20} weight="heavy">
            {mode === "shift"
              ? "שנה משמרת"
              : mode === "hours"
                ? "שעות ליום הזה"
                : "הערה ליום"}
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
                  setSpecial(info.type === "special");
                  setMode("hours");
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
            {TYPES.map((type) => (
              <Card key={type} style={{ padding: 0 }}>
                <Button
                  shiftType={type}
                  icon={META[type].icon}
                  title={`${META[type].label}${data.hours[type] ? ` · ${data.hours[type].join("–")}` : ""}`}
                  selected={info.type === type}
                  onPress={() => {
                    if (type === "special") {
                      setSpecial(true);
                      setStart(info.start || "11:00");
                      setEnd(info.end || "19:00");
                      setMode("hours");
                      return;
                    }
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
              disabled={start === end}
              onPress={() => {
                editDay(day, (o) => ({
                  ...o,
                  ...(special ? { type: "special" } : {}),
                  start,
                  end,
                }));
                done("השעות נשמרו ליום הזה");
              }}
            />
          </>
        )}
        {mode === "note" && (
          <>
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
      </Screen>
    </KeyboardAvoidingView>
  );
}
