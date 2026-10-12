'use strict';
// Datos sintéticos editoriales. Ningún dato de personas ni red ni persistencia.
const scenarios = {
 school: {title:'Escuela · asistencia y becas', facts:['E1 · Cada estudiante recibe un registro semanal de puntualidad y una reunión si acumula retrasos.','E2 · El comité usa tasas agregadas de ausentismo por zona para distribuir becas de transporte.','E3 · El reglamento permite corregir errores del registro y apelar ante un comité.'], discipline:'El registro individual y la reunión permiten examinar y corregir conductas. Pregunta si se comparan con una norma y si producen sanciones o identidades duraderas.', bio:'La distribución por zonas dirige recursos a condiciones de vida de una población. Puede apoyar una lectura biopolítica si se documenta una política sobre bienestar y circulación; el porcentaje por sí solo no la prueba.', both:'Conviven seguimiento individual y acción agregada. Una lectura de acceso educativo también es plausible: averigua si las becas eliminan barreras y cómo funciona realmente la apelación.'},
 hospital: {title:'Hospital · tiempos y cobertura', facts:['E1 · Un tablero interno compara el tiempo de cada turno con un objetivo y solicita planes de mejora.','E2 · El equipo de planificación usa tasas de cobertura por barrio para decidir dónde abrir servicios.','E3 · Una comisión de trabajadores puede revisar el objetivo y registrar excepciones.'], discipline:'La comparación de turnos con un objetivo puede organizar examen y normalización del trabajo. Faltan los efectos de ese registro: ¿formación, sanción, negociación?', bio:'La cobertura por barrio permite pensar la salud de una población y la distribución de servicios. Pregunta qué prioridades, riesgos y desigualdades organizan la decisión.', both:'La gestión del trabajo y la cobertura pueden articularse. También hay una lectura de organización del cuidado: para distinguirla, observa quién define las metas y quién puede modificarlas.'},
 platform: {title:'Plataforma ficticia · hábitos y avisos', facts:['E1 · Una aplicación de bienestar muestra una racha diaria y una comparación individual con una meta.','E2 · La empresa agrupa frecuencias de uso por región para diseñar campañas sobre hábitos de salud.','E3 · Se pueden desactivar avisos; el criterio de agrupación regional no se explica en la interfaz.'], discipline:'La racha y la meta ofrecen un mecanismo de comparación y autocorrección. No basta llamarlo panóptico: averigua si hay visibilidad asimétrica y qué consecuencias tiene.', bio:'La campaña apela a hábitos de salud en conjuntos de usuarios. Para sostener biopolítica, investiga la regulación de procesos de vida: segmentación comercial no es automáticamente gestión de población.', both:'La meta puede conducir elecciones a través de incentivos: una pregunta de gubernamentalidad. También podría ser apoyo voluntario. Examina costes de desactivar avisos, acceso a datos y alternativas.'}
};
const prompts = {
 discipline:'¿La norma se negocia? ¿El registro sólo informa o clasifica y corrige? No toda medición constituye disciplina.',
 government:'¿Qué opciones, incentivos y criterios dirigen la conducta? Distingue una invitación revisable de una relación difícil de modificar.',
 care:'¿Qué evidencia demostraría una mejora del acceso o del cuidado? Un beneficio puede coexistir con asimetrías de poder.',
 mixed:'¿Qué mecanismo corresponde a cada escala? Evita juntar etiquetas: explica una relación concreta y una tensión entre ellas.'
};
const $ = id => document.getElementById(id);
function updateComparison(){
 const data=scenarios[$('compare-case').value];
 $('compare-evidence').textContent=data.facts.join(' ');
 const lens=document.querySelector('input[name="lens"]:checked').value;
 $('lens-output').replaceChildren();
 const heading=document.createElement('h4');heading.textContent={discipline:'Lente disciplinaria',bio:'Lente biopolítica',both:'Articulación y límites'}[lens];
 const p=document.createElement('p');p.textContent=data[lens];$('lens-output').append(heading,p);
}
function updateCase(){
 const data=scenarios[$('analysis-case').value];
 $('reasoning-form').reset();$('reasoning-output').hidden=true;
 $('case-file').replaceChildren();
 const heading=document.createElement('h4');heading.textContent=data.title;
 const list=document.createElement('ul');for(const fact of data.facts){const li=document.createElement('li');li.textContent=fact;list.append(li)}
 $('case-file').append(heading,list);
 const field=$('evidence-options');field.replaceChildren();const legend=document.createElement('legend');legend.textContent='Evidencia que usarás (elige una o más)';field.append(legend);
 data.facts.forEach((fact,index)=>{const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.name='evidence';check.value=String(index);label.append(check,document.createTextNode(fact));field.append(label)});
}
$('compare-case').addEventListener('change',()=>{updateComparison();$('comparison').value=''});
document.querySelectorAll('input[name="lens"]').forEach(input=>input.addEventListener('change',updateComparison));
$('analysis-case').addEventListener('change',updateCase);
$('reasoning-form').addEventListener('submit',event=>{
 event.preventDefault();const output=$('reasoning-output');output.hidden=false;output.replaceChildren();
 const selected=[...document.querySelectorAll('input[name="evidence"]:checked')];
 const heading=document.createElement('h4');heading.textContent=selected.length?'Guía para revisar tu argumento':'Falta elegir evidencia';output.append(heading);
 const messages=selected.length?['Has seleccionado '+selected.length+' observación(es) y formulado una lectura, una alternativa y un límite. Esto verifica la estructura, no la validez del argumento.',prompts[$('interpretation').value],'Revisión en pareja: subrayen el vínculo entre un detalle elegido y la conclusión. ¿La alternativa utiliza ese mismo detalle de otra forma? ¿El dato faltante permitiría distinguir las lecturas?','Debrief del caso: '+scenarios[$('analysis-case').value].both]:['Selecciona al menos una observación del caso y vuelve a contrastar. Nombrar un concepto no reemplaza señalar evidencia.'];
 for(const message of messages){const p=document.createElement('p');p.textContent=message;output.append(p)}
 if(!selected.length)document.querySelector('input[name="evidence"]').focus();
});
$('reasoning-form').addEventListener('reset',()=>{$('reasoning-output').hidden=true;$('reasoning-output').replaceChildren()});
updateComparison();updateCase();
