import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, useColorScheme } from "react-native";
import { initialData, iso } from "../lib/schedule";
import { dark, light } from "../theme";
import { readData, saveData } from "../services/storage";
import { syncReminders } from "../services/notifications";
import { syncWidgets } from "../services/widgets";
import { registerRefresh } from "../services/background";

const Context = createContext(null);
export function AppProvider({ children }) {
  const [data, setData] = useState(initialData),
    [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState(false);
  const [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [now, setNow] = useState(new Date());
  const current = useRef(data),
    system = useColorScheme();
  useEffect(() => {
    current.current = data;
  }, [data]);
  const theme = (
    data.theme === "system" ? system === "dark" : data.theme === "dark"
  )
    ? dark
    : light;
  async function load() {
    try {
      setData(await readData());
      setLoadError(false);
      setReady(true);
    } catch {
      setLoadError(true);
    }
  }
  useEffect(() => {
    readData()
      .then((saved) => {
        setData(saved);
        setReady(true);
      })
      .catch(() => setLoadError(true));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!ready || !data.configured) return;
    let active = true;
    saveData(data)
      .then(async () => {
        if (!active) return;
        setError("");
        try {
          syncWidgets(data);
        } catch {
          setError("עדכון הווידג׳טים נכשל. נסה לפתוח שוב את האפליקציה.");
        }
        try {
          await syncReminders(data);
        } catch (e) {
          if (active) setError(e.message || "לא הצלחנו לעדכן את התזכורות.");
        }
      })
      .catch(() => {
        if (active)
          setError("השמירה במכשיר נכשלה. השאר את האפליקציה פתוחה ונסה שוב.");
      });
    return () => {
      active = false;
    };
  }, [data, ready]);
  useEffect(() => {
    if (!ready) return;
    registerRefresh().catch(() => {});
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 30000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      tick();
      if (current.current.configured) {
        try {
          syncWidgets(current.current);
        } catch {
          /* Foreground persistence retries synchronization. */
        }
        syncReminders(current.current).catch((e) => setError(e.message));
      }
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [ready]);
  const update = (fn) =>
    setData((prev) =>
      typeof fn === "function" ? fn(prev) : { ...prev, ...fn },
    );
  const editDay = (day, fn) =>
    setData((prev) => ({
      ...prev,
      overrides: { ...prev.overrides, [day]: fn(prev.overrides[day] || {}) },
    }));
  return (
    <Context.Provider
      value={{
        data,
        update,
        editDay,
        ready,
        loadError,
        retryLoad: load,
        theme,
        now,
        today: iso(now),
        error,
        toast,
        notify: setToast,
        retrySave: () => setData((d) => ({ ...d })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
