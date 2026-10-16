(()=>{
const defaults=Object.freeze({amplitude:10,na:1,k:1,ca:1,receptors:1,receptor:'AMPA',reversal:0,interval:0,dt:0.01,duration:80});
const trap=(x,s)=>Math.abs(x)<1e-7?s:x/(-Math.expm1(-x/s));
function rates(v){return [0.1*trap(v+40,10),4*Math.exp(-(v+65)/18),0.07*Math.exp(-(v+65)/20),1/(1+Math.exp(-(v+35)/10)),0.01*trap(v+55,10),0.125*Math.exp(-(v+65)/80)];}
function simulate(options={}){
 const p={...defaults,...options};
 for(const key of ['amplitude','na','k','ca','receptors','reversal','interval','dt','duration'])if(!Number.isFinite(p[key]))throw Error('Parámetro no finito');
 if(p.dt<=0||p.dt>0.025||p.duration<20||p.duration>200||p.amplitude<0||p.amplitude>30||['na','k','ca','receptors'].some(x=>p[x]<0||p[x]>1)||p.interval<0||p.interval>40||p.reversal< -90||p.reversal>10||!['AMPA','GABA-A','nAChR'].includes(p.receptor))throw Error('Fuera del alcance del modelo');
 let v=-65, [am,bm,ah,bh,an,bn]=rates(v),m=am/(am+bm),h=ah/(ah+bh),n=an/(an+bn),c=0,T=0,r=0,w=-65,q=0;
 const data=[],spikes=[];const beta=p.receptor==='GABA-A'?0.18:0.6;
 const count=Math.round(p.duration/p.dt);
 if(count>100000)throw Error('Paso temporal fuera del presupuesto local de muestras');
 for(let i=0;i<=count;i++){
 const t=i*p.dt;const I=(t>=10&&t<11)||(p.interval>0&&t>=10+p.interval&&t<11+p.interval)?p.amplitude:0;
 const ina=120*p.na*m**3*h*(v-50),ik=36*p.k*n**4*(v+77),il=0.3*(v+54.387);
 // High-threshold terminal surrogate: exactly shut below -20 mV.
 const drive=v> -20?(v+20)/60:0;
 const dc=p.ca*drive-c/3;
 const release=drive>0?2*c**4/(0.2**4+c**4):0;
 const dr=1.1*T*(1-r)-beta*r;
 const gs=0.12*p.receptors*r, isyn=gs*(w-p.reversal);
 data.push({t,v,c,T,r,w,I,ina,ik,isyn,release,gs,q});
 if(i===count)break; // Do not advance or count events beyond the recorded endpoint.
 const old=v;v+=p.dt*(I-ina-ik-il);[am,bm,ah,bh,an,bn]=rates(old);
 m=am/(am+bm)+(m-am/(am+bm))*Math.exp(-(am+bm)*p.dt);
 h=ah/(ah+bh)+(h-ah/(ah+bh))*Math.exp(-(ah+bh)*p.dt);
 n=an/(an+bn)+(n-an/(an+bn))*Math.exp(-(an+bn)*p.dt);
 c+=p.dt*dc;T+=p.dt*(release-T/0.7);r+=p.dt*dr;w+=p.dt*(-0.1*(w+65)-isyn);q+=p.dt*release;
 if(old<0&&v>=0)spikes.push(t+p.dt);
 }
 return {p,data,spikes};
}
function metrics(run){const d=run.data;return {spikes:run.spikes.length,peak:d.reduce((a,x)=>Math.max(a,x.v),-Infinity),calcium:d.reduce((a,x)=>Math.max(a,x.c),-Infinity),transmitter:d.reduce((a,x)=>Math.max(a,x.T),-Infinity),post: d.reduce((a,x)=>Math.abs(x.w+65)>Math.abs(a+65)?x.w:a,-65),release:d.at(-1).q};}

const NT_PROFILES=Object.freeze({
 gaba:{name:'GABA',receptor:'GABA-A',reversal:-75,ions:'Cl⁻ y HCO₃⁻',why:'En el escenario de referencia el componente Cl⁻ entra. El receptor conduce aniones y acerca el voltaje a su reversión de −75 mV. No toda acción de GABA es idéntica: importan receptor y gradientes.'},
 glutamate:{name:'Glutamato',receptor:'AMPA',reversal:0,ions:'Na⁺ y K⁺',why:'AMPA es un canal catiónico. Con los gradientes habituales y voltaje negativo, Na⁺ entra y K⁺ sale; la corriente neta suele ser entrante. Su reversión didáctica aquí es 0 mV.'},
 ach:{name:'Acetilcolina',receptor:'nAChR',reversal:0,ions:'Cationes, incluidos Na⁺ y K⁺',why:'Se elige el receptor nicotínico, un canal catiónico. La acetilcolina también activa receptores muscarínicos, que usan proteína G; quedan para una ampliación.'}
});
function ntExperiment(key,receptor){
 const profile=NT_PROFILES[key],target=Object.values(NT_PROFILES).find(p=>p.receptor===receptor);
 if(!profile||!target)throw Error('Sinapsis fuera del alcance');
 const matched=profile.receptor===receptor;
 return {profile,matched,run:simulate({receptor,reversal:target.reversal,receptors:matched?1:0,duration:40}),reference:simulate({receptor:profile.receptor,reversal:profile.reversal,duration:40})};
}
function apExperiment({amplitude=10,na=1,k=1}={}){return {run:simulate({amplitude,na,k,duration:40}),reference:simulate({amplitude:10,na:1,k:1,duration:40})};}
const PATTERNS=Object.freeze({reference:[0,1,1,0,0,0,0,1,1,0,0,0],bdz:[0,1,1,0,1,1,0,1,1,0,0,0],barbiturate:[0,1,1,1,1,0,0,1,1,1,1,0]});
const MODULATORS=Object.freeze(['reference','bdz','barbiturate','alcohol']);
function modulation(kind='reference',gaba=true,sensitive=false){
 if(!MODULATORS.includes(kind)||typeof gaba!=='boolean'||typeof sensitive!=='boolean')throw Error('Modulador inválido');
 const chosen=kind==='alcohol'?PATTERNS.reference:PATTERNS[kind];
 const description={reference:'Sin modulador: referencia con la misma señal de GABA.',bdz:'Benzodiacepina (BDZ): en un receptor sensible, favorece la acción de GABA. El esquema representa más episodios de activación; la molécula moduladora ocupa un sitio distinto del de GABA.',barbiturate:'Barbitúrico: representamos episodios de activación más prolongados con GABA. Es una rama de potenciación; la activación directa descrita en otras condiciones queda fuera de esta escena.',alcohol:sensitive?'Alcohol: contexto experimental con potenciación GABA-A observada. Es un ejemplo condicionado, no una respuesta universal ni una equivalencia con BDZ.':'Alcohol: no se fija potenciación GABA-A. Distintas preparaciones dieron resultados diferentes; también hay evidencia de reducción de corriente NMDA, otro receptor de glutamato.'}[kind];
 return {kind,gaba,sensitive,potentiation:gaba&&(kind==='bdz'||kind==='barbiturate'||(kind==='alcohol'&&sensitive)),reference:gaba?[...PATTERNS.reference]:Array(12).fill(0),selected:gaba?[...chosen]:Array(12).fill(0),description,scope:!gaba?'Sin GABA: la rama de potenciación queda inactiva en este esquema. En barbitúricos se omiten las condiciones de activación directa.':'La señal de GABA se conserva. Solo cambia el contexto del receptor; no se aumenta la cantidad de neurotransmisor.'};
}
function modulePlot(series,{title='Resultado',unit='mV',min=-90,max=50}={}){
 const width=860,height=260,x=t=>65+t/40*770,y=v=>210-(v-min)/(max-min)*165;
 const ticks=Array.from({length:5},(_,i)=>min+(max-min)*i/4);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}. Eje horizontal tiempo en milisegundos, eje vertical ${unit}." font-family="Arial" font-size="14" fill="#28483f"><rect width="860" height="260" fill="#fff"/><text x="65" y="23" font-size="17">${title} · ${unit}</text>${ticks.map(v=>`<path d="M65,${y(v)}H835" stroke="#d8e3db"/><text x="10" y="${y(v)+5}">${Math.round(v)}</text>`).join('')}${[0,10,20,30,40].map(t=>`<text x="${x(t)-6}" y="232">${t}</text>`).join('')}<path d="M65,45V210H835" fill="none" stroke="#58786b"/>${series.map(s=>`<path data-series="${s.key}" d="${s.data.filter((_,i)=>i%10===0).map((d,i)=>`${i?'L':'M'}${x(d.t).toFixed(2)},${y(d[s.key]).toFixed(2)}`).join('')}" fill="none" stroke="${s.color}" stroke-width="2" ${s.dash?'stroke-dasharray="6 4"':''}/>`).join('')}<text x="707" y="254">Tiempo (ms)</text></svg>`;
}
function receptorIllustration({title='GABA-A',open=false,modulator=false,ligand=true,ion='Cl⁻',site='bdz',variant='reference'}={}){
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 240" role="img" aria-label="${title}, ${open?'activo':'cerrado'}. Dibujo conceptual, sin escala." font-family="Arial" font-size="17" fill="#28483f"><defs><linearGradient id="r-${variant}"><stop stop-color="#568c7c"/><stop offset=".5" stop-color="#b8d3a6"/><stop offset="1" stop-color="#568c7c"/></linearGradient></defs><rect width="430" height="240" rx="16" fill="#f5f5e9"/><path d="M0,140Q200,120 430,145V240H0Z" fill="#c6ddd2"/><path d="M0,140Q200,120 430,145" fill="none" stroke="#8aab92" stroke-width="15"/><text x="15" y="28">Exterior</text><text x="15" y="220">Interior</text><rect x="208" y="101" width="14" height="70" fill="${open?'#fff':'#6b9383'}"/><path d="M188,89Q166,110 185,161Q197,178 208,164V111Q204,91 188,89Z M242,89Q264,110 245,161Q233,178 222,164V111Q226,91 242,89Z" fill="url(#r-${variant})" stroke="#557d6d" stroke-width="2"/>${ligand?'<circle cx="183" cy="86" r="8" fill="#d99538"/><text x="85" y="76">GABA</text>':''}${modulator?`<g data-site="${site}" transform="translate(0 ${site==='barbiturate'?26:0})"><path d="M250,103l10,-9l10,9l-10,9Z" fill="#8a639c"/><text x="280" y="103">Modulador</text></g>`:''}<text x="155" y="202">${title}</text><text x="170" y="47">${open?'Canal activo':'Canal cerrado'}</text>${open?`<path d="M215,60V179m-6,-9l6,9l6,-9" fill="none" stroke="#245e98" stroke-width="2"/><text x="228" y="65">${ion}</text>`:''}</svg>`;
}

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

})();
