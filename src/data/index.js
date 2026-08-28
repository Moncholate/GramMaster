// Exportar todos los datos desde un único punto de entrada
export { translations } from './translations';
export { commonVerbs, irregularVerbs } from './verbs';
export {
  COURSE_ORDER,
  modes,
  tenses,
  modals,
  whWords,
  whSuggestions,
  whAsks,
  whExtPideSustantivo,
  whSubjectWords,
  CONDICIONALES_POR_CURSO,
  UNIDADES_POR_CURSO,
  unidadIndice,
  estaVisto,
  unidadPorRevisar,
  DIAS_REVISION,
  PARES_CONDICIONAL,
  COMPLEMENTOS_BE,
  COMPLEMENTOS_ADVERBIALES,
  COMPLEMENTOS_TIEMPO,
  COMPLEMENTO_DE_VERBO,
  VERBOS_CON_ADVERBIAL_LIBRE,
  VERBOS_FUERA_DE_PRACTICA,
  VERBOS_REGULARES,
  VERBOS_REGULARES_AMPLIA,
  VERBOS_IRREGULARES,
  VERBOS_IRREGULARES_BASICO,
  VERBOS_IRREGULARES_INTERMEDIO,
  VERBOS_IRREGULARES_AVANZADO,
  frequencyAdverbs,
  timeMarkers,
  detectarMarcador,
  marcadorCuadra,
  TIPOS_DE_MARCADOR_COMPATIBLES,
  getFlattenedMarkers,
  getMarkersByTense,
  uncountableNouns,
  countableNouns
} from './grammar';
export { englishDictionary } from './dictionary';
export {
  validateSubject,
  validateVerb,
  revisarVerboAntesDeGenerar,
  validateComplement,
  validPronouns,
  validSubjectNouns,
  allValidVerbs,
  hispanicNames,
  looksLikeValidWord
} from './validation';
