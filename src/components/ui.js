import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Feather from "@expo/vector-icons/Feather";
import { useApp } from "../state/AppProvider";
import { iso, longDate, META, parse } from "../lib/schedule";

export function T({
  children,
  size = 16,
  weight = "regular",
  muted = false,
  style = undefined,
  ...props
}) {
  const { theme } = useApp();
  const fonts = {
    regular: "Assistant_400Regular",
    medium: "Assistant_600SemiBold",
    bold: "Assistant_700Bold",
    heavy: "Assistant_800ExtraBold",
  };
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color: muted ? theme.muted : theme.ink,
          textAlign: "right",
          writingDirection: "rtl",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Row({ children, style = undefined }) {
  return <View style={[s.row, style]}>{children}</View>;
}
export function Card({ children, style = undefined }) {
  const { theme } = useApp();
  return (
    <View
      style={[
        s.card,
        { backgroundColor: theme.surface, borderColor: theme.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  primary = false,
  selected = false,
  disabled = false,
  style = undefined,
  icon = undefined,
  shiftType = undefined,
}) {
  const { theme } = useApp();
  const shift = shiftType ? META[shiftType] : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: shift
            ? shift.vividBg
            : primary
              ? theme.accent
              : selected
                ? theme.accentSoft
                : theme.surface,
          borderColor: shift
            ? selected
              ? shift.vividInk
              : shift.vividBg
            : primary || selected
              ? theme.accent
              : theme.border,
          opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
        },
        style,
      ]}
    >
      <Row style={{ justifyContent: "center", gap: 8 }}>
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={shift ? shift.vividInk : primary ? theme.bg : theme.accent}
          />
        )}
        <T
          weight="bold"
          style={{
            flexShrink: 1,
            textAlign: "center",
            color: shift
              ? shift.vividInk
              : primary
                ? theme.dark
                  ? "#13221F"
                  : "#FFFFFF"
                : selected
                  ? theme.accent
                  : theme.ink,
          }}
        >
          {title}
        </T>
        {shift && selected && (
          <Feather name="check-circle" size={20} color={shift.vividInk} />
        )}
      </Row>
    </Pressable>
  );
}
export function Screen({
  children,
  title = "",
  subtitle = "",
  style = undefined,
  scroll = true,
  footer = undefined,
}) {
  const { theme, error, retrySave } = useApp();
  const Content = scroll ? ScrollView : View;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, direction: "ltr", backgroundColor: theme.bg }}
    >
      <Content
        {...(scroll
          ? {
              keyboardShouldPersistTaps: "handled",
              style: { flex: 1 },
              contentContainerStyle: [s.screen, style],
            }
          : { style: [s.screen, { flex: 1 }, style] })}
      >
        {!!title && (
          <View style={{ gap: 4, marginBottom: 4 }}>
            <T size={28} weight="heavy">
              {title}
            </T>
            {!!subtitle && <T muted>{subtitle}</T>}
          </View>
        )}
        {!!error && (
          <Pressable onPress={retrySave} accessibilityRole="button">
            <Card style={{ borderColor: theme.danger }}>
              <T style={{ color: theme.danger }}>{error}</T>
              <T size={13} muted>
                לחץ לניסיון נוסף
              </T>
            </Card>
          </Pressable>
        )}
        {children}
      </Content>
      {footer && (
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.line,
            padding: 12,
          }}
        >
          <View style={{ width: "100%", maxWidth: 620, alignSelf: "center" }}>
            {footer}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
export function Section({ children }) {
  return (
    <T size={13} weight="bold" muted style={{ marginTop: 4 }}>
      {children}
    </T>
  );
}
export function Icon({ type, size = 20, box = false }) {
  const meta = META[type];
  return (
    <View
      style={{
        height: box ? 60 : size + 12,
        width: box ? 60 : size + 12,
        borderRadius: box ? 20 : 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: meta.vividBg,
      }}
    >
      <Feather name={meta.icon} color={meta.vividInk} size={size} />
    </View>
  );
}
export function PickerField({ value, onChange, mode = "date", label = "" }) {
  const { theme } = useApp(),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(value);
  const date =
    mode === "date" ? parse(draft) : new Date(`2026-01-01T${draft}:00`);
  return (
    <View style={{ flexGrow: 1, flexShrink: 1, gap: 6 }}>
      {!!label && (
        <T muted size={13} weight="bold">
          {label}
        </T>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${mode === "date" ? longDate(value) : value}`}
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        style={[
          s.button,
          { borderColor: theme.line, backgroundColor: theme.soft },
        ]}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <T
            size={mode === "date" ? 17 : 20}
            weight="bold"
            style={mode === "time" ? s.numbers : undefined}
          >
            {mode === "date" ? longDate(value) : value}
          </T>
          <Feather
            name={mode === "date" ? "calendar" : "clock"}
            color={theme.muted}
            size={18}
          />
        </Row>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#00000066",
            direction: "ltr",
          }}
        >
          <Pressable
            accessibilityLabel="ביטול בחירה"
            onPress={() => setOpen(false)}
            style={{ flex: 1 }}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
            }}
          >
            <T size={23} weight="bold">
              {label || "בחירת תאריך"}
            </T>
            <DateTimePicker
              value={date}
              mode={mode === "date" ? "date" : "time"}
              display="spinner"
              locale="he-IL"
              is24Hour
              themeVariant={theme.dark ? "dark" : "light"}
              onChange={(_, next) => {
                if (next)
                  setDraft(
                    mode === "date"
                      ? iso(next)
                      : `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`,
                  );
              }}
              style={{ alignSelf: "center" }}
            />
            <Row>
              <Button
                title="אישור"
                primary
                style={s.grow}
                onPress={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              />
              <Button
                title="ביטול"
                style={s.grow}
                onPress={() => setOpen(false)}
              />
            </Row>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
export function Loading() {
  const { theme } = useApp();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
      }}
    >
      <ActivityIndicator color={theme.accent} />
      <T>טוען את המשמרות שלך…</T>
    </View>
  );
}
export const s = StyleSheet.create({
  row: {
    direction: "ltr",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  screen: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 14,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
  },
  card: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 12 },
  button: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  numbers: {
    fontFamily: "Rubik_500Medium",
    writingDirection: "ltr",
    textAlign: "right",
  },
  wrap: {
    direction: "ltr",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  line: { borderTopWidth: 1, paddingTop: 12 },
  grow: { flex: 1 },
  center: { textAlign: "center" },
});
