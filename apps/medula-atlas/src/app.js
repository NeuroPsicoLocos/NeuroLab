import { tracts, sources, structures, questions } from './content.js?v=6';
import { createCrossSection } from './cross-section.js?v=4';
import { illustrations } from './illustrations.js?v=4';
import { setupBonePresentation } from './bone-presentation.js?v=4';
import { setupModelViewer } from './model-viewer.js?v=4';
import { setupInfoPages } from './info-pages.js?v=6';
import { setupAnatomyPage } from './anatomy-page.js?v=7';
import { coverings } from './anatomy-content.js?v=6';

const $=selector=>document.querySelector(selector);
let selected=tracts[0].id,selectedStructure='spinous',filter='all',teacher=false,labels=true,scene=null;
let quizIndex=0,quizScore=0,answered=false;
const map=createCrossSection($('#cord-svg'),tracts,id=>selectTract(id,true));
setupBonePresentation();
setupModelViewer();
setupInfoPages();
setupAnatomyPage();
$('#model-tissue-options').innerHTML=coverings.map(item=>`<button data-structure="${item.id}" aria-pressed="false">${item.name}</button>`).join('');
function escape(text){return String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function sourceLink(id){const source=sources[id];return `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a>`;}

/** Una selección actualiza conjuntamente mapa, índice, ficha y líneas del modelo. */
function selectTract(id,reveal=false){
  const tract=tracts.find(item=>item.id===id);if(!tract)return;selected=id;
  map.select(id);
  $('#tract-list').querySelectorAll('button').forEach(button=>{const active=button.dataset.tract===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});
  $('#selected-map-label').textContent=tract.name;
  $('.selection-indicator').style.background=tract.color;
  $('.detail-panel').style.borderTopColor=tract.color;
  const descending=tract.direction==='descending';
  $('#detail-direction').textContent=descending?'↓ Descendente':'↑ Ascendente';
  $('#detail-direction').classList.toggle('motor',descending);
  $('#tract-detail').innerHTML=`<h2 class="tract-title">${escape(tract.name)}</h2><p class="tract-latin">${escape(tract.latin)}</p><p class="tract-summary">${escape(tract.summary)}</p>
    <div class="detail-block"><h3>01 / Anatomía</h3><p>${escape(tract.anatomy)}</p></div>
    <div class="detail-block"><h3>02 / Conectividad</h3><ol class="route">${tract.route.map(step=>`<li>${escape(step)}</li>`).join('')}</ol><div class="crossing"><strong>¿Dónde cruza?</strong><p>${escape(tract.crossing)}</p></div></div>
    <div class="detail-block"><h3>03 / Función</h3><p>${escape(tract.function)}</p></div>
    <div class="detail-block clinical-block"><h3>04 / Correlación clínica</h3><p>${escape(tract.clinical)}</p></div>
    <div class="detail-block detail-source-block"><h3>05 / Bibliografía</h3><div class="detail-source-links">${tract.sources.map(sourceLink).join('')}</div></div>`;
  scene?.selectTract(tract);
  if(reveal&&matchMedia('(max-width:760px)').matches) $('.detail-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
}
function renderList(){
  const visible=tracts.filter(item=>filter==='all'||item.direction===filter);
  $('#tract-list').innerHTML=visible.map(tract=>`<button data-tract="${tract.id}" aria-pressed="${tract.id===selected}" class="${tract.id===selected?'active':''}"><span class="tract-dot" style="background:${tract.color}"></span>${escape(tract.short)}</button>`).join('');
  $('#tract-list').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>selectTract(button.dataset.tract,true)));
  $('#tract-count').textContent=`${visible.length} vías`;
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',active);});
  map.filter(filter);
  if(filter!=='all'&&tracts.find(item=>item.id===selected).direction!==filter)selected=tracts.find(item=>item.direction===filter).id;
  renderList();selectTract(selected);
}));
$('#labels-toggle').addEventListener('click',()=>{
  labels=!labels;map.labels(labels);$('#labels-toggle').setAttribute('aria-pressed',labels);$('#labels-toggle').innerHTML=`Rótulos <span>${labels?'✓':'○'}</span>`;
});
function selectStructure(id){
  const structure=structures[id];if(!structure)return;
  selectedStructure=id;
  document.querySelectorAll('[data-structure]').forEach(button=>{const active=button.dataset.structure===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});
  $('#structure-description').innerHTML=`<strong>${escape(structure.name)}</strong><p>${escape(structure.description)}</p>`;
  $('#model-dialog-description').innerHTML=$('#structure-description').innerHTML;
  scene?.selectStructure(id);
}
document.querySelectorAll('[data-structure]').forEach(button=>button.addEventListener('click',()=>selectStructure(button.dataset.structure)));
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  scene?.view(button.dataset.view);
  document.querySelectorAll('[data-view]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',active);});
  $('#view-name').textContent=button.dataset.view==='coverings'?'Vista de cubiertas':`Vista ${button.textContent.toLowerCase()}`;
}));
$('#spine-viewport').addEventListener('model-orbit',()=>{
  $('#view-name').textContent='Vista libre';
  document.querySelectorAll('[data-view]').forEach(button=>{button.classList.remove('active');button.setAttribute('aria-pressed','false');});
});
$('#bone-opacity').addEventListener('input',event=>{$('#opacity-value').textContent=`${event.target.value} %`;scene?.opacity(Number(event.target.value));});
for(const [selector,key] of [['#show-bones','bones'],['#show-canal','canal'],['#show-plane','plane']])$(selector).addEventListener('change',event=>{
  scene?.[key](event.target.checked);
  if(key==='plane')$('.plane-label').hidden=!event.target.checked;
});
$('.plane-label').hidden=!$('#show-plane').checked;
document.querySelectorAll('[data-model-layer]').forEach(input=>input.addEventListener('change',()=>scene?.layer(input.dataset.modelLayer,input.checked)));
function showCoverings(expand=false) {
  openPage('explore');
  document.querySelector('[data-bone-presentation="model"]').click();
  $('#show-bones').checked=false;scene?.bones(false);
  $('#show-canal').checked=false;scene?.canal(false);
  $('#show-plane').checked=false;scene?.plane(false);$('.plane-label').hidden=true;
  document.querySelectorAll('[data-model-layer]').forEach(input=>{input.checked=true;scene?.layer(input.dataset.modelLayer,true);});
  $('.model-layers').open=true;
  document.querySelector('[data-view="coverings"]').click();
  selectStructure('dura');
  if(expand)$('#expand-model').click();
}
$('#coverings-preset').addEventListener('click',()=>showCoverings());
$('#open-coverings-model').addEventListener('click',()=>showCoverings(true));
$('#teacher-toggle').addEventListener('click',()=>{
  teacher=!teacher;$('#teacher-toggle').setAttribute('aria-pressed',teacher);$('#mode-text').textContent=teacher?'Modo docente':'Modo estudiante';$('#teacher-guide').hidden=!teacher||$('#explore-page').hidden;
  $('#quiz-score').textContent=teacher?'Respuestas visibles al contestar':`${quizScore} aciertos`;
  $('#anatomy-teacher-guide').hidden=!teacher;
});
$('#print-button').addEventListener('click',()=>window.print());
$('#back-to-map').addEventListener('click',()=>$('#cross-section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'}));

/** Navegación local sin rutas de servidor: funciona en cualquier subcarpeta de Pages. */
function openPage(name){
  const pages=['explore','anatomy','plates','gray','practice','sources','about'];
  const valid=pages.includes(name)?name:'explore';
  for(const page of pages)$(`#${page}-page`).hidden=page!==valid;
  $('.page-heading').hidden=['anatomy','gray','about'].includes(valid);
  document.querySelectorAll('[data-page]').forEach(button=>{const active=button.dataset.page===valid;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  $('#teacher-guide').hidden=!teacher||valid!=='explore';
  history.replaceState(null,'',`${location.pathname}${location.search}#${valid}`);
}
document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>openPage(button.dataset.page)));
window.addEventListener('hashchange',()=>openPage(location.hash.slice(1)));
$('#source-list').innerHTML=Object.entries(sources).map(([id,source],index)=>`<div class="source-entry"><span>${String(index+1).padStart(2,'0')}</span><div>${sourceLink(id)}<p>${escape(source.institution)}</p></div></div>`).join('');

/** Cada lámina usa su propio texto alternativo, claves de lectura y fuentes. */
function selectPlate(id) {
  const plate = illustrations.find(item => item.id === id);
  if (!plate) return;
  document.querySelectorAll('[data-plate]').forEach(button => {
    const active = button.dataset.plate === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  const image = $('#plate-image');
  image.src = `./assets/illustrations/${plate.image}`;
  image.alt = plate.alt;
  image.classList.toggle('portrait-plate', id === 'longitudinal');
  $('#plate-fullsize').href = image.src;
  $('#plate-kicker').textContent = plate.subtitle.toUpperCase();
  $('#plate-title').textContent = plate.title;
  $('#plate-caption').textContent = plate.caption;
  $('#plate-notes').innerHTML = plate.notes.map(([title, text]) => `<div class="plate-note"><h3>${escape(title)}</h3><p>${escape(text)}</p></div>`).join('') + `<div class="detail-block"><h3>Bibliografía</h3><div class="detail-source-links">${plate.sources.map(sourceLink).join('')}</div></div>`;
}
$('#plate-options').innerHTML = illustrations.map((plate, index) => `<button data-plate="${plate.id}" aria-pressed="false"><img src="./assets/illustrations/${plate.image}" alt="" loading="lazy"><span><small>0${index + 1}</small>${escape(plate.title)}</span></button>`).join('');
document.querySelectorAll('[data-plate]').forEach(button => button.addEventListener('click', () => selectPlate(button.dataset.plate)));
document.querySelectorAll('[data-open-plate]').forEach(button => button.addEventListener('click', () => {
  selectPlate(button.dataset.openPlate);
  openPage('plates');
  window.scrollTo({top: 0, behavior: 'instant'});
}));
$('#plate-to-map').addEventListener('click', () => { openPage('explore'); $('#cross-section').scrollIntoView({block: 'start'}); });
selectPlate('tracts');

/** Autoevaluación en memoria de sesión, sin cuentas ni almacenamiento externo. */
function renderQuestion(){
  answered=false;$('#quiz-feedback').hidden=true;$('#quiz-next').hidden=true;
  $('#question-number').textContent=`Pregunta ${quizIndex+1} de ${questions.length}`;
  $('#quiz-score').textContent=`${quizScore} aciertos`;
  $('#progress-fill').style.width=`${quizIndex/questions.length*100}%`;
  const question=questions[quizIndex];$('#quiz-question').textContent=question.question;
  $('#quiz-options').innerHTML=question.options.map((option,index)=>`<button class="quiz-option" data-option="${index}">${escape(option)}</button>`).join('');
  $('#quiz-options').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>answerQuestion(Number(button.dataset.option))));
}
function answerQuestion(option){
  if(answered)return;answered=true;const question=questions[quizIndex],correct=option===question.correct;if(correct)quizScore++;
  $('#quiz-options').querySelectorAll('button').forEach(button=>{const value=Number(button.dataset.option);button.disabled=true;button.classList.toggle('correct',value===question.correct);button.classList.toggle('incorrect',value===option&&!correct);});
  $('#quiz-feedback').hidden=false;$('#quiz-feedback').classList.toggle('wrong',!correct);$('#quiz-feedback').textContent=`${correct?'Correcto.':'Revisa la respuesta señalada.'} ${question.explanation}`;
  $('#quiz-score').textContent=`${quizScore} aciertos`;
  $('#progress-fill').style.width=`${(quizIndex+1)/questions.length*100}%`;
  $('#quiz-next').hidden=false;$('#quiz-next').textContent=quizIndex===questions.length-1?'Ver resultado →':'Siguiente pregunta →';
}
$('#quiz-next').addEventListener('click',()=>{
  quizIndex++;
  if(quizIndex<questions.length){renderQuestion();$('#quiz-question').setAttribute('tabindex','-1');$('#quiz-question').focus();return;}
  $('#question-number').textContent='Autoevaluación completa';$('#quiz-score').textContent=`${quizScore} de ${questions.length}`;
  $('#quiz-question').textContent=`${quizScore} de ${questions.length} respuestas correctas`;
  $('#quiz-options').innerHTML='<p class="tract-summary">Vuelve a los mapas y compara las regiones, raíces, cubiertas y vías que te resultaron más difíciles.</p><button id="restart-quiz" class="primary-button">Volver a practicar</button>';
  $('#quiz-feedback').hidden=true;$('#quiz-next').hidden=true;
  $('#restart-quiz').addEventListener('click',()=>{quizIndex=0;quizScore=0;renderQuestion();});
});
renderList();selectTract(selected);selectStructure('spinous');renderQuestion();openPage(location.hash.slice(1));

// La carga 3D es independiente: el corte y las fichas siguen funcionando sin WebGL.
async function initialize3D(){
  try{
    const {createSpineScene}=await import('./spine-scene.js?v=6');
    scene=await createSpineScene($('#spine-viewport'),selectStructure);
    scene.view(document.querySelector('[data-view].active')?.dataset.view || 'oblique');
    scene.opacity(Number($('#bone-opacity').value));scene.bones($('#show-bones').checked);scene.canal($('#show-canal').checked);scene.plane($('#show-plane').checked);
    document.querySelectorAll('[data-model-layer]').forEach(input=>scene.layer(input.dataset.modelLayer,input.checked));
    scene.selectTract(tracts.find(item=>item.id===selected));selectStructure(selectedStructure);
    window.addEventListener('pagehide',()=>scene.dispose(),{once:true});
  }catch(error){
    // WebGL depende de la GPU del equipo. Fallback accesible y con anatomía útil.
    $('#spine-viewport').querySelector('canvas')?.remove();
    $('#spine-viewport').insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 300 330" role="img" aria-label="Vista superior esquemática de una vértebra"><ellipse cx="150" cy="85" rx="65" ry="38" fill="#dfccaa"/><path d="M100 110L91 176L150 220L209 176L200 110" fill="none" stroke="#dfccaa" stroke-width="18"/><path d="M150 217V280M96 169H57M204 169H243" stroke="#dfccaa" stroke-width="16"/><circle cx="150" cy="165" r="20" fill="#cf8d77"/><text x="150" y="313" text-anchor="middle" font-size="10" fill="#d4e2da">Vista superior esquemática (sin WebGL)</text></svg>`);
    $('#spine-viewport').querySelector('.canvas-loading')?.remove();$('#view-name').textContent='Vista superior 2D';
    document.querySelectorAll('[data-view],[data-model-layer],#coverings-preset,#open-coverings-model,#bone-opacity,#show-bones,#show-canal,#show-plane').forEach(control=>control.disabled=true);
    $('.gesture-hint').textContent='No se pudo cargar el modelo 3D. El corte y las fichas están disponibles.';
    $('#spine-viewport').dataset.fallback='true';
  }
}
initialize3D();
