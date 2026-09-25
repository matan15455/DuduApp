import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../state/AppProvider";
import { addDays, addMonth, dayInfo, longDate, META } from "../../lib/schedule";
import { hebrewDate } from "../../lib/hebrew";
import { Button, Card, PickerField, s, Screen, T } from "../../components/ui";
import ShiftCard from "../../components/ShiftCard";
export default function Check() {
  const { data, today } = useApp(),
    [day, setDay] = useState(addDays(today, 1)),
    info = dayInfo(data, day);
  return (
    <Screen title="האם אני פנוי">
      <Card>
        <PickerField label="תאריך" value={day} onChange={setDay} />
      </Card>
      <View style={s.wrap}>
        {[
          ["מחר", addDays(today, 1)],
          ["בעוד שבוע", addDays(today, 7)],
          ["בעוד חודש", addMonth(today, 1)],
        ].map(([label, value]) => (
          <Button
            key={label}
            title={label}
            selected={day === value}
            onPress={() => setDay(value)}
          />
        ))}
      </View>
      <T size={33} weight="heavy" style={{ marginTop: 10 }}>
        {info.work ? "יש לך משמרת" : "אתה פנוי"}
      </T>
      <ShiftCard info={info} tint>
        <T size={15} style={{ color: META[info.type].vividInk }}>
          {longDate(day)}
          {data.showHeb ? ` · ${hebrewDate(day)}` : ""}
        </T>
        <Button
          title="פתח את פרטי היום"
          onPress={() =>
            router.push({ pathname: "/day", params: { date: day } })
          }
        />
      </ShiftCard>
    </Screen>
  );
}
