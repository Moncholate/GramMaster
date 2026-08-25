/* AUTO-GENERATED from Grammar HUB/capitals-engine.js + vocabulary.json — do not edit.
   Regenerate: node scripts/sync-capitals.mjs (from Grammar HUB). */
/* ============================================================================
   Grammar Hub · motor de MAYÚSCULAS
   ----------------------------------------------------------------------------
   Lógica PURA y neutral al framework. No conoce ninguna lista: recibe la suya en
   cada llamada, igual que spelling-engine.js. Se reparte con
   scripts/sync-capitals.mjs.

   ── Por qué no lo hace el corrector ortográfico ────────────────────────────
   Porque son dos trabajos distintos y mezclarlos rompe el que ya funciona. El
   corrector compara en MINÚSCULAS a propósito: así «Wrok» y «wrok» son la misma
   errata y se sugiere «work» en los dos casos. Si empezara a distinguir
   mayúsculas, cada palabra con capital inicial legítima —el principio de
   cualquier oración— se le volvería una candidata distinta y el ranking de
   sugerencias se llenaría de duplicados.

   Así que la capitalización va aparte, y es del mismo tipo que la regla de
   `be` + verbo en forma base: no mira si la palabra EXISTE, mira qué PAPEL
   tiene.

   ── Qué cubre, y por qué justo eso ─────────────────────────────────────────
   Meses, días y nacionalidades/idiomas. No es una lista arbitraria: es
   exactamente el conjunto donde el español y el inglés NO coinciden.

       español            inglés
       enero              January
       lunes              Monday
       chileno            Chilean

   Ese desajuste es la fuente del error, y es el que el libro enseña de frente
   con su «January NOT january». Un hispanohablante escribe «january» porque en
   su idioma va así, no porque no sepa escribirlo.

   Los PAÍSES se quedan fuera aunque el vocabulario los guarde con mayúscula.
   El español también los capitaliza («Chile», «Japón»), así que no hay
   interferencia que corregir, y meterlos traería homógrafos —Turkey/turkey,
   China/china— a cambio de no enseñar nada.

   ── La trampa: «may» ───────────────────────────────────────────────────────
   `may` es un mes Y es un modal, y en esta suite el modal se usa mucho más. Una
   regla ingenua convertiría «She may work here» en «She May work here»: un
   error inventado, en una app que enseña modales, sobre una oración correcta.
   Es el peor fallo posible — decirle al alumno que su trabajo bien hecho está
   mal.

   Lo mismo, en menor grado, con `march` (verbo) y `august` (adjetivo).

   Por eso las ambiguas NO se marcan por defecto: solo cuando hay una prueba
   POSITIVA de que se está hablando del mes. Hoy esa prueba es una preposición
   de tiempo delante («in march») o un número detrás («march 5»). Si no la hay,
   la palabra se deja en paz. La asimetría es deliberada: no marcar un error
   real cuesta una oportunidad de enseñar; marcar un acierto como error cuesta
   la confianza del alumno en la app.
   ============================================================================ */

/* Palabras que, delante de un mes, lo delatan como fecha y no como verbo ni
   modal. `every`, `this`, `last` y `next` no son preposiciones pero hacen el
   mismo trabajo aquí: «next march» solo puede ser el mes. */
const ANTES_DE_FECHA = new Set([
  'in', 'on', 'since', 'until', 'till', 'from', 'by', 'during',
  'after', 'before', 'of', 'this', 'last', 'next', 'every',
]);

/* `\p{L}` y no `[a-z]`: sin eso, un texto con acentos o con apóstrofo tipográfico
   parte las palabras por la mitad y se comparan trozos. */
const RE_PALABRA = /[\p{L}][\p{L}'’-]*/gu;

/**
 * Busca palabras que deberían llevar mayúscula inicial y no la llevan.
 *
 * @param {string} texto
 * @param {object} opciones
 * @param {Record<string,string>} opciones.canonico  minúscula → forma correcta
 *        («january» → «January»). Lo genera sync-capitals.mjs.
 * @param {string[]} [opciones.ambiguas]  las que tienen un uso legítimo en
 *        minúscula («may», «march», «august») y solo se marcan con prueba.
 * @returns {{palabra:string, sugerida:string, indice:number, ambigua:boolean}[]}
 */
export const revisarMayusculas = (texto, opciones = {}) => {
  const canonico = opciones.canonico || {};
  const ambiguas = new Set(opciones.ambiguas || []);
  const t = String(texto ?? '');
  if (!t) return [];

  // Se recogen todas las palabras con su posición antes de decidir nada: para
  // juzgar una ambigua hace falta mirar la de al lado.
  const tokens = [];
  for (const m of t.matchAll(RE_PALABRA)) tokens.push({ palabra: m[0], indice: m.index });

  const salida = [];
  for (let i = 0; i < tokens.length; i++) {
    const { palabra, indice } = tokens[i];
    const bajo = palabra.toLowerCase();
    const correcta = canonico[bajo];
    if (!correcta || palabra === correcta) continue;

    /* Solo la INICIAL. «JANUARY» está gritando, pero la mayúscula está puesta y
       no es el error que se enseña; marcarlo sería ruido. Y una forma como
       «JaNuArY» tampoco: la inicial es correcta, lo demás es otro problema. */
    if (palabra[0] === correcta[0]) continue;

    if (ambiguas.has(bajo)) {
      const anterior = i > 0 ? tokens[i - 1].palabra.toLowerCase() : null;
      /* El número puede venir pegado al final («March 5») y RE_PALABRA no
         captura dígitos, así que se mira el texto que sigue directamente. */
      const despues = t.slice(indice + palabra.length, indice + palabra.length + 6);
      const pruebaDetras = /^\s+\d/.test(despues);
      if (!(anterior && ANTES_DE_FECHA.has(anterior)) && !pruebaDetras) continue;
    }

    salida.push({ palabra, sugerida: correcta, indice, ambigua: ambiguas.has(bajo) });
  }
  return salida;
};

/** Aplica las correcciones sobre el texto. De atrás hacia delante, para que los
 *  índices de las anteriores sigan siendo válidos. */
export const corregirMayusculas = (texto, hallazgos) => {
  let out = String(texto ?? '');
  for (const h of [...hallazgos].sort((a, b) => b.indice - a.indice))
    out = out.slice(0, h.indice) + h.sugerida + out.slice(h.indice + h.palabra.length);
  return out;
};

export const CAPS_CANONICO = {"january":"January","february":"February","march":"March","april":"April","may":"May","june":"June","july":"July","august":"August","september":"September","october":"October","november":"November","december":"December","monday":"Monday","tuesday":"Tuesday","wednesday":"Wednesday","thursday":"Thursday","friday":"Friday","saturday":"Saturday","sunday":"Sunday","argentinian":"Argentinian","brazilian":"Brazilian","canadian":"Canadian","chilean":"Chilean","chinese":"Chinese","english":"English","japanese":"Japanese","korean":"Korean","mexican":"Mexican","peruvian":"Peruvian","saudi":"Saudi","spanish":"Spanish","turkish":"Turkish","british":"British","american":"American","vietnamese":"Vietnamese","irish":"Irish","german":"German","moroccan":"Moroccan","egyptian":"Egyptian","russian":"Russian","czech":"Czech","french":"French","thai":"Thai","african":"African","asian":"Asian","australian":"Australian","european":"European","north":"North","south":"South"};
export const CAPS_AMBIGUAS = ["may","march","august"];
