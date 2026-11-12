import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
test('NeuroGénesis has a catalog route and bilingual keys',async()=>{
 const portal=await read('index.html'),i18n=await read('shared/i18n.js');
 assert.match(portal,/href="apps\/neurogenesis\/"/);
 const keys=[...portal.matchAll(/data-i18n="(portal\.neurogenesis\.[^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(keys).size,8);
 for(const key of keys) assert.equal(i18n.split('"'+key+'"').length-1,2,key);
});
test('NeuroGénesis assets and anchor links resolve and IDs are unique',async()=>{
 const html=await read('apps/neurogenesis/index.html');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),id);
 for(const [,src] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(/^(https?:|mailto:|data:|\.\.\/)/.test(src))continue;
  await access(new URL('apps/neurogenesis/'+src.split('?')[0],root));
 }
 assert.equal((html.match(/href="\.\.\/\.\.\/#aprender"/g)||[]).length,2);
});
test('NeuroGénesis preserves educational references and local-only quiz storage',async()=>{
 const html=await read('apps/neurogenesis/index.html'),js=await read('apps/neurogenesis/app.js');
 assert.match(html,/who\.int/); assert.match(js,/localStorage/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon/);
 assert.match(js,/youtube-nocookie/);
});
