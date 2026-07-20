// Motor de conjugación — única fuente de verdad para construir oraciones.
// Todo es puro (sin estado de React) para poder testearse de forma aislada.
import { irregularVerbs } from './data/verbs';
import { englishDictionary } from './data/dictionary';
import { validPronouns, validDeterminers, hispanicNames } from './data/validation';

// ---------------------------------------------------------------------------
// Sujeto
// ---------------------------------------------------------------------------

const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, ''); // quita tildes: josé → jose

// Normaliza el casing del sujeto sin destruir nombres propios:
// - "i" siempre → "I"
// - nombres hispanos conocidos → Capitalizados (maria → Maria)
// - palabras comunes del diccionario → minúscula (corrige el autocapitalizado
//   del teclado móvil: "The dog" → "the dog")
// - todo lo demás se respeta tal como lo escribió el usuario
export const smartCaseSubject = (raw) => {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'i') return 'I';
      if (hispanicNames.includes(lower) || hispanicNames.includes(stripAccents(lower))) {
        return word.charAt(0).toUpperCase() + lower.slice(1);
      }
      if (
        englishDictionary.includes(lower) ||
        validPronouns.includes(lower) ||
        validDeterminers.includes(lower)
      ) {
        return lower;
      }
      return word;
    })
    .join(' ');
};

export const isThirdPersonSingular = (subjectText) => {
  const subj = subjectText.toLowerCase().trim();

  // Sujetos compuestos → siempre plural
  if (subj.includes(' and ') || subj.includes(',')) return false;

  // Pronombres explícitos
  if (subj === 'he' || subj === 'she' || subj === 'it') return true;
  if (subj === 'i' || subj === 'you' || subj === 'we' || subj === 'they') return false;

  const words = subj.split(' ');
  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  // Cuantificadores que implican plural
  if (['both', 'all', 'many', 'several', 'few', 'most', 'some'].includes(firstWord)) return false;

  // Plurales irregulares comunes
  const irregularPlurals = ['people', 'children', 'men', 'women', 'teeth', 'feet', 'mice', 'geese', 'oxen'];
  if (irregularPlurals.includes(lastWord)) return false;

  // Plurales regulares: terminan en -s pero no en -ss, -us, -is
  // ni son palabras singulares o pronombres que terminan en -s
  const singularExceptions = ['this', 'his', 'hers', 'its', 'ours', 'yours', 'theirs', 'was', 'has', 'does', 'is', 'as', 'us', 'news'];
  if (
    lastWord.endsWith('s') &&
    !lastWord.endsWith('ss') &&
    !lastWord.endsWith('us') &&
    !lastWord.endsWith('is') &&
    !singularExceptions.includes(lastWord)
  ) return false;

  // Por defecto: sustantivo singular (he/she/it)
  return true;
};

// Formas del auxiliar según el sujeto
export const getBeForm = (subj) => {
  const s = subj.toLowerCase().trim();
  return s === 'i' ? 'am' : isThirdPersonSingular(subj) ? 'is' : 'are';
};

export const getWasWere = (subj) => {
  const s = subj.toLowerCase().trim();
  return (s === 'i' || isThirdPersonSingular(subj)) && s !== 'you' ? 'was' : 'were';
};

export const getHasHave = (subj) => (isThirdPersonSingular(subj) ? 'has' : 'have');

// ---------------------------------------------------------------------------
// Formas verbales
// ---------------------------------------------------------------------------

// Bisílabos con acento en la PRIMERA sílaba: no doblan la consonante final
// (listen → listened, no "listenned"). La heurística CVC no puede saber dónde
// cae el acento, así que se listan explícitamente.
const NO_DOUBLE_FINAL = new Set([
  'listen', 'happen', 'open', 'offer', 'answer', 'remember', 'order', 'enter',
  'wonder', 'gather', 'bother', 'suffer', 'matter', 'differ', 'whisper',
  'deliver', 'discover', 'recover', 'consider', 'develop', 'visit', 'travel',
]);

// Bisílabos con acento en la ÚLTIMA sílaba: SÍ doblan aunque la heurística
// los descarte (begin → beginning, prefer → preferred).
const DOUBLE_FINAL = new Set(['begin', 'prefer', 'refer', 'equip']);

// Heurística CVC (consonante-vocal-consonante) para monosílabos: stop → stopped
const isCVCVerb = (v) => {
  const vowels = 'aeiou';
  const len = v.length;
  if (len < 3) return false;
  const last = v[len - 1];
  const mid = v[len - 2];
  const prev = v[len - 3];
  if (vowels.includes(last) || 'wxy'.includes(last)) return false;
  if (!vowels.includes(mid)) return false;
  if (vowels.includes(prev)) return false;
  // Descarta bisílabos con vocal antes del grupo CVC final (heurística de acento)
  if (len >= 4 && vowels.includes(v[len - 4])) return false;
  return true;
};

const shouldDoubleFinal = (v) =>
  DOUBLE_FINAL.has(v) || (!NO_DOUBLE_FINAL.has(v) && isCVCVerb(v));

// Gerundios que no siguen ninguna regla ortográfica general
const ING_EXCEPTIONS = { be: 'being' };

export const presentParticiple = (v) => {
  const lower = v.toLowerCase();
  if (ING_EXCEPTIONS[lower]) return ING_EXCEPTIONS[lower];
  if (lower.endsWith('ie')) return lower.slice(0, -2) + 'ying'; // die → dying
  if (lower.endsWith('e') && !lower.endsWith('ee')) return lower.slice(0, -1) + 'ing'; // make → making
  if (shouldDoubleFinal(lower)) return lower + lower[lower.length - 1] + 'ing'; // run → running
  return lower + 'ing';
};

export const simplePast = (v) => {
  const lower = v.toLowerCase();
  if (irregularVerbs[lower]) return irregularVerbs[lower].past;
  if (lower.endsWith('e')) return lower + 'd'; // live → lived
  if (lower.endsWith('y') && !lower.match(/[aeiou]y$/)) return lower.slice(0, -1) + 'ied'; // study → studied
  if (shouldDoubleFinal(lower)) return lower + lower[lower.length - 1] + 'ed'; // stop → stopped
  return lower + 'ed';
};

export const pastParticiple = (v) => {
  const lower = v.toLowerCase();
  if (irregularVerbs[lower]) return irregularVerbs[lower].participle;
  return simplePast(lower);
};

// 3ª persona singular con irregulares que no siguen las reglas de -s/-es
const THIRD_PERSON_EXCEPTIONS = { have: 'has', be: 'is' };

export const conjugate3p = (v) => {
  const lower = v.toLowerCase();
  if (THIRD_PERSON_EXCEPTIONS[lower]) return THIRD_PERSON_EXCEPTIONS[lower];
  if (lower.endsWith('y') && !lower.match(/[aeiou]y$/)) return lower.slice(0, -1) + 'ies'; // study → studies
  if (lower.match(/(s|sh|ch|x|z|o)$/)) return lower + 'es'; // watch → watches, go → goes
  return lower + 's';
};

// ---------------------------------------------------------------------------
// Modales
// ---------------------------------------------------------------------------

const MODAL_NEGATIONS = {
  can: "can't",
  could: "couldn't",
  should: "shouldn't",
  would: "wouldn't",
  will: "won't",
  must: "mustn't",
};

export const negateModal = (modal) => MODAL_NEGATIONS[modal] || modal + ' not';

// ---------------------------------------------------------------------------
// Auxiliar + forma verbal por tiempo/modo (para el análisis visual)
// ---------------------------------------------------------------------------

// Devuelve { auxiliary, verbForm } tal como deben mostrarse en el desglose
// coloreado. En interrogativas, SOLO el primer token del auxiliar se antepone
// al sujeto; el resto va después (Will she have worked?).
export const getAuxAndVerbForm = (subj, v, tenseId, modal, mode) => {
  const is3p = isThirdPersonSingular(subj);
  const beForm = getBeForm(subj);
  const wasWere = getWasWere(subj);
  const hasHave = getHasHave(subj);
  const vLower = v.toLowerCase().trim();
  const isBe = vLower === 'be';
  const pp = pastParticiple(vLower);
  const ing = presentParticiple(vLower);
  const neg = mode === 'negative';
  const int = mode === 'interrogative';

  if (modal) {
    return { auxiliary: neg ? negateModal(modal) : modal, verbForm: vLower };
  }

  switch (tenseId) {
    case 'simple-present':
      if (isBe) return { auxiliary: neg ? beForm + ' not' : beForm, verbForm: beForm };
      if (neg) return { auxiliary: is3p ? "doesn't" : "don't", verbForm: vLower };
      if (int) return { auxiliary: is3p ? 'does' : 'do', verbForm: vLower };
      return { auxiliary: '', verbForm: is3p ? conjugate3p(vLower) : vLower };
    case 'present-continuous':
      return { auxiliary: beForm + (neg ? ' not' : ''), verbForm: ing };
    case 'simple-past':
      if (isBe) return { auxiliary: neg ? wasWere + ' not' : wasWere, verbForm: wasWere };
      if (neg) return { auxiliary: "didn't", verbForm: vLower };
      if (int) return { auxiliary: 'did', verbForm: vLower };
      return { auxiliary: '', verbForm: simplePast(vLower) };
    case 'past-continuous':
      return { auxiliary: wasWere + (neg ? ' not' : ''), verbForm: ing };
    case 'simple-future':
      return { auxiliary: neg ? "won't" : 'will', verbForm: vLower };
    case 'future-going-to':
      return { auxiliary: beForm + (neg ? ' not' : '') + ' going to', verbForm: vLower };
    case 'present-perfect':
      return { auxiliary: hasHave + (neg ? ' not' : ''), verbForm: pp };
    case 'past-perfect':
      return { auxiliary: 'had' + (neg ? ' not' : ''), verbForm: pp };
    case 'future-perfect':
      return { auxiliary: neg ? 'will not have' : 'will have', verbForm: pp };
    case 'present-perfect-continuous':
      return { auxiliary: hasHave + (neg ? ' not' : '') + ' been', verbForm: ing };
    case 'past-perfect-continuous':
      return { auxiliary: 'had' + (neg ? ' not' : '') + ' been', verbForm: ing };
    case 'used-to':
      return { auxiliary: neg ? "didn't use to" : int ? 'did use to' : 'used to', verbForm: vLower };
    case 'would-past':
      return { auxiliary: neg ? "wouldn't" : 'would', verbForm: vLower };
    default:
      return { auxiliary: '', verbForm: vLower };
  }
};

// Frase verbal conjugada (sin sujeto ni complemento) — usada por el modo práctica.
// En interrogativas devuelve solo el auxiliar que se antepone al sujeto.
export const buildVerbPhrase = (subj, v, tenseId, modal, mode) => {
  const { auxiliary, verbForm } = getAuxAndVerbForm(subj, v, tenseId, modal, mode);
  if (mode === 'interrogative') return auxiliary ? auxiliary.split(' ')[0] : verbForm;
  const isBeMain = v.toLowerCase().trim() === 'be' && !modal &&
    (tenseId === 'simple-present' || tenseId === 'simple-past');
  if (isBeMain) return auxiliary; // el auxiliar YA es el verbo (is / was not / …)
  return auxiliary ? auxiliary + ' ' + verbForm : verbForm;
};

// ---------------------------------------------------------------------------
// Construcción de la oración completa
// ---------------------------------------------------------------------------

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const buildSentenceText = ({ mode, subject: subjRaw, verb: vRaw, complement: compRaw, tense, modal, whWord: wh, whExtension: whExt, adverb: adv }) => {
  // El sujeto conserva nombres propios y normaliza "i" → "I"; el complemento
  // se respeta tal como lo escribió el usuario ("in Peru", "with Maria").
  const subj = smartCaseSubject(subjRaw);
  const v = vRaw.toLowerCase().trim();
  const comp = compRaw ? compRaw.trim() : '';
  const subjLower = subj.toLowerCase();
  const compStr = comp ? ' ' + comp : '';
  const pp = pastParticiple(v);
  const advSp = adv ? ' ' + adv + ' ' : ' ';
  const advAfter = adv ? ' ' + adv : '';
  const is3p = isThirdPersonSingular(subj);
  const beForm = getBeForm(subj);
  const wasWere = getWasWere(subj);
  const hasHave = getHasHave(subj);
  let fullWh = wh;
  if (wh && whExt && whExt.trim()) fullWh = wh + ' ' + whExt.trim();
  const isBeVerb = v === 'be';

  if (mode === 'affirmative') {
    if (modal)                              return cap(subj) + ' ' + modal + advSp + v + compStr + '.';
    if (tense === 'simple-present') {
      if (isBeVerb)                         return cap(subj) + ' ' + beForm + advSp.trimEnd() + compStr + '.';
      return cap(subj) + advSp + (is3p ? conjugate3p(v) : v) + compStr + '.';
    }
    if (tense === 'present-continuous')     return cap(subj) + ' ' + beForm + advSp + presentParticiple(v) + compStr + '.';
    if (tense === 'simple-past') {
      if (isBeVerb)                         return cap(subj) + ' ' + wasWere + advSp.trimEnd() + compStr + '.';
      return cap(subj) + advSp + simplePast(v) + compStr + '.';
    }
    if (tense === 'past-continuous')        return cap(subj) + ' ' + wasWere + advSp + presentParticiple(v) + compStr + '.';
    if (tense === 'simple-future')          return cap(subj) + ' will' + advSp + v + compStr + '.';
    if (tense === 'future-going-to')        return cap(subj) + ' ' + beForm + advSp + 'going to ' + v + compStr + '.';
    if (tense === 'present-perfect')        return cap(subj) + ' ' + hasHave + advSp + pp + compStr + '.';
    if (tense === 'past-perfect')           return cap(subj) + ' had' + advSp + pp + compStr + '.';
    if (tense === 'future-perfect')         return cap(subj) + ' will' + advSp + 'have ' + pp + compStr + '.';
    if (tense === 'present-perfect-continuous') return cap(subj) + ' ' + hasHave + advSp + 'been ' + presentParticiple(v) + compStr + '.';
    if (tense === 'past-perfect-continuous')    return cap(subj) + ' had' + advSp + 'been ' + presentParticiple(v) + compStr + '.';
    if (tense === 'used-to')                return cap(subj) + advSp + 'used to ' + v + compStr + '.';
    if (tense === 'would-past')             return cap(subj) + ' would' + advSp + v + compStr + '.';
  }
  if (mode === 'negative') {
    if (modal)                              return cap(subj) + ' ' + negateModal(modal) + advSp + v + compStr + '.';
    if (tense === 'simple-present') {
      if (isBeVerb)                         return cap(subj) + ' ' + beForm + ' not' + compStr + '.';
      return cap(subj) + ' ' + (is3p ? "doesn't" : "don't") + advSp + v + compStr + '.';
    }
    if (tense === 'present-continuous')     return cap(subj) + ' ' + beForm + ' not' + advSp + presentParticiple(v) + compStr + '.';
    if (tense === 'simple-past') {
      if (isBeVerb)                         return cap(subj) + ' ' + wasWere + ' not' + compStr + '.';
      return cap(subj) + " didn't" + advSp + v + compStr + '.';
    }
    if (tense === 'past-continuous')        return cap(subj) + ' ' + wasWere + ' not' + advSp + presentParticiple(v) + compStr + '.';
    if (tense === 'simple-future')          return cap(subj) + " won't" + advSp + v + compStr + '.';
    if (tense === 'future-going-to')        return cap(subj) + ' ' + beForm + ' not' + advSp + 'going to ' + v + compStr + '.';
    if (tense === 'present-perfect')        return cap(subj) + ' ' + hasHave + ' not' + advSp + pp + compStr + '.';
    if (tense === 'past-perfect')           return cap(subj) + ' had not' + advSp + pp + compStr + '.';
    if (tense === 'future-perfect')         return cap(subj) + ' will not' + advSp + 'have ' + pp + compStr + '.';
    if (tense === 'present-perfect-continuous') return cap(subj) + ' ' + hasHave + ' not' + advSp + 'been ' + presentParticiple(v) + compStr + '.';
    if (tense === 'past-perfect-continuous')    return cap(subj) + ' had not' + advSp + 'been ' + presentParticiple(v) + compStr + '.';
    if (tense === 'used-to')                return cap(subj) + " didn't" + advSp + 'use to ' + v + compStr + '.';
    if (tense === 'would-past')             return cap(subj) + " wouldn't" + advSp + v + compStr + '.';
  }
  if (mode === 'interrogative') {
    const prefix = fullWh ? cap(fullWh) + ' ' : '';
    // Con palabra WH delante, el auxiliar va en minúscula (What does she…?)
    const first = (aux) => prefix + (fullWh ? aux : cap(aux));
    if (modal)                              return first(modal) + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    if (tense === 'simple-present') {
      if (isBeVerb)                         return first(beForm) + ' ' + subj + compStr + '?';
      return first(is3p ? 'does' : 'do') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    }
    if (tense === 'present-continuous')     return first(beForm) + ' ' + subj + advAfter + ' ' + presentParticiple(v) + compStr + '?';
    if (tense === 'simple-past') {
      if (isBeVerb)                         return first(wasWere) + ' ' + subj + compStr + '?';
      return first('did') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    }
    if (tense === 'past-continuous')        return first(wasWere) + ' ' + subj + advAfter + ' ' + presentParticiple(v) + compStr + '?';
    if (tense === 'simple-future')          return first('will') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    if (tense === 'future-going-to')        return first(beForm) + ' ' + subj + advAfter + ' going to ' + v + compStr + '?';
    if (tense === 'present-perfect')        return first(hasHave) + ' ' + subj + advAfter + ' ' + pp + compStr + '?';
    if (tense === 'past-perfect')           return first('had') + ' ' + subj + advAfter + ' ' + pp + compStr + '?';
    if (tense === 'future-perfect')         return first('will') + ' ' + subj + advAfter + ' have ' + pp + compStr + '?';
    if (tense === 'present-perfect-continuous') return first(hasHave) + ' ' + subj + advAfter + ' been ' + presentParticiple(v) + compStr + '?';
    if (tense === 'past-perfect-continuous')    return first('had') + ' ' + subj + advAfter + ' been ' + presentParticiple(v) + compStr + '?';
    if (tense === 'used-to')                return first('did') + ' ' + subj + advAfter + ' use to ' + v + compStr + '?';
    if (tense === 'would-past')             return first('would') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
  }
  return '';
};
