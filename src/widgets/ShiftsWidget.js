import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";

const ShiftsWidget = (props, environment) => {
  "widget";
  const dark =
    props.theme === "dark" ||
    (props.theme === "system" && environment.colorScheme === "dark");
  const ink = dark ? "#F2F0EC" : "#1B1A17",
    muted = dark ? "#9DA2AB" : "#6B6862",
    bg = dark ? "#1E2127" : "#FAF8F4";
  const next = props.next;
  if (props.expired)
    return (
      <VStack
        modifiers={[
          containerBackground(bg, "widget"),
          widgetURL("duduapp:///"),
        ]}
      >
        <Text modifiers={[foregroundStyle(ink)]}>
          פתח את משמרות לרענון הסבב
        </Text>
      </VStack>
    );
  if (!props.rows)
    return (
      <VStack>
        <Text>פתח את משמרות כדי להגדיר את הסבב</Text>
      </VStack>
    );
  if (environment.widgetFamily === "systemSmall")
    return (
      <VStack
        alignment="trailing"
        spacing={8}
        modifiers={[
          containerBackground(bg, "widget"),
          widgetURL("duduapp:///"),
          frame({
            maxWidth: Infinity,
            maxHeight: Infinity,
            alignment: "trailing",
          }),
        ]}
      >
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
          המשמרת הבאה
        </Text>
        <Spacer />
        <Text
          modifiers={[font({ size: 28, weight: "bold" }), foregroundStyle(ink)]}
        >
          {next?.label || "אין משמרת קרובה"}
        </Text>
        <Text modifiers={[font({ size: 14 }), foregroundStyle(muted)]}>
          {next?.when || ""}
        </Text>
        <Text
          modifiers={[
            font({ size: 23, weight: "semibold" }),
            foregroundStyle(ink),
          ]}
        >
          {next?.start || ""}
        </Text>
        {next?.customHours && (
          <Text
            modifiers={[
              font({ size: 11, weight: "bold" }),
              foregroundStyle(ink),
            ]}
          >
            ◷ שעות חריגות
          </Text>
        )}
      </VStack>
    );
  if (environment.widgetFamily === "systemMedium")
    return (
      <HStack
        spacing={10}
        modifiers={[
          containerBackground(bg, "widget"),
          widgetURL("duduapp:///"),
        ]}
      >
        {[props.rows[2], props.rows[1], props.rows[0]]
          .filter(Boolean)
          .map((row) => (
            <VStack
              key={row.day}
              alignment="trailing"
              spacing={5}
              modifiers={[frame({ maxWidth: Infinity })]}
            >
              <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
                {row.when}
              </Text>
              <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
                {row.date || ""}
              </Text>
              <Text
                modifiers={[
                  font({ size: 20, weight: "bold" }),
                  foregroundStyle(ink),
                ]}
              >
                {row.label}
              </Text>
              <Text
                modifiers={[
                  font({
                    size: 12,
                    weight: row.customHours ? "bold" : "regular",
                  }),
                  foregroundStyle(ink),
                ]}
              >
                {row.hours}
              </Text>
              {row.customHours && (
                <Text
                  modifiers={[
                    font({ size: 10, weight: "bold" }),
                    foregroundStyle(ink),
                  ]}
                >
                  ◷ שעות חריגות
                </Text>
              )}
              <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
                {row.holiday}
              </Text>
            </VStack>
          ))}
      </HStack>
    );
  return (
    <VStack
      alignment="trailing"
      spacing={8}
      modifiers={[
        containerBackground(bg, "widget"),
        widgetURL("duduapp:///"),
        frame({
          maxWidth: Infinity,
          maxHeight: Infinity,
          alignment: "trailing",
        }),
      ]}
    >
      <Text
        modifiers={[font({ size: 15, weight: "bold" }), foregroundStyle(ink)]}
      >
        הימים הקרובים
      </Text>
      {props.rows.map((row) => (
        <HStack key={row.day} spacing={8}>
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[
                font({
                  size: 12,
                  weight: row.customHours ? "bold" : "regular",
                }),
                foregroundStyle(ink),
              ]}
            >
              {row.hours}
            </Text>
            {row.customHours && (
              <Text
                modifiers={[
                  font({ size: 10, weight: "bold" }),
                  foregroundStyle(ink),
                ]}
              >
                ◷ שעות חריגות
              </Text>
            )}
          </VStack>
          <Spacer />
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[
                font({ size: 14, weight: "semibold" }),
                foregroundStyle(ink),
              ]}
            >
              {row.label}
            </Text>
            {!!row.holiday && (
              <Text modifiers={[font({ size: 10 }), foregroundStyle(muted)]}>
                {row.holiday}
              </Text>
            )}
          </VStack>
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[
                font({ size: 13 }),
                foregroundStyle(muted),
                frame({ width: 55, alignment: "trailing" }),
              ]}
            >
              {row.when}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
              {row.date || ""}
            </Text>
          </VStack>
        </HStack>
      ))}
    </VStack>
  );
};
export default createWidget("ShiftsWidget", ShiftsWidget);
