export const MODES=Object.freeze(['a','b','both']);
export const SPEEDS=Object.freeze([0.5,1,2]);
export const LAST=12;
export function initialScene(mode='both'){if(!MODES.includes(mode))throw Error('Modo inválido');return {mode,step:0,playing:false,speed:1,vm:-65,eCl:-75};}
export function sceneTransition(s,action,value){
 if(!MODES.includes(s.mode)||!SPEEDS.includes(s.speed)||!Number.isInteger(s.step)||s.step<0||s.step>LAST||typeof s.playing!=='boolean')throw Error('Estado inválido');
 switch(action){
 case 'mode':if(!MODES.includes(value))throw Error('Modo inválido');return {...s,mode:value,playing:false};
 case 'voltage':if(![-100,-90,-75,-65,-40].includes(value))throw Error('Voltaje inválido');return {...s,vm:value,playing:false};
 case 'chloride':if(![-75,-45].includes(value))throw Error('Equilibrio inválido');return {...s,eCl:value,playing:false};
 case 'speed':if(!SPEEDS.includes(value))throw Error('Velocidad inválida');return {...s,speed:value};
 case 'play':return {...s,step:s.step===LAST?0:s.step,playing:true};
 case 'pause':return {...s,playing:false};
 case 'next':return {...s,step:Math.min(LAST,s.step+1),playing:false};
 case 'back':return {...s,step:Math.max(0,s.step-1),playing:false};
 case 'reset':return {...initialScene(s.mode),speed:s.speed};
 case 'tick':return s.playing?{...s,step:Math.min(LAST,s.step+1),playing:s.step+1<LAST}:{...s};
 default:throw Error('Acción inválida');
 }
}
export function sceneEvents(s){const t=s.step;return {a:s.mode!=='b',b:s.mode!=='a',ap:t===1,calcium:t===2,fusion:t===3,released:t>=3&&t<12,boundA:s.mode!=='b'&&t>=5&&t<=7,boundB:s.mode!=='a'&&t>=5&&t<=7,openA:s.mode!=='b'&&t>=5&&t<=7,gi:s.mode!=='a'&&t>=6&&t<=9,girk:s.mode!=='a'&&t>=7&&t<=9,dissociation:t===8,diffusionOut:t===9,uptake:t===10,intracellular:t===11,rest:t===12};}
// Same schematic release for every display mode: no receptor-selection input.
export function sceneLigands(step){
 if(step<3||step>=12)return [];
 if(step===3)return [[433,242],[452,251],[429,266]];
 if(step<=8)return [[384,276],[478,296],[535,252],[275,332],[455,330],[695,304],[850,290]];
 if(step===9)return [[65,260],[18,320],[155,355],[855,281],[889,325]];
 if(step===10)return [[160,188],[942,352]];
 return [[160,137],[985,405]];
}
export const STAGES=Object.freeze([
 ['Una liberación, dos vías','Objetivo: explicar cómo la misma liberación de GABA activa un canal o una vía que regula otro canal. Elige qué receptores mostrar, haz tu predicción y avanza.'],
 ['Llega la señal presináptica','Comenzamos con una señal que ya alcanzó el terminal. Su generación se estudia en el módulo separado «Potencial de acción». Aquí seguimos la comunicación química.'],
 ['Entra calcio','La despolarización abre canales de Ca²⁺; su entrada local ayuda a activar la maquinaria que fusiona las vesículas con la membrana.'],
 ['La vesícula libera GABA','La vesícula se fusiona con la membrana y abre su contenido al exterior: exocitosis. Los símbolos dorados representan GABA, sin contar moléculas reales.'],
 ['GABA se dispersa por difusión','El movimiento molecular al azar dispersa GABA por el espacio entre membranas. No hay una ruta dirigida hacia los receptores.'],
 ['GABA se une por fuera','La unión es reversible. En GABA-A, el propio receptor permite conducir iones; GABA-B es una proteína receptora distinta del canal que regulará.'],
 ['GABA-B comunica con Gi/o','Gi/o es una familia de proteínas G: interruptores moleculares dentro de la célula. La activación de GABA-B permite que sus componentes transmitan la señal.'],
 ['Dos maneras de cambiar la conductancia','GABA-A es un canal de aniones. En la rama elegida de GABA-B, Gβγ regula el canal de potasio GIRK. Esa vía indirecta suele dar una respuesta más lenta y prolongada; aquí no se calculan sus tiempos.'],
 ['GABA puede separarse','El GABA unido puede disociarse. Se muestra el cierre de GABA-A y una señal G todavía activa para explicar que separarse no apaga instantáneamente toda la vía indirecta.'],
 ['La difusión también lo aleja','Parte del GABA se dispersa fuera de la zona cercana a los receptores. Alejarse reduce su disponibilidad local: la molécula no se destruye en la hendidura.'],
 ['Los transportadores captan GABA','Proteínas de la membrana pueden llevar GABA al interior de neuronas o astrocitos, células gliales cercanas. Captación y difusión pueden ocurrir al mismo tiempo; aquí las separamos para aprender.'],
 ['Después se reutiliza o metaboliza dentro','En la neurona, parte del GABA captado puede volver a almacenarse en vesículas. Dentro de las células, GABA-T participa en su metabolismo, asociado a mitocondrias. No se dibuja degradación enzimática extracelular.'],
 ['La escena vuelve a reposo','La comunicación termina al disminuir GABA disponible y desactivarse los receptores y sus vías. Volver al inicio permite comparar ambas familias con la misma secuencia de liberación.']
]);
export function sceneText(s){
 if(s.mode==='a'&&s.step===6)return ['GABA-A ya conduce iones','El propio receptor forma el canal: su apertura cambia la facilidad con que pasa corriente. No necesita la cadena de proteína G que hemos ocultado en esta vista.'];
 if(s.mode==='a'&&s.step===7)return ['El gradiente determina la corriente','Abrir GABA-A no impone una dirección universal al voltaje. El efecto depende del potencial de reversión y de los gradientes de los iones; despolarizar no significa siempre excitar.'];
 if(s.mode==='b'&&s.step===5)return ['GABA se une a GABA-B','La unión ocurre por fuera. GABA-B no es un poro: comunicará con una proteína G situada dentro de la célula.'];
 if(s.mode==='b'&&s.step===7)return ['La proteína G regula GIRK','Gβγ, componentes de la proteína G, regula GIRK: un canal de potasio separado. Esta vía indirecta suele responder de forma más lenta y prolongada. La escena no calcula su duración ni la dirección de la corriente.'];
 if(s.mode==='a'&&s.step===8)return ['GABA se separa y el canal se cierra','La unión de GABA al receptor es reversible. Al separarse disminuye la activación del canal; esta escena divide esos procesos en etapas de lectura.'];
 return STAGES[s.step];
}
export function sceneFeedback(answer){if(!answer)return 'Elige una predicción y compruébala en las etapas de receptores.';if(answer==='inside')return 'GABA se une por fuera a GABA-B; no necesita entrar para activarlo. La señal se comunica hacia dentro mediante Gi/o y Gβγ, que regulan el canal GIRK.';return answer==='separate'?'Coincide: GABA-A contiene el canal; GABA-B activa una vía de proteína G que regula GIRK, un canal separado.':'Revisa la escena: GABA-B no deja pasar iones a través de un poro propio. Gi/o y Gβγ comunican con el canal GIRK.';}
