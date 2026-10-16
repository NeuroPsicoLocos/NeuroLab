// A voltage-clamped, single-ion Ohm-law teaching calculation, independent of HH.
export const ION_PARAMETERS=Object.freeze({gCl:0.1,gK:0.05,eK:-90});
export function ionCurrents({vm=-65,eCl=-75,openA=false,girk=false}={}){
 if(!Number.isFinite(vm)||vm< -100||vm>20||!Number.isFinite(eCl)||eCl< -90||eCl> -40)throw Error('Gradiente fuera del alcance');
 const cl=(openA?ION_PARAMETERS.gCl:0)*(vm-eCl),k=(girk?ION_PARAMETERS.gK:0)*(vm-ION_PARAMETERS.eK);
 const direction=(i,z)=>Math.abs(i)<1e-10?'none':i*z>0?'out':'in';
 return {cl,k,clDirection:direction(cl,-1),kDirection:direction(k,1),vm,eCl,eK:ION_PARAMETERS.eK};
}
export function ionReading(s,e){const c=ionCurrents({...s,...e}),signed=x=>(x>0?'+':'')+x.toFixed(2);
 const phrase=(symbol,d,open)=>!open?`${symbol}: canal cerrado, sin flujo por esta vía`:d==='none'?`${symbol}: sin flujo neto, voltaje igual al equilibrio`:`${symbol} ${d==='in'?'entra':'sale'} de la célula`;
 return `${phrase('Cl⁻',c.clDirection,e.openA)}. ICl = ${signed(c.cl)} µA/cm². ${phrase('K⁺',c.kDirection,e.girk)}. IK idealizada = ${signed(c.k)} µA/cm². Signo positivo: corriente convencional saliente. En Cl⁻, cargas negativas que entran producen corriente positiva. El voltaje se mantiene fijo para comparar.`;
}
export function renderIonFlow(s,e){const c=ionCurrents({...s,...e});
 const flow=(x,y,ion,d,color)=>{if(d==='none')return `<text x="${x+30}" y="${y-45}" font-size="16" font-family="Arial" fill="${color}">${ion}: sin flujo neto</text>`;
 const a=d==='in'?y-63:y+56,b=d==='in'?y+56:y-63,mid=d==='in'?y+35:y-40;
 return `<g data-ion="${ion}" data-direction="${d}"><path d="M${x},${a}V${b}" stroke="${color}" stroke-width="3"/><path d="M${x-5},${b+(d==='in'?-9:9)}L${x},${b}L${x+5},${b+(d==='in'?-9:9)}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="${x}" cy="${mid}" r="7" fill="${color}" stroke="#fff"/><text x="${x+31}" y="${y-49}" font-size="17" font-family="Arial" fill="${color}">${ion} ${d==='in'?'entra':'sale'}</text></g>`;};
 return `<g data-layer="ionic-flow">${e.openA?flow(350,425+7*Math.sin(350/180),'Cl⁻',c.clDirection,'#245e98'):''}${e.girk?flow(795,425+7*Math.sin(795/180),'K⁺',c.kDirection,'#8a466f'):''}</g>`;
}
