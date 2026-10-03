import { grayLevels, grayLevelSources, resolveGraySelection } from './gray-level-content.js?v=8';
import { grayTerritory, grayBaseMarkup, grayFocusViewBox } from './gray-level-geometry.js?v=8';

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const sourceLink = id => `<a href="${grayLevelSources[id].url}" target="_blank" rel="noopener noreferrer">${escape(grayLevelSources[id].title)} ↗</a>`;

/** Un mismo estado coordina nivel, dibujo, lista, ficha y acercamiento. */
export function setupGrayLevelExplorer() {
  const root = document.querySelector('#gray-level-explorer');
  let levelId = 't3', mode = 'structures', selectedId = 'dorsal', side = 'left', zoomed = false;
  root.innerHTML = `<header class="gray-explorer-header"><span class="step">CORTES POR NIVEL / EXPLORADOR DE SUSTANCIA GRIS</span><h2>Compara la forma. Acércate a la función.</h2><p>Elige un segmento medular y selecciona una estructura en el corte o en la lista.</p></header>
    <div id="gray-level-options" class="gray-level-options" role="group" aria-label="Nivel medular">${grayLevels.map(level => `<button data-gray-level="${level.id}" aria-pressed="false"><svg viewBox="0 60 600 365" aria-hidden="true">${grayBaseMarkup(level.id, `thumbnail-${level.id}`)}</svg><span>${level.name}<strong>${level.segment}</strong></span></button>`).join('')}</div>
    <div class="gray-level-context"><strong id="gray-level-name"></strong><p id="gray-level-summary"></p></div>
    <div class="gray-explorer-grid">
      <div class="gray-map-column">
        <div class="gray-mode-options" role="group" aria-label="Contenido del corte"><button data-gray-mode="structures" class="active" aria-pressed="true">Astas y núcleos</button><button data-gray-mode="laminae" aria-pressed="false">Láminas de Rexed</button></div>
        <div class="gray-zoom-tools"><button id="gray-zoom-in" class="secondary-button">Acercar selección</button><button id="gray-zoom-out" class="secondary-button" disabled>Vista completa</button><output id="gray-zoom-status">Vista general</output></div>
        <figure class="gray-cut-figure"><div class="gray-cut-frame"><svg id="gray-level-map" viewBox="0 0 600 480" role="group" aria-labelledby="gray-cut-title gray-cut-description"></svg></div><figcaption><strong id="gray-selected-label"></strong><span>Posterior arriba · Anterior abajo</span><span>Vista desde caudal: derecha del sujeto a la izquierda.</span></figcaption></figure>
        <p class="gray-cut-limit">Esquema docente, sin escala física. Los tamaños permiten comparar formas; no son medidas de tejido. Las zonas y los límites de Rexed son orientativos.</p>
        <div id="gray-structure-options" class="gray-structure-options" role="group" aria-label="Estructuras de sustancia gris"></div>
      </div>
      <aside class="gray-detail-column" aria-label="Ficha de sustancia gris"><button id="gray-back-to-cut" class="secondary-button">↑ Volver al corte</button><div id="gray-level-detail" aria-live="polite"></div><div class="gray-observations"><h3>Qué observar en este nivel</h3><ul id="gray-level-observations"></ul><div id="gray-level-sources"></div></div></aside>
    </div>
    <p id="gray-selection-status" class="gray-selection-status" role="status"></p>
    <aside id="gray-teacher-guide" class="anatomy-teacher gray-teacher-guide" hidden><strong>Para trabajar en clase</strong><p>Compara las astas anteriores de C6 y T3. Localiza Clarke en T3 y cambia a L4. Después busca la población autónoma de S3 y distingue la lámina X del conducto central. Pide justificar cada diferencia usando las fichas y las fuentes.</p></aside>`;

  const map = root.querySelector('#gray-level-map');
  const detail = root.querySelector('#gray-level-detail');
  const status = root.querySelector('#gray-selection-status');
  const getState = () => resolveGraySelection(levelId, mode, selectedId);

  function setView() {
    const { selected } = getState();
    const territory = grayTerritory(levelId, selected.id, mode);
    const viewBox = zoomed ? grayFocusViewBox(territory.bounds, side, territory.midline) : [0, 0, 600, 480];
    map.setAttribute('viewBox', viewBox.join(' '));
    root.querySelector('#gray-zoom-out').disabled = !zoomed;
    root.querySelector('#gray-zoom-status').textContent = zoomed
      ? `${(600 / viewBox[2]).toFixed(1).replace('.', ',')}× · ${territory.midline ? 'Línea media' : `Lado ${side === 'left' ? 'izquierdo' : 'derecho'} del sujeto`}`
      : 'Vista general';
  }

  function select(id, anatomicalSide = side, reveal = false) {
    const resolved = resolveGraySelection(levelId, mode, id);
    selectedId = resolved.selected.id;
    side = anatomicalSide;
    const selected = resolved.selected;
    root.querySelectorAll('[data-gray-item]').forEach(element => {
      const active = element.dataset.grayItem === selectedId;
      element.classList.toggle('selected', active);
      element.setAttribute('aria-pressed', String(active));
    });
    root.querySelector('#gray-selected-label').textContent = `${selected.name} · ${resolved.level.segment}`;
    detail.style.setProperty('--gray-selection-color', selected.color);
    detail.innerHTML = `<span class="step">${mode === 'laminae' ? 'LÁMINA DE REXED' : 'ESTRUCTURA SELECCIONADA'} / ${resolved.level.segment}</span><h3>${escape(selected.name)}</h3>${[['Anatomía', selected.anatomy], ['Conectividad', selected.connectivity], ['Función', selected.function], ['Clínica', selected.clinical]].map(([label, text]) => `<section class="gray-detail-block"><h4>${label}</h4><p>${escape(text)}</p></section>`).join('')}<section class="gray-detail-block"><h4>Bibliografía</h4>${selected.sources.map(sourceLink).join('')}</section>`;
    setView();
    if (reveal && matchMedia('(max-width:760px)').matches) {
      detail.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
    }
  }

  function draw() {
    const { level, items, selected } = getState();
    selectedId = selected.id;
    root.querySelectorAll('[data-gray-level]').forEach(button => {
      const active = button.dataset.grayLevel === levelId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    root.querySelectorAll('[data-gray-mode]').forEach(button => {
      const active = button.dataset.grayMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    root.querySelector('#gray-level-name').textContent = `${level.name} · Segmento medular ${level.segment}`;
    root.querySelector('#gray-level-summary').textContent = level.summary;
    root.querySelector('#gray-level-observations').innerHTML = level.observations.map(text => `<li>${escape(text)}</li>`).join('');
    root.querySelector('#gray-level-sources').innerHTML = level.sources.map(sourceLink).join('');
    const available = items.filter(item => item.levels.includes(levelId));
    map.innerHTML = `<title id="gray-cut-title">Sustancia gris, segmento medular ${level.segment}</title><desc id="gray-cut-description">Corte docente desde caudal. Posterior arriba, anterior abajo y derecha del sujeto a la izquierda. Selecciona ${mode === 'laminae' ? 'una lámina de Rexed' : 'una estructura'} con clic, toque, Enter o espacio. Los límites son orientativos.</desc>${grayBaseMarkup(levelId, 'main-gray')}`;
    // El orden coloca núcleos y estructuras centrales sobre sus regiones mayores.
    for (const item of available) {
      const territory = grayTerritory(levelId, item.id, mode);
      for (const anatomicalSide of territory.midline ? ['midline'] : ['left', 'right']) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('role', 'button');
        group.setAttribute('tabindex', '0');
        group.setAttribute('data-gray-item', item.id);
        group.setAttribute('aria-label', `${item.name}, ${anatomicalSide === 'midline' ? 'línea media' : `lado ${anatomicalSide === 'left' ? 'izquierdo' : 'derecho'} del sujeto`}`);
        group.setAttribute('aria-pressed', 'false');
        group.setAttribute('class', `gray-territory ${mode === 'laminae' ? 'laminar-territory' : ''}`);
        group.setAttribute('style', `--region-color:${item.color}`);
        group.setAttribute('clip-path', 'url(#main-gray-gray-clip)');
        if (anatomicalSide === 'right') group.setAttribute('transform', 'translate(600 0) scale(-1 1)');
        group.innerHTML = `<title>${escape(item.name)}</title>${territory.markup}`;
        group.addEventListener('click', () => select(item.id, anatomicalSide === 'midline' ? side : anatomicalSide, true));
        group.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            select(item.id, anatomicalSide === 'midline' ? side : anatomicalSide, true);
          }
        });
        map.append(group);
      }
    }
    // El conducto sigue siendo visible en ambos modos; no se confunde con X.
    const canal = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    for (const [attribute, value] of Object.entries({ cx: 300, cy: 254, r: 5, class: 'gray-canal-center', 'pointer-events': 'none' })) canal.setAttribute(attribute, value);
    map.append(canal);
    const options = root.querySelector('#gray-structure-options');
    options.setAttribute('aria-label', mode === 'laminae' ? 'Láminas de Rexed' : 'Estructuras de sustancia gris');
    options.innerHTML = items.map(item => {
      const enabled = item.levels.includes(levelId);
      const where = item.levels.map(id => grayLevels.find(level => level.id === id).segment).join(', ');
      return `<button data-gray-item="${item.id}" aria-pressed="false" ${enabled ? '' : 'disabled'} style="--region-color:${item.color}"><span class="gray-item-code" aria-hidden="true">${item.code}</span><span>${escape(item.name)}${enabled ? '' : `<small>Disponible en ${where}</small>`}</span></button>`;
    }).join('');
    options.querySelectorAll('button').forEach(button => button.addEventListener('click', () => select(button.dataset.grayItem, side, true)));
    select(selectedId);
  }

  function changeLevel(id) {
    const next = grayLevels.find(level => level.id === id);
    if (!next) return;
    const previous = getState().selected;
    levelId = id;
    zoomed = false;
    const resolved = getState();
    status.textContent = resolved.changed ? `${previous.name} no se representa en ${next.segment}. Ahora está seleccionada ${resolved.selected.name.toLowerCase()}.` : `Ahora exploras el segmento medular ${next.segment}.`;
    draw();
  }

  root.querySelectorAll('[data-gray-level]').forEach(button => button.addEventListener('click', () => changeLevel(button.dataset.grayLevel)));
  root.querySelectorAll('[data-gray-mode]').forEach(button => button.addEventListener('click', () => {
    const toLamina = { dorsal: 'I', ventral: 'IX', intermediate: 'VII', commissure: 'X', canal: 'X', gelatinosa: 'II', clarke: 'VII', motor: 'IX', lateral: 'VII', 'sacral-autonomic': 'VII' };
    const toStructure = { I: 'dorsal', II: 'gelatinosa', III: 'dorsal', IV: 'dorsal', V: 'dorsal', VI: 'dorsal', VII: 'intermediate', VIII: 'ventral', IX: 'motor', X: 'commissure' };
    if (button.dataset.grayMode === mode) return;
    mode = button.dataset.grayMode;
    selectedId = (mode === 'laminae' ? toLamina : toStructure)[selectedId];
    zoomed = false;
    status.textContent = mode === 'laminae' ? 'Las láminas de Rexed se definen por citoarquitectura. Los colores orientan la selección y no son una tinción.' : 'Explora las regiones y los núcleos disponibles en este segmento.';
    draw();
  }));
  root.querySelector('#gray-zoom-in').addEventListener('click', () => { zoomed = true; setView(); });
  root.querySelector('#gray-zoom-out').addEventListener('click', () => { zoomed = false; setView(); });
  root.querySelector('#gray-back-to-cut').addEventListener('click', () => root.querySelector('.gray-mode-options').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' }));
  draw();
  return { selectLevel: changeLevel };
}
