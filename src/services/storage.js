import AsyncStorage from "@react-native-async-storage/async-storage";
import { initialData } from "../lib/schedule";
const KEY = "shifts.data.v1";
export async function readData() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return initialData();
  const saved = JSON.parse(raw);
  if (
    saved.version !== 1 ||
    !saved.hours ||
    !saved.overrides ||
    !/^\d{4}-\d{2}-\d{2}$/.test(saved.cycleStart)
  )
    throw new Error("Invalid saved data");
  return { ...initialData(), ...saved };
}
let writes = Promise.resolve();
export function saveData(data) {
  const write = writes
    .catch(() => {})
    .then(() => AsyncStorage.setItem(KEY, JSON.stringify(data)));
  writes = write;
  return write;
}
