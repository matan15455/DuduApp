import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Assistant_400Regular } from "@expo-google-fonts/assistant/400Regular";
import { Assistant_600SemiBold } from "@expo-google-fonts/assistant/600SemiBold";
import { Assistant_700Bold } from "@expo-google-fonts/assistant/700Bold";
import { Assistant_800ExtraBold } from "@expo-google-fonts/assistant/800ExtraBold";
import { Rubik_500Medium } from "@expo-google-fonts/rubik/500Medium";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AppProvider, useApp } from "../state/AppProvider";
import { Button, Card, Loading, Screen, T } from "../components/ui";
SplashScreen.preventAutoHideAsync().catch(() => {});
function Navigator() {
  const { theme, ready, loadError, retryLoad, toast } = useApp();
  const [fonts, fontError] = useFonts({
    Assistant_400Regular,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
    Rubik_500Medium,
  });
  useEffect(() => {
    if ((fonts || fontError) && (ready || loadError)) SplashScreen.hideAsync();
  }, [fonts, fontError, ready, loadError]);
  useEffect(() => {
    if (!ready || (!fonts && !fontError)) return;
    const open = (response) => {
      const day = response?.notification.request.content.data.day;
      if (typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day))
        router.push({ pathname: "/day", params: { date: day } });
    };
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          open(response);
          Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [ready, fonts, fontError]);
  if (loadError)
    return (
      <Screen title="לא הצלחנו לטעון את הנתונים">
        <Card>
          <T>המידע השמור לא נמחק. נסה לטעון אותו שוב.</T>
          <Button title="נסה שוב" onPress={retryLoad} primary />
        </Card>
      </Screen>
    );
  if (!ready || (!fonts && !fontError)) return <Loading />;
  return (
    <View style={{ flex: 1, direction: "ltr", backgroundColor: theme.bg }}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="day"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.9, 1],
            sheetGrabberVisible: true,
            sheetCornerRadius: 30,
          }}
        />
        <Stack.Screen name="widgets" />
        <Stack.Screen name="import" />
      </Stack>
      {!!toast && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            bottom: 100,
            alignSelf: "center",
            backgroundColor: theme.ink,
            borderRadius: 18,
            paddingHorizontal: 22,
            paddingVertical: 12,
          }}
        >
          <T style={{ color: theme.bg }}>{toast}</T>
        </View>
      )}
    </View>
  );
}
export default function RootLayout() {
  return (
    <AppProvider>
      <Navigator />
    </AppProvider>
  );
}
