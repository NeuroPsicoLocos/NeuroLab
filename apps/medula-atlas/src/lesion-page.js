import { lesionZones, lesionLesson, lesionSources, updateLesionState, lesionExplanationVisible } from './lesion-content.js?v=11';
import { createLesionCut, lesionFocusBounds } from './lesion-geometry.js?v=12';
import { setupCutZoom } from './cut-zoom.js?v=10';
import { tracts } from './content.js?v=6';
import { localizationCases, localizationCase, initialLocalizationState, updateLocalizationState, localizationExplanationVisible, localizationCorrect } from './localization-content.js?v=12';

const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));


/** Dos actividades comparten el corte y la ficha, con estado efímero independiente. */
export function setupLesionPage() {
  const page = document.querySelector('#lesions-page');
  const $ = selector => page.querySelector(selector);
  let study = { zone: 'hemi-right', choice: null, teacher: false, reveal: false };
  let locate = initialLocalizationState();
  let mode = new URLSearchParams(location.search).get('actividad') === 'localizar' ? 'locate' : 'study';
  const svg = $('#lesion-svg');
  const cut = createLesionCut(svg, id => selectZone(id));
  const zoom = setupCutZoom(svg, $('#lesion-cut-tools'), [0, 0, 600, 480]);
  $('#lesion-zones').innerHTML = lesionZones.map(zone => `<button data-lesion-select="${zone.id}" aria-pressed="false"><span>${zone.code}</span>${escape(zone.label)}</button>`).join('');
  for (const button of page.querySelectorAll('[data-lesion-select]')) button.addEventListener('click', () => selectZone(button.dataset.lesionSelect));
  for (const button of page.querySelectorAll('[data-lesion-mode]')) button.addEventListener('click', () => {
    mode = button.dataset.lesionMode;
    study = updateLesionState(study, { type: 'reset' });
    locate = updateLocalizationState(locate, { type: 'reset' });
    const url = new URL(location.href);
    if (mode === 'locate') url.searchParams.set('actividad', 'localizar');
    else url.searchParams.delete('actividad');
    history.replaceState(null, '', url);
    zoom.reset(); render();
  });
  $('#lesion-localization-case').innerHTML = localizationCases.map((item, index) => `<option value="${item.id}">Caso ${index + 1}</option>`).join('');
  $('#lesion-localization-case').addEventListener('change', event => changeCase(event.target.value));
  for (const [button, offset] of [['#lesion-case-previous', -1], ['#lesion-case-next', 1]]) {
    $(button).addEventListener('click', () => {
      const index = localizationCases.findIndex(item => item.id === locate.caseId);
      const next = localizationCases[index + offset];
      if (next) changeCase(next.id);
    });
  }
  $('#lesion-check-location').addEventListener('click', () => dispatch({ type: 'check' }));
  $('#lesion-next-hint').addEventListener('click', () => dispatch({ type: 'hint' }));
  $('#lesion-reset').addEventListener('click', () => { zoom.reset(); dispatch({ type: 'reset' }); });
  $('#lesion-reveal').addEventListener('click', () => dispatch({ type: 'reveal' }));
  for (const [button, target] of [['#lesion-to-case', '#lesion-case-title'], ['#lesion-to-cut', '#lesion-map-title']]) {
    $(button).addEventListener('click', () => focusSection(target, true));
  }

  function focusSection(target, scroll = false) {
    $(target).setAttribute('tabindex', '-1');
    if (scroll) $(target).scrollIntoView({ block: 'start', behavior: 'instant' });
    $(target).focus({ preventScroll: true });
  }
  function changeCase(id) {
    locate = updateLocalizationState(locate, { type: 'case', id });
    zoom.reset(); render(); focusSection('#lesion-case-title');
  }
  function selectZone(id) {
    dispatch(mode === 'locate' ? { type: 'guess', id } : { type: 'select', id });
  }
  function dispatch(action) {
    if (mode === 'locate') locate = updateLocalizationState(locate, action);
    else study = updateLesionState(study, action);
    if (action.type === 'select' || action.type === 'guess') zoom.reset();
    render();
    if (action.type === 'answer' || action.type === 'check') $('#lesion-feedback').focus({ preventScroll: true });
  }

  function render() {
    const reverse = mode === 'locate';
    const current = localizationCase(locate.caseId);
    const lesson = reverse ? current.lesson : lesionLesson(study.zone);
    const visible = reverse ? localizationExplanationVisible(locate) : lesionExplanationVisible(study);
    const teacher = reverse ? locate.teacher : study.teacher;
    const selectedId = reverse ? (visible ? lesson.zone.id : locate.guess) : study.zone;
    const selectedZone = lesionZones.find(zone => zone.id === selectedId);
    const locked = reverse && locate.submitted !== null;
    page.classList.toggle('localization-mode', reverse);
    for (const button of page.querySelectorAll('[data-lesion-mode]')) button.setAttribute('aria-pressed', button.dataset.lesionMode === mode);
    $('#lesion-map-title').textContent = reverse ? 'Propón la ubicación' : 'Selecciona una zona';
    $('#lesion-case-title').textContent = reverse ? 'De los hallazgos al corte' : 'Del corte al hallazgo';
    $('#lesion-map-step').textContent = reverse ? '02 / UBICACIÓN' : '01 / TERRITORIO';
    $('#lesion-case-step').textContent = reverse ? '01 / HALLAZGOS' : '02 / RAZONAMIENTO';
    $('#lesion-to-case').textContent = reverse ? 'Volver al caso ↑' : 'Ir al caso ↓';
    $('#lesion-to-cut').textContent = reverse ? 'Elegir en el corte ↓' : 'Volver al corte ↑';
    $('#lesion-intro').textContent = reverse ? 'Lee los hallazgos, selecciona un territorio y comprueba tu propuesta. Los casos son ficticios y se limitan al conjunto de patrones T3 del atlas.' : 'Elige una zona del corte, resuelve el caso y compara las vías comprometidas y respetadas. Todos los casos son ficticios y usan el segmento medular T3 como referencia.';
    cut.select(lesson, visible, { neutral: reverse && !visible, selectedId, locked });
    zoom.select(selectedZone ? lesionFocusBounds[selectedId] : null, selectedZone?.label || '');
    $('#lesion-selected').textContent = reverse ? (visible ? `Solución: ${lesson.zone.label}` : selectedZone ? `Tu propuesta: ${selectedZone.label}` : 'Aún no has elegido una ubicación.') : lesson.zone.label;
    for (const button of page.querySelectorAll('[data-lesion-select]')) {
      button.setAttribute('aria-pressed', button.dataset.lesionSelect === selectedId);
      button.disabled = locked;
    }
    $('#lesion-map-caption').textContent = reverse && !visible ? 'Posterior arriba. Derecha del sujeto a la izquierda de la imagen. Los puntos permiten proponer una zona; no se colorea la solución antes de comprobar.' : 'Posterior arriba. Derecha del sujeto a la izquierda de la imagen. El área coral representa un territorio docente aproximado.';
    $('#lesion-case').textContent = reverse ? current.narrative : lesson.case;
    $('#lesion-question').textContent = reverse ? 'Dentro de estos patrones T3, ¿qué territorio y lado explican mejor los hallazgos?' : lesson.question;
    $('#lesion-options').hidden = reverse;
    $('#lesion-options').innerHTML = reverse ? '' : lesson.options.map((option, index) => `<button class="quiz-option${visible && index === lesson.answer ? ' correct' : ''}${visible && study.choice === index && index !== lesson.answer ? ' incorrect' : ''}" data-lesion-answer="${index}" ${study.choice !== null ? 'disabled' : ''}><span class="lesion-option-letter">${String.fromCharCode(65 + index)}</span>${escape(option)}</button>`).join('');
    for (const button of page.querySelectorAll('[data-lesion-answer]')) button.addEventListener('click', () => dispatch({ type: 'answer', choice: Number(button.dataset.lesionAnswer) }));
    $('#lesion-localization-controls').hidden = !reverse;
    $('#lesion-check-location').hidden = !reverse;
    $('#lesion-check-location').disabled = locate.guess === null || locked;
    const index = localizationCases.findIndex(item => item.id === locate.caseId);
    $('#lesion-localization-case').value = locate.caseId;
    $('#lesion-case-progress').textContent = `Caso ${index + 1} de ${localizationCases.length}`;
    $('#lesion-case-previous').disabled = index === 0;
    $('#lesion-case-next').disabled = index === localizationCases.length - 1;
    const answered = reverse ? locate.submitted !== null : study.choice !== null;
    const correct = reverse ? localizationCorrect(locate) : study.choice === lesson.answer;
    const proposed = reverse ? lesionZones.find(zone => zone.id === locate.submitted)?.label : '';
    $('#lesion-feedback').hidden = !answered || !visible;
    $('#lesion-feedback').innerHTML = !answered || !visible ? '' : `<strong>${correct ? 'Correcto.' : 'Revisa el recorrido de las vías.'}</strong> ${reverse ? `<p>Elegiste: ${escape(proposed)}. ${correct ? 'La ubicación encaja con el caso idealizado.' : `La ubicación esperada en este ejercicio es ${escape(lesson.zone.label)}.`}</p>` : ''}${escape(lesson.explanation)}`;
    $('#lesion-reveal').hidden = !teacher;
    $('#lesion-reveal').textContent = visible ? 'Ocultar explicación y vías' : 'Mostrar explicación y vías';
    $('#lesion-reveal').setAttribute('aria-pressed', visible);
    $('#lesion-teacher-guide').hidden = !teacher || reverse;
    $('#lesion-teacher-guide p').textContent = reverse ? '' : lesson.discussion;
    $('#lesion-hints').hidden = !teacher || !reverse;
    // Solo se insertan las pistas reveladas; el resto no queda en el DOM.
    $('#lesion-hint-list').innerHTML = teacher && reverse ? current.hints.slice(0, locate.hints).map(hint => `<li>${escape(hint)}</li>`).join('') : '';
    $('#lesion-next-hint').disabled = locate.hints >= current.hints.length;
    $('#lesion-next-hint').textContent = locate.hints >= current.hints.length ? 'Tres pistas mostradas' : `Revelar pista ${locate.hints + 1} de ${current.hints.length}`;
    $('#lesion-key').hidden = !visible;
    $('#lesion-pending').hidden = visible;
    $('#lesion-pending').textContent = reverse ? 'El corte se mantiene sin pistas de color hasta comprobar. En modo docente puedes revelar pistas graduales o mostrar la explicación.' : 'Las vías y su explicación aparecerán al contestar. En modo docente puedes mostrarlas y ocultarlas.';
    $('#lesion-explanation').hidden = !visible;
    $('#lesion-explanation').innerHTML = visible ? explanationMarkup(lesson) : '';
  }
  render();
  return { setTeacher(value) {
    study = updateLesionState(study, { type: 'teacher', value });
    locate = updateLocalizationState(locate, { type: 'teacher', value });
    render();
  } };
}

/** La misma ficha científica explica ambos sentidos de la actividad. */
function explanationMarkup(lesson) {
  return `<div class="lesion-answer-heading"><span class="step">03 / EXPLICACIÓN</span><h2>${escape(lesson.title)}</h2><p>${escape(lesson.explanation)}</p></div>
      <div class="lesion-table-wrap"><table><caption>Hallazgos del caso idealizado</caption><thead><tr><th scope="col">Función</th><th scope="col">Hallazgo</th><th scope="col">Distribución y límites</th></tr></thead><tbody>${lesson.signs.map(item => `<tr><th scope="row">${escape(item.name)}</th><td>${escape(item.finding)}</td><td>${escape(item.scope)}</td></tr>`).join('')}</tbody></table></div>
      <div class="lesion-notes">${[['Anatomía', lesson.anatomy], ['Conectividad', lesson.connectivity], ['Función', lesson.function], ['Clínica', lesson.clinical]].map(([title, text], index) => `<div class="detail-block"><h3>0${index + 1} / ${title}</h3><p>${escape(text)}</p></div>`).join('')}
      <div class="detail-block"><h3>05 / Bibliografía</h3><div class="detail-source-links">${lesson.sources.map(id => `<a href="${lesionSources[id].url}" target="_blank" rel="noopener noreferrer">${escape(lesionSources[id].title)} ↗</a>`).join('')}</div></div></div>
      <div class="lesion-pathway-list"><h3>Vías principales destacadas</h3>${['affected', 'spared'].map(status => `<div><strong>${status === 'affected' ? 'Comprometidas' : 'Respetadas en el caso idealizado'}</strong><ul>${lesson[status].map(item => `<li>${escape(tracts.find(tract => tract.id === item.id)?.name || 'Fibras termoalgésicas en la comisura blanca anterior')} (${item.side === 'both' ? 'cruce de ambos lados' : item.side === 'right' ? 'lado derecho' : 'lado izquierdo'})</li>`).join('')}</ul></div>`).join('')}</div>`;
}
