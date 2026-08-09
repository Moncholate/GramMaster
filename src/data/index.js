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
  PARES_CONDICIONAL,
  frequencyAdverbs,
  timeMarkers,
  getFlattenedMarkers,
  getMarkersByTense,
  uncountableNouns,
  countableNouns
} from './grammar';
export { englishDictionary } from './dictionary';
export {
  validateSubject,
  validateVerb,
  validateComplement,
  validPronouns,
  validSubjectNouns,
  allValidVerbs,
  hispanicNames,
  looksLikeValidWord
} from './validation';
