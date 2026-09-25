import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  background,
  clipShape,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  widgetAccentedRenderingMode,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";

const ShiftsWidget = (props, environment) => {
  "widget";
  const dark =
    props.theme === "dark" ||
    (props.theme === "system" && environment.colorScheme === "dark");
  const ink = dark ? "#F2F0EC" : "#1B1A17",
    bg = dark ? "#1E2127" : "#FAF8F4";
  const next = props.next;
  const fullColor =
    !environment.widgetRenderingMode ||
    environment.widgetRenderingMode === "fullColor";
  const nextInk = fullColor ? next?.ink || ink : ink;
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
        spacing={4}
        modifiers={[
          containerBackground(next?.fill || bg, "widget"),
          widgetURL("duduapp:///"),
          frame({
            maxWidth: Infinity,
            maxHeight: Infinity,
            alignment: "trailing",
          }),
        ]}
      >
        <HStack spacing={6}>
          <Image
            systemName={next?.symbol || "calendar"}
            modifiers={[
              font({ size: 18 }),
              foregroundStyle(fullColor ? nextInk : next?.fill || ink),
              widgetAccentedRenderingMode("fullColor"),
            ]}
          />
          <Text modifiers={[font({ size: 12 }), foregroundStyle(nextInk)]}>
            המשמרת הבאה
          </Text>
        </HStack>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 28, weight: "bold" }),
            foregroundStyle(nextInk),
            lineLimit(1),
            minimumScaleFactor(0.75),
          ]}
        >
          {next?.label || "אין משמרת קרובה"}
        </Text>
        <Text
          modifiers={[
            font({ size: 14 }),
            foregroundStyle(nextInk),
            lineLimit(1),
            minimumScaleFactor(0.8),
          ]}
        >
          {next?.when || ""}
        </Text>
        <Text
          modifiers={[
            font({ size: 23, weight: "semibold" }),
            foregroundStyle(nextInk),
          ]}
        >
          {next?.start || ""}
        </Text>
        {next?.customHours && (
          <Text
            modifiers={[
              font({ size: 11, weight: "bold" }),
              foregroundStyle(nextInk),
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
        spacing={6}
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
              spacing={3}
              modifiers={[
                frame({
                  maxWidth: Infinity,
                  maxHeight: Infinity,
                  alignment: "trailing",
                }),
                padding({ all: 6 }),
                background(fullColor ? row.fill || bg : "clear"),
                clipShape("roundedRectangle", 12),
              ]}
            >
              <Text
                modifiers={[
                  font({ size: 12, weight: "semibold" }),
                  foregroundStyle(fullColor ? row.ink || ink : ink),
                  lineLimit(1),
                ]}
              >
                {row.when}
              </Text>
              <Text
                modifiers={[
                  font({ size: 11 }),
                  foregroundStyle(fullColor ? row.ink || ink : ink),
                ]}
              >
                {row.date || ""}
              </Text>
              <Image
                systemName={row.symbol || "calendar"}
                modifiers={[
                  font({ size: 18 }),
                  foregroundStyle(fullColor ? row.ink || ink : row.fill || ink),
                  widgetAccentedRenderingMode("fullColor"),
                ]}
              />
              <Text
                modifiers={[
                  font({ size: 20, weight: "bold" }),
                  foregroundStyle(fullColor ? row.ink || ink : ink),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
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
                  foregroundStyle(fullColor ? row.ink || ink : ink),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
                ]}
              >
                {row.hours}
              </Text>
              {row.customHours && (
                <Text
                  modifiers={[
                    font({ size: 10, weight: "bold" }),
                    foregroundStyle(fullColor ? row.ink || ink : ink),
                    lineLimit(1),
                    minimumScaleFactor(0.75),
                  ]}
                >
                  ◷ שעות חריגות
                </Text>
              )}
              {!!row.holiday && (
                <Text
                  modifiers={[
                    font({ size: 10 }),
                    foregroundStyle(fullColor ? row.ink || ink : ink),
                    lineLimit(1),
                  ]}
                >
                  {row.holiday}
                </Text>
              )}
            </VStack>
          ))}
      </HStack>
    );
  return (
    <VStack
      alignment="trailing"
      spacing={4}
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
        <HStack
          key={row.day}
          spacing={6}
          modifiers={[
            padding({ horizontal: 8, vertical: 3 }),
            background(fullColor ? row.fill || bg : "clear"),
            clipShape("roundedRectangle", 9),
          ]}
        >
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[
                font({
                  size: 12,
                  weight: row.customHours ? "bold" : "regular",
                }),
                foregroundStyle(fullColor ? row.ink || ink : ink),
                lineLimit(1),
                minimumScaleFactor(0.75),
              ]}
            >
              {row.hours}
            </Text>
            {row.customHours && (
              <Text
                modifiers={[
                  font({ size: 10, weight: "bold" }),
                  foregroundStyle(fullColor ? row.ink || ink : ink),
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
                foregroundStyle(fullColor ? row.ink || ink : ink),
              ]}
            >
              {row.label}
            </Text>
            {!!row.holiday && (
              <Text
                modifiers={[
                  font({ size: 10 }),
                  foregroundStyle(fullColor ? row.ink || ink : ink),
                  lineLimit(1),
                ]}
              >
                {row.holiday}
              </Text>
            )}
          </VStack>
          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[
                font({ size: 13 }),
                foregroundStyle(fullColor ? row.ink || ink : ink),
                frame({ width: 55, alignment: "trailing" }),
              ]}
            >
              {row.when}
            </Text>
            <Text
              modifiers={[
                font({ size: 11 }),
                foregroundStyle(fullColor ? row.ink || ink : ink),
              ]}
            >
              {row.date || ""}
            </Text>
          </VStack>
          <Image
            systemName={row.symbol || "calendar"}
            modifiers={[
              font({ size: 17 }),
              foregroundStyle(fullColor ? row.ink || ink : row.fill || ink),
              widgetAccentedRenderingMode("fullColor"),
              frame({ width: 22 }),
            ]}
          />
        </HStack>
      ))}
    </VStack>
  );
};
export default createWidget("ShiftsWidget", ShiftsWidget);
