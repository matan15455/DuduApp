import React, { useLayoutEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useApp } from "../../state/AppProvider";
import { addDays, addMonth, META, parse, shortDate } from "../../lib/schedule";
import { hebrewDate } from "../../lib/hebrew";
import { Button, Card, Row, s, Screen, T } from "../../components/ui";
import CalendarPage from "../../components/CalendarPage";

function LegendItem({ type }) {
  const meta = META[type];
  return (
    <View
      style={{
        width: 82,
        height: 66,
        borderRadius: 14,
        padding: 7,
        gap: 4,
        backgroundColor: meta.vividBg,
        overflow: "hidden",
      }}
    >
      <Row style={{ justifyContent: "space-between", gap: 4 }}>
        <T size={12} weight="heavy" style={{ color: meta.vividInk }}>
          {meta.label}
        </T>
        <Feather name={meta.icon} size={15} color={meta.vividInk} />
      </Row>
      <View style={{ flex: 1 }} />
      {meta.secondaryBg && (
        <View
          style={{
            height: 7,
            borderRadius: 4,
            backgroundColor: meta.secondaryBg,
          }}
        />
      )}
    </View>
  );
}

export default function Calendar() {
  const { data, today, theme } = useApp();
  const [anchor, setAnchor] = useState(today),
    [mode, setMode] = useState("month"),
    [legendOpen, setLegendOpen] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const pager = useRef(null),
    settledPage = useRef("");
  const period = (delta) =>
    mode === "month" ? addMonth(anchor, delta) : addDays(anchor, delta * 7);
  const month = anchor.slice(0, 7) + "-01",
    weekStart = addDays(anchor, -parse(anchor).getDay());
  const pageKey = `${mode}-${anchor}-${size.width}`;
  useLayoutEffect(() => {
    settledPage.current = "";
  }, [pageKey]);
  const move = (delta) =>
    pager.current?.scrollTo({ x: size.width * (1 - delta), animated: true });
  return (
    <Screen
      scroll={false}
      header={
        <View
          collapsable={false}
          style={{ paddingHorizontal: 12, paddingTop: 8, gap: 8 }}
        >
          <Row style={{ flexShrink: 0, zIndex: 2 }}>
            <Button
              title="ייבוא"
              icon="upload"
              style={{ minWidth: 96, flexShrink: 0 }}
              onPress={() => router.push("/import")}
            />
            <Button
              title="חודש"
              selected={mode === "month"}
              style={s.grow}
              onPress={() => setMode("month")}
            />
            <Button
              title="שבוע"
              selected={mode === "week"}
              style={s.grow}
              onPress={() => setMode("week")}
            />
          </Row>
          <Row style={{ gap: 5, flexShrink: 0, zIndex: 1 }}>
            <Button
              title="‹"
              style={{ width: 44, paddingHorizontal: 0 }}
              onPress={() => move(-1)}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T
                size={20}
                weight="heavy"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={s.center}
              >
                {mode === "month"
                  ? new Intl.DateTimeFormat("he-IL", {
                      month: "long",
                      year: "numeric",
                    }).format(parse(month))
                  : `${shortDate(weekStart)}–${shortDate(addDays(weekStart, 6))}`}
              </T>
              {data.showHeb && (
                <T size={11} muted numberOfLines={1} style={s.center}>
                  {hebrewDate(mode === "month" ? month : weekStart)}
                </T>
              )}
            </View>
            <Button
              title="›"
              style={{ width: 44, paddingHorizontal: 0 }}
              onPress={() => move(1)}
            />
            <Button
              title="היום"
              style={{ paddingHorizontal: 10 }}
              onPress={() => setAnchor(today)}
            />
            <Button
              title="?"
              style={{ width: 44, paddingHorizontal: 0 }}
              onPress={() => setLegendOpen(true)}
            />
          </Row>
        </View>
      }
      style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, gap: 8 }}
    >
      <View
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          direction: "ltr",
          zIndex: 0,
        }}
        onLayout={({ nativeEvent: { layout } }) =>
          setSize({ width: layout.width, height: layout.height })
        }
      >
        {size.width > 0 && (
          <ScrollView
            key={pageKey}
            ref={pager}
            horizontal
            pagingEnabled
            directionalLockEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: size.width, y: 0 }}
            style={{ flex: 1, direction: "ltr" }}
            contentContainerStyle={{ flexDirection: "row", direction: "ltr" }}
            onMomentumScrollEnd={({ nativeEvent }) => {
              const page = Math.round(nativeEvent.contentOffset.x / size.width);
              if (page === 1 || settledPage.current === pageKey) return;
              settledPage.current = pageKey;
              setAnchor(period(1 - page));
            }}
          >
            {[1, 0, -1].map((delta) => (
              <View
                key={delta}
                accessibilityElementsHidden={delta !== 0}
                importantForAccessibility={
                  delta === 0 ? "auto" : "no-hide-descendants"
                }
                style={{ width: size.width, height: size.height }}
              >
                <CalendarPage
                  anchor={period(delta)}
                  mode={mode}
                  height={size.height}
                  width={size.width}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <Modal
        visible={legendOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLegendOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="סגירת מקרא"
          onPress={() => setLegendOpen(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 18,
            backgroundColor: "#00000066",
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{ alignSelf: "center" }}
          >
            <Card
              style={{
                width: "100%",
                maxWidth: 360,
                borderRadius: 18,
                padding: 14,
                gap: 10,
                backgroundColor: theme.surface,
              }}
            >
              <Row style={{ justifyContent: "space-between" }}>
                <T size={20} weight="heavy">
                  מקרא
                </T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="סגירה"
                  onPress={() => setLegendOpen(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.soft,
                  }}
                >
                  <Feather name="x" size={20} color={theme.ink} />
                </Pressable>
              </Row>
              <View
                style={{
                  flexDirection: "row-reverse",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {[
                  "morning",
                  "afternoon",
                  "night",
                  "off",
                  "morningAfternoon",
                  "afternoonNight",
                  "special",
                ].map((type) => (
                  <LegendItem key={type} type={type} />
                ))}
              </View>
              <Row style={{ justifyContent: "center", gap: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 8,
                    borderRadius: 5,
                    backgroundColor: META.morningAfternoon.secondaryBg,
                  }}
                />
                <T size={14} weight="bold">
                  משמרת כפולה
                </T>
              </Row>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
