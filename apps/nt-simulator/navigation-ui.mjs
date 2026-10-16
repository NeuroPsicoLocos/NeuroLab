import {COURSE_RECEPTORS} from './course-content.mjs';
import {NAV_VIEWS,resolveView} from './navigation.mjs';
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
