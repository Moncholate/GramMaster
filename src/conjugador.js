/* ============================================================================
   EL CONJUGADOR — LAS FORMAS DE UN VERBO
   ----------------------------------------------------------------------------
   Lo primero que se pregunta un alumno delante de un verbo nuevo no es en qué
   tiempo va: es «¿cómo era el pasado de este?». Eso es lo que da este módulo —
   las formas principales— y la tabla de tiempos que ya existe se encarga de lo
   otro, de qué pasa con cada una en los diez tiempos.

   NI UNA FORMA ESCRITA A MANO, igual que la tabla. Las cuatro salen de
   `conjugation.js`, o sea del MISMO motor que construye las oraciones y que los
   oráculos cruzan contra Desgramatizador y Question Lab. Una lista de formas
   escrita aparte se desviaría, y entonces el alumno vería una cosa aquí y otra
   al practicar.

   ────────────────────────────────────────────────────────────────────────────
   POR QUÉ EL PATRÓN, Y NO SOLO «IRREGULAR»
   ────────────────────────────────────────────────────────────────────────────
   Decir «irregular» no ayuda a memorizar nada: mete en el mismo saco a `cut`,
   que no cambia nunca, y a `go`, que cambia dos veces. Lo que sí ayuda —y es
   como el propio libro agrupa la tabla de la página 165— es en cuántas formas
   distintas se reparte el verbo:

     · REGULAR          work · worked · worked      la regla del -ed
     · LAS TRES IGUALES cut · cut · cut             no cambia nunca
     · DOS IGUALES      buy · bought · bought       pasado y participio, uno solo
     · LAS TRES DISTINTAS go · went · gone          hay que aprenderse dos

   Un alumno que sabe que su verbo es «de dos iguales» ya sabe la mitad. Y para
   los regulares, ver que las dos últimas casillas dicen lo mismo es exactamente
   la regla que se les pide aplicar.

   ────────────────────────────────────────────────────────────────────────────
   EL INFINITIVO Y LA BASE SON LA MISMA PALABRA, y se muestran las dos porque se
   preguntan las dos. `to work` es lo que se busca en el diccionario y lo que
   sigue a otro verbo («I want TO WORK»); `work` a secas es lo que va detrás de
   un auxiliar («She doesn't WORK»). Confundirlas es de los errores frecuentes,
   así que verlas juntas y distintas vale más que elegir una.

   LOS VERBOS DE DOS PALABRAS conjugan la CABEZA, no la partícula: get up →
   got up, getting up. Eso ya lo resuelve `conjugation.js` para las cuatro
   formas; aquí solo se separa para poder señalar cuál es la que cambia.

   Este archivo es PURO: ni React ni DOM, para poder probarlo
   (`conjugador.test.js`). La vista vive en App.jsx.
   ========================================================================== */
import { presentParticiple, simplePast, pastParticiple, conjugate3p, detectConjugatedVerbBase } from './conjugation';
import { irregularVerbs } from './data/verbs';
import { validateVerb, revisarVerboAntesDeGenerar } from './data/validation';
import { getSpellingSuggestions } from './spelling';

/** Los cuatro patrones, en el orden en que conviene entenderlos. */
export const PATRONES = ['regular', 'tres-iguales', 'dos-iguales', 'tres-distintas'];

/**
 * Las formas principales de un verbo.
 *
 * Devuelve también el PATRÓN y las piezas de un verbo de dos palabras, para que
 * la vista pueda señalar qué cambia sin volver a partir la cadena.
 */
export const formasDe = (verbo) => {
  const limpio = String(verbo == null ? '' : verbo).trim().toLowerCase().replace(/\s+/g, ' ');
  if (!limpio) return null;

  /* La cabeza es la que se conjuga; la partícula viaja detrás sin cambiar. */
  const corte = limpio.indexOf(' ');
  const nucleo = corte === -1 ? limpio : limpio.slice(0, corte);
  const particula = corte === -1 ? '' : limpio.slice(corte + 1);

  const base = limpio;
  const tercera = conjugate3p(limpio);
  const pasado = simplePast(limpio);
  const gerundio = presentParticiple(limpio);
  const participio = pastParticiple(limpio);

  const irregular = Boolean(irregularVerbs[nucleo]);

  /* El patrón se mide sobre el NÚCLEO: en «get up» lo que se repite o cambia es
     «get», y comparar las cadenas enteras diría lo mismo pero por casualidad. */
  const nBase = nucleo;
  const nPasado = simplePast(nucleo);
  const nParticipio = pastParticiple(nucleo);

  let patron;
  if (!irregular) patron = 'regular';
  else if (nBase === nPasado && nPasado === nParticipio) patron = 'tres-iguales';
  else if (nPasado === nParticipio) patron = 'dos-iguales';
  else patron = 'tres-distintas';

  return {
    base,
    infinitivo: `to ${base}`,
    tercera,
    pasado,
    gerundio,
    participio,
    irregular,
    patron,
    nucleo,
    particula,
    /* `be` es el único que reparte el pasado entre dos formas según el sujeto.
       Se marca para que la vista pueda decirlo en vez de dejar un «was/were»
       suelto que parece una errata. */
    pasadoDoble: pasado.includes('/'),
  };
};

/**
 * LAS CINCO FORMAS QUE SE MUESTRAN, en el orden que pidió el profesor. El orden
 * y los nombres son contenido, no decoración: la vista los pinta sin decidir
 * nada.
 *
 * SON LOS MISMOS CINCO NOMBRES QUE USA LA TABLA DE ABAJO, y eso es el punto. Si
 * la tarjeta dijera «participio» y la celda «+ -ed», el alumno creería que son
 * dos cosas distintas. Un solo vocabulario para toda la pantalla.
 *
 * NO LLEVAN EXPLICACIÓN DEBAJO, y se probó al revés. Cada forma tenía su para
 * qué con un ejemplo («el que acompaña a have: She has gone»); el profesor lo
 * quitó. Es material de CONSULTA —se mira para resolver una duda concreta, no
 * para aprender de cero— y seis explicaciones simultáneas convierten un vistazo
 * en una lectura. Lo que explica cada forma es la tabla de abajo, donde se la ve
 * funcionando en su tiempo. No reponerlo sin que él lo pida.
 *
 * LA 3.ª PERSONA NO ESTÁ, tampoco por olvido: no es una de las cinco formas
 * principales, y la fila del Presente Simple de la tabla ya la muestra
 * conjugada. `formasDe` la sigue devolviendo porque es una forma real del verbo
 * y este módulo es el conjugador; lo que se decidió es no ponerla en la tarjeta.
 */
export const FILAS_DE_FORMAS = [
  { id: 'base', es: 'Base', en: 'Base' },
  { id: 'infinitivo', es: 'Infinitivo', en: 'Infinitive' },
  { id: 'gerundio', es: 'Gerundio', en: '-ing form' },
  { id: 'pasado', es: 'Pasado simple', en: 'Simple past' },
  { id: 'participio', es: 'Pasado participio', en: 'Past participle' },
];

/* ============================================================================
   ¿ES ESTO UN VERBO?
   ----------------------------------------------------------------------------
   El conjugador conjugaba cualquier cosa. Escribías «wrok» y salía «wroked»,
   con la misma cara de certeza que «worked»; escribías «went» y salía «wented»,
   que es justo la forma que el alumno estaba intentando NO escribir. Lo vio el
   profesor. Un conjugador que nunca duda enseña con la misma cara lo cierto y
   lo falso, y el segundo se aprende igual de bien.

   NO SE INVENTA UN CRITERIO NUEVO. Quién decide si algo es un verbo ya está
   decidido en la app —`validateVerb` y `revisarVerboAntesDeGenerar`, con su
   pozo de 234 formas base— y es el mismo que avisa en el constructor. Dos
   criterios distintos para la misma pregunta acabarían contradiciéndose delante
   del curso: la misma palabra aceptada en una pantalla y rechazada en la otra.

   TRES RESPUESTAS, y cada una pide una cosa distinta:

     · `conjugado` — lo escrito YA es una forma conjugada: «went» es el pasado
       de «go». Aquí no hay ninguna duda que confirmar, así que no se pregunta:
       se conjuga la BASE y se dice de dónde salió. Es lo que hace cualquier
       diccionario cuando buscas una forma conjugada, y es la única manera de no
       llegar nunca a enseñar «wented».
     · `dudoso` — es palabra inglesa conocida, pero puede no ser un verbo.
     · `noEsVerbo` — no está en ninguna lista. Se ofrecen correcciones del
       corrector ortográfico, que es el mismo que corrige el complemento.

   LOS DOS ÚLTIMOS AVISAN Y NO BLOQUEAN, y eso es una regla del profesor y no una
   comodidad: el pozo es finito y un verbo legítimo que no esté en él no puede
   dejar a nadie sin poder trabajar (está razonado en `revisarVerboAntesDeGenerar`).
   Lo que cambia es que las formas dejan de presentarse como un hecho.
   ========================================================================== */

/** Cuál de las cinco formas es lo escrito, respecto de su base. */
const formaQueEs = (escrito, base) => {
  const f = formasDe(base);
  if (!f) return null;
  if (escrito === f.gerundio) return 'gerundio';
  if (escrito === f.pasado) return 'pasado';
  if (escrito === f.participio) return 'participio';
  if (escrito === f.tercera) return 'tercera';
  return null;
};

/**
 * Qué hay que decir sobre lo que se escribió.
 *
 * Devuelve el TIPO y los datos, nunca el texto: el texto es de la vista, que es
 * donde vive el idioma. Mismo reparto de tipos que en el constructor.
 */
export const revisarVerbo = (verbo) => {
  const limpio = String(verbo == null ? '' : verbo).trim().toLowerCase().replace(/\s+/g, ' ');
  const nada = { tipo: null, base: null, forma: null, sugerencias: [] };
  if (!limpio) return nada;

  const base = detectConjugatedVerbBase(limpio);
  const validacion = validateVerb(limpio);
  const { confirmar, tipo } = revisarVerboAntesDeGenerar(validacion, base);
  if (!confirmar) return nada;

  if (tipo === 'conjugado') {
    return { tipo, base, forma: formaQueEs(limpio, base), sugerencias: [] };
  }

  /* Solo se sugiere ortografía cuando NO se reconoce nada. Para un «dudoso»
     —palabra inglesa que quizá no sea verbo— una lista de parecidas sería ruido:
     la palabra está bien escrita, el problema es otro. */
  return {
    tipo,
    base: null,
    forma: null,
    sugerencias: tipo === 'noEsVerbo' ? getSpellingSuggestions(limpio).slice(0, 3) : [],
  };
};
