// Modos de oración
export const modes = [
  {
    id: 'affirmative',
    emoji: '✓',
    activeClasses: 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md scale-105',
    textClass: 'text-emerald-700'
  },
  {
    id: 'negative',
    emoji: '✕',
    activeClasses: 'border-rose-500 bg-gradient-to-br from-rose-50 to-rose-100 shadow-md scale-105',
    textClass: 'text-rose-700'
  },
  {
    id: 'interrogative',
    emoji: '?',
    activeClasses: 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-md scale-105',
    textClass: 'text-amber-700'
  },
];

// Tiempos verbales
// Orden de cursos para el filtro acumulativo de tiempos verbales
export const COURSE_ORDER = ['basico1', 'basico2', 'elemental1', 'elemental2', 'intermedio1', 'intermedio2', 'avanzado'];

export const tenses = [
  { id: 'simple-present',             nameEn: 'Simple Present',             nameEs: 'Presente Simple',             example: 'I work',              timeType: 'present', cefr: 'basico1',     descEn: 'Habits, facts, routines',                          descEs: 'Hábitos, hechos, rutinas' },
  { id: 'present-continuous',         nameEn: 'Present Continuous',         nameEs: 'Presente Continuo',           example: 'I am working',        timeType: 'present', cefr: 'basico2',     descEn: 'Actions happening now',                            descEs: 'Acciones ocurriendo ahora' },
  { id: 'simple-past',                nameEn: 'Simple Past',                nameEs: 'Pasado Simple',               example: 'I worked',            timeType: 'past',    cefr: 'basico2',     descEn: 'Completed actions in the past',                    descEs: 'Acciones completadas en el pasado' },
  { id: 'future-going-to',            nameEn: 'Future (going to)',          nameEs: 'Futuro (going to)',           example: 'I am going to work',  timeType: 'future',  cefr: 'elemental2',  descEn: 'Plans and intentions',                             descEs: 'Planes e intenciones' },
  { id: 'present-perfect',            nameEn: 'Present Perfect',            nameEs: 'Presente Perfecto',           example: 'I have worked',       timeType: 'present', cefr: 'elemental2',  descEn: 'Past actions with present relevance',              descEs: 'Acciones pasadas con relevancia presente' },
  { id: 'past-continuous',            nameEn: 'Past Continuous',            nameEs: 'Pasado Continuo',             example: 'I was working',       timeType: 'past',    cefr: 'intermedio1', descEn: 'Actions in progress in the past',                  descEs: 'Acciones en progreso en el pasado' },
  { id: 'simple-future',              nameEn: 'Simple Future (will)',       nameEs: 'Futuro Simple (will)',        example: 'I will work',         timeType: 'future',  cefr: 'intermedio1', descEn: 'Predictions, spontaneous decisions',               descEs: 'Predicciones, decisiones espontáneas' },
  { id: 'past-perfect',               nameEn: 'Past Perfect',               nameEs: 'Pasado Perfecto',             example: 'I had worked',        timeType: 'past',    cefr: 'intermedio2', descEn: 'Actions before another past action',               descEs: 'Acciones antes de otra acción pasada' },
  { id: 'used-to',                    nameEn: 'Used to',                    nameEs: 'Used to',                     example: 'I used to work',      timeType: 'past',    cefr: 'intermedio2', descEn: 'Past habits that no longer exist',                 descEs: 'Hábitos pasados que ya no existen' },
  { id: 'present-perfect-continuous', nameEn: 'Present Perfect Continuous', nameEs: 'Presente Perfecto Continuo', example: 'I have been working', timeType: 'present', cefr: 'avanzado',    descEn: 'Actions that started in the past and continue',    descEs: 'Acciones que empezaron en el pasado y continúan' },
  { id: 'would-past',                 nameEn: 'Would (past habit)',         nameEs: 'Would (hábito pasado)',       example: 'I would work',        timeType: 'past',    cefr: 'avanzado',    descEn: 'Repeated actions in the past',                     descEs: 'Acciones repetidas en el pasado' },
  { id: 'future-perfect',             nameEn: 'Future Perfect',             nameEs: 'Futuro Perfecto',             example: 'I will have worked',  timeType: 'future',  cefr: 'avanzado',    descEn: 'Actions completed before a future time',           descEs: 'Acciones completadas antes de un tiempo futuro' },
  { id: 'past-perfect-continuous',    nameEn: 'Past Perfect Continuous',    nameEs: 'Pasado Perfecto Continuo',   example: 'I had been working',  timeType: 'past',    cefr: 'avanzado',    descEn: 'Continuous actions before a past moment',          descEs: 'Acciones continuas antes de un momento pasado' },
];

// Verbos modales con información semántica completa
export const modals = [
  { id: '', name: '—', category: null, cefr: null, descEs: 'Sin verbo modal', descEn: 'No modal', fullDescEs: '', fullDescEn: '' },
  {
    id: 'can',
    name: 'Can',
    category: 'ability',
    cefr: 'basico2',
    descEs: 'Habilidad / Posibilidad',
    descEn: 'Ability / Possibility',
    timeContext: 'present',
    fullDescEs: 'Expresa habilidad o posibilidad en el presente. No necesita tiempo verbal adicional.',
    fullDescEn: 'Expresses ability or possibility in the present. Does not need an additional tense.'
  },
  {
    id: 'could',
    name: 'Could',
    category: 'ability',
    cefr: 'avanzado',
    descEs: 'Habilidad pasada / Cortesía',
    descEn: 'Past ability / Politeness',
    timeContext: 'past',
    fullDescEs: 'Expresa habilidad en el pasado, posibilidad remota o cortesía. Ya tiene su propia referencia temporal.',
    fullDescEn: 'Expresses past ability, remote possibility, or politeness. Already has its own time reference.'
  },
  {
    id: 'may',
    name: 'May',
    category: 'ability',
    cefr: 'avanzado',
    descEs: 'Permiso / Posibilidad',
    descEn: 'Permission / Possibility',
    timeContext: 'present',
    fullDescEs: 'Expresa permiso formal o posibilidad. Se usa principalmente para el presente o futuro.',
    fullDescEn: 'Expresses formal permission or possibility. Mainly used for present or future.'
  },
  {
    id: 'might',
    name: 'Might',
    category: 'ability',
    cefr: 'intermedio2',
    descEs: 'Posibilidad remota',
    descEn: 'Remote possibility',
    timeContext: 'neutral',
    fullDescEs: 'Expresa posibilidad con menor certeza que "may". Neutral en tiempo.',
    fullDescEn: 'Expresses possibility with less certainty than "may". Time-neutral.'
  },
  {
    id: 'must',
    name: 'Must',
    category: 'obligation',
    cefr: 'intermedio2',
    descEs: 'Obligación fuerte',
    descEn: 'Strong obligation',
    timeContext: 'present',
    fullDescEs: 'Expresa obligación fuerte o certeza lógica. Se refiere principalmente al presente.',
    fullDescEn: 'Expresses strong obligation or logical certainty. Mainly refers to the present.'
  },
  {
    id: 'should',
    name: 'Should',
    category: 'obligation',
    cefr: 'intermedio2',
    descEs: 'Consejo / Deber moral',
    descEn: 'Advice / Moral duty',
    timeContext: 'neutral',
    fullDescEs: 'Expresa consejo u obligación moral. Es neutral en tiempo, se aplica al presente o futuro.',
    fullDescEn: 'Expresses advice or moral obligation. Time-neutral, applies to present or future.'
  },
  {
    id: 'will',
    name: 'Will',
    category: 'future',
    cefr: 'intermedio1',
    descEs: 'Futuro / Voluntad',
    descEn: 'Future / Willingness',
    timeContext: 'future',
    fullDescEs: 'Expresa futuro, predicciones o voluntad. Ya indica tiempo futuro por sí mismo.',
    fullDescEn: 'Expresses future, predictions, or willingness. Already indicates future time by itself.'
  },
  {
    id: 'would',
    name: 'Would',
    category: 'future',
    cefr: 'basico2',
    descEs: 'Condicional / Cortesía',
    descEn: 'Conditional / Politeness',
    timeContext: 'conditional',
    fullDescEs: 'Expresa situaciones condicionales, cortesía o hábitos pasados. El tiempo verbal seleccionado no afectará la estructura.',
    fullDescEn: 'Expresses conditional situations, politeness, or past habits. The selected tense will not affect the structure.'
  },
  {
    id: 'shall',
    name: 'Shall',
    category: 'future',
    cefr: 'avanzado',
    descEs: 'Sugerencia / Ofrecimiento',
    descEn: 'Suggestion / Offer',
    timeContext: 'future',
    fullDescEs: 'Usado para sugerencias u ofrecimientos formales. Implica tiempo futuro.',
    fullDescEn: 'Used for suggestions or formal offers. Implies future time.'
  },
];

// Palabras interrogativas WH (base)
export const whWords = [
  { id: '', name: '—' },
  { id: 'what', name: 'What' },
  { id: 'where', name: 'Where' },
  { id: 'when', name: 'When' },
  { id: 'why', name: 'Why' },
  { id: 'who', name: 'Who' },
  { id: 'which', name: 'Which' },
  { id: 'how', name: 'How' },
];

// Sugerencias de extensión por palabra base (no exhaustivas — el usuario puede escribir cualquier cosa)
export const whSuggestions = {
  'what': ['kind of', 'type of', 'color', 'time', 'size'],
  'which': ['one', 'ones', 'type of'],
  'how': ['much', 'many', 'often', 'long', 'far', 'old'],
};

// Adverbios de frecuencia (van entre sujeto y verbo)
export const frequencyAdverbs = [
  { id: '', name: '—', descEs: 'Sin adverbio', descEn: 'No adverb' },
  { id: 'always', name: 'Always', descEs: 'Siempre (100%)', descEn: 'Always (100%)', percentage: 100 },
  { id: 'usually', name: 'Usually', descEs: 'Usualmente (80%)', descEn: 'Usually (80%)', percentage: 80 },
  { id: 'often', name: 'Often', descEs: 'A menudo (70%)', descEn: 'Often (70%)', percentage: 70 },
  { id: 'frequently', name: 'Frequently', descEs: 'Frecuentemente (70%)', descEn: 'Frequently (70%)', percentage: 70 },
  { id: 'sometimes', name: 'Sometimes', descEs: 'A veces (50%)', descEn: 'Sometimes (50%)', percentage: 50 },
  { id: 'occasionally', name: 'Occasionally', descEs: 'Ocasionalmente (30%)', descEn: 'Occasionally (30%)', percentage: 30 },
  { id: 'rarely', name: 'Rarely', descEs: 'Raramente (10%)', descEn: 'Rarely (10%)', percentage: 10 },
  { id: 'seldom', name: 'Seldom', descEs: 'Rara vez (10%)', descEn: 'Seldom (10%)', percentage: 10 },
  { id: 'hardly ever', name: 'Hardly ever', descEs: 'Casi nunca (5%)', descEn: 'Hardly ever (5%)', percentage: 5 },
  { id: 'never', name: 'Never', descEs: 'Nunca (0%)', descEn: 'Never (0%)', percentage: 0 },
];

// Marcadores de tiempo
export const timeMarkers = {
  past: {
    remote: [
      { text: 'long ago', tense: 'simple-past', desc: 'Hace mucho tiempo' },
      { text: 'in 1990', tense: 'simple-past', desc: 'Fechas específicas antiguas' },
      { text: 'centuries ago', tense: 'simple-past', desc: 'Hace siglos' },
      { text: 'in the past', tense: 'simple-past', desc: 'En el pasado' },
      { text: 'back then', tense: 'simple-past', desc: 'En aquel entonces' }
    ],
    recent: [
      { text: 'yesterday', tense: 'simple-past', desc: 'Ayer' },
      { text: 'last night', tense: 'simple-past', desc: 'Anoche' },
      { text: 'last week', tense: 'simple-past', desc: 'La semana pasada' },
      { text: 'last month', tense: 'simple-past', desc: 'El mes pasado' },
      { text: 'last year', tense: 'simple-past', desc: 'El año pasado' },
      { text: 'an hour ago', tense: 'simple-past', desc: 'Hace una hora' },
      { text: 'two days ago', tense: 'simple-past', desc: 'Hace dos días' }
    ],
    duration: [
      { text: 'for 2 years', tense: 'present-perfect', desc: 'Durante/Por 2 años' },
      { text: 'since 2020', tense: 'present-perfect', desc: 'Desde 2020' },
      { text: 'for a long time', tense: 'present-perfect', desc: 'Durante mucho tiempo' },
      { text: 'since Monday', tense: 'present-perfect', desc: 'Desde el lunes' },
      { text: 'all day', tense: 'present-perfect-continuous', desc: 'Todo el día' }
    ]
  },
  present: {
    exact: [
      { text: 'now', tense: 'present-continuous', desc: 'Ahora' },
      { text: 'right now', tense: 'present-continuous', desc: 'Ahora mismo' },
      { text: 'at the moment', tense: 'present-continuous', desc: 'En este momento' },
      { text: 'at present', tense: 'present-continuous', desc: 'Actualmente' }
    ],
    routine: [
      { text: 'every day', tense: 'simple-present', desc: 'Todos los días' },
      { text: 'every week', tense: 'simple-present', desc: 'Cada semana' },
      { text: 'every month', tense: 'simple-present', desc: 'Cada mes' },
      { text: 'on Mondays', tense: 'simple-present', desc: 'Los lunes' },
      { text: 'on weekends', tense: 'simple-present', desc: 'Los fines de semana' },
      { text: 'in the morning', tense: 'simple-present', desc: 'En la mañana' },
      { text: 'at night', tense: 'simple-present', desc: 'En la noche' }
    ],
    period: [
      { text: 'these days', tense: 'present-continuous', desc: 'Estos días' },
      { text: 'nowadays', tense: 'simple-present', desc: 'Hoy en día' },
      { text: 'currently', tense: 'present-continuous', desc: 'Actualmente' },
      { text: 'this week', tense: 'present-continuous', desc: 'Esta semana' },
      { text: 'this month', tense: 'present-continuous', desc: 'Este mes' },
      { text: 'today', tense: 'simple-present', desc: 'Hoy' }
    ]
  },
  future: {
    near: [
      { text: 'soon', tense: 'simple-future', desc: 'Pronto' },
      { text: 'in a minute', tense: 'simple-future', desc: 'En un minuto' },
      { text: 'tomorrow', tense: 'simple-future', desc: 'Mañana' },
      { text: 'next week', tense: 'simple-future', desc: 'La próxima semana' },
      { text: 'in a few days', tense: 'simple-future', desc: 'En unos días' }
    ],
    far: [
      { text: 'next year', tense: 'simple-future', desc: 'El próximo año' },
      { text: 'in 2030', tense: 'simple-future', desc: 'En 2030' },
      { text: 'someday', tense: 'simple-future', desc: 'Algún día' },
      { text: 'in the future', tense: 'simple-future', desc: 'En el futuro' },
      { text: 'one day', tense: 'simple-future', desc: 'Un día' }
    ],
    intentions: [
      { text: 'tonight', tense: 'future-going-to', desc: 'Esta noche' },
      { text: 'this weekend', tense: 'future-going-to', desc: 'Este fin de semana' },
      { text: 'next month', tense: 'future-going-to', desc: 'El próximo mes' },
      { text: 'later', tense: 'future-going-to', desc: 'Más tarde' }
    ]
  }
};

// Helper para aplanar los marcadores de tiempo por categoría
export const getFlattenedMarkers = (category) => {
  const categoryMarkers = timeMarkers[category];
  return Object.values(categoryMarkers).flat();
};

// Marcadores adicionales para tiempos no cubiertos arriba
export const extraTimeMarkers = {
  'past-continuous':           ['when I arrived', 'at that moment', 'all morning', 'while she slept', 'at 8 pm'],
  'past-perfect':              ['before I left', 'by then', 'already', 'when she arrived', 'never before'],
  'used-to':                   ['as a child', 'when I was young', 'every summer', 'in the past', 'years ago'],
  'would-past':                ['every Sunday', 'as a child', 'often', 'when I was young', 'in those days'],
  'present-perfect-continuous':['for hours', 'since this morning', 'lately', 'recently', 'all week'],
  'future-perfect':            ['by tomorrow', 'by next year', 'by then', 'by the time you arrive'],
  'past-perfect-continuous':   ['for hours', 'since morning', 'before the meeting', 'when he called', 'all night'],
};

// Retorna chips de marcador de tiempo para un tiempo verbal dado
export const getMarkersByTense = (tenseId) => {
  // Buscar en timeMarkers (todos los grupos) filtrando por tense
  const all = Object.values(timeMarkers).flatMap(cat => Object.values(cat).flat());
  const fromMain = all.filter(m => m.tense === tenseId).map(m => m.text);
  const fromExtra = extraTimeMarkers[tenseId] || [];
  // Deduplicate
  return [...new Set([...fromMain, ...fromExtra])];
};

// Sustantivos contables e incontables (para validación)
export const uncountableNouns = ['water', 'rice', 'bread', 'money', 'music', 'wine', 'coffee', 'tea', 'milk', 'sugar', 'air', 'time', 'information', 'advice', 'homework', 'furniture', 'luggage'];
export const countableNouns = ['books', 'apples', 'cars', 'students', 'houses', 'bottles'];
