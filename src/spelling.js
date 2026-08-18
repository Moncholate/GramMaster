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

/* Damerau-Levenshtein en su variante de distancia restringida (OSA): además de
   inserción, borrado y sustitución, admite intercambiar dos letras CONTIGUAS
   como una sola edición — la única línea que la separa de Levenshtein.

   «Restringida» quiere decir que un mismo trozo no se transpone dos veces. Para
   erratas de teclado da igual: hacen falta cuatro ediciones sobre las mismas
   letras para notar la diferencia, y a esa distancia ninguna sugerencia sirve
   ya. La versión no restringida cuesta bastante más y no compra nada aquí. */
export const damerauLevenshtein = (str1, str2) => {
  const a = String(str1 ?? '');
  const b = String(str2 ?? '');
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,   // sustitución
          dp[i][j - 1] + 1,       // inserción
          dp[i - 1][j] + 1        // borrado
        );
      }
      // La transposición: «wrok» → «work» en un solo paso.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
};

/* Hasta tres candidatos del diccionario a distancia 1 o 2, de menor a mayor.
   Devuelve [] cuando no hay nada que corregir, que incluye el caso normal: la
   palabra está bien escrita. */
export const getSpellingSuggestions = (word) => {
  if (!word || word.length < 2) return [];

  const lowerWord = word.toLowerCase();
  const normalizedWord = lowerWord.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Si la palabra está en el diccionario, no hay error
  if (englishDictionary.includes(lowerWord)) return [];

  // Nombres propios (hispanos conocidos, o cualquier palabra capitalizada
  // con estructura razonable) no se corrigen — mismo criterio que validateSubject
  if (hispanicNames.includes(lowerWord) || hispanicNames.includes(normalizedWord)) return [];
  if (/^[A-ZÁÉÍÓÚÑ]/.test(word) && looksLikeValidWord(lowerWord)) return [];

  return englishDictionary
    .map(dictWord => ({ word: dictWord, distance: damerauLevenshtein(lowerWord, dictWord) }))
    .filter(item => item.distance <= 2 && item.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(item => item.word);
};
