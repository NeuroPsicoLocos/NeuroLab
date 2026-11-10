(function () {
  'use strict';
  const D = window.SITE;
  const main = document.getElementById('main');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function el(tag, attrs = {}, html) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v !== undefined && v !== null) n.setAttribute(k, v); }
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  const store = {
    get(k, d) { try { const v = localStorage.getItem('lenguaje-afasias:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lenguaje-afasias:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  const tagHTML = (t) => `<span class="tag ${t}">${D.TAGS[t]}</span>`;

  // ---------- Tema ----------
  const root = document.documentElement;
  const saved = store.get('theme', null);
  if (saved) root.setAttribute('data-theme', saved);
  $('#theme-btn').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store.set('theme', next);
  });
  $('#menu-btn').addEventListener('click', () => {
    const nav = $('#nav'); const open = nav.classList.toggle('open');
    $('#menu-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // ---------- Mapa cerebral ----------
  let bmCount = 0;
  const ORDER = ['a1', 'pstg', 'spt', 'smg', 'ag', 'pmtg', 'atl', 'ba44', 'ba45', 'ba47', 'vpmc', 'dorsal', 'ventral'];
  function brainmap(container, opts = {}) {
    const id = 'bm' + (++bmCount);
    const wrap = el('div', { class: 'brainmap-wrap' + (opts.compact ? ' compact' : '') });
    const fig = el('div');
    fig.innerHTML = D.BRAIN_SVG.split('__ID__').join(id);
    const svg = fig.querySelector('svg');
    if (opts.draw) svg.classList.add('draw');
    fig.appendChild(el('div', { class: 'legend-streams' }, '<span class="d"><b>Vía dorsal:</b> sonido → articulación</span><span class="v"><b>Vía ventral:</b> sonido → significado</span>'));
    const panel = el('div', { class: 'bm-panel' });
    const info = el('div', { 'aria-live': 'polite' }, '<h4>Toca una región o una vía</h4><p class="muted">Cada zona muestra su contribución predominante y qué ocurre cuando se lesiona. También puedes elegirla en la lista.</p>');
    const chips = el('div', { class: 'bm-chips', role: 'group', 'aria-label': 'Regiones y vías' });
    ORDER.forEach(k => {
      const b = el('button', { class: 'chip', type: 'button', 'data-k': k, 'aria-pressed': 'false' }, D.REGIONS[k].name.split(' (')[0]);
      chips.appendChild(b);
    });
    panel.appendChild(info); panel.appendChild(chips);
    function select(k) {
      const r = D.REGIONS[k];
      info.innerHTML = `<h4>${r.name}</h4><dl><dt>Contribución predominante</dt><dd>${r.fn}</dd><dt>Si se lesiona</dt><dd>${r.les}</dd></dl>`;
      $$('[data-r]', svg).forEach(n => n.classList.toggle('sel', n.dataset.r === k));
      $$('.bm-stream', svg).forEach(n => n.classList.toggle('sel', n.classList.contains(k)));
      $$('.chip', chips).forEach(c => c.setAttribute('aria-pressed', c.dataset.k === k ? 'true' : 'false'));
    }
    svg.addEventListener('click', e => { const t = e.target.closest('[data-r]'); if (t) select(t.dataset.r); });
    svg.addEventListener('keydown', e => { const t = e.target.closest('[data-r]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(t.dataset.r); } });
    chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) select(b.dataset.k); });
    wrap.appendChild(fig); wrap.appendChild(panel);
    container.appendChild(wrap);
    if (opts.initial) select(opts.initial);
  }

  // ---------- Widgets de sesión ----------
  const W = {
    brainmap(c) { brainmap(c, { initial: 'pstg' }); },
    timeline(c) {
      const T = D.TIMELINE;
      const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Período de desarrollo' });
      const grid = el('div', { class: 'tl-grid', 'aria-live': 'polite' });
      const cols = ['var(--accent)', 'var(--dorsal)', 'var(--ventral)', 'var(--violet)'];
      function show(i) {
        $$('.chip', seg).forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
        grid.innerHTML = T.rows.map((r, ri) => `<div class="tl-cell" style="--c:${cols[ri]}"><h5>${r}</h5><p>${T.cells[ri][i]}</p></div>`).join('');
      }
      T.ages.forEach((a, i) => { const b = el('button', { class: 'chip', type: 'button' }, a); b.addEventListener('click', () => show(i)); seg.appendChild(b); });
      c.appendChild(seg); c.appendChild(grid); show(3);
    },
    lateral(c) {
      const data = [['Diestros marcados', 4], ['Ambidiestros', 15], ['Zurdos marcados', 27]];
      c.innerHTML = '<p class="small muted"><strong>Dominancia del hemisferio derecho para el lenguaje según la lateralidad manual</strong> (Doppler transcraneal funcional, n = 326; Knecht et al., 2000)</p><div class="bars">' +
        data.map(([l, v]) => `<div class="bar-row"><span>${l}</span><div class="bar-track" role="img" aria-label="${l}: ${v} %"><div class="bar-fill" style="width:${v / 30 * 100}%"></div></div><b>${v} %</b></div>`).join('') + '</div>';
    },
    alerts(c) {
      c.innerHTML = `<div class="two-col"><div class="panel ok"><h4>Dentro de la variación: vigilar y acompañar</h4><ul>
        <li>Primeras palabras hacia los 15–16 meses con buena comprensión, gestos e interacción.</li>
        <li>"Hablante tardío" a los 24 meses (menos de unas 50 palabras o sin combinaciones) con comprensión y juego adecuados: muchos alcanzan el rango típico.</li>
        <li>Niños bilingües con vocabulario repartido entre lenguas y mezcla de códigos.</li>
        <li>Simplificaciones propias de la edad ("tete" por "chupete").</li></ul></div>
        <div class="panel bad"><h4>Señales de alerta: derivar para evaluación</h4><ul>
        <li>Sin balbuceo canónico hacia los 10–12 meses.</li>
        <li>Sin gestos comunicativos (señalar, mostrar, decir adiós) a los 12 meses.</li>
        <li>Sin palabras a los 16 meses.</li>
        <li>Sin frases espontáneas de dos palabras a los 24 meses.</li>
        <li><strong>Cualquier pérdida</strong> de habilidades lingüísticas o sociales, a cualquier edad.</li>
        <li>Comprensión limitada o falta de respuesta al nombre o a los sonidos.</li></ul></div></div>`;
    },
    inner(c) {
      const s = [['Habla social', 'el adulto regula', '"Pon primero la pieza roja."'], ['Habla privada audible', 'hacia los 3–5 años', '"La roja… no, ahí no… ¡aquí!"'], ['Habla privada parcial', 'hacia los 5–8 años', 'murmullos, susurros, labios que se mueven'], ['Lenguaje interno', 'escolares y adultos', 'silencioso, condensado o expandido']];
      c.innerHTML = '<div class="steps">' + s.map(([a, b, e]) => `<div class="step"><strong>${a}</strong><span class="muted small">${b}</span><em>${e}</em></div>`).join('') + '</div><p class="small muted" style="margin-top:10px">De la regulación por otro a la autorregulación: el habla se interioriza y se abrevia.</p>';
    },
    reading(c) {
      c.innerHTML = `<div class="quad" role="img" aria-label="Cuadrante de la visión simple de la lectura">
        <div class="ax-y">Comprensión oral →</div>
        <div class="q q1"><strong>Dislexia</strong><span>decodifica mal, comprende bien lo oral</span></div>
        <div class="q q2"><strong>Lector típico</strong><span>ambos componentes adecuados</span></div>
        <div class="q q3"><strong>Dificultad mixta</strong><span>ambos componentes bajos</span></div>
        <div class="q q4"><strong>Comprensión pobre</strong><span>decodifica bien, comprende mal lo oral (p. ej., TDL)</span></div>
        <div class="ax-x">Decodificación →</div></div>`;
    },
    syndromes(c) {
      const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Síndrome' });
      const box = el('div', { 'aria-live': 'polite' });
      function show(i) {
        $$('.chip', seg).forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
        box.innerHTML = ''; box.appendChild(synCard(D.SYNDROMES[i]));
      }
      D.SYNDROMES.forEach((s, i) => { const b = el('button', { class: 'chip', type: 'button' }, s.name); b.addEventListener('click', () => show(i)); seg.appendChild(b); });
      c.appendChild(seg); c.appendChild(box); show(0);
    }
  };

  function synCard(s) {
    const dims = ['Fluidez', 'Comprensión', 'Repetición', 'Denominación'];
    const card = el('div', { class: 'syn' });
    card.innerHTML = `<div><h4>Afasia ${s.name === 'Broca' || s.name === 'Wernicke' ? 'de ' + s.name : s.name.toLowerCase().replace('conducción', 'de conducción')}</h4>
      <div class="fcr"><span><b>Fluidez</b>${s.fcr[0]}</span><span><b>Comprensión</b>${s.fcr[1]}</span><span><b>Repetición</b>${s.fcr[2]}</span></div>
      <div class="prof" aria-label="Perfil típico, 5 = conservado">${s.prof.map((v, i) => `<div class="prof-row"><span>${dims[i]}</span>${[0, 1, 2, 3, 4].map(k => `<i class="${k < v ? 'on' : ''}"></i>`).join('')}</div>`).join('')}</div>
      <div class="sample">${s.sample}</div><p>${s.feat}</p></div>
      <div><figure class="figure"><img src="${s.img}" alt="Esquema del hemisferio izquierdo con la lesión probable de la afasia ${s.name.toLowerCase()}"><figcaption>Lesión probable (en rojo). Esquema original simplificado.</figcaption></figure><p class="small">${s.lesion}</p></div>`;
    return card;
  }

  // ---------- Vistas ----------
  function renderHome() {
    const nCases = D.CASES.length;
    main.innerHTML = `
    <section class="hero">
      <div>
        <h1>Del sonido al significado, y de la lesión al síntoma</h1>
        <p class="lead">Material de estudio sobre neurobiología del lenguaje, su desarrollo y las afasias, para estudiantes de Psicología. Tres sesiones, un mapa interactivo de la red del lenguaje y ${nCases} casos clínicos para practicar el razonamiento.</p>
        <div class="btn-row"><a class="btn" href="#s1">Empezar por la sesión 1</a><a class="btn ghost" href="#casos">Practicar con casos clínicos</a></div>
      </div>
      <div class="hero-visual" id="hero-map"></div>
    </section>
    <section class="band"><h2>Tres sesiones, de la red sana al daño adquirido</h2><p class="lead">Cada sesión se puede estudiar por separado, pero la secuencia es acumulativa.</p>
      <div class="sessions">${D.SESSIONS.map(s => `<a class="session-row" href="#${s.id}"><span class="session-num">${s.n}</span><div><h3>${s.title}</h3><p>${s.lead}</p></div><span class="session-meta">${s.topics.length} temas</span></a>`).join('')}</div></section>
    <section class="band"><h2>Practica lo aprendido</h2><p class="lead">Ejercicios con respuesta inmediata y razonamiento explicado.</p>
      <div class="practice"><a href="#casos"><strong>Casos clínicos</strong><span>${nCases} casos de desarrollo temprano, trastornos del desarrollo y afasias, con solución razonada.</span></a>
      <a href="#herramientas"><strong>Árbol de decisión</strong><span>Responde tres preguntas sobre un paciente y obtén la hipótesis sindrómica.</span></a>
      <a href="#herramientas/mitos"><strong>Mitos y evidencia</strong><span>${D.MYTHS.length} afirmaciones frecuentes que la investigación obliga a corregir.</span></a></div></section>
    <section class="band"><h2>Cómo leer las etiquetas</h2><p class="lead">Cada tema indica qué tipo de evidencia respalda sus afirmaciones.</p>
      <div class="tag-legend">
        <div>${tagHTML('est')}<p>Resultado replicado y ampliamente aceptado.</p></div>
        <div>${tagHTML('mod')}<p>Marco teórico que organiza la evidencia y genera predicciones.</p></div>
        <div>${tagHTML('deb')}<p>Propuesta con apoyo parcial o resultados contradictorios.</p></div>
        <div>${tagHTML('hist')}<p>Modelo superado o reformulado, útil por su valor conceptual.</p></div>
        <div>${tagHTML('cor')}<p>Afirmación frecuente que la evidencia obliga a corregir.</p></div>
        <div>${tagHTML('cli')}<p>Uso del conocimiento para evaluar o intervenir.</p></div>
      </div></section>
    <section class="band"><h2>Diapositivas para clase</h2><p class="lead">El mismo contenido, ampliado, en una presentación editable de 73 diapositivas para tres sesiones de 120 minutos.</p>
      <a class="btn ghost" href="${D.PPTX}" download>Descargar la presentación (.pptx)</a></section>`;
    brainmap($('#hero-map'), { compact: true, draw: true });
  }

  function renderSession(i, sub) {
    const s = D.SESSIONS[i];
    main.innerHTML = `
    <header class="session-head"><div><span class="kicker">Sesión ${s.n}</span><h1>${s.title}</h1><p class="lead" style="margin-top:14px">${s.lead}</p></div>
      <div class="goals"><h2>Al terminar podrás</h2><ol>${s.goals.map(g => `<li>${g}</li>`).join('')}</ol></div></header>
    <div class="session-body">
      <nav class="toc" aria-label="Temas de la sesión"><h2>Temas</h2><ol>${s.topics.map(t => `<li><a href="#${s.id}/${t.id}" data-t="${t.id}">${t.title}</a></li>`).join('')}</ol></nav>
      <div id="topics"></div>
    </div>`;
    const wrap = $('#topics');
    s.topics.forEach((t, k) => {
      const a = el('article', { class: 'topic', id: t.id });
      a.innerHTML = `<span class="topic-n">Tema ${k + 1}</span><div class="tags">${t.tags.map(tagHTML).join('')}</div><h3>${t.title}</h3><div class="content">${t.body}</div>`;
      if (t.img) a.appendChild(el('figure', { class: 'figure' }, `<img src="${t.img}" alt="${t.imgAlt || ''}"><figcaption>Esquema original simplificado del hemisferio izquierdo, vista lateral.</figcaption>`));
      if (t.widget) { const w = el('div', { class: 'widget' }); W[t.widget](w); a.appendChild(w); }
      if (t.example) a.appendChild(el('aside', { class: 'example' }, '<h4>Ejemplo</h4>' + t.example));
      a.appendChild(el('p', { class: 'key' }, t.key));
      a.appendChild(el('p', { class: 'refs' }, 'Referencias: ' + t.refs + ' <a href="#bibliografia">Ver bibliografía</a>'));
      wrap.appendChild(a);
    });
    const prev = i > 0 ? `<a class="btn ghost" href="#${D.SESSIONS[i - 1].id}">Sesión ${i}: ${D.SESSIONS[i - 1].title}</a>` : '<span></span>';
    const next = i < 2 ? `<a class="btn" href="#${D.SESSIONS[i + 1].id}">Sesión ${i + 2}: ${D.SESSIONS[i + 1].title}</a>` : '<a class="btn" href="#casos">Ir a los casos clínicos</a>';
    wrap.appendChild(el('div', { class: 'pager' }, prev + next));
    // resaltar tema activo
    const links = $$('.toc a');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.dataset.t === e.target.id)); }); }, { rootMargin: '-20% 0px -70% 0px' });
      $$('.topic').forEach(t => io.observe(t));
    }
  }

  function renderCases(sub) {
    const groups = ['Todos', 'Desarrollo temprano', 'Trastornos del desarrollo', 'Afasias'];
    const solved = new Set(store.get('solved', []));
    main.innerHTML = `<header class="session-head"><div><span class="kicker">Práctica</span><h1>Casos clínicos</h1><p class="lead" style="margin-top:14px">Lee el caso, elige una respuesta y compara tu razonamiento con la solución. Todos los casos son ficticios.</p></div>
      <div class="goals"><h2>Cómo razonar</h2><ol><li>Identifica qué nivel o función falla.</li><li>Busca datos que apoyen tu hipótesis y datos que descarten alternativas.</li><li>Decide el siguiente paso de evaluación o derivación.</li></ol></div></header>
      <div class="filters" role="group" aria-label="Filtrar casos" style="margin-top:28px">${groups.map((g, i) => `<button class="chip" type="button" aria-pressed="${i === 0}" data-g="${g}">${g}</button>`).join('')}<span class="progress" aria-live="polite"></span></div>
      <div id="case-list"></div>`;
    const list = $('#case-list');
    const prog = $('.progress');
    const upd = () => { prog.textContent = `${solved.size} de ${D.CASES.length} casos resueltos`; };
    D.CASES.forEach(c => {
      const art = el('article', { class: 'case', id: c.id, 'data-g': c.group });
      art.innerHTML = `<span class="case-group">${c.group}</span><h3>${c.title}</h3><p class="vignette">${c.vignette}</p><p class="q-label">${c.question}</p>
        <div class="options">${c.options.map((o, i) => `<button class="opt" type="button" data-i="${i}">${o}</button>`).join('')}</div>
        <p class="feedback" aria-live="polite"></p><button class="reveal" type="button">Ver la solución sin responder</button>`;
      const sol = el('div', { class: 'solution' + (c.img ? ' with-img' : ''), hidden: '' });
      sol.innerHTML = `<div>${c.dx ? `<p class="dx">${c.dx}</p>` : ''}${c.sol.map(([h, t]) => `<div class="sol-sec"><h4>${h}</h4><p>${t}</p></div>`).join('')}</div>` +
        (c.img ? `<figure class="figure"><img src="${c.img}" alt="Localización probable de la lesión en el caso ${c.title}"><figcaption>${c.cap || ''}</figcaption></figure>` : '');
      art.appendChild(sol);
      const fb = $('.feedback', art);
      const open = () => { sol.hidden = false; $('.reveal', art).hidden = true; solved.add(c.id); store.set('solved', [...solved]); upd(); };
      $('.options', art).addEventListener('click', e => {
        const b = e.target.closest('.opt'); if (!b) return;
        const i = +b.dataset.i;
        $$('.opt', art).forEach(o => o.classList.remove('right', 'wrong'));
        if (i === c.answer) { b.classList.add('right'); fb.className = 'feedback ok'; fb.textContent = 'Correcto. Revisa si tu razonamiento coincide con la solución.'; }
        else { b.classList.add('wrong'); $$('.opt', art)[c.answer].classList.add('right'); fb.className = 'feedback no'; fb.textContent = 'No es la mejor opción. La respuesta más adecuada está marcada; lee por qué.'; }
        open();
      });
      $('.reveal', art).addEventListener('click', () => { $$('.opt', art)[c.answer].classList.add('right'); open(); });
      list.appendChild(art);
    });
    $('.filters').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.filters .chip').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      $$('.case', list).forEach(a => { a.hidden = !(b.dataset.g === 'Todos' || a.dataset.g === b.dataset.g); });
    });
    upd();
  }

  function renderTools(sub) {
    main.innerHTML = `<header class="session-head"><div><span class="kicker">Herramientas</span><h1>Para orientar el razonamiento clínico</h1><p class="lead" style="margin-top:14px">Un árbol de decisión para las afasias, una matriz para los trastornos del desarrollo y una colección de mitos frecuentes.</p></div></header>
    <section class="tool" id="arbol" style="margin-top:32px"><h2>Árbol de decisión de las afasias</h2><p class="muted">Indica cómo están la fluidez, la comprensión y la repetición del paciente. Es una heurística: los casos intermedios exigen la evaluación completa, y la denominación está alterada en casi todos los síndromes.</p>
      <div class="tree-q">
        ${[['f', 'Fluidez', 'Fluente', 'No fluente'], ['c', 'Comprensión', 'Preservada', 'Alterada'], ['r', 'Repetición', 'Preservada', 'Alterada']].map(([k, l, a, b]) => `<fieldset><legend>${l}</legend><div class="seg" style="margin:0"><button class="chip" type="button" data-q="${k}" data-v="1">${a}</button><button class="chip" type="button" data-q="${k}" data-v="0">${b}</button></div></fieldset>`).join('')}
      </div><div class="tree-result" aria-live="polite"><p class="muted">Responde las tres preguntas para ver la hipótesis sindrómica.</p></div></section>
    <section class="tool" id="matriz"><h2>Matriz diferencial de los trastornos del desarrollo</h2><p class="muted">La primera pregunta es siempre qué nivel falla.</p>
      <div class="table-wrap"><table><thead><tr><th>Trastorno</th><th>Nivel afectado</th><th>Comprensión oral</th><th>Rasgo nuclear</th><th>Pista diferencial</th><th>Derivación prioritaria</th></tr></thead><tbody>
      <tr><td>TDL</td><td>Sistema lingüístico</td><td>Puede estar alterada</td><td>Errores gramaticales, vocabulario limitado</td><td>No explicado por audición, autismo ni discapacidad intelectual</td><td>Logopedia o fonoaudiología; psicología</td></tr>
      <tr><td>Sonidos del habla</td><td>Fonológico o articulatorio</td><td>Normal</td><td>Sustituciones, omisiones, distorsiones</td><td>Lenguaje expresivo y receptivo adecuados</td><td>Logopedia; audiología</td></tr>
      <tr><td>Dislexia</td><td>Decodificación escrita</td><td>Normal</td><td>Lectura lenta o imprecisa, mala ortografía</td><td>Falla con pseudopalabras</td><td>Psicopedagogía; neuropsicología</td></tr>
      <tr><td>Disartria</td><td>Ejecución neuromuscular</td><td>Normal</td><td>Habla imprecisa; voz y resonancia alteradas</td><td>Signos neurológicos; afecta la deglución</td><td>Neurología; logopedia</td></tr>
      <tr><td>Tartamudez</td><td>Temporización de la fluidez</td><td>Normal</td><td>Repeticiones, prolongaciones, bloqueos con tensión</td><td>Mejora al cantar o hablar en coro</td><td>Logopedia temprana</td></tr>
      <tr><td>Mutismo selectivo</td><td>Regulación ansiosa de la conducta verbal</td><td>Normal</td><td>Silencio en contextos específicos</td><td>Habla normal en contextos seguros</td><td>Psicología clínica; escuela</td></tr>
      </tbody></table></div></section>
    <section class="tool" id="mitos"><h2>Mitos y evidencia</h2><p class="muted">Piensa primero por qué la afirmación es incorrecta y después compara con la evidencia.</p>
      <div class="myths">${D.MYTHS.map((m, i) => `<div class="myth"><p class="m">${m.myth}</p><button class="chip" type="button" data-m="${i}" aria-expanded="false">Ver la evidencia</button><div class="ev" hidden><p><strong>Lo que muestra la evidencia:</strong> ${m.ev}</p><p class="refs">${m.ref}. <a href="#${m.where}">Ir a la sesión ${m.where.slice(1)}</a></p></div></div>`).join('')}</div></section>`;
    const ans = {};
    const res = $('.tree-result');
    $('.tree-q').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      ans[b.dataset.q] = +b.dataset.v;
      $$(`.chip[data-q="${b.dataset.q}"]`).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      if (['f', 'c', 'r'].every(k => k in ans)) {
        const key = (ans.f ? 'F' : 'N') + (ans.c ? 'C' : 'c') + (ans.r ? 'R' : 'r');
        const map = { NCr: 'broca', NCR: 'tcmotora', Ncr: 'global', NcR: 'tcmixta', FCr: 'conduccion', FCR: 'anomica', Fcr: 'wernicke', FcR: 'tcsensorial' };
        const s = D.SYNDROMES.find(x => x.id === map[key]);
        res.innerHTML = ''; res.appendChild(synCard(s));
      }
    });
    $('.myths').addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      const ev = b.nextElementSibling; ev.hidden = !ev.hidden;
      b.setAttribute('aria-expanded', ev.hidden ? 'false' : 'true');
      b.textContent = ev.hidden ? 'Ver la evidencia' : 'Ocultar la evidencia';
    });
  }

  function renderRefs() {
    main.innerHTML = `<header class="session-head"><div><span class="kicker">Fuentes</span><h1>Bibliografía por sesión</h1><p class="lead" style="margin-top:14px">Referencias citadas en cada tema. Todas pueden localizarse por título en PubMed o Google Scholar.</p></div></header>
      <div style="margin-top:28px"><label for="q" class="small muted">Buscar por autor, año o tema</label><br><input id="q" class="search" type="search" placeholder="p. ej., Hickok, 2007, dislexia"></div>
      ${['s1', 's2', 's3'].map((k, i) => `<section class="ref-sec"><h2 style="margin-bottom:14px">Sesión ${i + 1}: ${D.SESSIONS[i].title}</h2><ul class="refs-list">${D.REFS[k].map(r => `<li>${r}</li>`).join('')}</ul></section>`).join('')}`;
    $('#q').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      $$('.refs-list li').forEach(li => { li.hidden = q && !li.textContent.toLowerCase().includes(q); });
    });
  }

  // ---------- Enrutador ----------
  const VIEWS = {
    inicio: [renderHome, 'Inicio'], s1: [(s) => renderSession(0, s), 'Sesión 1'], s2: [(s) => renderSession(1, s), 'Sesión 2'], s3: [(s) => renderSession(2, s), 'Sesión 3'],
    casos: [renderCases, 'Casos clínicos'], herramientas: [renderTools, 'Herramientas'], bibliografia: [renderRefs, 'Bibliografía']
  };
  let current = null;
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'inicio';
    const [view0, sub] = h.split('/');
    const view = VIEWS[view0] ? view0 : 'inicio';
    if (view !== current) {
      VIEWS[view][0](sub); current = view;
      document.title = VIEWS[view][1] + ' · Lenguaje y afasias';
      $$('#nav a').forEach(a => { if (a.getAttribute('href') === '#' + view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      if (!sub) window.scrollTo(0, 0);
    }
    if (sub) { const t = document.getElementById(sub); if (t) t.scrollIntoView({ block: 'start' }); }
    $('#nav').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
  }
  window.addEventListener('hashchange', route);
  route();
})();
