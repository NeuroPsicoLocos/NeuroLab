import {COURSE_PROFILES,COURSE_RECEPTORS,COURSE_LAST,courseStage,receptorRoute,receptorExplanation,RECEPTOR_SOURCES} from './course-content.mjs';
import {courseExperiment,courseMetrics,coursePlot,nmdaAvailable} from './course-model.mjs';
import {renderCourse} from './course-render.mjs';
const c=id=>document.getElementById(id),key=document.body.dataset.course,profile=COURSE_PROFILES[key];
if(profile){
 let receptor=profile.receptors[0],step=0,playing=false,timer=null,zoomed=false,windowMs=100,experiment,compared=false;
 const signal=()=>COURSE_RECEPTORS[receptor].kind==='signal';
 const options=items=>items.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
 c('c-receptor').innerHTML=options(profile.receptors.map(id=>[id,COURSE_RECEPTORS[id].label]));
 c('c-receptor-map').innerHTML=`<div class="table-scroll" tabindex="0" role="region" aria-label="Comparación de mecanismos por receptor"><table><caption>Receptores de ${profile.name}: mecanismo y alcance</caption><thead><tr><th>Receptor</th><th>Vía representada</th><th>Resultado disponible</th></tr></thead><tbody>${profile.receptors.map(id=>{const r=COURSE_RECEPTORS[id];return `<tr><th scope="row">${id}</th><td>${r.kind==='signal'?r.pathway==='gs'?'Gs → adenilil ciclasa → AMPc':'Gq → PLC → IP₃/DAG':r.kind==='meta'?'Gi/o → Gβγ → GIRK':id==='NMDA'?'Canal + coagonista + bloqueo por Mg²⁺':'Canal directo'}</td><td>${r.kind==='signal'?'Estados cualitativos; sin voltaje calculado':'Voltaje y corriente del modelo reducido'}</td></tr>`;}).join('')}</tbody></table></div>`;
 function stop(){if(timer!==null)clearInterval(timer);timer=null;playing=false;}
 function storyPaint(){if(key==='gaba')return;
  const [title,text]=courseStage(key,receptor,step);c('c-title').textContent=title;c('c-text').textContent=text;c('c-picture').innerHTML=renderCourse(key,receptor,step);
  c('c-step-label').textContent=`Etapa ${step+1} de ${COURSE_LAST+1} · ${playing?'reproduciendo':'pausada'}`;c('c-prev').disabled=step===0;c('c-next').disabled=step===COURSE_LAST;c('c-play').textContent=playing?'Pausar':'Reproducir';
 }
 const stateCard=(run,title)=>`<article><h3>${title}</h3><ol class="signal-path">${run.states.map(s=>`<li class="${s.active?'signal-on':'signal-off'}">${s.label}<span>${s.active?'Activación de esta rama':'Sin activación de esta rama'}</span></li>`).join('')}</ol><p>${run.conclusion}</p></article>`;
 function graphPaint(){
  if(signal()){c('c-signal-picture').innerHTML=stateCard(experiment.reference,'Referencia')+(compared?stateCard(experiment.changed,'Cambio seleccionado'):'');c('c-plot').innerHTML='';c('c-current').innerHTML='';return;}
  const cursor=+c('c-time').value;c('c-plot').innerHTML=coursePlot(experiment.reference,compared?experiment.changed:null,'v',cursor,windowMs);c('c-current').innerHTML=coursePlot(experiment.reference,compared?experiment.changed:null,'current',cursor,windowMs);
  const run=compared?experiment.changed:experiment.reference,d=run.data[Math.min(run.data.length-1,Math.round(cursor/run.dt))];
  c('c-snapshot').textContent=`${cursor.toFixed(1)} ms del modelo · Vm ${d.v.toFixed(2)} mV · I ${d.current.toFixed(3)} µA/cm² · g ${d.g.toFixed(4)} mS/cm². Receptor ${receptor}. Reposo del escenario ${run.initial} mV. ${receptor==='NMDA'?`Mg²⁺ ${run.mg} mM; coagonista ${run.coagonist?'presente':'ausente'}; fracción disponible ${(d.available*100).toFixed(1)} %.`:COURSE_RECEPTORS[receptor].kind==='meta'?'Rama K⁺ lineal idealizada; se omite la rectificación GIRK.':'Conductancia postsináptica reducida.'}`;
 }
 function setWindow(){windowMs=+c('c-window').value;c('c-time').max=String(windowMs);c('c-time').value=String(Math.min(windowMs,+c('c-time').value));graphPaint();}
 function reference(){compared=false;experiment=courseExperiment(key,receptor,'reference');c('c-result').textContent=signal()?`Referencia conceptual de ${receptor}: sigue los estados de la cadena. Se representan presencia y dirección de la señal, sin calcular concentraciones ni voltajes.`:`Referencia medida para ${receptor}: reversión ${experiment.reference.e} mV. Predice, cambia una variable y compara. Las cinéticas son elecciones del modelo; no comparan tiempos reales entre neurotransmisores.`;graphPaint();}
 function configure(){
  const r=COURSE_RECEPTORS[receptor];c('c-receptor').value=receptor;c('c-numeric').hidden=signal();c('c-signal').hidden=!signal();c('c-nmda').hidden=receptor!=='NMDA';
  c('c-experiment-title').textContent=signal()?`2. Señalización intracelular · ${receptor}`:`2. Potenciales y corrientes postsinápticas · ${receptor}`;
  c('c-route-description').textContent=receptorExplanation(receptor);c('c-route-scope').textContent=profile.scope;c('c-route-map').innerHTML=receptorRoute(receptor).map(t=>`<li>${t}</li>`).join('');
  c('c-route-sources').innerHTML=(RECEPTOR_SOURCES[receptor]||profile.sources).map(([label,url])=>`<a href="${url}">${label}</a>`).join(' · ');
  c('c-experiment-help').textContent=signal()?'Predice si la cadena continuará. Mide la referencia y cambia solo presencia de transmisor o acoplamiento con proteína G. Observa qué eslabones siguen activos y explica por qué no se puede deducir un voltaje.':'Mide la referencia gris, predice y compara. Observa voltaje y corriente. Mueve el cursor: la línea naranja y la lectura numérica corresponden a la misma muestra. Cada cambio modifica una sola variable.';
  c('c-prediction').innerHTML=options(signal()?[['','Elige antes de comparar'],['stopped','La señal se interrumpirá antes del mensajero'],['continue','La cadena conservará su activación']]:[['','Elige antes de comparar'],['less','La desviación del reposo será menor'],['more','La desviación del reposo será mayor'],['direction','La desviación cambiará de dirección'],['same','Se reproducirá la referencia']]);c('c-prediction').value='';
  c('c-change').innerHTML=options(signal()?[['uncouple','Interrumpir acoplamiento receptor–proteína G'],['no-transmitter','Retirar la señal de transmisor'],['reference','Mantener referencia']]:[['half-release','Liberar 50 % de la entrada de referencia'],['block','Conductancia de esta vía 0 %'],['reverse','Cambiar solo la reversión'],...(receptor==='NMDA'?[['no-mg','Retirar Mg²⁺: 1 → 0 mM'],['no-coagonist','Retirar coagonista: presente → ausente'],['depolarize','Cambiar reposo del escenario: −65 → −40 mV']]:[]),['reference','Mantener referencia']]);c('c-change').value=signal()?'uncouple':'half-release';
  windowMs=r.kind==='meta'?800:100;c('c-window').value=String(windowMs);c('c-time').max=String(windowMs);c('c-time').value='30';
  c('c-nmda-values').textContent=`A Mg²⁺ = 1 mM, fracción disponible del modelo: −65 mV ${(100*nmdaAvailable(-65)).toFixed(1)} %; −40 mV ${(100*nmdaAvailable(-40)).toFixed(1)} %; 0 mV ${(100*nmdaAvailable(0)).toFixed(1)} %. A Mg²⁺ = 0 mM vale 100 %. Se necesita además activación por transmisor y coagonista.`;
  reference();storyPaint();
 }
 c('c-reference').onclick=reference;
 c('c-compare').onclick=()=>{
  if(!c('c-prediction').value){c('c-result').textContent='Elige una predicción antes de comparar y observa el porqué del resultado.';c('c-prediction').focus();return;}
  const change=c('c-change').value;experiment=courseExperiment(key,receptor,change);compared=true;
  if(signal()){const expected=change==='reference'?'continue':'stopped';c('c-result').textContent=`${c('c-prediction').value===expected?'Tu predicción coincide.':'Compara el resultado con tu predicción.'} ${experiment.changed.conclusion} Es una comparación cualitativa: no se asignan amplitudes, tiempos biológicos ni un potencial a esos estados.`;graphPaint();return;}
  const a=courseMetrics(experiment.reference),b=courseMetrics(experiment.changed),expected=change==='reverse'?'direction':change==='reference'?'same':Math.abs(b.delta)>Math.abs(a.delta)?'more':'less';
  const why={'reverse':'Cambiar la reversión invierte la dirección respecto al reposo sin cambiar el neurotransmisor.','block':'Sin conductancia de esta vía no hay corriente postsináptica, aunque siga presente el transmisor.','half-release':'Menos entrada activa menos la vía en este modelo; la respuesta no tiene por qué reducirse exactamente a la mitad.','reference':'Con parámetros iguales se reproduce la referencia.','no-mg':'Retirar Mg²⁺ elimina este bloqueo del poro; siguen siendo necesarios transmisor y coagonista.','no-coagonist':'Sin coagonista se anula la conductancia NMDA en este modelo, aunque haya glutamato.','depolarize':'A voltajes menos negativos disminuye el bloqueo por Mg²⁺. También cambia la fuerza impulsora. Se comparan desviaciones respecto al reposo propio de cada escenario; no es un experimento de fijación de voltaje.'}[change];
  c('c-result').textContent=`${c('c-prediction').value===expected?'Tu predicción coincide.':'Compara el resultado con tu predicción.'} Cambio máximo desde el reposo de cada escenario: referencia ${a.delta.toFixed(2)} mV; cambio ${b.delta.toFixed(2)} mV. ${why} La membrana es pasiva: no puede disparar ni demostrar excitabilidad.`;graphPaint();
 };
 c('c-receptor').onchange=()=>{stop();receptor=c('c-receptor').value;step=0;configure();};
 c('c-time').oninput=graphPaint;c('c-window').onchange=setWindow;
 c('c-reset').onclick=()=>{stop();receptor=profile.receptors[0];step=0;configure();};
 if(key!=='gaba'){
  c('c-prev').onclick=()=>{stop();step=Math.max(0,step-1);storyPaint();};c('c-next').onclick=()=>{stop();step=Math.min(COURSE_LAST,step+1);storyPaint();};
  const start=()=>{stop();playing=true;if(step===COURSE_LAST)step=0;timer=setInterval(()=>{step=Math.min(COURSE_LAST,step+1);if(step===COURSE_LAST)stop();storyPaint();},3500/+c('c-speed').value);storyPaint();};
  c('c-play').onclick=()=>{if(playing){stop();storyPaint();}else start();};c('c-speed').onchange=()=>{if(playing)start();};
  c('c-restart').onclick=()=>{stop();step=0;c('c-story-prediction').value='';c('c-story-feedback').textContent='Haz una predicción y contrástala con la escena.';storyPaint();};
  c('c-zoom').onclick=()=>{zoomed=!zoomed;c('c-picture').className=zoomed?'scene-scroll is-zoomed':'scene-scroll';c('c-zoom').setAttribute('aria-pressed',String(zoomed));c('c-zoom').textContent=zoomed?'Ver corte completo':'Ampliar dibujo';};
  c('c-story-check').onclick=()=>{const answer=c('c-story-prediction').value;c('c-story-feedback').textContent=!answer?'Elige una predicción antes de comprobar.':answer==='receptor'?'Coincide: un canal directo y una vía por proteína G actúan de manera distinta; el receptor y la maquinaria celular determinan qué respuesta puede calcularse. La retirada depende también del transmisor.':'Revisa el receptor y su mecanismo. Una señal intracelular no equivale automáticamente a un voltaje; tampoco hay una polaridad universal del transmisor.';};
 }
 configure();
}
