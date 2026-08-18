/* AUTO-GENERATED from Grammar HUB/spelling-engine.js — do not edit.
   Regenerate: node scripts/sync-spelling.mjs (from Grammar HUB). */
/* ============================================================================
   Grammar Hub · motor de corrección ortográfica
   ----------------------------------------------------------------------------
   Lógica PURA y neutral al framework. No conoce ningún diccionario: recibe el
   suyo en cada llamada, porque cada app tiene el que le sirve. Se distribuye a
   cada app con scripts/sync-spelling.mjs (vanilla o React lo importan).

   Vivía dentro de Grammaster. Sube aquí porque Question Lab lo necesita, y
   copiarlo habría creado la segunda implementación que siempre acaba
   divergiendo — la lección que phrasal-verbs.json documenta en su cabecera:
   «dos implementaciones de la misma regla siempre divergen, y aquí ni siquiera
   había dos, había una y un hueco».

   ── Por qué Damerau y no Levenshtein ───────────────────────────────────────
   Levenshtein cuenta la TRANSPOSICIÓN como dos ediciones, así que «wrok» queda
   a distancia 2 de «work» — la misma que un montón de palabras sin relación —
   y ordenar por distancia deja de significar nada. Damerau la cuenta como una.

   Medido sobre el diccionario de Grammaster con los cuatro deslices típicos
   del pulgar, 120 palabras cada uno, acierto al primer intento:

       tecla vecina (wprk)      95%  →  95%
       transposición (wrok)     52%  →  89%
       omisión (wrk)            76%  →  76%
       letra doble (woork)     100%  → 100%

   La transposición era el agujero, y es justo el error de quien teclea rápido
   con el pulgar en el móvil. Ninguna otra categoría empeora.
   ============================================================================ */

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

/* Candidatos del diccionario a distancia 1 o 2, de menor a mayor. Devuelve []
   cuando no hay nada que proponer, lo que incluye el caso normal: la palabra ya
   está en el diccionario.

   Opciones:
     · diccionario  — array de palabras en minúscula. Obligatorio: el motor no
                      trae ninguno, cada app pasa el que le sirve. Question Lab
                      le pasa SOLO verbos cuando lo que falta es el verbo, que
                      es más certero que el diccionario entero.
     · categoriaDe  — mapa palabra → array de categorías. Opcional.
     · categoria    — la que pide el hueco ('adjetivo' detrás de `be`). Opcional.
     · max          — cuántas devolver (3 por defecto).

   La categoría SOLO DESEMPATA: ordena dentro de una misma distancia y nunca por
   encima de ella. No es una precaución teórica — medido sobre 469 erratas
   simuladas, el 0% de los fallos necesitaría adelantar a un candidato más
   cercano, así que un desempate que respeta la distancia no puede empeorar nada
   y uno que la pisara sí. Con el hueco pidiendo adjetivo, el acierto en erratas
   de adjetivo sube del 90% al 99%: «blck» daba «back» y ahora da «black». */
export const sugerenciasDe = (palabra, opciones = {}) => {
  const { diccionario = [], categoriaDe = null, categoria = null, max = 3 } = opciones;
  const w = String(palabra ?? '').toLowerCase();
  if (w.length < 2 || !diccionario.length) return [];

  const candidatos = [];
  for (const entrada of diccionario) {
    const d = damerauLevenshtein(w, entrada);
    if (d > 0 && d <= 2) {
      // 0 es mejor que 1: se ordena ascendente igual que la distancia.
      const encaja = categoria && categoriaDe && (categoriaDe[entrada] || []).includes(categoria) ? 0 : 1;
      candidatos.push({ palabra: entrada, d, encaja });
    }
  }
  candidatos.sort((a, b) =>
    a.d - b.d ||                          // la distancia manda siempre
    a.encaja - b.encaja ||                // luego el hueco: detrás de «be», un adjetivo
    a.palabra.localeCompare(b.palabra)    // y a igualdad, orden estable
  );
  return candidatos.slice(0, max).map(c => c.palabra);
};
