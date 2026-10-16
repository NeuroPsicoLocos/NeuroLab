export const defaults=Object.freeze({amplitude:10,na:1,k:1,ca:1,receptors:1,receptor:'AMPA',reversal:0,interval:0,dt:0.01,duration:80});
const trap=(x,s)=>Math.abs(x)<1e-7?s:x/(-Math.expm1(-x/s));
function rates(v){return [0.1*trap(v+40,10),4*Math.exp(-(v+65)/18),0.07*Math.exp(-(v+65)/20),1/(1+Math.exp(-(v+35)/10)),0.01*trap(v+55,10),0.125*Math.exp(-(v+65)/80)];}
export function simulate(options={}){
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
export function metrics(run){const d=run.data;return {spikes:run.spikes.length,peak:d.reduce((a,x)=>Math.max(a,x.v),-Infinity),calcium:d.reduce((a,x)=>Math.max(a,x.c),-Infinity),transmitter:d.reduce((a,x)=>Math.max(a,x.T),-Infinity),post: d.reduce((a,x)=>Math.abs(x.w+65)>Math.abs(a+65)?x.w:a,-65),release:d.at(-1).q};}
