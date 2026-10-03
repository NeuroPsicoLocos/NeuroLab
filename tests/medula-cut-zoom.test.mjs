import test from 'node:test';
import assert from 'node:assert/strict';
import { fitCutViewBox } from '../apps/medula-atlas/src/cut-zoom.js';
import { transformTractBounds } from '../apps/medula-atlas/src/cross-section.js';
import { coveringFocusBounds } from '../apps/medula-atlas/src/covering-cut.js';
import { coverings } from '../apps/medula-atlas/src/anatomy-content.js';

test('shared cut focus preserves aspect and stays within frames with different origins', () => {
  for (const full of [[0, 0, 600, 480], [0, 0, 560, 460], [20, 60, 1254, 1110]]) {
    for (const bounds of [[0, 0, 2, 2], [530, 440, 80, 90], [365, 162, 44, 24], [0, 0, 1500, 1500]]) {
      const [x, y, width, height] = fitCutViewBox(bounds, full);
      assert.ok([x, y, width, height].every(Number.isFinite));
      assert.ok(x >= full[0] && y >= full[1]);
      assert.ok(x + width <= full[0] + full[2] + 1e-8);
      assert.ok(y + height <= full[1] + full[3] + 1e-8);
      assert.ok(width >= full[2] / 4 && width <= full[2]);
      assert.ok(Math.abs(width / height - full[2] / full[3]) < 1e-8);
    }
  }
});

test('tract coordinates keep the central reference and anatomical side reflection', () => {
  assert.deepEqual(transformTractBounds({x:627, y:640, width:0, height:0}), [300, 254, 0, 0]);
  const bounds = {x:934, y:374, width:178, height:222};
  const left = transformTractBounds(bounds, 'left');
  const right = transformTractBounds(bounds, 'right');
  assert.ok(Math.abs(left[0] + right[0] + left[2] - 600) < 1e-8);
  assert.equal(left[1], right[1]);
  assert.equal(left[2], right[2]);
  assert.equal(left[3], right[3]);
});

test('every covering and root has a valid focus region inside the diagram', () => {
  assert.deepEqual(Object.keys(coveringFocusBounds).sort(), coverings.map(item => item.id).sort());
  for (const [x, y, width, height] of Object.values(coveringFocusBounds)) {
    assert.ok(width > 0 && height > 0);
    assert.ok(x >= 0 && y >= 0 && x + width <= 560 && y + height <= 460);
  }
});
