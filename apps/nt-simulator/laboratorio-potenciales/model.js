(function(root){
const trap=x=>Math.abs(x)<1e-7?1:x/Math.expm1(x);
function rates(v){return [.1*10*trap(-(v+40)/10),4*Math.exp(-(v+65)/18),.07*Math.exp(-(v+65)/20),1/(1+Math.exp(-(v+35)/10)),.01*10*trap(-(v+55)/10),.125*Math.exp(-(v+65)/80)];}
function derivative(s,I){let [v,m,h,n]=s,[am,bm,ah,bh,an,bn]=rates(v);let na=120*m**3*h*(v-50),k=36*n**4*(v+77),l=.3*(v+54.387);return [I-na-k-l,am*(1-m)-bm*m,ah*(1-h)-bh*h,an*(1-n)-bn*n];}
function simulate(p={},dt=.01){p={amp:10,duration:1,gap:4,count:1,total:65,...p};let r=rates(-65),s=[-65,r[0]/(r[0]+r[1]),r[2]/(r[2]+r[3]),r[4]/(r[4]+r[5])],out=[],spikes=0,last=-65;const add=(a,b,f)=>a.map((x,i)=>x+b[i]*f);for(let j=0;j<=Math.round(p.total/dt);j++){let t=j*dt;let I=0;for(let q=0;q<p.count;q++){let start=10+q*p.gap;if(t>=start-1e-8&&t<start+p.duration-1e-8)I+=p.amp;}let [v,m,h,n]=s,gn=120*m**3*h,gk=36*n**4;if(last<0&&v>=0)spikes++;last=v;out.push({t,v,I,gn,gk,na:gn*(v-50),k:gk*(v+77),m,h,n});let a=derivative(s,I),b=derivative(add(s,a,dt/2),I),c=derivative(add(s,b,dt/2),I),d=derivative(add(s,c,dt),I);s=s.map((x,i)=>x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6);}return {data:out,spikes,peak:Math.max(...out.map(x=>x.v))};}
root.HH={simulate,rates};if(typeof module!=='undefined')module.exports=root.HH;
})(typeof window==='undefined'?globalThis:window);
