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
      </View>
      <Card>
        <T size={21} weight="bold">
          מתחילים בסבב שלך
        </T>
        <PickerField
          label="תחילת הסבב · בוקר 1 מתוך 4"
          value={start}
          onChange={setStart}
        />
        <Row style={{ justifyContent: "space-between", marginTop: 8, gap: 6 }}>
          {TYPES.slice(0, 4).map((type) => (
            <View
              key={type}
              style={{
                flex: 1,
                minWidth: 0,
                alignItems: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: META[type].vividBg,
              }}
            >
              <Icon type={type} />
              <T
                size={14}
                weight="bold"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ color: META[type].vividInk }}
              >
                {META[type].short}
              </T>
              <T size={12} style={{ color: META[type].vividInk }}>
                4 ימים
              </T>
            </View>
          ))}
        </Row>
      </Card>
      <Button
        title="הצג את המשמרות שלי"
        primary
        onPress={() => {
          update({ cycleStart: start, configured: true });
          router.replace("/");
        }}
      />
    </Screen>
  );
}
