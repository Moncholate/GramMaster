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
  allValidVerbs
} from './validation';
