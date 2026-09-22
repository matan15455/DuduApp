import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import {
  Button,
  Card,
  Icon,
  PickerField,
  Row,
  Screen,
  T,
} from "../components/ui";
import { META, TYPES } from "../lib/schedule";
export default function Onboarding() {
  const { data, update, theme } = useApp(),
    [start, setStart] = useState(data.cycleStart);
  return (
    <Screen style={{ paddingTop: 40 }}>
      <View style={{ alignItems: "flex-end", gap: 16 }}>
        <View
          style={{
            backgroundColor: theme.accentSoft,
            borderRadius: 24,
            padding: 20,
          }}
        >
          <Icon type="morning" size={38} />
        </View>
        <T size={38} weight="heavy">
          המשמרות שלך.{"\n"}פשוט, במקום אחד.
        </T>
        <T muted size={18}>
          מה עובדים היום, מתי המשמרת הבאה ומתי יש זמן לעצמך.
        </T>
      </View>
      <Card>
        <T size={21} weight="bold">
          מתחילים בסבב שלך
        </T>
        <T muted>
          בחר את התאריך של יום הבוקר הראשון בסבב. אפשר לבחור גם תאריך בעבר.
        </T>
        <PickerField
          label="תחילת הסבב · בוקר 1 מתוך 4"
          value={start}
          onChange={setStart}
        />
        <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
          {TYPES.slice(0, 4).map((type) => (
            <View key={type} style={{ alignItems: "center", gap: 6 }}>
              <Icon type={type} />
              <T size={14} weight="bold">
                {META[type].short}
              </T>
              <T size={12} muted>
                4 ימים
              </T>
            </View>
          ))}
        </Row>
      </Card>
      <T muted size={14}>
        16 ימים שחוזרים על עצמם. כל שאר התאריכים יחושבו אוטומטית, קדימה ואחורה.
      </T>
      <Button
        title="הצג את המשמרות שלי"
        primary
        onPress={() => {
          update({ cycleStart: start, configured: true });
          router.replace("/");
        }}
      />
      <T size={13} muted style={{ textAlign: "center" }}>
        המידע שלך נשמר במכשיר, ללא צורך בחשבון.
      </T>
    </Screen>
  );
}
