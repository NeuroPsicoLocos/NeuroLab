import {apExperiment,ntExperiment,NT_PROFILES,modulation,modulePlot,receptorIllustration} from './modules.mjs';
const $=id=>document.getElementById(id),page=document.body.dataset.module;
if(page==='ap'){
 let baseline=null;
 function paint(){const p={amplitude:+$('amplitude').value,na:+$('na').value,k:+$('k').value},r=apExperiment(p);baseline=r.reference;
 $('voltage-plot').innerHTML=modulePlot([{data:baseline.data,key:'v',color:'#8b9790',dash:true},{data:r.run.data,key:'v',color:'#28689b'}],{title:'Voltaje de membrana'});
 const bound=Math.max(100,...r.run.data.flatMap(d=>[Math.abs(d.ina),Math.abs(d.ik)]),...baseline.data.flatMap(d=>[Math.abs(d.ina),Math.abs(d.ik)]));
 $('current-plot').innerHTML=modulePlot([{data:baseline.data,key:'ina',color:'#8b9790',dash:true},{data:baseline.data,key:'ik',color:'#8b9790',dash:true},{data:r.run.data,key:'ina',color:'#6059a8'},{data:r.run.data,key:'ik',color:'#2d8060'}],{title:'Corrientes Na⁺ y K⁺',unit:'µA/cm²',min:-Math.ceil(bound/100)*100,max:Math.ceil(bound/100)*100});
 const correct=$('ap-prediction').value==='regeneration';
 $('ap-result').textContent=`${$('ap-prediction').value?(correct?'Tu explicación identifica el mecanismo. ':'Revisa el mecanismo: '):''}Referencia: ${baseline.spikes.length} disparo(s). Cambio: ${r.run.spikes.length} disparo(s). El Na⁺ sostiene la subida regenerativa; el K⁺ contribuye a repolarizar. Con un pulso pequeño puede haber una respuesta subumbral. Cambia una sola variable para atribuir el resultado.`;
 }
 $('ap-run').onclick=paint;$('ap-reset').onclick=()=>{$('amplitude').value='10';$('na').value='1';$('k').value='1';$('ap-prediction').value='';paint();};paint();
}
if(page==='transmitters'){
 const requested=document.body.dataset.initialTransmitter;const initialKey=Object.keys(NT_PROFILES).includes(requested)?requested:'gaba';
 $('transmitter').value=initialKey;$('target').value=NT_PROFILES[initialKey].receptor;
 function paint(){const r=ntExperiment($('transmitter').value,$('target').value);$('nt-description').textContent=r.profile.why;
 $('nt-plot').innerHTML=modulePlot([{data:r.reference.data,key:'w',color:'#8b9790',dash:true},{data:r.run.data,key:'w',color:'#28689b'}],{title:'Respuesta postsináptica pasiva',min:-80,max:-40});
 const predicted=$('nt-prediction').value==='specific';
 $('nt-result').textContent=`${$('nt-prediction').value?(predicted?'Predicción coherente. ':'Revisa la especificidad. '):''}${r.matched?'El par transmisor/receptor elegido coincide: hay respuesta en esta sinapsis reducida.':'Este par no coincide: no activamos ese receptor y la membrana permanece en reposo.'} La línea gris muestra el mismo transmisor con su receptor correcto. ${r.profile.ions}.`;
 $('nt-pair').textContent=`${r.profile.name} → ${$('target').value}`;
 }
 $('nt-run').onclick=paint;$('nt-match').onclick=()=>{$('target').value=NT_PROFILES[$('transmitter').value].receptor;paint();};$('transmitter').onchange=paint;$('target').onchange=paint;
 $('nt-reset').onclick=()=>{$('transmitter').value=initialKey;$('target').value=NT_PROFILES[initialKey].receptor;$('nt-prediction').value='';paint();};paint();
}
if(page==='modulators'){
 let kind='reference',frame=0;
 const kinds=['reference','bdz','barbiturate','alcohol'];
 function paint(){const r=modulation(kind,$('gaba-present').checked,$('alcohol-context').value==='sensitive');
 for(const k of kinds)$('mod-'+k).setAttribute('aria-pressed',String(k===kind));
 $('alcohol-context').disabled=kind!=='alcohol';
 $('mod-description').textContent=r.description;$('mod-scope').textContent=r.scope;
 const seq=values=>values.map((v,i)=>`<span class="${v?'open ':''}${i===frame?'current':''}" aria-label="${i===frame?'Estado actual: ':''}${v?'activo':'cerrado'}"></span>`).join('');
 $('reference-sequence').innerHTML=seq(r.reference);$('selected-sequence').innerHTML=kind==='alcohol'?(r.potentiation?'Potenciación en el contexto elegido; sin cinética asignada.':'No se fija un cambio GABA-A en este contexto.') :seq(r.selected);
 $('reference-receptor').innerHTML=receptorIllustration({open:!!r.reference[frame],ligand:r.gaba});
 $('selected-receptor').innerHTML=receptorIllustration({open:!!r.selected[frame],ligand:r.gaba,modulator:kind==='bdz'||kind==='barbiturate',site:kind,variant:'selected'});
 $('mod-progress').textContent=`Estado ilustrativo ${frame+1} de 12 · ${r.selected[frame]?'canal activo':'canal cerrado'}. No es un registro de canal ni un tiempo biológico.`;
 $('mod-previous').disabled=frame===0;$('mod-next').disabled=frame===11;
 $('mod-feedback').textContent=!$('mod-prediction').value?'Predice qué diferencia esperas y compárala con el esquema.':$('mod-prediction').value==='context'?'Coincide: pueden potenciar la respuesta mediante mecanismos distintos; el contexto importa especialmente para alcohol.':'La cantidad de GABA se mantiene. El modulador cambia la respuesta del receptor, y no todos los receptores responden igual.';
 $('nmda-note').hidden=kind!=='alcohol';
 }
 for(const k of kinds)$('mod-'+k).onclick=()=>{kind=k;frame=0;paint();};
 $('mod-next').onclick=()=>{frame=Math.min(11,frame+1);paint();};$('mod-previous').onclick=()=>{frame=Math.max(0,frame-1);paint();};
 $('gaba-present').onchange=paint;$('alcohol-context').onchange=paint;$('mod-check').onclick=paint;
 $('mod-reset').onclick=()=>{kind='reference';frame=0;$('gaba-present').checked=true;$('alcohol-context').value='uncertain';$('mod-prediction').value='';paint();};paint();
}
