import {COURSE_PROFILES,COURSE_RECEPTORS,receptorRoute} from './course-content.mjs';
export const COURSE_PARAMETERS=Object.freeze({cm:1,gLeak:0.05,eLeak:-65,gMax:0.1,alpha:1,beta:0.2,clearance:0.5,inputRate:0.5,pulseStart:20,pulseEnd:22,tauRise:40,tauFall:120,duration:800,dt:0.1,mgScale:4,mgSlope:0.06});
// Reduced equilibrium block: chosen coefficients, not a fit to a particular preparation.
export function nmdaAvailable(v,mg=1){if(!Number.isFinite(v)||!Number.isFinite(mg)||mg<0||mg>10)throw Error('Mg o voltaje inválido');return 1/(1+(mg/COURSE_PARAMETERS.mgScale)*Math.exp(-COURSE_PARAMETERS.mgSlope*v));}
export function simulateCourse({key='gaba',receptor=COURSE_PROFILES[key]?.receptors[0],release=1,conductance=1,e=COURSE_RECEPTORS[receptor]?.e,dt=0.1,duration=800,mg=1,coagonist=1,initial=-65}={}){
 const p=COURSE_PROFILES[key],r=COURSE_RECEPTORS[receptor],m=COURSE_PARAMETERS;
 if(!p||!p.receptors.includes(receptor)||r.kind==='signal'||![release,conductance,e,dt,duration,mg,coagonist,initial].every(Number.isFinite)||release<0||release>1||conductance<0||conductance>1||e< -100||e>20||dt<=0||dt>0.2||duration<100||duration>1600||duration/dt>64000||mg<0||mg>10||![0,1].includes(coagonist)||initial< -90||initial> -40)throw Error('Parámetro fuera del modelo de curso');
 const count=Math.round(duration/dt);let v=initial,T=0,bound=0,z=0;const data=[];
 for(let i=0;i<=count;i++){
  const t=i*dt,available=r.kind==='nmda'?coagonist*nmdaAvailable(v,mg):1,g=m.gMax*conductance*(r.kind==='meta'?z:bound)*available,current=g*(v-e);
  data.push({t,v,T,bound,z,g,current,available});if(i===count)break;
  const sum=m.gLeak+g,eq=(m.gLeak*initial+g*e)/sum;
  v=eq+(v-eq)*Math.exp(-sum*dt/m.cm);
  const total=m.alpha*T+m.beta,target=m.alpha*T/total;
  z=r.kind==='meta'?bound+(z-bound)*Math.exp(-dt/(bound>z?m.tauRise:m.tauFall)):0;
  bound=target+(bound-target)*Math.exp(-total*dt);
  const input=t>=m.pulseStart-1e-9&&t<m.pulseEnd-1e-9?m.inputRate*release:0;
  T=input/m.clearance+(T-input/m.clearance)*Math.exp(-m.clearance*dt);
 }
 return {key,receptor,e,release,conductance,dt,duration,mg,coagonist,initial,data};
}
export function courseSignal(receptor,change='reference'){
 const r=COURSE_RECEPTORS[receptor];if(r?.kind!=='signal'||!['reference','no-transmitter','uncouple'].includes(change))throw Error('Escenario de señalización inválido');
 const labels=receptorRoute(receptor),on=change==='reference';
 return {receptor,change,mode:'conceptual',states:labels.map((label,i)=>({label,active:on||(change==='uncouple'&&i===0)})),conclusion:on?(r.pathway==='gs'?'Aumenta la señal de AMPc.':'Se activa la rama PLC y sus mensajeros IP₃/DAG.'):change==='no-transmitter'?'Sin señal de transmisor, no se activa esta cadena.':'Puede haber unión al receptor, pero al interrumpir su comunicación con proteína G no continúa esta cadena.'};
}
export function courseExperiment(key,receptor,change='half-release'){
 if(!COURSE_PROFILES[key]?.receptors.includes(receptor))throw Error('Par incompatible');
 if(COURSE_RECEPTORS[receptor].kind==='signal')return {mode:'conceptual',reference:courseSignal(receptor),changed:courseSignal(receptor,change),change};
 const options={key,receptor},overrides={'reference':{},'half-release':{release:0.5},'block':{conductance:0},'reverse':{e:COURSE_RECEPTORS[receptor]?.e< -65?-45:-90},'no-mg':{mg:0},'no-coagonist':{coagonist:0},'depolarize':{initial:-40}};
 if(!Object.hasOwn(overrides,change)||(['no-mg','no-coagonist','depolarize'].includes(change)&&receptor!=='NMDA'))throw Error('Cambio inválido');return {mode:'numeric',reference:simulateCourse(options),changed:simulateCourse({...options,...overrides[change]}),change};
}
export function courseMetrics(run){if(!run.data)throw Error('Esta vía no calcula voltaje');const baseline=run.initial??-65,peak=run.data.reduce((a,d)=>Math.abs(d.v-baseline)>Math.abs(a.v-baseline)?d:a,run.data[0]);return {delta:peak.v-baseline,peak:peak.v,time:peak.t,maxG:Math.max(...run.data.map(d=>d.g))};}
export function coursePlot(reference,changed,field='v',cursor=30,window=reference.duration){
 const all=reference.data.concat(changed?changed.data:[]).filter(d=>d.t<=window),isV=field==='v',limit=isV?0:Math.max(0.05,...all.map(d=>Math.abs(d.current)))*1.12;
 const minimum=isV?Math.min(...all.map(d=>d.v)):0,maximum=isV?Math.max(...all.map(d=>d.v)):0,margin=Math.max(1,(maximum-minimum)*0.15);
 const low=isV?minimum-margin:-limit,high=isV?maximum+margin:limit,x=t=>62+t/window*770,y=v=>205-(v-low)/(high-low)*158;
 const line=(run,color,dash)=>`<path d="${run.data.filter(d=>d.t<=window).filter((_,i)=>i%Math.max(1,Math.floor(window/run.dt/900))===0).map((d,i)=>`${i?'L':'M'}${x(d.t).toFixed(2)},${y(d[field]).toFixed(2)}`).join('')}" fill="none" stroke="${color}" stroke-width="2" ${dash?'stroke-dasharray="7 4"':''}/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 260" role="img" aria-label="${isV?'Potencial postsináptico en mV':'Corriente postsináptica en microamperios por centímetro cuadrado'}, tiempo en milisegundos" font-family="Arial" font-size="14" fill="#28483f"><rect width="860" height="260" fill="#fff"/><text x="62" y="24" font-size="18">${isV?'Potencial postsináptico · mV':'Corriente postsináptica · µA/cm²'}</text>${Array.from({length:5},(_,i)=>{const val=low+(high-low)*i/4;return `<path d="M62,${y(val)}H832" stroke="#dce5df"/><text x="3" y="${y(val)+4}">${isV?val.toFixed(1):val.toFixed(2)}</text>`;}).join('')}${[0,window/4,window/2,window*3/4,window].map(t=>`<text x="${x(t)-6}" y="228">${t}</text>`).join('')}<path d="M62,47V205H832" stroke="#58776b" fill="none"/>${line(reference,'#7e8f86',true)}${changed?line(changed,'#28689b',false):''}<path d="M${x(cursor)},47V205" stroke="#a86b22" stroke-dasharray="3 4"/><text x="719" y="251">Tiempo (ms)</text></svg>`;
}
