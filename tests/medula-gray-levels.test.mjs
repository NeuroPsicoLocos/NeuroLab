import test from 'node:test';
import assert from 'node:assert/strict';
import { grayLevels, grayStructures, rexedLaminae, grayLevelSources, resolveGraySelection } from '../apps/medula-atlas/src/gray-level-content.js';
import { grayGeometry, grayTerritory, grayFocusViewBox } from '../apps/medula-atlas/src/gray-level-geometry.js';

test('the gray viewer compares four distinct cord segments with their own outlines', () => {
  assert.deepEqual(grayLevels.map(level => level.segment), ['C6', 'T3', 'L4', 'S3']);
  assert.equal(new Set(grayLevels.map(level => grayGeometry[level.id].outer)).size, 4);
  assert.equal(new Set(grayLevels.map(level => grayGeometry[level.id].gray)).size, 4);
});

test('segment-specific nuclei cannot remain selected in an unavailable level', () => {
  for (const id of ['clarke', 'lateral']) {
    assert.equal(resolveGraySelection('t3', 'structures', id).selected.id, id);
    for (const level of ['c6', 'l4', 's3']) {
      const selection = resolveGraySelection(level, 'structures', id);
      assert.equal(selection.changed, true);
      assert.equal(selection.selected.id, 'dorsal');
      assert.ok(selection.selected.levels.includes(level));
    }
  }
  assert.equal(resolveGraySelection('s3', 'structures', 'sacral-autonomic').selected.id, 'sacral-autonomic');
  for (const level of ['c6', 't3', 'l4']) {
    assert.notEqual(resolveGraySelection(level, 'structures', 'sacral-autonomic').selected.id, 'sacral-autonomic');
  }
});

test('common structures and Rexed selections persist across cord levels', () => {
  for (const level of grayLevels) {
    for (const id of ['canal', 'gelatinosa', 'motor']) {
      assert.equal(resolveGraySelection(level.id, 'structures', id).changed, false);
    }
    for (const lamina of rexedLaminae) {
      assert.equal(resolveGraySelection(level.id, 'laminae', lamina.id).selected.id, lamina.id);
    }
  }
  assert.equal(resolveGraySelection('unknown', 'structures', 'unknown').level.id, 't3');
  assert.equal(resolveGraySelection('unknown', 'structures', 'unknown').selected.id, 'dorsal');
});

test('every gray matter note resolves its scientific fields, levels and references', () => {
  for (const collection of [grayStructures, rexedLaminae]) {
    assert.equal(new Set(collection.map(item => item.id)).size, collection.length);
    for (const item of collection) {
      for (const field of ['anatomy', 'connectivity', 'function', 'clinical']) {
        assert.ok(item[field]?.length > 0, `${item.id}: ${field}`);
      }
      assert.ok(item.levels.length > 0);
      for (const levelId of item.levels) assert.ok(grayGeometry[levelId]);
      assert.ok(item.sources.length > 0);
      for (const sourceId of item.sources) assert.ok(grayLevelSources[sourceId]?.url.startsWith('https://'));
    }
  }
  assert.deepEqual(rexedLaminae.map(lamina => lamina.id), ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']);
  for (const level of grayLevels) {
    assert.ok(level.summary.length > 0 && level.observations.length > 0);
    for (const id of level.sources) assert.ok(grayLevelSources[id]);
  }
});

test('focus stays within the drawing, preserves aspect and respects anatomical sides', () => {
  for (const level of grayLevels) {
    for (const [mode, items] of [['structures', grayStructures], ['laminae', rexedLaminae]]) {
      for (const item of items.filter(item => item.levels.includes(level.id))) {
        const territory = grayTerritory(level.id, item.id, mode);
        assert.ok(territory.markup.length > 0, `${level.id}: ${item.id}`);
        const left = grayFocusViewBox(territory.bounds, 'left', territory.midline);
        const right = grayFocusViewBox(territory.bounds, 'right', territory.midline);
        for (const [x, y, width, height] of [left, right]) {
          assert.ok([x, y, width, height].every(Number.isFinite));
          assert.ok(x >= 0 && y >= 0 && x + width <= 600 && y + height <= 480);
          assert.ok(width >= 150 && width <= 600);
          assert.equal(width / height, 1.25);
        }
        if (territory.midline) assert.deepEqual(left, right);
        else assert.ok(Math.abs(left[0] + right[0] + left[2] - 600) < 1e-8);
      }
    }
  }
});
