import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as schedule from "../src/lib/schedule.js";
import * as hebrew from "../src/lib/hebrew.js";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const source = readFileSync(
  new URL("../src/services/widgets.js", import.meta.url),
  "utf8",
);
const { code } = transformSync(source, {
  configFile: false,
  babelrc: false,
  plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
});

function runtime(nativeModule, platform = "ios", failure = null) {
  let loads = 0;
  let timeline;
  const exports = {};
  runInNewContext(code, {
    exports,
    require(name) {
      if (name === "expo")
        return { requireOptionalNativeModule: () => nativeModule };
      if (name === "react-native") return { Platform: { OS: platform } };
      if (name === "../lib/schedule") return schedule;
      if (name === "../lib/hebrew") return hebrew;
      if (name === "../widgets/ShiftsWidget") {
        loads++;
        if (!nativeModule)
          throw new Error("Cannot find native module 'ExpoWidgets'");
        if (failure) throw failure;
        return {
          default: {
            updateTimeline: (entries) => {
              timeline = entries;
            },
          },
        };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { service: exports, loads: () => loads, timeline: () => timeline };
}

test("Expo Go / older build can import and sync without loading native widgets", () => {
  const app = runtime(null);
  assert.equal(app.loads(), 0);
  assert.equal(app.service.widgetsAvailable(), false);
  assert.doesNotThrow(() =>
    app.service.syncWidgets({ ...schedule.initialData(), configured: true }),
  );
  assert.equal(app.loads(), 0);
});
test("supported iOS build lazily loads widgets and publishes its timeline", () => {
  const app = runtime({});
  assert.equal(app.loads(), 0);
  app.service.syncWidgets(schedule.initialData());
  assert.equal(app.loads(), 0);
  app.service.syncWidgets({ ...schedule.initialData(), configured: true });
  assert.equal(app.loads(), 1);
  assert.equal(app.timeline()[0].props.rows.length, 7);
  assert.equal(app.timeline().at(-1).props.expired, true);
});
test("unsupported platforms skip widget imports", () => {
  const app = runtime({}, "android");
  app.service.syncWidgets({ ...schedule.initialData(), configured: true });
  assert.equal(app.loads(), 0);
});
test("actual widget failures still propagate on supported builds", () => {
  const failure = new Error("Invalid widget configuration");
  const app = runtime({}, "ios", failure);
  assert.throws(
    () =>
      app.service.syncWidgets({ ...schedule.initialData(), configured: true }),
    failure,
  );
});
