// Native modules are loaded only on entry to a picker, so an older development
// build can still open the app and show the rebuild message.
function nativeSources() {
  try {
    return {
      picker: require("expo-image-picker"),
      documents: require("expo-document-picker"),
      images: require("expo-image-manipulator"),
      File: require("expo-file-system").File,
    };
  } catch {
    throw new Error(
      "צריך להתקין גרסת פיתוח חדשה של האפליקציה כדי להשתמש בצילום ובייבוא קבצים.",
    );
  }
}

export async function pickSchedulePhoto(camera = false) {
  const { picker, images } = nativeSources();
  if (camera && !(await picker.requestCameraPermissionsAsync()).granted) {
    throw new Error(
      "כדי לצלם צריך לאפשר גישה למצלמה בהגדרות ה־iPhone. אפשר גם לבחור תמונה קיימת.",
    );
  }
  const options =
    /** @type {import("expo-image-picker").ImagePickerOptions} */ ({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });
  const result = camera
    ? await picker.launchCameraAsync(options)
    : await picker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  const context = images.ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 3200) {
    context.resize(
      asset.width >= asset.height ? { width: 3200 } : { height: 3200 },
    );
  }
  const rendered = await context.renderAsync();
  const jpeg = await rendered.saveAsync({
    format: images.SaveFormat.JPEG,
    compress: 0.9,
    base64: true,
  });
  if (!jpeg.base64 || jpeg.base64.length > 8 * 1024 * 1024) {
    throw new Error(
      "התמונה גדולה מדי. צלם את הטבלה מקרוב בלי שטח מיותר מסביבה.",
    );
  }
  return {
    kind: "image",
    uri: jpeg.uri,
    base64: jpeg.base64,
    name: camera ? "צילום סדר העבודה" : "תמונת סדר העבודה",
  };
}

export async function pickScheduleExcel() {
  const { documents, File } = nativeSources();
  const result = await documents.getDocumentAsync({
    type: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0],
    file = new File(asset.uri);
  if (
    !/\.xlsx?$/i.test(asset.name) ||
    !file.size ||
    file.size > 5 * 1024 * 1024
  ) {
    throw new Error("בחר קובץ xlsx או xls בגודל של עד 5MB.");
  }
  // The official browser build avoids Node filesystem dependencies in Metro.
  const XLSX = require("xlsx");
  let workbook;
  try {
    workbook = XLSX.read(await file.base64(), {
      type: "base64",
      cellDates: false,
      cellStyles: true,
      cellFormula: false,
    });
  } catch {
    throw new Error(
      "לא ניתן לקרוא את קובץ ה־Excel. ודא שאינו מוגן בסיסמה, או בחר תמונה.",
    );
  }
  const sheets = workbook.SheetNames.filter(
    (name, index) => !workbook.Workbook?.Sheets?.[index]?.Hidden,
  );
  if (!sheets.length || sheets.length > 40)
    throw new Error("בחר קובץ עם עד 40 גיליונות גלויים.");
  return { kind: "excel", name: asset.name, workbook, sheets };
}

export function excelSheetSource(source, sheetName) {
  const XLSX = require("xlsx"),
    sheet = source.workbook.Sheets[sheetName];
  if (!sheet || !sheet["!ref"]) throw new Error("הגיליון שנבחר ריק.");
  const cells = [];
  for (const address of Object.keys(sheet)) {
    if (address.startsWith("!")) continue;
    const cell = sheet[address];
    if (cell.v === undefined || cell.v === null || cell.v === "") continue;
    const position = XLSX.utils.decode_cell(address);
    if (position.r >= 1000 || position.c >= 300 || cells.length >= 12000) {
      throw new Error(
        "הגיליון גדול מדי. שמור בקובץ נפרד רק את סדר העבודה לחודש הרצוי.",
      );
    }
    cells.push({
      address,
      value: cell.w || String(cell.v),
      ...(cell.t === "n" ? { numericValue: cell.v } : {}),
      ...(cell.s?.fgColor?.rgb ? { fill: cell.s.fgColor.rgb } : {}),
    });
  }
  const text = JSON.stringify({
    sheet: sheetName,
    cells,
    mergedRanges: (sheet["!merges"] || []).map((range) =>
      XLSX.utils.encode_range(range),
    ),
  });
  if (!cells.length || text.length > 180000)
    throw new Error("הגיליון ריק או גדול מדי לזיהוי. בחר גיליון אחר או תמונה.");
  return { kind: "excel", text };
}
