import { useMemo, useState } from 'react'
import { Activity, Brain, FlaskConical, Timer } from 'lucide-react'

type Theory = {
  name: string
  focus: string
  classroomUse: string
}

const theories: Theory[] = [
  {
    name: 'Broadbent',
    focus: 'Filtro temprano: el sistema prioriza un solo canal antes del análisis semántico.',
    classroomUse: 'Comparar tareas de atención selectiva con ruido competitivo.',
  },
  {
    name: 'Treisman',
    focus: 'Atenuación: la información irrelevante no se bloquea, solo se reduce.',
    classroomUse: 'Mostrar detección de palabras clave en canales secundarios.',
  },
  {
    name: 'Kahneman',
    focus: 'Capacidad limitada: la atención se reparte según activación y esfuerzo.',
    classroomUse: 'Analizar fatiga cognitiva en tareas duales con distinta dificultad.',
  },
  {
    name: 'Posner',
    focus: 'Redes atencionales: alerta, orientación y control ejecutivo.',
    classroomUse: 'Simular tiempos de reacción con y sin claves espaciales.',
  },
  {
    name: 'Stroop',
    focus: 'Interferencia cognitiva entre lectura automática y denominación de color.',
    classroomUse: 'Explicar control inhibitorio y conflicto estímulo-respuesta.',
  },
]

function App() {
  const [selectedTheory, setSelectedTheory] = useState<Theory>(theories[0])
  const [difficulty, setDifficulty] = useState(55)
  const [interference, setInterference] = useState(40)

  const attentionScore = useMemo(() => {
    const score = 100 - Math.round(difficulty * 0.45 + interference * 0.55)
    return Math.max(5, Math.min(95, score))
  }, [difficulty, interference])

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <p className="badge">Neuropsicolocos LAB</p>
        <h1>Laboratorio interactivo de atención</h1>
        <p className="lead">
          Simulador didáctico para docencia presencial o en línea con enfoque en neuropsicología
          cognitiva y teorías clásicas de la atención.
        </p>
      </header>

      <section className="panel panel-grid" aria-label="controles del laboratorio">
        <article className="card">
          <h2>
            <FlaskConical size={18} /> Teorías incluidas
          </h2>
          <div className="chips">
            {theories.map((theory) => (
              <button
                key={theory.name}
                type="button"
                className={selectedTheory.name === theory.name ? 'chip active' : 'chip'}
                onClick={() => setSelectedTheory(theory)}
              >
                {theory.name}
              </button>
            ))}
          </div>
          <p className="focus">{selectedTheory.focus}</p>
          <p className="classroom-use">Uso docente: {selectedTheory.classroomUse}</p>
        </article>

        <article className="card">
          <h2>
            <Timer size={18} /> Parámetros de simulación
          </h2>
          <label htmlFor="difficulty">
            Carga cognitiva: <strong>{difficulty}%</strong>
          </label>
          <input
            id="difficulty"
            type="range"
            min={0}
            max={100}
            value={difficulty}
            onChange={(event) => setDifficulty(Number(event.target.value))}
          />

          <label htmlFor="interference">
            Interferencia (tipo Stroop): <strong>{interference}%</strong>
          </label>
          <input
            id="interference"
            type="range"
            min={0}
            max={100}
            value={interference}
            onChange={(event) => setInterference(Number(event.target.value))}
          />
        </article>
      </section>

      <section className="panel">
        <article className="card score-card">
          <h2>
            <Activity size={18} /> Índice de atención estimado
          </h2>
          <div className="score-row">
            <Brain size={24} />
            <strong>{attentionScore}%</strong>
          </div>
          <div className="progress" role="img" aria-label={`Índice de atención ${attentionScore}%`}>
            <span style={{ width: `${attentionScore}%` }} />
          </div>
          <p>
            Combina los controles para demostrar cómo la atención varía según carga e interferencia.
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
