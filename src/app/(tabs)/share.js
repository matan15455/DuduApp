import React, { useState } from "react";
import { Alert, Share, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useApp } from "../../state/AppProvider";
import {
  addDays,
  dayInfo,
  META,
  rangeDays,
  shareText,
} from "../../lib/schedule";
import {
  Button,
  Card,
  PickerField,
  Row,
  s,
  Screen,
  Section,
  T,
} from "../../components/ui";
export default function ShareScreen() {
  const { data, today, notify } = useApp(),
    [detail, setDetail] = useState(false),
    [from, setFrom] = useState(today),
    [to, setTo] = useState(addDays(today, 6));
  const text = shareText(data, from, to, detail);
  const days = rangeDays(from, to);
  const previewLines = text.split("\n");
  return (
    <Screen
      footer={
        <Row>
          <Button
            title="שתף"
            icon="share"
            primary
            disabled={!text}
            style={s.grow}
            onPress={async () => {
              try {
                await Share.share({ message: text });
              } catch {
                Alert.alert("השיתוף לא הושלם", "נסה שוב.");
              }
            }}
          />
          <Button
            title="העתק ללוח"
            icon="copy"
            disabled={!text}
            style={s.grow}
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(text);
                notify("המשמרות הועתקו ללוח");
              } catch {
                Alert.alert("ההעתקה נכשלה", "נסה שוב.");
              }
            }}
          />
        </Row>
      }
      title="שיתוף המשמרות"
    >
      <Section>טווח</Section>
      <Card>
        <PickerField label="מתאריך" value={from} onChange={setFrom} />
        <PickerField label="עד תאריך" value={to} onChange={setTo} />
      </Card>
      <Section>רמת פירוט</Section>
      <Row>
        <Button
          title="מפורט · עם שעות"
          selected={detail}
          onPress={() => setDetail(true)}
          style={s.grow}
        />
        <Button
          title="קצר"
          selected={!detail}
          onPress={() => setDetail(false)}
          style={s.grow}
        />
      </Row>
      <Section>תצוגה מקדימה</Section>
      <Card>
        {text ? (
          <>
            <T selectable weight="bold">
              {previewLines[0]}
            </T>
            {days.map((day, index) => {
              const meta = META[dayInfo(data, day).type];
              return (
                <View
                  key={day}
                  style={{
                    backgroundColor: meta.vividBg,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <T
                    selectable
                    style={{ color: meta.vividInk, lineHeight: 29 }}
                  >
                    {previewLines[index + 2]}
                  </T>
                </View>
              );
            })}
          </>
        ) : (
          <T>בחר תאריך סיום שאינו לפני תאריך ההתחלה, בטווח של עד שנה.</T>
        )}
      </Card>
    </Screen>
  );
}
