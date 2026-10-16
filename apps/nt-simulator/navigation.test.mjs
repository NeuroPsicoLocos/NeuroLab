import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {NAV_VIEWS,resolveView} from './navigation.mjs';
const files=['index','glutamate','acetylcholine','dopamine','serotonin'];
function boot(file='glutamate',hash=''){
 const html=readFileSync(new URL('./'+file+'.html',import.meta.url),'utf8'),all=[],ids=new Map(),stack=[],voids=new Set(['meta','link','input','hr','br','img','source','wbr','area','base','embed','param','track','col']),timers=new Map(),events=new Map();let serial=0,last=0,doc;
 class Element{
  constructor(tag,attrs,parent){this.tag=tag;this.attrs=attrs;this.parent=parent;this.children=[];this.listeners=new Map();this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
   this.id=attrs.id;this.className=attrs.class||'';this.hidden='hidden'in attrs;this.checked='checked'in attrs;this.value=attrs.value||'';this.textContent='';this.innerHTML='';this.disabled=false;}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){if(!this.listeners.has(k))this.listeners.set(k,[]);this.listeners.get(k).push(fn);}
  closest(sel){for(let p=this;p;p=p.parent){if(sel==='[data-workspace-view]'&&p.dataset.workspaceView)return p;if(sel==='a[href^="#"]'&&p.tag==='a'&&p.attrs.href?.startsWith('#'))return p;}return null;}
  focus(){doc.activeElement=this;}scrollIntoView(){this.scrolled=true;}getBoundingClientRect(){return {height:this.className==='workspace-context'?95:110};}
  fire(k,extra={}){const e={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};this['on'+k]?.(e);for(const fn of this.listeners.get(k)||[])fn(e);if(k==='click')for(const fn of events.get('document:click')||[])fn(e);return e;}
  click(){if(!this.disabled)this.fire('click');}
 }
 for(const m of html.matchAll(/<(\/?)([a-z][\w-]*)([^>]*?)>/gi)){
  const text=html.slice(last,m.index);for(const n of stack)n.textContent+=text;last=m.index+m[0].length;const tag=m[2].toLowerCase();if(m[1]){assert.equal(stack.pop()?.tag,tag);continue;}
  const attrs={};for(const a of m[3].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';const n=new Element(tag,attrs,stack.at(-1));if(n.parent)n.parent.children.push(n);all.push(n);if(n.id){assert.ok(!ids.has(n.id));ids.set(n.id,n);}if(!voids.has(tag))stack.push(n);
 }
 for(const n of all.filter(n=>n.tag==='select')){const options=n.children.filter(n=>n.tag==='option');n.value=(options.find(o=>'selected'in o.attrs)||options[0])?.value||'';}
 const add=(prefix,k,fn)=>{const key=prefix+':'+k;if(!events.has(key))events.set(key,[]);events.get(key).push(fn);};
 doc={getElementById(id){return ids.get(id)||null;},body:all.find(n=>n.tag==='body'),documentElement:{style:{setProperty(){}}},querySelector(s){return all.find(n=>n.className.split(' ').includes(s.slice(1)));},querySelectorAll(s){if(s==='[data-nt-link]')return all.filter(n=>'data-nt-link'in n.attrs);const links=all.filter(n=>'data-view-link'in n.attrs);if(s==='[data-view-link]')return links;assert.equal(s,'.workspace-nav [data-view-link]');return links.filter(n=>{for(let p=n.parent;p;p=p.parent)if(p.className==='workspace-nav')return true;return false;});},addEventListener(k,fn){add('document',k,fn);}};
 const win={location:{hash},history:{pushState(_,__,value){win.location.hash=value;}},addEventListener(k,fn){add('window',k,fn);}};
 const context=vm.createContext({document:doc,window:win,setInterval(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearInterval(id){timers.delete(id);}});
 for(const m of html.matchAll(/<script src="([^"?]+)/g))vm.runInContext(readFileSync(new URL('./'+m[1],import.meta.url),'utf8'),context);
 return {doc,win,ids,all,timers,n:id=>ids.get(id),go(id){doc.querySelectorAll('.workspace-nav [data-view-link]').find(a=>a.dataset.viewLink===id).click();},restore(hash){win.location.hash=hash;for(const fn of events.get('window:popstate')||[])fn();}};
}
function active(b){return NAV_VIEWS.filter(v=>!b.n(v.id).hidden).map(v=>v.id);}
test('Cinco módulos: inicia solo Sinapsis y todas las vistas están fuera de desplegables',()=>{
 for(const file of files){const b=boot(file);assert.deepEqual(active(b),['transmission']);for(const v of NAV_VIEWS){const n=b.n(v.id);assert.equal(n.parent.id,'workspace-content');for(let p=n.parent;p;p=p.parent)assert.notEqual(p.tag,'details');}assert.equal(b.doc.querySelectorAll('.workspace-nav [data-view-link]').filter(a=>a.attrs['aria-current']==='step').length,1);}
});
test('Navegar conserva referencias, predicción, receptor, cursor y resultados',()=>{
 for(const file of files){const b=boot(file);b.go('potentials');const n=b.n;n('c-prediction').value='less';n('c-change').value='half-release';n('c-compare').click();n('c-time').value='40';n('c-time').fire('input');const result=n('c-result').textContent,plot=n('c-plot').innerHTML;b.go('pharmacology');b.go('notes');b.go('potentials');assert.equal(n('c-result').textContent,result);assert.equal(n('c-plot').innerHTML,plot);assert.equal(n('c-time').value,'40');assert.equal(n('c-prediction').value,'less');assert.equal(b.doc.activeElement.id,'c-experiment-title');assert.deepEqual(active(b),['potentials']);}
});
test('Cambiar de vista pausa reproducción sin reiniciar la etapa',()=>{
 for(const file of files){const b=boot(file),g=file==='index',play=b.n(g?'play-pause':'c-play'),progress=b.n(g?'progress':'c-step-label');play.click();assert.equal(b.timers.size,1);[...b.timers.values()][0].fn();const stage=progress.textContent.split(' · ')[0];b.go('receptors');assert.equal(b.timers.size,0);b.go('transmission');assert.equal(progress.textContent.split(' · ')[0],stage);assert.match(progress.textContent,/pausada/);}
});
test('Enlaces directos, historial y anclas internas abren el panel correcto',()=>{
 for(const hash of ['#pharmacology','#fx-agent','#receptors','#c-plot','#notes']){const b=boot('glutamate',hash),expected=hash==='#fx-agent'?'pharmacology':hash==='#c-plot'?'potentials':hash.slice(1);assert.deepEqual(active(b),[expected]);b.restore('#transmission');assert.deepEqual(active(b),['transmission']);b.restore(hash);assert.deepEqual(active(b),[expected]);}
 const b=boot();b.go('notes');const link=b.all.find(n=>n.tag==='a'&&n.attrs.href==='#receptors'&&!n.dataset.viewLink);assert.ok(link);link.click();assert.deepEqual(active(b),['receptors']);assert.equal(b.win.location.hash,'#receptors');assert.equal(resolveView('#%invalid'),'transmission');
});
test('Cambiar NT conserva la actividad; enlaces modificados mantienen navegación nativa',()=>{
 const b=boot();b.go('pharmacology');assert.ok(b.doc.querySelectorAll('[data-nt-link]').every(a=>a.attrs.href.endsWith('#pharmacology')));const link=b.doc.querySelectorAll('.workspace-nav [data-view-link]')[0];link.fire('click',{metaKey:true});assert.deepEqual(active(b),['pharmacology']);
});
test('Receptor compartido actualiza contexto y respuesta sin alterar Fx',()=>{
 const b=boot('dopamine');b.n('c-receptor').value='D1';b.n('c-receptor').fire('change');assert.match(b.n('workspace-mode').textContent,/conceptual/);b.go('potentials');assert.equal(b.n('c-numeric').hidden,true);assert.doesNotMatch(b.n('c-experiment-title').textContent,/^2\./);b.n('c-reset').click();assert.match(b.n('workspace-mode').textContent,/modelo reducido/);assert.equal(b.n('fx-receptor').value,'D2');
});
