(()=>{
const COURSE_RECEPTORS=Object.freeze({
 'GABA-A':{label:'GABA-A · canal aniónico',kind:'fast',e:-75,ion:'Cl⁻',charge:-1,nt:'gaba'},
 'GABA-B':{label:'GABA-B → Gi/o → GIRK',kind:'meta',e:-90,ion:'K⁺',charge:1,nt:'gaba'},
 NMDA:{label:'NMDA · canal regulado por Mg²⁺',kind:'nmda',e:0,ion:'Cationes, incluido Ca²⁺',charge:1,nt:'glutamate'},
 mGluR1:{label:'mGluR1 → Gq → PLC',kind:'signal',pathway:'gq',e:null,nt:'glutamate'},
 M1:{label:'M1 → Gq → PLC',kind:'signal',pathway:'gq',e:null,nt:'ach'},
 M2:{label:'M2 → Gi/o → GIRK · célula equipada',kind:'meta',e:-90,ion:'K⁺',charge:1,nt:'ach'},
 D1:{label:'D1 → Gs → AMPc',kind:'signal',pathway:'gs',e:null,nt:'dopamine'},
 '5-HT1A':{label:'5-HT1A → Gi/o → GIRK · célula equipada',kind:'meta',e:-90,ion:'K⁺',charge:1,nt:'serotonin'},
 '5-HT2A':{label:'5-HT2A → Gq → PLC',kind:'signal',pathway:'gq',e:null,nt:'serotonin'},
 AMPA:{label:'AMPA · canal catiónico',kind:'fast',e:0,ion:'Cationes',charge:1,nt:'glutamate'},
 nAChR:{label:'Nicotínico · canal catiónico',kind:'fast',e:0,ion:'Cationes',charge:1,nt:'ach'},
 D2:{label:'D2 → Gi/o → GIRK · célula equipada',kind:'meta',e:-90,ion:'K⁺',charge:1,nt:'dopamine'},
 '5-HT3':{label:'5-HT3 · canal catiónico',kind:'fast',e:0,ion:'Cationes',charge:1,nt:'serotonin'}
});
const COURSE_PROFILES=Object.freeze({
 gaba:{name:'GABA',short:'GABA',receptors:['GABA-A','GABA-B'],carrier:'GAT',clearance:'captación neuronal y glial',withdraw:'GABA se dispersa y transportadores GAT lo captan. La enzima GABA-T actúa dentro de la célula, asociada a mitocondrias; no degrada GABA en la hendidura.',scope:'Se comparan GABA-A y la rama postsináptica GABA-B/GIRK; no toda despolarización facilita el disparo.',sources:[['Hamill et al., 1983','https://pubmed.ncbi.nlm.nih.gov/6314144/'],['Fowler et al., 2006/2007','https://pmc.ncbi.nlm.nih.gov/articles/PMC2075413/'],['Roth y Draguhn, 2012 · revisión','https://pmc.ncbi.nlm.nih.gov/articles/PMC3316990/']]},
 glutamate:{name:'Glutamato',short:'Glutamato',receptors:['AMPA','NMDA','mGluR1'],carrier:'EAAT',clearance:'captación por transportadores EAAT',withdraw:'EAAT transporta glutamato hacia neuronas y glía. Captarlo retira transmisor del exterior; no es una degradación enzimática dentro de la hendidura. El ciclo glutamato/glutamina queda fuera.',scope:'AMPA y NMDA se calculan con conductancias reducidas; mGluR1 muestra la vía Gq/PLC cualitativamente. Kainato y otros mGluR quedan para ampliaciones posteriores.',sources:[['Biedermann et al., 2021','https://pubmed.ncbi.nlm.nih.gov/33602810/'],['Qiu y Boudker, 2023','https://www.nature.com/articles/s41467-023-38120-5']]},
 ach:{name:'Acetilcolina',short:'ACh',receptors:['nAChR','M1','M2'],carrier:'CHT · colina',clearance:'hidrólisis por acetilcolinesterasa y captación de colina',withdraw:'La acetilcolinesterasa (AChE) rompe acetilcolina en colina y acetato en el espacio extracelular. CHT capta colina; no se representa la recaptación de acetilcolina intacta como vía principal.',scope:'Se comparan nicotínico, M1 y una rama M2/GIRK en una célula equipada. M3/M4/M5 y otros efectores no se representan; no se reproduce una placa motora completa.',sources:[['Watanabe y Narahashi, 1979','https://doi.org/10.1085/jgp.74.5.615'],['Katz y Miledi, 1973','https://pubmed.ncbi.nlm.nih.gov/4361216/'],['Okuda et al., 2000','https://pubmed.ncbi.nlm.nih.gov/10649566/'],['Xue et al., 2024','https://www.nature.com/articles/s41421-024-00731-7']]},
 dopamine:{name:'Dopamina',short:'Dopamina',receptors:['D2','D1'],carrier:'DAT',clearance:'captación neuronal por DAT',withdraw:'DAT transporta dopamina hacia el interior celular y contribuye a retirar la señal extracelular. Difusión y captación se solapan. El metabolismo posterior no se calcula ni se dibuja como destrucción en la hendidura.',scope:'Escenario D2 en una célula receptora equipada con GIRK; el acoplamiento no se presupone en toda célula D2. D1 muestra Gs y AMPc sin deducir un voltaje. D3/D4/D5, autorreceptores y transmisión por volumen quedan fuera.',sources:[['Lacey et al., 1987','https://pubmed.ncbi.nlm.nih.gov/2451725/'],['Huang et al., 2013 · referencia de acoplamiento','https://pubmed.ncbi.nlm.nih.gov/23942137/'],['Srivastava et al., 2024','https://www.nature.com/articles/s41586-024-07739-9']]},
 serotonin:{name:'Serotonina',short:'5-HT',receptors:['5-HT3','5-HT1A','5-HT2A'],carrier:'SERT',clearance:'captación neuronal por SERT',withdraw:'SERT capta serotonina hacia el interior de la neurona. Captación no significa degradación. La difusión también reduce la disponibilidad local; el metabolismo intracelular queda fuera de este cálculo.',scope:'Se comparan 5-HT3, una rama 5-HT1A/GIRK y la vía 5-HT2A/PLC. No se representan todos los receptores ni un estado emocional.',sources:[['Maricq et al., 1991','https://researchportal.ukhsa.gov.uk/en/publications/primary-structure-and-functional-expression-of-the-5htsub3sub-rec/'],['Yang et al., 2021','https://pmc.ncbi.nlm.nih.gov/articles/PMC8635421/']]}
});
const RECEPTOR_SOURCES=Object.freeze({
 NMDA:[['Nowak et al., 1984 · Mg²⁺ y voltaje','https://www.nature.com/articles/307462a0'],['Jahr y Stevens, 1990 · bloqueo de conductancia','https://pubmed.ncbi.nlm.nih.gov/1697902/'],['Johnson y Ascher, 1987 · glicina','https://www.nature.com/articles/325529a0']],
 mGluR1:[['Masu et al., 1991 · receptor metabotrópico','https://www.nature.com/articles/349760a0'],['Acoplamiento mGluR1/PLC, 1994','https://pubmed.ncbi.nlm.nih.gov/8014896/']],
 M1:[['Wess et al., 1990 · acoplamiento muscarínico','https://pubmed.ncbi.nlm.nih.gov/2172767/'],['Jensen et al., 2009 · M1/Gq/PLC','https://pmc.ncbi.nlm.nih.gov/articles/PMC2699104/']],
 M2:[['M2/GIRK coexpresados, 2000','https://pubmed.ncbi.nlm.nih.gov/10660578/']],
 D1:[['Monsma et al., 1990 · D1 y AMPc','https://www.pnas.org/doi/10.1073/pnas.87.17.6723']],
 '5-HT1A':[['Gadgaard y Jensen, 2020 · 5-HT1A/GIRK','https://pubmed.ncbi.nlm.nih.gov/32088264/']],
 '5-HT2A':[['Goppelt-Struebe y Stroebel, 1998 · 5-HT2A y señalización','https://pubmed.ncbi.nlm.nih.gov/9572479/']]
});
const COURSE_LAST=12;
function receptorRoute(id){const r=COURSE_RECEPTORS[id];if(!r)throw Error('Receptor inválido');
 if(r.kind==='signal')return r.pathway==='gs'?['D1 detecta dopamina','Gs transmite la señal','Adenilil ciclasa se activa','Aumenta AMPc']:['El receptor detecta el transmisor','Gq transmite la señal','PLC actúa sobre PIP₂','Se generan IP₃ y DAG'];
 return r.kind==='meta'?['Unión al receptor','Activación de Gi/o','Gβγ regula un canal GIRK separado','Conductancia K⁺ y respuesta condicionada por gradientes']:[`Unión a ${id}`,id==='NMDA'?'También se requiere coagonista':'Se activa el canal del receptor',id==='NMDA'?'Mg²⁺ bloquea más a voltajes negativos':'La conductancia permite corriente','La corriente cambia el voltaje de la membrana'];
}
function receptorExplanation(id){const r=COURSE_RECEPTORS[id];receptorRoute(id);
 if(r.kind==='signal')return r.pathway==='gs'?'D1 regula una enzima mediante Gs. La adenilil ciclasa produce AMPc, un mensajero dentro de la célula. Aquí se muestra la dirección de esa señal; no se calculan concentraciones, tiempos ni un potencial postsináptico. El efecto sobre canales y voltaje requiere especificar la maquinaria de la célula.':'El receptor usa Gq, una proteína que transmite la señal dentro de la célula. Gq activa PLC (fosfolipasa C), enzima que transforma el lípido PIP₂ y genera los mensajeros IP₃ y DAG. IP₃ puede favorecer salida de Ca²⁺ de depósitos internos: es distinto del calcio que entra al terminal presináptico. La vía es cualitativa; no se deduce un voltaje universal.'+(id==='M1'?' En una célula con canales Kv7, reducir PIP₂ puede disminuir la corriente M de K⁺. Ese efecto se explica aquí, pero no se calcula: faltan los canales y parámetros de esa célula.':'');
 if(id==='NMDA')return 'NMDA contiene un canal catiónico permeable también a Ca²⁺. Se necesita glutamato y un coagonista (aquí, glicina presente). El Mg²⁺ extracelular bloquea más el poro a voltajes negativos. La curva calcula una conductancia neta reducida: no separa Na⁺, K⁺ y Ca²⁺ ni calcula plasticidad.';
 if(r.kind==='meta')return `${id} no contiene un poro. En esta célula equipada con GIRK, Gi/o y Gβγ regulan un canal K⁺ separado. Se calcula solo esa rama con una conductancia lineal: se omite la rectificación de GIRK. Otros efectores, incluida regulación de AMPc, quedan fuera; el acoplamiento no se presupone en todas las células.`;
 return `${id} contiene un canal. Su conductancia neta se calcula en una membrana pasiva. La corriente depende del voltaje y de la reversión; no representa todas las acciones del neurotransmisor ni permite demostrar por sí sola excitación o inhibición de un circuito.`;
}
function courseStage(key,receptor,step){const p=COURSE_PROFILES[key],r=COURSE_RECEPTORS[receptor];if(!p||!p.receptors.includes(receptor)||!Number.isInteger(step)||step<0||step>COURSE_LAST)throw Error('Recorrido inválido');
 const indirect=r.kind==='meta'||r.kind==='signal',signal=r.kind==='signal';
 return [
 ['De la liberación a la respuesta',`Objetivo: seguir ${p.name.toLowerCase()} desde una vesícula hasta ${receptor}, explicar su mecanismo y reconocer cómo termina la señal. Predice antes de avanzar.`],
 ['Llega una señal al terminal','La señal presináptica ya llegó. Aquí estudiamos la comunicación química; el origen del potencial de acción se explora en su módulo separado.'],
 ['Entra calcio al terminal','La despolarización abre canales de Ca²⁺. Su entrada local favorece la fusión de vesículas con la membrana; el dibujo no mide una concentración ni una velocidad.'],
 [`Se libera ${p.name.toLowerCase()}`,'La vesícula se fusiona y libera su contenido al exterior: exocitosis. Los símbolos representan neurotransmisor; no cuentan moléculas ni son una simulación de difusión.'],
 ['El transmisor se dispersa','El movimiento molecular al azar lo distribuye por el espacio extracelular. No hay una trayectoria dirigida que lleve cada molécula hacia un receptor concreto.'],
 [`Se une a ${receptor}`,`La unión ocurre en la cara exterior y puede revertirse. ${indirect?'El receptor no es un poro: la comunicación continuará dentro mediante proteína G.':'El receptor contiene un canal; la unión favorece su activación.'}`],
 [signal?(r.pathway==='gs'?'Gs comunica con una enzima':'Gq comunica con PLC'):indirect?'Gi/o comunica con GIRK':'El canal permite pasar iones',receptorExplanation(receptor)],
 [signal?'La señal continúa dentro de la célula':'La corriente depende del voltaje',signal?`La proteína G ya estaba presente en reposo. ${receptorRoute(receptor).slice(2).join(' → ')}. Estos cambios se muestran como estados cualitativos, no como una curva experimental o una concentración. No equivalen automáticamente a despolarización o hiperpolarización.`:receptor==='NMDA'?'Con glutamato y coagonista, el paso depende además del Mg²⁺ y del voltaje. En el experimento puedes retirar Mg²⁺ o comparar voltajes iniciales. La entrada de Ca²⁺ se ilustra, sin calcular su concentración.':`La dirección depende del voltaje y del potencial de reversión, donde la corriente cambia de signo. El ejemplo de ${r.ion} depende de los gradientes. Los gráficos calculan esa relación en una membrana pasiva.`],
 ['La unión puede terminar','El transmisor puede disociarse. El canal directo deja de activarse; una vía de proteína G puede seguir señalizando después de la separación. No son procesos instantáneos ni obligatoriamente secuenciales.'],
 [key==='ach'?'AChE actúa fuera de la célula':'Retirada del transmisor',p.withdraw],
 [key==='ach'?'Entra colina, no ACh intacta':'La captación cruza una membrana',key==='ach'?'CHT es el transportador de colina. Se distingue de los receptores y de AChE: cada proteína cumple una función diferente en este recorrido.':`${p.carrier} es un transportador, distinto del receptor. Lleva transmisor hacia dentro de la célula en el escenario elegido. Esta escena no calcula la cinética del transporte.`],
 ['Destino intracelular','Tras la captación hay procesamiento y posibles rutas de reutilización. No se calculan esas rutas ni sus proporciones aquí; se evita convertir la retirada de la señal en una destrucción universal en el espacio extracelular.'],
 ['Vuelve a comparar','Al disminuir el transmisor disponible y desactivarse la vía, termina esta respuesta. Cambia el receptor para comparar mecanismos o pasa al experimento y modifica una sola variable para comprobar tu predicción.']
 ][step];
}

const NAV_VIEWS=Object.freeze([{id:'transmission',name:'Sinapsis',step:1},{id:'receptors',name:'Receptores',step:2},{id:'potentials',name:'Respuesta celular',step:3},{id:'pharmacology',name:'Farmacología',step:4},{id:'notes',name:'Guía y fuentes',step:null}]);
function resolveView(hash,containerForId=()=>null){let id;try{id=decodeURIComponent(String(hash||'').replace(/^#/,''));}catch{return 'transmission';}if(NAV_VIEWS.some(v=>v.id===id))return id;const container=containerForId(id);return NAV_VIEWS.some(v=>v.id===container)?container:'transmission';}

if(document.body.dataset.workspacePage){
 const n=id=>document.getElementById(id),panels=NAV_VIEWS.map(v=>n(v.id)),mainLinks=[...document.querySelectorAll('.workspace-nav [data-view-link]')],allLinks=[...document.querySelectorAll('[data-view-link]')],context=document.querySelector('.workspace-context'),rail=document.querySelector('.workspace-rail');let current=null;
 function containing(id){return n(id)?.closest('[data-workspace-view]')?.dataset.workspaceView||null;}
 function sizeContext(){const style=document.documentElement.style;style.setProperty('--context-height',Math.ceil(context.getBoundingClientRect().height)+'px');style.setProperty('--rail-height',Math.ceil(rail.getBoundingClientRect().height)+'px');}
 function contextLabel(){const receptor=n('c-receptor').value,r=COURSE_RECEPTORS[receptor];n('workspace-mode').textContent=r?.kind==='signal'?'Mensajeros · comparación conceptual':'Voltaje y corriente · modelo reducido';const heading=n('c-experiment-title');heading.textContent=heading.textContent.replace(/^\d+\.\s*/,'');sizeContext();}
 function pauseStory(){for(const id of ['play-pause','c-play']){const button=n(id);if(button?.textContent==='Pausar')button.click();}}
 function show(view,{push=false,focus=false}={}){
  if(current==='transmission'&&view!=='transmission')pauseStory();current=view;
  for(const p of panels)p.hidden=p.id!==view;
  for(const a of mainLinks){if(a.dataset.viewLink===view)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');}
  const item=NAV_VIEWS.find(v=>v.id===view);n('workspace-position').textContent=item.step?`${item.step} de 4 · ${item.name}`:'Consulta · guía y fuentes';
  for(const a of document.querySelectorAll('[data-nt-link]'))a.setAttribute('href',a.getAttribute('href').split('#')[0]+'#'+view);
  if(push&&window.location.hash!=='#'+view)window.history.pushState(null,'','#'+view);
  contextLabel();
  if(focus){const heading=n(panels.find(p=>p.id===view).getAttribute('aria-labelledby'));heading.focus({preventScroll:true});n('workspace-content').scrollIntoView({block:'start',behavior:'auto'});}
 }
 for(const a of allLinks)a.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();show(a.dataset.viewLink,{push:true,focus:true});});
 // Existing links into a hidden panel remain useful, including anchors in the historical guide.
 document.addEventListener('click',event=>{const a=event.target.closest?.('a[href^="#"]');if(!a||a.dataset.viewLink||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const view=resolveView(a.getAttribute('href'),containing);event.preventDefault();show(view,{push:true,focus:true});});
 const restore=()=>show(resolveView(window.location.hash,containing));window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);window.addEventListener('resize',sizeContext);
 n('c-receptor').addEventListener('change',contextLabel);n('c-reset').addEventListener('click',contextLabel);
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(sizeContext);observer.observe(context);observer.observe(rail);}
 restore();
}

})();
