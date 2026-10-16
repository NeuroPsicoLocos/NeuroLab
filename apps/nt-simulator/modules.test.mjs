import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {ionCurrents,ionReading,renderIonFlow} from './ions.mjs';
import {sceneEvents,initialScene,sceneTransition} from './state.mjs';
import {apExperiment,ntExperiment,modulation,modulePlot} from './modules.mjs';
function boot(page,dedicated){const file=dedicated||{ap:'ap',transmitters:'transmitters',modulators:'modulators'}[page];const html=readFileSync(new URL(`./${file}.html`,import.meta.url),'utf8');const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));const nodes=new Map();const values={amplitude:'10',na:'1',k:'1',transmitter:'gaba',target:'GABA-A','alcohol-context':'uncertain'};const get=id=>{assert.ok(ids.has(id),`Control ${id} presente en ${file}.html`);if(!nodes.has(id))nodes.set(id,{value:values[id]||'',checked:id==='gaba-present',hidden:false,disabled:false,textContent:'',innerHTML:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;}});return nodes.get(id);};vm.runInNewContext(readFileSync(new URL('./modules.bundle.js',import.meta.url),'utf8'),{document:{getElementById:get,body:{dataset:{module:page,initialTransmitter:html.match(/data-initial-transmitter="([^"]+)"/)?.[1]}}}});return get;}
test('Cl y K: carga, signo de corriente, reversión y canales cerrados',()=>{
 let c=ionCurrents({vm:-65,eCl:-75,openA:true,girk:true});assert.equal(c.cl,1);assert.equal(c.k,1.25);assert.equal(c.clDirection,'in');assert.equal(c.kDirection,'out');
 c=ionCurrents({vm:-65,eCl:-45,openA:true,girk:true});assert.equal(c.cl,-2);assert.equal(c.clDirection,'out');assert.equal(c.kDirection,'out');
 c=ionCurrents({vm:-90,eCl:-75,openA:true,girk:true});assert.equal(c.k,0);assert.equal(c.kDirection,'none');
 c=ionCurrents({vm:-100,girk:true});assert.equal(c.kDirection,'in');
 c=ionCurrents({vm:-65});assert.equal(c.cl,0);assert.equal(c.k,0);assert.equal(c.clDirection,'none');
 assert.throws(()=>ionCurrents({vm:NaN}));assert.throws(()=>ionCurrents({eCl:0}));
});
test('Flechas y lectura siguen apertura y gradientes; reinicio recupera referencia',()=>{
 let s={...initialScene(),step:7};let e=sceneEvents(s);assert.match(renderIonFlow(s,e),/data-ion="Cl⁻" data-direction="in"/);assert.match(renderIonFlow(s,e),/data-ion="K⁺" data-direction="out"/);assert.match(ionReading(s,e),/ICl = \+1.00/);
 s=sceneTransition(s,'chloride',-45);assert.match(renderIonFlow(s,sceneEvents(s)),/data-ion="Cl⁻" data-direction="out"/);
 s=sceneTransition(s,'voltage',-90);assert.match(renderIonFlow(s,sceneEvents(s)),/K⁺: sin flujo neto/);
 s=sceneTransition(s,'reset');assert.equal(s.vm,-65);assert.equal(s.eCl,-75);assert.doesNotMatch(renderIonFlow(s,sceneEvents(s)),/data-ion/);
});
test('Motor AP separado: subumbral, supraumbral, Na bloqueado y K reducido',()=>{
 assert.equal(apExperiment({amplitude:2}).run.spikes.length,0);assert.ok(apExperiment().run.spikes.length>0);assert.equal(apExperiment({na:0}).run.spikes.length,0);
 const r=apExperiment({k:0.5});assert.notDeepEqual(r.run.data.map(d=>d.v),r.reference.data.map(d=>d.v));assert.equal(r.reference.p.amplitude,10);
 assert.deepEqual(apExperiment().run,apExperiment().reference);
});
test('Especificidad NT y reversión: transmisor incorrecto no activa receptor',()=>{
 for(const [nt,receptor] of [['gaba','GABA-A'],['glutamate','AMPA'],['ach','nAChR']]){const r=ntExperiment(nt,receptor);assert.equal(r.matched,true);assert.deepEqual(r.run,r.reference);}
 const mismatch=ntExperiment('glutamate','GABA-A');assert.equal(mismatch.matched,false);assert.ok(mismatch.run.data.every(d=>d.w===-65));
 assert.ok(Math.min(...ntExperiment('gaba','GABA-A').run.data.map(d=>d.w))< -65);assert.ok(Math.max(...ntExperiment('glutamate','AMPA').run.data.map(d=>d.w))> -65);
 assert.throws(()=>ntExperiment('dopamine','AMPA'));
});
test('Moduladores: episodios distintos, GABA constante y alcohol condicionado',()=>{
 const episodes=p=>p.filter((v,i)=>v&&!p[i-1]).length;
 const bdz=modulation('bdz'),barb=modulation('barbiturate'),ref=modulation();
 assert.ok(episodes(bdz.selected)>episodes(ref.reference));assert.equal(episodes(barb.selected),episodes(ref.reference));assert.ok(barb.selected.filter(Boolean).length>ref.reference.filter(Boolean).length);
 assert.deepEqual(bdz.reference,barb.reference);assert.deepEqual(modulation('alcohol').selected,ref.reference);assert.deepEqual(modulation('alcohol',true,true).selected,ref.reference);assert.equal(modulation('alcohol',true,true).potentiation,true);assert.equal(modulation('alcohol').potentiation,false);
 for(const k of ['reference','bdz','barbiturate','alcohol'])assert.ok(modulation(k,false).selected.every(x=>x===0));
 assert.match(modulation('barbiturate',false).scope,/activación directa/);assert.throws(()=>modulation('combined'));
});
test('UI AP: comparación, predicción, unidades y reinicio',()=>{
 const $=boot('ap');assert.match($('voltage-plot').innerHTML,/Tiempo \(ms\)/);assert.match($('current-plot').innerHTML,/µA\/cm²/);
 $('amplitude').value='2';$('ap-prediction').value='regeneration';$('ap-run').onclick();assert.match($('ap-result').textContent,/Cambio: 0 disparo/);assert.match($('ap-result').textContent,/identifica/);
 $('ap-reset').onclick();assert.equal($('amplitude').value,'10');assert.equal($('ap-prediction').value,'');assert.match($('ap-result').textContent,/Cambio: 1 disparo/);
});
test('UI NT: cambiar transmisor, emparejar receptor y reiniciar',()=>{
 const $=boot('transmitters');$('transmitter').value='glutamate';$('transmitter').onchange();assert.match($('nt-result').textContent,/no coincide/);$('nt-match').onclick();assert.equal($('target').value,'AMPA');assert.match($('nt-result').textContent,/coincide: hay respuesta/);
 $('transmitter').value='ach';$('nt-match').onclick();assert.equal($('target').value,'nAChR');$('nt-reset').onclick();assert.equal($('target').value,'GABA-A');
});
test('UI moduladores: seleccionar, avanzar, comparar contexto, GABA y reinicio',()=>{
 const $=boot('modulators');assert.equal($('mod-previous').disabled,true);assert.equal($('alcohol-context').disabled,true);
 $('mod-bdz').onclick();assert.equal($('mod-bdz').attributes['aria-pressed'],'true');for(let i=0;i<11;i++)$('mod-next').onclick();assert.equal($('mod-next').disabled,true);$('mod-previous').onclick();assert.match($('mod-progress').textContent,/11 de 12/);
 $('mod-alcohol').onclick();assert.equal($('alcohol-context').disabled,false);assert.equal($('nmda-note').hidden,false);$('alcohol-context').value='sensitive';$('alcohol-context').onchange();assert.match($('mod-description').textContent,/observada/);
 $('gaba-present').checked=false;$('gaba-present').onchange();assert.match($('mod-scope').textContent,/Sin GABA/);assert.doesNotMatch($('selected-receptor').innerHTML,/Canal activo/);
 $('mod-prediction').value='context';$('mod-check').onclick();assert.match($('mod-feedback').textContent,/Coincide/);$('mod-reset').onclick();assert.equal($('gaba-present').checked,true);assert.equal($('mod-reference').attributes['aria-pressed'],'true');assert.equal($('nmda-note').hidden,true);
});
test('Gráficas muestran solo series con ejes, unidades y datos finitos',()=>{
 const r=apExperiment();const svg=modulePlot([{key:'v',data:r.run.data,color:'#123'}]);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);assert.match(svg,/data-series="v"/);assert.match(svg,/Tiempo \(ms\)/);
});

test('Accesos Glutamato y Acetilcolina abren su par correcto y reinician dentro del módulo',()=>{
 for(const [file,key,receptor,label] of [['glutamate','glutamate','AMPA','Glutamato'],['acetylcholine','ach','nAChR','Acetilcolina']]){
  const $=boot('transmitters',file);
  assert.equal($('transmitter').value,key);assert.equal($('target').value,receptor);assert.match($('nt-pair').textContent,new RegExp(label));assert.match($('nt-result').textContent,/coincide: hay respuesta/);
  $('target').value='GABA-A';$('target').onchange();assert.match($('nt-result').textContent,/no coincide/);
  $('nt-reset').onclick();assert.equal($('transmitter').value,key);assert.equal($('target').value,receptor);assert.match($('nt-result').textContent,/coincide: hay respuesta/);
 }
});
