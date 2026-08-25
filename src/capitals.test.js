// Mayúsculas: meses, días y nacionalidades.
//
// La regla existe porque el español y el inglés no coinciden ahí —enero vs
// January, chileno vs Chilean— y el libro lo enseña de frente: «January NOT
// january». No es que el alumno no sepa escribirlo, es que en su idioma va así.
//
// La mitad de este archivo son casos que NO se deben marcar. Es a propósito:
// el riesgo real de esta regla no es dejar pasar un error, es inventar uno.
// «She may work here» es correcto y `may` es un mes; una regla ingenua la
// convierte en «She May work here» y le dice a la alumna que su oración bien
// hecha está mal, en una app que enseña modales.
import { describe, it, expect } from 'vitest';
import { revisarMayusculas, corregirMayusculas, CAPS_CANONICO, CAPS_AMBIGUAS }
  from './data/capitals.generated.js';

const revisar = (t) => revisarMayusculas(t, { canonico: CAPS_CANONICO, ambiguas: CAPS_AMBIGUAS });
const marcadas = (t) => revisar(t).map(h => h.palabra);

describe('lo que SÍ se marca', () => {
  it('los meses sin ambigüedad', () => {
    for (const m of ['january', 'february', 'april', 'june', 'july',
                     'september', 'october', 'november', 'december']) {
      const h = revisar(`My birthday is in ${m}.`);
      expect(h.length, `no marcó «${m}»`).toBe(1);
      expect(h[0].sugerida).toBe(m[0].toUpperCase() + m.slice(1));
    }
  });

  it('los días de la semana', () => {
    for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      expect(marcadas(`I work on ${d}.`), `no marcó «${d}»`).toEqual([d]);
  });

  it('las nacionalidades y los idiomas', () => {
    expect(marcadas('She is chilean.')).toEqual(['chilean']);
    expect(marcadas('I speak spanish and english.')).toEqual(['spanish', 'english']);
  });

  it('propone la forma correcta, no solo señala', () => {
    const h = revisar('i study english in january');
    expect(corregirMayusculas('i study english in january', h)).toBe('i study English in January');
  });

  it('varias en la misma oración, cada una con su posición', () => {
    const t = 'She is japanese and works on monday.';
    const h = revisar(t);
    expect(h.map(x => x.palabra)).toEqual(['japanese', 'monday']);
    for (const x of h) expect(t.slice(x.indice, x.indice + x.palabra.length)).toBe(x.palabra);
  });
});

describe('lo que NO se marca — el lado caro de equivocarse', () => {
  /* EL CASO QUE JUSTIFICA TODA LA MAQUINARIA DE AMBIGUAS. `may` es un modal, y
     en esta app se usa muchísimo más que el mes. */
  it('«may» como modal se queda en paz', () => {
    expect(marcadas('She may work here.')).toEqual([]);
    expect(marcadas('may I help you?')).toEqual([]);
    expect(marcadas('It may rain tomorrow.')).toEqual([]);
  });

  it('«march» y «august» en su uso corriente tampoco', () => {
    expect(marcadas('The soldiers march every day.')).toEqual([]);
    expect(marcadas('an august decision')).toEqual([]);
  });

  it('pero las ambiguas SÍ se marcan cuando hay prueba de que son el mes', () => {
    expect(marcadas('I was born in may.')).toEqual(['may']);
    expect(marcadas('We travel in march.')).toEqual(['march']);
    expect(marcadas('It happened last august.')).toEqual(['august']);
    expect(marcadas('march 5 is the day.')).toEqual(['march']);
  });

  it('la palabra ya correcta no se toca', () => {
    expect(marcadas('My birthday is in January.')).toEqual([]);
    expect(marcadas('She is Chilean.')).toEqual([]);
  });

  it('todo en mayúsculas no es este error', () => {
    // «JANUARY» está gritando, pero la capital está puesta. Marcarlo sería ruido
    // sobre algo que la regla no viene a enseñar.
    expect(marcadas('MY BIRTHDAY IS IN JANUARY')).toEqual([]);
  });

  it('las palabras corrientes no se tocan aunque se parezcan', () => {
    expect(marcadas('I want to work and study here.')).toEqual([]);
    expect(marcadas('')).toEqual([]);
    expect(revisarMayusculas(null, { canonico: CAPS_CANONICO })).toEqual([]);
  });

  /* Los países están en el vocabulario CON mayúscula y aun así quedan fuera: el
     español también los capitaliza, así que no hay interferencia que corregir, y
     entrarían homógrafos (turkey el ave, china la porcelana) a cambio de nada. */
  it('los países quedan fuera de la regla, a propósito', () => {
    expect(marcadas('I live in chile.')).toEqual([]);
    expect(marcadas('I ate turkey and bought china.')).toEqual([]);
  });
});

describe('la lista y el diccionario ven el mismo mundo', () => {
  /* Si un mes estuviera en la regla pero no en el vocabulario, el corrector
     ortográfico marcaría «January» como errata justo después de que esta regla
     le pidiera al alumno escribirlo así. Dos avisos contradictorios sobre la
     misma palabra es peor que ninguno. */
  it('todo lo que la regla exige está en el diccionario', async () => {
    const { VOCAB_PALABRAS } = await import('./data/vocabulary.generated.js');
    const dic = new Set(VOCAB_PALABRAS.map(p => p.toLowerCase()));
    const fuera = Object.keys(CAPS_CANONICO).filter(p => !dic.has(p));
    expect(fuera, `la regla exige mayúscula en palabras que el corrector no conoce: ${fuera.join(', ')}`)
      .toEqual([]);
  });

  /* `conjugation.js` tenía su PROPIA lista para capitalizar la oración generada
     y ya se habían separado: capitalizaba `italian` y `colombian`, que el aviso
     no conocía, y NO capitalizaba `turkish`, `irish`, `thai` y diez más, que el
     aviso sí marcaba. O sea que la app le pedía al alumno una mayúscula y luego
     generaba la oración sin ella. Ahora las dos salen de `CAPS_CANONICO`. */
  it('lo que el aviso pide, la oración generada lo escribe', async () => {
    const { smartCase } = await import('./conjugation.js');
    for (const p of Object.keys(CAPS_CANONICO)) {
      if (CAPS_AMBIGUAS.includes(p)) continue;   // esas piden contexto, ver abajo
      expect(smartCase(p), `«${p}» se avisa pero no se capitaliza al generar`)
        .toBe(CAPS_CANONICO[p]);
    }
  });

  it('las ambiguas las decide el contexto también al generar', async () => {
    const { smartCase } = await import('./conjugation.js');
    // Antes se capitalizaban a ciegas y salía «the March».
    expect(smartCase('the march')).toBe('the march');
    expect(smartCase('in march')).toBe('in March');
    expect(smartCase('she may')).toBe('she may');
    expect(smartCase('in may')).toBe('in May');
  });

  /* «North America» se partía en palabras y `north` acababa exigiendo mayúscula
     por su cuenta: «go south» salía marcado como error. Una oración correcta
     señalada como incorrecta es el fallo caro. */
  it('las direcciones no exigen mayúscula', () => {
    for (const d of ['north', 'south', 'east', 'west'])
      expect(CAPS_CANONICO[d], `«${d}» no debería exigir mayúscula`).toBeUndefined();
    expect(marcadas('go south and turn left')).toEqual([]);
    expect(marcadas('the north wind')).toEqual([]);
  });

  it('«may» sigue declarada como ambigua', () => {
    // Cerrojo explícito: si alguien la saca de la lista, este test cae antes de
    // que la app empiece a corregir modales.
    expect(CAPS_AMBIGUAS).toContain('may');
  });
});
