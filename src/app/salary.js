import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../state/AppProvider";
import { addMonth, parse, shortDate } from "../lib/schedule";
import { estimateSalary, FIXED_PAY, money } from "../lib/salary";
import { Button, Card, Row, Screen, T, s } from "../components/ui";

function Breakdown({ title, amount, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Button
        title={amount === undefined ? title : `${title} · ${money(amount)}`}
        icon={open ? "chevron-up" : "chevron-down"}
        onPress={() => setOpen(!open)}
      />
      {open && children}
    </Card>
  );
}
function PayLine({ label, amount }) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
      <T size={15} style={s.grow}>
        {label}
      </T>
      <T size={15} weight="bold">
        {money(amount)}
      </T>
    </Row>
  );
}
export default function Salary() {
  const { data, today, update, theme, notify } = useApp();
  const params = useLocalSearchParams();
  const [month, setMonth] = useState(
    typeof params.month === "string" &&
      /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month)
      ? params.month
      : today.slice(0, 7),
  );
  const result = useMemo(() => estimateSalary(data, month), [data, month]);
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState("");
  const monthName = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(parse(`${month}-01`));
  const validAmount = /^-?\d{1,7}(?:[.,]\d{1,2})?$/.test(draft.trim());
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Screen
        title="שכר משוער"
        footer={
          editing ? (
            <Row>
              <Button
                title="שמור"
                primary
                style={s.grow}
                disabled={!validAmount}
                onPress={() => {
                  const amount = Math.round(
                    Number(draft.replace(",", ".")) * 100,
                  );
                  update((prev) => ({
                    ...prev,
                    salaryAdjustments: {
                      ...prev.salaryAdjustments,
                      [month]: amount,
                    },
                  }));
                  setEditing(false);
                  notify("הסכום נשמר");
                }}
              />
              <Button title="ביטול" onPress={() => setEditing(false)} />
            </Row>
          ) : undefined
        }
      >
        <Button title="חזרה ללוח" onPress={() => router.back()} />
        <Row>
          <Button
            title="‹"
            disabled={editing}
            onPress={() => setMonth(addMonth(`${month}-01`, -1).slice(0, 7))}
          />
          <T style={[s.grow, s.center]} size={22} weight="heavy">
            {monthName}
          </T>
          <Button
            title="›"
            disabled={editing}
            onPress={() => setMonth(addMonth(`${month}-01`, 1).slice(0, 7))}
          />
        </Row>
        <Card>
          <T muted>
            ברוטו משוער{result.unresolved.length ? " · חישוב חלקי" : ""}
          </T>
          <T size={36} weight="heavy" numberOfLines={1} adjustsFontSizeToFit>
            {money(result.total)}
          </T>
          <T size={14}>
            {shortDate(result.from)}.{result.from.slice(0, 4)} –{" "}
            {shortDate(result.to)}.{result.to.slice(0, 4)}
          </T>
          <Row>
            <T style={s.grow}>{result.workedDays} ימי עבודה</T>
            <T>{result.vacationDays} ימי חופשה בתשלום</T>
          </Row>
        </Card>
        {result.unresolved.length > 0 && (
          <Card>
            <T weight="bold" style={{ color: theme.danger }}>
              {result.unresolved.length} ימים דורשים בדיקה
            </T>
            <T size={13}>
              נסיעות והמתנה נכללו; תוספות המשמרת והשעות בימים אלו לא חושבו.
            </T>
            {result.unresolved.map((item) => (
              <Button
                key={item.day}
                title={`${shortDate(item.day)} · ${item.reason}`}
                onPress={() =>
                  router.push({ pathname: "/day", params: { date: item.day } })
                }
              />
            ))}
          </Card>
        )}
        <Breakdown title="שכר קבוע" amount={result.fixed}>
          {FIXED_PAY.map(([label, amount]) => (
            <PayLine key={label} label={label} amount={amount} />
          ))}
        </Breakdown>
        <Breakdown title="תוספות משמרות" amount={result.shiftPay}>
          {result.shiftLines.map((line) => (
            <PayLine
              key={line.key}
              label={`${line.label} · ${line.count} משמרות`}
              amount={line.amount}
            />
          ))}
        </Breakdown>
        <Breakdown title="שעות נוספות ופיצוי" amount={result.overtimePay}>
          {result.overtimeLines.map((line) => (
            <PayLine
              key={line.key}
              label={`${line.label} · ${line.count} ${line.key === "compensation" ? "יחידות" : "שעות"}`}
              amount={line.amount}
            />
          ))}
        </Breakdown>
        <Breakdown
          title="נסיעות והמתנה"
          amount={result.travel + result.waiting}
        >
          <PayLine
            label={`${result.workedDays} ימים × 121 ₪ נסיעות`}
            amount={result.travel}
          />
          <PayLine
            label={`${result.workedDays} ימים × 50.89 ₪ המתנה`}
            amount={result.waiting}
          />
        </Breakdown>
        <Card>
          <PayLine
            label={`חופשה בתשלום · ${result.vacationDays} ימים × 373 ₪`}
            amount={result.vacation}
          />
          {result.seasonal > 0 && (
            <PayLine label="משכורת י״ג · אוגוסט" amount={result.seasonal} />
          )}
          <PayLine label="זקיפות שכר למס" amount={result.imputed} />
        </Card>
        <Card>
          <PayLine label="הוספת סכום ידנית" amount={result.adjustment} />
          {editing ? (
            <>
              <TextInput
                autoFocus
                accessibilityLabel="הוספת סכום ידנית בשקלים"
                value={draft}
                onChangeText={setDraft}
                keyboardType="numbers-and-punctuation"
                placeholder="0.00"
                placeholderTextColor={theme.muted}
                style={{
                  color: theme.ink,
                  backgroundColor: theme.soft,
                  padding: 14,
                  borderRadius: 12,
                  textAlign: "right",
                  fontSize: 20,
                }}
              />
            </>
          ) : (
            <Button
              title="הוספת סכום ידנית"
              onPress={() => {
                setDraft(String(result.adjustment / 100));
                setEditing(true);
              }}
            />
          )}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
