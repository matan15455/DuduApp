import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { readData } from "./storage";
import { syncReminders } from "./notifications";
import { syncWidgets } from "./widgets";
const TASK = "refresh-shift-schedule";
TaskManager.defineTask(TASK, async () => {
  try {
    const data = await readData();
    if (data.configured) {
      await syncReminders(data);
      syncWidgets(data);
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
export async function registerRefresh() {
  if (
    (await BackgroundTask.getStatusAsync()) ===
      BackgroundTask.BackgroundTaskStatus.Available &&
    !(await TaskManager.isTaskRegisteredAsync(TASK))
  )
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 720 });
}
