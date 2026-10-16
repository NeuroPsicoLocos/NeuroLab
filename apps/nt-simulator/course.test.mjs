import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {COURSE_PROFILES,COURSE_RECEPTORS,courseStage} from './course-content.mjs';
import {simulateCourse,courseExperiment,courseMetrics,coursePlot,courseSignal,nmdaAvailable} from './course-model.mjs';
import {renderCourse} from './course-render.mjs';
const allBranches=Object.entries(COURSE_PROFILES).flatMap(([key,p])=>p.receptors.map(receptor=>({key,receptor})));
const branches=allBranches.filter(o=>COURSE_RECEPTORS[o.receptor].kind!=='signal');
function boot(key){
 const file={gaba:'index',glutamate:'glutamate',ach:'acetylcholine',dopamine:'dopamine',serotonin:'serotonin'}[key],html=readFileSync(new URL(`./${file}.html`,import.meta.url),'utf8'),ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 const nodes=new Map(),timers=new Map();let serial=0;
 const initial={'c-change':'half-release','c-time':'30','c-speed':'1','c-window':'100'};
 const $=id=>{assert.ok(ids.has(id),`${file}.html contiene ${id}`);if(!nodes.has(id))nodes.set(id,{value:initial[id]||'',innerHTML:'',textContent:'',disabled:false,className:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;},focus(){this.focused=true;}});return nodes.get(id);};
 vm.runInNewContext(readFileSync(new URL('./course.bundle.js',import.meta.url),'utf8'),{document:{getElementById:$,body:{dataset:{course:key}}},setInterval(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearInterval(id){timers.delete(id);}});
 return {$,timers,tick(){assert.equal(timers.size,1);[...timers.values()][0].fn();}};
}
test('Reposo sin señal y bloqueo: todos los receptores conservan Vm',()=>{
 for(const o of branches){for(const change of [{release:0},{conductance:0}]){const r=simulateCourse({...o,...change});assert.ok(r.data.every(d=>d.v===-65&&d.current===0));if(change.release===0)assert.ok(r.data.every(d=>d.T===0&&d.bound===0&&d.z===0&&d.g===0));}
 const r=simulateCourse(o);assert.ok(r.data.filter(d=>d.t<=20).every(d=>d.T===0&&d.g===0));assert.ok(Math.abs(r.data.at(-1).v+65)<.02);}
});
test('Causalidad, límites físicos y reproducibilidad de la membrana pasiva',()=>{
 for(const o of branches){const a=simulateCourse(o);assert.deepEqual(a,simulateCourse(o));
 assert.ok(a.data.every(d=>[d.v,d.T,d.bound,d.z,d.g,d.current].every(Number.isFinite)&&d.T>=0&&d.bound>=0&&d.bound<=1&&d.z>=0&&d.z<=1&&d.g<=.1+1e-10));
 assert.ok(a.data.every(d=>d.v>=Math.min(-65,a.e)-1e-8&&d.v<=Math.max(-65,a.e)+1e-8));
 if(COURSE_RECEPTORS[o.receptor].kind==='fast')assert.ok(a.data.every(d=>d.z===0));
 }
});
test('Disminuir dt conserva picos y latencias de las nueve ramas',()=>{
 for(const o of branches){const m=[.1,.05,.025].map(dt=>courseMetrics(simulateCourse({...o,dt})));assert.ok(Math.abs(m[0].delta-m[2].delta)<.01);assert.ok(Math.abs(m[1].delta-m[2].delta)<=Math.abs(m[0].delta-m[2].delta)+1e-8);assert.ok(Math.abs(m[0].time-m[2].time)<.3);}
});
test('Menor entrada reduce respuesta; la reversión decide su dirección',()=>{
 for(const o of branches){let x=courseExperiment(o.key,o.receptor,'half-release');assert.ok(Math.abs(courseMetrics(x.changed).delta)<Math.abs(courseMetrics(x.reference).delta));
 x=courseExperiment(o.key,o.receptor,'reverse');assert.ok(courseMetrics(x.changed).delta*courseMetrics(x.reference).delta<0);
 x=courseExperiment(o.key,o.receptor,'block');assert.equal(courseMetrics(x.changed).delta,0);
 const eq=simulateCourse({...o,e:-65});assert.ok(eq.data.every(d=>d.v===-65&&d.current===0));assert.ok(eq.data.some(d=>d.g>0));}
});
test('Parámetros inválidos y pares de receptor incompatibles se rechazan',()=>{
 for(const o of [{dt:0},{dt:NaN},{conductance:2},{release:-1},{e:100},{key:'dopamine',receptor:'AMPA'},{duration:1},{dt:.0001}])assert.throws(()=>simulateCourse(o));
 assert.throws(()=>courseExperiment('gaba','GABA-A','drug'));assert.throws(()=>courseStage('gaba','AMPA',3));assert.throws(()=>courseStage('ach','nAChR',13));
});
test('Recorridos completos y retirada específica; ACh capta colina',()=>{
 for(const {key,receptor} of allBranches)for(let step=0;step<=12;step++){const text=courseStage(key,receptor,step);assert.ok(text[0].length>5&&text[1].length>90);assert.doesNotMatch(renderCourse(key,receptor,step),/undefined|NaN/);}
 assert.match(renderCourse('ach','nAChR',9),/data-enzyme="AChE-extracellular"/);assert.match(renderCourse('ach','nAChR',10),/data-uptake="choline"/);
 for(const key of ['glutamate','dopamine','serotonin'])assert.doesNotMatch(renderCourse(key,COURSE_PROFILES[key].receptors[0],9),/data-enzyme="AChE/);
 assert.match(renderCourse('dopamine','D2',0),/data-protein="Gi\/o" data-state="resting"/);assert.doesNotMatch(renderCourse('dopamine','D2',0),/data-flow/);assert.match(renderCourse('dopamine','D2',7),/data-flow="K-out"/);
 assert.doesNotMatch(renderCourse('serotonin','5-HT3',7),/data-protein="Gi\/o"/);
});
test('Equivalencia: cinco módulos arrancan con potenciales, unidades y cursor',()=>{
 for(const key of Object.keys(COURSE_PROFILES)){const {$}=boot(key);assert.match($('c-plot').innerHTML,/Potencial postsináptico/);assert.match($('c-current').innerHTML,/µA\/cm²/);assert.match($('c-snapshot').textContent,/mS\/cm²/);$('c-time').value='40';$('c-time').oninput();assert.match($('c-snapshot').textContent,/40.0 ms/);}
});
test('Predicción, comparación, cambio de receptor y reinicio en cada módulo',()=>{
 for(const key of Object.keys(COURSE_PROFILES)){const {$}=boot(key);$('c-compare').onclick();assert.equal($('c-prediction').focused,true);$('c-prediction').value='less';$('c-compare').onclick();assert.match($('c-result').textContent,/predicción coincide/);
 $('c-change').value='reverse';$('c-prediction').value='direction';$('c-compare').onclick();assert.match($('c-result').textContent,/invierte la dirección/);
 $('c-reset').onclick();assert.equal($('c-prediction').value,'');assert.equal($('c-receptor').value,COURSE_PROFILES[key].receptors[0]);assert.match($('c-result').textContent,/Referencia medida/);}
 const {$}=boot('gaba');$('c-receptor').value='GABA-B';$('c-receptor').onchange();assert.equal($('c-window').value,'800');assert.match($('c-snapshot').textContent,/GABA-B/);$('c-reset').onclick();assert.equal($('c-receptor').value,'GABA-A');
});
test('Recorridos nuevos: timer único, fin, pausa, zoom y reinicio',()=>{
 for(const key of ['glutamate','ach','dopamine','serotonin']){const {$,timers,tick}=boot(key);assert.equal($('c-prev').disabled,true);$('c-play').onclick();tick();$('c-speed').value='2';$('c-speed').onchange();assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,1750);for(let i=1;i<12;i++)tick();assert.equal(timers.size,0);assert.equal($('c-next').disabled,true);
 $('c-zoom').onclick();assert.equal($('c-zoom').attributes['aria-pressed'],'true');$('c-restart').onclick();assert.equal($('c-prev').disabled,true);assert.match($('c-step-label').textContent,/Etapa 1 de 13/);$('c-next').onclick();$('c-prev').onclick();assert.match($('c-step-label').textContent,/Etapa 1/);$('c-story-prediction').value='receptor';$('c-story-check').onclick();assert.match($('c-story-feedback').textContent,/Coincide/);}
});
test('Ventanas y gráficas: datos finitos, cursor y misma escala de comparación',()=>{
 const e=courseExperiment('serotonin','5-HT3','half-release');for(const f of ['v','current']){const svg=coursePlot(e.reference,e.changed,f,40,100);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);assert.match(svg,/Tiempo \(ms\)/);assert.match(svg,/>100<\/text>/);}
});
test('NMDA: bloqueo por Mg dependiente del voltaje y necesidad de coagonista',()=>{
 assert.ok(nmdaAvailable(-65)<nmdaAvailable(-40)&&nmdaAvailable(-40)<nmdaAvailable(0));assert.equal(nmdaAvailable(-65,0),1);assert.throws(()=>nmdaAvailable(-65,-1));
 const a=courseExperiment('glutamate','NMDA','no-mg');assert.ok(courseMetrics(a.changed).delta>courseMetrics(a.reference).delta);
 const b=courseExperiment('glutamate','NMDA','no-coagonist');assert.ok(b.changed.data.every(d=>d.g===0&&d.v===-65));assert.ok(b.changed.data.some(d=>d.bound>0));
 const d=courseExperiment('glutamate','NMDA','depolarize');assert.equal(d.changed.initial,-40);assert.ok(d.changed.data.every(x=>x.v>=-40));assert.ok(d.changed.data[0].available>d.reference.data[0].available);
 assert.throws(()=>courseExperiment('glutamate','AMPA','no-mg'));
});
test('Gs y Gq: estados cualitativos sin inventar una curva de voltaje',()=>{
 for(const {key,receptor} of allBranches.filter(o=>COURSE_RECEPTORS[o.receptor].kind==='signal')){
  const e=courseExperiment(key,receptor,'uncouple');assert.equal(e.mode,'conceptual');assert.ok(e.reference.states.every(s=>s.active));assert.equal(e.changed.states[0].active,true);assert.ok(e.changed.states.slice(1).every(s=>!s.active));assert.equal(e.changed.data,undefined);assert.throws(()=>simulateCourse({key,receptor}));assert.throws(()=>courseMetrics(e.reference));
  assert.ok(courseSignal(receptor,'no-transmitter').states.every(s=>!s.active));assert.throws(()=>courseSignal(receptor,'half-release'));
  const svg=renderCourse(key,receptor,7);assert.match(svg,/data-effector=/);assert.match(svg,/data-subunit="alpha" transform="translate\(116 0\)"/);assert.doesNotMatch(svg,/data-channel="GIRK"|data-flow=/);
 }
});
test('Cambiar receptor actualiza mecanismo, modo, controles y recorrido; volver restaura gráficas',()=>{
 for(const key of ['glutamate','ach','dopamine','serotonin']){const {$}=boot(key);for(const receptor of COURSE_PROFILES[key].receptors){$('c-receptor').value=receptor;$('c-receptor').onchange();const isSignal=COURSE_RECEPTORS[receptor].kind==='signal';assert.equal($('c-numeric').hidden,isSignal);assert.equal($('c-signal').hidden,!isSignal);assert.equal($('c-nmda').hidden,receptor!=='NMDA');assert.match($('c-step-label').textContent,/Etapa 1/);assert.ok($('c-route-description').textContent.length>100);
  $('c-change').value=isSignal?'uncouple':receptor==='NMDA'?'no-mg':'half-release';$('c-prediction').value=isSignal?'stopped':receptor==='NMDA'?'more':'less';$('c-compare').onclick();assert.match($('c-result').textContent,/predicción coincide/);if(isSignal){assert.equal($('c-plot').innerHTML,'');assert.match($('c-signal-picture').innerHTML,/Cambio seleccionado/);}else assert.match($('c-plot').innerHTML,/Potencial postsináptico/);
 }
 $('c-reset').onclick();assert.equal($('c-receptor').value,COURSE_PROFILES[key].receptors[0]);assert.equal($('c-numeric').hidden,false);assert.match($('c-plot').innerHTML,/Potencial postsináptico/);}
});
