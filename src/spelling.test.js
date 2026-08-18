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
import { damerauLevenshtein, getSpellingSuggestions, DICCIONARIO } from './spelling';
import { VOCAB_CATEGORIA_DE } from './data/vocabulary.generated.js';

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

/* Suelos medidos, con margen. Se comprueban DOS cosas y la segunda importa más:
   la app enseña hasta tres sugerencias, así que lo que decide si el alumno se
   desatasca es el top-3, no el top-1.

   Los números bajaron cuando el diccionario pasó de 285 palabras a 620 al
   incorporar el vocabulario del libro. NO es una regresión, es el precio
   correcto: con más palabras hay más candidatos a distancia 1, así que el
   primero acierta menos, pero a cambio muchísimas menos palabras correctas se
   marcan como errata. El top-3 apenas se movió, que es lo que se nota en
   pantalla.

   El de transposición sigue siendo el centinela de Damerau: con Levenshtein cae
   al 52% y esta prueba lo dice en voz alta en vez de degradarse en silencio. */
const SUELO = {
  'tecla vecina':  { top1: 85, top3: 95 },
  'transposición': { top1: 90, top3: 95 },
  'omisión':       { top1: 60, top3: 90 },
  'letra doble':   { top1: 95, top3: 95 },
};

const PALABRAS = DICCIONARIO
  .filter(w => w.length >= 4 && /^[a-z]+$/.test(w))
  .slice(0, 120);

describe('generador de erratas — el corrector recupera la palabra original', () => {
  it('hay material suficiente para que el porcentaje signifique algo', () => {
    expect(PALABRAS.length).toBeGreaterThanOrEqual(100);
  });

  for (const [nombre, desliz] of Object.entries(DESLICES)) {
    it(`${nombre}: ≥${SUELO[nombre].top1}% a la primera, ≥${SUELO[nombre].top3}% entre las tres`, () => {
      const fallosTop1 = [], fallosTop3 = [];
      let n = 0;
      for (const palabra of PALABRAS) {
        const errata = desliz(palabra, Math.floor(palabra.length / 2));
        if (!errata || errata === palabra || DICCIONARIO.includes(errata)) continue;
        n++;
        const sugerencias = getSpellingSuggestions(errata);
        if (sugerencias[0] !== palabra) fallosTop1.push(`${palabra} → ${errata}`);
        if (!sugerencias.includes(palabra)) fallosTop3.push(`${palabra} → ${errata} (dio ${sugerencias.join('/') || 'nada'})`);
      }
      const top1 = Math.round((100 * (n - fallosTop1.length)) / n);
      const top3 = Math.round((100 * (n - fallosTop3.length)) / n);

      expect(top3, `\n  ${nombre} top-3: ${top3}% (suelo ${SUELO[nombre].top3}%), ${fallosTop3.length} de ${n}.` +
        `\n  Primeros: ${fallosTop3.slice(0, 6).join(', ')}\n`).toBeGreaterThanOrEqual(SUELO[nombre].top3);
      expect(top1, `\n  ${nombre} top-1: ${top1}% (suelo ${SUELO[nombre].top1}%), ${fallosTop1.length} de ${n}.` +
        `\n  Primeros: ${fallosTop1.slice(0, 6).join(', ')}\n`).toBeGreaterThanOrEqual(SUELO[nombre].top1);
    });
  }

  /* El desempate por categoría, medido donde sirve: erratas de adjetivo cuando
     el hueco pide un adjetivo (detrás de `be`). Sin la categoría, la sugerencia
     confunde de clase de palabra —«blck» daba «back», «fats» daba «cats»— y el
     alumno recibe algo que ni siquiera cabe en la casilla que está llenando. */
  it('la categoría del hueco mejora las sugerencias, sin pisar la distancia', () => {
    const adjetivos = Object.entries(VOCAB_CATEGORIA_DE)
      .filter(([w, cats]) => cats.includes('adjetivo') && w.length >= 4)
      .map(([w]) => w);
    expect(adjetivos.length).toBeGreaterThanOrEqual(20);

    let n = 0, sin = 0, con = 0;
    for (const palabra of adjetivos) {
      for (const desliz of Object.values(DESLICES)) {
        const errata = desliz(palabra, Math.floor(palabra.length / 2));
        if (!errata || errata === palabra || DICCIONARIO.includes(errata)) continue;
        n++;
        if (getSpellingSuggestions(errata)[0] === palabra) sin++;
        if (getSpellingSuggestions(errata, { categoria: 'adjetivo' })[0] === palabra) con++;
      }
    }
    const pSin = Math.round((100 * sin) / n), pCon = Math.round((100 * con) / n);
    expect(pCon, `\n  con categoría ${pCon}% vs sin categoría ${pSin}% sobre ${n} casos.` +
      `\n  Si esto deja de mejorar, el desempate ya no se gana su sitio y sobra.\n`).toBeGreaterThan(pSin);
  });

  /* Casos concretos, para que se vea qué gana y no solo un porcentaje. */
  it('los casos que gana la categoría', () => {
    expect(getSpellingSuggestions('blck', { categoria: 'adjetivo' })[0]).toBe('black');
    expect(getSpellingSuggestions('smll', { categoria: 'adjetivo' })[0]).toBe('small');
    expect(getSpellingSuggestions('ugy',  { categoria: 'adjetivo' })[0]).toBe('ugly');
  });

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
        if (DICCIONARIO.includes(errata)) continue;
        if (getSpellingSuggestions(errata).length === 0) mudas.push(`${palabra} → ${errata}`);
      }
    }
    expect(mudas, `\n  Sin sugerencia (${mudas.length}): ${mudas.slice(0, 10).join(', ')}\n`).toEqual([]);
  });
});
