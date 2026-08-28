/* ============================================================================
   LA TABLA DE TIEMPOS
   ----------------------------------------------------------------------------
   El resumen que el profesor arma a mano cada vez que cierra un curso: qué
   auxiliar lleva cada tiempo, qué le pasa al verbo principal, y cómo cambian
   las dos cosas entre afirmativa, negativa e interrogativa.

   NI UNA FORMA ESCRITA A MANO. Cada celda sale de `buildSentenceText` y
   `getAuxAndVerbForm`, o sea del MISMO motor que construye las oraciones del
   constructor y que los oráculos cruzan contra Desgramatizador y Question Lab.
   Una tabla escrita a mano se desviaría del generador —y entonces el alumno
   vería una cosa en la guía y otra al practicar—; así, si mañana se corrige el
   motor, la tabla se corrige sola.

   LO QUE ENSEÑA, y por eso va descompuesta en piezas y no solo como frase: la
   marca no desaparece, se MUDA al auxiliar. En afirmativa la lleva el verbo
   («works»); en cuanto aparece un auxiliar, el verbo vuelve a su forma base
   («does work»). Ahí está el error más repetido de la clase —«She doesn't
   works»— y es el mismo patrón en los diez tiempos, que es justo lo que una
   tabla en papel tiene delante pero no señala.

   Este archivo es PURO: ni React ni DOM, para que se pueda probar. La vista
   vive en App.jsx.
   ========================================================================== */
import { tenses, getMarkersByTense, estaVisto } from './data/grammar';
import { buildSentenceText, getAuxAndVerbForm, getVerbChangeType } from './conjugation';

/** Las tres formas, en el orden en que se enseñan. */
export const MODOS = ['affirmative', 'negative', 'interrogative'];

/** Una celda: la oración entera y sus piezas por separado. */
export const celdaDe = ({ sujeto, verbo, complemento = '', tenseId, mode }) => {
  const { auxiliary, verbForm } = getAuxAndVerbForm(sujeto, verbo, tenseId, '', mode);
  return {
    mode,
    frase: buildSentenceText({
      mode, subject: sujeto, verb: verbo, complement: complemento,
      tense: tenseId, modal: '', whWord: '', whExtension: '', adverb: '',
    }),
    /* El auxiliar y la forma del verbo se devuelven aparte para poder pintarlos
       con su color de rol y para poder decir QUÉ le pasó al verbo. */
    auxiliar: auxiliary || '',
    verbo: verbForm,
    cambio: getVerbChangeType(verbForm, verbo, tenseId),
  };
};

/** Una fila: el tiempo, para qué se usa, cuándo se ve, y sus tres formas. */
export const filaDeTiempo = (t, { sujeto, verbo, complemento = '' }) => ({
  id: t.id,
  nameEs: t.nameEs,
  nameEn: t.nameEn,
  descEs: t.descEs,
  descEn: t.descEn,
  cefr: t.cefr,
  unidad: t.unidad,
  timeType: t.timeType,
  /* Los marcadores ya existían por tiempo (chips junto al Complemento). Aquí
     valen el doble: son lo que el alumno busca de verdad en un ejercicio. */
  marcadores: getMarkersByTense(t.id).slice(0, 4),
  celdas: Object.fromEntries(MODOS.map(mode =>
    [mode, celdaDe({ sujeto, verbo, complemento, tenseId: t.id, mode })])),
});

/**
 * La tabla entera.
 * `nivel` (y opcionalmente `unidad`) la recortan a lo que el curso ya vio, con
 * el MISMO filtro que usa el selector de tiempos y la práctica (`estaVisto`).
 * Sin nivel, salen los diez.
 */
export const tablaDeTiempos = ({
  sujeto = 'she', verbo = 'work', complemento = '', nivel = null, unidad = null,
} = {}) => {
  const v = String(verbo || '').trim().toLowerCase() || 'work';
  const lista = nivel ? tenses.filter(t => estaVisto(t, nivel, unidad)) : tenses;
  return lista.map(t => filaDeTiempo(t, { sujeto, verbo: v, complemento }));
};
