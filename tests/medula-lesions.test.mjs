import test from 'node:test';
import assert from 'node:assert/strict';
import { lesionZones, lesionLesson, lesionSources, updateLesionState, lesionExplanationVisible } from '../apps/medula-atlas/src/lesion-content.js';
import { lesionFocusBounds } from '../apps/medula-atlas/src/lesion-geometry.js';
import { tracts } from '../apps/medula-atlas/src/content.js';

const initial = { zone: 'hemi-right', choice: null, teacher: false, reveal: false };

test('hemilesions reverse anatomical sides without reversing ipsilateral motor and column loss', () => {
  const right = lesionLesson('hemi-right'), left = lesionLesson('hemi-left');
  assert.match(right.signs[0].finding, /derecho/);
  assert.match(right.signs[1].finding, /derecho/);
  assert.match(right.signs[2].finding, /izquierdo/);
  assert.match(left.signs[0].finding, /izquierdo/);
  assert.match(left.signs[1].finding, /izquierdo/);
  assert.match(left.signs[2].finding, /derecho/);
  assert.deepEqual(right.affected.map(item => item.id), left.affected.map(item => item.id));
  assert.ok(right.affected.every(item => item.side === 'right'));
  assert.ok(left.affected.every(item => item.side === 'left'));
  assert.match(right.signs[2].scope, /uno o dos segmentos/);
});

test('anterior and posterior patterns preserve complementary key pathways', () => {
  const anterior = lesionLesson('anterior'), posterior = lesionLesson('posterior');
  const keys = entries => entries.map(item => item.id + ':' + item.side).sort();
  assert.deepEqual(keys(anterior.affected), keys(posterior.spared));
  assert.deepEqual(keys(anterior.spared), keys(posterior.affected));
  assert.deepEqual([...new Set(posterior.affected.map(item => item.id))].sort(), ['cuneatus', 'gracilis']);
});

test('commissural pattern targets crossing fibers and spares ascending tract territories', () => {
  const lesson = lesionLesson('commissure');
  assert.deepEqual(lesson.affected, [{ id: 'white-commissure', side: 'both' }]);
  assert.equal(lesson.spared.length, 8);
  assert.match(lesson.signs[2].finding, /segmentaria/);
  assert.match(lesson.clinical, /no equivale al síndrome medular central traumático/);
  assert.match(lesson.anatomy, /distinta de la comisura gris/);
});

test('all five cases have one valid answer, five scientific fields, sources and disjoint territories', () => {
  for (const zone of lesionZones) {
    const lesson = lesionLesson(zone.id);
    assert.equal(lesson.level, 'T3');
    assert.match(lesson.case, /Caso ficticio/);
    for (const field of ['anatomy', 'connectivity', 'function', 'clinical']) assert.ok(lesson[field].length > 20);
    assert.ok(lesson.sources.length >= 3 && lesson.sources.every(id => lesionSources[id]?.url.startsWith('https://')));
    assert.ok(lesson.answer >= 0 && lesson.answer < lesson.options.length);
    assert.equal(lesson.signs.length, 3);
    const affected = new Set(lesson.affected.map(item => item.id + ':' + item.side));
    assert.ok(lesson.spared.every(item => !affected.has(item.id + ':' + item.side)));
    assert.ok([...lesson.affected, ...lesson.spared].every(item => item.id === 'white-commissure' || tracts.some(tract => tract.id === item.id)));
    const [x, y, w, h] = lesionFocusBounds[zone.id];
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 600 && y + h <= 480);
  }
  assert.throws(() => lesionLesson('unknown'), RangeError);
});

test('student response reveals explanation once and switching or restarting removes it', () => {
  assert.equal(lesionExplanationVisible(initial), false);
  const answered = updateLesionState(initial, { type: 'answer', choice: 1 });
  assert.equal(lesionExplanationVisible(answered), true);
  assert.equal(updateLesionState(answered, { type: 'answer', choice: 0 }), answered);
  assert.equal(updateLesionState(initial, { type: 'answer', choice: 9 }), initial);
  assert.equal(lesionExplanationVisible(updateLesionState(answered, { type: 'reset' })), false);
  const next = updateLesionState(answered, { type: 'select', id: 'posterior' });
  assert.equal(next.choice, null);
  assert.equal(next.reveal, false);
  assert.equal(lesionExplanationVisible(next), false);
});

test('teacher can reveal and hide without answering; returning to student does not leak answers', () => {
  const teacher = updateLesionState(initial, { type: 'teacher', value: true });
  const revealed = updateLesionState(teacher, { type: 'reveal' });
  assert.equal(lesionExplanationVisible(revealed), true);
  assert.equal(lesionExplanationVisible(updateLesionState(revealed, { type: 'reveal' })), false);
  assert.equal(lesionExplanationVisible(updateLesionState(revealed, { type: 'teacher', value: false })), false);
  assert.equal(updateLesionState(initial, { type: 'reveal' }), initial);
  assert.equal(updateLesionState(revealed, { type: 'select', id: 'commissure' }).reveal, false);
});
