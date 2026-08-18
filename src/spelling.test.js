/* ============================================================================
   Pruebas de spelling.js
   ----------------------------------------------------------------------------
   Dos mitades, y la segunda es la que de verdad mide algo:

     1. Casos exactos de la distancia. Sirven para fijar el contrato y para que
        se vea de un vistazo qué cuenta como una edición y qué como dos.
     2. Un GENERADOR DE ERRATAS que hace de oráculo. Toma palabras correctas del
        diccionario, les aplica un desliz de teclado simulado y comprueba que el
        corrector recupere la original. Nadie escribe la expectativa: la
        respuesta correcta es, por construcción, la palabra de la que se partió.

   Es la misma idea que los arneses de paridad de la suite, aplicada a un módulo
   en vez de a dos apps. Y aquí el generador es especialmente honesto, porque el
   error que buscamos —el de un pulgar sobre un teclado táctil— tiene una forma
   conocida y reproducible.

   Los umbrales de abajo NO son aspiraciones: son el suelo medido al cambiar a
   Damerau, con un poco de margen. Si alguien vuelve a Levenshtein, la
   transposición cae al 52% y esto lo dice en voz alta en vez de degradarse en
   silencio.
   ============================================================================ */
import { describe, it, expect } from 'vitest';
import { damerauLevenshtein, getSpellingSuggestions } from './spelling';
import { englishDictionary } from './data/dictionary';

describe('damerauLevenshtein', () => {
  it('cuenta las ediciones básicas', () => {
    expect(damerauLevenshtein('work', 'work')).toBe(0);
    expect(damerauLevenshtein('work', 'work ')).toBe(1);   // inserción
    expect(damerauLevenshtein('work', 'wor')).toBe(1);     // borrado
    expect(damerauLevenshtein('work', 'wark')).toBe(1);    // sustitución
  });

  /* La razón de ser del módulo: con Levenshtein esto valdría 2 y «work» quedaba
     mezclada con cualquier palabra sin relación a esa misma distancia. */
  it('la transposición cuesta UNA edición, no dos', () => {
    expect(damerauLevenshtein('wrok', 'work')).toBe(1);
    expect(damerauLevenshtein('teh', 'the')).toBe(1);
    expect(damerauLevenshtein('sutdy', 'study')).toBe(1);
  });

  it('es simétrica y aguanta los bordes', () => {
    expect(damerauLevenshtein('wrok', 'work')).toBe(damerauLevenshtein('work', 'wrok'));
    expect(damerauLevenshtein('', 'work')).toBe(4);
    expect(damerauLevenshtein('', '')).toBe(0);
    expect(damerauLevenshtein(null, undefined)).toBe(0);
  });
});

describe('getSpellingSuggestions', () => {
  it('calla cuando la palabra está bien escrita', () => {
    expect(getSpellingSuggestions('work')).toEqual([]);
    expect(getSpellingSuggestions('study')).toEqual([]);
  });

  it('propone la palabra correcta ante una errata', () => {
    expect(getSpellingSuggestions('wrok')).toContain('work');
    expect(getSpellingSuggestions('stydy')).toContain('study');
  });

  it('no corrige nombres propios ni palabras de una letra', () => {
    expect(getSpellingSuggestions('a')).toEqual([]);
    expect(getSpellingSuggestions('Maria')).toEqual([]);
  });

  /* El caso real de clase: la alumna quiso «tall» y escribió «talk». Aquí no hay
     nada que decir, y está bien que así sea — «talk» es una palabra correcta.
     Se deja escrito para que nadie «arregle» el corrector intentando cazarlo:
     ese caso es de las validaciones por campo, que sí saben qué papel juega cada
     palabra, no de la distancia entre cadenas. */
  it('no inventa un error cuando el desliz da otra palabra válida', () => {
    expect(getSpellingSuggestions('talk')).toEqual([]);
  });
});

/* ── El generador de erratas ──────────────────────────────────────────────── */

// Vecinos reales de cada tecla en un QWERTY táctil, que es lo que produce el
// desliz del pulgar: no se falla contra una letra cualquiera, sino contra la de
// al lado.
const VECINAS = {
  q: 'wa',  w: 'qes',  e: 'wrd',  r: 'etf',  t: 'ryg',  y: 'tuh',  u: 'yij',
  i: 'uok', o: 'ipl',  p: 'ol',   a: 'qsz',  s: 'awdx', d: 'serfc', f: 'drtgv',
  g: 'ftyhb', h: 'gyujn', j: 'huikm', k: 'jiol', l: 'kop',
  z: 'asx', x: 'zsdc', c: 'xdfv', v: 'cfgb', b: 'vghn', n: 'bhjm', m: 'njk',
};

/* Se toca SIEMPRE la misma posición (el centro) en vez de una al azar: la
   prueba tiene que dar el mismo número en cada ejecución para que un umbral
   signifique algo. Un generador aleatorio haría parpadear la suite. */
const DESLICES = {
  'tecla vecina': (w, i) => {
    const v = VECINAS[w[i]];
    return v ? w.slice(0, i) + v[Math.floor(v.length / 2)] + w.slice(i + 1) : null;
  },
  'transposición': (w, i) => (i + 1 < w.length ? w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2) : null),
  'omisión': (w, i) => w.slice(0, i) + w.slice(i + 1),
  'letra doble': (w, i) => w.slice(0, i) + w[i] + w.slice(i),
};

// Suelo medido con Damerau, con margen. Con Levenshtein la transposición cae
// al 52%, así que este número es el que impide volver atrás sin enterarse.
const SUELO = {
  'tecla vecina': 90,
  'transposición': 85,
  'omisión': 70,
  'letra doble': 95,
};

const PALABRAS = englishDictionary
  .filter(w => w.length >= 4 && /^[a-z]+$/.test(w))
  .slice(0, 120);

describe('generador de erratas — el corrector recupera la palabra original', () => {
  it('hay material suficiente para que el porcentaje signifique algo', () => {
    expect(PALABRAS.length).toBeGreaterThanOrEqual(100);
  });

  for (const [nombre, desliz] of Object.entries(DESLICES)) {
    it(`${nombre}: acierta al primer intento en ≥${SUELO[nombre]}% de los casos`, () => {
      const fallos = [];
      let n = 0;
      for (const palabra of PALABRAS) {
        const errata = desliz(palabra, Math.floor(palabra.length / 2));
        if (!errata || errata === palabra) continue;
        n++;
        if (getSpellingSuggestions(errata)[0] !== palabra) fallos.push(`${palabra} → ${errata}`);
      }
      const acierto = Math.round((100 * (n - fallos.length)) / n);
      expect(acierto, `\n  ${nombre}: ${acierto}% (suelo ${SUELO[nombre]}%), ${fallos.length} de ${n} fallaron.` +
        `\n  Primeros: ${fallos.slice(0, 6).join(', ')}\n`).toBeGreaterThanOrEqual(SUELO[nombre]);
    });
  }

  /* Una errata SIEMPRE tiene que producir alguna sugerencia. Quedarse callado
     ante una palabra que no existe es el peor resultado: el alumno no se entera
     de nada y la app le da por buena una oración con una palabra inventada. */
  it('ninguna errata se queda sin sugerencias', () => {
    const mudas = [];
    for (const palabra of PALABRAS) {
      for (const desliz of Object.values(DESLICES)) {
        const errata = desliz(palabra, Math.floor(palabra.length / 2));
        if (!errata || errata === palabra) continue;
        // Si el desliz produjo OTRA palabra del diccionario, callar es correcto.
        if (englishDictionary.includes(errata)) continue;
        if (getSpellingSuggestions(errata).length === 0) mudas.push(`${palabra} → ${errata}`);
      }
    }
    expect(mudas, `\n  Sin sugerencia (${mudas.length}): ${mudas.slice(0, 10).join(', ')}\n`).toEqual([]);
  });
});
