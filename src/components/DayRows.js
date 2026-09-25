import React from "react";
import { Pressable, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import { dayInfo, META, relativeDay, shortDate } from "../lib/schedule";
import { holiday } from "../lib/hebrew";
import { Icon, Row, s, T } from "./ui";
export default function DayRows({ days }) {
  const { data, today } = useApp();
  return (
    <View style={{ gap: 6 }}>
      {days.map((day) => {
        const info = dayInfo(data, day),
          meta = META[info.type],
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
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: meta.vividBg,
            }}
          >
            <Row>
              <Icon type={info.type} size={18} />
              <View style={{ width: 65 }}>
                <T weight="bold" size={15} style={{ color: meta.vividInk }}>
                  {relativeDay(day, today)}
                </T>
                <T size={12} style={{ color: meta.vividInk }}>
                  {shortDate(day)}
                </T>
              </View>
              <View style={[s.grow, { minWidth: 0 }]}>
                <T size={15} weight="medium" style={{ color: meta.vividInk }}>
                  {META[info.type].short}
                  {info.typeChanged ? " ✎" : ""}
                </T>
                {!!name && (
                  <T
                    size={11}
                    numberOfLines={1}
                    style={{ color: meta.vividInk }}
                  >
                    {name}
                  </T>
                )}
              </View>
              {!!info.note && (
                <Feather name="file-text" size={13} color={meta.vividInk} />
              )}
              <View>
                <T
                  size={12}
                  muted={!info.customHours}
                  style={[
                    info.work ? s.numbers : undefined,
                    { color: meta.vividInk },
                  ]}
                >
                  {info.work ? info.hours : "—"}
                </T>
                {info.customHours && (
                  <T size={11} weight="bold" style={{ color: meta.vividInk }}>
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
