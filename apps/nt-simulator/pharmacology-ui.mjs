import {COURSE_PROFILES,COURSE_RECEPTORS} from './course-content.mjs';
import {FX_AGENTS,fxScenario,fxIllustration} from './pharmacology.mjs';
const fxNode=id=>document.getElementById(id),fxKey=document.body.dataset.course,fxProfile=COURSE_PROFILES[fxKey];
if(fxProfile){
 const agents=Object.entries(FX_AGENTS).filter(([,d])=>d.key===fxKey);let fxCompared=false;
 fxNode('fx-receptor').innerHTML=fxProfile.receptors.map(id=>`<option value="${id}">${COURSE_RECEPTORS[id].label}</option>`).join('');fxNode('fx-receptor').value=fxProfile.receptors[0];
 fxNode('fx-agent').innerHTML='<option value="reference">Sin intervención · referencia</option>'+agents.map(([id,d])=>`<option value="${id}">${d.label}</option>`).join('');fxNode('fx-agent').value='reference';
 const fxCard=(r,title)=>`<article><h3>${title}</h3><p><strong>Señal del transmisor:</strong> ${r.transmitter?'presente':'ausente'}.</p><p>${r.effect}</p><p><strong>Respuesta:</strong> ${r.response}</p></article>`;
 function fxPaint(){const receptor=fxNode('fx-receptor').value,agent=fxNode('fx-agent').value,present=fxNode('fx-present').checked,ref=fxScenario(fxKey,receptor,'reference',present),run=fxScenario(fxKey,receptor,agent,present),drug=FX_AGENTS[agent];
  fxNode('fx-description').textContent=drug?`${drug.why} ${drug.scope}`:'Referencia sin intervención. Elige una sustancia o clase, predice dónde actuará y compara con la misma señal de transmisor.';
  fxNode('fx-source').innerHTML=drug?`Fuente del mecanismo: <a href="${drug.source[1]}">${drug.source[0]}</a>.`:'Las fuentes se muestran al elegir una intervención.';
  fxNode('fx-picture').innerHTML=fxIllustration(fxCompared?run:ref);fxNode('fx-comparison').innerHTML=fxCard(ref,'Referencia')+(fxCompared?fxCard(run,'Intervención seleccionada'):'');return run;
 }
 function fxReference(){fxCompared=false;fxNode('fx-result').textContent='Referencia preparada: mismo receptor y misma señal del transmisor, sin intervención. Elige una predicción y compara.';fxPaint();}
 fxNode('fx-reference').onclick=fxReference;
 fxNode('fx-compare').onclick=()=>{if(!fxNode('fx-prediction').value){fxNode('fx-result').textContent='Elige una predicción antes de comparar.';fxNode('fx-prediction').focus();return;}
  fxCompared=true;const run=fxPaint();fxNode('fx-result').textContent=`${run.prediction===fxNode('fx-prediction').value?'Tu predicción coincide.':'Contrasta tu predicción con el mecanismo.'} ${run.effect} La comparación es cualitativa: no calcula ocupación, dosis, porcentajes ni una curva de voltaje farmacológica.`;
 };
 fxNode('fx-agent').onchange=()=>{fxNode('fx-prediction').value='';fxReference();};fxNode('fx-receptor').onchange=()=>{fxNode('fx-prediction').value='';fxReference();};fxNode('fx-present').onchange=()=>{fxNode('fx-prediction').value='';fxReference();};
 fxNode('fx-reset').onclick=()=>{fxNode('fx-agent').value='reference';fxNode('fx-receptor').value=fxProfile.receptors[0];fxNode('fx-present').checked=true;fxNode('fx-prediction').value='';fxReference();};fxReference();
}
