import { lesionZones, lesionLesson, lesionSources, updateLesionState, lesionExplanationVisible } from './lesion-content.js?v=11';
import { createLesionCut, lesionFocusBounds } from './lesion-geometry.js?v=11';
import { setupCutZoom } from './cut-zoom.js?v=10';
import { tracts } from './content.js?v=6';

const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

/** El controlador no guarda datos ni analiza imágenes; consulta reglas docentes. */
export function setupLesionPage() {
  const page = document.querySelector('#lesions-page');
  const $ = selector => page.querySelector(selector);
  let state = { zone: 'hemi-right', choice: null, teacher: false, reveal: false };
  const svg = $('#lesion-svg');
  const cut = createLesionCut(svg, id => dispatch({ type: 'select', id }));
  const zoom = setupCutZoom(svg, $('#lesion-cut-tools'), [0, 0, 600, 480]);
  $('#lesion-zones').innerHTML = lesionZones.map(zone => `<button data-lesion-select="${zone.id}" aria-pressed="false"><span>${zone.code}</span>${escape(zone.label)}</button>`).join('');
  for (const button of page.querySelectorAll('[data-lesion-select]')) button.addEventListener('click', () => dispatch({ type: 'select', id: button.dataset.lesionSelect }));
  $('#lesion-reset').addEventListener('click', () => dispatch({ type: 'reset' }));
  $('#lesion-reveal').addEventListener('click', () => dispatch({ type: 'reveal' }));
  for (const [button, target] of [['#lesion-to-case', '#lesion-case-title'], ['#lesion-to-cut', '#lesion-map-title']]) {
    $(button).addEventListener('click', () => {
      $(target).setAttribute('tabindex', '-1');
      $(target).scrollIntoView({ block: 'start', behavior: 'instant' });
      $(target).focus({ preventScroll: true });
    });
  }

  function dispatch(action) {
    state = updateLesionState(state, action);
    if (action.type === 'select') zoom.reset();
    render();
    if (action.type === 'answer') { $('#lesion-feedback').focus({ preventScroll: true }); }
  }

  function render() {
    const lesson = lesionLesson(state.zone);
    const visible = lesionExplanationVisible(state);
    cut.select(lesson, visible);
    zoom.select(lesionFocusBounds[state.zone], lesson.zone.label);
    $('#lesion-selected').textContent = lesson.zone.label;
    for (const button of page.querySelectorAll('[data-lesion-select]')) button.setAttribute('aria-pressed', button.dataset.lesionSelect === state.zone);
    $('#lesion-case').textContent = lesson.case;
    $('#lesion-question').textContent = lesson.question;
    $('#lesion-options').innerHTML = lesson.options.map((option, index) => `<button class="quiz-option${visible && index === lesson.answer ? ' correct' : ''}${visible && state.choice === index && index !== lesson.answer ? ' incorrect' : ''}" data-lesion-answer="${index}" ${state.choice !== null ? 'disabled' : ''}><span class="lesion-option-letter">${String.fromCharCode(65 + index)}</span>${escape(option)}</button>`).join('');
    for (const button of page.querySelectorAll('[data-lesion-answer]')) button.addEventListener('click', () => dispatch({ type: 'answer', choice: Number(button.dataset.lesionAnswer) }));
    $('#lesion-feedback').hidden = state.choice === null || !visible;
    $('#lesion-feedback').innerHTML = state.choice === null ? '' : `<strong>${state.choice === lesson.answer ? 'Correcto.' : 'Revisa el recorrido de las vías.'}</strong> ${escape(lesson.explanation)}`;
    $('#lesion-reveal').hidden = !state.teacher;
    $('#lesion-reveal').textContent = visible ? 'Ocultar explicación y vías' : 'Mostrar explicación y vías';
    $('#lesion-reveal').setAttribute('aria-pressed', visible);
    $('#lesion-teacher-guide').hidden = !state.teacher;
    $('#lesion-teacher-guide p').textContent = lesson.discussion;
    $('#lesion-key').hidden = !visible;
    $('#lesion-pending').hidden = visible;
    $('#lesion-explanation').hidden = !visible;
    // Retirar el contenido oculto evita respuestas antiguas en lectura o impresión.
    $('#lesion-explanation').innerHTML = visible ? `<div class="lesion-answer-heading"><span class="step">03 / EXPLICACIÓN</span><h2>${escape(lesson.title)}</h2><p>${escape(lesson.explanation)}</p></div>
      <div class="lesion-table-wrap"><table><caption>Hallazgos del caso idealizado</caption><thead><tr><th scope="col">Función</th><th scope="col">Hallazgo</th><th scope="col">Distribución y límites</th></tr></thead><tbody>${lesson.signs.map(item => `<tr><th scope="row">${escape(item.name)}</th><td>${escape(item.finding)}</td><td>${escape(item.scope)}</td></tr>`).join('')}</tbody></table></div>
      <div class="lesion-notes">${[['Anatomía', lesson.anatomy], ['Conectividad', lesson.connectivity], ['Función', lesson.function], ['Clínica', lesson.clinical]].map(([title, text], index) => `<div class="detail-block"><h3>0${index + 1} / ${title}</h3><p>${escape(text)}</p></div>`).join('')}
      <div class="detail-block"><h3>05 / Bibliografía</h3><div class="detail-source-links">${lesson.sources.map(id => `<a href="${lesionSources[id].url}" target="_blank" rel="noopener noreferrer">${escape(lesionSources[id].title)} ↗</a>`).join('')}</div></div></div>
      <div class="lesion-pathway-list"><h3>Vías principales destacadas</h3>${['affected', 'spared'].map(status => `<div><strong>${status === 'affected' ? 'Comprometidas' : 'Respetadas en el caso idealizado'}</strong><ul>${lesson[status].map(item => `<li>${escape(tracts.find(tract => tract.id === item.id)?.name || 'Fibras termoalgésicas en la comisura blanca anterior')} (${item.side === 'both' ? 'cruce de ambos lados' : item.side === 'right' ? 'lado derecho' : 'lado izquierdo'})</li>`).join('')}</ul></div>`).join('')}</div>` : '';
  }
  render();
  return { setTeacher(value) { dispatch({ type: 'teacher', value }); } };
}
