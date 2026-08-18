/* ============================================================================
   Corrección ortográfica · lógica pura, sin React ni DOM
   ----------------------------------------------------------------------------
   Sale de App.jsx por la regla de siempre: se extrae cuando hay otra razón para
   tocar el archivo, no en una sesión de refactor. La razón fue cambiar la
   distancia a Damerau, y de paso queda con pruebas y en condiciones de que
   Question Lab la use — hoy no tiene corrector y ante una errata responde
   «pregunta incompleta», que es decirle al alumno que le falta una pieza cuando
   lo que hay es una letra cambiada.

   ── Por qué Damerau y no Levenshtein ───────────────────────────────────────
   Levenshtein cuenta la TRANSPOSICIÓN como dos ediciones, así que «wrok» queda
   a distancia 2 de «work» — la misma que un montón de palabras sin relación — y
   el orden por distancia deja de significar nada. Damerau la cuenta como una.

   Medido sobre este mismo diccionario, con los cuatro deslices típicos del
   pulgar aplicados a 120 palabras (acierto al primer intento):

       tecla vecina (wprk)      95%  →  95%
       transposición (wrok)     52%  →  89%
       omisión (wrk)            76%  →  76%
       letra doble (woork)     100%  → 100%
       ─────────────────────────────────────
       total                    81%  →  90%

   La transposición era el agujero, y es justo el error de quien teclea rápido
   con el pulgar en el móvil. Ninguna otra categoría empeora.

   ── Lo que esto NO resuelve ────────────────────────────────────────────────
   Solo ve palabras que no existen. Cuando el desliz produce OTRA palabra válida
   —«tall» → «talk», visto en clase— aquí no hay nada que detectar: «talk» está
   en el diccionario y la función calla, como debe. Ese caso necesita contexto,
   y de eso se encargan las validaciones por campo de data/validation.js, que
   sí saben qué papel juega cada palabra.
   ============================================================================ */
import { englishDictionary } from './data/dictionary';
import { hispanicNames, looksLikeValidWord } from './data/validation';
import { VOCAB_PALABRAS, VOCAB_CATEGORIA_DE } from './data/vocabulary.generated.js';

/* El diccionario es la UNIÓN de la lista de siempre y el vocabulario del libro,
   y la unión es TODO el libro: todos los niveles y todas las unidades. Nunca se
   recorta por la unidad del alumno. Si se recortara, una palabra correcta de una
   unidad posterior —aprendida por su cuenta, oída en una canción— saldría
   marcada como error, que es decirle que su trabajo bien hecho está mal. */
export const DICCIONARIO = [...new Set([...englishDictionary, ...VOCAB_PALABRAS])];

/* La distancia y el ordenador de candidatos viven en Grammar HUB
   (spelling-engine.js) y llegan generados, porque Question Lab los necesita
   también: allí una errata hacía que la app dijera «te falta el verbo» con el
   verbo delante. Copiarlos habría creado la segunda implementación que siempre
   diverge — la lección de los frasales.

   Lo que se queda aquí es lo que SÍ es de Grammaster: su diccionario y sus
   guardias de nombres propios. */
export { damerauLevenshtein } from './data/spelling.generated.js';
import { sugerenciasDe } from './data/spelling.generated.js';

/* Hasta tres candidatos del diccionario a distancia 1 o 2, de menor a mayor.
   Devuelve [] cuando no hay nada que corregir, que incluye el caso normal: la
   palabra está bien escrita.

   `contexto` es opcional y SOLO DESEMPATA: ordena DENTRO de una misma distancia,
   nunca por encima de ella. No es una precaución teórica — medido sobre 469
   erratas simuladas, el 0% de los fallos necesitaría adelantar a un candidato
   más cercano, así que un desempate que respeta la distancia no puede empeorar
   nada y uno que la pisara sí.

     · categoria — la que pide el hueco: 'adjetivo' detrás de `be`, por ejemplo.

   Medido sobre las erratas de adjetivo del banco, con el hueco pidiendo
   adjetivo: 90% → 99% de acierto al primer intento. Los casos que gana son
   precisamente los que confundían de categoría — «blck» daba «back» y ahora da
   «black»; «fats» daba «cats» y ahora «fast»; «ugy» daba «guy» y ahora «ugly».

   NO hay criterio de unidad, y no es un olvido. vocabulary.json trae la unidad
   de cada palabra y se probó como tercer desempate: neutral en todas las
   mediciones (98% → 98%, cero casos ganados y cero perdidos), porque para
   entonces la categoría ya ha ordenado lo que había que ordenar. Un criterio que
   no mueve nada solo añade algo que razonar, así que se queda fuera hasta que
   haya evidencia de que sirve. El dato sigue en vocabulary.json: volver a
   probarlo es una línea. */
export const getSpellingSuggestions = (word, contexto = {}) => {
  if (!word || word.length < 2) return [];

  const lowerWord = word.toLowerCase();
  const normalizedWord = lowerWord.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Si la palabra está en el diccionario, no hay error
  if (DICCIONARIO.includes(lowerWord)) return [];

  // Nombres propios (hispanos conocidos, o cualquier palabra capitalizada
  // con estructura razonable) no se corrigen — mismo criterio que validateSubject
  if (hispanicNames.includes(lowerWord) || hispanicNames.includes(normalizedWord)) return [];
  if (/^[A-ZÁÉÍÓÚÑ]/.test(word) && looksLikeValidWord(lowerWord)) return [];

  return sugerenciasDe(lowerWord, {
    diccionario: DICCIONARIO,
    categoriaDe: VOCAB_CATEGORIA_DE,
    categoria: contexto.categoria ?? null,
  });
};
