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
import { presentParticiple, simplePast, pastParticiple, conjugate3p } from './conjugation';
import { irregularVerbs } from './data/verbs';

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
 * Las formas, en el orden en que se recitan y se preguntan.
 * La vista las pinta sin decidir el orden: el orden es contenido.
 *
 * EL EJEMPLO ES DEL VERBO QUE SE ESCRIBIÓ, no de uno fijo. Estaba puesto con
 * «work» y quedaba absurdo: arriba «to go» y debajo «I want to work», o sea el
 * ejemplo contradiciendo a la forma que pretendía explicar. Las ayudas llevan
 * huecos `{campo}` y los rellena `conEjemplo`.
 *
 * LOS MARCOS ESTÁN ELEGIDOS PARA QUE VALGAN CON CUALQUIER VERBO, `be` incluido,
 * que es el que rompe todo: «She will be» sí, «She doesn’t be» no — por eso el
 * auxiliar del ejemplo de la base es `will` y no `doesn’t`.
 */
export const FILAS_DE_FORMAS = [
  { id: 'infinitivo', es: 'Infinitivo', en: 'Infinitive',
    ayudaEs: 'lo que sigue a otro verbo: I want {infinitivo}',
    ayudaEn: 'after another verb: I want {infinitivo}' },
  { id: 'base', es: 'Base', en: 'Base form',
    ayudaEs: 'lo que va detrás de un auxiliar: She will {base}',
    ayudaEn: 'after an auxiliary: She will {base}' },
  { id: 'tercera', es: '3.ª persona', en: 'Third person',
    ayudaEs: 'he · she · it, en presente simple: She {tercera}',
    ayudaEn: 'he · she · it, simple present: She {tercera}' },
  { id: 'pasado', es: 'Pasado simple', en: 'Simple past',
    ayudaEs: 'la segunda columna de la tabla de irregulares: She {pasado}',
    ayudaEn: 'the second column of the irregular table: She {pasado}' },
  { id: 'gerundio', es: 'Gerundio', en: '-ing form',
    ayudaEs: 'el que acompaña a be: She is {gerundio}',
    ayudaEn: 'the one that goes with be: She is {gerundio}' },
  { id: 'participio', es: 'Participio', en: 'Past participle',
    ayudaEs: 'el que acompaña a have: She has {participio}',
    ayudaEn: 'the one that goes with have: She has {participio}' },
];

/**
 * Rellena los huecos de una ayuda con las formas del verbo.
 *
 * De un pasado repartido —«was/were»— se toma la PRIMERA: el ejemplo dice «She
 * was» y no «She was/were», que no es inglés. Que se reparte ya lo explica la
 * nota de `pasadoDoble`; el ejemplo está para enseñar dónde va la forma, no para
 * repetir la excepción.
 */
export const conEjemplo = (texto, formas) =>
  String(texto == null ? '' : texto).replace(/\{(\w+)\}/g, (hueco, campo) => {
    const valor = formas && formas[campo];
    return valor == null ? hueco : String(valor).split('/')[0];
  });
