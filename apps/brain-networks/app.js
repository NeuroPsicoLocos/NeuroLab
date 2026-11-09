'use strict';
(() => {
const networks=window.BRAIN_NETWORKS,sources=window.BRAIN_SOURCES;
const $=id=>document.getElementById(id);
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nodeList=n=>`<ul class="node-list" aria-label="Componentes orientativos">${n.nodes.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`;
const coords=[[180,135],[430,135],[430,282],[180,282]];
function selectNetwork(id){
 const n=networks.find(n=>n.id===id)||networks[0];
 document.querySelectorAll('[data-network]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.network===n.id)));
 $('network-detail').style.setProperty('--accent',n.color);$('network-map').style.setProperty('--accent',n.color);
 $('map-title').textContent=`${n.name}: componentes orientativos`;
 $('map-desc').textContent=`${n.nodes.join('; ')}. Posiciones y líneas conceptuales, no anatomía ni datos medidos.`;
 $('map-lines').innerHTML=coords.map(([x,y],i)=>{const [x2,y2]=coords[(i+1)%4];return `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/>`}).join('');
 $('map-nodes').innerHTML=coords.map(([x,y],i)=>{const words=n.nodes[i].split(' '),cut=Math.ceil(words.length/2);return `<g><circle cx="${x}" cy="${y}" r="15"/><text x="${x}" y="${y+35}"><tspan x="${x}">${escape(words.slice(0,cut).join(' '))}</tspan><tspan x="${x}" dy="19">${escape(words.slice(cut).join(' '))}</tspan></text></g>`}).join('');
 $('network-detail').innerHTML=`<p class="tag">${n.tag}</p><h3>${n.name}</h3><p>${n.function}</p>${nodeList(n)}<h4>Una situación cotidiana</h4><p>${n.example}</p><h4>Una distinción necesaria</h4><p>${n.distinction}</p><div class="clinical"><h4>Al interpretar un caso</h4><p>${n.clinical}</p></div><p><a class="source-link" href="#ref-${n.source}">Leer la fuente: ${sources[n.source].authors} [${n.source+1}]</a></p>`;
}
$('network-buttons').innerHTML=networks.map((n,i)=>`<button type="button" data-network="${n.id}" aria-pressed="${i===0}" style="--dot:${n.color}"><span aria-hidden="true"></span>${n.name}</button>`).join('');
$('network-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-network]');if(b)selectNetwork(b.dataset.network)});
function comparison(){const a=networks.find(n=>n.id===$('compare-a').value),b=networks.find(n=>n.id===$('compare-b').value);$('same-note').textContent=a.id===b.id?'Has elegido el mismo sistema. Selecciona otro para contrastar funciones.':'';$('comparison').innerHTML=[a,b].map(n=>`<article style="--accent:${n.color}"><small>${n.tag}</small><h3>${n.name}</h3><p>${n.function}</p>${nodeList(n)}<p><strong>Precisión:</strong> ${n.distinction}</p><a href="#ref-${n.source}">Fuente [${n.source+1}]</a></article>`).join('')}
for(const id of ['compare-a','compare-b']){$(id).innerHTML=networks.map(n=>`<option value="${n.id}">${n.name}</option>`).join('');$(id).addEventListener('change',comparison)}$('compare-b').value='con';comparison();
$('summary-table').innerHTML=networks.map(n=>`<tr><th scope="row">${n.name}</th><td>${n.tag}</td><td>${n.distinction}</td></tr>`).join('');
$('references').innerHTML=sources.map((s,i)=>`<li id="ref-${i}"><strong>${s.authors}.</strong> <a href="${s.url}">${s.title}</a><small>${s.kind}</small><p>${s.note}</p></li>`).join('');
const questions=[
{q:'Dos regiones muestran actividad correlacionada. ¿Qué puedes concluir?',options:['Existe una vía anatómica directa entre ambas.','Hay dependencia estadística; no se ha demostrado causalidad ni conexión directa.','Una región controla necesariamente a la otra.'],correct:1,why:'La conectividad funcional describe relaciones estadísticas. La dirección causal y la anatomía requieren evidencia adicional.'},
{q:'Cambiar una estrategia tras un error y sostener una consigna durante minutos: ¿qué distinción resulta útil?',options:['Control adaptativo frontoparietal y mantenimiento cíngulo-opercular.','Memoria por defecto y reconocimiento de caras.','Una sola región hace ambas cosas de forma aislada.'],correct:0,why:'El modelo de doble control distingue ajuste flexible y mantenimiento estable. Son contribuciones coordinadas, no capacidades exclusivas.'},
{q:'Imaginar un acontecimiento personal futuro puede implicar…',options:['La inactividad completa del cerebro.','Solo una región del hipocampo.','Componentes de la red por defecto, entre otros sistemas.'],correct:2,why:'La construcción de escenas futuras puede reclutar subsistemas de la red por defecto. No equivale a apagar el procesamiento cerebral.'},
{q:'En este recorrido, temporal ventral se refiere principalmente a…',options:['Todos los procesos visuales, motores y emocionales.','La vía del habla relacionada con la comprensión.','El sistema que identifica cualquier lesión cerebral.'],correct:1,why:'Se delimita el tema al modelo de doble vía del habla. No se equiparan comprensión verbal, reconocimiento facial y articulación.'},
{q:'Una persona se distrae con facilidad. ¿Qué interpretación es adecuada?',options:['Ya se ha demostrado un fallo de saliencia.','Se puede diagnosticar trauma con este mapa.','Hace falta contexto y evaluación; el síntoma no identifica una red ni un diagnóstico.'],correct:2,why:'Muchos factores pueden producir un patrón parecido. Los resultados de grupos y esquemas docentes no establecen diagnósticos individuales.'},
{q:'¿Qué representan las siete opciones de este módulo?',options:['Una selección docente de redes y circuitos tomada del material Centro K.','La parcellación exacta de siete redes de Yeo.','Siete compartimentos cerebrales con funciones exclusivas.'],correct:0,why:'La selección combina sistemas descritos en marcos distintos. Yeo presenta otra organización cortical, y las funciones no se distribuyen en compartimentos exclusivos.'}
];
$('questions').innerHTML=questions.map((q,i)=>`<fieldset><legend>${i+1}. ${q.q}</legend>${q.options.map((o,j)=>`<label class="answer"><input type="radio" name="q${i}" value="${j}" aria-describedby="feedback-${i}"><span>${o}</span></label>`).join('')}<p class="feedback" id="feedback-${i}"></p></fieldset>`).join('');
$('quiz').addEventListener('submit',e=>{e.preventDefault();let score=0,answered=0;questions.forEach((q,i)=>{const selected=document.querySelector(`input[name="q${i}"]:checked`);if(selected)answered++;const ok=selected&&Number(selected.value)===q.correct;if(ok)score++;$(`feedback-${i}`).textContent=`${!selected?'Sin responder.':ok?'Correcto.':'Revisa esta idea.'} ${q.why}`});$('quiz-result').innerHTML=`<h3>${score} de ${questions.length} respuestas correctas</h3><p>Has respondido ${answered} de ${questions.length}. Revisa las explicaciones y vuelve al sistema que quieras repasar. Este resultado no evalúa tu funcionamiento cerebral.</p>`;$('quiz-result').focus()});
$('quiz').addEventListener('reset',()=>{document.querySelectorAll('.feedback').forEach(p=>p.textContent='');$('quiz-result').textContent=''});
selectNetwork('fpn');
})();
