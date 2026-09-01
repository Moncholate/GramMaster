import { describe, it, expect } from 'vitest';
import { formasDe, FILAS_DE_FORMAS, PATRONES, revisarVerbo } from './conjugador';
import { ALL_BASE_VERBS } from './conjugation';
import { VOCAB_CATEGORIA_DE } from './data/vocabulary.generated.js';
import { PHRASAL_VERB_LIST } from './data/phrasal.generated.js';
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

describe('el conjugador duda cuando hay que dudar', () => {
  /* Antes conjugaba cualquier cosa con la misma cara de certeza: «wrok» daba
     «wroked» y «went» daba «wented», que es justo la forma que el alumno estaba
     intentando no escribir. Lo vio el profesor. */

  it('un verbo del temario no dispara nada', () => {
    for (const v of ['work', 'go', 'be', 'study', 'cut', 'get up']) {
      expect(revisarVerbo(v), v).toMatchObject({ tipo: null, base: null });
    }
  });

  it('los 234 del pozo pasan en silencio', () => {
    /* La contraparte de todo aviso, y la que de verdad importa: un aviso que
       salta de más se aprende a ignorar en dos clases. Es la misma prueba que
       protege el aviso del constructor, aplicada a esta pantalla. */
    const ruidosos = ALL_BASE_VERBS.filter(v => revisarVerbo(v).tipo !== null);
    expect(ruidosos).toEqual([]);
  });

  it('una forma conjugada se reconoce y se dice de quién es', () => {
    expect(revisarVerbo('went')).toMatchObject({ tipo: 'conjugado', base: 'go', forma: 'pasado' });
    expect(revisarVerbo('studied')).toMatchObject({ tipo: 'conjugado', base: 'study', forma: 'pasado' });
    expect(revisarVerbo('working')).toMatchObject({ tipo: 'conjugado', base: 'work', forma: 'gerundio' });
    expect(revisarVerbo('sung')).toMatchObject({ tipo: 'conjugado', base: 'sing', forma: 'participio' });
    expect(revisarVerbo('goes')).toMatchObject({ tipo: 'conjugado', base: 'go', forma: 'tercera' });
  });

  it('CADA forma de CADA verbo del temario apunta a su base', () => {
    /* Lo que esto vigila es el caso «wented»: si una forma conjugada deja de
       reconocerse, el conjugador la trata como base y produce inglés inventado
       en la tarjeta y en las treinta celdas de la tabla. */
    const malos = [];
    for (const verbo of VERBOS_IRREGULARES_AVANZADO) {
      const f = formasDe(verbo);
      for (const campo of ['pasado', 'participio', 'gerundio', 'tercera']) {
        const escrito = f[campo].split('/')[0];
        if (escrito === verbo) continue;          // cut → cut: es la base, no hay nada que decir
        const r = revisarVerbo(escrito);
        if (r.tipo !== 'conjugado') malos.push(`${escrito} (${campo} de ${verbo}): tipo ${r.tipo}`);
      }
    }
    expect(malos).toEqual([]);
  });

  it('una errata se reconoce y se propone la palabra buena', () => {
    const wrok = revisarVerbo('wrok');
    expect(wrok.tipo).toBe('noEsVerbo');
    expect(wrok.sugerencias[0]).toBe('work');
    expect(revisarVerbo('writen').sugerencias[0]).toBe('write');
  });

  it('lo que no es un verbo se dice, aunque no haya nada que sugerir', () => {
    /* «somebody» en la casilla del verbo es un caso real de clase, no inventado:
       está en el porqué de `revisarVerboAntesDeGenerar`. */
    expect(revisarVerbo('somebody').tipo).toBe('noEsVerbo');
    expect(revisarVerbo('xyzzy').tipo).toBe('noEsVerbo');
  });

  it('lo vacío no dice nada, que es lo correcto', () => {
    for (const v of ['', '   ', null, undefined]) {
      expect(revisarVerbo(v), String(v)).toMatchObject({ tipo: null, sugerencias: [] });
    }
  });

  it('NUNCA bloquea: haya el aviso que haya, las formas siguen saliendo', () => {
    /* La regla del profesor, y es de las que se deshacen sin querer: el pozo es
       finito y un verbo legítimo que no esté en él no puede dejar a nadie sin
       poder trabajar. */
    for (const v of ['wrok', 'somebody', 'xyzzy', 'table']) {
      expect(formasDe(v), v).toBeTruthy();
      expect(formasDe(v).pasado, v).toBeTruthy();
    }
  });
});

describe('el pozo de verbos sale del temario, no de una lista paralela', () => {
  /* Medido el 1-sep-2026: catorce de los ochenta verbos del vocabulario del
     curso disparaban el aviso, porque `commonVerbs` era una lista escrita a mano
     que se había quedado atrás. Un aviso que salta en uno de cada seis verbos
     del propio temario se aprende a ignorar en dos clases, y entonces no queda
     ni el aviso ni la calma de no tenerlo. */
  /* SE MIRA EL VOCABULARIO QUE ESTA APP LLEVA, no el del repo de al lado. La
     primera versión leía `../../Grammar HUB/vocabulary.json` y tumbó el
     despliegue: en el CI de Grammaster solo está Grammaster, y la vecina no
     existe. Es la trampa que ya tenían los oráculos, y por eso ellos viven en
     otro sitio. Además así se prueba lo que de verdad se publica: si el sync no
     hubiera corrido, esto lo diría. */
  const verbosDelTemario = Object.keys(VOCAB_CATEGORIA_DE)
    .filter(p => VOCAB_CATEGORIA_DE[p].includes('verbo'));

  it('ningún verbo del temario dispara aviso', () => {
    const molestados = verbosDelTemario.filter(v => revisarVerbo(v).tipo);
    expect(molestados, `verbos del temario con aviso: ${molestados.join(', ')}`).toEqual([]);
    expect(verbosDelTemario.length).toBeGreaterThan(50);   // que la lista no se haya vaciado
  });

  it('ningún frasal del curso dispara aviso', () => {
    /* Los de varias palabras no son formas base: de ellos se encarga la lista de
       frasales, que es la del libro. Si uno de ellos avisara, la app estaría
       diciendo que «get up» está mal, que es falso. */
    const molestados = PHRASAL_VERB_LIST
      .map(p => p.join(' '))
      .filter(v => revisarVerbo(v).tipo);
    expect(molestados, `frasales con aviso: ${molestados.join(', ')}`).toEqual([]);
    expect(PHRASAL_VERB_LIST.length).toBeGreaterThan(30);
  });

  it('y lo que es verbo + complemento sigue avisándolo, con esas palabras', () => {
    /* «turn right» y «wait for» NO son falsos positivos: son un verbo y su
       complemento, y el aviso lo dice así — el mismo análisis que enseña
       Desgramatizador al pintar la oración. Ver $porQueWaitForNO en
       phrasal-verbs.json. */
    for (const v of ['turn right', 'wait for', 'go straight ahead']) {
      const r = revisarVerbo(v);
      expect(r.tipo, v).toBeTruthy();
      expect(r.aviso, v).toMatch(/complemento|complement/);
    }
  });

  it('el pozo incluye de verdad los que faltaban', () => {
    /* Los nueve que se midieron. Si alguien deshace la unión con el vocabulario,
       esto lo dice con nombres y no con un número. */
    for (const v of ['hike', 'pack', 'rent', 'arrive', 'close', 'repeat', 'shave', 'check', 'book']) {
      expect(revisarVerbo(v).tipo, v).toBe(null);
    }
  });

  it('y sigue diciendo que no a lo que no es un verbo', () => {
    /* La contraparte de agrandar el pozo: agrandarlo de más lo vuelve inútil. */
    for (const v of ['somebody', 'xyzzy', 'wrok']) {
      expect(revisarVerbo(v).tipo, v).toBe('noEsVerbo');
    }
  });
});
