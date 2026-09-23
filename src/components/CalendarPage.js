import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import { addDays, dayInfo, DOW, META, parse, shortDate } from "../lib/schedule";
import { holiday } from "../lib/hebrew";
import { Icon, Row, s, T } from "./ui";

function Markers({ info }) {
  const { theme } = useApp();
  return (
    <Row style={{ gap: 3, minHeight: 22, marginTop: "auto" }}>
      {info.typeChanged && (
        <View
          style={{
            borderRadius: 5,
            padding: 0,
            backgroundColor: theme.dark ? "#4A2C13" : "#FFE0AD",
          }}
        >
          <Feather
            name="edit-2"
            size={18}
            color={theme.dark ? "#FFD18A" : "#A74800"}
          />
        </View>
      )}
      {!!info.note && (
        <View
          style={{
            borderRadius: 5,
            padding: 0,
            backgroundColor: theme.dark ? "#193D65" : "#D4E9FF",
          }}
        >
          <Feather
            name="file-text"
            size={18}
            color={theme.dark ? "#9ED0FF" : "#0758A5"}
          />
        </View>
      )}
    </Row>
  );
}
export default function CalendarPage({ anchor, mode, height, width }) {
  const { data, today, theme } = useApp();
  // Use the same measured width for headers, empty slots and populated cells.
  // Padding and intrinsic text sizes must never affect the column allocation.
  const columnStyle = {
    width: Math.max(0, (width - 2 - 6 * 4) / 7),
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    overflow: "hidden",
  };
  const month = anchor.slice(0, 7) + "-01",
    first = parse(month);
  const count = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  const weekStart = addDays(anchor, -parse(anchor).getDay());
  const weeks = Math.ceil((count + first.getDay()) / 7);
  const cellHeight = Math.max(88, (height - 26 - (weeks - 1) * 4) / weeks);
  const cells =
    mode === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      : Array.from({ length: weeks * 7 }, (_, i) =>
          i < first.getDay() || i >= count + first.getDay()
            ? null
            : addDays(month, i - first.getDay()),
        );
  const open = (day) =>
    router.push({ pathname: "/day", params: { date: day } });
  // Only compact screens / enlarged text need vertical scrolling; the outer
  // pager owns horizontal movement and locks to that direction while paging.
  return (
    <ScrollView
      directionalLockEnabled
      bounces={false}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, width }}
      contentContainerStyle={{
        width,
        gap: 4,
        paddingHorizontal: 1,
        paddingBottom: 2,
      }}
    >
      {mode === "month" ? (
        <>
          <Row style={{ gap: 4, height: 20 }}>
            {["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"].map((day) => (
              <T
                key={day}
                size={13}
                muted
                weight="bold"
                style={[columnStyle, { textAlign: "center" }]}
              >
                {day}
              </T>
            ))}
          </Row>
          {Array.from({ length: weeks }, (_, week) => (
            <Row key={week} style={{ gap: 4, alignItems: "stretch" }}>
              {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={columnStyle} />;
                const info = dayInfo(data, day),
                  meta = META[info.type],
                  color = theme.dark ? meta.dark : meta.color,
                  name = data.showHeb ? holiday(day) : "";
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`${shortDate(day)}, ${meta.label}${info.customHours ? `, שעות חריגות ${info.hours}` : ""}${info.typeChanged ? ", משמרת ששונתה" : ""}${info.note ? ", יש הערה" : ""}${name ? `, ${name}` : ""}`}
                    onPress={() => open(day)}
                    style={{
                      ...columnStyle,
                      minHeight: cellHeight,
                      padding: 2,
                      borderRadius: 12,
                      gap: 2,
                      backgroundColor: theme.dark ? meta.darkBg : meta.bg,
                      borderWidth: 1,
                      borderColor: day === today ? theme.accent : "transparent",
                    }}
                  >
                    <Row style={{ gap: 0, justifyContent: "space-between" }}>
                      <T
                        size={14}
                        weight="bold"
                        style={{
                          width: 23,
                          height: 23,
                          textAlign: "center",
                          borderRadius: 12,
                          overflow: "hidden",
                          ...(day === today
                            ? { color: theme.bg, backgroundColor: theme.ink }
                            : {}),
                        }}
                      >
                        {parse(day).getDate()}
                      </T>
                      <Icon type={info.type} size={12} />
                    </Row>
                    <T
                      size={11}
                      weight="heavy"
                      numberOfLines={1}
                      style={{ color }}
                    >
                      {meta.short}
                    </T>
                    {info.customHours && (
                      <View>
                        <T
                          size={8}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                          style={[s.numbers, { color }]}
                        >
                          {info.hours}
                        </T>
                        <T size={8} weight="bold" style={{ color }}>
                          ◷ חריגות
                        </T>
                      </View>
                    )}
                    {!!name && (
                      <T
                        size={9}
                        muted
                        numberOfLines={2}
                        style={{ lineHeight: 11 }}
                      >
                        {name}
                      </T>
                    )}
                    <Markers info={info} />
                  </Pressable>
                );
              })}
            </Row>
          ))}
        </>
      ) : (
        cells.map((day) => {
          const info = dayInfo(data, day),
            meta = META[info.type],
            color = theme.dark ? meta.dark : meta.color,
            name = data.showHeb ? holiday(day) : "";
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              onPress={() => open(day)}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: day === today ? theme.accent : "transparent",
                overflow: "hidden",
                backgroundColor: theme.surface,
              }}
            >
              <Row style={{ gap: 0, alignItems: "stretch" }}>
                <View
                  style={{
                    width: 90,
                    padding: 12,
                    justifyContent: "center",
                    gap: 4,
                    backgroundColor:
                      day === today ? theme.accentSoft : theme.soft,
                  }}
                >
                  <T weight="bold" size={17}>
                    {DOW[parse(day).getDay()]}
                  </T>
                  <T size={15} muted style={s.numbers}>
                    {shortDate(day)}
                  </T>
                  {day === today && (
                    <T size={12} weight="bold" style={{ color: theme.accent }}>
                      היום
                    </T>
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 12,
                    gap: 5,
                    backgroundColor: theme.dark ? meta.darkBg : meta.bg,
                  }}
                >
                  <Row>
                    <Icon type={info.type} size={22} />
                    <T size={20} weight="heavy" style={{ color }}>
                      {meta.label}
                    </T>
                  </Row>
                  <T size={15} style={info.work ? s.numbers : undefined}>
                    {info.work ? info.hours : "ללא משמרת"}
                  </T>
                  {info.customHours && (
                    <T size={12} weight="bold">
                      ◷ שעות חריגות
                    </T>
                  )}
                  {!!name && (
                    <T size={12} muted>
                      {name}
                    </T>
                  )}
                  {(info.typeChanged || info.note) && <Markers info={info} />}
                </View>
              </Row>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
