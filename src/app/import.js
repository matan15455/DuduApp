import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Switch, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import { DOW, iso, META, parse, shortDate, TYPES } from "../lib/schedule";
import {
  applyImport,
  rowLabel,
  undoImport,
  validImportRow,
} from "../lib/scheduleImport";
import {
  importSetupError,
  pickSchedule,
  recognizeSchedule,
} from "../services/scheduleImport";
import { Button, Card, PickerField, Row, s, Screen, T } from "../components/ui";

function ReviewDay({ row, data, onChange, onEditing }) {
  const { theme } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row);
  const meta = META[row.type];
  const close = () => {
    setEditing(false);
    onEditing(false);
  };
  return (
    <Card
      style={{
        gap: 8,
        padding: 10,
        borderColor: row.needsReview ? theme.danger : theme.line,
        backgroundColor: meta?.vividBg || theme.soft,
      }}
    >
      <Row style={{ gap: 8 }}>
        <Switch
          accessibilityLabel={`עדכן את ${shortDate(row.day)}`}
          value={row.selected}
          disabled={!validImportRow(row)}
          onValueChange={(selected) => onChange({ ...row, selected })}
          trackColor={{ true: theme.accent }}
        />
        <T
          weight="bold"
          size={15}
          style={[s.grow, { color: meta?.vividInk || theme.ink }]}
        >
          {DOW[parse(row.day).getDay()]} {shortDate(row.day)} · {rowLabel(row)}
        </T>
        {!editing && (
          <Button
            title={row.needsReview ? "תקן" : "ערוך"}
            style={{ minHeight: 36, paddingHorizontal: 12 }}
            onPress={() => {
              setDraft(row);
              setEditing(true);
              onEditing(true);
            }}
          />
        )}
      </Row>
      {editing && (
        <>
          <View style={s.wrap}>
            {TYPES.map((type) => (
              <Button
                key={type}
                title={META[type].label}
                shiftType={type}
                selected={draft.type === type}
                style={{ minHeight: 36, paddingHorizontal: 12 }}
                onPress={() => {
                  const hours =
                    type === "special" ? ["11:00", "19:00"] : data.hours[type];
                  setDraft({
                    ...draft,
                    type,
                    start: hours?.[0] || "",
                    end: hours?.[1] || "",
                  });
                }}
              />
            ))}
          </View>
          {draft.type === "special" && (
            <Row>
              <View style={s.grow}>
                <PickerField
                  label="התחלה"
                  mode="time"
                  value={
                    /^\d{2}:\d{2}$/.test(draft.start) ? draft.start : "11:00"
                  }
                  onChange={(start) => setDraft({ ...draft, start })}
                />
              </View>
              <View style={s.grow}>
                <PickerField
                  label="סיום"
                  mode="time"
                  value={/^\d{2}:\d{2}$/.test(draft.end) ? draft.end : "19:00"}
                  onChange={(end) => setDraft({ ...draft, end })}
                />
              </View>
            </Row>
          )}
          <Row>
            <Button
              title="אשר"
              primary
              style={s.grow}
              disabled={!validImportRow({ ...draft, needsReview: false })}
              onPress={() => {
                onChange({
                  ...draft,
                  needsReview: false,
                  reason: "",
                  selected: true,
                });
                close();
              }}
            />
            <Button title="ביטול" style={s.grow} onPress={close} />
          </Row>
        </>
      )}
    </Card>
  );
}

export default function ImportSchedule() {
  const { data, update, theme, notify } = useApp();
  const [source, setSource] = useState(null),
    [rows, setRows] = useState([]);
  const [editingDays, setEditingDays] = useState([]);
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const request = useRef(null),
    alive = useRef(true),
    locked = useRef(false),
    latest = useRef(data);
  useEffect(() => {
    latest.current = data;
  }, [data]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  const setupError = importSetupError();
  const selected = rows.filter((row) => row.selected);
  const unresolved = rows.filter((row) => row.needsReview).length;
  const sourceCurrent = () => source && source.created === iso(new Date());
  async function choose() {
    if (locked.current) return;
    locked.current = true;
    setBusy("…");
    setError("");
    try {
      const picked = await pickSchedule();
      if (picked && alive.current) {
        setSource(picked);
        setRows([]);
        setEditingDays([]);
        setSaved(false);
      }
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      locked.current = false;
      if (alive.current) setBusy("");
    }
  }
  async function recognize() {
    if (locked.current) return;
    const currentSetupError = importSetupError();
    if (currentSetupError) {
      setError(currentSetupError);
      return;
    }
    if (!sourceCurrent()) {
      setError("בחר את הקובץ מחדש");
      return;
    }
    locked.current = true;
    setBusy("…");
    setError("");
    setRows([]);
    setEditingDays([]);
    setSaved(false);
    request.current = new AbortController();
    try {
      const result = await recognizeSchedule(
        source,
        latest.current,
        request.current.signal,
      );
      if (alive.current) setRows(result);
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      locked.current = false;
      request.current = null;
      if (alive.current) setBusy("");
    }
  }
  function confirm() {
    Alert.alert("לעדכן את הלוח?", `${selected.length} ימים`, [
      { text: "ביטול", style: "cancel" },
      {
        text: "עדכן",
        onPress: () => {
          if (locked.current) return;
          if (!sourceCurrent()) {
            setError("בחר את הקובץ מחדש");
            return;
          }
          try {
            const updated = applyImport(latest.current, rows, source.sheetName);
            update(updated);
            setSaved(true);
            setRows([]);
            notify(updated === latest.current ? "אין שינויים" : "הלוח עודכן");
          } catch (e) {
            setError(e.message);
          }
        },
      },
    ]);
  }
  return (
    <Screen
      title="ייבוא סידור עבודה"
      footer={
        rows.length > 0 ? (
          <Button
            title={
              editingDays.length ? "סיים עריכה" : `עדכן ${selected.length} ימים`
            }
            primary
            disabled={
              !selected.length ||
              editingDays.length > 0 ||
              selected.some((row) => !validImportRow(row)) ||
              !!busy
            }
            onPress={confirm}
          />
        ) : undefined
      }
    >
      <Button
        title="חזרה ללוח"
        icon="arrow-right"
        onPress={() => router.back()}
      />
      <Row>
        <Button
          title={source ? "קובץ אחר" : "בחר קובץ Excel"}
          icon="upload"
          style={s.grow}
          disabled={!!busy}
          onPress={choose}
        />
        {source && (
          <Button
            title="זהה"
            primary
            style={s.grow}
            disabled={!!busy}
            onPress={recognize}
          />
        )}
      </Row>
      {source && (
        <T size={14} muted>
          {source.fileName} · {shortDate(source.from)}–{shortDate(source.to)}
        </T>
      )}
      {!!busy && (
        <Row>
          <ActivityIndicator color={theme.accent} />
          <Button title="ביטול" onPress={() => request.current?.abort()} />
        </Row>
      )}
      {!!(error || setupError) && (
        <T style={{ color: theme.danger }}>{error || setupError}</T>
      )}
      {saved && <T weight="bold">הלוח עודכן</T>}
      {rows.length > 0 && (
        <>
          <T weight="bold">
            {selected.length}/{rows.length}
            {unresolved ? ` · ${unresolved} לבדיקה` : ""}
          </T>
          {[...rows]
            .sort(
              (a, b) =>
                Number(b.needsReview) - Number(a.needsReview) ||
                a.day.localeCompare(b.day),
            )
            .map((row) => (
              <ReviewDay
                key={row.day}
                row={row}
                data={data}
                onEditing={(open) =>
                  setEditingDays((days) =>
                    open
                      ? [...days.filter((day) => day !== row.day), row.day]
                      : days.filter((day) => day !== row.day),
                  )
                }
                onChange={(next) =>
                  setRows((previous) =>
                    previous.map((item) =>
                      item.day === next.day ? next : item,
                    ),
                  )
                }
              />
            ))}
        </>
      )}
      {data.lastImport && (
        <Button
          title="בטל את הייבוא האחרון"
          disabled={!!busy}
          onPress={() =>
            Alert.alert("לבטל את הייבוא האחרון?", "", [
              { text: "לא", style: "cancel" },
              {
                text: "בטל",
                style: "destructive",
                onPress: () => {
                  update(undoImport(latest.current));
                  setRows([]);
                  setSaved(false);
                  notify("הייבוא בוטל");
                },
              },
            ])
          }
        />
      )}
    </Screen>
  );
}
