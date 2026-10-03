import test from 'node:test';
import assert from 'node:assert/strict';
import { regions, coverings, anatomySources, buildSpinalSegments } from '../apps/medula-atlas/src/anatomy-content.js';
import { questions, structures } from '../apps/medula-atlas/src/content.js';

test('spinal segmentation has 31 distinct pairs including C8 and Co1',()=>{
  const segments=buildSpinalSegments();
  assert.equal(segments.length,31);
  assert.equal(new Set(segments.map(s=>s.label)).size,31);
  assert.deepEqual(regions.map(r=>r.count),[8,12,5,5,1]);
  assert.ok(segments.some(s=>s.label==='C8'));
  assert.ok(segments.some(s=>s.label==='Co1'));
  assert.ok(!segments.some(s=>s.label==='C9'));
});

test('lower roots descend beyond their cord origin in the longitudinal comparison',()=>{
  for(const segment of buildSpinalSegments().filter(s=>['lumbar','sacral','coccygeal'].includes(s.region))) {
    assert.ok(Number.isFinite(segment.origin)&&Number.isFinite(segment.exit));
    assert.ok(segment.exit>segment.origin,segment.label);
  }
});

test('anatomy notes have five scientific fields and resolve their sources',()=>{
  for(const item of [...regions,...coverings]) {
    for(const field of ['anatomy','connectivity','function','clinical']) assert.ok(item[field]?.length>0,`${item.id}: ${field}`);
    assert.ok(item.sources.length>0);
    for(const id of item.sources) assert.ok(anatomySources[id]?.url.startsWith('https://'));
  }
  for(const item of coverings) assert.equal(structures[item.id].name,item.name);
});

test('self-assessment includes regions, meninges and roots with valid answer keys',()=>{
  assert.equal(questions.length,12);
  for(const q of questions) {
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
    assert.ok(q.explanation.length>0);
  }
});
