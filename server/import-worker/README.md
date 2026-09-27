# חיבור חד־פעמי לייבוא

מפתח Gemini נשמר ב־Cloudflare בלבד. אין הרשמה לאבא ואין מסד נתונים. המודל נשאר `gemini-3.1-flash-lite`.

## 1. פריסת השרת

פתח חשבון Cloudflare במסלול Free. משורש הפרויקט:

```powershell
npx.cmd wrangler@latest login
npx.cmd wrangler@latest deploy --config server/import-worker/wrangler.jsonc
npx.cmd wrangler@latest secret put GEMINI_API_KEY --config server/import-worker/wrangler.jsonc
npx.cmd wrangler@latest secret put APP_IMPORT_TOKEN --config server/import-worker/wrangler.jsonc
```

בפקודת המפתח הדבק **מפתח Gemini חדש**, מפרויקט Free ללא חשבון חיוב מקושר. בטל את המפתח הקודם אם הוטמע בבנייה. בפקודת האסימון הדבק את הערך של `EXPO_PUBLIC_IMPORT_TOKEN` מתוך `.env` המקומי — אסימון נפרד שנוצר עבורך, לא מפתח Google. אין להדביק סודות בצ׳אט או בתוך הפקודה.

לאחר הפריסה תקבל כתובת `workers.dev`. הכנס אותה ל־`EXPO_PUBLIC_IMPORT_URL` בקובץ `.env`, עם `/import` בסוף. עד לחיבור הכתובת והסודות, הייבוא לא יפעל. אין מעבר אוטומטי למפתח מקומי.

## 2. בניית האפליקציה

בפרויקט Expo → Environment variables → סביבת `production`:

- מחק את `EXPO_PUBLIC_GEMINI_API_KEY` אם קיים, גם מסביבות אחרות.
- הגדר `EXPO_PUBLIC_IMPORT_URL` עם כתובת השרת.
- הגדר `EXPO_PUBLIC_IMPORT_TOKEN` עם האסימון המקומי (אפשר נראות Sensitive).

```powershell
npx.cmd eas-cli@latest build --platform ios --profile production
```

לבדיקה בפיתוח הפעל מחדש Metro לאחר עדכון `.env`.

## היקף ההגנה

- מפתח Gemini והוראות המודל נמצאים רק בשרת. הנתיב והמודל קבועים; השירות אינו מתווך לבקשות AI שרירותיות.
- אסימון האפליקציה נמצא בחבילה וניתן לחילוץ. הוא מגביל גישה מזדמנת, אינו אימות משתמש/מכשיר. מתאים לפשרה הפשוטה של הפצה פרטית לשני משתמשים; לפני הפצה רחבה יש להוסיף אימות חזק.
- עד 35 רשומות, 32KB לבקשה, 200 תווים לכל תא, ושלוש בקשות לדקה. מגבלת Cloudflare מקומית למיקום השירות ואינה תקרת שימוש עולמית או הבטחת עלות.
- אין ניסיונות חוזרים אוטומטיים. מכסת Google שהסתיימה מציגה הודעה. Free ללא חיוב מקושר מוגדר בחשבון Google, לא בקוד.
- אין שמירת גיליונות או תוכנם בשרת, ואין הדפסתם או הדפסת מפתחות ללוגים. רק תאי המשמרות שחולצו נשלחים ל־Google; תנאי המסלול החינמי שלה עדיין חלים.
- `.dev.vars` מכיל סודות מקומיים בלבד, מוחרג מ־Git, ולא מועלה בפקודת deploy. המפתח הישן הועבר לשם כדי להסירו מהאפליקציה; השתמש במפתח חדש לפריסה.
- שינוי זה לא בוצע בשרת חי ולא נבדק מול Gemini בפועל עד לחיבור החשבון.

[סודות Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/) · [מגבלות קצב](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) · [משתני EAS](https://docs.expo.dev/eas/environment-variables/)
