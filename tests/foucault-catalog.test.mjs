import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('Foucault and existing topology resource are adjacent without duplicating links',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 const group=html.split('<section class="learning-group"')[1].split('</section>')[0];
 assert.match(group,/apps\/foucault-lab\//);assert.match(group,/portal\.topology\.domain/);
 assert.equal((html.match(/href="apps\/foucault-lab\/"/g)||[]).length,1);
 assert.equal((html.match(/portal\.topology\.domain/g)||[]).length,1);
 assert.match(group,/No son enfoques equivalentes/);
 await access(new URL('apps/foucault-lab/index.html',root));
 const translations=await readFile(new URL('shared/i18n.js',root),'utf8');
 for(const [,k] of html.matchAll(/data-i18n="(portal\.(?:foucault|thought)\.[^"]+)"/g))assert.equal(translations.split('"'+k+'"').length-1,2,k);
});
