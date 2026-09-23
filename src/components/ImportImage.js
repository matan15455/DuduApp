import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../state/AppProvider";
import { Button, T } from "./ui";

export default function ImportImage({ uri }) {
  const [open, setOpen] = useState(false),
    { width, height } = useWindowDimensions();
  const { theme } = useApp();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="הגדל את תמונת סדר העבודה"
        onPress={() => setOpen(true)}
      >
        <Image
          source={{ uri }}
          resizeMode="contain"
          style={{ width: "100%", height: 200, borderRadius: 12 }}
        />
        <T size={13} style={{ color: theme.accent, textAlign: "center" }}>
          לחץ להגדלה ולהשוואה למקור
        </T>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={{ padding: 12 }}>
            <Button title="חזור למשמרות" onPress={() => setOpen(false)} />
          </View>
          <T size={13} muted style={{ textAlign: "center" }}>
            אפשר להגדיל בשתי אצבעות ולהזיז את התמונה
          </T>
          <ScrollView
            key={uri}
            style={{ flex: 1 }}
            minimumZoomScale={1}
            maximumZoomScale={8}
            centerContent
          >
            <Image
              source={{ uri }}
              resizeMode="contain"
              style={{ width, height: Math.max(200, height - 170) }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
