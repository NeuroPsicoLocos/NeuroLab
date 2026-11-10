import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { simulate, rates } = require('../apps/nt-simulator/laboratorio-potenciales/model.js');
const protocols = [
 ['subthreshold',{amp:2},0],['suprathreshold',{amp:10},1],
 ['paired refractory',{amp:20,count:2,gap:4},1],
 ['paired recovered',{amp:20,count:2,gap:20},2],
 ['sustained 10',{amp:10,duration:45},3],
 ['sustained 20',{amp:20,duration:45},4]
];
for (const [name,p,expected] of protocols) test('HH teaching protocol: '+name,()=>{
 const a=simulate({...p,total:90}),b=simulate({...p,total:90},.005);
 assert.equal(a.spikes,expected);assert.equal(a.spikes,b.spikes);
 let error=0;
 for(let i=0;i<a.data.length;i++){
  const r=a.data[i];
  assert(Object.values(r).every(Number.isFinite));
  for(const key of ['m','h','n']) assert(r[key]>=0&&r[key]<=1);
  error=Math.max(error,Math.abs(r.v-b.data[2*i].v));
 }
 assert(error<.01,'halving integration step changes voltage by less than 0.01 mV');
});
test('HH rates have finite removable singularities',()=>{
 for(const v of [-40,-55])assert(rates(v).every(Number.isFinite));
});
