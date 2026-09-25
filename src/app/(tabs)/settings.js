import React, { useState } from "react";
import { Alert, Linking, Switch, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../state/AppProvider";
import { META, resetOverride, TYPES } from "../../lib/schedule";
import { requestReminders } from "../../services/notifications";
import {
  Button,
  Card,
  Icon,
  PickerField,
  Row,
  s,
  Screen,
  Section,
  T,
} from "../../components/ui";
export default function Settings() {
  const { data, update, theme, notify } = useApp(),
    [busy, setBusy] = useState(false);
  const reminder = (patch) =>
    update((d) => ({ ...d, reminder: { ...d.reminder, ...patch } }));
  async function toggleReminders(on) {
    if (!on) {
      reminder({ on: false });
      return;
    }
    setBusy(true);
    try {
      if (await requestReminders()) reminder({ on: true });
      else
        Alert.alert(
          "נדרשת הרשאה להתראות",
          "אפשר לאפשר התראות בהגדרות ה־iPhone.",
          [
            { text: "ביטול", style: "cancel" },
            { text: "פתח הגדרות", onPress: () => Linking.openSettings() },
          ],
        );
    } catch {
      Alert.alert("לא ניתן להפעיל תזכורות", "נסה שוב בעוד רגע.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="הגדרות">
      <Section>הסבב שלי</Section>
      <Card>
        {TYPES.slice(0, 4).map((type) => (
          <Row key={type}>
            <Icon type={type} />
            <T weight="bold" style={s.grow}>
              {META[type].label}
            </T>
            <T size={19} muted>
              4 ימים
            </T>
          </Row>
        ))}
        <PickerField
          label="תחילת הסבב"
          value={data.cycleStart}
          onChange={(cycleStart) => update({ cycleStart })}
        />
      </Card>
      <Section>שעות ברירת מחדל</Section>
      {TYPES.slice(0, 3).map((type) => (
        <Card key={type}>
          <Row>
            <Icon type={type} />
            <T weight="bold">{META[type].label}</T>
          </Row>
          <Row>
            {["התחלה", "סיום"].map((label, index) => (
              <PickerField
                key={label}
                label={label}
                mode="time"
                value={data.hours[type][index]}
                onChange={(value) =>
                  update((d) => ({
                    ...d,
                    hours: {
                      ...d.hours,
                      [type]: d.hours[type].map((h, i) =>
                        i === index ? value : h,
                      ),
                    },
                  }))
                }
              />
            ))}
          </Row>
        </Card>
      ))}
      <Section>תזכורות</Section>
      <Card>
        <Row>
          <T weight="bold" style={s.grow}>
            תזכורת לפני משמרת
          </T>
          <Switch
            accessibilityLabel="תזכורת לפני משמרת"
            value={data.reminder.on}
            disabled={busy}
            onValueChange={toggleReminders}
            trackColor={{ true: theme.accent }}
          />
        </Row>
        {data.reminder.on && (
          <>
            <Row>
              <Button
                title="לפני המשמרת"
                selected={data.reminder.mode === "before"}
                onPress={() => reminder({ mode: "before" })}
                style={s.grow}
              />
              <Button
                title="יום לפני, בשעה"
                selected={data.reminder.mode === "day"}
                onPress={() => reminder({ mode: "day" })}
                style={s.grow}
              />
            </Row>
            {data.reminder.mode === "before" ? (
              <View style={s.wrap}>
                {[
                  [15, "15 דקות"],
                  [30, "30 דקות"],
                  [60, "שעה"],
                  [120, "שעתיים"],
                  [180, "3 שעות"],
                  [480, "8 שעות"],
                ].map(([lead, label]) => (
                  <Button
                    key={lead}
                    title={label}
                    selected={data.reminder.lead === lead}
                    onPress={() => reminder({ lead })}
                  />
                ))}
              </View>
            ) : (
              <PickerField
                mode="time"
                label="יום לפני, בשעה"
                value={data.reminder.at}
                onChange={(at) => reminder({ at })}
              />
            )}
          </>
        )}
      </Card>
      <Section>תצוגה</Section>
      <Card>
        <Row>
          <T weight="bold" style={s.grow}>
            תאריך עברי וחגים
          </T>
          <Switch
            accessibilityLabel="הצגת תאריך עברי וחגים"
            value={data.showHeb}
            onValueChange={(showHeb) => update({ showHeb })}
            trackColor={{ true: theme.accent }}
          />
        </Row>
        <T weight="bold">מצב תצוגה</T>
        <Row>
          {[
            ["light", "בהיר"],
            ["dark", "כהה"],
            ["system", "לפי המכשיר"],
          ].map(([value, label]) => (
            <Button
              key={value}
              title={label}
              selected={data.theme === value}
              onPress={() => update({ theme: value })}
              style={s.grow}
            />
          ))}
        </Row>
        <Button
          title="ווידג׳טים למסך הבית  ‹"
          onPress={() => router.push("/widgets")}
        />
      </Card>
      <Button
        title="אפס את כל השינויים הידניים"
        onPress={() =>
          Alert.alert(
            "להחזיר את כל הימים לסבב?",
            "שינויים במשמרות ובשעות יוסרו. ההערות האישיות יישמרו.",
            [
              { text: "ביטול", style: "cancel" },
              {
                text: "אפס שינויים",
                style: "destructive",
                onPress: () => {
                  update((d) => ({
                    ...d,
                    overrides: Object.fromEntries(
                      Object.entries(d.overrides).map(([day, o]) => [
                        day,
                        resetOverride(o),
                      ]),
                    ),
                  }));
                  notify("כל הימים הוחזרו לפי הסבב");
                },
              },
            ],
          )
        }
      />
    </Screen>
  );
}
