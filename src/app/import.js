import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Icon,
  Row,
  s,
  Screen,
  Section,
  T,
} from "../components/ui";
import { useApp } from "../state/AppProvider";
import ImportImage from "../components/ImportImage";
import { dayInfo, DOW, longDate, parse, TYPES, META } from "../lib/schedule";
import { applyImport, importChanges } from "../lib/scheduleImport";
import {
  excelSheetSource,
  pickScheduleExcel,
  pickSchedulePhoto,
} from "../services/importSources";
import {
  importConfigured,
  recognizeSchedule,
} from "../services/scheduleImport";

export default function ImportSchedule() {
  const { data, update, theme } = useApp(),
    insets = useSafeAreaInsets();
  const [source, setSource] = useState(null),
    [sheet, setSheet] = useState("");
  const [year, setYear] = useState(""),
    [rowPolicy, setRowPolicy] = useState("");
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState("");
  const [error, setError] = useState(""),
    [completed, setCompleted] = useState(0);
  const [expanded, setExpanded] = useState("");
  const request = useRef(null),
    operation = useRef(false),
    mounted = useRef(true),
    applied = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);
  const rows = result?.rows || [],
    changes = importChanges(data, rows);
  const updateRow = (id, patch) =>
    setResult((previous) => ({
      ...previous,
      rows: previous.rows.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    }));

  async function choose(kind) {
    if (operation.current) return;
    operation.current = true;
    setBusy("פתיחת הקובץ…");
    setError("");
    try {
      const picked =
        kind === "excel"
          ? await pickScheduleExcel()
          : await pickSchedulePhoto(kind === "camera");
      if (picked && mounted.current) {
        setSource(picked);
        setResult(null);
        setCompleted(0);
        applied.current = false;
        setSheet(
          picked.kind === "excel" && picked.sheets.length === 1
            ? picked.sheets[0]
            : "",
        );
      }
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      operation.current = false;
      if (mounted.current) setBusy("");
    }
  }

  async function recognize() {
    if (operation.current || !source || !rowPolicy) return;
    const suppliedYear = year.trim() ? Number(year.trim()) : null;
    if (
      suppliedYear !== null &&
      (!/^\d{4}$/.test(year.trim()) ||
        suppliedYear < 2000 ||
        suppliedYear > 2100)
    ) {
      setError("הזן שנה בת ארבע ספרות, או השאר ריק לזיהוי מהטבלה.");
      return;
    }
    operation.current = true;
    setBusy("מזהה את סדר העבודה של דודו…");
    setError("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const prepared =
        source.kind === "excel" ? excelSheetSource(source, sheet) : source;
      const recognized = await recognizeSchedule(
        prepared,
        suppliedYear,
        rowPolicy,
        controller.signal,
      );
      if (mounted.current && !controller.signal.aborted) setResult(recognized);
    } catch (e) {
      if (mounted.current && !controller.signal.aborted) setError(e.message);
    } finally {
      operation.current = false;
      request.current = null;
      if (mounted.current) setBusy("");
    }
  }

  function confirmImport() {
    if (!changes.length || applied.current) return;
    Alert.alert(
      "לעדכן את הלוח?",
      `${changes.length} משמרות של דודו יעודכנו. הערות אישיות יישמרו. משמרת שהוחלפה תקבל את שעות ברירת המחדל שלה.`,
      [
        { text: "חזור לבדיקה", style: "cancel" },
        {
          text: "עדכן את הלוח",
          onPress: () => {
            if (applied.current) return;
            applied.current = true;
            update((previous) => applyImport(previous, rows));
            setCompleted(changes.length);
            setResult(null);
            setSource(null);
          },
        },
      ],
    );
  }

  const footer = result ? (
    <View style={{ gap: 8, paddingBottom: Math.max(insets.bottom, 6) }}>
      <T size={13} muted style={s.center}>
        {changes.length
          ? `${changes.length} שינויים נבחרו לעדכון`
          : "אין שינויים שנבחרו לעדכון"}
      </T>
      <Button
        primary
        title={`עדכן ${changes.length} משמרות בלוח`}
        disabled={!changes.length}
        onPress={confirmImport}
      />
    </View>
  ) : undefined;

  return (
    <Screen
      title="ייבוא סדר עבודה"
      subtitle="צילום, תמונה או Excel — רק המשמרות של דודו."
      footer={footer}
      style={{ paddingBottom: Math.max(insets.bottom, 24) }}
    >
      <Button
        title="חזור ללוח"
        icon="arrow-right"
        onPress={() => router.back()}
      />
      {!!completed && (
        <Card style={{ backgroundColor: theme.accentSoft }}>
          <T size={23} weight="heavy">
            הלוח עודכן
          </T>
          <T>{completed} משמרות עודכנו. הסבב הקבוע ממשיך כרגיל בשאר הימים.</T>
          <Button title="לצפייה בלוח" primary onPress={() => router.back()} />
        </Card>
      )}
      {!importConfigured() && (
        <Card>
          <T weight="bold">החיבור לזיהוי עדיין לא מוכן</T>
          <T muted>
            אפשר לבחור קובץ. הזיהוי יפעל אחרי שמי שהתקין את האפליקציה ישלים את
            חיבור השירות.
          </T>
        </Card>
      )}
      {!!error && (
        <Card style={{ borderColor: theme.danger }}>
          <T style={{ color: theme.danger }} accessibilityLiveRegion="polite">
            {error}
          </T>
        </Card>
      )}
      {!result && (
        <>
          <Row>
            <Button
              title="צילום"
              icon="camera"
              style={s.grow}
              disabled={!!busy}
              onPress={() => choose("camera")}
            />
            <Button
              title="תמונה"
              icon="image"
              style={s.grow}
              disabled={!!busy}
              onPress={() => choose("photo")}
            />
            <Button
              title="Excel"
              icon="file"
              style={s.grow}
              disabled={!!busy}
              onPress={() => choose("excel")}
            />
          </Row>
          <T size={14} muted>
            בצילום חשוב לכלול את שם העובד, כותרת החודש והשנה וכל התאריכים. קובץ
            Excel מקורי בדרך כלל ברור יותר מצילום מסך.
          </T>
          {source && (
            <Card>
              <T weight="bold">{source.name}</T>
              {source.kind === "image" ? (
                <ImportImage uri={source.uri} />
              ) : (
                <>
                  <T muted>בחר את הגיליון של החודש הרצוי</T>
                  <View style={s.wrap}>
                    {source.sheets.map((name) => (
                      <Button
                        key={name}
                        title={name}
                        disabled={!!busy}
                        selected={sheet === name}
                        onPress={() => setSheet(name)}
                      />
                    ))}
                  </View>
                </>
              )}
              <Section>איך לקרוא את הטבלה?</Section>
              <Button
                title="שורת דודו מחליפה את המשמרת שמעליה"
                selected={rowPolicy === "employee_overrides"}
                disabled={!!busy}
                onPress={() => setRowPolicy("employee_overrides")}
              />
              <Button
                title="רק שורת המשמרת בסקשן של דודו"
                selected={rowPolicy === "shift_only"}
                disabled={!!busy}
                onPress={() => setRowPolicy("shift_only")}
              />
              {rowPolicy === "employee_overrides" && (
                <T size={13} muted>
                  תא ריק בשורת דודו משאיר את המשמרת שמעליו. סימון לא ברור ימתין
                  לבדיקה שלך.
                </T>
              )}
              <T size={14} weight="bold">
                שנה — רק אם אינה מופיעה בטבלה
              </T>
              <TextInput
                accessibilityLabel="שנת סדר העבודה אם אינה מופיעה בטבלה"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="זיהוי אוטומטי מהטבלה"
                editable={!busy}
                placeholderTextColor={theme.muted}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 12,
                  padding: 12,
                  color: theme.ink,
                  textAlign: "right",
                  fontSize: 16,
                }}
              />
              <T size={12} muted>
                בלחיצה על זיהוי, התמונה או תוכן הגיליון שנבחר יישלחו ל־Google
                Gemini. במסלול החינמי Google עשויה להשתמש במידע לשיפור השירותים
                שלה.
              </T>
              <Button
                title="זהה את המשמרות של דודו"
                primary
                disabled={
                  !!busy ||
                  !importConfigured() ||
                  !rowPolicy ||
                  (source.kind === "excel" && !sheet)
                }
                onPress={recognize}
              />
            </Card>
          )}
        </>
      )}
      {!!busy && (
        <Card>
          <ActivityIndicator color={theme.accent} />
          <T weight="bold" style={s.center} accessibilityLiveRegion="polite">
            {busy}
          </T>
          {request.current && (
            <Button
              title="בטל זיהוי"
              onPress={() => request.current?.abort()}
            />
          )}
        </Card>
      )}
      {result && (
        <>
          {source?.kind === "image" && <ImportImage uri={source.uri} />}
          {source?.kind === "excel" && (
            <T muted size={13}>
              מקור: {source.name} · {sheet}
            </T>
          )}
          <Card style={{ backgroundColor: theme.accentSoft }}>
            <T size={23} weight="heavy">
              נמצא: {result.employeeName}
            </T>
            <T weight="bold">
              {new Intl.DateTimeFormat("he-IL", {
                month: "long",
                year: "numeric",
              }).format(new Date(result.year, result.month - 1, 1))}
            </T>
            <T size={13} muted>
              הכותרת במקור: {result.header || "ללא כותרת קריאה"}
            </T>
            <T>
              {rows.length} תאריכים זוהו. בדוק את התאריכים ואת המשמרות לפני
              העדכון.
            </T>
            <T size={13} muted>
              רק תאריכים מסומנים שהמשמרת בהם השתנתה יעודכנו. שעות חריגות נשמרות
              אם סוג המשמרת לא השתנה. החלפת משמרת מחזירה את שעות ברירת המחדל
              שלה.
            </T>
          </Card>
          {result.warnings.map((warning, index) => (
            <T key={index} style={{ color: theme.danger }}>
              {warning}
            </T>
          ))}
          <Row>
            <Button
              title="בחר זיהויים ברורים"
              style={s.grow}
              onPress={() =>
                setResult((prev) => ({
                  ...prev,
                  rows: prev.rows.map((r) => ({
                    ...r,
                    selected:
                      !r.dateBlocked && (r.issues.length === 0 || r.reviewed),
                  })),
                }))
              }
            />
            <Button
              title="בטל בחירה"
              style={s.grow}
              onPress={() =>
                setResult((prev) => ({
                  ...prev,
                  rows: prev.rows.map((r) => ({ ...r, selected: false })),
                }))
              }
            />
          </Row>
          {rows.map((row) => {
            const current = row.dateBlocked ? null : dayInfo(data, row.date);
            const safe =
              !row.dateBlocked && (row.issues.length === 0 || row.reviewed);
            return (
              <Card key={row.id} style={{ gap: 8 }}>
                <Row>
                  <View style={s.grow}>
                    <T weight="bold">
                      {row.dateBlocked
                        ? row.date || "תאריך לא ברור"
                        : `${DOW[parse(row.date).getDay()]} · ${longDate(row.date)}`}
                    </T>
                    <T size={13} muted>
                      {current
                        ? `בלוח כעת: ${META[current.type].label}${current.customHours ? ` · ${current.hours} (שעות חריגות)` : ""}`
                        : "לא ניתן לייבא עד לזיהוי תאריך תקין"}
                    </T>
                  </View>
                  <Switch
                    value={row.selected}
                    disabled={!safe}
                    onValueChange={(selected) =>
                      updateRow(row.id, { selected })
                    }
                    accessibilityLabel={`כלול בייבוא את ${row.date}`}
                    trackColor={{ true: theme.accent }}
                  />
                </Row>
                <Row>
                  {row.type && <Icon type={row.type} />}
                  <T weight="bold" style={s.grow}>
                    {row.type
                      ? `זוהה: ${META[row.type].label}`
                      : "המשמרת אינה ברורה"}
                  </T>
                  {current?.type === row.type && (
                    <T size={13} muted>
                      ללא שינוי
                    </T>
                  )}
                </Row>
                {!!row.issues.length && (
                  <T size={13} style={{ color: theme.danger }}>
                    {row.issues.join(" · ")}
                    {row.reviewed ? " · נבדק ידנית" : ""}
                  </T>
                )}
                {!!row.evidence && (
                  <T size={13} muted>
                    {row.evidence}
                  </T>
                )}
                {!row.dateBlocked && (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setExpanded(expanded === row.id ? "" : row.id)
                      }
                    >
                      <T
                        size={14}
                        weight="bold"
                        style={{ color: theme.accent, paddingVertical: 6 }}
                      >
                        בדיקה ותיקון המשמרת
                      </T>
                    </Pressable>
                    {expanded === row.id && (
                      <>
                        <T size={13} muted>
                          בחר את המשמרת הנכונה אחרי השוואה לטבלה:
                        </T>
                        <View style={s.wrap}>
                          {TYPES.map((type) => (
                            <Button
                              key={type}
                              title={META[type].label}
                              selected={row.type === type && row.reviewed}
                              onPress={() =>
                                updateRow(row.id, {
                                  type,
                                  reviewed: true,
                                  selected: true,
                                })
                              }
                            />
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}
              </Card>
            );
          })}
          <Button
            title="חזור לקובץ וזיהוי מחדש"
            onPress={() => {
              setResult(null);
              setError("");
            }}
          />
        </>
      )}
    </Screen>
  );
}
