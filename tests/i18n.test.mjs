import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function createElement(dataset = {}) {
  return {
    dataset,
    textContent: "",
    classList: { toggle() {} },
    setAttribute(name, value) { this[name] = value; },
    addEventListener() {},
  };
}

test("shared i18n honors lang query and translates static content", async () => {
  let savedLanguage = null;
  const translatedNode = createElement({ i18n: "portal.analyze.title" });
  const languageButtons = [createElement({ language: "es" }), createElement({ language: "en" })];
  const document = {
    documentElement: { lang: "es" },
    querySelectorAll(selector) {
      if (selector === "[data-i18n]") return [translatedNode];
      if (selector === "[data-language]") return languageButtons;
      return [];
    },
  };
  const window = {
    document,
    location: { search: "?lang=en", href: "https://example.test/?lang=en" },
    localStorage: { getItem() { return null; }, setItem(key, value) { savedLanguage = value; } },
    history: { replaceState() {} },
    dispatchEvent() {},
  };
  const context = vm.createContext({ window, URL, URLSearchParams, CustomEvent: class {} });
  const source = await readFile(path.join(root, "shared/i18n.js"), "utf8");
  vm.runInContext(source, context);

  const i18n = window.SimuLabI18n.createI18n();
  assert.equal(i18n.language, "en");
  assert.equal(savedLanguage, "en");
  assert.equal(i18n.t("portal.learn.title"), "Learn");
  assert.equal(i18n.t("psp.status.response_detected"), "Response detected");
  i18n.apply();
  assert.equal(document.documentElement.lang, "en");
  assert.equal(translatedNode.textContent, "Analyze");

  const surfaces = await Promise.all([
    "index.html",
    "apps/psp-lab/index.html",
    "apps/psp-lab/src/app.js",
    "apps/psp-lab/src/plot.js",
  ].map((file) => readFile(path.join(root, file), "utf8")));
  const keys = new Set(surfaces.flatMap((content) => [
    ...[...content.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((match) => match[1]),
    ...[...content.matchAll(/(?:\bt|translate)\("([a-zA-Z0-9_.]+)"/g)].map((match) => match[1]),
  ]));
  for (const key of keys) assert.notEqual(i18n.t(key), key, `missing English translation: ${key}`);
  i18n.setLanguage("es", { updateUrl: false });
  for (const key of keys) assert.notEqual(i18n.t(key), key, `missing Spanish translation: ${key}`);
});

test("Spanish remains the deterministic fallback for unknown language codes", async () => {
  const document = { documentElement: { lang: "es" }, querySelectorAll() { return []; } };
  const window = {
    document,
    location: { search: "?lang=fr", href: "https://example.test/?lang=fr" },
    localStorage: { getItem() { return null; }, setItem() {} },
    history: { replaceState() {} },
    dispatchEvent() {},
  };
  const context = vm.createContext({ window, URL, URLSearchParams, CustomEvent: class {} });
  const source = await readFile(path.join(root, "shared/i18n.js"), "utf8");
  vm.runInContext(source, context);
  const i18n = window.SimuLabI18n.createI18n();
  assert.equal(i18n.language, "es");
  assert.equal(i18n.t("portal.learn.title"), "Aprender");
});
