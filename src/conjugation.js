// Motor de conjugación — única fuente de verdad para construir oraciones.
// Todo es puro (sin estado de React) para poder testearse de forma aislada.
import { commonVerbs, irregularVerbs } from './data/verbs';
import { englishDictionary } from './data/dictionary';
import { validPronouns, validDeterminers, hispanicNames, englishNames } from './data/validation';

// ---------------------------------------------------------------------------
// Sujeto
// ---------------------------------------------------------------------------

const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, ''); // quita tildes: josé → jose

/* El inglés capitaliza días, meses, idiomas y nacionalidades; el español no, y
   es un error sistemático de los hispanohablantes. Se fuerzan en mayúscula para
   que la oración generada modele la regla en vez de reproducir el error.
   Va ANTES del diccionario a propósito: monday, january y sunday están ahí y si
   no, terminarían en minúscula ("on monday"). */
const ALWAYS_CAPITAL = new Set([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese',
  'japanese', 'korean', 'russian', 'arabic',
  'chilean', 'american', 'british', 'mexican', 'argentinian', 'brazilian',
  'colombian', 'peruvian', 'canadian', 'australian',
]);

const upperFirst = (w) => w.charAt(0).toUpperCase() + w.slice(1);

// Normaliza el casing del sujeto sin destruir nombres propios:
// - "i" siempre → "I"
// - nombres hispanos conocidos → Capitalizados (maria → Maria)
// - palabras comunes del diccionario → minúscula (corrige el autocapitalizado
//   del teclado móvil: "The dog" → "the dog")
// - todo lo demás se respeta tal como lo escribió el usuario
/* NOMBRES QUE DECLARA EL PROPIO USUARIO. Las listas traen 397 nombres, pero no
   pueden traer el de cada alumno: «Jans» no está en ninguna, y ante una palabra
   desconocida terminada en -s la app NO TIENE FORMA de saber si es un plural o
   un nombre. En vez de adivinar, lo pregunta una vez y se acuerda.
   Este módulo es puro a propósito, para poder testearse aislado, así que NO lee
   `localStorage`: la app le pasa la lista con `registrarNombres`. */
let nombresDeclarados = new Set();
export const registrarNombres = (lista = []) => {
  nombresDeclarados = new Set(lista.map(n => String(n).toLowerCase().trim()).filter(Boolean));
};

/* Mismas listas que usa `smartCase`, para que capitalizar y contar la persona
   nunca discrepen: si la app escribe «Carlos» con mayúscula es porque sabe que
   es un nombre, y entonces tiene que conjugar en tercera persona. */
const esNombrePropio = (palabra) =>
  nombresDeclarados.has(palabra)
  || hispanicNames.includes(palabra) || hispanicNames.includes(stripAccents(palabra))
  || englishNames.includes(palabra);

export const smartCase = (raw) => {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'i') return 'I';
      if (ALWAYS_CAPITAL.has(lower)) return upperFirst(lower);
      /* `esNombrePropio` y no las listas sueltas: incluye los nombres que
         declaró el usuario, y así capitalizar y contar la persona no pueden
         discrepar. Sin esto, declarar «jans» lo conjugaba en singular pero lo
         dejaba en minúscula a mitad de oración («I work with jans»). */
      if (esNombrePropio(lower)) return upperFirst(lower);
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

// Mismo tratamiento para sujeto y complemento: ambos pueden traer mayúsculas
// que el teclado del móvil metió solo. Se conserva el nombre histórico.
export const smartCaseSubject = smartCase;


/* Constantes compartidas por `isThirdPersonSingular` y `nombreAmbiguo`: si cada
   una llevara su copia, arreglar un caso en una dejaría la otra mintiendo. */
/* `police` no tiene forma en -s y aun así SIEMPRE va en plural («the police are
   coming»). Sin él caía por el camino de abajo —no acaba en -s, luego singular—
   y salía «The police is coming». Es de los que el libro enseña aparte, así que
   un alumno lo va a escribir precisamente cuando lo esté estudiando. */
const PLURALES_IRREGULARES = ['people', 'children', 'men', 'women', 'teeth', 'feet', 'mice', 'geese', 'oxen',
                              'police'];
/* Las asignaturas en -ics son SINGULARES («physics is my favorite subject»),
   pero acaban en -s y la regla del plural se las llevaba: «physics are». Es el
   mismo caso que `news`, que ya estaba aquí por esto mismo.

   Solo van las que se leen como campo de estudio. `politics` y `statistics`
   tienen además una lectura plural real («his politics are extreme», «the
   statistics are clear»); en una sala de clases gana de calle la asignatura, y
   entre equivocarse en una lectura o en la otra, esta es la que aparece. */
const SINGULARES_EN_S = ['this', 'his', 'hers', 'its', 'ours', 'yours', 'theirs',
                         'was', 'has', 'does', 'is', 'as', 'us', 'news',
                         'mathematics', 'maths', 'physics', 'economics', 'politics',
                         'statistics', 'gymnastics', 'athletics', 'linguistics'];

/* Palabra terminada en -s que la app no sabe clasificar. Devuelve la palabra si
   es ambigua y `null` si tiene evidencia para decidir.
   Lo que la hace NO ambigua, en este orden: es un nombre conocido · es un
   plural irregular o una excepción · es una palabra común del diccionario ·
   su raíz sin la -s es una palabra común («students» → «student», así que es
   plural y punto). Lo que queda es lo que de verdad no se puede saber. */
export const nombreAmbiguo = (subjectText) => {
  const subj = String(subjectText || '').toLowerCase().trim();
  if (!subj || subj.includes(' and ') || subj.includes(',')) return null;
  const words = subj.split(/\s+/);
  /* Con determinante delante es un sustantivo común, no un nombre: «the Torres»
     no lo escribe nadie y «the students» daría un aviso molesto. */
  if (words.length > 1 && validDeterminers.includes(words[0])) return null;
  const last = words[words.length - 1];
  if (!last.endsWith('s') || last.endsWith('ss') || last.endsWith('us') || last.endsWith('is')) return null;
  if (SINGULARES_EN_S.includes(last) || PLURALES_IRREGULARES.includes(last)) return null;
  if (esNombrePropio(last) || validPronouns.includes(last)) return null;
  if (englishDictionary.includes(last)) return null;
  if (englishDictionary.includes(last.replace(/es$/, '')) || englishDictionary.includes(last.replace(/s$/, ''))) return null;
  return last;
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

  /* UN NOMBRE PROPIO ES SINGULAR, TERMINE EN LO QUE TERMINE, y esta comprobación
     va ANTES de la regla del plural en -s. Sin ella, la regla se llevaba por
     delante a treinta y un nombres que ya estaban en las listas: «Carlos work»,
     «Lucas live», «Andrés study», «Matías», «Nicolás», «Tomás», «Marcos»,
     «Jesús», «James», «Nicholas», «Charles», «Thomas», «Inés», «Mercedes», y
     los apellidos Torres, Flores, Reyes, Morales, Vargas. En un curso chileno
     eso es media lista de clase.
     No es una heurística, es el DATO que ya teníamos consultado en el orden
     correcto: la lista de nombres no contiene ningún plural común (se verificó
     al crearla), así que no puede robarle casos a la regla de abajo. */
  if (esNombrePropio(lastWord)) return true;

  // Plurales irregulares comunes
  if (PLURALES_IRREGULARES.includes(lastWord)) return false;

  // Plurales regulares: terminan en -s pero no en -ss, -us, -is
  // ni son palabras singulares o pronombres que terminan en -s
  if (
    lastWord.endsWith('s') &&
    !lastWord.endsWith('ss') &&
    !lastWord.endsWith('us') &&
    !lastWord.endsWith('is') &&
    !SINGULARES_EN_S.includes(lastWord)
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

/* ── LA NEGATIVA SE CONTRAE ──────────────────────────────────────────────────
   La app producía `don't`/`doesn't`/`didn't`/`won't` contraídos y `is not`,
   `have not`, `had not` enteros. No había regla que lo explicara: la única
   formulable —«se contrae el auxiliar prestado»— la desmiente `won't`, porque
   `will` es tan propio de su tiempo como `have`. El alumno veía dos piezas del
   mismo color escritas distinto y sin motivo.
   Se contrae SIEMPRE: es lo natural, es lo que enseña el libro desde las
   primeras unidades y es lo que Question Lab ya hacía en su respuesta modelo.

   `am` es la excepción, y no es un olvido: NO tiene contracción negativa
   estándar. «amn't» no existe y «aren't I» solo vale en preguntas. Lo natural
   sería «I'm not», pero eso contrae SUJETO + auxiliar y rompería el despiece de
   la app, que pinta cada rol por separado. Que `am` sea el único auxiliar sin
   negativa contraída es además un dato que vale la pena enseñar. */
const NEG_CONTRAIDA = {
  is: "isn't", are: "aren't", was: "wasn't", were: "weren't",
  have: "haven't", has: "hasn't", had: "hadn't",
  am: 'am not',
};
export const negAux = (aux) => NEG_CONTRAIDA[String(aux).toLowerCase()] || aux + ' not';

/* La forma ENTERA, para cuando el profesor quiere enseñar la estructura. Es
   decisión suya en clase, así que la app ofrece las dos y no elige por él.
   Va sobre el texto ya armado y no sobre el motor: así el corrector de la
   práctica —que acepta las dos formas— no se entera de nada. */
const NEG_ENTERA = {
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "won't": 'will not', "can't": 'cannot', "couldn't": 'could not',
  "shouldn't": 'should not', "wouldn't": 'would not', "mustn't": 'must not',
  "shan't": 'shall not', "mightn't": 'might not',
};
export const expandirNegacion = (texto) =>
  String(texto == null ? '' : texto).replace(/\b[A-Za-z]+n['’]t\b/g, (m) => {
    const s = NEG_ENTERA[m.toLowerCase().replace('’', "'")];
    if (!s) return m;
    return /^[A-Z]/.test(m) ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  });

/* `have to` es el único de la lista que no se comporta como modal: se conjuga
   (he has to) y se niega/pregunta con do/does, igual que un verbo normal. Se
   trata aparte en las tres formas para no romper el resto. */
export const isHaveTo = (modal) => modal === 'have-to';
export const haveToForm = (subj) => isThirdPersonSingular(subj) ? 'has to' : 'have to';

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
    if (isHaveTo(modal)) {
      // En interrogativa solo el primer token se antepone al sujeto, así que
      // "does have to" se parte en "Does … have to" solo.
      if (int) return { auxiliary: (is3p ? 'does' : 'do') + ' have to', verbForm: vLower };
      if (neg) return { auxiliary: (is3p ? "doesn't" : "don't") + ' have to', verbForm: vLower };
      return { auxiliary: haveToForm(subj), verbForm: vLower };
    }
    return { auxiliary: neg ? negateModal(modal) : modal, verbForm: vLower };
  }

  switch (tenseId) {
    case 'simple-present':
      if (isBe) return { auxiliary: neg ? negAux(beForm) : beForm, verbForm: beForm };
      if (neg) return { auxiliary: is3p ? "doesn't" : "don't", verbForm: vLower };
      if (int) return { auxiliary: is3p ? 'does' : 'do', verbForm: vLower };
      return { auxiliary: '', verbForm: is3p ? conjugate3p(vLower) : vLower };
    case 'present-continuous':
      return { auxiliary: (neg ? negAux(beForm) : beForm), verbForm: ing };
    case 'simple-past':
      if (isBe) return { auxiliary: neg ? negAux(wasWere) : wasWere, verbForm: wasWere };
      if (neg) return { auxiliary: "didn't", verbForm: vLower };
      if (int) return { auxiliary: 'did', verbForm: vLower };
      return { auxiliary: '', verbForm: simplePast(vLower) };
    case 'past-continuous':
      return { auxiliary: (neg ? negAux(wasWere) : wasWere), verbForm: ing };
    case 'simple-future':
      return { auxiliary: neg ? "won't" : 'will', verbForm: vLower };
    case 'future-going-to':
      return { auxiliary: (neg ? negAux(beForm) : beForm) + ' going to', verbForm: vLower };
    case 'present-perfect':
      return { auxiliary: (neg ? negAux(hasHave) : hasHave), verbForm: pp };
    case 'past-perfect':
      return { auxiliary: (neg ? negAux('had') : 'had'), verbForm: pp };
    case 'present-perfect-continuous':
      return { auxiliary: (neg ? negAux(hasHave) : hasHave) + ' been', verbForm: ing };
    case 'used-to':
      return { auxiliary: neg ? "didn't use to" : int ? 'did use to' : 'used to', verbForm: vLower };
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
  // Sujeto y complemento pasan por el mismo normalizador: conserva nombres
  // propios ("in Peru", "with Maria"), fuerza días/meses/idiomas en mayúscula
  // ("on Monday") y baja las mayúsculas que el teclado del móvil mete sola al
  // empezar cada campo ("At home" → "at home").
  const subj = smartCase(subjRaw);
  const v = vRaw.toLowerCase().trim();
  const comp = compRaw ? smartCase(compRaw) : '';
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
    if (isHaveTo(modal))                    return cap(subj) + ' ' + haveToForm(subj) + advSp + v + compStr + '.';
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
    if (tense === 'present-perfect-continuous') return cap(subj) + ' ' + hasHave + advSp + 'been ' + presentParticiple(v) + compStr + '.';
    if (tense === 'used-to')                return cap(subj) + advSp + 'used to ' + v + compStr + '.';
  }
  if (mode === 'negative') {
    if (isHaveTo(modal))                    return cap(subj) + ' ' + (is3p ? "doesn't" : "don't") + ' have to' + advSp + v + compStr + '.';
    if (modal)                              return cap(subj) + ' ' + negateModal(modal) + advSp + v + compStr + '.';
    if (tense === 'simple-present') {
      if (isBeVerb)                         return cap(subj) + ' ' + negAux(beForm) + advAfter + compStr + '.';
      return cap(subj) + ' ' + (is3p ? "doesn't" : "don't") + advSp + v + compStr + '.';
    }
    if (tense === 'present-continuous')     return cap(subj) + ' ' + negAux(beForm) + advSp + presentParticiple(v) + compStr + '.';
    if (tense === 'simple-past') {
      if (isBeVerb)                         return cap(subj) + ' ' + negAux(wasWere) + advAfter + compStr + '.';
      return cap(subj) + " didn't" + advSp + v + compStr + '.';
    }
    if (tense === 'past-continuous')        return cap(subj) + ' ' + negAux(wasWere) + advSp + presentParticiple(v) + compStr + '.';
    if (tense === 'simple-future')          return cap(subj) + " won't" + advSp + v + compStr + '.';
    if (tense === 'future-going-to')        return cap(subj) + ' ' + negAux(beForm) + advSp + 'going to ' + v + compStr + '.';
    if (tense === 'present-perfect')        return cap(subj) + ' ' + negAux(hasHave) + advSp + pp + compStr + '.';
    if (tense === 'past-perfect')           return cap(subj) + ' ' + negAux('had') + advSp + pp + compStr + '.';
    if (tense === 'present-perfect-continuous') return cap(subj) + ' ' + negAux(hasHave) + advSp + 'been ' + presentParticiple(v) + compStr + '.';
    if (tense === 'used-to')                return cap(subj) + " didn't" + advSp + 'use to ' + v + compStr + '.';
  }
  if (mode === 'interrogative') {
    // LIMITACIÓN CONOCIDA: no se soportan preguntas sobre el sujeto
    // ("Who works here?"). Esta rama siempre asume que `subj` es conocido y
    // que la palabra WH pregunta por otra parte de la oración (objeto,
    // lugar, tiempo…), con inversión de auxiliar. Una pregunta de sujeto no
    // lleva ese auxiliar y usa el orden normal (Who + verbo), así que
    // requeriría una rama de construcción distinta, no solo un ajuste acá.
    const prefix = fullWh ? cap(fullWh) + ' ' : '';
    // Con palabra WH delante, el auxiliar va en minúscula (What does she…?)
    const first = (aux) => prefix + (fullWh ? aux : cap(aux));
    if (isHaveTo(modal))                    return first(is3p ? 'does' : 'do') + ' ' + subj + advAfter + ' have to ' + v + compStr + '?';
    if (modal)                              return first(modal) + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    if (tense === 'simple-present') {
      if (isBeVerb)                         return first(beForm) + ' ' + subj + advAfter + compStr + '?';
      return first(is3p ? 'does' : 'do') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    }
    if (tense === 'present-continuous')     return first(beForm) + ' ' + subj + advAfter + ' ' + presentParticiple(v) + compStr + '?';
    if (tense === 'simple-past') {
      if (isBeVerb)                         return first(wasWere) + ' ' + subj + advAfter + compStr + '?';
      return first('did') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    }
    if (tense === 'past-continuous')        return first(wasWere) + ' ' + subj + advAfter + ' ' + presentParticiple(v) + compStr + '?';
    if (tense === 'simple-future')          return first('will') + ' ' + subj + advAfter + ' ' + v + compStr + '?';
    if (tense === 'future-going-to')        return first(beForm) + ' ' + subj + advAfter + ' going to ' + v + compStr + '?';
    if (tense === 'present-perfect')        return first(hasHave) + ' ' + subj + advAfter + ' ' + pp + compStr + '?';
    if (tense === 'past-perfect')           return first('had') + ' ' + subj + advAfter + ' ' + pp + compStr + '?';
    if (tense === 'present-perfect-continuous') return first(hasHave) + ' ' + subj + advAfter + ' been ' + presentParticiple(v) + compStr + '?';
    if (tense === 'used-to')                return first('did') + ' ' + subj + advAfter + ' use to ' + v + compStr + '?';
  }
  if (mode === 'subject-question') {
    /* PREGUNTA DE SUJETO — AEF Intermedio II 12C, «questions without
       auxiliaries». La wh-word ES el sujeto, así que no hay auxiliar prestado
       ni inversión: el orden es el mismo de una afirmación.
         Who lives here?          (no «Who does live here?»)
         What happened?           (no «What did happen?»)
       Es el error clásico del hispanohablante, porque en español la pregunta de
       sujeto tampoco invierte («¿Quién vive aquí?») pero el alumno arrastra el
       auxiliar del resto de las preguntas que ya aprendió.
       El campo Sujeto no participa: lo ocupa la wh. La concordancia sale de la
       propia wh — «Who» es 3ª persona, pero «How many people» es plural. */
    const whSubj = (fullWh || 'who').trim();
    const s = cap(whSubj);
    const is3pWh = isThirdPersonSingular(whSubj);
    const beWh = getBeForm(whSubj), wasWh = getWasWere(whSubj), hasWh = getHasHave(whSubj);
    if (isHaveTo(modal))                    return s + ' ' + haveToForm(whSubj) + advSp + v + compStr + '?';
    if (modal)                              return s + ' ' + modal + advSp + v + compStr + '?';
    if (tense === 'simple-present') {
      if (isBeVerb)                         return s + ' ' + beWh + advSp.trimEnd() + compStr + '?';
      return s + advSp + (is3pWh ? conjugate3p(v) : v) + compStr + '?';
    }
    if (tense === 'present-continuous')     return s + ' ' + beWh + advSp + presentParticiple(v) + compStr + '?';
    if (tense === 'simple-past') {
      if (isBeVerb)                         return s + ' ' + wasWh + advSp.trimEnd() + compStr + '?';
      return s + advSp + simplePast(v) + compStr + '?';
    }
    if (tense === 'past-continuous')        return s + ' ' + wasWh + advSp + presentParticiple(v) + compStr + '?';
    if (tense === 'simple-future')          return s + ' will' + advSp + v + compStr + '?';
    if (tense === 'future-going-to')        return s + ' ' + beWh + advSp + 'going to ' + v + compStr + '?';
    if (tense === 'present-perfect')        return s + ' ' + hasWh + advSp + pp + compStr + '?';
    if (tense === 'past-perfect')           return s + ' had' + advSp + pp + compStr + '?';
    if (tense === 'present-perfect-continuous') return s + ' ' + hasWh + advSp + 'been ' + presentParticiple(v) + compStr + '?';
    if (tense === 'used-to')                return s + advSp + 'used to ' + v + compStr + '?';
  }
  return '';
};

// ---------------------------------------------------------------------------
// Detección de verbo ya conjugado (entrada inválida del estudiante)
// ---------------------------------------------------------------------------

// Todos los verbos base conocidos, para detectar cuando el estudiante escribió
// una forma ya conjugada (worked, working, works…) en vez de la forma base.
export const ALL_BASE_VERBS = [...commonVerbs, ...Object.keys(irregularVerbs)];

// Si `word` coincide con alguna forma conjugada de un verbo base conocido,
// retorna ese verbo base (p. ej. "worked" → "work"); si no, null.
// Reutiliza el propio motor de conjugación en vez de adivinar por sufijos,
// así el resultado siempre es consistente con lo que la app genera.
export const detectConjugatedVerbBase = (word) => {
  const lower = word.toLowerCase().trim();
  if (!lower || ALL_BASE_VERBS.includes(lower)) return null;
  return ALL_BASE_VERBS.find(base =>
    conjugate3p(base) === lower ||
    simplePast(base) === lower ||
    pastParticiple(base) === lower ||
    presentParticiple(base) === lower
  ) || null;
};

// ---------------------------------------------------------------------------
// Clasificación del cambio verbal (para el desglose visual con tooltips)
// ---------------------------------------------------------------------------

// Determina QUÉ tipo de cambio sufrió el verbo (base/3ra persona/-ing/pasado/
// participio/irregular) a partir del tiempo verbal REAL, no adivinando por
// forma del texto. Adivinar por texto falla con cambios ortográficos en 3ra
// persona (study → studies no matchea "verbText + s/es") y por eso este caso
// terminaba cayendo en el fallback "pasado simple" — el bug que esto arregla.
export const getVerbChangeType = (verbForm, verbText, tenseId) => {
  const isIrregularVerb = irregularVerbs[verbText.toLowerCase()] !== undefined;
  if (verbForm === verbText) return 'base';
  if (verbForm.endsWith('ing')) return 'ing';
  if (tenseId === 'simple-present') return 'third-person-s';
  if (['present-perfect', 'past-perfect', 'future-perfect'].includes(tenseId)) {
    return isIrregularVerb ? 'irregular' : 'participle';
  }
  if (tenseId === 'simple-past') return isIrregularVerb ? 'irregular' : 'past';
  return 'base';
};

/* ═══════════════════════════════════════════════════════════════════════════
   CONDICIONALES
   Dos cláusulas ligadas donde el TIPO fija los dos tiempos. No es un tiempo
   más de la lista: por eso vive aparte y no entra en `tenses`.

   Se apoya en `buildSentenceText`, que es por cláusula y sin estado, así que
   una condicional son dos llamadas y una unión. Lo único que no existía era
   `would have` + participio, de la tercera.
   ═══════════════════════════════════════════════════════════════════════════ */

export const CONDICIONALES = {
  1: { ifTense: 'simple-present', main: { tense: 'simple-future' } },
  2: { ifTense: 'simple-past',    main: { modal: 'would' }, subjuntivo: true },
  3: { ifTense: 'past-perfect',   main: { modal: 'would', perfecto: true } },
};

/* La cláusula `if` va en minúscula tras "If ", salvo que el sujeto la pida en
   mayúscula por sí mismo ("I", nombres propios). `smartCase` ya decidió eso,
   así que basta con mirar cómo dejó el sujeto: si lo dejó en minúscula, lo que
   subió la inicial fue `cap()` dentro de buildSentenceText y hay que deshacerlo. */
const bajaInicial = (frase, subjRaw) => {
  const s = smartCase(subjRaw || '');
  return (s && s[0] === s[0].toLowerCase())
    ? frase.charAt(0).toLowerCase() + frase.slice(1)
    : frase;
};

const sinPunto = (s) => s.replace(/\s*[.?!]+\s*$/, '');

/* `would have` + participio en los tres signos. Es lo único que el motor no
   sabía hacer, porque la 3ª no es un tiempo de la lista. */
const terceraPrincipal = ({ subject, verb, complement }, modo) => {
  const subj = smartCase(subject);
  const comp = complement ? ' ' + smartCase(complement) : '';
  const pp = pastParticiple(verb.toLowerCase().trim());
  if (modo === 'negative')      return `${subj} wouldn't have ${pp}${comp}`;
  if (modo === 'interrogative') return `would ${subj} have ${pp}${comp}`;
  return `${subj} would have ${pp}${comp}`;
};

/**
 * Arma una condicional completa.
 * @param tipo 1 | 2 | 3
 * @param condicion {subject, verb, complement}
 * @param resultado {subject, verb, complement}
 * @param modo signo del RESULTADO: 'affirmative' | 'negative' | 'interrogative'
 * @param condicionNegativa niega la CONDICIÓN ("If it doesn't rain…")
 * @param ifAlFinal "resultado if condición" en vez de "If condición, resultado"
 *
 * El signo de las dos cláusulas es independiente a propósito: negar el
 * resultado ("no me quedaré") y negar la condición ("si no llueve") son cosas
 * distintas, y confundirlas es un error clásico. La interrogativa solo aplica
 * al resultado: la cláusula `if` nunca se pregunta.
 */
export const buildConditionalText = ({ tipo, condicion, resultado, modo = 'affirmative',
                                      condicionNegativa = false, ifAlFinal = false }) => {
  const cfg = CONDICIONALES[tipo] || CONDICIONALES[1];
  if (!condicion?.subject || !condicion?.verb || !resultado?.subject || !resultado?.verb) return '';

  let si = sinPunto(buildSentenceText({
    mode: condicionNegativa ? 'negative' : 'affirmative', tense: cfg.ifTense, ...condicion }));
  si = bajaInicial(si, condicion.subject);

  /* Subjuntivo de la 2ª: «If I were you», con `were` para TODAS las personas.
     Es la forma que enseña el libro en «If I were you, I'd…»; `was` se oye y no
     se marca como error, pero lo que la app GENERA es lo que se practica. */
  /* Las formas negadas van PRIMERO: `\bwas\b` también casa dentro de «was not»
     y dejaba «If I were not you», que es correcto pero arcaico. */
  if (cfg.subjuntivo) si = si
    .replace(/\bwas\s+not\b/, "weren't")
    .replace(/\bwasn't\b/, "weren't")
    .replace(/\bwas\b/, 'were');

  const principal = cfg.main.perfecto
    ? terceraPrincipal(resultado, modo)
    : sinPunto(buildSentenceText({ mode: modo, ...cfg.main, ...resultado }));

  const cierre = modo === 'interrogative' ? '?' : '.';
  /* En interrogativa la principal empieza por el auxiliar, no por el sujeto,
     así que `bajaInicial` —que mira el sujeto— no sirve: siempre va minúscula
     detrás de la coma. */
  const principalTrasComa = modo === 'interrogative'
    ? principal.charAt(0).toLowerCase() + principal.slice(1)
    : bajaInicial(principal, resultado.subject);

  if (ifAlFinal) {
    return `${cap(principal)} if ${si}${cierre}`;
  }
  return `If ${si}, ${principalTrasComa}${cierre}`;
};

/**
 * La frase verbal de UNA de las dos cláusulas de una condicional: lo que el
 * alumno escribe en el modo práctica. Vive aquí y no en la interfaz porque es
 * la misma regla que usa `buildConditionalText` para construir la oración
 * entera — si se separan, la app podría pedir una forma y validar otra.
 *
 * @param tipo  1 | 2 | 3
 * @param parte 'condicion' | 'resultado'
 * @param negativa niega ESA cláusula
 */
export const conditionalVerbPhrase = ({ tipo, parte, subject, verb, negativa = false }) => {
  const cfg = CONDICIONALES[tipo] || CONDICIONALES[1];
  const v = String(verb || '').toLowerCase().trim();
  const modo = negativa ? 'negative' : 'affirmative';
  if (!subject || !v) return '';

  if (parte === 'condicion') {
    /* El `were` del subjuntivo: en la 2ª condicional «be» va en `were` para
       TODAS las personas, también «I» y «he». Es lo que se enseña, así que es
       lo que se pide — y `was` se acepta con aviso, no se da por malo. */
    if (cfg.subjuntivo && v === 'be') return negativa ? "weren't" : 'were';
    return buildVerbPhrase(subject, v, cfg.ifTense, null, modo);
  }
  /* La 3ª no es un tiempo de la lista: `would have` + participio se arma aquí,
     igual que en `terceraPrincipal`. */
  if (cfg.main.perfecto) return negativa ? `wouldn't have ${pastParticiple(v)}` : `would have ${pastParticiple(v)}`;
  if (cfg.main.modal)    return buildVerbPhrase(subject, v, '', cfg.main.modal, modo);
  return buildVerbPhrase(subject, v, cfg.main.tense, null, modo);
};

/* «If I was rich» en vez de «If I were rich»: la forma coloquial existe y el
   alumno la va a escribir. Se acepta y se avisa —no se marca mal—, que es la
   decisión tomada para toda la suite. Solo aplica a la CONDICIÓN de la 2ª. */
export const esWasPorWere = ({ tipo, parte, verb, respuesta }) => {
  if (tipo !== 2 || parte !== 'condicion') return false;
  if (String(verb || '').toLowerCase().trim() !== 'be') return false;
  const r = String(respuesta || '').toLowerCase().trim().replace(/\.$/, '');
  return r === 'was' || r === "wasn't" || r === 'was not';
};
