import test from 'node:test';
import assert from 'node:assert/strict';
import { localizationCases, localizationCase, initialLocalizationState, updateLocalizationState, localizationExplanationVisible, localizationCorrect } from '../apps/medula-atlas/src/localization-content.js';

test('the reverse activity reuses all five T3 zones, with neutral case names and three progressive hints', () => {
  assert.equal(localizationCases.length, 5);
  assert.deepEqual(localizationCases.map(item => item.zone).sort(), ['anterior', 'commissure', 'hemi-left', 'hemi-right', 'posterior']);
  for (const item of localizationCases) {
    const current = localizationCase(item.id);
    assert.equal(current.lesson.level, 'T3');
    assert.match(item.narrative, /Caso ficticio/);
    assert.doesNotMatch(item.narrative, /Brown|hemimédula|comisura|columnas posteriores|región anterior/i);
    assert.equal(item.hints.length, 3);
    assert.ok(current.lesson.sources.length >= 3);
  }
  assert.throws(() => localizationCase('unknown'), RangeError);
});

test('choosing a location never reveals the answer before checking', () => {
  let state = initialLocalizationState();
  assert.equal(updateLocalizationState(state, { type: 'check' }), state);
  assert.equal(updateLocalizationState(state, { type: 'guess', id: 'invalid' }), state);
  state = updateLocalizationState(state, { type: 'guess', id: 'hemi-right' });
  assert.equal(state.guess, 'hemi-right');
  assert.equal(state.submitted, null);
  assert.equal(localizationExplanationVisible(state), false);
  state = updateLocalizationState(state, { type: 'check' });
  assert.equal(localizationExplanationVisible(state), true);
  assert.equal(localizationCorrect(state), false);
  assert.equal(updateLocalizationState(state, { type: 'guess', id: 'posterior' }), state);
});

test('all five expected locations score correctly and the opposite hemicord is rejected', () => {
  for (const current of localizationCases) {
    let state = updateLocalizationState(initialLocalizationState(), { type: 'case', id: current.id });
    state = updateLocalizationState(state, { type: 'guess', id: current.zone });
    state = updateLocalizationState(state, { type: 'check' });
    assert.equal(localizationCorrect(state), true);
    if (current.zone.startsWith('hemi-')) {
      state = updateLocalizationState(state, { type: 'reset' });
      const opposite = current.zone === 'hemi-right' ? 'hemi-left' : 'hemi-right';
      state = updateLocalizationState(state, { type: 'guess', id: opposite });
      state = updateLocalizationState(state, { type: 'check' });
      assert.equal(localizationCorrect(state), false);
    }
  }
});

test('new cases and retry clear answers, proposals and hints while keeping the teacher mode', () => {
  let state = updateLocalizationState(initialLocalizationState(), { type: 'teacher', value: true });
  state = updateLocalizationState(state, { type: 'hint' });
  state = updateLocalizationState(state, { type: 'guess', id: 'posterior' });
  state = updateLocalizationState(state, { type: 'check' });
  for (const action of [{ type: 'case', id: 'case-02' }, { type: 'reset' }]) {
    const fresh = updateLocalizationState(state, action);
    assert.equal(fresh.teacher, true);
    assert.equal(fresh.guess, null);
    assert.equal(fresh.submitted, null);
    assert.equal(fresh.hints, 0);
    assert.equal(localizationExplanationVisible(fresh), false);
  }
});

test('only teacher mode reveals hints, bounded at three, and exiting clears hints and unsubmitted solutions', () => {
  let state = initialLocalizationState();
  assert.equal(updateLocalizationState(state, { type: 'hint' }), state);
  assert.equal(updateLocalizationState(state, { type: 'reveal' }), state);
  state = updateLocalizationState(state, { type: 'teacher', value: true });
  for (let index = 0; index < 8; index++) state = updateLocalizationState(state, { type: 'hint' });
  assert.equal(state.hints, 3);
  assert.equal(localizationExplanationVisible(state), false);
  state = updateLocalizationState(state, { type: 'reveal' });
  assert.equal(localizationExplanationVisible(state), true);
  state = updateLocalizationState(state, { type: 'teacher', value: false });
  assert.equal(state.hints, 0);
  assert.equal(localizationExplanationVisible(state), false);
});

test('teacher can conceal a submitted solution and student can still review their own checked answer', () => {
  let state = updateLocalizationState(initialLocalizationState(), { type: 'teacher', value: true });
  state = updateLocalizationState(state, { type: 'guess', id: 'posterior' });
  state = updateLocalizationState(state, { type: 'check' });
  state = updateLocalizationState(state, { type: 'reveal' });
  assert.equal(localizationExplanationVisible(state), false);
  state = updateLocalizationState(state, { type: 'teacher', value: false });
  assert.equal(localizationExplanationVisible(state), true);
  assert.equal(localizationCorrect(state), true);
});
