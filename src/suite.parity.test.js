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
/* «the dog» —determinante + sustantivo SINGULAR— faltaba, y su ausencia tapaba
   un fallo grave: compromise lee «the dog runs» como frase nominal y
   Desgramatizador devolvía CERO componentes. Todos los sujetos de esta lista
   eran pronombres, nombres propios o plurales, o sea justo los que NO disparan
   la ambigüedad. */
const SUBJECTS = ['I', 'you', 'she', 'maria', 'the dog', 'the dogs', 'Tom and Ana'];
/* «get up» entra desde que el campo Verbo acepta frasales: Grammaster empezó a
   generar una FORMA de oración que Desgramatizador nunca había tenido que
   analizar, y el oráculo existe justo para eso — para que la app que produce y
   la que identifica no se separen sin que nadie lo note. Se elige uno con la
   cabeza irregular (get/got) para que además cruce el eje de la conjugación. */
const VERBS = ['work', 'study', 'go', 'have', 'get up'];
/* El complemento VACÍO es el segundo punto ciego que hacía falta cerrar. Con
   «at home» siempre puesto, el verbo nunca cerraba la oración — y ahí es donde
   estaban tanto el análisis vacío de «The dog runs.» como la fuga del punto
   final dentro del último componente. Un eje que solo se prueba con un valor no
   es un eje. */
const COMPLEMENTOS = ['at home', ''];

/* El analizador expande contracciones antes de trabajar («doesn't» → «does
   not»), así que los dos lados se normalizan con el MISMO expansor, que es el
   de Grammaster. Comparar sin esto daría discrepancias que solo son ortografía. */
const norm = (s) => expandirNegacion(String(s ?? ''))
  .toLowerCase().replace(/[.?]/g, '').replace(/\s+/g, ' ').trim();

const palabras = (s) => norm(s).split(' ').filter(Boolean).sort().join(' ');

// ── Discrepancias ya triadas ───────────────────────────────────────────────
// Vacío: las 720 combinaciones concuerdan. Los dos hallazgos del primer barrido
// («used to» perdiendo el infinitivo al negar, y el sujeto propio compuesto con
// verbo homónimo de sustantivo que dejaba el análisis en cero componentes) están
// arreglados en Desgramatizador — el detalle de cada uno quedó en el commit que
// los cerró.
//
// Para añadir una entrada nueva, tríala primero: mira el desglose completo de
// componentes y decide si es un bug o una diferencia legítima de criterio entre
// las dos apps. Después descríbela con un predicado que cubra EXACTAMENTE el
// conjunto que falla — si lo dejas más ancho de la cuenta, la comprobación de
// «ya se arregló» deja de servir y la entrada se queda ahí tapando el sitio.
//
//   {
//     nombre: 'resumen en una línea',
//     detalle: `qué hace, qué debería hacer, y por qué es un bug y no criterio`,
//     aplica: { V: (c) => c.tense === 'used-to' && c.mode === 'negative' },
//   }
//
// Las claves de `aplica` son las invariantes: S (sujeto), V (frase verbal),
// K (conservación). Cada `c` trae { tense, mode, subject, verb, texto, clave }.
const HALLAZGOS = [];

const esperado = (inv, c) => HALLAZGOS.some(h => h.aplica[inv] ? h.aplica[inv](c) : false);

/* Un solo barrido para las tres invariantes: analizar cuesta ~1.3 s en total y
   repetirlo por invariante lo triplicaría sin ganar nada. */
const barrido = () => {
  const casos = [];
  for (const tense of TENSES)
    for (const mode of MODES)
      for (const subject of SUBJECTS)
        for (const verb of VERBS)
        for (const complement of COMPLEMENTOS) {
          const texto = buildSentenceText({ mode, subject, verb, complement, tense });
          const comps = analyzeSentenceStructure(texto, 'Básico').components || [];
          casos.push({
            tense, mode, subject, verb, texto,
            clave: `${tense}/${mode}/${subject}/${verb}${complement ? '' : '/sin-compl'}`,
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
