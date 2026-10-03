/** Actividad inversa con los mismos cinco patrones T3 y sus fuentes.
 * No permite inferir un diagnóstico clínico: el conjunto de opciones es docente.
 */
import { lesionLesson, lesionZones } from './lesion-content.js?v=11';

export const localizationCases = [
  {
    id: 'case-01', zone: 'posterior',
    narrative: 'Caso ficticio. En una evaluación posterior a la fase aguda, se observa pérdida de vibración y de sentido de posición en ambas piernas. La fuerza y la sensibilidad al dolor y a la temperatura se conservan. Hay dificultad para mantener la estabilidad sin apoyo visual.',
    hints: ['Compara las modalidades afectadas con las que permanecen conservadas.', 'La vibración y la posición consciente ascienden por una vía diferente de la sensibilidad termoalgésica.', 'Busca un territorio bilateral que conduzca esas modalidades y respete las vías motoras y anterolaterales.']
  },
  {
    id: 'case-02', zone: 'hemi-left',
    narrative: 'Caso ficticio. Una vez superada la fase de shock medular, aparecen debilidad y disminución de vibración y posición en la pierna izquierda. El dolor y la temperatura disminuyen en el lado derecho por debajo del área lesionada, con un límite sensitivo que puede comenzar algo más abajo.',
    hints: ['La debilidad y la pérdida de vibración coinciden en un lado; el déficit termoalgésico está en el lado opuesto.', 'El corticoespinal lateral ya cruzó en el bulbo; las columnas posteriores todavía no han cruzado.', 'Para elegir el lado de la lesión medular, empieza por el lado de la debilidad y de la pérdida de vibración.']
  },
  {
    id: 'case-03', zone: 'commissure',
    narrative: 'Caso ficticio. Hay disminución bilateral del dolor y de la temperatura en una banda del tronco, sin pérdida termoalgésica en toda la región inferior del cuerpo. La fuerza, la vibración y el sentido de posición permanecen conservados.',
    hints: ['Distingue una banda sensitiva segmentaria de un déficit que se extiende bajo el nivel lesionado.', 'Considera fibras termoalgésicas que cruzan en la médula, antes de incorporarse a las vías ascendentes.', 'Busca un sitio de cruce cercano a la línea media que pueda afectar fibras de ambos lados, respetando las vías largas.']
  },
  {
    id: 'case-04', zone: 'anterior',
    narrative: 'Caso ficticio. Después de la fase aguda, se observa déficit motor en ambas piernas y disminución bilateral del dolor y de la temperatura bajo la región lesionada. La vibración y la posición permanecen relativamente conservadas.',
    hints: ['Identifica qué sistemas están comprometidos y cuál está relativamente respetado.', 'El movimiento voluntario y la sensibilidad termoalgésica dependen de vías diferentes de las columnas posteriores.', 'Busca un territorio amplio y bilateral que reúna vías motoras y anterolaterales, con respeto relativo de los cordones posteriores.']
  },
  {
    id: 'case-05', zone: 'hemi-right',
    narrative: 'Caso ficticio. Una vez superada la fase de shock medular, aparecen debilidad y disminución de vibración y posición en la pierna derecha. El dolor y la temperatura disminuyen en el lado izquierdo por debajo del área lesionada, con un límite sensitivo que puede comenzar algo más abajo.',
    hints: ['La debilidad y la pérdida de vibración coinciden en un lado; el déficit termoalgésico está en el lado opuesto.', 'El corticoespinal lateral ya cruzó en el bulbo; las columnas posteriores todavía no han cruzado.', 'Para elegir el lado de la lesión medular, empieza por el lado de la debilidad y de la pérdida de vibración.']
  }
];

export function localizationCase(id) {
  const item = localizationCases.find(item => item.id === id);
  if (!item) throw new RangeError('Caso de localización desconocido: ' + id);
  return { ...item, lesson: lesionLesson(item.zone) };
}

export const initialLocalizationState = () => ({ caseId: localizationCases[0].id, guess: null, submitted: null, hints: 0, teacher: false, reveal: false });

/** Elegir es distinto de comprobar: la primera acción no revela la solución. */
export function updateLocalizationState(state, action) {
  if (action.type === 'case') {
    localizationCase(action.id);
    return { ...initialLocalizationState(), caseId: action.id, teacher: state.teacher };
  }
  if (action.type === 'guess' && state.submitted === null && lesionZones.some(zone => zone.id === action.id)) return { ...state, guess: action.id };
  if (action.type === 'check' && state.guess !== null && state.submitted === null) return { ...state, submitted: state.guess, reveal: true };
  if (action.type === 'hint' && state.teacher) return { ...state, hints: Math.min(localizationCase(state.caseId).hints.length, state.hints + 1) };
  if (action.type === 'teacher') return { ...state, teacher: action.value, hints: 0, reveal: false };
  if (action.type === 'reveal' && state.teacher) return { ...state, reveal: !state.reveal };
  if (action.type === 'reset') return { ...initialLocalizationState(), caseId: state.caseId, teacher: state.teacher };
  return state;
}

export const localizationExplanationVisible = state => state.teacher ? state.reveal : state.submitted !== null;
export function localizationCorrect(state) {
  return state.submitted !== null && state.submitted === localizationCase(state.caseId).zone;
}
