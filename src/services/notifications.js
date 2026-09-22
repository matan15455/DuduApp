import * as Notifications from "expo-notifications";
import { reminderPlan } from "../lib/schedule";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
export async function requestReminders() {
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return (
    result.granted ||
    result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}
let queue = Promise.resolve();
export function syncReminders(data) {
  const task = queue
    .catch(() => {})
    .then(async () => {
      const permission = await Notifications.getPermissionsAsync();
      const allowed =
        permission.granted ||
        permission.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (data.reminder.on && !allowed)
        throw new Error(
          "אין הרשאה להתראות. אפשר להפעיל אותה בהגדרות ה־iPhone.",
        );
      for (const item of reminderPlan(data)) {
        await Notifications.scheduleNotificationAsync({
          identifier: `shift-${item.day}`,
          content: {
            title: item.title,
            body: item.body,
            sound: "default",
            data: { day: item.day },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: item.date,
          },
        });
      }
    });
  queue = task;
  return task;
}
