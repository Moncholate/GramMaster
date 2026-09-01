import { describe, it, expect } from 'vitest';
import { formasDe, FILAS_DE_FORMAS, PATRONES } from './conjugador';
import { irregularVerbs } from './data/verbs';
import { VERBOS_IRREGULARES_AVANZADO } from './data/grammar';

describe('las formas de un verbo', () => {
  it('un regular reparte sus formas como manda la regla del -ed', () => {
    expect(formasDe('work')).toMatchObject({
      infinitivo: 'to work', base: 'work', tercera: 'works',
      pasado: 'worked', gerundio: 'working', participio: 'worked',
      irregular: false, patron: 'regular',
    });
  });

  it('las reglas de escritura salen del motor y no de una lista aparte', () => {
    /* Cada una es una regla distinta, y son las que el alumno falla al escribir:
       la -y, la duplicación de la consonante, la -e muda, la -es. */
    expect(formasDe('study')).toMatchObject({ tercera: 'studies', pasado: 'studied', gerundio: 'studying' });
    expect(formasDe('stop')).toMatchObject({ pasado: 'stopped', gerundio: 'stopping' });
    expect(formasDe('make')).toMatchObject({ gerundio: 'making' });
    expect(formasDe('watch')).toMatchObject({ tercera: 'watches' });
    expect(formasDe('go')).toMatchObject({ tercera: 'goes' });
    expect(formasDe('die')).toMatchObject({ gerundio: 'dying' });
  });

  it('el patrón distingue los tres tipos de irregular, que es lo que se memoriza', () => {
    expect(formasDe('cut')).toMatchObject({ pasado: 'cut', participio: 'cut', patron: 'tres-iguales' });
    expect(formasDe('buy')).toMatchObject({ pasado: 'bought', participio: 'bought', patron: 'dos-iguales' });
    expect(formasDe('go')).toMatchObject({ pasado: 'went', participio: 'gone', patron: 'tres-distintas' });
  });

  it('un verbo de dos palabras conjuga la CABEZA, y la partícula viaja detrás', () => {
    /* El fallo que esto vigila es «She get ups» / «get upped»: si alguien vuelve
       a conjugar la última palabra, estas tres se caen a la vez. */
    expect(formasDe('get up')).toMatchObject({
      base: 'get up', tercera: 'gets up', pasado: 'got up',
      gerundio: 'getting up', participio: 'gotten up',
      nucleo: 'get', particula: 'up',
    });
    /* Y el patrón se mide sobre la cabeza: comparar las cadenas enteras daría lo
       mismo, pero por casualidad — la partícula está en las tres. */
    expect(formasDe('get up').patron).toBe(formasDe('get').patron);
    expect(formasDe('look for').patron).toBe('regular');
  });

  it('«be» avisa de que su pasado se reparte, en vez de dejar un «was/were» que parece errata', () => {
    const be = formasDe('be');
    expect(be.pasado).toContain('/');
    expect(be.pasadoDoble).toBe(true);
    expect(be.gerundio).toBe('being');
    expect(be.tercera).toBe('is');
    /* Y ningún otro verbo del temario reparte su pasado: si algún día otro lo
       hace, hay que decidirlo a propósito y no descubrirlo en clase. */
    const otros = VERBOS_IRREGULARES_AVANZADO.filter(v => formasDe(v).pasadoDoble);
    expect(otros).toEqual([]);
  });

  it('lo que no es un verbo no revienta', () => {
    expect(formasDe('')).toBe(null);
    expect(formasDe('   ')).toBe(null);
    expect(formasDe(null)).toBe(null);
    expect(formasDe(undefined)).toBe(null);
    expect(formasDe('  WORK  ')).toMatchObject({ base: 'work', pasado: 'worked' });
    expect(formasDe('get   up')).toMatchObject({ base: 'get up' });
  });
});

describe('las formas no se desvían del motor, en TODO el temario', () => {
  /* La prueba que de verdad protege esto. Una lista de formas escrita aparte se
     desvía en silencio: el alumno ve una cosa en el conjugador y otra al
     practicar, y nadie lo nota hasta que alguien lo dice en clase. Aquí se
     recorre la tabla de irregulares entera. */
  it('cada irregular del libro sale con las formas que el libro le da', () => {
    const malos = [];
    for (const [verbo, esperado] of Object.entries(irregularVerbs)) {
      const f = formasDe(verbo);
      if (f.pasado !== esperado.past) malos.push(`${verbo}: pasado ${f.pasado} ≠ ${esperado.past}`);
      if (f.participio !== esperado.participle) malos.push(`${verbo}: participio ${f.participio} ≠ ${esperado.participle}`);
      if (!f.irregular) malos.push(`${verbo}: no se reconoció como irregular`);
    }
    expect(malos).toEqual([]);
  });

  it('todo verbo del temario cae en uno de los cuatro patrones, y ninguno queda sin forma', () => {
    const malos = [];
    for (const verbo of VERBOS_IRREGULARES_AVANZADO) {
      const f = formasDe(verbo);
      if (!PATRONES.includes(f.patron)) malos.push(`${verbo}: patrón «${f.patron}»`);
      for (const campo of ['infinitivo', 'base', 'tercera', 'pasado', 'gerundio', 'participio']) {
        if (!f[campo]) malos.push(`${verbo}: sin ${campo}`);
      }
      /* Un irregular NUNCA puede salir con patrón «regular»: sería decirle al
         alumno que le ponga -ed a un verbo que no lo lleva. */
      if (f.patron === 'regular') malos.push(`${verbo}: irregular con patrón regular`);
    }
    expect(malos).toEqual([]);
  });
});

describe('las cinco formas que se muestran, y su nombre', () => {
  it('son las CINCO que pidió el profesor, en su orden', () => {
    /* Ni más ni menos. La 3.ª persona se quitó a propósito —no es una de las
       formas principales y la fila del Presente Simple ya la muestra— y volver a
       meterla sin que él lo pida es deshacer una decisión suya. */
    expect(FILAS_DE_FORMAS.map(f => f.id)).toEqual(
      ['base', 'infinitivo', 'gerundio', 'pasado', 'participio']);
  });

  it('cada una lleva nombre en los dos idiomas y NADA más', () => {
    /* El «nada más» es la prueba de verdad: las explicaciones debajo de cada
       forma se probaron y el profesor las quitó. Si alguien las repone, esto lo
       dice antes de que llegue a una clase. */
    for (const fila of FILAS_DE_FORMAS) {
      expect(Object.keys(fila).sort(), fila.id).toEqual(['en', 'es', 'id']);
    }
  });

  it('cada fila apunta a un campo que formasDe devuelve de verdad', () => {
    const f = formasDe('work');
    for (const fila of FILAS_DE_FORMAS) expect(f[fila.id], fila.id).toBeTruthy();
  });

  it('los nombres son los que se usan también en la tabla de abajo', () => {
    /* Un solo vocabulario para toda la pantalla: si la tarjeta dice «pasado
       participio» y la celda dice otra cosa, el alumno cree que son dos. */
    const nombres = FILAS_DE_FORMAS.map(f => f.es);
    expect(nombres).toContain('Pasado simple');
    expect(nombres).toContain('Pasado participio');
    expect(nombres).toContain('Gerundio');
    expect(nombres).toContain('Base');
  });
});
