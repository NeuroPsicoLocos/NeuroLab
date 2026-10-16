import '../apps/nt-simulator/model.test.mjs';
import '../apps/nt-simulator/scene.test.mjs';
import '../apps/nt-simulator/modules.test.mjs';
import '../apps/nt-simulator/course.test.mjs';
import '../apps/nt-simulator/pharmacology.test.mjs';
import '../apps/nt-simulator/navigation.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const base=new URL('../apps/nt-simulator/',import.meta.url);
const pages=['index','glutamate','acetylcholine','dopamine','serotonin','ap','transmitters','modulators','methods','sources'];
test('NT: public pilot pages resolve local resources and preserve scientific notices',()=>{
 for(const name of pages){
  const page=new URL(name+'.html',base),text=readFileSync(page,'utf8');
  assert.match(text,/piloto/i,name);
  assert.doesNotMatch(text,/\/Users\/|127\.0\.0\.1|localhost|sediment:|V4\.\d-REPORT\.md/,name);
  for(const [,ref] of text.matchAll(/(?:href|src)="([^"]+)"/g)){
   const target=new URL(ref,page);
   if(target.protocol!=='file:')continue;
   const path=fileURLToPath(target);assert.ok(existsSync(path),name+': '+ref);
   if(target.hash && path.endsWith('.html'))assert.ok(readFileSync(path,'utf8').includes('id="'+target.hash.slice(1)+'"'),name+': '+ref);
  }
 }
 const portal=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(portal,/href="apps\/nt-simulator\/"/);
 const method=readFileSync(new URL('methods.html',base),'utf8');
 assert.match(method,/no dispara/);assert.match(method,/pendiente/i);assert.match(method,/6,3/);
});
test('NT: all five public bundles match their numerical and presentation sources',()=>{
 execFileSync(process.execPath,[fileURLToPath(new URL('build.mjs',base)),'--check']);
});
