import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Volume2, VolumeX, AlertTriangle, CheckCircle, XCircle, HelpCircle, X, History, Copy, Check, Trash2, Play, Info, BarChart2, ChevronDown, UserCircle } from 'lucide-react';
import {
  translations,
  commonVerbs,
  irregularVerbs,
  COURSE_ORDER,
  modes,
  tenses,
  modals,
  whWords,
  whSuggestions,
  whAsks,
  whExtPideSustantivo,
  whSubjectWords,
  frequencyAdverbs,
  timeMarkers,
  uncountableNouns,
  countableNouns,
  englishDictionary,
  validateSubject,
  validateVerb,
  validateComplement,
  hispanicNames,
  looksLikeValidWord
} from './data';
import {
  smartCaseSubject,
  isThirdPersonSingular,
  getBeForm,
  getWasWere,
  getHasHave,
  presentParticiple,
  simplePast,
  pastParticiple,
  conjugate3p,
  getAuxAndVerbForm,
  buildVerbPhrase,
  buildSentenceText,
  detectConjugatedVerbBase,
  getVerbChangeType,
} from './conjugation';
import { useClipboard, useSpeechSynthesis, useLocalStorage, useSessionStats } from './hooks';
import { ROLE_TW } from './tokens.generated.js';
import { TENSE_FAMILIES, ASPECTS } from './tenseFamilies.generated.js';
import { loadProgress, saveProgress, recordAttempt, recordRound, evaluateBadges, BADGES } from './gamification.generated.js';

/* Toggle de tema de la suite (auto→claro→oscuro por SO; toggle binario que ofrece
   el modo destino). Usa window.ghTheme, sincronizado same-origin entre las 4 apps. */
function ThemeToggle({ lang = 'es' }) {
  const [eff, setEff] = useState(() => (typeof window !== 'undefined' && window.ghTheme ? window.ghTheme.effective() : 'light'));
  useEffect(() => {
    if (!window.ghTheme) return;
    const sync = () => setEff(window.ghTheme.effective());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
    const onStorage = (e) => { if (e.key === 'gh_theme') sync(); };
    window.addEventListener('storage', onStorage);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', sync) : mq.removeListener(sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  /* Embebida en el Hub: el tema se maneja desde la barra del Hub, no desde
     aqui — en celular esta cabecera queda cargada y el boton compite con el
     titulo. Standalone / PWA es el unico que hay, asi que se mantiene.
     El corte va DESPUES de los hooks: si no, serian hooks condicionales. */
  if (typeof window !== 'undefined' && window.self !== window.top) return null;
  const target = eff === 'dark' ? 'light' : 'dark';
  const name = { es: { light: 'Claro', dark: 'Oscuro' }, en: { light: 'Light', dark: 'Dark' } }[lang][target];
  return (
    <button
      onClick={() => window.ghTheme && setEff(window.ghTheme.toggle())}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
      title={`${lang === 'es' ? 'Cambiar a modo' : 'Switch to'} ${name.toLowerCase()}`}
      aria-label={`${lang === 'es' ? 'Cambiar a modo' : 'Switch to'} ${name.toLowerCase()}`}
    >
      <span className="text-base leading-none">{target === 'dark' ? '🌙' : '☀️'}</span>
      <span>{name}</span>
    </button>
  );
}

/* Familia de tiempo (tono = timeType, aspecto del id) para el acento del selector.
   Lee el tema actual en cada llamada para elegir la variante light/dark. */
const aspectOf = (id = '') => (/continuous/.test(id) && /perfect/.test(id)) ? 3 : /perfect/.test(id) ? 2 : /continuous/.test(id) ? 1 : 0;
const themeVariant = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

/* Tinta legible sobre un fondo dado. Se usa en la pastilla del aspecto, único
   sitio donde queda texto sobre la rampa: sus pasos van de un tinte pálido al
   tono puro, así que la tinta no puede ser fija.
   Elige la que MAXIMIZA el contraste en vez de partir por un umbral: con tonos
   de luminancia media (emerald-600, violet-300) el umbral se equivoca y deja
   ratios de 2.7:1. */
const relLum = (hex) => {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const readableInk = (hex) => {
  const L = relLum(hex);
  const vsWhite = 1.05 / (L + 0.05);
  const vsDark = (L + 0.05) / (relLum('#0f172a') + 0.05);
  return vsDark >= vsWhite ? '#0f172a' : '#ffffff';
};
const tenseFam = (tenseId) => {
  const tObj = tenses.find(t => t.id === tenseId);
  const fam = tObj && TENSE_FAMILIES[tObj.timeType];
  if (!fam) return null;
  const v = themeVariant();
  const asp = aspectOf(tObj.id);
  return { color: fam.color[v], ink: fam.ink[v], bg: fam.bg[v][asp], icon: ASPECTS[asp].icon, label: fam.label };
};

/**
 * Selector de tiempos Y modales. Reemplaza al <select> nativo, cuyas opciones no
 * se pueden colorear: aquí cada tiempo muestra su familia (tono = presente/
 * pasado/futuro) con la intensidad y el icono de su aspecto (● ◐ ◆ ◈).
 *
 * Los modales viven aquí como cuarto grupo y no en un control aparte, porque
 * ocupan la MISMA ranura gramatical: lo que determina la forma del verbo. La app
 * ya los trataba como excluyentes (elegir modal desactivaba el selector de
 * tiempos, con un "no aplica con modal" de disculpa); ahora esa exclusión se ve
 * en vez de explicarse. Van en su propio grupo, con el color de la familia
 * `modal` del sistema de diseño, porque un modal NO es un tiempo.
 */
function TensePicker({ value, modalValue, onSelectTense, onSelectModal, language, cefrLevel, highlight }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const v = themeVariant();
  const sel = tenses.find(t => t.id === value);
  const fam = tenseFam(value);
  const selModal = modals.find(m => m.id && m.id === modalValue);
  const modalFam = TENSE_FAMILIES.modal;
  const groups = ['present', 'past', 'future'].map(tt => ({
    tt,
    label: tt === 'present' ? (language === 'es' ? 'Presente' : 'Present') : tt === 'past' ? (language === 'es' ? 'Pasado' : 'Past') : (language === 'es' ? 'Futuro' : 'Future'),
    fam: TENSE_FAMILIES[tt],
    items: tenses.filter(t => t.timeType === tt && COURSE_ORDER.indexOf(t.cefr) <= COURSE_ORDER.indexOf(cefrLevel)),
  })).filter(g => g.items.length > 0);
  const modalItems = modals.filter(m => m.id && COURSE_ORDER.indexOf(m.cefr) <= COURSE_ORDER.indexOf(cefrLevel));

  return (
    <div ref={boxRef} className="relative w-full sm:w-auto sm:flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={(fam || selModal) ? { borderLeftWidth: '4px', borderLeftColor: selModal ? modalFam.color[v] : fam.color } : undefined}
        className={`w-full flex items-center gap-2 px-2.5 py-2 sm:py-1.5 rounded-lg text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer text-left ${
          highlight ? 'border-2 border-indigo-400 ring-2 ring-indigo-200' : 'border border-gray-200'
        }`}
      >
        {selModal ? (
          <>
            <span className="text-base leading-none shrink-0" style={{ color: modalFam.color[v] }} aria-hidden="true">{modalFam.icon}</span>
            <span className="truncate">{selModal.name}</span>
            <span className="text-xs font-normal text-gray-400 truncate hidden sm:inline">
              {language === 'es' ? selModal.descEs : selModal.descEn}
            </span>
          </>
        ) : sel && fam ? (
          <>
            <span className="text-base leading-none shrink-0" style={{ color: fam.color }} aria-hidden="true">{fam.icon}</span>
            <span className="truncate">{language === 'es' ? sel.nameEs : sel.nameEn}</span>
          </>
        ) : (
          <span className="text-gray-400 font-medium truncate">{language === 'es' ? 'Selecciona un tiempo o modal...' : 'Select a tense or modal...'}</span>
        )}
        <ChevronDown className={`w-4 h-4 ml-auto shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* En escritorio el panel NO hereda el ancho del disparador: ahí comparte
          fila con la etiqueta y los botones de modo, y con dos columnas los
          nombres largos ("Presente Perfecto Continuo") no cabían. */}
      {open && (
        <div role="listbox" className="absolute z-20 mt-1 left-0 w-full sm:w-[34rem] max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-2">
          {groups.map(g => (
            <div key={g.tt} className="mb-2 last:mb-0">
              <p className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-1 flex items-center gap-1.5" style={{ color: g.fam.color[v] }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: g.fam.color[v] }} aria-hidden="true" />
                {g.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {g.items.map(tn => {
                  const asp = aspectOf(tn.id);
                  const selected = tn.id === value;
                  const step = g.fam.bg[v][asp];
                  return (
                    <button
                      key={tn.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => { onSelectTense(tn.id); setOpen(false); }}
                      /* Sin title: el nombre del tiempo ya está a la vista y la
                         familia/aspecto los dice ese mismo nombre. El title solo
                         servía cuando el texto se truncaba, y ya no se trunca. */
                      /* Fondo SIEMPRE el paso más pálido: da el tono (=tiempo)
                         sin comprometer la lectura. La intensidad (=aspecto) se
                         mudó a la pastilla del icono, donde la tinta se calcula. */
                      style={{ background: g.fam.bg[v][0], boxShadow: selected ? `inset 0 0 0 2px ${g.fam.color[v]}` : undefined }}
                      className="flex items-center gap-2 pr-2.5 py-2 rounded-lg text-left text-sm font-medium transition-transform hover:scale-[1.01] overflow-hidden"
                    >
                      {/* Riel: el tono a plena saturación, siempre visible */}
                      <span className="self-stretch w-1 rounded-full shrink-0" style={{ background: g.fam.color[v] }} aria-hidden="true" />
                      {/* Pastilla de aspecto: aquí sí vive la rampa de intensidad */}
                      <span
                        className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold"
                        style={{ background: step, color: readableInk(step) }}
                        aria-hidden="true"
                      >
                        {ASPECTS[asp].icon}
                      </span>
                      {/* Sin truncate: si el ancho aprieta, el nombre envuelve
                          en vez de cortarse. El riel es self-stretch, así que
                          acompaña la altura de las filas de dos líneas. */}
                      <span className="min-w-0 leading-tight text-gray-800">{language === 'es' ? tn.nameEs : tn.nameEn}</span>
                      {selected && <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-gray-800" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Cuarto grupo: modales. Separado y con su propio color porque un
              modal NO es un tiempo — pero va en el mismo selector porque compite
              por la misma decisión. Sin pastilla de aspecto: no tienen aspecto. */}
          {modalItems.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-1 flex items-center gap-1.5" style={{ color: modalFam.color[v] }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: modalFam.color[v] }} aria-hidden="true" />
                {modalFam.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {modalItems.map(m => {
                  const selected = m.id === modalValue;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => { onSelectModal(m.id); setOpen(false); }}
                      style={{ background: modalFam.bg[v][0], boxShadow: selected ? `inset 0 0 0 2px ${modalFam.color[v]}` : undefined }}
                      className="flex items-center gap-2 pr-2.5 py-2 rounded-lg text-left text-sm font-medium transition-transform hover:scale-[1.01] overflow-hidden"
                    >
                      <span className="self-stretch w-1 rounded-full shrink-0" style={{ background: modalFam.color[v] }} aria-hidden="true" />
                      <span className="min-w-0 leading-tight">
                        <span className="text-gray-800 font-semibold">{m.name}</span>
                        <span className="block text-[11px] text-gray-500 leading-tight">
                          {language === 'es' ? m.descEs : m.descEn}
                        </span>
                      </span>
                      {selected && <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-gray-800" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Guía de uso de la app. Reemplaza a la antigua "Guía de Marcadores Temporales":
 * esos marcadores ya viven junto al campo Complemento (chips por tiempo), que es
 * un lugar más contextual, y la sección prometía ayuda de la app pero entregaba
 * una lista de expresiones.
 */
function UsageGuide({ language }) {
  const es = language === 'es';
  const v = themeVariant();

  const Section = ({ title, children }) => (
    <section className="mb-5">
      <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
      {children}
    </section>
  );

  const steps = es
    ? [['Elige el tiempo verbal y el modo', 'Arriba del todo. El tiempo define la forma del verbo; el modo, si la oración afirma, niega o pregunta.'],
       ['Completa las piezas', 'Sujeto y verbo son obligatorios; el complemento es opcional. El verbo va en forma base (work, no worked): la app lo conjuga.'],
       ['Toca Generar', 'Verás la oración armada y, debajo, cada parte pintada con su color.']]
    : [['Choose the tense and the mode', 'At the very top. The tense sets the verb form; the mode decides whether the sentence states, denies or asks.'],
       ['Fill in the pieces', 'Subject and verb are required; the complement is optional. Type the verb in base form (work, not worked): the app conjugates it.'],
       ['Hit Generate', "You'll see the finished sentence and, below it, each part painted in its colour."]];

  const roles = [
    { dot: 'bg-indigo-600', k: 'S', es: 'Sujeto', en: 'Subject', dEs: 'quién realiza la acción', dEn: 'who performs the action' },
    { dot: 'bg-rose-600', k: 'V', es: 'Verbo', en: 'Verb', dEs: 'la acción o el estado', dEn: 'the action or state' },
    { dot: 'bg-emerald-600', k: 'C', es: 'Complemento', en: 'Complement', dEs: 'el resto de la información', dEn: 'the rest of the information' },
    { dot: 'bg-teal-600', k: 'WH', es: 'Palabra WH', en: 'WH word', dEs: 'abre una pregunta abierta', dEn: 'opens an open question' },
    { dot: 'bg-amber-500', k: 'A', es: 'Adverbio', en: 'Adverb', dEs: 'frecuencia: always, never…', dEn: 'frequency: always, never…' },
  ];

  const activities = es
    ? [['📝', 'Completa la oración', 'Escribe la frase verbal que falta.'],
       ['✏️', 'Corrige el error', 'La oración trae una falla: encuéntrala y arréglala.'],
       ['🔍', 'Identifica la estructura', 'Reconoce qué tiempo verbal y qué modo tiene.'],
       ['🔄', 'Modo repaso', 'Vuelve sobre lo que más te cuesta, espaciado en el tiempo.']]
    : [['📝', 'Fill in the sentence', 'Type the missing verb phrase.'],
       ['✏️', 'Correct the error', 'The sentence has a flaw: find it and fix it.'],
       ['🔍', 'Identify the structure', 'Recognise which tense and which mode it uses.'],
       ['🔄', 'Review mode', 'Come back to what you find hardest, spaced over time.']];

  return (
    <div className="text-sm">
      <Section title={es ? '¿Cómo se arma una oración?' : 'How do you build a sentence?'}>
        <ol className="space-y-2">
          {steps.map(([head, body], i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
              <span className="min-w-0">
                <b className="text-gray-800">{head}.</b>{' '}
                <span className="text-gray-600">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={es ? 'Los colores del análisis' : 'The analysis colours'}>
        <p className="text-gray-600 mb-2">
          {es ? 'Al generar, cada parte de la oración queda pintada con su color. Son los mismos en toda la suite.'
              : 'Once generated, each part of the sentence is painted in its colour. They are the same across the whole suite.'}
        </p>
        <ul className="grid sm:grid-cols-2 gap-1.5">
          {roles.map(r => (
            <li key={r.k} className="flex items-center gap-2">
              <span className={`shrink-0 w-6 text-center text-[10px] font-bold text-white rounded ${r.dot}`}>{r.k}</span>
              <span className="text-gray-800 font-medium">{es ? r.es : r.en}</span>
              <span className="text-gray-500 text-xs truncate">— {es ? r.dEs : r.dEn}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={es ? 'Cómo leer el selector de tiempos' : 'How to read the tense picker'}>
        <p className="text-gray-600 mb-2">
          {es ? 'El color dice CUÁNDO ocurre y el ícono dice CÓMO se presenta la acción.'
              : 'The colour tells you WHEN it happens and the icon tells you HOW the action is presented.'}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {['present', 'past', 'future'].map(tt => {
            const fam = TENSE_FAMILIES[tt];
            return (
              <span key={tt} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: fam.bg[v][0], color: 'inherit' }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: fam.color[v] }} aria-hidden="true" />
                <span className="text-gray-800">{fam.label}</span>
              </span>
            );
          })}
        </div>
        <ul className="space-y-1.5">
          {ASPECTS.map((a, i) => {
            const step = TENSE_FAMILIES.present.bg[v][i];
            return (
              <li key={a.id} className="flex items-center gap-2">
                <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold"
                      style={{ background: step, color: readableInk(step) }} aria-hidden="true">{a.icon}</span>
                <b className="text-gray-800">{a.label}</b>
                <span className="text-gray-500 text-xs">
                  {es
                    ? ['— un solo verbo: works, played', '— en curso: is working', '— con have/has/had: has worked', '— ambas cosas: has been working'][i]
                    : ['— a single verb: works, played', '— in progress: is working', '— with have/has/had: has worked', '— both at once: has been working'][i]}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={es ? 'Los tres modos' : 'The three modes'}>
        <ul className="space-y-1.5 text-gray-600">
          <li><b className="text-gray-800">{es ? 'Afirmativa' : 'Affirmative'}</b> — <i>She works here.</i></li>
          <li><b className="text-gray-800">{es ? 'Negativa' : 'Negative'}</b> — <i>She doesn't work here.</i></li>
          <li><b className="text-gray-800">{es ? 'Interrogativa' : 'Interrogative'}</b> — <i>Does she work here?</i> {es ? 'Al elegirla aparecen las palabras WH para preguntas abiertas.' : 'Choosing it reveals the WH words for open questions.'}</li>
        </ul>
      </Section>

      <Section title={es ? 'Verbos modales' : 'Modal verbs'}>
        <p className="text-gray-600">
          {es ? 'Son opcionales y reemplazan al tiempo verbal: can, must, should… Al elegir uno, el selector de tiempos se desactiva, porque el modal ya define la forma del verbo (siempre en base: she can work).'
              : 'They are optional and replace the tense: can, must, should… Picking one disables the tense selector, because the modal already sets the verb form (always base: she can work).'}
        </p>
      </Section>

      <Section title={es ? 'La sección Práctica' : 'The Practice section'}>
        <ul className="space-y-1.5">
          {activities.map(([icon, head, body]) => (
            <li key={head} className="flex gap-2">
              <span className="shrink-0">{icon}</span>
              <span><b className="text-gray-800">{head}</b> <span className="text-gray-600">— {body}</span></span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

const COMPLEMENT_CHIPS = {
  'simple-present':             ['every day', 'on Mondays', 'in the morning', 'at work', 'at home'],
  'present-continuous':         ['right now', 'at the moment', 'this week', 'today'],
  'simple-past':                ['yesterday', 'last week', 'two days ago', 'last year', 'in 2020'],
  'future-going-to':            ['tomorrow', 'next week', 'this weekend', 'soon', 'next month'],
  'present-perfect':            ['already', 'just', 'never', 'recently', 'so far', 'yet'],
  'past-continuous':            ['yesterday at 8', 'last night', 'all morning', 'at that moment'],
  'simple-future':              ['tomorrow', 'next year', 'soon', 'in the future', 'next month'],
  'past-perfect':               ['before she arrived', 'already', 'by then', 'when I called'],
  'used-to':                    ['when I was a child', 'years ago', 'as a kid', 'in those days'],
  'present-perfect-continuous': ['for two hours', 'since this morning', 'all day', 'since Monday'],
};

// Adverbios de sentido negativo: combinados con el modo negativo producen
// doble negación ("She doesn't never work"), así que se excluyen en ese modo
const NEGATIVE_SENSE_ADVERBS = ['never', 'hardly ever', 'rarely', 'seldom'];

// Distancia de edición entre dos palabras, usada por el corrector ortográfico.
// Pura y sin dependencias de props/estado — no hace falta recrearla en cada render.
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j] + 1
        );
      }
    }
  }
  return dp[m][n];
};

// Fórmulas estructurales por tiempo verbal y modo (S/V/C = sujeto/verbo/complemento)
const TENSE_FORMULAS = {
  'simple-present':             { aff: 'S + V(s/es) + C',                          neg: 'S + do/does not + V + C',                    int: 'Do/Does + S + V + C?' },
  'present-continuous':         { aff: 'S + am/is/are + V(ing) + C',               neg: 'S + am/is/are + not + V(ing) + C',            int: 'Am/Is/Are + S + V(ing) + C?' },
  'simple-past':                { aff: 'S + V(past) + C',                          neg: 'S + did not + V + C',                         int: 'Did + S + V + C?' },
  'past-continuous':            { aff: 'S + was/were + V(ing) + C',                neg: 'S + was/were + not + V(ing) + C',             int: 'Was/Were + S + V(ing) + C?' },
  'simple-future':              { aff: 'S + will + V + C',                         neg: 'S + will not + V + C',                        int: 'Will + S + V + C?' },
  'future-going-to':            { aff: 'S + am/is/are + going to + V + C',         neg: 'S + am/is/are + not + going to + V + C',      int: 'Am/Is/Are + S + going to + V + C?' },
  'present-perfect':            { aff: 'S + have/has + V(pp) + C',                 neg: 'S + have/has + not + V(pp) + C',              int: 'Have/Has + S + V(pp) + C?' },
  'past-perfect':               { aff: 'S + had + V(pp) + C',                      neg: 'S + had + not + V(pp) + C',                   int: 'Had + S + V(pp) + C?' },
  'present-perfect-continuous': { aff: 'S + have/has + been + V(ing) + C',         neg: 'S + have/has + not + been + V(ing) + C',      int: 'Have/Has + S + been + V(ing) + C?' },
  'used-to':                    { aff: 'S + used to + V + C',                      neg: 'S + did not + use to + V + C',                int: 'Did + S + use to + V + C?' },
};

// Explicaciones (ES/EN) de cada parte de la oración, usadas en el desglose visual.
// Estático — no depende de props/estado, el idioma se elige en el punto de uso.
const SENTENCE_PART_EXPLANATIONS = {
  subject: {
    es: `Sujeto de la oración`,
    en: `Subject of the sentence`
  },
  auxiliary: {
    'am': { es: 'Verbo "to be" para 1ra persona singular (I)', en: '"To be" verb for 1st person singular (I)' },
    'is': { es: 'Verbo "to be" para 3ra persona singular (he/she/it)', en: '"To be" verb for 3rd person singular (he/she/it)' },
    'are': { es: 'Verbo "to be" para plural o "you"', en: '"To be" verb for plural or "you"' },
    'was': { es: 'Verbo "to be" en pasado para singular', en: '"To be" verb in past for singular' },
    'were': { es: 'Verbo "to be" en pasado para plural o "you"', en: '"To be" verb in past for plural or "you"' },
    'do': { es: 'Auxiliar "do" para presente (I/you/we/they)', en: 'Auxiliary "do" for present (I/you/we/they)' },
    'does': { es: 'Auxiliar "does" para 3ra persona singular', en: 'Auxiliary "does" for 3rd person singular' },
    'did': { es: 'Auxiliar "did" para pasado (todas las personas)', en: 'Auxiliary "did" for past (all persons)' },
    'will': { es: 'Auxiliar "will" para futuro simple', en: 'Auxiliary "will" for simple future' },
    'have': { es: 'Auxiliar "have" para tiempos perfectos (I/you/we/they)', en: 'Auxiliary "have" for perfect tenses (I/you/we/they)' },
    'has': { es: 'Auxiliar "has" para tiempos perfectos (3ra persona)', en: 'Auxiliary "has" for perfect tenses (3rd person)' },
    'had': { es: 'Auxiliar "had" para pasado perfecto', en: 'Auxiliary "had" for past perfect' },
    "don't": { es: 'Auxiliar negativo para presente', en: 'Negative auxiliary for present' },
    "doesn't": { es: 'Auxiliar negativo para 3ra persona singular', en: 'Negative auxiliary for 3rd person singular' },
    "didn't": { es: 'Auxiliar negativo para pasado', en: 'Negative auxiliary for past' },
    "won't": { es: 'Auxiliar/Modal negativo para futuro o rechazo', en: 'Negative auxiliary/modal for future or refusal' },
    'going to': { es: 'Estructura "going to" para futuro con intención/plan', en: '"Going to" structure for future with intention/plan' },
    'been': { es: 'Participio de "be" para tiempos perfectos continuos', en: 'Past participle of "be" for perfect continuous tenses' },
    'used to': { es: 'Estructura para hábitos pasados que ya no existen', en: 'Structure for past habits that no longer exist' },
    'use to': { es: 'Forma de "used to" tras el auxiliar did (pierde la -d)', en: 'Form of "used to" after the auxiliary did (drops the -d)' },
    'not': { es: 'Partícula negativa', en: 'Negative particle' },
    // Modales
    'can': { es: 'Modal "can" - expresa habilidad o posibilidad', en: 'Modal "can" - expresses ability or possibility' },
    'could': { es: 'Modal "could" - habilidad pasada, posibilidad o cortesía', en: 'Modal "could" - past ability, possibility, or politeness' },
    'should': { es: 'Modal "should" - consejo u obligación moral', en: 'Modal "should" - advice or moral obligation' },
    'would': { es: 'Modal "would" - ofrecimientos, condicional o cortesía', en: 'Modal "would" - offers, conditional, or politeness' },
    'must': { es: 'Modal "must" - obligación fuerte o certeza', en: 'Modal "must" - strong obligation or certainty' },
    'may': { es: 'Modal "may" - permiso formal o posibilidad', en: 'Modal "may" - formal permission or possibility' },
    'might': { es: 'Modal "might" - posibilidad remota', en: 'Modal "might" - remote possibility' },
    'shall': { es: 'Modal "shall" - sugerencia u ofrecimiento formal', en: 'Modal "shall" - suggestion or formal offer' },
    // Modales negativos
    "can't": { es: 'Modal negativo - inhabilidad o imposibilidad', en: 'Negative modal - inability or impossibility' },
    "couldn't": { es: 'Modal negativo - inhabilidad pasada o imposibilidad', en: 'Negative modal - past inability or impossibility' },
    "shouldn't": { es: 'Modal negativo - consejo en contra', en: 'Negative modal - advice against' },
    "wouldn't": { es: 'Modal negativo - rechazo condicional', en: 'Negative modal - conditional refusal' },
    "mustn't": { es: 'Modal negativo - prohibición', en: 'Negative modal - prohibition' },
  },
  verbChanges: {
    'base': { es: 'Verbo en forma base (infinitivo sin "to")', en: 'Verb in base form (infinitive without "to")' },
    'third-person-s': { es: 'Se añade "-s" para 3ra persona singular en presente', en: '"-s" is added for 3rd person singular in present' },
    'ing': { es: 'Se añade "-ing" para formar el gerundio/participio presente', en: '"-ing" is added to form the gerund/present participle' },
    'past': { es: 'Verbo conjugado en pasado simple', en: 'Verb conjugated in simple past' },
    'participle': { es: 'Verbo en participio pasado', en: 'Verb in past participle' },
    'irregular': { es: 'Verbo irregular (no sigue la regla -ed)', en: 'Irregular verb (does not follow -ed rule)' },
  }
};

/* Nivel e idioma compartidos con la suite (mismo origen => mismo localStorage).
   El Hub escribe gh_level; standalone, Grammaster los recuerda igual en vez de
   arrancar siempre en 'es'/'basico1'. Se valida lo leído por si quedó un valor
   de otra versión. */
const GH_LEVELS = ['basico1', 'basico2', 'elemental1', 'elemental2', 'intermedio1', 'intermedio2', 'avanzado'];
const readShared = (key, valid, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return valid.includes(v) ? v : fallback;
  } catch { return fallback; }
};
const writeShared = (key, v) => {
  try { localStorage.setItem(key, v); } catch { /* modo privado */ }
};

const EnglishSentenceBuilder = () => {
  const [language, setLanguageState] = useState(() => readShared('gh_lang', ['es', 'en'], 'es'));
  const [fromHub, setFromHub] = useState(() => window.self !== window.top);
  const setLanguage = (v) => { setLanguageState(v); writeShared('gh_lang', v); };
  const [subject, setSubject] = useState('');
  const [verb, setVerb] = useState('');
  const [complement, setComplement] = useState('');
  const [selectedTense, setSelectedTense] = useState('');
  const [selectedMode, setSelectedMode] = useState('affirmative');
  const [selectedModal, setSelectedModal] = useState('');
  const [whWord, setWhWord] = useState('');
  const [whExtension, setWhExtension] = useState('');
  const [whWarning, setWhWarning] = useState('');
  /* Mientras falte el sustantivo, la extensión no entra en la oración: se arma
     «What does she like?», que sí es correcta, y el selector pide lo que falta.
     La regla vive en data/grammar.js, junto a las sugerencias que la disparan. */
  const whExtIncompleta = whExtPideSustantivo(whExtension);
  const whExtUsable = whExtIncompleta ? '' : whExtension.trim();
  const esPregSujeto = selectedMode === 'subject-question';
  // En la pregunta de sujeto la wh manda: solo las que pueden ejecutar la acción.
  const whDisponibles = whWords.filter(wh => wh.id &&
    (!esPregSujeto || whSubjectWords.includes(wh.id)));
  const [selectedAdverb, setSelectedAdverb] = useState('');
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [semanticWarning, setSemanticWarning] = useState(null);
  const [showTimeGuide, setShowTimeGuide] = useState(false);
  const [isIrregular, setIsIrregular] = useState(false);
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const [speechRate, setSpeechRate] = useState(0.9);

  // FASE 1: Nuevos estados
  const [sentenceHistory, setSentenceHistory] = useLocalStorage('sentenceHistory', []);
  const [confirmClear, setConfirmClear] = useState(false);   // "¿Seguro?" del historial
  const confirmClearTimer = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const { stats: sessionStats, totalAllTime, incrementStats } = useSessionStats();
  const [showVerbSuggestions, setShowVerbSuggestions] = useState(false);
  const { copy: copyToClipboard, copied } = useClipboard();
  
  // Corrector ortográfico
  const [spellingErrors, setSpellingErrors] = useState({
    subject: [],
    verb: [],
    complement: []
  });

  // FASE 2: Nuevos estados
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceType, setPracticeType] = useState('');
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceResult, setPracticeResult] = useState(null);
  const [answerStreak, setAnswerStreak] = useState(0);   // racha de aciertos consecutivos (inline)
  /* Rondas de práctica. Antes la sesión no terminaba nunca: nextPractice
     generaba otro ejercicio indefinidamente, sin cuenta ni cierre, así que el
     alumno no sabía si iba por la mitad o recién empezando y no tenía dónde
     parar. Diez ejercicios son 3-5 minutos, la misma dosis que en Question Lab
     y la que el banco de frases le predica al que estudia de noche. */
  const RONDA = 10;
  const [ronda, setRonda] = useState({ hechos: 0, ok: 0, mejor: 0 });
  /* `hechos` sube al verificar, así que mientras se muestra la corrección hay un
     ejercicio contado que el alumno todavía tiene en pantalla. De ahí salen dos
     cosas distintas: `rondaTerminada` espera a que pida el siguiente (si no, el
     resumen se comía la corrección del ejercicio 10) y el rótulo nombra el
     ejercicio visible, que antes saltaba al verificar y hacía parecer 11. */
  const rondaTerminada = ronda.hechos >= RONDA && !practiceResult;
  const rondaEnPantalla = Math.min(ronda.hechos + (practiceResult ? 0 : 1), RONDA);
  const [badgeToasts, setBadgeToasts] = useState([]);   // gamificación de suite
  const [identifyTenseAnswer, setIdentifyTenseAnswer] = useState('');
  const [identifyModeAnswer, setIdentifyModeAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [cefrLevel, setCefrLevelState] = useState(() => readShared('gh_level', GH_LEVELS, 'basico1'));
  const setCefrLevel = (v) => { setCefrLevelState(v); writeShared('gh_level', v); };
  const [notification, setNotification] = useState(null); // { type: 'error' | 'success', message: string }

  const [practiceDays, setPracticeDays] = useLocalStorage('practiceDays', []); // array of 'YYYY-MM-DD' strings
  const [srsData, setSrsData] = useLocalStorage('srsData', {}); // { 'tenseId|mode': { lastPracticed, timesCorrect, timesWrong, interval } }
  const [reviewUpToDate, setReviewUpToDate] = useState(false);

  // UI simplificada
  const [activePanel, setActivePanel] = useState(null); // 'history', 'practice', 'guide', 'settings', 'progress'

  // Análisis gramatical visual
  const [sentenceAnalysis, setSentenceAnalysis] = useState(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [selectedPartIndex, setSelectedPartIndex] = useState(null); // parte tocada/enfocada en la oración coloreada (accesible en táctil/teclado)
  const [allModeSentences, setAllModeSentences] = useState(null);
  const [showAllModes, setShowAllModes] = useState(false);

  // Validación de entradas
  const [subjectValidation, setSubjectValidation] = useState({ valid: true, warning: null });
  const [verbValidation, setVerbValidation] = useState({ valid: true, warning: null });
  const [verbBaseSuggestion, setVerbBaseSuggestion] = useState(null);
  const [complementValidation, setComplementValidation] = useState({ valid: true, warning: null });

  const t = translations[language];

  // Mostrar notificación temporal
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función para obtener sugerencias de corrección
  const getSpellingSuggestions = (word) => {
    if (!word || word.length < 2) return [];

    const lowerWord = word.toLowerCase();
    const normalizedWord = lowerWord.normalize('NFD').replace(/[̀-ͯ]/g, '');

    // Si la palabra está en el diccionario, no hay error
    if (englishDictionary.includes(lowerWord)) return [];

    // Nombres propios (hispanos conocidos, o cualquier palabra capitalizada
    // con estructura razonable) no se corrigen — mismo criterio que validateSubject
    if (hispanicNames.includes(lowerWord) || hispanicNames.includes(normalizedWord)) return [];
    if (/^[A-ZÁÉÍÓÚÑ]/.test(word) && looksLikeValidWord(lowerWord)) return [];

    // Buscar palabras similares
    const suggestions = englishDictionary
      .map(dictWord => ({
        word: dictWord,
        distance: levenshteinDistance(lowerWord, dictWord)
      }))
      .filter(item => item.distance <= 2 && item.distance > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(item => item.word);

    return suggestions;
  };

  // Función para verificar ortografía en un texto
  const checkSpelling = (text, field) => {
    if (!text || text.trim().length === 0) {
      setSpellingErrors(prev => ({ ...prev, [field]: [] }));
      return;
    }

    const words = text.split(/[\s,]+/).filter(w => w.length > 0);
    const errors = [];

    words.forEach(word => {
      const cleanWord = word.replace(/[.,!?;:]/g, '');
      const suggestions = getSpellingSuggestions(cleanWord);
      
      if (suggestions.length > 0) {
        errors.push({
          word: cleanWord,
          suggestions: suggestions
        });
      }
    });

    setSpellingErrors(prev => ({ ...prev, [field]: errors }));
  };

  // Grammar HUB: escuchar cambio de idioma y nivel vía postMessage
  useEffect(() => {
    const validLevels = GH_LEVELS;
    const handler = (e) => {
      if (e.data?.type === 'GRAMMAR_HUB_LANG' && (e.data.lang === 'es' || e.data.lang === 'en')) {
        setLanguage(e.data.lang);
        setFromHub(true);
      }
      if (e.data?.type === 'GRAMMAR_HUB_LEVEL' && validLevels.includes(e.data.level)) {
        setCefrLevel(e.data.level);
        setFromHub(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // FASE 1: Filtrar verbos sugeridos
  const getVerbSuggestions = () => {
    if (!verb) return [];
    const lowerVerb = verb.toLowerCase();
    return commonVerbs.filter(v => v.startsWith(lowerVerb) && v !== lowerVerb).slice(0, 8);
  };

  /* Confirmación en la propia UI, no con window.confirm: dentro del iframe del
     Hub los diálogos nativos están bloqueados y confirm() devuelve false al
     instante, así que el botón no hacía nada. El primer toque arma, el segundo
     borra; se desarma solo a los 4 s. */
  const clearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeout(confirmClearTimer.current);
      confirmClearTimer.current = setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    clearTimeout(confirmClearTimer.current);
    setConfirmClear(false);
    setSentenceHistory([]); // useLocalStorage persiste el array vacío solo
    showNotification('success', language === 'es' ? 'Historial limpiado' : 'History cleared');
  };

  // FASE 1: Eliminar del historial
  const deleteFromHistory = (index) => {
    const newHistory = sentenceHistory.filter((_, i) => i !== index);
    setSentenceHistory(newHistory);
  };

  const formatTimestamp = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return (language === 'es' ? 'Hoy ' : 'Today ') + time;
    if (isYesterday) return (language === 'es' ? 'Ayer ' : 'Yesterday ') + time;
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + time;
  };

  const exportHistory = () => {
    if (sentenceHistory.length === 0) return;
    const lines = sentenceHistory.map((item, i) => {
      const tenseName = language === 'es' ? item.config.tense?.nameEs : item.config.tense?.nameEn;
      return `${i + 1}. ${item.sentence}\n   [${tenseName || item.config.modal || ''} · ${item.config.mode} · ${formatTimestamp(item.timestamp)}]`;
    });
    // BOM para que Excel/Notepad no rompan los acentos al abrir el .txt
    const blob = new Blob(['﻿' + lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grammaster-historial.txt';
    // Hay que ADJUNTARLO al documento: sin esto Firefox ignora el click.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revocar de inmediato puede abortar la descarga antes de que arranque.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotification('success', language === 'es' ? 'Historial exportado' : 'History exported');
  };

  // Registrar día de práctica en localStorage y estado
  const recordPracticeDay = () => {
    const today = new Date().toISOString().split('T')[0];
    setPracticeDays(prev => prev.includes(today) ? prev : [...prev, today]);
  };

  // Calcular racha de días consecutivos
  const computeStreak = (days) => {
    if (!days || days.length === 0) return 0;
    const unique = [...new Set(days)].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (unique[0] !== today && unique[0] !== yesterdayStr) return 0;
    let streak = 1;
    for (let i = 0; i < unique.length - 1; i++) {
      const curr = new Date(unique[i]);
      const prev = new Date(unique[i + 1]);
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  };

  // Contar usos por tense.id desde el historial
  const computeTenseStats = () => {
    const counts = {};
    sentenceHistory.forEach(item => {
      const id = item.config?.tense?.id;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  };

  // Escapar caracteres especiales en RegExp
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Aplicar sugerencia de corrección
  const applySuggestion = (field, oldWord, newWord) => {
    const escapedOldWord = escapeRegExp(oldWord);
    if (field === 'subject') {
      setSubject(prev => prev.replace(new RegExp(escapedOldWord, 'gi'), newWord));
    } else if (field === 'verb') {
      setVerb(prev => prev.replace(new RegExp(escapedOldWord, 'gi'), newWord));
    } else if (field === 'complement') {
      setComplement(prev => prev.replace(new RegExp(escapedOldWord, 'gi'), newWord));
    }
  };


  // Limpiar tiempo verbal al cambiar de categoría
  useEffect(() => {
    setSelectedTense('');
  }, [cefrLevel]);

  /* La pregunta de sujeto solo existe desde el curso donde se enseña (AEF
     Intermedio II 12C). Si el alumno baja de nivel con ese modo puesto, hay que
     sacarlo: si no, queda seleccionado un modo que ya no está en la barra. */
  const modosVisibles = modes.filter(m =>
    !m.cefr || COURSE_ORDER.indexOf(m.cefr) <= COURSE_ORDER.indexOf(cefrLevel));
  useEffect(() => {
    if (!modosVisibles.some(m => m.id === selectedMode)) setSelectedMode('affirmative');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cefrLevel]);

  /* En la pregunta de sujeto la wh es obligatoria y no cualquiera sirve: al
     entrar al modo con «Where» puesta, se cambia por «Who». */
  useEffect(() => {
    if (!esPregSujeto) return;
    if (!whWord || !whSubjectWords.includes(whWord)) { setWhWord('who'); setWhExtension(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esPregSujeto]);

  // Limpiar adverbio cuando el tiempo verbal no es compatible
  useEffect(() => {
    if (selectedTense !== 'simple-present' && selectedTense !== 'simple-past') {
      setSelectedAdverb('');
    }
  }, [selectedTense]);

  // Limpiar adverbio cuando se selecciona un modal
  useEffect(() => {
    if (selectedModal) {
      setSelectedAdverb('');
    }
  }, [selectedModal]);

  // En modo negativo, quitar adverbios que producirían doble negación
  useEffect(() => {
    if (selectedMode === 'negative' && NEGATIVE_SENSE_ADVERBS.includes(selectedAdverb)) {
      setSelectedAdverb('');
    }
  }, [selectedMode, selectedAdverb]);

  // Limpiar la palabra WH al salir de interrogativa: si no, queda oculta en
  // el estado y se filtra en la variante "interrogativa" del comparador de
  // los 3 modos aunque el picker de WH ya no esté visible — confuso.
  useEffect(() => {
    if (selectedMode !== 'interrogative') {
      setWhWord('');
      setWhExtension('');
      setWhWarning('');
    }
  }, [selectedMode]);

  // Genera una oración con un error gramatical y retorna { sentence, wrongPart, correctPart }
  const buildWrongSentence = (subj, v, comp, tenseId, mode = 'affirmative') => {
    const is3p = isThirdPersonSingular(subj);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const compStr = comp ? ' ' + comp : '';
    const beForm = getBeForm(subj);
    const wasWere = getWasWere(subj);
    const hasHave = getHasHave(subj);
    const sMid = smartCaseSubject(subj); // a mitad de oración: "He" → "he", pero "I" se conserva
    const pp = pastParticiple(v);

    if (mode === 'affirmative') {
      if (tenseId === 'simple-present' && is3p)
        return { sentence: cap(subj) + ' ' + v + compStr + '.', wrongPart: v, correctPart: conjugate3p(v) };
      if (tenseId === 'simple-present' && !is3p)
        return { sentence: cap(subj) + ' ' + conjugate3p(v) + compStr + '.', wrongPart: conjugate3p(v), correctPart: v };
      if (tenseId === 'simple-past')
        return { sentence: cap(subj) + ' ' + v + compStr + '.', wrongPart: v, correctPart: simplePast(v) };
      if (tenseId === 'present-continuous')
        return { sentence: cap(subj) + ' ' + beForm + ' ' + v + compStr + '.', wrongPart: v, correctPart: presentParticiple(v) };
      if (tenseId === 'present-perfect')
        return { sentence: cap(subj) + ' ' + hasHave + ' ' + v + compStr + '.', wrongPart: v, correctPart: pp };
    }

    if (mode === 'negative') {
      if (tenseId === 'simple-present') {
        const wrong = is3p ? "don't" : "doesn't";
        const correct = is3p ? "doesn't" : "don't";
        return { sentence: cap(subj) + ' ' + wrong + ' ' + v + compStr + '.', wrongPart: wrong, correctPart: correct };
      }
      if (tenseId === 'simple-past')
        return { sentence: cap(subj) + " didn't " + simplePast(v) + compStr + '.', wrongPart: simplePast(v), correctPart: v };
      if (tenseId === 'present-continuous')
        return { sentence: cap(subj) + ' ' + beForm + ' not ' + v + compStr + '.', wrongPart: v, correctPart: presentParticiple(v) };
      if (tenseId === 'present-perfect') {
        const wrong = is3p ? 'have' : 'has';
        return { sentence: cap(subj) + ' ' + wrong + ' not ' + pp + compStr + '.', wrongPart: wrong, correctPart: hasHave };
      }
      if (tenseId === 'past-continuous')
        return { sentence: cap(subj) + ' ' + wasWere + ' not ' + v + compStr + '.', wrongPart: v, correctPart: presentParticiple(v) };
    }

    if (mode === 'interrogative') {
      if (tenseId === 'simple-present') {
        const wrong = is3p ? 'Do' : 'Does';
        const correct = is3p ? 'Does' : 'Do';
        return { sentence: wrong + ' ' + sMid + ' ' + v + compStr + '?', wrongPart: wrong, correctPart: correct };
      }
      if (tenseId === 'simple-past')
        return { sentence: 'Did ' + sMid + ' ' + simplePast(v) + compStr + '?', wrongPart: simplePast(v), correctPart: v };
      if (tenseId === 'present-continuous')
        return { sentence: cap(beForm) + ' ' + sMid + ' ' + v + compStr + '?', wrongPart: v, correctPart: presentParticiple(v) };
      if (tenseId === 'present-perfect') {
        const wrong = is3p ? 'Have' : 'Has';
        return { sentence: wrong + ' ' + sMid + ' ' + pp + compStr + '?', wrongPart: wrong, correctPart: cap(hasHave) };
      }
      if (tenseId === 'past-continuous')
        return { sentence: cap(wasWere) + ' ' + sMid + ' ' + v + compStr + '?', wrongPart: v, correctPart: presentParticiple(v) };
    }

    // Fallback
    return { sentence: cap(subj) + ' ' + v + compStr + '.', wrongPart: v, correctPart: v };
  };

  // FASE 2: Generar pregunta de práctica
  const generatePracticeQuestion = (type) => {
    const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
    const availableTenses = tenses.filter(t => COURSE_ORDER.indexOf(t.cefr) <= courseIndex);
    const subjects = ['I', 'You', 'He', 'She', 'We', 'They'];
    const verbs = ['work', 'study', 'play', 'eat', 'live', 'travel', 'read', 'write', 'run', 'cook'];
    const complements = ['every day', 'at school', 'at home', 'in the park', 'with friends', 'in the morning', 'on weekends'];

    const subj = subjects[Math.floor(Math.random() * subjects.length)];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const comp = complements[Math.floor(Math.random() * complements.length)];

    if (type === 'fill') {
      const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
      const mode = Math.random() > 0.4 ? 'affirmative' : 'negative';
      const correctAnswer = buildVerbPhrase(subj, v, tense.id, null, mode);
      const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tense.id });
      // Aceptar formas contraídas y no contraídas
      const uncontracted = correctAnswer
        .replace("doesn't", "does not").replace("don't", "do not").replace("didn't", "did not")
        .replace("can't", "cannot").replace("won't", "will not").replace("wouldn't", "would not")
        .replace("shouldn't", "should not").replace("mustn't", "must not").replace("couldn't", "could not")
        .replace("isn't", "is not").replace("aren't", "are not").replace("wasn't", "was not")
        .replace("weren't", "were not").replace("haven't", "have not").replace("hasn't", "has not")
        .replace("hadn't", "had not");
      const contracted = correctAnswer
        .replace("does not", "doesn't").replace("do not", "don't").replace("did not", "didn't")
        .replace("will not", "won't").replace("would not", "wouldn't").replace("should not", "shouldn't")
        .replace("must not", "mustn't").replace("could not", "couldn't").replace("cannot", "can't")
        .replace("is not", "isn't").replace("are not", "aren't").replace("was not", "wasn't")
        .replace("were not", "weren't").replace("have not", "haven't").replace("has not", "hasn't")
        .replace("had not", "hadn't");
      const acceptedAnswers = [correctAnswer.toLowerCase()];
      if (uncontracted !== correctAnswer) acceptedAnswers.push(uncontracted.toLowerCase());
      if (contracted !== correctAnswer) acceptedAnswers.push(contracted.toLowerCase());
      return { type: 'fill', subject: subj, verb: v, complement: comp, tense, mode, correctAnswer, acceptedAnswers, fullSentence };
    }

    if (type === 'correct') {
      const simpleTenses = availableTenses.filter(t =>
        ['simple-present', 'simple-past', 'present-continuous', 'present-perfect', 'past-continuous'].includes(t.id)
      );
      const tense = (simpleTenses.length > 0 ? simpleTenses : availableTenses)[Math.floor(Math.random() * (simpleTenses.length || availableTenses.length))];
      const mode = ['affirmative', 'negative', 'interrogative'][Math.floor(Math.random() * 3)];
      const { sentence: wrongSentence, wrongPart, correctPart } = buildWrongSentence(subj, v, comp, tense.id, mode);
      const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tense.id });
      const acceptedAnswers = [correctPart.toLowerCase()];
      const uncontracted = correctPart.replace("doesn't","does not").replace("don't","do not").replace("didn't","did not").replace("hasn't","has not").replace("haven't","have not").replace("won't","will not");
      if (uncontracted !== correctPart) acceptedAnswers.push(uncontracted.toLowerCase());
      return { type: 'correct', subject: subj, verb: v, complement: comp, tense, mode, wrongSentence, wrongPart, correctAnswer: correctPart, acceptedAnswers, fullSentence };
    }

    if (type === 'identify') {
      const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
      // Si hay menos de 3 tiempos disponibles, solo pedir modo
      const askTense = availableTenses.length >= 3;
      const askMode = true; // siempre pedir modo
      const optionCount = courseIndex <= 1 ? 3 : courseIndex <= 3 ? 4 : 5;

      const mode = ['affirmative', 'negative', 'interrogative'][Math.floor(Math.random() * 3)];
      const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
      const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tense.id });

      // Distractores solo de los tiempos que el estudiante conoce
      const distractors = availableTenses
        .filter(t => t.id !== tense.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, optionCount - 1);
      const tenseOptions = askTense ? [...distractors, tense].sort(() => Math.random() - 0.5) : [];

      return { type: 'identify', subject: subj, verb: v, complement: comp, tense, mode, fullSentence, tenseOptions, askTense, askMode };
    }
  };

  // FASE 2: Iniciar modo práctica
  const startPractice = (type) => {
    setPracticeType(type);
    setPracticeMode(true);
    const question = generatePracticeQuestion(type);
    setPracticeQuestion(question);
    setPracticeAnswer('');
    setPracticeResult(null);
    setIdentifyTenseAnswer('');
    setIdentifyModeAnswer('');
    setShowHint(false);
    setAnswerStreak(0);   // nueva actividad → racha desde cero
    setRonda({ hechos: 0, ok: 0, mejor: 0 });
  };

  // SRS: actualizar datos tras verificar respuesta
  const updateSRS = (tenseId, mode, isCorrect) => {
    if (!tenseId || !mode) return;
    const key = `${tenseId}|${mode}`;
    setSrsData(prev => {
      const existing = prev[key] || { lastPracticed: Date.now(), timesCorrect: 0, timesWrong: 0, interval: 1 };
      const updated = {
        ...existing,
        lastPracticed: Date.now(),
        timesCorrect: isCorrect ? existing.timesCorrect + 1 : existing.timesCorrect,
        timesWrong: isCorrect ? existing.timesWrong : existing.timesWrong + 1,
        interval: isCorrect ? Math.min(existing.interval * 2, 30) : 1,
      };
      return { ...prev, [key]: updated };
    });
  };

  // SRS: obtener estructuras cuyo repaso está pendiente (ordenadas por más atrasado primero)
  const getPendingReviews = () => {
    const now = Date.now();
    return Object.entries(srsData)
      .filter(([, entry]) => entry.lastPracticed + entry.interval * 86400000 <= now)
      .map(([key, entry]) => {
        const [tenseId, mode] = key.split('|');
        return { key, tenseId, mode, ...entry };
      })
      .sort((a, b) => (a.lastPracticed + a.interval * 86400000) - (b.lastPracticed + b.interval * 86400000));
  };

  // SRS: generar pregunta tipo fill forzando tenseId y mode específicos
  const generateReviewQuestion = (tenseId, mode) => {
    const tense = tenses.find(t => t.id === tenseId);
    if (!tense) return null;
    const subjects = ['I', 'You', 'He', 'She', 'We', 'They'];
    const verbs = ['work', 'study', 'play', 'eat', 'live', 'travel', 'read', 'write', 'run', 'cook'];
    const complements = ['every day', 'at school', 'at home', 'in the park', 'with friends', 'in the morning', 'on weekends'];
    const subj = subjects[Math.floor(Math.random() * subjects.length)];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const comp = complements[Math.floor(Math.random() * complements.length)];
    const correctAnswer = buildVerbPhrase(subj, v, tenseId, null, mode);
    const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tenseId });
    const uncontracted = correctAnswer
      .replace("doesn't", "does not").replace("don't", "do not").replace("didn't", "did not")
      .replace("can't", "cannot").replace("won't", "will not").replace("wouldn't", "would not")
      .replace("shouldn't", "should not").replace("mustn't", "must not").replace("couldn't", "could not")
      .replace("isn't", "is not").replace("aren't", "are not").replace("wasn't", "was not")
      .replace("weren't", "were not").replace("haven't", "have not").replace("hasn't", "has not")
      .replace("hadn't", "had not");
    const contracted = correctAnswer
      .replace("does not", "doesn't").replace("do not", "don't").replace("did not", "didn't")
      .replace("will not", "won't").replace("would not", "wouldn't").replace("should not", "shouldn't")
      .replace("must not", "mustn't").replace("could not", "couldn't").replace("cannot", "can't")
      .replace("is not", "isn't").replace("are not", "aren't").replace("was not", "wasn't")
      .replace("were not", "weren't").replace("have not", "haven't").replace("has not", "hasn't")
      .replace("had not", "hadn't");
    const acceptedAnswers = [correctAnswer.toLowerCase()];
    if (uncontracted !== correctAnswer) acceptedAnswers.push(uncontracted.toLowerCase());
    if (contracted !== correctAnswer) acceptedAnswers.push(contracted.toLowerCase());
    return { type: 'review', subject: subj, verb: v, complement: comp, tense, mode, correctAnswer, acceptedAnswers, fullSentence };
  };

  // SRS: iniciar modo repaso
  /* `nueva` distingue entrar al repaso desde el menú (ronda desde cero) de
     encadenar el ejercicio siguiente dentro de la ronda en curso, que también
     pasa por aquí. */
  const startReview = (nueva = false) => {
    const pending = getPendingReviews();
    setPracticeType('review');
    if (nueva) { setAnswerStreak(0); setRonda({ hechos: 0, ok: 0, mejor: 0 }); }
    setPracticeAnswer('');
    setPracticeResult(null);
    setIdentifyTenseAnswer('');
    setIdentifyModeAnswer('');
    setShowHint(false);
    const hasPracticed = Object.keys(srsData).length > 0;
    if (pending.length === 0 && hasPracticed) {
      // Hay datos pero ninguno está vencido → genuinamente al día
      setReviewUpToDate(true);
      setPracticeQuestion(null);
    } else if (pending.length === 0 && !hasPracticed) {
      // Sin datos: generar pregunta fill aleatoria del nivel actual para arrancar
      const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
      const available = tenses.filter(t => COURSE_ORDER.indexOf(t.cefr) <= courseIndex);
      const randomTense = available[Math.floor(Math.random() * available.length)];
      setReviewUpToDate(false);
      setPracticeQuestion(generateReviewQuestion(
        randomTense.id,
        ['affirmative', 'negative'][Math.floor(Math.random() * 2)]
      ));
    } else {
      setReviewUpToDate(false);
      setPracticeQuestion(generateReviewQuestion(pending[0].tenseId, pending[0].mode));
    }
  };

  // FASE 2: Verificar respuesta de práctica
  // Gamificación de suite: registra un intento en gh_progress + toasts de logro
  // Cada toast lleva su id y su propio temporizador (3.8s = duración de la
  // animación de ciclo de vida entra→mantiene→sale), así el timing calza aunque
  // se apilen varios.
  const pushBadgeToasts = (keys) => {
    const items = keys.map(k => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, key: k }));
    setBadgeToasts(prev => [...prev, ...items]);
    items.forEach(it => setTimeout(() => setBadgeToasts(prev => prev.filter(x => x.id !== it.id)), 3800));
  };
  const recordGameAttempt = (tenseId, isCorrect) => {
    try {
      const p = loadProgress(window.localStorage);
      recordAttempt(p, { app: 'grammaster', tenseId, correct: !!isCorrect });
      const { newly } = evaluateBadges(p, BADGES, tenseId ? [tenseId] : []);
      saveProgress(window.localStorage, p);
      if (newly.length) pushBadgeToasts(newly);
    } catch (e) {}
  };

  /* Cierre de ronda → progreso compartido. Va en un efecto y no dentro de
     sumaRonda porque ahí estaríamos con un side effect adentro de un updater de
     estado, que React puede ejecutar dos veces. El efecto depende de
     `ronda.hechos`, así que dispara UNA vez, justo cuando llega al total. */
  useEffect(() => {
    if (ronda.hechos !== RONDA) return;
    try {
      const p = loadProgress(window.localStorage);
      recordRound(p, { app: 'grammaster', ok: ronda.ok, total: RONDA });
      const { newly } = evaluateBadges(p, BADGES, []);
      saveProgress(window.localStorage, p);
      if (newly.length) pushBadgeToasts(newly);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ronda.hechos]);

  /* La racha se lee del valor que TENDRÁ tras este acierto: setAnswerStreak es
     asíncrono, así que leer answerStreak aquí daría el de la respuesta anterior. */
  const sumaRonda = (acerto) => setRonda(r => ({
    hechos: r.hechos + 1,
    ok: r.ok + (acerto ? 1 : 0),
    mejor: Math.max(r.mejor, acerto ? answerStreak + 1 : 0),
  }));

  const checkPracticeAnswer = () => {
    if (!practiceQuestion) return;
    recordPracticeDay();
    if (practiceQuestion.type === 'identify') {
      const tenseOk = !practiceQuestion.askTense || identifyTenseAnswer === practiceQuestion.tense.id;
      const modeOk = identifyModeAnswer === practiceQuestion.mode;
      const isCorrect = tenseOk && modeOk;
      recordGameAttempt(practiceQuestion.tense?.id, isCorrect);
      setAnswerStreak(s => isCorrect ? s + 1 : 0);
      sumaRonda(isCorrect);
      setPracticeResult({
        correct: isCorrect,
        tenseOk,
        modeOk,
        correctTense: language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn,
        correctMode: practiceQuestion.mode,
        fullSentence: practiceQuestion.fullSentence,
      });
      return;
    }
    const userAns = practiceAnswer.toLowerCase().trim().replace(/\.$/, '');
    const accepted = practiceQuestion.acceptedAnswers || [practiceQuestion.correctAnswer.toLowerCase()];
    const isCorrect = accepted.some(a => a.replace(/\.$/, '') === userAns);
    updateSRS(practiceQuestion.tense?.id, practiceQuestion.mode, isCorrect);
    recordGameAttempt(practiceQuestion.tense?.id, isCorrect);
    setAnswerStreak(s => isCorrect ? s + 1 : 0);
    sumaRonda(isCorrect);

    let hint = null;
    if (!isCorrect) {
      const tenseId = practiceQuestion.tense?.id;
      const mode = practiceQuestion.mode;
      const subj = practiceQuestion.subject?.toLowerCase();
      const verb = practiceQuestion.verb?.toLowerCase();
      const is3p = ['he', 'she', 'it'].includes(subj);

      const hasAuxBe    = /\b(am|is|are)\b/.test(userAns);
      const hasWaWere   = /\b(was|were)\b/.test(userAns);
      const hasWill     = /\bwill\b/.test(userAns);
      const hasHaveHas  = /\b(have|has)\b/.test(userAns);
      const hasHad      = /\bhad\b/.test(userAns);
      const hasBeen     = /\bbeen\b/.test(userAns);
      const hasWould    = /\bwould\b/.test(userAns);
      const hasIngForm  = /\b\w+ing\b/.test(userAns);
      const hasGoingTo  = /going\s+to/.test(userAns);
      const hasUsedTo   = /used\s+to/.test(userAns);
      const hasNegAux   = /\b(don't|doesn't|didn't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't|mustn't|cannot|can't|not)\b/.test(userAns);
      const isBaseForm  = userAns === verb;

      const h = (es, en) => language === 'es' ? es : en;

      if (tenseId === 'simple-present') {
        if (mode === 'affirmative' && hasAuxBe && hasIngForm)
          hint = h('Para hábitos y rutinas se usa el Present Simple, no el Continuous.',
                   'For habits and routines, use Present Simple, not Continuous.');
        else if (mode === 'affirmative' && is3p && !/\w+(s|es|ies)\b/.test(userAns))
          hint = h('Recuerda agregar -s/-es al verbo con he/she/it en Present Simple.',
                   'Remember to add -s/-es to the verb with he/she/it in Present Simple.');
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: usa don't / doesn't + verbo base. Ejemplo: She doesn't work.",
                   "Negative: use don't / doesn't + base verb. Example: She doesn't work.");
      }

      else if (tenseId === 'present-continuous') {
        if (mode === 'affirmative' && hasIngForm && !hasAuxBe)
          hint = h('Falta el auxiliar be (am/is/are). Estructura: am/is/are + verbo-ing.',
                   'Missing auxiliary be (am/is/are). Structure: am/is/are + verb-ing.');
        else if (mode === 'affirmative' && !hasIngForm)
          hint = h('El Present Continuous necesita verbo-ing. Ejemplo: is working.',
                   'Present Continuous needs verb-ing. Example: is working.');
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: am/is/are + not + verbo-ing. Ejemplo: She isn't working.",
                   "Negative: am/is/are + not + verb-ing. Example: She isn't working.");
      }

      else if (tenseId === 'simple-past') {
        if (isBaseForm)
          hint = h('El Past Simple necesita la forma pasada (-ed para regulares, o forma irregular).',
                   'Past Simple needs the past form (-ed for regular verbs, or the irregular form).');
        else if (/\bdid\b/.test(userAns) && !isBaseForm)
          hint = h("Con 'did' el verbo va en forma base: did + work (no 'did worked').",
                   "With 'did' the verb stays in base form: did + work (not 'did worked').");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: didn't + verbo base. Ejemplo: She didn't work.",
                   "Negative: didn't + base verb. Example: She didn't work.");
      }

      else if (tenseId === 'future-going-to') {
        if (hasWill && !hasGoingTo)
          hint = h("'Going to' expresa planes e intenciones, no uses 'will' aquí. Estructura: am/is/are going to + verbo.",
                   "'Going to' expresses plans and intentions. Structure: am/is/are going to + verb.");
        else if (hasGoingTo && !hasAuxBe)
          hint = h("Falta el auxiliar be antes de 'going to'. Ejemplo: She is going to work.",
                   "Missing auxiliary be before 'going to'. Example: She is going to work.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: am/is/are + not going to + verbo. Ejemplo: She isn't going to work.",
                   "Negative: am/is/are + not going to + verb. Example: She isn't going to work.");
      }

      else if (tenseId === 'present-perfect') {
        if (!hasHaveHas && !hasHad)
          hint = h("El Present Perfect necesita have/has + participio pasado. Ejemplo: She has worked.",
                   "Present Perfect needs have/has + past participle. Example: She has worked.");
        else if (hasHad && !hasHaveHas)
          hint = h("Para Present Perfect usa have/has, no 'had' (eso es Past Perfect). Ejemplo: She has worked.",
                   "For Present Perfect use have/has, not 'had' (that's Past Perfect). Example: She has worked.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: have/has + not + participio. Ejemplo: She hasn't worked.",
                   "Negative: have/has + not + past participle. Example: She hasn't worked.");
      }

      else if (tenseId === 'past-continuous') {
        if (hasIngForm && !hasWaWere)
          hint = h("Falta el auxiliar was/were. Estructura: was/were + verbo-ing.",
                   "Missing was/were. Structure: was/were + verb-ing.");
        else if (!hasIngForm)
          hint = h("El Past Continuous necesita was/were + verbo-ing. Ejemplo: She was working.",
                   "Past Continuous needs was/were + verb-ing. Example: She was working.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: was/were + not + verbo-ing. Ejemplo: She wasn't working.",
                   "Negative: was/were + not + verb-ing. Example: She wasn't working.");
      }

      else if (tenseId === 'simple-future') {
        if (!hasWill && hasGoingTo)
          hint = h("'Will' expresa predicciones y decisiones espontáneas. Estructura: will + verbo base.",
                   "'Will' expresses predictions and spontaneous decisions. Structure: will + base verb.");
        else if (!hasWill)
          hint = h("El Simple Future necesita 'will' + verbo base. Ejemplo: She will work.",
                   "Simple Future needs 'will' + base verb. Example: She will work.");
        else if (hasWill && /will\s+\w+(s|es)\b/.test(userAns))
          hint = h("Después de 'will' el verbo siempre va en forma base, sin -s. Ejemplo: will work (no 'will works').",
                   "After 'will' the verb is always in base form, no -s. Example: will work (not 'will works').");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: won't + verbo base. Ejemplo: She won't work.",
                   "Negative: won't + base verb. Example: She won't work.");
      }

      else if (tenseId === 'past-perfect') {
        if (hasHaveHas && !hasHad)
          hint = h("Para Past Perfect usa 'had' (no have/has). Ambas personas usan 'had'. Ejemplo: She had worked.",
                   "For Past Perfect use 'had' (not have/has). All persons use 'had'. Example: She had worked.");
        else if (!hasHad)
          hint = h("El Past Perfect necesita 'had' + participio pasado. Ejemplo: She had worked.",
                   "Past Perfect needs 'had' + past participle. Example: She had worked.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: had + not + participio. Ejemplo: She hadn't worked.",
                   "Negative: had + not + past participle. Example: She hadn't worked.");
      }

      else if (tenseId === 'used-to') {
        if (/\buse\s+to\b/.test(userAns) && !hasUsedTo)
          hint = h("Es 'used to', no 'use to'. La forma siempre lleva -d. Ejemplo: She used to work.",
                   "It's 'used to', not 'use to'. Always with -d. Example: She used to work.");
        else if (!hasUsedTo)
          hint = h("'Used to' expresa hábitos del pasado. Estructura: used to + verbo base. Ejemplo: She used to work.",
                   "'Used to' expresses past habits. Structure: used to + base verb. Example: She used to work.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: didn't use to + verbo base. Ejemplo: She didn't use to work.",
                   "Negative: didn't use to + base verb. Example: She didn't use to work.");
      }

      else if (tenseId === 'present-perfect-continuous') {
        if (hasAuxBe && hasIngForm && !hasHaveHas)
          hint = h("Eso es Present Continuous. El Presente Perfecto Continuo necesita have/has + been + verbo-ing.",
                   "That's Present Continuous. Present Perfect Continuous needs have/has + been + verb-ing.");
        else if (hasHaveHas && !hasBeen)
          hint = h("Falta 'been'. Estructura completa: have/has + been + verbo-ing. Ejemplo: She has been working.",
                   "Missing 'been'. Full structure: have/has + been + verb-ing. Example: She has been working.");
        else if (!hasHaveHas)
          hint = h("El Presente Perfecto Continuo necesita have/has + been + verbo-ing. Ejemplo: She has been working.",
                   "Present Perfect Continuous needs have/has + been + verb-ing. Example: She has been working.");
      }

      // Fallback: negativo sin auxiliar (para tiempos no cubiertos arriba)
      if (!hint && mode === 'negative' && !hasNegAux)
        hint = h("Las oraciones negativas necesitan un auxiliar negativo (don't, didn't, won't, isn't, hadn't…).",
                 "Negative sentences need a negative auxiliary (don't, didn't, won't, isn't, hadn't…).");
    }

    setPracticeResult({
      correct: isCorrect,
      userAnswer: practiceAnswer,
      correctAnswer: practiceQuestion.correctAnswer,
      fullSentence: practiceQuestion.fullSentence,
      hint,
    });
  };

  // Análisis visual de la oración. El ORDEN de las partes debe coincidir siempre
  // con el texto de buildSentenceText: ambos derivan del mismo motor (conjugation.js).
  const generateSentenceAnalysis = (config) => {
    let { subjectText, verbText, complementText, auxiliary, verbForm, tenseId, mode, modalId, whWordText, adverbText } = config;
    // El sujeto conserva nombres propios ("Maria") y normaliza "i" → "I";
    // el verbo siempre va en minúscula a mitad de oración.
    subjectText = smartCaseSubject(subjectText);
    verbText = verbText.toLowerCase().trim();
    if (complementText) complementText = complementText.trim();
    verbForm = verbForm ? verbForm.toLowerCase() : verbForm;
    const currentTense = tenses.find(t => t.id === tenseId);
    const currentModal = modalId ? modals.find(m => m.id === modalId) : null;
    const parts = [];
    const isInterrogative = mode === 'interrogative';


    const isIrregularVerb = irregularVerbs[verbText.toLowerCase()] !== undefined;
    const verbChangeType = getVerbChangeType(verbForm, verbText, tenseId);

    // Preparar las partes individuales
    const subjectPart = {
      text: isInterrogative ? subjectText : subjectText.charAt(0).toUpperCase() + subjectText.slice(1),
      type: 'subject',
      color: 'blue',
      explanation: language === 'es' ? SENTENCE_PART_EXPLANATIONS.subject.es : SENTENCE_PART_EXPLANATIONS.subject.en,
      original: subjectText,
      changed: false
    };

    // Unidades del auxiliar: "going to" / "used to" / "use to" se explican como bloque
    const auxUnits = [];
    if (auxiliary) {
      const words = auxiliary.split(' ');
      for (let i = 0; i < words.length; i++) {
        const pair = words[i + 1] ? words[i] + ' ' + words[i + 1] : null;
        if (pair && ['going to', 'used to', 'use to'].includes(pair)) {
          auxUnits.push(pair);
          i++;
        } else {
          auxUnits.push(words[i]);
        }
      }
    }
    const makeAuxPart = (aux, capitalize) => {
      const auxExplanation = SENTENCE_PART_EXPLANATIONS.auxiliary[aux.toLowerCase()];
      return {
        text: capitalize ? aux.charAt(0).toUpperCase() + aux.slice(1) : aux,
        type: 'auxiliary',
        color: 'purple',
        explanation: auxExplanation ? (language === 'es' ? auxExplanation.es : auxExplanation.en) : (language === 'es' ? 'Auxiliar verbal' : 'Verbal auxiliary'),
        original: null,
        changed: true,
        isNew: true
      };
    };

    const verbExplanation = SENTENCE_PART_EXPLANATIONS.verbChanges[verbChangeType];
    let verbDetailedExplanation = language === 'es' ? verbExplanation.es : verbExplanation.en;

    if (isIrregularVerb && (verbChangeType === 'irregular' || verbChangeType === 'past')) {
      const irrForms = irregularVerbs[verbText.toLowerCase()];
      verbDetailedExplanation += language === 'es'
        ? ` (${verbText} → ${irrForms.past} → ${irrForms.participle})`
        : ` (${verbText} → ${irrForms.past} → ${irrForms.participle})`;
    }

    const verbPart = {
      text: verbForm,
      type: 'verb',
      color: 'green',
      explanation: verbDetailedExplanation,
      original: verbText,
      changed: verbForm !== verbText,
      transformation: verbForm !== verbText ? `${verbText} → ${verbForm}` : null
    };

    // Detectar si el complemento es un adverbial (tiempo/lugar/modo)
    const ADVERBIAL_STARTERS = ['at ', 'in ', 'on ', 'before ', 'after ', 'since ', 'for ', 'during ', 'by ', 'to ', 'from ', 'near ', 'behind ', 'through ', 'between ', 'under ', 'over ', 'along ', 'across ', 'around ', 'outside ', 'inside ', 'yesterday', 'today', 'tomorrow', 'every ', 'last ', 'next ', 'ago', 'this '];
    const isAdverbialText = (text) => {
      if (!text) return false;
      const lower = text.toLowerCase().trim();
      return ADVERBIAL_STARTERS.some(s => lower.startsWith(s) || lower === s.trim());
    };

    const isIntermediateOrAbove = COURSE_ORDER.indexOf(cefrLevel) >= COURSE_ORDER.indexOf('intermedio1');
    const complementIsAdverbial = isIntermediateOrAbove && isAdverbialText(complementText);
    const complementPart = complementText ? {
      text: complementText,
      type: complementIsAdverbial ? 'adverbial' : 'complement',
      color: complementIsAdverbial ? 'amber' : 'emerald',
      explanation: complementIsAdverbial
        ? (language === 'es' ? 'Adverbial — indica cuándo, dónde o cómo ocurre la acción' : 'Adverbial — indicates when, where, or how the action occurs')
        : (language === 'es' ? 'Complemento — objeto directo o atributo del sujeto' : 'Complement — direct object or subject attribute'),
      original: complementText,
      changed: false
    } : null;

    // Parte del adverbio de frecuencia
    const adverbPart = adverbText ? {
      text: adverbText,
      type: 'adverb',
      color: 'cyan',
      explanation: language === 'es'
        ? 'Adverbio de frecuencia - indica con qué frecuencia ocurre la acción'
        : 'Frequency adverb - indicates how often the action occurs',
      original: adverbText,
      changed: false
    } : null;

    // Para "to be" como verbo principal (sin modal), el be form ya es el verbo — no hay verbPart separado
    const isBeMainVerb = verbText.toLowerCase() === 'be' && !modalId &&
      (tenseId === 'simple-present' || tenseId === 'simple-past');

    const showAdverb = !!adverbPart;

    // Construir partes según el modo
    if (mode === 'subject-question') {
      /* La wh ocupa la casilla del sujeto, así que el orden es el de una
         afirmación y no hay inversión. Se pinta como UNA pieza en el lugar
         donde iría el sujeto: verla ahí es lo que enseña la estructura. */
      const whTxt = whWordText || 'who';
      parts.push({
        text: whTxt.charAt(0).toUpperCase() + whTxt.slice(1),
        type: 'wh-subject',
        color: 'teal',
        explanation: language === 'es'
          ? 'La palabra WH es el SUJETO de la pregunta: por eso no hay auxiliar prestado ni inversión, el orden es el mismo de una afirmación.'
          : 'The WH word is the SUBJECT of the question: that is why there is no borrowed auxiliary and no inversion — the order is the same as a statement.',
        original: whTxt,
        changed: false
      });
      if (showAdverb && auxUnits.length === 0) parts.push(adverbPart);
      auxUnits.forEach(aux => parts.push(makeAuxPart(aux, false)));
      if (showAdverb && auxUnits.length > 0) parts.push(adverbPart);
      if (!isBeMainVerb) parts.push(verbPart);
      if (complementPart) parts.push(complementPart);
      parts.push({
        text: '?', type: 'punctuation', color: 'gray',
        explanation: language === 'es' ? 'Signo de interrogación' : 'Question mark',
        original: '?', changed: false
      });
    } else if (isInterrogative) {
      // Orden interrogativo: [WH] + PRIMER auxiliar + Sujeto + [Adverbio] + resto
      // del auxiliar + Verbo + Complemento + ?  →  "Will she have worked?"
      if (whWordText) {
        parts.push({
          text: whWordText.charAt(0).toUpperCase() + whWordText.slice(1),
          type: 'wh-word',
          color: 'pink',
          explanation: language === 'es'
            ? `Palabra interrogativa WH - indica qué información se busca`
            : `WH question word - indicates what information is being sought`,
          original: whWordText,
          changed: false
        });
      }
      const [firstAux, ...restAux] = auxUnits;
      if (firstAux) parts.push(makeAuxPart(firstAux, !whWordText));
      parts.push(subjectPart);
      if (showAdverb) parts.push(adverbPart);
      restAux.forEach(aux => parts.push(makeAuxPart(aux, false)));
      if (!isBeMainVerb) parts.push(verbPart);
      if (complementPart) parts.push(complementPart);
      parts.push({
        text: '?',
        type: 'punctuation',
        color: 'gray',
        explanation: language === 'es' ? 'Signo de interrogación' : 'Question mark',
        original: '?',
        changed: false
      });
    } else {
      // Orden normal: Sujeto + [Adverbio si no hay auxiliar] + Auxiliar + [Adverbio si hay auxiliar] + Verbo + Complemento + .
      parts.push(subjectPart);
      if (showAdverb && auxUnits.length === 0) {
        // Sin auxiliar: Sujeto + Adverbio + Verbo
        parts.push(adverbPart);
      }
      auxUnits.forEach(aux => parts.push(makeAuxPart(aux, false)));
      if (showAdverb && auxUnits.length > 0) {
        // Con auxiliar: Sujeto + Auxiliar + Adverbio + Verbo
        parts.push(adverbPart);
      }
      if (!isBeMainVerb) parts.push(verbPart);
      if (complementPart) parts.push(complementPart);
      parts.push({
        text: '.',
        type: 'punctuation',
        color: 'gray',
        explanation: language === 'es' ? 'Punto final' : 'Period',
        original: '.',
        changed: false
      });
    }

    // Generar resumen de la estructura
    const tenseName = language === 'es' ? currentTense?.nameEs : currentTense?.nameEn;
    const modeNames = {
      affirmative: language === 'es' ? 'afirmativa' : 'affirmative',
      negative: language === 'es' ? 'negativa' : 'negative',
      interrogative: language === 'es' ? 'interrogativa' : 'interrogative'
    };

    // Determinar la estructura visual
    let structureText;
    if (currentModal) {
      structureText = language === 'es'
        ? `Estructura con modal: Sujeto + ${currentModal.name} + Verbo (forma base)${complementText ? ' + Complemento' : ''}`
        : `Structure with modal: Subject + ${currentModal.name} + Verb (base form)${complementText ? ' + Complement' : ''}`;
    } else {
      structureText = language === 'es'
        ? `Estructura: ${mode === 'interrogative' ? (auxiliary ? auxiliary.split(' ')[0].toUpperCase() : 'Aux') + ' + Sujeto' : 'Sujeto'} + ${auxiliary ? 'Auxiliar + ' : ''}Verbo${complementText ? ' + Complemento' : ''}`
        : `Structure: ${mode === 'interrogative' ? (auxiliary ? auxiliary.split(' ')[0].toUpperCase() : 'Aux') + ' + Subject' : 'Subject'} + ${auxiliary ? 'Auxiliary + ' : ''}Verb${complementText ? ' + Complement' : ''}`;
    }

    // Determinar la regla aplicada
    let ruleText;
    if (currentModal) {
      ruleText = language === 'es'
        ? currentModal.fullDescEs
        : currentModal.fullDescEn;
    } else {
      ruleText = currentTense ? (language === 'es' ? currentTense.descEs : currentTense.descEn) : '';
    }

    const summary = {
      tense: currentModal ? `${currentModal.name} (${language === 'es' ? currentModal.descEs : currentModal.descEn})` : tenseName,
      mode: modeNames[mode],
      structure: structureText,
      rule: ruleText,
      isModal: !!currentModal,
      modalInfo: currentModal ? {
        name: currentModal.name,
        timeContext: currentModal.timeContext,
        desc: language === 'es' ? currentModal.fullDescEs : currentModal.fullDescEn
      } : null
    };

    return { parts, summary };
  };

  const validateWhExtension = (extension) => {
    if (!extension) return '';

    const lowerExt = extension.toLowerCase().trim();
    const words = lowerExt.split(' ').map(w => w.replace(/[,.!?]/g, ''));

    const hasManyWord = words.includes('many');
    const hasMuchWord = words.includes('much');

    if (hasManyWord) {
      const uncountable = words.find(w => uncountableNouns.includes(w));
      if (uncountable) return 'Warning: "' + uncountable + '" is uncountable. Try "How much" instead.';
    }

    if (hasMuchWord) {
      const countable = words.find(w => countableNouns.includes(w));
      if (countable) return 'Warning: "' + countable + '" is countable/plural. Try "How many" instead.';
    }

    return '';
  };

  const checkSemanticCoherence = (complementText, tenseId) => {
    if (!complementText || !tenseId) {
      setSemanticWarning(null);
      return;
    }

    const lowerComp = complementText.toLowerCase();
    const currentTense = tenses.find(t => t.id === tenseId);
    if (!currentTense) return;

    let detectedMarker = null;
    let detectedType = null;

    // Buscar en la estructura anidada
    for (const [type, categories] of Object.entries(timeMarkers)) {
      for (const [category, markers] of Object.entries(categories)) {
        for (const markerObj of markers) {
          if (lowerComp.includes(markerObj.text)) {
            detectedMarker = markerObj.text;
            detectedType = type;
            break;
          }
        }
        if (detectedMarker) break;
      }
      if (detectedMarker) break;
    }

    if (!detectedMarker) {
      setSemanticWarning(null);
      return;
    }

    if (detectedType !== currentTense.timeType) {
      const suggestedTense = tenses.find(t => t.timeType === detectedType && t.id.includes('simple'));
      
      // Recolectar todos los marcadores del timeType actual
      const allCurrentMarkers = [];
      for (const [category, markers] of Object.entries(timeMarkers[currentTense.timeType])) {
        allCurrentMarkers.push(...markers.map(m => m.text));
      }
      
      setSemanticWarning({
        type: 'warning',
        marker: detectedMarker,
        markerType: detectedType,
        currentTense: language === 'es' ? currentTense.nameEs : currentTense.nameEn,
        suggestedTense: suggestedTense ? (language === 'es' ? suggestedTense.nameEs : suggestedTense.nameEn) : null,
        suggestedTenseId: suggestedTense ? suggestedTense.id : null,
        suggestedMarkers: allCurrentMarkers
      });
    } else {
      setSemanticWarning({
        type: 'success',
        marker: detectedMarker,
        currentTense: language === 'es' ? currentTense.nameEs : currentTense.nameEn
      });
    }
  };

  // Los "fixes" solo cambian el estado: la regeneración en vivo se encarga
  // de actualizar la oración mostrada (ver efecto junto a generateSentence)
  const applyTimeMarkerFix = () => {
    if (semanticWarning && semanticWarning.suggestedMarkers && semanticWarning.suggestedMarkers.length > 0) {
      setComplement(semanticWarning.suggestedMarkers[0]);
    }
  };

  const applyTenseFix = () => {
    if (semanticWarning && semanticWarning.suggestedTenseId) {
      setSelectedTense(semanticWarning.suggestedTenseId);
    }
  };

  // NUEVA FUNCIÓN: Aplicar marcador temporal al hacer click
  useEffect(() => {
    const warning = validateWhExtension(whExtension);
    setWhWarning(warning);
    checkSemanticCoherence(complement, selectedTense);
  }, [whExtension, complement, selectedTense, language]);

  useEffect(() => {
    const lowerVerb = verb.toLowerCase();
    setIsIrregular(!!irregularVerbs[lowerVerb]);
  }, [verb]);

  // La parte seleccionada/enfocada de la oración pierde sentido si se regenera
  useEffect(() => {
    setSelectedPartIndex(null);
  }, [sentenceAnalysis]);

  // Validación de entradas en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      if (subject.trim()) {
        setSubjectValidation(validateSubject(subject, language));
      } else {
        setSubjectValidation({ valid: true, warning: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [subject, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (verb.trim()) {
        setVerbValidation(validateVerb(verb, language));
        setVerbBaseSuggestion(detectConjugatedVerbBase(verb));
      } else {
        setVerbValidation({ valid: true, warning: null });
        setVerbBaseSuggestion(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [verb, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (complement.trim()) {
        setComplementValidation(validateComplement(complement, language));
      } else {
        setComplementValidation({ valid: true, warning: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [complement, language]);

  // Verificar ortografía en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpelling(subject, 'subject');
    }, 500);
    return () => clearTimeout(timer);
  }, [subject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpelling(verb, 'verb');
    }, 500);
    return () => clearTimeout(timer);
  }, [verb]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpelling(complement, 'complement');
    }, 500);
    return () => clearTimeout(timer);
  }, [complement]);


  const resetForm = () => {
    setSubject(''); setVerb(''); setComplement('');
    setSelectedTense(''); setSelectedMode('affirmative'); setSelectedModal('');
    setWhWord(''); setWhExtension(''); setWhWarning(''); setSelectedAdverb('');
    setGeneratedSentence(''); setSemanticWarning(null);
    setSentenceAnalysis(null); setShowAnalysisDetails(false);
    setAllModeSentences(null); setShowAllModes(false);
    setSubjectValidation({ valid: true, warning: null });
    setVerbValidation({ valid: true, warning: null });
    setComplementValidation({ valid: true, warning: null });
  };

  // Calcula la oración, las 3 variantes de modo y el análisis visual, y los
  // muestra. Sin efectos sobre historial ni estadísticas — eso solo ocurre al
  // pulsar "Generar". Retorna la oración construida.
  const computeSentenceDisplay = () => {
    const adverb = selectedAdverb || '';
    const fullWhWord = whWord && whExtUsable ? whWord + ' ' + whExtUsable : whWord;
    const params = { subject, verb, complement, tense: selectedTense, modal: selectedModal,
      whWord, whExtension: whExtUsable, adverb };

    const sentence = buildSentenceText({ mode: selectedMode, ...params });
    setGeneratedSentence(sentence);

    /* «Ver los 3 modos» compara afirmativa / negativa / interrogativa de una
       oración con sujeto conocido. La pregunta de sujeto no tiene ese trío: sin
       campo Sujeto saldría « calls you.» y «Does  call you?». */
    setAllModeSentences(esPregSujeto ? null : {
      aff: buildSentenceText({ mode: 'affirmative',   ...params }),
      neg: buildSentenceText({ mode: 'negative',      ...params }),
      int: buildSentenceText({ mode: 'interrogative', ...params }),
    });

    /* El análisis usa el MISMO motor que el texto (auxiliar + forma verbal).
       En la pregunta de sujeto la concordancia sale de la wh, no del campo
       Sujeto, que está vacío: «Who has called?» pero «How many people have
       called?». Y como ese modo no es negativo ni interrogativo, el motor cae
       en la rama afirmativa, que es justo el orden que necesita. */
    const sujetoConcordancia = esPregSujeto ? (fullWhWord || 'who') : subject;
    const { auxiliary, verbForm } = getAuxAndVerbForm(sujetoConcordancia, verb, selectedTense, selectedModal, selectedMode);
    setSentenceAnalysis(generateSentenceAnalysis({
      subjectText: esPregSujeto ? (fullWhWord || 'who') : subject,
      verbText: verb,
      complementText: complement,
      auxiliary,
      verbForm,
      tenseId: selectedTense,
      mode: selectedMode,
      modalId: selectedModal,
      whWordText: fullWhWord,
      adverbText: adverb
    }));
    return sentence;
  };

  // Llevar la vista a la oración generada al pulsar "Generar" (queda escondida en móvil)
  const sentenceRef = useRef(null);

  /* Enter avanza al siguiente campo. Sin esto había que tocar fuera del cuadro
     para salir, y en el verbo era peor: la lista de sugerencias tapa el campo de
     complemento en móvil (los campos se apilan), así que el toque caía sobre una
     sugerencia en vez de sobre el campo. */
  const subjectRef = useRef(null);
  const verbRef = useRef(null);
  const complementRef = useRef(null);
  const advanceOnEnter = (e, nextRef) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    setShowVerbSuggestions(false);
    if (nextRef) nextRef.current?.focus();
    else { e.currentTarget.blur(); generateSentence(); }
  };
  const [genTick, setGenTick] = useState(0);
  useEffect(() => {
    if (!genTick || !sentenceRef.current) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sentenceRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [genTick]);

  const generateSentence = () => {
    // Si hay modal, no se requiere tiempo. Si no hay modal, sí se requiere tiempo.
    // En la pregunta de sujeto no hay campo Sujeto: lo ocupa la wh.
    if ((!subject && !esPregSujeto) || !verb || (!selectedModal && !selectedTense)) {
      showNotification('error', language === 'es' ? 'Por favor completa todos los campos' : 'Please complete all fields');
      return;
    }

    setWhWarning(validateWhExtension(whExtension));
    const sentence = computeSentenceDisplay();
    setGenTick(t => t + 1);   // dispara el scroll a la oración

    // FASE 1: Guardar en historial y actualizar estadísticas
    const newHistoryItem = {
      sentence,
      timestamp: new Date().toISOString(),
      config: {
        subject,
        verb,
        complement,
        tense: tenses.find(t => t.id === selectedTense),
        mode: selectedMode,
        modal: selectedModal,
        level: cefrLevel,
      }
    };

    setSentenceHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Mantener últimas 20
    incrementStats();
    recordPracticeDay();
  };

  // Tiempo real: una vez generada la primera oración, cualquier cambio de
  // tiempo, modo o entradas actualiza la vista al instante (sin tocar historial)
  useEffect(() => {
    if (!generatedSentence) return;
    if ((!subject && !esPregSujeto) || !verb || (!selectedModal && !selectedTense)) return;
    computeSentenceDisplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, verb, complement, selectedTense, selectedMode, selectedModal, whWord, whExtension, selectedAdverb, language]);

  const verbSuggestions = getVerbSuggestions();


  // Cerrar panel activo

  // Avanzar a la siguiente pregunta de práctica (botón "Siguiente" y tecla Enter)
  const nextPractice = () => {
    /* Décimo ejercicio ya corregido: "Siguiente" cierra la ronda en vez de
       generar otro que nadie va a ver. */
    if (ronda.hechos >= RONDA) { setPracticeResult(null); return; }
    if (practiceType === 'review') {
      startReview();
    } else {
      setPracticeQuestion(generatePracticeQuestion(practiceType));
      setPracticeAnswer('');
      setPracticeResult(null);
      setIdentifyTenseAnswer('');
      setIdentifyModeAnswer('');
      setShowHint(false);
    }
  };

  // Con el resultado a la vista, Enter avanza. Sin esto el flujo de teclado se
  // corta: el input queda disabled tras responder y hay que ir al mouse.
  useEffect(() => {
    if (!practiceResult) return;
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      nextPractice();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceResult, practiceType]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f6fb]">
      {badgeToasts.length > 0 && (
        <div className="fixed left-0 right-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
          {badgeToasts.map(({ id, key }) => {
            const ci = key.indexOf(':'); const bid = ci < 0 ? key : key.slice(0, ci); const tid = ci < 0 ? null : key.slice(ci + 1);
            const b = BADGES.find(x => x.id === bid); if (!b) return null;
            let name = language === 'es' ? b.name.es : b.name.en;
            if (tid) { const o = tenses.find(x => x.id === tid); name = name.replace('{tense}', o ? (language === 'es' ? o.nameEs : o.nameEn) : tid); }
            return (
              <div key={id} role="status" className="gtoast-in pointer-events-auto flex items-center gap-2.5 max-w-sm px-3.5 py-2.5 rounded-xl text-red-950 shadow-lg bg-gradient-to-br from-rose-400 to-amber-400">
                <span className="text-2xl leading-none">{b.icon}</span>
                <span className="flex flex-col leading-tight">
                  <b className="text-[0.68rem] uppercase tracking-wide opacity-90 font-extrabold">{language === 'es' ? '¡Logro!' : 'Achievement!'}</b>
                  <span className="text-sm font-semibold">{name}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* Notificación */}
      {notification && (
        <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Sección activa — vista inline (modelo de pestañas), no overlay */}
      {activePanel && (
        <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-8 pb-24 sm:pb-6" style={{ order: 1 }}>
          <div className="max-w-2xl mx-auto">
            {/* Salir de la sección al constructor. Antes solo se podía por la
                barra de abajo, así que el único «atrás» a la vista era el del
                Hub —arriba a la izquierda, donde uno mira— y se llevaba los
                clics que iban dirigidos aquí. Nombra el destino, igual que el
                del Hub nombra el suyo. */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setActivePanel(null)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0"
              >
                ← {t.builderShort}
              </button>
              <h2 className="font-bold text-xl text-gray-800">
                {activePanel === 'history' && t.history}
                {activePanel === 'practice' && t.practiceMode}
                {activePanel === 'guide' && t.timeGuideTitle}
                {activePanel === 'settings' && t.themes}
                {activePanel === 'progress' && t.progressTitle}
              </h2>
            </div>

            <div>
              {/* Panel de Historial */}
              {activePanel === 'history' && (
                <div className="space-y-3">
                  {sentenceHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{t.noHistory}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button onClick={exportHistory} className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center justify-center gap-2">
                          <BookOpen className="w-4 h-4" /> {language === 'es' ? 'Exportar' : 'Export'}
                        </button>
                        <button
                          onClick={clearHistory}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                            confirmClear
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {confirmClear
                            ? (language === 'es' ? '¿Seguro? Toca de nuevo' : 'Sure? Tap again')
                            : t.clearHistory}
                        </button>
                      </div>
                      {sentenceHistory.map((item, index) => {
                        const tenseName = language === 'es' ? item.config.tense?.nameEs : item.config.tense?.nameEn;
                        const modeLabels = { affirmative: language === 'es' ? 'Afirmativa' : 'Affirmative', negative: language === 'es' ? 'Negativa' : 'Negative', interrogative: language === 'es' ? 'Interrogativa' : 'Interrogative' };
                        return (
                          <div key={index} className="bg-gray-50 p-4 rounded-xl border">
                            <p className="font-medium text-gray-800 mb-2">{item.sentence}</p>
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {tenseName && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{tenseName}</span>}
                              {item.config.modal && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">{item.config.modal}</span>}
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{modeLabels[item.config.mode] || item.config.mode}</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full ml-auto">{formatTimestamp(item.timestamp)}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => copyToClipboard(item.sentence)} className="p-2 hover:bg-indigo-100 rounded-lg"><Copy className="w-4 h-4 text-indigo-600" /></button>
                              <button onClick={() => deleteFromHistory(index)} className="p-2 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Panel de Práctica */}
              {activePanel === 'practice' && (
                <div className="space-y-4">
                  {!practiceQuestion ? (
                    <div className="space-y-3">
                      {reviewUpToDate ? (
                        <div className="text-center py-10">
                          <p className="text-4xl mb-3">✅</p>
                          <p className="font-semibold text-gray-700">{language === 'es' ? '¡Estás al día!' : "You're up to date!"}</p>
                          <p className="text-sm text-gray-400 mt-1">{language === 'es' ? 'Vuelve mañana para seguir repasando.' : 'Come back tomorrow to keep reviewing.'}</p>
                          <button onClick={() => setReviewUpToDate(false)} className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                            {language === 'es' ? 'Volver al menú' : 'Back to menu'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 text-sm mb-4">{t.practiceSubtitle}</p>
                          {/* Botón Modo Repaso */}
                          {(() => {
                            const pendingCount = getPendingReviews().length;
                            return (
                              <button onClick={() => startReview(true)} className="w-full p-4 bg-gray-50 hover:bg-amber-50 rounded-xl border-2 border-transparent hover:border-amber-200 text-left transition-all relative">
                                <span className="text-2xl mr-3">🔄</span>
                                <span className="font-semibold">{language === 'es' ? 'Modo Repaso' : 'Review Mode'}</span>
                                <p className="text-xs text-gray-500 mt-1 ml-9">{language === 'es' ? 'Repasa estructuras según repetición espaciada' : 'Review structures using spaced repetition'}</p>
                                {pendingCount > 0 && (
                                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                          {[
                            { type: 'fill', icon: '📝', title: t.fillInBlank, desc: language === 'es' ? 'Completa la oración' : 'Complete the sentence' },
                            { type: 'correct', icon: '✏️', title: t.correctError, desc: language === 'es' ? 'Corrige el error' : 'Correct the error' },
                            { type: 'identify', icon: '🔍', title: language === 'es' ? 'Identificar estructura' : 'Identify structure', desc: language === 'es' ? 'Reconoce el tiempo/estructura verbal y el modo' : 'Recognize the tense/structure and mode' },
                          ].map(p => (
                            <button key={p.type} onClick={() => startPractice(p.type)} className="w-full p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl border-2 border-transparent hover:border-indigo-200 text-left transition-all">
                              <span className="text-2xl mr-3">{p.icon}</span>
                              <span className="font-semibold">{p.title}</span>
                              <p className="text-xs text-gray-500 mt-1 ml-9">{p.desc}</p>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    rondaTerminada ? (
                      /* Cierre de ronda: mismo formato que Question Lab, para que
                         practicar en una app y en otra se sienta igual. */
                      <div className="text-center py-8 px-4">
                        <p className="text-5xl font-extrabold text-indigo-600 leading-none">{ronda.ok} / {RONDA}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {language === 'es' ? 'Ronda terminada' : 'Round complete'}
                        </p>
                        {ronda.mejor > 1 && (
                          <p className="text-sm mt-3">🔥 {language === 'es' ? 'Mejor racha' : 'Best streak'}: {ronda.mejor}</p>
                        )}
                        {ronda.ok === RONDA && (
                          <p className="text-sm mt-1">⭐ {language === 'es' ? '¡Ronda perfecta!' : 'Perfect round!'}</p>
                        )}
                        <div className="flex gap-2 justify-center mt-6 flex-wrap">
                          <button
                            onClick={() => practiceType === 'review' ? startReview(true) : startPractice(practiceType)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                          >
                            {language === 'es' ? 'Otra ronda' : 'Another round'}
                          </button>
                          {/* El menú es lo que se ve cuando no hay pregunta, así que
                              volver es soltar la pregunta; con solo apagar
                              practiceMode el alumno quedaba en el mismo ejercicio. */}
                          <button
                            onClick={() => {
                              setPracticeMode(false);
                              setPracticeQuestion(null);
                              setPracticeResult(null);
                              setRonda({ hechos: 0, ok: 0, mejor: 0 });
                            }}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold"
                          >
                            {language === 'es' ? 'Volver' : 'Back'}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-4">
                      {/* Avance de la ronda: barra fina + cuenta. Sin una meta a la
                          vista la sesión no terminaba nunca y el alumno no sabía
                          cuánto le faltaba para poder parar. */}
                      <div>
                        <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300 motion-reduce:transition-none"
                            style={{ width: `${ronda.hechos / RONDA * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-semibold text-gray-500">
                            {language === 'es' ? 'Ejercicio' : 'Exercise'} {rondaEnPantalla} {language === 'es' ? 'de' : 'of'} {RONDA}
                          </span>
                          {answerStreak > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-red-950 bg-gradient-to-br from-rose-400 to-amber-400 shadow-sm shadow-rose-400/30">
                              🔥 {language === 'es' ? 'Racha' : 'Streak'}: {answerStreak}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Tarjeta de pregunta */}
                      {/* Colores por actividad, del sistema de la suite:
                          completar=índigo · corregir=coral · identificar=teal · repaso=ámbar */}
                      <div className={`p-4 rounded-xl border ${practiceQuestion.type === 'identify' ? 'bg-teal-50 border-teal-200' : practiceQuestion.type === 'correct' ? 'bg-rose-50 border-rose-200' : practiceQuestion.type === 'review' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'}`}>
                        {(practiceQuestion.type === 'fill' || practiceQuestion.type === 'review') && (
                          <>
                            <p className={`text-xs font-medium mb-2 uppercase tracking-wide ${practiceQuestion.type === 'review' ? 'text-amber-600' : 'text-indigo-500'}`}>
                              {practiceQuestion.type === 'review'
                                ? (language === 'es' ? '🔄 Repaso espaciado' : '🔄 Spaced review')
                                : (language === 'es' ? 'Completa el verbo' : 'Fill in the verb')}
                            </p>
                            <p className="text-lg font-medium mb-1">
                              <span className="text-gray-800">{practiceQuestion.subject}</span>
                              <span className="mx-2 px-3 py-0.5 bg-white border-2 border-indigo-400 rounded text-indigo-600 font-bold">____</span>
                              <span className="text-indigo-400 text-sm font-normal">({practiceQuestion.verb})</span>
                              <span className="text-gray-800 ml-1">{practiceQuestion.complement}.</span>
                            </p>
                            <div className="flex gap-2 text-xs mt-1">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn}</span>
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{practiceQuestion.mode === 'affirmative' ? (language === 'es' ? 'Afirmativa' : 'Affirmative') : (language === 'es' ? 'Negativa' : 'Negative')}</span>
                            </div>
                            <input
                              type="text" value={practiceAnswer} onChange={(e) => setPracticeAnswer(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !practiceResult && checkPracticeAnswer()}
                              placeholder={language === 'es' ? 'Escribe la frase verbal...' : 'Type the verb phrase...'}
                              /* sin `focus:outline-none`: solo cambiaba el tono del borde, que es
                                 un indicador demasiado débil. Deja pasar el anillo de dua.generated.css. */
                              className={`w-full mt-3 px-4 py-2 border-2 rounded-lg ${practiceQuestion.type === 'review' ? 'border-amber-300 focus:border-amber-500' : 'border-indigo-300 focus:border-indigo-500'}`}
                              disabled={!!practiceResult}
                            />
                          </>
                        )}
                        {practiceQuestion.type === 'correct' && (
                          <>
                            <p className="text-xs text-rose-500 font-medium mb-2 uppercase tracking-wide">{language === 'es' ? 'Corrige el error' : 'Correct the error'}</p>
                            <p className="text-lg font-medium mb-1">
                              {showHint && practiceQuestion.wrongPart
                                ? practiceQuestion.wrongSentence.split(practiceQuestion.wrongPart).map((part, i, arr) => (
                                    <span key={i}>
                                      {part}
                                      {i < arr.length - 1 && (
                                        <span className="line-through decoration-red-400 decoration-2 text-red-400">{practiceQuestion.wrongPart}</span>
                                      )}
                                    </span>
                                  ))
                                : practiceQuestion.wrongSentence
                              }
                            </p>
                            <div className="flex items-center gap-2 text-xs mt-1 mb-3">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn}</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{practiceQuestion.mode === 'affirmative' ? (language === 'es' ? 'Afirmativa' : 'Affirmative') : practiceQuestion.mode === 'negative' ? (language === 'es' ? 'Negativa' : 'Negative') : (language === 'es' ? 'Interrogativa' : 'Interrogative')}</span>
                              {!practiceResult && (
                                <button onClick={() => setShowHint(h => !h)} className="ml-auto px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors">
                                  {showHint ? (language === 'es' ? 'Ocultar pista' : 'Hide hint') : (language === 'es' ? 'Pista' : 'Hint')}
                                </button>
                              )}
                            </div>
                            <input
                              type="text" value={practiceAnswer} onChange={(e) => setPracticeAnswer(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !practiceResult && checkPracticeAnswer()}
                              placeholder={language === 'es' ? 'Escribe la parte correcta...' : 'Write the correct part...'}
                              className="w-full px-4 py-2 border-2 border-rose-300 rounded-lg focus:border-rose-500"
                              disabled={!!practiceResult}
                            />
                          </>
                        )}
                        {practiceQuestion.type === 'identify' && (
                          <>
                            <p className="text-xs text-teal-600 font-medium mb-2 uppercase tracking-wide">
                              {practiceQuestion.askTense
                                ? (language === 'es' ? '¿Qué tiempo/estructura verbal y modo es?' : 'What tense/structure and mode is this?')
                                : (language === 'es' ? '¿Qué modo tiene esta oración?' : 'What mode is this sentence?')}
                            </p>
                            <p className="text-xl font-semibold text-gray-800 mb-4 font-['Atkinson_Hyperlegible']">"{practiceQuestion.fullSentence}"</p>
                            {/* Opciones de tiempo (solo si hay suficientes tiempos disponibles) */}
                            {practiceQuestion.askTense && (
                              <>
                                <p className="text-xs font-medium text-gray-500 mb-2">{language === 'es' ? 'Tiempo/Estructura verbal:' : 'Tense/Structure:'}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {practiceQuestion.tenseOptions.map(opt => (
                                    <button
                                      key={opt.id}
                                      onClick={() => !practiceResult && setIdentifyTenseAnswer(opt.id)}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                        practiceResult
                                          ? opt.id === practiceQuestion.tense.id
                                            ? 'bg-green-100 border-green-400 text-green-700'
                                            : identifyTenseAnswer === opt.id && !practiceResult?.tenseOk
                                              ? 'bg-red-100 border-red-300 text-red-600'
                                              : 'bg-gray-100 border-gray-200 text-gray-400'
                                          : identifyTenseAnswer === opt.id
                                            ? 'bg-teal-100 border-teal-400 text-teal-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'
                                      }`}
                                    >
                                      {/* refuerzo no cromático del resultado (DUA) */}
                                      {practiceResult && opt.id === practiceQuestion.tense.id && <span aria-hidden="true">✓ </span>}
                                      {practiceResult && identifyTenseAnswer === opt.id && opt.id !== practiceQuestion.tense.id && <span aria-hidden="true">✗ </span>}
                                      {language === 'es' ? opt.nameEs : opt.nameEn}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            {/* Opciones de modo (siempre) */}
                            <p className="text-xs font-medium text-gray-500 mb-2">{language === 'es' ? 'Modo:' : 'Mode:'}</p>
                            <div className="flex gap-2">
                              {[
                                { id: 'affirmative',   label: language === 'es' ? 'Afirmativa'   : 'Affirmative' },
                                { id: 'negative',      label: language === 'es' ? 'Negativa'      : 'Negative' },
                                { id: 'interrogative', label: language === 'es' ? 'Interrogativa' : 'Interrogative' },
                              ].map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => !practiceResult && setIdentifyModeAnswer(m.id)}
                                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                    practiceResult
                                      ? m.id === practiceQuestion.mode
                                        ? 'bg-green-100 border-green-400 text-green-700'
                                        : identifyModeAnswer === m.id && !practiceResult?.modeOk
                                          ? 'bg-red-100 border-red-300 text-red-600'
                                          : 'bg-gray-100 border-gray-200 text-gray-400'
                                      : identifyModeAnswer === m.id
                                        ? 'bg-teal-100 border-teal-400 text-teal-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300'
                                  }`}
                                >
                                  {practiceResult && m.id === practiceQuestion.mode && <span aria-hidden="true">✓ </span>}
                                  {practiceResult && identifyModeAnswer === m.id && m.id !== practiceQuestion.mode && <span aria-hidden="true">✗ </span>}
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Resultado */}
                      {practiceResult && (
                        <div className={`p-4 rounded-xl ${practiceResult.correct ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
                          <p className={`font-bold ${practiceResult.correct ? 'text-green-700' : 'text-red-700'}`}>{practiceResult.correct ? t.correct : t.incorrect}</p>
                          {practiceQuestion.type === 'identify' ? (
                            <div className="text-sm mt-1 space-y-0.5">
                              {!practiceResult.tenseOk && <p className="text-red-600">{language === 'es' ? 'Tiempo correcto:' : 'Correct tense:'} <span className="font-semibold">{practiceResult.correctTense}</span></p>}
                              {practiceQuestion.askMode && !practiceResult.modeOk && <p className="text-red-600">{language === 'es' ? 'Modo correcto:' : 'Correct mode:'} <span className="font-semibold">{practiceResult.correctMode}</span></p>}
                            </div>
                          ) : (
                            <>
                              {!practiceResult.correct && <p className="text-sm text-red-600 mt-1">{t.theCorrectAnswer}: <span className="font-semibold">{practiceResult.correctAnswer}</span></p>}
                              {practiceResult.hint && (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                                  💡 {practiceResult.hint}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 mt-2">{language === 'es' ? 'Oración completa:' : 'Full sentence:'} <span className="font-medium text-gray-800">{practiceResult.fullSentence}</span></p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Botones acción */}
                      <div className="flex gap-2">
                        {!practiceResult ? (
                          <button
                            onClick={checkPracticeAnswer}
                            disabled={practiceQuestion.type === 'identify' && ((practiceQuestion.askTense && !identifyTenseAnswer) || !identifyModeAnswer)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >{t.checkAnswer}</button>
                        ) : (
                          <button onClick={nextPractice} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
                            {t.nextQuestion} <span className="opacity-60 font-normal hidden sm:inline">(Enter)</span>
                          </button>
                        )}
                        <button onClick={() => { setPracticeQuestion(null); setPracticeAnswer(''); setPracticeResult(null); setIdentifyTenseAnswer(''); setIdentifyModeAnswer(''); setReviewUpToDate(false); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium">{t.exitPractice}</button>
                      </div>
                    </div>
                    )
                  )}
                </div>
              )}

              {/* Panel de Guía de uso */}
              {activePanel === 'guide' && <UsageGuide language={language} />}

              {/* Panel de Progreso */}
              {activePanel === 'progress' && (() => {
                const streak = computeStreak(practiceDays);
                const tenseStats = computeTenseStats();
                const hasData = totalAllTime > 0;
                // Racha de TODA la suite (gh_progress, cualquier app cuenta) —
                // puede diferir de la local y confundir si no se distingue.
                let suiteStreak = 0;
                try { suiteStreak = loadProgress(window.localStorage)?.dayStreak?.count || 0; } catch { /* sin datos */ }

                // Últimos 30 días para el calendario
                const last30 = Array.from({ length: 30 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (29 - i));
                  return d.toISOString().split('T')[0];
                });
                const daySet = new Set(practiceDays);

                // Tenses con datos + tenses disponibles hasta nivel actual
                const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
                const unlockedTenses = tenses.filter(t => COURSE_ORDER.indexOf(t.cefr) <= courseIndex);
                const sortedTenses = [...unlockedTenses].sort((a, b) => (tenseStats[b.id] || 0) - (tenseStats[a.id] || 0));
                const maxCount = Math.max(...sortedTenses.map(t => tenseStats[t.id] || 0), 1);

                // Tiempo verbal más usado
                const topEntry = Object.entries(tenseStats).sort((a, b) => b[1] - a[1])[0];
                const topTense = topEntry ? tenses.find(t => t.id === topEntry[0]) : null;

                return (
                  <div className="space-y-5">
                    {!hasData ? (
                      <div className="text-center py-12 text-gray-400">
                        <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">{t.noDataYet}</p>
                      </div>
                    ) : (
                      <>
                        {/* 1. RACHA */}
                        <div className={`rounded-xl p-4 flex items-center gap-4 ${streak > 0 ? 'bg-gradient-to-br from-rose-400 to-amber-400 shadow-lg shadow-rose-400/30' : 'bg-gray-50 border border-gray-200'}`}>
                          <span className="text-4xl">{streak > 0 ? '🔥' : '💤'}</span>
                          <div>
                            {streak > 0 ? (
                              <>
                                <p className="text-2xl font-bold text-red-950">{streak} {streak === 1 ? t.dayStreakSingle : t.dayStreak}</p>
                                <p className="text-xs text-red-950/85">{language === 'es' ? 'Practicando en Grammaster' : 'Practicing in Grammaster'}</p>
                                {suiteStreak !== streak && suiteStreak > 0 && (
                                  <p className="text-xs text-white/75 mt-0.5">🧩 {language === 'es' ? `Toda la suite: ${suiteStreak} días` : `Whole suite: ${suiteStreak} days`}</p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-bold text-gray-500">0 {t.dayStreak}</p>
                                <p className="text-xs text-gray-400">{t.noStreakYet}</p>
                                {suiteStreak > 0 && (
                                  <p className="text-xs text-gray-400 mt-0.5">🧩 {language === 'es' ? `Toda la suite: ${suiteStreak} días` : `Whole suite: ${suiteStreak} days`}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* 2. CALENDARIO */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700">{t.practiceCalendar}</p>
                            <p className="text-xs text-gray-400">{t.last30Days}</p>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {last30.map(day => (
                              <div
                                key={day}
                                title={day}
                                className={`aspect-square rounded-sm ${daySet.has(day) ? 'bg-indigo-500' : 'bg-gray-100'}`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
                            <span className="text-xs text-gray-400">{language === 'es' ? 'Sin práctica' : 'No practice'}</span>
                            <div className="w-3 h-3 rounded-sm bg-indigo-500 ml-2" />
                            <span className="text-xs text-gray-400">{language === 'es' ? 'Practicó' : 'Practiced'}</span>
                          </div>
                        </div>

                        {/* 3. TIEMPOS VERBALES */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">{t.tenseProgress}</p>
                          <div className="space-y-2.5">
                            {sortedTenses.map(tenseItem => {
                              const count = tenseStats[tenseItem.id] || 0;
                              const pct = Math.round((count / maxCount) * 100);
                              const status = count >= 10 ? 'dominated' : count >= 3 ? 'practicing' : 'unexplored';
                              const statusColors = {
                                dominated: 'bg-emerald-100 text-emerald-700',
                                practicing: 'bg-blue-100 text-blue-700',
                                unexplored: 'bg-gray-100 text-gray-400',
                              };
                              const barColors = {
                                dominated: 'bg-emerald-500',
                                practicing: 'bg-blue-400',
                                unexplored: 'bg-gray-200',
                              };
                              return (
                                <div key={tenseItem.id}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-700 truncate max-w-[55%]">
                                      {language === 'es' ? tenseItem.nameEs : tenseItem.nameEn}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">{count}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>
                                        {t[status]}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${barColors[status]}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. ESTADÍSTICAS GENERALES */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">{t.generalStats}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-indigo-600">{totalAllTime}</p>
                              <p className="text-xs text-indigo-500 mt-0.5">{t.totalAllTime}</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-blue-600">{sessionStats.today}</p>
                              <p className="text-xs text-blue-500 mt-0.5">{t.todayCount}</p>
                            </div>
                          </div>
                          {topTense && (
                            <div className="mt-3 bg-gray-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">{t.mostUsedTense}</p>
                              <p className="font-semibold text-gray-800">
                                {language === 'es' ? topTense.nameEs : topTense.nameEn}
                                <span className="text-xs font-normal text-gray-400 ml-2">({topEntry[1]} {t.sentences})</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Header full-width */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/GramMaster/logo.svg" alt="Grammaster" className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[22%]" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{language === 'es' ? 'Los tiempos en la palma de tu mano.' : 'English tenses at your fingertips.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!fromHub && <>
              {/* NIVEL selector */}
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value)}
                className="px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-medium text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                title={language === 'es' ? 'Nivel' : 'Level'}
              >
                <option value="basico1">{language === 'es' ? 'Bás. I' : 'Bas. I'}</option>
                <option value="basico2">{language === 'es' ? 'Bás. II' : 'Bas. II'}</option>
                <option value="elemental1">{language === 'es' ? 'Elem. I' : 'Elem. I'}</option>
                <option value="elemental2">{language === 'es' ? 'Elem. II' : 'Elem. II'}</option>
                <option value="intermedio1">{language === 'es' ? 'Inter. I' : 'Int. I'}</option>
                <option value="intermedio2">{language === 'es' ? 'Inter. II' : 'Int. II'}</option>
                <option value="avanzado">{language === 'es' ? 'Inter. Alto' : 'Upper'}</option>
              </select>

              {/* IDIOMA toggle */}
              <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                <button onClick={() => setLanguage('es')} aria-pressed={language === 'es'} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${language === 'es' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="Español">ES</button>
                <button onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="English">EN</button>
              </div>
            </>}

            {/* Toggle de tema de la suite — siempre visible */}
            <ThemeToggle lang={language} />

          </div>
        </header>

        {/* Constructor (modo por defecto) — solo cuando no hay sección activa */}
        {!activePanel && (
        <main className="flex-1 overflow-y-auto py-4 px-4 sm:px-8 pb-24 sm:pb-6">
        <div className="max-w-5xl mx-auto space-y-4">

        {/* Formulario Principal */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* TIEMPO VERBAL */}
          <div className="pb-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">

              <label className={`text-xs font-semibold tracking-wide uppercase shrink-0 ${!selectedTense && !selectedModal ? 'text-indigo-600' : 'text-gray-500'}`}>
                {language === 'es' ? 'Tiempo o modal' : 'Tense or modal'} <span className="text-red-500">*</span>
              </label>
              {/* Tiempo y modal son excluyentes: elegir uno limpia el otro. */}
              <TensePicker
                value={selectedTense}
                modalValue={selectedModal}
                onSelectTense={(id) => { setSelectedTense(id); setSelectedModal(''); }}
                onSelectModal={(id) => { setSelectedModal(id); setSelectedTense(''); }}
                language={language}
                cefrLevel={cefrLevel}
                highlight={!selectedTense && !selectedModal}
              />

              <div className="hidden sm:block w-px h-5 bg-gray-200 shrink-0" />

              <div className="flex w-full sm:w-auto sm:ml-auto items-center gap-2">
                <div className="flex flex-1 sm:flex-none rounded-lg border border-gray-200 overflow-hidden shrink-0">
                  {modosVisibles.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      aria-pressed={selectedMode === mode.id}
                      title={mode.id === 'subject-question' ? t.subjectQuestionHelp : undefined}
                      className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all border-r last:border-r-0 border-gray-200 ${
                        selectedMode === mode.id ? mode.activeClasses : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {mode.id === 'affirmative' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        : mode.id === 'negative' ? <XCircle className="w-3.5 h-3.5 shrink-0" />
                        : mode.id === 'subject-question' ? <UserCircle className="w-3.5 h-3.5 shrink-0" />
                        : <HelpCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span className="hidden sm:inline">
                        {mode.id === 'affirmative' ? t.affirmative : mode.id === 'negative' ? t.negative
                          : mode.id === 'subject-question' ? t.subjectQuestion : t.interrogative}
                      </span>
                      <span className="sm:hidden">
                        {mode.id === 'affirmative' ? (language === 'es' ? 'Afirm.' : 'Affirm.')
                          : mode.id === 'negative' ? (language === 'es' ? 'Neg.' : 'Neg.')
                          : mode.id === 'subject-question' ? t.subjectQuestionShort
                          : (language === 'es' ? 'Inter.' : 'Inter.')}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={resetForm}
                  title={language === 'es' ? 'Limpiar todo' : 'Clear all'}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {selectedTense && !selectedModal && (() => {
              const tenseData = tenses.find(t => t.id === selectedTense);
              const formula = TENSE_FORMULAS[selectedTense];
              if (!tenseData || !formula) return null;
              const modeKey = selectedMode === 'affirmative' ? 'aff' : selectedMode === 'negative' ? 'neg' : 'int';
              return (
                <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-mono font-semibold text-indigo-700 text-xs tracking-wide">{formula[modeKey]}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{language === 'es' ? tenseData.descEs : tenseData.descEn}</div>
                      <div className="text-gray-400 text-xs italic mt-0.5">{language === 'es' ? 'Ej.: ' : 'Ex.: '}{tenseData.example}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* WH Questions */}
          {(selectedMode === 'interrogative' || esPregSujeto) && (
            <div className="space-y-2">
              {/* En la pregunta de sujeto la wh no es opcional: es el sujeto. */}
              {esPregSujeto && (
                <p className="text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5">
                  {t.subjectQuestionHelp}
                </p>
              )}
              {/* Fila de chips base */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-6">WH</span>
                {whDisponibles.map(wh => {
                  const pide = whAsks[wh.id];
                  const elegida = whWord === wh.id;
                  return (
                    <button
                      key={wh.id}
                      type="button"
                      aria-pressed={elegida}
                      // En escritorio el dato aparece al pasar el mouse; en
                      // móvil, al elegir la wh (la línea de abajo).
                      title={pide ? `${wh.name} → ${language === 'es' ? pide.es : pide.en}` : undefined}
                      // En la pregunta de sujeto no se puede quedar sin wh: es el sujeto.
                      onClick={() => { if (!(elegida && esPregSujeto)) { setWhWord(elegida ? '' : wh.id); setWhExtension(''); } }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        elegida
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-700'
                      }`}
                    >
                      {wh.name}
                    </button>
                  );
                })}
              </div>
              {/* Qué dato pide la wh elegida. La compuesta manda sobre la base:
                  «how many» pide una cantidad, no «una manera». */}
              {whWord && (() => {
                const nombre = whWords.find(w => w.id === whWord)?.name || whWord;
                const clave = `${whWord} ${whExtension.trim()}`.trim().toLowerCase().replace(/\s+of$/, '');
                const pide = whAsks[clave] || whAsks[whWord];
                if (!pide) return null;
                return (
                  <p className="pl-8 text-xs text-gray-500">
                    <span className="font-semibold text-teal-700">{nombre}{whExtension.trim() ? ' ' + whExtension.trim() : ''}</span>
                    {' '}{language === 'es' ? 'pide' : 'asks for'}{' '}
                    <span className="font-medium text-gray-700">{language === 'es' ? pide.es : pide.en}</span>
                  </p>
                );
              })()}
              {/* Extensión: solo para WH compuestas (What, Which, How) */}
              {whWord && whSuggestions[whWord] && (
                <div className="flex flex-wrap items-center gap-1.5 pl-8">
                  {whSuggestions[whWord].map(ext => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => setWhExtension(whExtension === ext ? '' : ext)}
                      className={`px-2.5 py-0.5 rounded-full text-xs border transition-all ${
                        whExtension === ext
                          ? 'bg-teal-100 text-teal-800 border-teal-400 font-medium'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'
                      }`}
                    >
                      {whWords.find(w => w.id === whWord)?.name} {ext}
                      {/\bof$/i.test(ext) && <span className="opacity-50"> …</span>}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={whExtension}
                    onChange={(e) => setWhExtension(e.target.value)}
                    placeholder={language === 'es' ? 'o escribe otra…' : 'or type another…'}
                    className="flex-1 min-w-32 px-3 py-1 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 placeholder-gray-400"
                  />
                </div>
              )}
              {/* Extensión a medias: se explica en vez de armar inglés roto */}
              {whWord && whExtIncompleta && (
                <p className="pl-8 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  {language === 'es'
                    ? <>«<b>{whWords.find(w => w.id === whWord)?.name} {whExtension.trim()}</b>» necesita un sustantivo detrás: <b>{whWords.find(w => w.id === whWord)?.name} {whExtension.trim()} music…</b> Escríbelo arriba; mientras tanto la oración se arma sin la extensión.</>
                    : <>“<b>{whWords.find(w => w.id === whWord)?.name} {whExtension.trim()}</b>” needs a noun after it: <b>{whWords.find(w => w.id === whWord)?.name} {whExtension.trim()} music…</b> Type it above; meanwhile the sentence is built without the extension.</>}
                </p>
              )}
            </div>
          )}

          {/* Campos principales */}
          <div className={`grid grid-cols-1 gap-4 ${(selectedTense === 'simple-present' || selectedTense === 'simple-past') && !selectedModal ? 'md:grid-cols-[2fr_1.5fr_2fr_2.5fr]' : 'md:grid-cols-[2fr_2fr_3fr]'}`}>
            {/* Sujeto — en la pregunta de sujeto lo ocupa la wh, así que el
                campo se apaga en vez de desaparecer: que se vea QUÉ casilla
                está llenando la wh-word es justamente la lección. */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${esPregSujeto ? 'bg-teal-100 text-teal-700' : 'bg-indigo-100 text-indigo-600'}`}>S</span>
                <span className={`text-sm font-medium ${esPregSujeto ? 'text-teal-700' : 'text-indigo-600'}`}>{t.subject}</span>
                {!esPregSujeto && <span className="text-red-500 text-xs">*</span>}
              </label>
              {esPregSujeto ? (
                <div className="w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 border-teal-300 border-l-teal-400 bg-teal-50 text-teal-800 text-sm flex items-center gap-2">
                  <UserCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{whWords.find(w => w.id === whWord)?.name || 'Who'}{whExtUsable ? ' ' + whExtUsable : ''}</span>
                  <span className="text-teal-700 text-xs">· {t.subjectNotNeeded}</span>
                </div>
              ) : (
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => advanceOnEnter(e, verbRef)}
                /* El teclado móvil capitaliza la primera letra de cada campo y
                   eso llega a la oración final. Se apaga aquí (el alumno decide
                   cuándo va mayúscula) y smartCase lo corrige al generar. */
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="I, you, he, she, we..."
                className={`w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  !subjectValidation.valid ? 'border-red-400 bg-red-50' :
                  subjectValidation.warning ? 'border-amber-400 bg-amber-50 border-l-amber-400' :
                  'border-gray-300 border-l-indigo-400 focus:border-indigo-500'
                }`}
              />
              )}
              {!esPregSujeto && !subjectValidation.valid && subjectValidation.warning && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {subjectValidation.warning}
                </p>
              )}
              {subjectValidation.valid && subjectValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {subjectValidation.warning}
                </p>
              )}
              {spellingErrors.subject.length > 0 && subjectValidation.valid && !subjectValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t.didYouMean}:
                  {spellingErrors.subject[0].suggestions.slice(0, 2).map((s, i) => (
                    <button key={i} onClick={() => applySuggestion('subject', spellingErrors.subject[0].word, s)} className="underline font-medium ml-1">{s}</button>
                  ))}
                </p>
              )}
            </div>

            {/* Adverbio de frecuencia - solo para Simple Present y Simple Past */}
            {(selectedTense === 'simple-present' || selectedTense === 'simple-past') && !selectedModal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.adverbLabel} <span className="text-gray-400 text-xs">({t.optional})</span>
                </label>
                <select
                  value={selectedAdverb}
                  onChange={(e) => setSelectedAdverb(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                >
                  {frequencyAdverbs
                    .filter((adv) => selectedMode !== 'negative' || !NEGATIVE_SENSE_ADVERBS.includes(adv.id))
                    .map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}{adv.id && (language === 'es' ? ` - ${adv.descEs}` : ` (${adv.percentage}%)`)}
                    </option>
                  ))}
                </select>
                {selectedAdverb && (
                  <p className="text-xs text-indigo-600 mt-1">
                    {t.frequencyAdverbHint}
                  </p>
                )}
              </div>
            )}

            {/* Verbo */}
            <div className="relative">
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">V</span>
                <span className="text-sm font-medium text-rose-600">{t.verb}</span>
                <span className="text-red-500 text-xs">*</span>
              </label>
              <input
                ref={verbRef}
                type="text"
                value={verb}
                onChange={(e) => { setVerb(e.target.value); setShowVerbSuggestions(e.target.value.length > 0); }}
                onFocus={() => setShowVerbSuggestions(verb.length > 0)}
                onBlur={() => setTimeout(() => setShowVerbSuggestions(false), 200)}
                /* Enter cierra las sugerencias y salta al complemento; Escape
                   solo las cierra, para poder seguir editando el verbo. */
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setShowVerbSuggestions(false); return; }
                  advanceOnEnter(e, complementRef);
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="work, study, play..."
                className={`w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  verbBaseSuggestion || !verbValidation.valid ? 'border-red-400 bg-red-50' :
                  verbValidation.warning ? 'border-amber-400 bg-amber-50 border-l-amber-400' :
                  'border-gray-300 border-l-rose-400 focus:border-indigo-500'
                }`}
              />
              {showVerbSuggestions && verbSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {verbSuggestions.slice(0, 6).map((v) => (
                    <button key={v} onClick={() => { setVerb(v); setShowVerbSuggestions(false); }} className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">{v}</button>
                  ))}
                </div>
              )}
              {/* El verbo escribido ya está conjugado (worked, working, works…):
                  se prioriza esta sugerencia sobre los avisos genéricos de validación,
                  porque ya explica el problema y ofrece el arreglo con un click. */}
              {verbBaseSuggestion ? (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1.5 flex-wrap">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {language === 'es'
                    ? <>Escribe el verbo en forma base, no conjugada.</>
                    : <>Type the verb in base form, not conjugated.</>}
                  <button
                    type="button"
                    onClick={() => setVerb(verbBaseSuggestion)}
                    className="underline font-semibold text-red-700 hover:text-red-800"
                  >
                    {language === 'es' ? `Usar "${verbBaseSuggestion}"` : `Use "${verbBaseSuggestion}"`}
                  </button>
                </p>
              ) : (
                <>
                  {!verbValidation.valid && verbValidation.warning && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {verbValidation.warning}
                    </p>
                  )}
                  {verbValidation.valid && verbValidation.warning && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {verbValidation.warning}
                    </p>
                  )}
                </>
              )}
              {isIrregular && irregularVerbs[verb.toLowerCase()] && verbValidation.valid && !verbValidation.warning && (
                <p className="text-xs text-emerald-600 mt-1">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {t.irregularDetected}: {irregularVerbs[verb.toLowerCase()].past}/{irregularVerbs[verb.toLowerCase()].participle}
                </p>
              )}
            </div>

            {/* Complemento */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">C</span>
                <span className="text-sm font-medium text-emerald-600">{t.complement}</span>
                <span className="text-gray-400 text-xs">({t.optional})</span>
              </label>
              <input
                ref={complementRef}
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                /* Último campo: Enter genera la oración directamente. */
                onKeyDown={(e) => advanceOnEnter(e, null)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="yesterday, at home..."
                className={`w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  !complementValidation.valid ? 'border-red-400 bg-red-50' :
                  complementValidation.warning ? 'border-amber-400 bg-amber-50 border-l-amber-400' :
                  'border-gray-300 border-l-emerald-400 focus:border-indigo-500'
                }`}
              />
              {!complementValidation.valid && complementValidation.warning && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {complementValidation.warning}
                </p>
              )}
              {complementValidation.valid && complementValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {complementValidation.warning}
                </p>
              )}
              {selectedTense && COMPLEMENT_CHIPS[selectedTense] && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMPLEMENT_CHIPS[selectedTense].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setComplement(chip)}
                      className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                        complement === chip
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón Generar */}
          <button
            onClick={generateSentence}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {t.generate}
          </button>
        </div>

        {/* Generated Sentence con Análisis Visual */}
        {generatedSentence && (
          <div ref={sentenceRef} className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 mt-4 sm:mt-6 scroll-mt-4">
            {/* Encabezado del resultado */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-600">{language === 'es' ? 'Oración generada' : 'Generated sentence'}</span>
              </div>
              {/* Leyenda de colores — solo las partes presentes en la oración */}
              {sentenceAnalysis && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                  {sentenceAnalysis.parts.some(p => p.type === 'wh-word' || p.type === 'wh-subject') && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>WH</span>
                  )}
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>S</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>V</span>
                  {sentenceAnalysis.parts.some(p => p.type === 'complement') && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>C</span>
                  )}
                  {sentenceAnalysis.parts.some(p => p.type === 'adverbial') && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>A</span>
                  )}
                </div>
              )}
            </div>
            {/* Aviso de interactividad: cómo descubrir el desglose por palabra */}
            {sentenceAnalysis && (
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                💡 {language === 'es'
                  ? 'Toca o pasa el mouse sobre cada palabra para ver su función en la oración.'
                  : 'Tap or hover each word to see its role in the sentence.'}
              </p>
            )}
            {/* Oración con colores */}
            {sentenceAnalysis ? (
              <div className="mb-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xl sm:text-2xl md:text-3xl font-bold font-['Atkinson_Hyperlegible']">
                  {sentenceAnalysis.parts.map((part, index) => {
                    const partLabel =
                      part.type === 'wh-subject' ? (language === 'es' ? 'WH = sujeto' : 'WH = subject') :
                      part.type === 'wh-word' ? (language === 'es' ? 'Palabra WH' : 'WH Word') :
                      part.type === 'subject' ? t.subjectLabel :
                      part.type === 'adverb' ? t.adverbLabel :
                      part.type === 'auxiliary' ? t.auxiliaryLabel :
                      part.type === 'verb' ? t.verbLabel :
                      part.type === 'adverbial' ? (language === 'es' ? 'Adverbial (A)' : 'Adverbial (A)') :
                      t.complementLabel + ' (C)';
                    const colorClasses =
                      part.type === 'wh-subject' ? ROLE_TW['wh-word'] :
                      part.type === 'wh-word' ? ROLE_TW['wh-word'] :
                      part.type === 'subject' ? ROLE_TW.subject :
                      part.type === 'adverb' ? 'text-indigo-500 hover:bg-indigo-50' :
                      part.type === 'auxiliary' ? ROLE_TW.auxiliary :
                      part.type === 'verb' ? ROLE_TW.verb :
                      part.type === 'complement' ? ROLE_TW.complement :
                      part.type === 'adverbial' ? 'text-amber-600 hover:bg-amber-50' :
                      'text-gray-800';

                    // La puntuación no lleva explicación — se muestra como texto simple
                    if (part.type === 'punctuation') {
                      return <span key={index} className="text-gray-500 px-1">{part.text}</span>;
                    }

                    const isPinned = selectedPartIndex === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedPartIndex(prev => prev === index ? null : index)}
                        onFocus={() => setSelectedPartIndex(index)}
                        onMouseEnter={() => setSelectedPartIndex(index)}
                        aria-describedby={`part-desc-${index}`}
                        aria-expanded={isPinned}
                        className={`relative group appearance-none bg-transparent border-0 cursor-pointer transition-all duration-200 ${colorClasses} px-1 rounded ${isPinned ? 'ring-2 ring-offset-1 ring-indigo-300' : ''}`}
                      >
                        {part.text}
                        {/* La explicación se muestra en un panel único bajo la oración (evita el recorte en los bordes de la pantalla) */}
                        <span id={`part-desc-${index}`} className="sr-only">
                          {partLabel}. {part.explanation}
                          {part.transformation ? `. ${part.transformation}` : ''}
                          {part.isNew ? `. ${t.addedElement}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedPartIndex != null && sentenceAnalysis.parts[selectedPartIndex] && sentenceAnalysis.parts[selectedPartIndex].type !== 'punctuation' && (() => {
                  const part = sentenceAnalysis.parts[selectedPartIndex];
                  const label = part.type === 'wh-subject' ? (language === 'es' ? 'WH = sujeto' : 'WH = subject')
                    : part.type === 'wh-word' ? (language === 'es' ? 'Palabra WH' : 'WH Word')
                    : part.type === 'subject' ? t.subjectLabel
                    : part.type === 'adverb' ? t.adverbLabel
                    : part.type === 'auxiliary' ? t.auxiliaryLabel
                    : part.type === 'verb' ? t.verbLabel
                    : part.type === 'adverbial' ? 'Adverbial (A)'
                    : t.complementLabel + ' (C)';
                  return (
                    <div className="mt-3 px-3.5 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg motion-safe:animate-[gtoastIn_.25s_ease]">
                      <span className="font-bold block mb-0.5">{label}</span>
                      <span className="text-gray-100">{part.explanation}</span>
                      {part.transformation && <span className="block mt-1 text-green-300">{part.transformation}</span>}
                      {part.isNew && <span className="block mt-1 text-purple-300">{t.addedElement}</span>}
                    </div>
                  );
                })()}

              </div>
            ) : (
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4">{generatedSentence}</p>
            )}

            {/* Botones de acción */}
            <div className="space-y-2">
              {/* Fila principal: Copiar + Escuchar + velocidad */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedSentence)}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t.copied : t.copyToClipboard}
                </button>
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speak(generatedSentence, { rate: speechRate, lang: 'en-US' })}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${isSpeaking ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isSpeaking ? t.stop : t.listen}
                </button>
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="0.7">{t.slow}</option>
                  <option value="0.9">{t.normal}</option>
                  <option value="1.2">{t.fast}</option>
                </select>
              </div>
            </div>

            {/* Los 3 modos */}
            {allModeSentences && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowAllModes(!showAllModes)}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
                >
                  <span>{showAllModes ? '▾' : '▸'}</span>
                  {language === 'es' ? 'Ver los 3 modos' : 'See all 3 modes'}
                </button>
                {showAllModes && (
                  <div className="space-y-1.5">
                    {[
                      { key: 'aff', symbol: '✓', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', sym: 'text-emerald-500' },
                      { key: 'neg', symbol: '✕', bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    sym: 'text-rose-500' },
                      { key: 'int', symbol: '?', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   sym: 'text-amber-500' },
                    ].map(({ key, symbol, bg, border, text, sym }) => (
                      <div key={key} className={`flex items-baseline gap-2 px-3 py-2 rounded-lg ${bg} border ${border}`}>
                        <span className={`text-xs font-bold shrink-0 ${sym}`}>{symbol}</span>
                        <span className={`text-sm font-medium ${text}`}>{allModeSentences[key]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Semantic Warning - Compacto */}
            {semanticWarning && semanticWarning.type === 'warning' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700 flex-1">{t.semanticWarning}</span>
                <button onClick={applyTenseFix} className="text-xs font-medium text-amber-700 underline">{t.changeTense}</button>
              </div>
            )}
          </div>
        )}

        </div>
        </main>
        )}

      {/* Barra de navegación inferior — persistente (modelo de pestañas, como QL) */}
      <nav className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg z-30" style={{ order: 2 }}>
        <div className="flex items-stretch max-w-2xl mx-auto">
          {/* Iconos emoji, iguales a Desgramatizador y Question Lab: 📖 Guía,
              ✏️ Práctica y 📊 Progreso son los mismos en las tres apps. El de la
              actividad principal sí cambia, porque cambia la actividad: aquí se
              CONSTRUYE (🧱, como el logo) y allá se analiza (🔍). */}
          {[
            { panel: null,       icon: '🧱', label: language === 'es' ? 'Construye' : 'Build' },
            { panel: 'guide',    icon: '📖', label: language === 'es' ? 'Guía' : 'Guide' },
            { panel: 'practice', icon: '✏️', label: language === 'es' ? 'Práctica' : 'Practice' },
            { panel: 'progress', icon: '📊', label: language === 'es' ? 'Progreso' : 'Progress' },
            /* El contador va sobre `sentenceHistory.length`, NO sobre
               `totalAllTime`. Un número sobre un icono promete cuántas cosas hay
               ahí adentro, y totalAllTime es el total histórico de oraciones
               generadas: no bajaba nunca. El historial guarda las últimas 20 y
               el botón Limpiar lo vacía, así que la insignia decía 32 sobre un
               panel con 20 elementos, o sobre uno vacío después de limpiar.
               El total histórico no se pierde: sigue en el panel de Progreso,
               que es donde un acumulado tiene sentido. */
            { panel: 'history',  icon: '🕘', label: language === 'es' ? 'Historial' : 'History', badge: sentenceHistory.length || null },
          ].map(({ panel, icon, label, badge }) => (
            <button
              key={panel || 'home'}
              onClick={() => setActivePanel(panel)}
              aria-pressed={activePanel === panel}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors relative ${
                /* hover:text-gray-800 y no -600: QL salta de gris apagado a
                   texto pleno y por eso se nota. El salto a -600 era tan chico
                   que parecía que no pasaba nada. */
                activePanel === panel ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
              <span className="text-[10px] font-bold leading-tight">{label}</span>
              {badge && (
                <span aria-hidden="true" className="absolute top-1.5 right-1/2 translate-x-3 bg-indigo-500 text-white font-bold rounded-full flex items-center justify-center" style={{fontSize:'9px', minWidth:'16px', height:'16px', padding:'0 3px'}}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
};

export default EnglishSentenceBuilder;
