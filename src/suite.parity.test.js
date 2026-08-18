/* ============================================================================
   Paridad de la suite · Grammaster GENERA → Desgramatizador ANALIZA
   ----------------------------------------------------------------------------
   Por qué existe, y por qué es distinta del resto de pruebas del repo:

   Las demás pruebas comparan la salida contra respuestas que escribimos
   nosotros. Eso protege lo ya arreglado, pero solo puede confirmar lo que ya
   sabíamos: nadie escribe la expectativa de un caso que no se le ocurrió. De
   los tres bugs reales de la revisión de agosto 2026, ninguno salió de una
   prueba por ejemplos; salieron de usar la app.

   La excepción fue `conjugation.parity.test.js`, que sí encontró un bug (C1,
   «Will have she worked?»). La diferencia: no compara contra una respuesta
   escrita a mano, sino DOS IMPLEMENTACIONES entre sí sobre un espacio generado.
   Nadie tiene que predecir el resultado correcto — basta con que los dos lados
   discrepen.

   Este archivo lleva esa idea al límite natural de la suite: somos dueños de
   los dos lados. Grammaster construye una oración a partir de
   {tiempo, modo, sujeto, verbo} CONOCIDOS, y el analizador del Desgramatizador
   tiene que recuperar esas mismas piezas del texto. Toda discrepancia es un bug
   en uno de los dos, y no hizo falta escribir ni una expectativa a mano.

   Es el punto ciego que `check-bank.mjs` de Question Lab ya nombra: «el banco
   lo escribimos nosotros: son las preguntas que sabemos que funcionan». Un
   generador no tiene ese sesgo.

   ── Cómo mantenerlo ────────────────────────────────────────────────────────
   HALLAZGOS abajo lista las discrepancias YA TRIADAS y confirmadas como bugs
   pendientes, con el conjunto exacto en que ocurren. La prueba falla en dos
   direcciones a propósito:

     · discrepancia NUEVA que no está en HALLAZGOS  → falla (es lo que buscamos)
     · caso listado en HALLAZGOS que YA NO falla    → falla, para que borres la
       entrada. Sin esto, la lista se convierte en una capa de silencio que
       tapa regresiones futuras en el mismo sitio.

   ── Dependencia entre repos ────────────────────────────────────────────────
   Importa `../../Desgramatizador/pos-highlighter/src/nlp/analysis.js`. Si ese
   repo no está al lado, esta prueba REVIENTA en vez de saltarse sola. Es
   deliberado: una prueba que se salta en silencio deja de cumplir su propósito
   sin que nadie se entere.

   ── Límite conocido ────────────────────────────────────────────────────────
   La invariante del verbo no se aplica en interrogativo: ahí `buildVerbPhrase`
   devuelve solo la primera palabra del auxiliar (el resto va detrás del
   sujeto), así que no hay una frase verbal contigua contra la cual comparar.
   Las invariantes de sujeto y de conservación sí cubren el interrogativo.
   ============================================================================ */
import { describe, it, expect } from 'vitest';
import { buildSentenceText, buildVerbPhrase, expandirNegacion, smartCase } from './conjugation';
import { analyzeSentenceStructure } from '../../Desgramatizador/pos-highlighter/src/nlp/analysis.js';

// El mismo espacio que conjugation.parity.test.js, por la misma razón: cubre
// los dos ejes que rompen la conjugación (persona del sujeto y verbo irregular)
// sin que el barrido deje de correr en poco más de un segundo.
const TENSES = [
  'simple-present', 'present-continuous', 'simple-past', 'past-continuous',
  'simple-future', 'future-going-to', 'present-perfect', 'past-perfect',
  'present-perfect-continuous', 'used-to',
];
const MODES = ['affirmative', 'negative', 'interrogative'];
const SUBJECTS = ['I', 'you', 'she', 'maria', 'the dogs', 'Tom and Ana'];
const VERBS = ['work', 'study', 'go', 'have'];
const COMPLEMENTO = 'at home';

/* El analizador expande contracciones antes de trabajar («doesn't» → «does
   not»), así que los dos lados se normalizan con el MISMO expansor, que es el
   de Grammaster. Comparar sin esto daría discrepancias que solo son ortografía. */
const norm = (s) => expandirNegacion(String(s ?? ''))
  .toLowerCase().replace(/[.?]/g, '').replace(/\s+/g, ' ').trim();

const palabras = (s) => norm(s).split(' ').filter(Boolean).sort().join(' ');

// ── Discrepancias ya triadas ───────────────────────────────────────────────
// Cada predicado describe EXACTAMENTE el conjunto que falla hoy. Si lo dejas
// más ancho de la cuenta, la comprobación de «ya se arregló» deja de servir.
const homonimoCompuesto = (c) => c.subject === 'Tom and Ana' && (c.verb === 'work' || c.verb === 'study');

const HALLAZGOS = [
  {
    nombre: 'used to: al negar, el infinitivo se cae al complemento',
    detalle: `En afirmativo el analizador agrupa bien la perífrasis completa
      (V:「used to work」). En negativo produce V:「did not use」 y manda «to work»
      al complemento — la misma construcción analizada de dos maneras distintas.
      Es la familia del bug «use to / going to» de la revisión de agosto 2026.
      El bug está en Desgramatizador, no aquí: Grammaster genera bien las dos.`,
    aplica: {
      V: (c) => c.tense === 'used-to' && c.mode === 'negative',
    },
  },
  {
    nombre: 'sujeto propio compuesto + verbo homónimo de sustantivo: análisis vacío',
    detalle: `«Tom and Ana work at home.» devuelve CERO componentes — el análisis
      colapsa entero, no es que se equivoque de etiqueta. Solo pasa con la
      combinación de sujeto propio compuesto («X and Y») y un verbo en forma
      desnuda que también es sustantivo (work, study). «Tom and Ana go», «Tom and
      Ana worked» y «The dogs work» salen bien, lo que confirma que hacen falta
      las dos condiciones a la vez.

      Es el mecanismo 1 que check-analyzer.mjs de Question Lab documenta y guarda
      («Homónimo sustantivo-verbo: stop, pass, watch, order…»). Question Lab tiene
      la guarda; Desgramatizador no. Ese contraste entre dos apps de la misma
      suite es justo lo que este archivo existe para encontrar.`,
    aplica: {
      S: (c) => homonimoCompuesto(c) &&
        ((c.tense === 'simple-present' && c.mode === 'affirmative') ||
         (c.tense === 'simple-future' && c.mode === 'interrogative')),
      V: (c) => homonimoCompuesto(c) && c.tense === 'simple-present' && c.mode === 'affirmative',
      K: (c) => homonimoCompuesto(c) && c.tense === 'simple-present' && c.mode === 'affirmative',
    },
  },
];

const esperado = (inv, c) => HALLAZGOS.some(h => h.aplica[inv] ? h.aplica[inv](c) : false);

/* Un solo barrido para las tres invariantes: analizar cuesta ~1.3 s en total y
   repetirlo por invariante lo triplicaría sin ganar nada. */
const barrido = () => {
  const casos = [];
  for (const tense of TENSES)
    for (const mode of MODES)
      for (const subject of SUBJECTS)
        for (const verb of VERBS) {
          const texto = buildSentenceText({ mode, subject, verb, complement: COMPLEMENTO, tense });
          const comps = analyzeSentenceStructure(texto, 'Básico').components || [];
          casos.push({
            tense, mode, subject, verb, texto,
            clave: `${tense}/${mode}/${subject}/${verb}`,
            S: comps.filter(x => x.type === 'S').map(x => x.text).join(' '),
            V: comps.filter(x => x.type === 'V' || x.type === 'AUX').map(x => x.text).join(' '),
            todo: comps.map(x => x.text).join(' '),
          });
        }
  return casos;
};

const CASOS = barrido();

/* Motor común de las tres invariantes. `falla(c)` decide si el caso discrepa;
   el resto reparte los casos en «nuevas» (rompen) y «ya arregladas» (también
   rompen, para obligar a limpiar HALLAZGOS). */
const verificar = (inv, falla, describir) => {
  const nuevas = [], arregladas = [];
  for (const c of CASOS) {
    const discrepa = falla(c);
    if (discrepa && !esperado(inv, c)) nuevas.push(`${c.clave}\n      ${describir(c)}`);
    if (!discrepa && esperado(inv, c)) arregladas.push(c.clave);
  }
  expect(nuevas, `\n  Discrepancias NUEVAS entre generador y analizador (${nuevas.length}):\n    ${nuevas.join('\n    ')}\n`).toEqual([]);
  expect(arregladas, `\n  Estos casos YA NO fallan: bórralos de HALLAZGOS (${arregladas.length}):\n    ${arregladas.join('\n    ')}\n`).toEqual([]);
};

describe('paridad suite · el analizador recupera lo que el generador puso', () => {
  it(`sujeto — el bloque S devuelve el sujeto generado (${CASOS.length} casos)`, () => {
    verificar('S',
      (c) => norm(c.S) !== norm(smartCase(c.subject)),
      (c) => `"${c.texto}"  S=「${c.S}」 esperaba 「${smartCase(c.subject)}」`);
  });

  it('frase verbal — el bloque V coincide con buildVerbPhrase (salvo interrogativo)', () => {
    verificar('V',
      (c) => c.mode !== 'interrogative' &&
        norm(c.V) !== norm(buildVerbPhrase(c.subject, c.verb, c.tense, null, c.mode)),
      (c) => `"${c.texto}"  V=「${c.V}」 esperaba 「${buildVerbPhrase(c.subject, c.verb, c.tense, null, c.mode)}」`);
  });

  /* Conservación: cada palabra de la oración cae en exactamente un componente.
     Es la invariante que atrapa la clase de bug que dio origen a check-basico
     en Question Lab («She works in Santiago» daba el verbo «works in»): no
     necesita saber cuál es el análisis correcto, solo que no se pierda ni se
     duplique nada. Por eso también detecta el análisis vacío. */
  it('conservación — ningún componente pierde ni duplica palabras', () => {
    verificar('K',
      (c) => palabras(c.todo) !== palabras(c.texto),
      (c) => `"${c.texto}"  componentes=「${c.todo}」`);
  });
});
