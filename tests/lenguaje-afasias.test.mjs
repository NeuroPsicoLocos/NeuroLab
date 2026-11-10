import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'apps/lenguaje-y-afasias');
const read = p => fs.readFileSync(path.join(appDir, p), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(read('js/data.js'), context);
const data = context.window.SITE;

test('Language teaching content retains three sessions and 39 topics', () => {
  assert.equal(data.SESSIONS.length, 3);
  assert.equal(data.SESSIONS.reduce((n, s) => n + s.topics.length, 0), 39);
  assert.deepEqual(Array.from(data.SESSIONS, s => s.id), ['s1', 's2', 's3']);
});
test('Language cases have unique identities and valid answer indices', () => {
  assert.equal(data.CASES.length, 8);
  assert.equal(new Set(data.CASES.map(c => c.id)).size, 8);
  for (const c of data.CASES) {
    assert(Number.isInteger(c.answer));
    assert(c.answer >= 0 && c.answer < c.options.length);
    assert(c.sol.length > 0);
    if (c.img) assert(fs.existsSync(path.join(appDir, c.img)), c.img);
  }
});
test('Eight aphasia syndrome profiles support the decision tree', () => {
  const ids = ['broca','tcmotora','global','tcmixta','conduccion','anomica','wernicke','tcsensorial'];
  assert.equal(data.SYNDROMES.length, 8);
  for (const id of ids) {
    const syndrome = data.SYNDROMES.find(s => s.id === id);
    assert(syndrome, id);
    assert.equal(syndrome.fcr.length, 3);
    assert.equal(syndrome.prof.length, 4);
    assert(syndrome.prof.every(n => Number.isFinite(n) && n >= 0 && n <= 5));
  }
});
test('Language map exposes its 13 regions and pathways', () => {
  const ids = ['a1','pstg','spt','smg','ag','pmtg','atl','ba44','ba45','ba47','vpmc','dorsal','ventral'];
  for (const id of ids) {
    assert(data.REGIONS[id]);
    assert(data.REGIONS[id].name && data.REGIONS[id].fn && data.REGIONS[id].les);
  }
});
test('Reference sections are retained', () => {
  assert.equal(data.REFS.s1.length, 68);
  assert.equal(data.REFS.s2.length, 52);
  assert.equal(data.REFS.s3.length, 41);
});
test('Hidden solutions and filtered cases override grid layouts', () => {
  assert.match(read('css/styles.css'), /\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/);
});
test('Language progress and theme use app-specific local storage', () => {
  const code = read('js/app.js');
  assert.match(code, /localStorage\.getItem\('lenguaje-afasias:' \+ k\)/);
  assert.match(code, /localStorage\.setItem\('lenguaje-afasias:' \+ k, JSON\.stringify\(v\)\)/);
  assert.doesNotMatch(code, /localStorage\.(getItem|setItem)\(k[,)]/);
});
test('NeuroLab catalog links the language module once inside learning grid', () => {
  const portal = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal((portal.match(/href="apps\/lenguaje-y-afasias\/"/g) || []).length, 1);
  assert.match(portal, /id="aprender" class="lab-track learn-track"/);
  const start = portal.indexOf('class="lab-grid learning-grid"');
  const end = portal.indexOf('<section id="principios"');
  assert(portal.indexOf('href="apps/lenguaje-y-afasias/"') > start);
  assert(portal.indexOf('href="apps/lenguaje-y-afasias/"') < end);
});
test('Language module provides two return links and the PPTX download', () => {
  const html = read('index.html');
  assert.equal((html.match(/href="\.\.\/\.\.\/#aprender"/g) || []).length, 2);
  assert(fs.existsSync(path.join(appDir, 'descargas/Lenguaje_y_afasias_3_sesiones.pptx')));
  assert(fs.statSync(path.join(appDir, 'descargas/Lenguaje_y_afasias_3_sesiones.pptx')).size > 0);
});
test('Language static resources referenced by HTML and content exist', () => {
  const source = ['index.html','js/app.js','js/data.js'].map(read).join('\n');
  const refs = [...source.matchAll(/(?:src|href)=["']((?:img|css|js|descargas)\/[^"'${]+)["']/g)];
  assert(refs.length > 0);
  for (const match of refs) assert(fs.existsSync(path.join(appDir, match[1])), match[1]);
});
