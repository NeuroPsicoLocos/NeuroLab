import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {COURSE_PROFILES} from './course-content.mjs';import {FX_AGENTS,fxScenario,fxIllustration} from './pharmacology.mjs';
function boot(key,all=false){
 const file={gaba:'index',glutamate:'glutamate',ach:'acetylcholine',dopamine:'dopamine',serotonin:'serotonin'}[key],html=readFileSync(new URL(`./${file}.html`,import.meta.url),'utf8'),ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1])),nodes=new Map(),timers=new Map();let serial=0;
 const values={'alcohol-context':'uncertain','c-speed':'1','c-window':'100','c-time':'30',mode:'both',speed:'1',voltage:'-65',chloride:'-75'};
 const $=id=>{assert.ok(ids.has(id),`${file}.html contains ${id}`);if(!nodes.has(id))nodes.set(id,{value:values[id]||'',checked:['gaba-present','fx-present'].includes(id),hidden:false,disabled:false,textContent:'',innerHTML:'',className:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;},focus(){this.focused=true;}});return nodes.get(id);};
 const context=vm.createContext({document:{getElementById:$,body:{dataset:{course:key,module:key==='gaba'?'modulators':key==='glutamate'||key==='ach'?'transmitters':undefined,initialTransmitter:key}}},setInterval(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearInterval(id){timers.delete(id);}});
 const scripts=all?['scene.bundle.js','modules.bundle.js','course.bundle.js','pharmacology.bundle.js']:['pharmacology.bundle.js'];for(const script of scripts)vm.runInContext(readFileSync(new URL(script,import.meta.url),'utf8'),context);
 return {$,timers};
}
test('Farmacología valida parejas y conserva el carácter cualitativo',()=>{
 assert.equal(Object.keys(FX_AGENTS).length,10);
 for(const [agent,d] of Object.entries(FX_AGENTS))for(const receptor of COURSE_PROFILES[d.key].receptors)for(const present of [false,true]){const r=fxScenario(d.key,receptor,agent,present);assert.equal(r.mode,'conceptual');assert.equal(r.transmitter,present);assert.equal(r.data,undefined);assert.ok(r.effect.length>50&&r.response.length>35);assert.deepEqual(r,fxScenario(d.key,receptor,agent,present));}
 for(const args of [['gaba','AMPA'],['ach','M1','haloperidol'],['ach','M1','missing'],['ach','M1','atropine',1]])assert.throws(()=>fxScenario(...args));
});
test('Antagonismos se aplican a la diana; no eliminan el transmisor',()=>{
 for(const [agent,d] of Object.entries(FX_AGENTS).filter(([,d])=>d.kind==='antagonist')){const r=fxScenario(d.key,d.targets[0],agent);assert.equal(r.prediction,'less');assert.equal(r.transmitter,true);const other=COURSE_PROFILES[d.key].receptors.find(id=>!d.targets.includes(id));assert.equal(fxScenario(d.key,other,agent).prediction,'no-target');assert.equal(fxScenario(d.key,d.targets[0],agent,false).prediction,'same');}
});
test('Agonistas compatibles pueden activar sin señal del neurotransmisor',()=>{
 for(const agent of ['baclofen','d1agonist']){const d=FX_AGENTS[agent],r=fxScenario(d.key,d.targets[0],agent,false);assert.equal(r.prediction,'activate');assert.equal(r.active,true);assert.equal(r.transmitter,false);}
 assert.equal(fxScenario('gaba','GABA-A','baclofen',false).active,false);
});
test('Retirada: AChE, DAT y SERT no son receptores y no crean transmisor',()=>{
 for(const agent of ['neostigmine','dat','fluoxetine']){const d=FX_AGENTS[agent];for(const receptor of d.targets){assert.equal(fxScenario(d.key,receptor,agent,true).prediction,'clearance');const r=fxScenario(d.key,receptor,agent,false);assert.equal(r.active,false);assert.equal(r.prediction,'same');}}
 assert.equal(fxScenario('ach','nAChR','atropine').prediction,'no-target');assert.equal(fxScenario('ach','nAChR','neostigmine').prediction,'clearance');
});
test('Dibujos señalan la diana correcta y no dibujan unión al receptor incompatible',()=>{
 for(const [agent,d] of Object.entries(FX_AGENTS)){const r=fxScenario(d.key,d.targets[0],agent);assert.match(fxIllustration(r),new RegExp(`data-fx-site="${d.site}"`));assert.doesNotMatch(fxIllustration(r),/NaN|undefined|Infinity/);const other=COURSE_PROFILES[d.key].receptors.find(id=>!d.targets.includes(id));if(other){const svg=fxIllustration(fxScenario(d.key,other,agent));assert.doesNotMatch(svg,/data-fx-site=/);assert.match(svg,/Esta diana no se aplica/);}}
});
test('UI Fx en cinco módulos: predicción, comparación, fuente y reinicio',()=>{
 for(const [key,p] of Object.entries(COURSE_PROFILES)){const {$}=boot(key);$('fx-compare').onclick();assert.equal($('fx-prediction').focused,true);for(const [agent,d] of Object.entries(FX_AGENTS).filter(([,d])=>d.key===key)){$('fx-agent').value=agent;$('fx-agent').onchange();$('fx-receptor').value=d.targets[0];$('fx-receptor').onchange();$('fx-prediction').value=fxScenario(key,d.targets[0],agent).prediction;$('fx-compare').onclick();assert.match($('fx-result').textContent,/predicción coincide/);assert.match($('fx-comparison').innerHTML,/Intervención seleccionada/);assert.match($('fx-source').innerHTML,/https:/);}
 $('fx-reset').onclick();assert.equal($('fx-agent').value,'reference');assert.equal($('fx-receptor').value,p.receptors[0]);assert.equal($('fx-present').checked,true);assert.equal($('fx-prediction').value,'');}
});
test('GABA integra cuatro bundles sin colisiones ni interferencias entre experimentos',()=>{
 const {$}=boot('gaba',true);$('mod-bdz').onclick();assert.equal($('mod-bdz').attributes['aria-pressed'],'true');$('c-receptor').value='GABA-B';$('c-receptor').onchange();$('fx-agent').value='baclofen';$('fx-agent').onchange();$('fx-receptor').value='GABA-B';$('fx-receptor').onchange();$('fx-present').checked=false;$('fx-present').onchange();$('fx-prediction').value='activate';$('fx-compare').onclick();assert.match($('fx-result').textContent,/predicción coincide/);assert.equal($('mod-bdz').attributes['aria-pressed'],'true');assert.equal($('c-receptor').value,'GABA-B');$('fx-reset').onclick();assert.equal($('c-receptor').value,'GABA-B');assert.equal($('mod-bdz').attributes['aria-pressed'],'true');
});
