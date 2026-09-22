import React, { useState } from "react";
import { Alert, Share, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useApp } from "../../state/AppProvider";
import { addDays, iso, parse, shareText } from "../../lib/schedule";
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
    [range, setRange] = useState("7"),
    [detail, setDetail] = useState(true),
    [from, setFrom] = useState(today),
    [to, setTo] = useState(addDays(today, 6));
  const date = parse(today);
  const first =
    range === "custom"
      ? from
      : range === "week"
        ? addDays(today, -date.getDay())
        : range === "month"
          ? today.slice(0, 7) + "-01"
          : today;
  const last =
    range === "custom"
      ? to
      : range === "week"
        ? addDays(first, 6)
        : range === "month"
          ? iso(new Date(date.getFullYear(), date.getMonth() + 1, 0))
          : addDays(today, 6);
  const text = shareText(data, first, last, detail);
  return (
    <Screen
      title="שיתוף המשמרות"
      subtitle="הטקסט נשלח לכל אפליקציה. אין צורך שמישהו יתקין משהו."
    >
      <Section>טווח</Section>
      <View style={s.wrap}>
        {[
          ["7", "7 הימים הקרובים"],
          ["week", "השבוע הנוכחי"],
          ["month", "החודש הנוכחי"],
          ["custom", "טווח ידני"],
        ].map(([key, label]) => (
          <Button
            key={key}
            title={label}
            selected={range === key}
            onPress={() => setRange(key)}
          />
        ))}
      </View>
      {range === "custom" && (
        <Card>
          <PickerField label="מתאריך" value={from} onChange={setFrom} />
          <PickerField label="עד תאריך" value={to} onChange={setTo} />
        </Card>
      )}
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
        <T selectable style={{ lineHeight: 29 }}>
          {text || "בחר תאריך סיום שאינו לפני תאריך ההתחלה, בטווח של עד שנה."}
        </T>
      </Card>
      <T size={13} muted>
        הערות אישיות והמשמרת המקורית אינן נכללות בשיתוף.
      </T>
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
    </Screen>
  );
}
