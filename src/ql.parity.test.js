/* ============================================================================
   Paridad de la suite · Grammaster GENERA → Question Lab ANALIZA
   ----------------------------------------------------------------------------
   Hermano de `suite.parity.test.js`, con la otra app que analiza. La idea es la
   misma —nadie escribe la expectativa, basta con que los dos lados discrepen—
   pero lo que se compara cambia, porque Question Lab hace otra cosa:

     · Desgramatizador analiza una oración cualquiera → se comparan los bloques
       S / V / C contra las piezas con las que Grammaster la construyó.
     · Question Lab analiza PREGUNTAS y además las reparte por rol → se compara
       el TIEMPO que reconoce, el sujeto que aísla, y el tipo de pregunta.

   Por eso este archivo cubre el terreno que el otro deja fuera a propósito: allí
   la invariante de frase verbal se salta el interrogativo, porque con el verbo
   partido en dos (aux … sujeto … verbo) no hay frase contigua contra la cual
   comparar. Aquí el interrogativo es lo ÚNICO que hay, y encima con las wh-,
   que el otro arnés no genera.

   Van dos bloques, con corpus e invariantes distintos:

     1. Cerradas y wh- de ADJUNTO. La wh es un complemento y el sujeto sigue en
        su sitio, así que se compara la pieza `subj` contra el sujeto generado.
     2. Preguntas de SUJETO, donde la wh-word ES el sujeto y no hay auxiliar
        prestado («Who lives here?»). Ahí no existe pieza `subj` que comparar,
        así que en su lugar se comprueba que el analizador la reconozca como
        pregunta de sujeto, que devuelva el sintagma wh entero y que no la
        denuncie como incompleta.

   Los identificadores de tiempo coinciden 1:1 entre las dos apps
   ('simple-present', 'present-perfect-continuous', …), así que no hace falta
   tabla de traducción: si hiciera falta, ese mapeo sería el primer sitio donde
   buscar un fallo.

   ── Cómo mantenerlo ────────────────────────────────────────────────────────
   Igual que su hermano: HALLAZGOS lleva las discrepancias ya triadas con el
   conjunto exacto en que ocurren, y la prueba falla en las dos direcciones —
   una discrepancia nueva rompe, y una entrada que ya no falla también, para que
   se borre en vez de quedarse tapando el sitio.

   ── Dependencia entre repos ────────────────────────────────────────────────
   Importa `../../Question Lab/check-env.mjs`, que arranca `app.js` contra un DOM
   de mentira: se prueba el analizador DE VERDAD, no una copia. Ese arranque pisa
   globales (`document`, `window`, `setTimeout`), lo cual es inofensivo porque
   vitest aísla cada archivo de prueba en su propio worker — pero es la razón por
   la que esto vive en su propio archivo y no dentro de suite.parity.test.js.

   Si Question Lab no está al lado, REVIENTA en vez de saltarse sola, por el
   mismo motivo que el otro arnés.
   ============================================================================ */
import { describe, it, expect } from 'vitest';
import { buildSentenceText, smartCase } from './conjugation';
import { QL } from '../../Question Lab/check-env.mjs';

const { analyze, tenseIdOf } = QL;

const TENSES = [
  'simple-present', 'present-continuous', 'simple-past', 'past-continuous',
  'simple-future', 'future-going-to', 'present-perfect', 'past-perfect',
  'present-perfect-continuous', 'used-to',
];
const SUBJECTS = ['I', 'you', 'she', 'maria', 'the dogs', 'Tom and Ana'];
const VERBS = ['work', 'study', 'go', 'have'];
/* Adjuntos solamente: aquí la wh es un complemento y el sujeto sigue en su
   sitio, así que la invariante de sujeto tiene algo que comparar. Las wh que
   OCUPAN la posición de sujeto van en el segundo bloque, más abajo. */
const WH = ['where', 'when', 'why', 'how', 'what'];
/* Las wh- se generan solo con dos verbos: multiplicar por los cuatro no añade
   un eje nuevo (el verbo ya varía en las cerradas) y duplicaría el barrido. */
const VERBOS_WH = ['work', 'go'];

/* Preguntas de SUJETO: la wh-word es el sujeto, así que no hay auxiliar prestado
   ni inversión («Who lives here?», no «Who does live here?»). Grammaster las
   construye con mode:'subject-question' y saca la concordancia de la propia wh
   —«Who» es 3ª persona pero «How many people» es plural—, lo que las convierte
   en un eje que ninguna otra parte del arnés toca.
   Las cuantificadas llevan sustantivo porque es su forma normal, y además son
   las que destaparon el bug: la lista de wh-sujeto miraba solo la primera
   palabra y ahí dice «how». */
const WH_SUJETO = [
  { whWord: 'who' },
  { whWord: 'what' },
  { whWord: 'which', whExtension: 'student' },
  { whWord: 'whose', whExtension: 'book' },
  { whWord: 'how many', whExtension: 'people' },
  { whWord: 'how much', whExtension: 'money' },
];
const VERBOS_SUJ = ['work', 'study', 'go'];

const norm = (s) => String(s ?? '').toLowerCase().replace(/[?.]/g, '').replace(/\s+/g, ' ').trim();
const palabras = (s) => norm(s).split(' ').filter(Boolean).sort().join(' ');

// ── Discrepancias ya triadas ───────────────────────────────────────────────
// Vacío: los 840 casos concuerdan en las cinco invariantes. El único hallazgo
// del primer barrido —el sujeto con determinante tragándose el «been» del
// perfecto continuo, que además hacía leer el tiempo como perfecto simple— está
// arreglado en Question Lab, con su regresión en check-analyzer.mjs.
//
// El formato de una entrada nueva y el porqué del predicado exacto están en el
// hermano, `suite.parity.test.js`. Las claves de `aplica` aquí son OK
// (aceptación), T (tiempo), S (sujeto), K (conservación) y Q (tipo), y cada `c`
// trae { tense, subject, verb, wh, texto, clave }.
const HALLAZGOS = [];

const esperado = (inv, c) => HALLAZGOS.some(h => h.aplica[inv] ? h.aplica[inv](c) : false);

/* Un solo barrido para las cuatro invariantes. Las cerradas varían los cuatro
   verbos; las abiertas añaden las wh- sobre dos de ellos. */
const barrido = () => {
  const casos = [];
  const meter = ({ tense, subject, verb, wh }) => {
    const texto = buildSentenceText({
      mode: 'interrogative', subject, verb, tense,
      complement: wh ? '' : 'at home',
      ...(wh ? { whWord: wh } : {}),
    });
    const r = analyze(texto) || {};
    const partes = r.parts || [];
    casos.push({
      tense, subject, verb, wh, texto,
      clave: `${tense}/${subject}/${verb}${wh ? '/' + wh : ''}`,
      ok: r.ok === true,
      subj: partes.filter(p => p.role === 'subj').map(p => p.text).join(' '),
      tiempo: r.ok ? tenseIdOf(r.tense) : null,
      qtipo: r.qtipo,
      todo: partes.map(p => p.text).join(' '),
    });
  };
  for (const tense of TENSES)
    for (const subject of SUBJECTS)
      for (const verb of VERBS) {
        meter({ tense, subject, verb, wh: null });
        if (VERBOS_WH.includes(verb)) for (const wh of WH) meter({ tense, subject, verb, wh });
      }
  return casos;
};

const CASOS = barrido();

/* Barrido de las preguntas de sujeto. Va aparte porque lo que se compara cambia:
   aquí NO hay pieza `subj` —la wh la ocupa— así que en su lugar se comprueba que
   el analizador la reconozca como pregunta de sujeto y devuelva la wh entera. */
const barridoSujeto = () => {
  const casos = [];
  for (const w of WH_SUJETO)
    for (const tense of TENSES)
      for (const verb of VERBOS_SUJ) {
        const wh = w.whWord + (w.whExtension ? ' ' + w.whExtension : '');
        // `subject` va vacío pero tiene que ir: buildSentenceText lo normaliza
        // antes de ramificar, aunque en este modo luego no lo use.
        const texto = buildSentenceText({
          mode: 'subject-question', subject: '', verb, tense,
          complement: 'at home', ...w,
        });
        const r = analyze(texto) || {};
        const partes = r.parts || [];
        casos.push({
          tense, verb, wh, texto,
          clave: `${wh}/${tense}/${verb}`,
          ok: r.ok === true,
          esDeSujeto: /de sujeto/.test(r.type || ''),
          conHueco: partes.some(p => p.role === 'gap'),
          whParte: partes.filter(p => p.role === 'wh').map(p => p.text).join(' '),
          tiempo: r.ok ? tenseIdOf(r.tense) : null,
          todo: partes.map(p => p.text).join(' '),
        });
      }
  return casos;
};
const CASOS_SUJ = barridoSujeto();

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

describe('paridad QL · el analizador de preguntas recupera lo que el generador puso', () => {
  /* Que TODAS se acepten es en sí una invariante: Grammaster solo genera
     preguntas bien formadas, así que un rechazo significa que el analizador no
     reconoce una construcción que la suite enseña. */
  it(`aceptación — ninguna pregunta generada se rechaza (${CASOS.length} casos)`, () => {
    verificar('OK', (c) => !c.ok, (c) => `"${c.texto}"  el analizador la rechazó`);
  });

  it('tiempo — el tiempo reconocido es el que se generó', () => {
    verificar('T',
      (c) => c.ok && c.tiempo !== c.tense,
      (c) => `"${c.texto}"  reconoció 「${c.tiempo}」 esperaba 「${c.tense}」`);
  });

  it('sujeto — la pieza «subj» aísla el sujeto generado', () => {
    verificar('S',
      (c) => c.ok && norm(c.subj) !== norm(smartCase(c.subject)),
      (c) => `"${c.texto}"  subj=「${c.subj}」 esperaba 「${smartCase(c.subject)}」`);
  });

  /* Question Lab reparte la pregunta por roles, así que la conservación aquí
     comprueba el reparto entero: ninguna palabra puede perderse entre el
     auxiliar, el sujeto, el verbo y el complemento. */
  it('conservación — el reparto por roles no pierde ni duplica palabras', () => {
    verificar('K',
      (c) => c.ok && palabras(c.todo) !== palabras(c.texto),
      (c) => `"${c.texto}"  partes=「${c.todo}」`);
  });

  it('tipo — las wh- salen abiertas y el resto cerradas', () => {
    verificar('Q',
      (c) => c.ok && c.qtipo !== (c.wh ? 'open' : 'closed'),
      (c) => `"${c.texto}"  qtipo=「${c.qtipo}」 esperaba 「${c.wh ? 'open' : 'closed'}」`);
  });
});

/* ── Preguntas de sujeto ────────────────────────────────────────────────────
   Claves de invariante propias (OKS, SUJ, TS, WHS, KS) para que los predicados
   de HALLAZGOS no se mezclen con los del bloque de arriba: son otro corpus y
   otra forma de fallar. */
const verificarSuj = (inv, falla, describir) => {
  const nuevas = [], arregladas = [];
  for (const c of CASOS_SUJ) {
    const discrepa = falla(c);
    if (discrepa && !esperado(inv, c)) nuevas.push(`${c.clave}\n      ${describir(c)}`);
    if (!discrepa && esperado(inv, c)) arregladas.push(c.clave);
  }
  expect(nuevas, `\n  Discrepancias NUEVAS entre generador y analizador (${nuevas.length}):\n    ${nuevas.join('\n    ')}\n`).toEqual([]);
  expect(arregladas, `\n  Estos casos YA NO fallan: bórralos de HALLAZGOS (${arregladas.length}):\n    ${arregladas.join('\n    ')}\n`).toEqual([]);
};

describe('paridad QL · preguntas de sujeto (la wh ES el sujeto)', () => {
  it(`aceptación — ninguna se rechaza (${CASOS_SUJ.length} casos)`, () => {
    verificarSuj('OKS', (c) => !c.ok, (c) => `"${c.texto}"  el analizador la rechazó`);
  });

  /* La invariante que sustituye a la del sujeto: no hay pieza `subj` que
     comparar, así que lo que se comprueba es que la reconozca COMO pregunta de
     sujeto. Si cae en la rama normal, sale a buscar un sujeto detrás del
     auxiliar y se queda con lo que haya («working», «been»). */
  it('reconocimiento — se analiza como pregunta de sujeto, no como wh normal', () => {
    verificarSuj('SUJ',
      (c) => c.ok && !c.esDeSujeto,
      (c) => `"${c.texto}"  no la reconoció como de sujeto`);
  });

  /* El hueco de «pregunta incompleta» merece su propia invariante: es el fallo
     más caro de todos, porque no se queda en un análisis raro — le dice al
     alumno que su pregunta CORRECTA está mal armada. */
  it('sin huecos — no denuncia como incompleta una pregunta bien formada', () => {
    verificarSuj('GAP',
      (c) => c.conHueco,
      (c) => `"${c.texto}"  la marcó incompleta`);
  });

  it('tiempo — el tiempo reconocido es el que se generó', () => {
    verificarSuj('TS',
      (c) => c.ok && c.tiempo !== c.tense,
      (c) => `"${c.texto}"  reconoció 「${c.tiempo}」 esperaba 「${c.tense}」`);
  });

  it('wh — la pieza «wh» devuelve el sintagma entero, con su sustantivo', () => {
    verificarSuj('WHS',
      (c) => c.ok && norm(c.whParte) !== norm(c.wh),
      (c) => `"${c.texto}"  wh=「${c.whParte}」 esperaba 「${c.wh}」`);
  });

  it('conservación — el reparto por roles no pierde ni duplica palabras', () => {
    verificarSuj('KS',
      (c) => c.ok && palabras(c.todo) !== palabras(c.texto),
      (c) => `"${c.texto}"  partes=「${c.todo}」`);
  });
});
