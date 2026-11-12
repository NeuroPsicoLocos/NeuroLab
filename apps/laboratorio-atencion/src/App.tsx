"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Result = { name: string; score: number; note: string };

const searchItems = ["R","B","P","R","B","R","P","B","R","P","B","R","P","B","R","B","P","R","B","R","P","R","B","P"];
const stroopTrials = [
  {word:"ROJO", ink:"#2ea36a", answer:"VERDE"},
  {word:"AZUL", ink:"#e8493f", answer:"ROJO"},
  {word:"VERDE", ink:"#3c68df", answer:"AZUL"},
  {word:"ROJO", ink:"#3c68df", answer:"AZUL"},
  {word:"AZUL", ink:"#2ea36a", answer:"VERDE"},
];

export default function Home(){
  const [stage,setStage]=useState(0);
  const [results,setResults]=useState<Result[]>([]);
  const [picked,setPicked]=useState<number[]>([]);
  const [sawTriangle,setSawTriangle]=useState<boolean|null>(null);
  const [stroop,setStroop]=useState(0);
  const [stroopCorrect,setStroopCorrect]=useState(0);
  const [vigilance,setVigilance]=useState(0);
  const [hits,setHits]=useState(0);
  const [falseAlarms,setFalseAlarms]=useState(0);
  const [signal,setSignal]=useState(false);
  const [dual,setDual]=useState(0);
  const [dualCorrect,setDualCorrect]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const hitRef=useRef(0);
  const alarmRef=useRef(0);

  useEffect(()=>{if(stage>0&&stage<6){const t=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(t)}},[stage]);
  useEffect(()=>{if(stage!==3)return; const t=setInterval(()=>{setVigilance(v=>{if(v>=11){clearInterval(t);return v} return v+1}); setSignal(Math.random()<.32)},650); return()=>clearInterval(t)},[stage]);

  const total=useMemo(()=>results.reduce((a,b)=>a+b.score,0),[results]);
  const add=(r:Result,next:number)=>{setResults(x=>[...x,r]);setElapsed(0);setStage(next)};

  function finishSearch(){const targets=searchItems.filter(x=>x==="R").length;const correct=picked.filter(i=>searchItems[i]==="R").length;const errors=picked.length-correct;const score=Math.max(0,Math.round((correct/targets)*100-errors*8));add({name:"Atención selectiva",score,note:`${correct}/${targets} objetivos · ${errors} falsas alarmas`},1.5)}
  function answerStroop(a:string){const ok=a===stroopTrials[stroop].answer;setStroopCorrect(v=>v+(ok?1:0));if(stroop===stroopTrials.length-1){const n=stroopCorrect+(ok?1:0);add({name:"Control de interferencia",score:n*20,note:`${n}/5 respuestas por color de tinta`},3)}else setStroop(v=>v+1)}
  function vigilanceTap(){if(signal){hitRef.current+=1;setHits(hitRef.current);setSignal(false)}else{alarmRef.current+=1;setFalseAlarms(alarmRef.current)}}
  useEffect(()=>{if(stage===3&&vigilance>=11){const h=hitRef.current;const f=alarmRef.current;const score=Math.max(0,Math.min(100,h*25-f*12));const t=setTimeout(()=>{setResults(x=>[...x,{name:"Vigilancia",score,note:`${h} detecciones · ${f} falsas alarmas`}]);setElapsed(0);setStage(4)},700);return()=>clearTimeout(t)}},[vigilance,stage]);
  const dualTrials=[{n:3,w:"casa",odd:true,animal:false},{n:8,w:"perro",odd:false,animal:true},{n:5,w:"mesa",odd:true,animal:false},{n:2,w:"gato",odd:false,animal:true},{n:7,w:"caballo",odd:true,animal:true}];
  function dualAnswer(odd:boolean,animal:boolean){const t=dualTrials[dual];const ok=odd===t.odd&&animal===t.animal;setDualCorrect(v=>v+(ok?1:0));if(dual===dualTrials.length-1){const n=dualCorrect+(ok?1:0);add({name:"Atención dividida",score:n*20,note:`${n}/5 combinaciones correctas`},5)}else setDual(v=>v+1)}
  function restart(){setStage(0);setResults([]);setPicked([]);setSawTriangle(null);setStroop(0);setStroopCorrect(0);setVigilance(0);setHits(0);setFalseAlarms(0);hitRef.current=0;alarmRef.current=0;setSignal(false);setDual(0);setDualCorrect(0);setElapsed(0)}

  return <main className={`stage-${String(stage).replace(".","-")}`} data-triangle-seen={String(sawTriangle)}>
    <a className="back-link" href="../../#aprender">← NeuroLab · Aprender</a>
    <header><a href="#" className="logo"><i/>LABORATORIO DE ATENCIÓN</a><div className="steps">{[1,2,3,4].map((x,i)=><span key={x} className={stage>=i+1?"on":""}>{String(x).padStart(2,"0")}</span>)}</div><span className="timer">{stage>0&&stage<5?`${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`:"CENTRO K"}</span></header>

    {stage===0&&<section className="intro screen"><div className="noise"/><div className="introCopy"><span className="kicker">EXPERIMENTO 01 · MÓDULO III</span><h1>Esta página intentará<br/><em>hacerte fallar.</em></h1><p>No cierres otras aplicaciones. No silencies tu teléfono.<br/>Solo presta atención… si puedes.</p><button onClick={()=>setStage(1)}>ACEPTO EL RETO <b>↗</b></button><small>Duración aproximada: 3 minutos · No es una prueba diagnóstica · No se guardan ni envían respuestas</small></div><div className="focusOrb"><div/><span>FOCUS</span><b>?</b></div><div className="scrollHint">DESLIZA PARA ENTRAR <i/></div></section>}

    {stage===1&&<section className="challenge screen"><div className="challengeHead"><span>01 / ATENCIÓN SELECTIVA</span><h2>Encuentra todas las letras <b>R</b></h2><p>Ignora lo demás. Toca cada R y termina cuando estés seguro.</p></div><div className="searchGrid">{searchItems.map((x,i)=><button key={i} onClick={()=>setPicked(p=>p.includes(i)?p.filter(k=>k!==i):[...p,i])} className={picked.includes(i)?"picked":""}>{x}</button>)}<i className="triangle"/></div><button className="finish" onClick={finishSearch}>TERMINÉ →</button></section>}

    {stage===1.5&&<section className="reveal screen"><span className="kicker">PREGUNTA INESPERADA</span><h2>Mientras buscabas las letras…<br/><em>¿viste el triángulo rojo?</em></h2><div className="binary"><button onClick={()=>{setSawTriangle(true);setStage(2)}}>SÍ, LO VI</button><button onClick={()=>{setSawTriangle(false);setStage(2)}}>NO LO VI</button></div><p>Tu respuesta no modifica la puntuación. Modifica la pregunta.</p></section>}

    {stage===2&&<section className="challenge stroopScreen screen"><div className="challengeHead"><span>02 / CONTROL DE INTERFERENCIA</span><h2>Responde al <b>color</b>, no a la palabra</h2><p>Hazlo tan rápido como puedas.</p></div><div className="trialCount">{stroop+1} / {stroopTrials.length}</div><div className="stroopWord" style={{color:stroopTrials[stroop].ink}}>{stroopTrials[stroop].word}</div><div className="colorButtons">{["ROJO","VERDE","AZUL"].map(x=><button key={x} onClick={()=>answerStroop(x)}>{x}</button>)}</div></section>}

    {stage===3&&<section className="challenge vigilanceScreen screen"><div className="challengeHead"><span>03 / VIGILANCIA</span><h2>Responde cuando aparezca el punto</h2><p>Espera. No anticipes. Toca el círculo solo cuando cambie.</p></div><button aria-label="Responder al punto luminoso" className={`vigilanceOrb ${signal?"signal":""}`} onClick={vigilanceTap}><i/></button><div className="sequence">{Array.from({length:12}).map((_,i)=><i key={i} className={i<=vigilance?"done":""}/>)}</div></section>}

    {stage===4&&<section className="challenge dualScreen screen"><div className="challengeHead"><span>04 / ATENCIÓN DIVIDIDA</span><h2>Dos reglas. Una sola respuesta.</h2><p>Indica si el número es impar y si la palabra es un animal.</p></div><div className="dualStim"><b>{dualTrials[dual].n}</b><span>{dualTrials[dual].w}</span></div><div className="dualGrid">{[[true,true],[true,false],[false,true],[false,false]].map(([o,a])=><button key={`${o}${a}`} onClick={()=>dualAnswer(o,a)}><b>{o?"IMPAR":"PAR"}</b><span>{a?"ANIMAL":"NO ANIMAL"}</span></button>)}</div></section>}

    {stage===5&&<section className="results screen"><div className="resultTop"><span className="kicker">EL EXPERIMENTO TERMINÓ</span><h2>Tu capacidad no cambió.<br/><em>La tarea sí.</em></h2><p>Un resultado bajo no explica por sí mismo el mecanismo. Describe una conducta bajo condiciones específicas.</p></div><div className="resultGrid"><div className="scoreDial"><strong>{Math.round(total/4)}</strong><span>PUNTUACIÓN DIDÁCTICA<br/>DE ESTA EXPERIENCIA</span><small>NO DIAGNÓSTICO</small></div><div className="resultBars">{results.map(r=><div key={r.name}><span>{r.name}</span><div><i style={{width:`${r.score}%`}}/></div><b>{r.note}</b></div>)}</div></div><p className="educational-note">Puntuaciones arbitrarias para ilustrar tareas: no son baremos, percentiles ni medidas validadas de capacidad. La vigilancia es una demostración breve, no una evaluación sostenida. No compares estos valores entre personas.</p><button className="nextReveal" onClick={()=>setStage(6)}>¿QUÉ SIGNIFICA ESTO? →</button></section>}

    {stage===6&&<section className="clinical screen"><div className="clinicalIntro"><span className="kicker">DEL JUEGO A LA CLÍNICA</span><h2>“Me distraigo” no es un diagnóstico.</h2><p>El mismo resultado puede emerger por mecanismos distintos. La tarea genera un dato; la historia clínica construye su significado.</p></div><div className="hypotheses">{[["ALERTAMIENTO","¿Estaba suficientemente activado?"],["VIGILANCIA","¿Pudo sostener el estado atencional?"],["SELECCIÓN","¿Filtró estímulos irrelevantes?"],["CONTROL","¿Inhibió la respuesta dominante?"],["FATIGA","¿El rendimiento cayó con el tiempo?"],["VELOCIDAD","¿Respondió lento pero con precisión?"]].map(([a,b],i)=><article key={a}><span>0{i+1}</span><h3>{a}</h3><p>{b}</p></article>)}</div><div className="elena"><div><span>VIÑETA DOCENTE</span><h3>Elena, 58 años</h3><p>“Pierdo el hilo en conversaciones largas y cometo errores en el trabajo.”</p></div><div><b>Tu primera decisión clínica</b><p>¿Es un problema atencional, de velocidad, fatiga, estado afectivo o el inicio de otro proceso?</p><button onClick={()=>setStage(7)}>ABRIR LA PREGUNTA →</button></div></div></section>}

    {stage===7&&<section className="finalScreen screen"><span className="kicker">LA PREGUNTA CORRECTA CAMBIA TODO</span><h2>No preguntes solamente<br/><em>“¿qué prueba salió baja?”</em></h2><h3>Pregunta: ¿qué proceso, bajo qué condiciones y con qué impacto funcional?</h3><div className="model"><span>HALLAZGO</span><b>→</b><span>HIPÓTESIS</span><b>→</b><span>SIGUIENTE DATO</span></div><p>Semana 2 · Atención y control atencional<br/>Módulo III — Procesos Cognitivos y Ejecutivos</p><button onClick={restart}>REPETIR EXPERIENCIA</button></section>}
  </main>
}
