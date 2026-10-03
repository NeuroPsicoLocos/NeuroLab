import { regions, coverings, anatomySources, buildSpinalSegments } from './anatomy-content.js?v=6';
import { anatomyIllustrations } from './anatomy-illustrations.js?v=7';
import { buildCoveringCut, coveringFocusBounds } from './covering-cut.js?v=9';
import { setupCutZoom } from './cut-zoom.js?v=9';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ns = 'http://www.w3.org/2000/svg';

/** Crea SVG locales y accesibles. Cada botón tiene alternativa en la lista contigua. */
export function setupAnatomyPage() {
  const regionMap=document.querySelector('#region-map');
  const layerMap=document.querySelector('#covering-map');
  let coveringZoom=null;
  const diagramButton=(id,label,content,attribute)=>`<g ${attribute}="${id}" role="button" tabindex="0" aria-label="${escape(label)}" aria-pressed="false">${content}</g>`;
  const segments=buildSpinalSegments();
  // Una lámina con volumen y un mapa con recuentos comparten la misma selección.
  for (const [key,items,attribute] of [['regions',regions,'data-region'],['coverings',coverings,'data-covering']]) {
    const plate=anatomyIllustrations[key];
    const frame=document.querySelector(`#${key}-illustration`);
    const leaders=[...plate.points.filter(p=>p.labelX),...(plate.landmarks||[])];
    frame.innerHTML=`<img src="${plate.image}" width="${plate.width}" height="${plate.height}" alt="${escape(plate.alt)}" decoding="async">
      <svg class="anatomy-leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${leaders.map(p=>`<path d="M${p.x} ${p.y}L${p.labelX} ${p.labelY}"/><circle cx="${p.x}" cy="${p.y}" r=".7"/>`).join('')}</svg>
      ${plate.points.map((p,index)=>{const item=items.find(i=>i.id===p.id);return `<button class="anatomy-pin ${key==='regions'?'region-pin':'covering-pin'}" ${attribute}="${p.id}" aria-label="${escape(item.name)} en la lámina" aria-pressed="false" title="${escape(item.name)}" style="--pin-x:${p.labelX||p.x}%;--pin-y:${p.labelY||p.y}%;--pin-color:${item.color}">${key==='regions'?escape(item.name):`<span aria-hidden="true">${index+1}</span>`}</button>`;}).join('')}
      ${(plate.landmarks||[]).map(p=>`<span class="anatomy-landmark" style="left:${p.labelX}%;top:${p.labelY}%">${p.name}</span>`).join('')}`;
    document.querySelector(`#${key}-plate-caption`).textContent=plate.caption;
    document.querySelector(`#${key}-plate-fullsize`).href=plate.image;
    frame.querySelector('img').addEventListener('error',()=>{
      const card=frame.closest('.anatomy-card');
      card.querySelector('[data-anatomy-view="plate"]').disabled=true;
      card.querySelector('[data-anatomy-view="map"]').click();
    });
  }
  document.querySelectorAll('[data-anatomy-view]').forEach(button=>button.addEventListener('click',()=>{
    const card=button.closest('.anatomy-card');
    card.querySelectorAll('[data-anatomy-view]').forEach(control=>{
      const active=control===button;control.classList.toggle('active',active);control.setAttribute('aria-pressed',active);
    });
    card.querySelectorAll('[data-anatomy-panel]').forEach(panel=>panel.hidden=panel.dataset.anatomyPanel!==button.dataset.anatomyView);
    if(card.querySelector('#covering-map')) coveringZoom?.reset();
  }));
  let vertebrae='';
  for(const [prefix,count,start,step] of [['C',7,64,18],['T',12,194,20],['L',5,440,31]]) {
    for(let i=0;i<count;i++) {
      const y=start+i*step;
      vertebrae+=`<g><rect x="315" y="${y}" width="28" height="${prefix==='L'?21:13}" rx="4"/><path d="M343 ${y+3}l14 7-14 3"/><text x="369" y="${y+11}">${prefix}${i+1}</text></g>`;
    }
  }
  regionMap.innerHTML=`<title>Regiones de la médula y salidas de sus nervios</title><desc>Comparación esquemática de 31 pares de raíces con la columna. La médula termina antes que el canal vertebral; las raíces inferiores descienden formando la cola de caballo.</desc>
    <defs><clipPath id="whole-cord"><path d="M151 57Q147 73 146 86Q132 112 137 145Q143 172 143 212L143 302Q130 341 139 374Q141 397 147 416L160 453L173 416Q180 397 182 374Q191 341 177 302L177 212Q177 172 183 145Q188 112 175 86Q172 73 169 57Z"/></clipPath></defs>
    <text x="156" y="24" text-anchor="middle" class="diagram-heading">Segmentos y raíces</text><text x="352" y="24" text-anchor="middle" class="diagram-heading">Vértebras</text>
    <path d="M144 52L133 338Q132 367 145 440L145 715Q160 738 175 715L175 440Q188 367 187 338L176 52" fill="none" stroke="#d6e0df" stroke-width="2" stroke-dasharray="4 5"/>
    <g class="region-root-lines">${segments.map(s=>`<g data-region-visual="${s.region}"><path d="M148 ${s.origin}C${s.exit>450?142:125} ${s.origin+18} 112 ${s.exit} 38 ${s.exit}" stroke="${s.color}"/><path d="M172 ${s.origin}C${s.exit>450?178:195} ${s.origin+18} 211 ${s.exit} 268 ${s.exit}" stroke="${s.color}"/><circle cx="244" cy="${s.exit}" r="2.7" fill="${s.color}"/><text x="274" y="${s.exit+3}">${s.label}</text></g>`).join('')}</g>
    <g clip-path="url(#whole-cord)" class="region-territories">${regions.map(r=>diagramButton(r.id,`Región ${r.name.toLowerCase()}, ${r.range}`,`<rect x="130" y="${r.start}" width="60" height="${r.end-r.start}" fill="${r.color}"/>`,'data-region')).join('')}
    ${segments.map(s=>`<path d="M138 ${s.origin}h45" stroke="white" stroke-opacity=".3"/>`).join('')}<path d="M143 439L160 453L177 439" fill="#ae6f79"/></g>
    <path d="M160 456V727" fill="none" stroke="#b99b71" stroke-width="2"/>
    <g class="vertebral-reference">${vertebrae}<path d="M316 598Q309 627 330 692Q350 647 343 598Z"/><text x="366" y="636">Sacro</text><path d="M327 698Q328 721 336 730L343 711Z"/><text x="362" y="716">Cóccix</text></g>
    <path d="M178 450H309" class="level-guide"/><text x="46" y="477" class="diagram-note">Cono medular</text><text x="46" y="492" class="diagram-note">≈ nivel vertebral L1–L2</text>
    <text x="48" y="575" class="diagram-note">Cola de caballo</text><text x="48" y="590" class="diagram-note">(raíces, no médula)</text><text x="178" y="746" class="diagram-note">Filum terminale</text>`;
  document.querySelector('#region-options').innerHTML=regions.map(r=>`<button data-region="${r.id}" aria-pressed="false"><span class="anatomy-swatch" style="background:${r.color}"></span><span>${r.name}<small>${r.range}</small></span><b>${r.count} ${r.count===1?'par':'pares'}</b></button>`).join('');

  layerMap.innerHTML=buildCoveringCut(coverings,diagramButton);
  coveringZoom=setupCutZoom(layerMap,document.querySelector('#covering-cut-tools'),[0,0,560,460]);
  document.querySelector('#covering-options').innerHTML=coverings.map((c,index)=>`<button data-covering="${c.id}" aria-pressed="false"><span class="anatomy-key" style="--pin-color:${c.color}" aria-hidden="true">${index+1}</span>${c.name}</button>`).join('');

  function detail(host,item) {
    host.style.borderTopColor=item.color;
    host.innerHTML=`<span class="step">${escape(item.range||item.kind)}</span><h3>${escape(item.name)}</h3>${[['Anatomía',item.anatomy],['Conectividad',item.connectivity],['Función',item.function],['Clínica',item.clinical]].map(([name,text])=>`<div class="anatomy-detail-block"><h4>${name}</h4><p>${escape(text)}</p></div>`).join('')}<div class="anatomy-detail-block"><h4>Bibliografía</h4>${item.sources.map(id=>`<a href="${anatomySources[id].url}" target="_blank" rel="noopener noreferrer">${escape(anatomySources[id].title)} ↗</a>`).join('')}</div>`;
  }
  function select(attribute,items,id,host,reveal=false) {
    const item=items.find(i=>i.id===id);if(!item)return;
    document.querySelectorAll(`[${attribute}]`).forEach(button=>{
      const active=button.getAttribute(attribute)===id;
      button.classList.toggle('selected',active);button.setAttribute('aria-pressed',active);
    });
    if(attribute==='data-region') document.querySelectorAll('[data-region-visual]').forEach(group=>group.classList.toggle('region-muted',group.dataset.regionVisual!==id));
    const status=document.querySelector(attribute==='data-region'?'#regions-plate-selection':'#coverings-plate-selection');
    status.textContent=`${item.name}${item.range?` · ${item.range}`:''}`;
    detail(host,item);
    if(attribute==='data-covering') coveringZoom.select(coveringFocusBounds[id],item.name);
    if(reveal&&attribute==='data-covering'&&matchMedia('(max-width:760px)').matches) host.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }
  document.querySelector('#back-to-covering-map').addEventListener('click',()=>layerMap.closest('.anatomy-card').querySelector('.anatomy-mode').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
  for(const [attribute,items,host] of [['data-region',regions,document.querySelector('#region-detail')],['data-covering',coverings,document.querySelector('#covering-detail')]]) {
    document.querySelectorAll(`[${attribute}]`).forEach(button=>{
      button.addEventListener('click',()=>select(attribute,items,button.getAttribute(attribute),host,true));
      if(button.namespaceURI===ns) button.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();select(attribute,items,button.getAttribute(attribute),host,true);}
      });
    });
    select(attribute,items,items[0].id,host);
  }
}
