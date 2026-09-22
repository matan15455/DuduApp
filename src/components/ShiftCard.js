import React from "react";
import { View } from "react-native";
import { useApp } from "../state/AppProvider";
import { addDays, META, shortDate } from "../lib/schedule";
import { holiday } from "../lib/hebrew";
import { Card, Icon, Row, s, T } from "./ui";
export default function ShiftCard({
  info,
  children = undefined,
  hero = false,
  tint = false,
}) {
  const { theme, data } = useApp(),
    meta = META[info.type],
    name = data.showHeb ? holiday(info.day) : "";
  const badges = [
    info.typeChanged && "שונה מהסבב",
    info.customHours && "שעות חריגות",
    name,
  ].filter(Boolean);
  return (
    <Card
      style={{
        borderRadius: hero ? 28 : 22,
        padding: hero ? 22 : 18,
        ...(tint
          ? { backgroundColor: theme.dark ? meta.darkBg : meta.bg }
          : {}),
      }}
    >
      <Row>
        <Icon type={info.type} size={28} box />
        <View style={s.grow}>
          <T size={hero ? 36 : 29} weight="heavy">
            {meta.label}
          </T>
          <T size={20} muted style={info.work ? s.numbers : undefined}>
            {info.hours}
          </T>
        </View>
      </Row>
      {!!badges.length && (
        <View style={s.wrap}>
          {badges.map((b) => (
            <View
              key={b}
              style={{
                backgroundColor: theme.accentSoft,
                borderRadius: 20,
                paddingHorizontal: 11,
                paddingVertical: 5,
              }}
            >
              <T size={13} weight="bold" style={{ color: theme.accent }}>
                {b}
              </T>
            </View>
          ))}
        </View>
      )}
      {info.typeChanged && (
        <T size={14} muted>
          לפי הסבב: {META[info.base].label}
          {data.hours[info.base] ? ` · ${data.hours[info.base].join("–")}` : ""}
        </T>
      )}
      {info.overnight && (
        <T
          size={14}
          muted
          style={[s.numbers, s.line, { borderColor: theme.line }]}
        >{`${shortDate(info.day)} ${info.start} → ${shortDate(addDays(info.day, 1))} ${info.end}`}</T>
      )}
      {!!info.note && (
        <View
          style={{ padding: 12, borderRadius: 14, backgroundColor: theme.soft }}
        >
          <T size={15}>✎ {info.note}</T>
        </View>
      )}
      {children}
    </Card>
  );
}
