/* ============================================================================
   LA TABLA DE TIEMPOS
   ----------------------------------------------------------------------------
   Lo que se prueba aquí no es «que salga bonito», sino las dos promesas que
   hacen que la tabla sirva:

     1. Que cada celda sea EXACTAMENTE lo que el constructor genera. Si alguien
        escribe una forma a mano en la vista, esto se pone en rojo.
     2. Que el recorte por curso sea el mismo que el del selector de tiempos y
        el de la práctica (`estaVisto`), y no un filtro paralelo. Dos filtros
        para la misma pregunta es la forma segura de que uno se quede atrás —ya
        pasó con el modo repaso—.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import { tablaDeTiempos, celdaDe, MODOS } from './tablaTiempos';
import { buildSentenceText } from './conjugation';
import { tenses } from './data/grammar';

describe('la tabla sale del motor, no de una copia', () => {
  it('cada celda es la oración que generaría el constructor', () => {
    for (const sujeto of ['I', 'she', 'they']) {
      for (const verbo of ['work', 'go', 'study']) {
        for (const fila of tablaDeTiempos({ sujeto, verbo })) {
          for (const mode of MODOS) {
            const esperada = buildSentenceText({
              mode, subject: sujeto, verb: verbo, complement: '',
              tense: fila.id, modal: '', whWord: '', whExtension: '', adverb: '',
            });
            expect(fila.celdas[mode].frase, `${sujeto} · ${verbo} · ${fila.id} · ${mode}`).toBe(esperada);
          }
        }
      }
    }
  });

  it('la frase contiene sus propias piezas: el auxiliar y la forma del verbo', () => {
    for (const fila of tablaDeTiempos({ sujeto: 'she', verbo: 'work' })) {
      for (const mode of MODOS) {
        const c = fila.celdas[mode];
        expect(c.frase.toLowerCase(), `${fila.id} · ${mode}`).toContain(c.verbo.toLowerCase());
        if (c.auxiliar) {
          /* En interrogativa el auxiliar se parte («Have she been…» no existe:
             va «Has she been working?»), así que se comprueba su primera palabra. */
          expect(c.frase.toLowerCase(), `${fila.id} · ${mode}`).toContain(c.auxiliar.split(' ')[0].toLowerCase());
        }
      }
    }
  });
});

describe('lo que la tabla enseña', () => {
  const porId = (filas) => Object.fromEntries(filas.map(f => [f.id, f]));

  it('la marca se muda al auxiliar: en + la lleva el verbo, en − y ? la lleva el auxiliar', () => {
    const t = porId(tablaDeTiempos({ sujeto: 'she', verbo: 'work' }));
    const ps = t['simple-present'];
    expect(ps.celdas.affirmative).toMatchObject({ auxiliar: '', verbo: 'works', cambio: 'third-person-s' });
    expect(ps.celdas.negative).toMatchObject({ verbo: 'work', cambio: 'base' });
    expect(ps.celdas.interrogative).toMatchObject({ verbo: 'work', cambio: 'base' });
    expect(ps.celdas.negative.auxiliar).toMatch(/does/i);
    expect(ps.celdas.interrogative.auxiliar).toMatch(/does/i);

    // El pasado hace lo mismo: worked → did + work
    const pas = t['simple-past'];
    expect(pas.celdas.affirmative).toMatchObject({ auxiliar: '', verbo: 'worked' });
    expect(pas.celdas.negative).toMatchObject({ verbo: 'work', cambio: 'base' });
  });

  it('el sujeto cambia el auxiliar, que es la otra mitad de la dificultad', () => {
    const ella = porId(tablaDeTiempos({ sujeto: 'she', verbo: 'work' }));
    const ellos = porId(tablaDeTiempos({ sujeto: 'they', verbo: 'work' }));
    expect(ella['present-perfect'].celdas.affirmative.auxiliar).toBe('has');
    expect(ellos['present-perfect'].celdas.affirmative.auxiliar).toBe('have');
    expect(ella['present-continuous'].celdas.affirmative.auxiliar).toBe('is');
    expect(ellos['present-continuous'].celdas.affirmative.auxiliar).toBe('are');
  });

  it('con un irregular la columna del cambio deja de ser decorativa', () => {
    const t = porId(tablaDeTiempos({ sujeto: 'she', verbo: 'go' }));
    expect(t['simple-past'].celdas.affirmative.verbo).toBe('went');
    expect(t['present-perfect'].celdas.affirmative.verbo).toBe('gone');
  });

  it('cada fila trae su uso y sus marcadores', () => {
    for (const fila of tablaDeTiempos({})) {
      expect(fila.descEs, fila.id).toBeTruthy();
      expect(fila.descEn, fila.id).toBeTruthy();
      expect(Array.isArray(fila.marcadores), fila.id).toBe(true);
    }
  });
});

describe('el recorte por curso', () => {
  it('sin nivel salen los diez, en el orden en que se enseñan', () => {
    const filas = tablaDeTiempos({});
    expect(filas.map(f => f.id)).toEqual(tenses.map(t => t.id));
  });

  it('es acumulativo: un curso trae lo suyo y todo lo anterior', () => {
    const ids = (nivel) => tablaDeTiempos({ nivel }).map(f => f.id);
    const b1 = ids('basico1'), i1 = ids('intermedio1'), todos = ids('avanzado');
    expect(b1).toContain('simple-present');
    expect(b1).not.toContain('present-perfect');
    for (const id of b1) expect(i1, `${id} debería seguir en intermedio1`).toContain(id);
    expect(i1).toContain('past-continuous');      // lo nuevo de intermedio1
    expect(i1).toContain('simple-future');
    expect(i1).not.toContain('past-perfect');     // eso es intermedio2
    expect(todos.length).toBe(tenses.length);
  });

  it('respeta la unidad, no solo el curso', () => {
    /* Pasado Continuo es la 2B de intermedio1: en la 1A todavía no toca. */
    expect(tablaDeTiempos({ nivel: 'intermedio1', unidad: '1A' }).map(f => f.id)).not.toContain('past-continuous');
    expect(tablaDeTiempos({ nivel: 'intermedio1', unidad: '2B' }).map(f => f.id)).toContain('past-continuous');
  });
});

describe('bordes', () => {
  it('sin verbo se cae a «work» en vez de romperse', () => {
    expect(tablaDeTiempos({ verbo: '   ' })[0].celdas.affirmative.frase).toMatch(/work/i);
  });

  it('celdaDe sirve suelta, para una fila sola', () => {
    const c = celdaDe({ sujeto: 'he', verbo: 'study', tenseId: 'simple-present', mode: 'negative' });
    expect(c.auxiliar).toMatch(/doesn't/i);
    expect(c.verbo).toBe('study');
  });
});
