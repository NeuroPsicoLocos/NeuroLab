import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {MODES,LAST,initialScene,sceneTransition,sceneEvents,sceneLigands,sceneText,sceneFeedback} from './state.mjs';
import {renderScene} from './render.mjs';
function boot(){
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));const nodes=new Map(),timers=new Map();let serial=0;
 const get=id=>{assert.ok(ids.has(id),`Control ${id} presente en index.html`);if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',disabled:false,attributes:{},setAttribute(name,value){this.attributes[name]=value;}});return nodes.get(id);};
 vm.runInNewContext(readFileSync(new URL('./scene.bundle.js',import.meta.url),'utf8'),{document:{getElementById:get},setInterval(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearInterval(id){timers.delete(id);}});
 return {$:get,timers,tick(){const active=[...timers.values()];assert.equal(active.length,1);active[0].fn();}};
}
test('La liberación precede a la unión, y la señal B precede a GIRK',()=>{
 for(const mode of MODES)for(let step=0;step<=LAST;step++){
  const e=sceneEvents({...initialScene(mode),step});
  if(step<3)assert.equal(sceneLigands(step).length,0);
  if(e.boundA||e.boundB)assert.ok(e.released);
  if(e.girk)assert.ok(e.b&&e.gi);
  if(step===5){assert.equal(e.girk,false);assert.equal(e.openA,mode!=='b');}
  if(step===8){assert.equal(e.boundA,false);assert.equal(e.boundB,false);assert.equal(e.openA,false);assert.equal(e.girk,mode!=='a');}
  if(step===LAST){assert.equal(e.released,false);assert.equal(e.gi,false);assert.equal(e.girk,false);}
 }
});
test('Cambiar receptores conserva la etapa y toda la liberación esquemática',()=>{
 for(let step=0;step<=LAST;step++){
  const s={...initialScene(),step,playing:true},ref=sceneLigands(step);
  for(const mode of MODES){const changed=sceneTransition(s,'mode',mode);assert.equal(changed.step,step);assert.equal(changed.playing,false);assert.deepEqual(sceneLigands(changed.step),ref);}
 }
});
test('Solo A y Solo B ocultan la otra vía sin dibujar un poro en B',()=>{
 const a=renderScene({...initialScene('a'),step:7}),b=renderScene({...initialScene('b'),step:7}),both=renderScene({...initialScene(),step:7});
 assert.match(a,/data-channel="a"/);assert.doesNotMatch(a,/data-receptor="GABA-B"|data-channel="girk"/);
 assert.doesNotMatch(b,/data-channel="a"/);assert.match(b,/data-receptor="GABA-B"/);assert.match(b,/data-channel="girk"/);
 assert.doesNotMatch(b,/data-channel="b"/);assert.match(both,/data-channel="a"/);assert.match(both,/data-channel="girk"/);
});
test('El relato distingue destinos intracelulares y feedback explica cada error',()=>{
 for(const mode of MODES)for(let step=0;step<=LAST;step++){const t=sceneText({...initialScene(mode),step});assert.equal(t.length,2);assert.ok(t[1].length>90);assert.ok(!renderScene({...initialScene(mode),step}).includes('undefined'));}
 assert.match(sceneText({...initialScene(),step:11})[1],/mitocondrias/);
 assert.match(renderScene({...initialScene(),step:11}),/Mitocondria/);
 assert.match(sceneFeedback('inside'),/por fuera/);assert.match(sceneFeedback('both-pore'),/no deja pasar iones/);assert.match(sceneFeedback('separate'),/canal separado/);
});
test('Límites, pausa, reinicio y estados inválidos',()=>{
 let s=initialScene();assert.equal(sceneTransition(s,'back').step,0);s={...s,step:LAST};assert.equal(sceneTransition(s,'next').step,LAST);assert.equal(sceneTransition(s,'play').step,0);
 assert.equal(sceneTransition({...s,playing:false},'tick').step,LAST);
 assert.throws(()=>sceneTransition(s,'speed',0));assert.throws(()=>sceneTransition(s,'mode','c'));assert.throws(()=>sceneTransition({...s,step:-1},'next'));
 s=sceneTransition({...s,mode:'b',speed:2,playing:true},'reset');assert.deepEqual(s,{mode:'b',step:0,playing:false,speed:2,vm:-65,eCl:-75});
});
test('Controles del bundle: un reloj, velocidad, comparación y fin automático',()=>{
 const {$,timers,tick}=boot();assert.equal($('previous').disabled,true);assert.equal(timers.size,0);
 $('play-pause').onclick();assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,3500);tick();assert.match($('progress').textContent,/Etapa 2/);
 $('speed').value='2';$('speed').onchange();assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,1750);
 $('mode').value='b';$('mode').onchange();assert.equal(timers.size,0);assert.match($('progress').textContent,/Etapa 2.*pausada/);
 $('play-pause').onclick();for(let i=1;i<LAST;i++)tick();assert.equal(timers.size,0);assert.equal($('next').disabled,true);assert.equal($('play-pause').textContent,'Reproducir');
 $('play-pause').onclick();assert.match($('progress').textContent,/Etapa 1/);$('play-pause').onclick();assert.equal(timers.size,0);
});
test('Predicción, anterior, avance manual y reinicio dejan el estado coherente',()=>{
 const {$,timers}=boot();$('prediction').value='inside';$('check').onclick();assert.match($('feedback').textContent,/por fuera/);
 $('next').onclick();$('next').onclick();$('previous').onclick();assert.match($('progress').textContent,/Etapa 2/);
 $('mode').value='a';$('mode').onchange();$('speed').value='0.5';$('speed').onchange();$('play-pause').onclick();$('reset').onclick();
 assert.equal(timers.size,0);assert.equal($('mode').value,'a');assert.equal($('speed').value,'0.5');assert.equal($('prediction').value,'');assert.equal($('previous').disabled,true);assert.match($('progress').textContent,/Etapa 1.*pausada/);
});

test('Gi/o existe como estructura alfa-beta-gamma en reposo y en etapa 6',()=>{
 for(const mode of ['both','b'])for(let step=0;step<=LAST;step++){
  const svg=renderScene({...initialScene(mode),step});
  assert.match(svg,/data-protein="Gi\/o"/);
  assert.match(svg,/data-subunit="alpha"><ellipse cx="648" cy="478"/);
  assert.match(svg,/data-subunit="beta-gamma"/);
  assert.match(svg,/>α<|>α<\/text>/);assert.match(svg,/>β<\/text>/);assert.match(svg,/>γ<\/text>/);
  assert.doesNotMatch(svg,/<g data-protein="Gi\/o"[^>]*(?:opacity="0"|display="none"|clip-path)/);
  assert.match(svg,step>=6&&step<=9?/data-state="active"/:/data-state="resting"/);
 }
 const {$}=boot();for(let i=0;i<5;i++)$('next').onclick();
 assert.match($('progress').textContent,/Etapa 6 de 13/);assert.match($('scene-picture').innerHTML,/data-protein="Gi\/o" data-state="resting"/);
 $('next').onclick();assert.match($('scene-picture').innerHTML,/data-state="active"/);assert.match($('scene-picture').innerHTML,/Gβγ regula GIRK/);
});
test('Navegación precede al dibujo y vista completa permite ampliar sin perder etapa',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('id="previous"')<html.indexOf('id="scene-picture"'));
 assert.ok(html.indexOf('id="stage-title"')<html.indexOf('id="previous"'));
 assert.equal((html.match(/id="next"/g)||[]).length,1);
 assert.match(html,/scene\.css\?v=4\.6/);assert.match(html,/scene\.bundle\.js\?v=4\.6/);
 const {$,timers}=boot();for(let i=0;i<5;i++)$('next').onclick();
 $('zoom').onclick();assert.equal($('scene-picture').className,'scene-scroll is-zoomed');assert.equal($('zoom').attributes['aria-pressed'],'true');
 assert.match($('progress').textContent,/Etapa 6 de 13/);assert.equal(timers.size,0);
 $('zoom').onclick();assert.equal($('scene-picture').className,'scene-scroll');assert.equal($('zoom').attributes['aria-pressed'],'false');
});

test('Controles de gradientes actualizan flechas y lectura sin perder la etapa',()=>{
 const {$}=boot();for(let i=0;i<7;i++)$('next').onclick();assert.match($('ion-reading').textContent,/ICl = \+1.00/);
 $('chloride').value='-45';$('chloride').onchange();assert.match($('progress').textContent,/Etapa 8 de 13/);assert.match($('scene-picture').innerHTML,/data-ion="Cl⁻" data-direction="out"/);
 $('voltage').value='-90';$('voltage').onchange();assert.match($('ion-reading').textContent,/IK idealizada = 0.00/);
 $('reset').onclick();assert.equal($('voltage').value,'-65');assert.equal($('chloride').value,'-75');assert.match($('ion-reading').textContent,/canal cerrado/);
});
