import React, { useLayoutEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useApp } from "../../state/AppProvider";
import { addDays, addMonth, parse, shortDate } from "../../lib/schedule";
import { hebrewDate } from "../../lib/hebrew";
import { Button, Row, s, Screen, T } from "../../components/ui";
import CalendarPage from "../../components/CalendarPage";

export default function Calendar() {
  const { data, today } = useApp();
  const [anchor, setAnchor] = useState(today),
    [mode, setMode] = useState("month");
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
      style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, gap: 8 }}
    >
      <Row>
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
      <Row style={{ gap: 5 }}>
        <Button
          title="›"
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
          title="‹"
          style={{ width: 44, paddingHorizontal: 0 }}
          onPress={() => move(1)}
        />
        <Button
          title="היום"
          style={{ paddingHorizontal: 10 }}
          onPress={() => setAnchor(today)}
        />
      </Row>
      <View
        style={{ flex: 1, overflow: "hidden", direction: "ltr" }}
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
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
