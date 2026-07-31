import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("portal links to both local laboratories", async () => {
  const portal = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(portal, /apps\/electrophysiology-lab\//);
  assert.match(portal, /apps\/neurocell-explorer\//);
});

test("required GitHub Pages entry points and modules exist", async () => {
  const required = [
    "apps/electrophysiology-lab/index.html",
    "apps/electrophysiology-lab/src/app.js",
    "apps/electrophysiology-lab/src/core/signal.js",
    "apps/neurocell-explorer/index.html",
    ".nojekyll",
    "CNAME",
  ];
  await Promise.all(required.map((file) => access(path.join(root, file))));
});

test("new HTML entry points have no broken local assets", async () => {
  const pages = ["index.html", "apps/electrophysiology-lab/index.html"];
  for (const page of pages) {
    const markup = await readFile(path.join(root, page), "utf8");
    const references = [...markup.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    const localReferences = references.filter(
      (reference) => !/^(?:https?:|mailto:|#)/.test(reference),
    );
    for (const reference of localReferences) {
      const cleanReference = reference.split("?")[0];
      const target = path.resolve(root, path.dirname(page), cleanReference);
      await access(target);
    }
  }
});
