import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
test('attention is linked once in catalog and translated',async()=>{
 const html=await read('index.html'),i18n=await read('shared/i18n.js');
 assert.equal((html.match(/href="apps\/laboratorio-atencion\/"/g)||[]).length,1);
 const keys=[...html.matchAll(/data-i18n="(portal\.atencion\.[^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(keys).size,8);for(const k of keys)assert.equal(i18n.split('"'+k+'"').length-1,2);
});
test('attention runtime is static, local, and includes licenses and disclaimers',async()=>{
 const html=await read('apps/laboratorio-atencion/index.html'),src=await read('apps/laboratorio-atencion/src/App.tsx');
 assert.match(html,/<html lang="es">/);assert.match(html,/<noscript>/);
 assert.match(src,/no son baremos/);assert.match(src,/href="\.\.\/\.\.\/#aprender"/);
 assert.doesNotMatch(src,/fetch\(|localStorage|sendBeacon|next\/|https:/);
 for(const p of ['app.bundle.js','styles.css','licenses/react-LICENSE.txt','licenses/react-dom-LICENSE.txt','licenses/scheduler-LICENSE.txt'])await access(new URL('apps/laboratorio-atencion/'+p,root));
});

test('attention uses NeuroLab branding in source and deployed bundle',async()=>{
 for(const p of ['src/App.tsx','app.bundle.js']){
  const text=await read('apps/laboratorio-atencion/'+p);
  assert.doesNotMatch(text,/centro\s*k/i);assert.match(text,/NEUROLAB/);
 }
});
