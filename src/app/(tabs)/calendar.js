import React, { useState } from "react";
import { Pressable, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useApp } from "../../state/AppProvider";
import {
  addDays,
  addMonth,
  dayInfo,
  iso,
  META,
  parse,
  TYPES,
} from "../../lib/schedule";
import { hebrewDate, holiday } from "../../lib/hebrew";
import { Button, Card, Icon, Row, s, Screen, T } from "../../components/ui";
export default function Calendar() {
  const { data, today, theme } = useApp(),
    [month, setMonth] = useState(today.slice(0, 7) + "-01");
  const first = parse(month),
    count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
    offset = first.getDay();
  const cells = Array.from(
    { length: Math.ceil((count + offset) / 7) * 7 },
    (_, i) =>
      i < offset || i >= count + offset ? null : addDays(month, i - offset),
  );
  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Button
          title="›"
          style={{ width: 44 }}
          onPress={() => setMonth(addMonth(month, -1))}
        />
        <View style={s.grow}>
          <T size={23} weight="heavy" style={s.center}>
            {new Intl.DateTimeFormat("he-IL", {
              month: "long",
              year: "numeric",
            }).format(first)}
          </T>
          {data.showHeb && (
            <T size={12} muted style={s.center}>
              {hebrewDate(month)} – {hebrewDate(addDays(month, count - 1))}
            </T>
          )}
        </View>
        <Button
          title="‹"
          style={{ width: 44 }}
          onPress={() => setMonth(addMonth(month, 1))}
        />
      </Row>
      <Button
        title="חזור להיום"
        onPress={() => setMonth(iso().slice(0, 7) + "-01")}
        style={{ alignSelf: "flex-end", minHeight: 44 }}
      />
      <Row style={{ gap: 4 }}>
        {["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"].map((d) => (
          <T
            key={d}
            size={13}
            muted
            weight="bold"
            style={{ flex: 1, textAlign: "center" }}
          >
            {d}
          </T>
        ))}
      </Row>
      <View style={{ gap: 5 }}>
        {Array.from({ length: cells.length / 7 }, (_, week) => (
          <Row key={week} style={{ gap: 4, alignItems: "stretch" }}>
            {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
              if (!day) return <View key={`empty-${col}`} style={s.grow} />;
              const info = dayInfo(data, day),
                meta = META[info.type],
                color = theme.dark ? meta.dark : meta.color,
                h = data.showHeb ? holiday(day) : "";
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`${day}, ${meta.label}${h ? `, ${h}` : ""}${info.changed ? ", שונה מהסבב" : ""}${info.note ? ", יש הערה" : ""}`}
                  onPress={() =>
                    router.push({ pathname: "/day", params: { date: day } })
                  }
                  style={{
                    flex: 1,
                    minHeight: 80,
                    padding: 4,
                    borderRadius: 13,
                    gap: 4,
                    backgroundColor: theme.dark ? meta.darkBg : meta.bg,
                    borderWidth: info.changed ? 2 : 1,
                    borderColor: info.changed ? color : theme.line,
                  }}
                >
                  <Row style={{ gap: 1, justifyContent: "space-between" }}>
                    <T
                      size={14}
                      weight="bold"
                      style={{
                        ...(day === today
                          ? {
                              color: theme.bg,
                              backgroundColor: theme.ink,
                              borderRadius: 6,
                              overflow: "hidden",
                              paddingHorizontal: 3,
                            }
                          : {}),
                      }}
                    >
                      {parse(day).getDate()}
                    </T>
                    {!!info.note && (
                      <Feather name="file-text" size={10} color={color} />
                    )}
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
                  <T size={9} muted numberOfLines={2}>
                    {h}
                  </T>
                </Pressable>
              );
            })}
          </Row>
        ))}
      </View>
      <Card>
        <T size={13} weight="bold" muted>
          מקרא
        </T>
        <View style={s.wrap}>
          {TYPES.map((type) => (
            <Row key={type} style={{ width: "47%", minHeight: 30 }}>
              <Icon type={type} size={17} />
              <T size={14}>{META[type].label}</T>
            </Row>
          ))}
        </View>
        <T size={13} muted style={[s.line, { borderColor: theme.line }]}>
          מסגרת מודגשת — יום שעודכן ביד. סימן הערה ליד המספר — יש הערה ליום.
          לחיצה על יום פותחת את כל הפרטים.
        </T>
      </Card>
    </Screen>
  );
}
