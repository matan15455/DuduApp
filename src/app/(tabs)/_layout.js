import React from "react";
import { Pressable, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useApp } from "../../state/AppProvider";
import { T } from "../../components/ui";
const tabs = {
  index: ["לוח", "calendar"],
  check: ["האם אני פנוי", "search"],
  share: ["שיתוף", "share"],
  settings: ["הגדרות", "settings"],
};
function TabBar({ state, navigation }) {
  const { theme } = useApp(),
    insets = useSafeAreaInsets();
  return (
    <View
      style={{
        direction: "ltr",
        flexDirection: "row-reverse",
        paddingTop: 6,
        paddingHorizontal: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: theme.surface,
        borderTopColor: theme.line,
        borderTopWidth: 1,
      }}
    >
      {state.routes.map((route, index) => {
        const active = state.index === index,
          [label, icon] = tabs[route.name];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 52,
              gap: 3,
              borderRadius: 14,
              backgroundColor: active ? theme.accentSoft : "transparent",
            }}
          >
            <Feather
              name={icon}
              size={21}
              color={active ? theme.accent : theme.muted}
            />
            <T
              size={12}
              weight="bold"
              style={{ color: active ? theme.accent : theme.muted }}
            >
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
export default function TabLayout() {
  const { data } = useApp();
  if (!data.configured) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="check" />
      <Tabs.Screen name="share" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
