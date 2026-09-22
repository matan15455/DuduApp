import React from "react";
import { Pressable, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import { dayInfo, META, relativeDay, shortDate } from "../lib/schedule";
import { holiday } from "../lib/hebrew";
import { Icon, Row, s, T } from "./ui";
export default function DayRows({ days }) {
  const { data, today, theme } = useApp();
  return (
    <View>
      {days.map((day) => {
        const info = dayInfo(data, day),
          name = data.showHeb ? holiday(day) : "";
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={`${relativeDay(day, today)} ${shortDate(day)}, ${META[info.type].label}, ${info.hours}${info.note ? ", יש הערה" : ""}`}
            onPress={() =>
              router.push({ pathname: "/day", params: { date: day } })
            }
            style={{
              paddingVertical: 13,
              borderTopWidth: 1,
              borderColor: theme.line,
            }}
          >
            <Row>
              <Icon type={info.type} size={18} />
              <View style={{ width: 65 }}>
                <T weight="bold" size={15}>
                  {relativeDay(day, today)}
                </T>
                <T muted size={12}>
                  {shortDate(day)}
                </T>
              </View>
              <View style={s.grow}>
                <T size={15} weight="medium">
                  {META[info.type].short}
                  {info.typeChanged ? " ✎" : ""}
                </T>
                {!!name && (
                  <T muted size={11} numberOfLines={1}>
                    {name}
                  </T>
                )}
              </View>
              {!!info.note && (
                <Feather name="file-text" size={13} color={theme.muted} />
              )}
              <View>
                <T
                  size={12}
                  muted={!info.customHours}
                  style={info.work ? s.numbers : undefined}
                >
                  {info.work ? info.hours : "—"}
                </T>
                {info.customHours && (
                  <T size={11} weight="bold">
                    ◷ שעות חריגות
                  </T>
                )}
              </View>
            </Row>
          </Pressable>
        );
      })}
    </View>
  );
}
