import { describe, it, expect } from 'vitest';
import {
  tenses, modals, COURSE_ORDER, UNIDADES_POR_CURSO, unidadIndice,
  CONDICIONALES_POR_CURSO, estaVisto, VERBOS_REGULARES, VERBOS_REGULARES_AMPLIA, VERBOS_IRREGULARES, VERBOS_IRREGULARES_BASICO, VERBOS_IRREGULARES_INTERMEDIO, VERBOS_IRREGULARES_AVANZADO,
  COMPLEMENTO_DE_VERBO, VERBOS_CON_ADVERBIAL_LIBRE, VERBOS_FUERA_DE_PRACTICA, COMPLEMENTOS_TIEMPO,
  unidadPorRevisar, DIAS_REVISION,
} from './data/grammar';
import { irregularVerbs } from './data/verbs';
import { simplePast, pastParticiple, conjugate3p, presentParticiple } from './conjugation';

/* La práctica corrige y puntúa, así que no puede preguntar por contenido que la
   clase todavía no ha visto: la racha y las insignias castigarían al alumno por
   no saber algo que nadie le enseñó. Estas pruebas fijan el temario que decide
   qué está disponible cuándo. Las unidades salen de `Grammar HUB/syllabus-aef.md`
   y las listas de verbos de la página 133 del libro, aportada por el profesor. */

const tope = (u) => (u ? unidadIndice(u) : Infinity);
const disponible = (item, nivel, u) => {
  const k = COURSE_ORDER.indexOf(item.cefr), a = COURSE_ORDER.indexOf(nivel);
  if (k < a) return true;
  if (k > a) return false;
  return unidadIndice(item.unidad) <= tope(u)
      || (item.unidadBe != null && unidadIndice(item.unidadBe) <= tope(u));
};

describe('orden de unidades', () => {
  it('«10A» va DESPUÉS de «9B» (comparar como texto daría al revés)', () => {
    expect(unidadIndice('10A')).toBeGreaterThan(unidadIndice('9B'));
    expect('10A' > '9B').toBe(false);   // la trampa que esto evita
  });
  it('sin unidad = disponible desde el principio del curso', () => {
    expect(unidadIndice(null)).toBe(-1);
  });
  it('`would` y `could` salen de Practical English, y ahí también hay orden', () => {
    /* No están en la columna de gramática del temario, así que estuvieron sin
       unidad: disponibles desde la clase 1 de su curso. El docente dio dónde
       caen (2026-08-08) y `would` además estaba un curso y medio tarde. */
    const would = modals.find(m => m.id === 'would');
    expect([would.cefr, would.unidad]).toEqual(['basico2', '10A']);   // tras la 9B
    const could = modals.find(m => m.id === 'could');
    expect([could.cefr, could.unidad]).toEqual(['elemental2', '8A']); // tras la 7C
  });
  it('cada unidad etiquetada existe en su curso', () => {
    const malas = [...tenses, ...modals.filter(m => m.id), ...CONDICIONALES_POR_CURSO]
      .filter(i => i.unidad && i.cefr)
      .filter(i => !(UNIDADES_POR_CURSO[i.cefr] || []).includes(i.unidad))
      .map(i => `${i.id || i.tipo + 'ª cond'} → ${i.cefr} ${i.unidad}`);
    expect(malas.join(' | ')).toBe('');
  });
});

describe('el contenido aparece cuando la clase lo ve', () => {
  it('Básico I: el verbo `be` desde la 2B, los demás verbos en la 5A', () => {
    const sp = tenses.find(t => t.id === 'simple-present');
    /* La queja del docente era que en la 2A ya llevan tres clases con `be` y la
       app decía «no has visto nada». Se abre en la 2B, no en la 1A, porque el
       `be` viene repartido por personas (1A, 1B, 2A) y las preguntas Wh- son la
       2B: es la primera unidad en que está COMPLETO. */
    expect(disponible(sp, 'basico1', '2A')).toBe(false);
    expect(disponible(sp, 'basico1', '2B')).toBe(true);
    expect(disponible(sp, 'basico1', '5A')).toBe(true);
  });
  it('Intermedio II: la 1ª condicional en la 8B, la 2ª en la 9A', () => {
    const vistas = (u) => CONDICIONALES_POR_CURSO.filter(c => disponible(c, 'intermedio2', u)).map(c => c.tipo);
    expect(vistas('8A')).toEqual([]);
    expect(vistas('8B')).toEqual([1]);
    expect(vistas('9A')).toEqual([1, 2]);
  });
  it('la 3ª condicional NO se ofrece en Intermedio II', () => {
    expect(CONDICIONALES_POR_CURSO.filter(c => disponible(c, 'intermedio2', '')).map(c => c.tipo)).toEqual([1, 2]);
  });
  it('un curso anterior se da por visto entero', () => {
    const pp = tenses.find(t => t.id === 'present-perfect');   // Elemental II 12A
    expect(disponible(pp, 'intermedio1', '1A')).toBe(true);
  });
});

describe('las tres etapas del pasado simple (Básico II)', () => {
  const t = tenses.find(x => x.id === 'simple-past');
  const etapa = (u) => {
    if (unidadIndice(t.unidadBe) <= tope(u) && unidadIndice(t.unidad) > tope(u)) return 'be';
    return unidadIndice(t.unidadIrregulares) > tope(u) ? 'regulares' : 'todos';
  };
  it('10B: solo was/were', () => expect(etapa('10B')).toBe('be'));
  it('11A: solo verbos regulares', () => expect(etapa('11A')).toBe('regulares'));
  it('11B: ya entran los irregulares', () => expect(etapa('11B')).toBe('todos'));
});

describe('las etapas del presente simple (Básico I)', () => {
  /* El libro lo reparte en cuatro tramos y la app tenía UN ítem para todos:
     sorteaba la forma al azar entre las tres y la persona entre las seis, así
     que en la 5A podía pedir «Does she work?». Réplica de `etapaPendiente`. */
  const t = tenses.find(x => x.id === 'simple-present');
  const soloBe = (u) => unidadIndice(t.unidadBe) <= tope(u) && unidadIndice(t.unidad) > tope(u);
  const pendiente = (campo, u) => !soloBe(u) && unidadIndice(t[campo]) > tope(u);
  const hayPreguntas = (u) => !pendiente('unidadInterrogativa', u);
  const hayTercera = (u) => !pendiente('unidadTerceraPersona', u);

  it('2A: nada todavía', () => expect(disponible(t, 'basico1', '2A')).toBe(false));
  it('2B: solo `be`, y con `be` sí hay preguntas y sí hay he/she', () => {
    expect(soloBe('2B')).toBe(true);
    expect([hayPreguntas('2B'), hayTercera('2B')]).toEqual([true, true]);
  });
  it('5A: los demás verbos, pero solo (+) y (−) con I/you/we/they', () => {
    expect(soloBe('5A')).toBe(false);
    expect([hayPreguntas('5A'), hayTercera('5A')]).toEqual([false, false]);
  });
  it('5B: entran las preguntas, la tercera persona todavía no', () => {
    expect([hayPreguntas('5B'), hayTercera('5B')]).toEqual([true, false]);
  });
  it('6A: ya entra he/she/it', () => {
    expect([hayPreguntas('6A'), hayTercera('6A')]).toEqual([true, true]);
  });
  it('en Básico II el presente simple está entero: es curso anterior', () => {
    expect([soloBe(''), hayPreguntas(''), hayTercera('')]).toEqual([false, true, true]);
  });
});

/* UNA SOLA REGLA PARA TODAS LAS ACTIVIDADES. El modo repaso tenía la suya,
   más floja: comparaba el curso y se saltaba la unidad. La práctica respetaba
   el temario y el repaso no, justo en la actividad que puntúa y alimenta la
   racha. `estaVisto` es ahora la única, vive en los datos y es pura. */
describe('estaVisto: la regla que comparten todas las actividades', () => {
  const t = (id) => tenses.find(x => x.id === id);

  it('curso anterior: visto entero, sin mirar la unidad', () => {
    expect(estaVisto(t('simple-present'), 'basico2', '7A')).toBe(true);
    expect(estaVisto(t('present-perfect'), 'intermedio1', '1A')).toBe(true);
  });
  it('curso posterior: nunca', () => {
    expect(estaVisto(t('past-perfect'), 'basico2', '')).toBe(false);
  });
  it('curso actual: hasta donde va la clase', () => {
    /* El caso exacto que el repaso se saltaba. */
    expect(estaVisto(t('present-continuous'), 'basico2', '7A')).toBe(false);  // es la 9A
    expect(estaVisto(t('present-continuous'), 'basico2', '9A')).toBe(true);
    expect(estaVisto(t('simple-past'), 'basico2', '10A')).toBe(false);        // es la 11A
    expect(estaVisto(t('simple-past'), 'basico2', '10B')).toBe(true);         // was/were
    expect(estaVisto(t('past-perfect'), 'intermedio2', '7A')).toBe(false);    // es la 12A
  });
  it('sin unidad respondida: todo el curso', () => {
    expect(estaVisto(t('past-perfect'), 'intermedio2', '')).toBe(true);
    expect(estaVisto(t('past-perfect'), 'intermedio2', null)).toBe(true);
  });
  it('un contenido que ya no existe no está visto', () => {
    expect(estaVisto(undefined, 'avanzado', '')).toBe(false);
    expect(estaVisto({ cefr: 'inventado', unidad: '1A' }, 'avanzado', '')).toBe(false);
  });
  it('NINGUNA unidad del curso deja pasar algo del curso siguiente', () => {
    const malos = [];
    for (const nivel of COURSE_ORDER)
      for (const u of (UNIDADES_POR_CURSO[nivel] || []))
        for (const item of tenses)
          if (COURSE_ORDER.indexOf(item.cefr) > COURSE_ORDER.indexOf(nivel) && estaVisto(item, nivel, u))
            malos.push(`${nivel} ${u} → ${item.id}`);
    expect(malos.join(' | ')).toBe('');
  });
});

describe('los regulares se abren desde Intermedio', () => {
  /* Decisión del docente (2026-08-08): a esa altura la regla `-ed` ya está
     sabida, así que los 50 de Starter se quedan cortos. Los irregulares NO se
     abren: ahí sí hay una forma que memorizar. */
  const nuevos = VERBOS_REGULARES_AMPLIA.filter(v => !VERBOS_REGULARES.includes(v));

  it('la ampliada contiene a la del libro y le suma 66', () => {
    expect(VERBOS_REGULARES.every(v => VERBOS_REGULARES_AMPLIA.includes(v))).toBe(true);
    expect(nuevos.length).toBe(66);
  });
  it('ninguno es irregular disfrazado', () => {
    /* El agujero por el que se colaron `lend` («lended») y `shine» («shined»):
       si el verbo no está en la tabla, la regla regular le inventa la forma. */
    expect(nuevos.filter(v => irregularVerbs[v]).join(' ')).toBe('');
    expect(VERBOS_REGULARES_AMPLIA.filter(v => !/ed$/.test(simplePast(v))).join(' ')).toBe('');
  });
  it('sin repetidos', () => {
    expect(VERBOS_REGULARES_AMPLIA.length).toBe(new Set(VERBOS_REGULARES_AMPLIA).size);
  });
  it('las tres trampas de ortografía salen bien', () => {
    // agree NO pierde la -e; plan dobla la consonante; visit NO la dobla.
    const esp = { agree: 'agreeing', plan: 'planning', visit: 'visiting',
                  practice: 'practicing', try: 'trying', shop: 'shopping' };
    const mal = Object.entries(esp).filter(([v, e]) => presentParticiple(v) !== e);
    expect(mal.map(([v, e]) => `${v}: ${presentParticiple(v)} ≠ ${e}`).join(' | ')).toBe('');
    expect([simplePast('plan'), simplePast('visit'), simplePast('try')])
      .toEqual(['planned', 'visited', 'tried']);
  });
  it('`smell` queda fuera por tener dos formas válidas, como `dream`', () => {
    expect(VERBOS_REGULARES_AMPLIA.includes('smell')).toBe(false);
  });
});

describe('cada verbo sabe qué complemento le toca', () => {
  /* Lo que impedía usar más que los verbos del libro NO era el nivel, era el
     armado: mientras el complemento solo podía ser adverbial, un transitivo
     salía AGRAMATICAL («He created at school»), no solo raro. Con un objeto por
     verbo eso deja de ser un límite — pero solo si no falta ninguno, y por eso
     este bloque es el que de verdad importa. */
  const pozos = {
    'regulares del libro': VERBOS_REGULARES,
    'regulares ampliada': VERBOS_REGULARES_AMPLIA,
    'irregulares básico': VERBOS_IRREGULARES_BASICO,
    'irregulares elemental': VERBOS_IRREGULARES,
    'irregulares intermedio': VERBOS_IRREGULARES_INTERMEDIO,
    'irregulares avanzado': VERBOS_IRREGULARES_AVANZADO,
  };
  const todos = [...new Set(Object.values(pozos).flat())];

  it('ningún verbo de ningún pozo se queda sin clasificar', () => {
    const sueltos = todos.filter(v => !COMPLEMENTO_DE_VERBO[v]
      && !VERBOS_CON_ADVERBIAL_LIBRE.includes(v) && !VERBOS_FUERA_DE_PRACTICA.includes(v));
    expect(sueltos.join(' ')).toBe('');
  });
  it('ninguno está en dos listas a la vez', () => {
    const dobles = todos.filter(v =>
      [!!COMPLEMENTO_DE_VERBO[v], VERBOS_CON_ADVERBIAL_LIBRE.includes(v),
       VERBOS_FUERA_DE_PRACTICA.includes(v)].filter(Boolean).length > 1);
    expect(dobles.join(' ')).toBe('');
  });
  it('no sobra ninguna clasificación de un verbo que ya nadie usa', () => {
    const enPozo = new Set(todos);
    const huerfanos = [...Object.keys(COMPLEMENTO_DE_VERBO), ...VERBOS_CON_ADVERBIAL_LIBRE,
                       ...VERBOS_FUERA_DE_PRACTICA].filter(v => !enPozo.has(v));
    expect(huerfanos.join(' ')).toBe('');
  });
  it('detrás de un objeto solo van adverbiales de TIEMPO', () => {
    /* «visited the museum at home» se contradice. Y todos tienen que aguantar
       cualquier tiempo verbal: nada de «last night» con presente simple. */
    const lugar = ['at school', 'at home', 'in the park', 'with friends'];
    expect(COMPLEMENTOS_TIEMPO.filter(c => lugar.includes(c)).join(' ')).toBe('');
    expect(COMPLEMENTOS_TIEMPO.length).toBeGreaterThan(0);
  });
  it('los excluidos no llegan a ninguna actividad', () => {
    /* `put`/`set` piden además un lugar, `let` un infinitivo, `cost` un precio,
       `mean` una cláusula y `shine` un sujeto que no sea una persona. */
    for (const v of VERBOS_FUERA_DE_PRACTICA) {
      expect(COMPLEMENTO_DE_VERBO[v]).toBeUndefined();
      expect(VERBOS_CON_ADVERBIAL_LIBRE.includes(v)).toBe(false);
    }
  });
  it('ningún complemento arrastra puntuación que rompa la oración', () => {
    // Mayúscula permitida: «English» es nombre propio y va así en la oración.
    const malos = Object.entries(COMPLEMENTO_DE_VERBO)
      .filter(([, o]) => !/^[A-Za-z][A-Za-z ]*[A-Za-z]$/.test(o));
    expect(malos.map(([v, o]) => `${v}: «${o}»`).join(' | ')).toBe('');
  });
  it('ningún complemento lleva posesivo: el sujeto lo sortea la app', () => {
    /* «She raised my hand» es gramatical y dice otra cosa. Se vio leyendo las
       oraciones generadas; ningún test de forma lo habría cazado. */
    const malos = Object.entries(COMPLEMENTO_DE_VERBO)
      .filter(([, o]) => /\b(my|your|his|her|our|their)\b/.test(o));
    expect(malos.map(([v, o]) => `${v}: «${o}»`).join(' | ')).toBe('');
  });
  it('los verbos meteorológicos no llegan a la práctica', () => {
    /* `rain` y `snow` vienen en la página 133, así que estaban en el pozo desde
       el principio: «She rained at school». Su sujeto no es una persona y los
       seis de la práctica lo son. Mismo caso que `shine`. */
    for (const v of ['rain', 'snow', 'shine']) {
      expect(VERBOS_FUERA_DE_PRACTICA.includes(v)).toBe(true);
    }
  });
});

describe('los verbos son los del libro (página 133)', () => {
  it('los regulares hacen -ed sin excepción', () => {
    expect(VERBOS_REGULARES.filter(v => !/ed$/.test(simplePast(v))).join(' ')).toBe('');
  });
  it('ninguno de los irregulares hace -ed', () => {
    expect(VERBOS_IRREGULARES.filter(v => /ed$/.test(simplePast(v))).join(' ')).toBe('');
  });
  it('la tercera persona sale bien en los delicados (-y, -sh, -ch, -ss, -x)', () => {
    const esp = { carry: 'carries', study: 'studies', cry: 'cries', stay: 'stays',
                  wash: 'washes', watch: 'watches', pass: 'passes', miss: 'misses',
                  relax: 'relaxes', go: 'goes', do: 'does', have: 'has' };
    const mal = Object.entries(esp).filter(([v, e]) => conjugate3p(v) !== e);
    expect(mal.map(([v, e]) => `${v}: ${conjugate3p(v)} ≠ ${e}`).join(' | ')).toBe('');
  });
  it('el gerundio dobla o quita la -e donde toca', () => {
    const esp = { stop: 'stopping', sit: 'sitting', get: 'getting',
                  write: 'writing', decide: 'deciding', arrive: 'arriving' };
    const mal = Object.entries(esp).filter(([v, e]) => presentParticiple(v) !== e);
    expect(mal.map(([v, e]) => `${v}: ${presentParticiple(v)} ≠ ${e}`).join(' | ')).toBe('');
  });
  it('en BÁSICO no aparecen los que el libro guarda para Elemental', () => {
    // `eat`, `read` y `run` los usaba la práctica en cualquier curso. Están en
    // la tabla de Elemental (pág. 165) pero NO en la de Básico (pág. 133), así
    // que allá pedían una forma que el alumno no tenía por qué conocer.
    for (const v of ['eat', 'read', 'run', 'swim', 'understand']) {
      expect(VERBOS_REGULARES).not.toContain(v);
      expect(VERBOS_IRREGULARES_BASICO).not.toContain(v);
    }
    // y sí están donde el libro los pone
    for (const v of ['eat', 'read', 'run', 'swim', 'understand']) {
      expect(VERBOS_IRREGULARES).toContain(v);
    }
  });
  it('la lista de Básico es un subconjunto de la de Elemental', () => {
    // El vocabulario no se pierde al subir de curso: lo que se vio sigue valiendo.
    const fuera = VERBOS_IRREGULARES_BASICO.filter(v => !VERBOS_IRREGULARES.includes(v));
    expect(fuera.join(' ')).toBe('');
  });
});

/* Cruce contra la página 165 del libro (AEF 1). Si el motor y el libro
   discrepan, la práctica enseña una forma equivocada — y eso no lo detecta
   ningún otro chequeo, porque la app es coherente consigo misma. */
describe('las formas irregulares coinciden con el libro', () => {
  const LIBRO = {
    become: ['became', 'become'], begin: ['began', 'begun'], break: ['broke', 'broken'],
    bring: ['brought', 'brought'], build: ['built', 'built'], buy: ['bought', 'bought'],
    catch: ['caught', 'caught'], come: ['came', 'come'], cost: ['cost', 'cost'],
    do: ['did', 'done'], drink: ['drank', 'drunk'], drive: ['drove', 'driven'],
    eat: ['ate', 'eaten'], fall: ['fell', 'fallen'], feel: ['felt', 'felt'],
    find: ['found', 'found'], fly: ['flew', 'flown'], forget: ['forgot', 'forgotten'],
    get: ['got', 'gotten'], give: ['gave', 'given'], go: ['went', 'gone'],
    have: ['had', 'had'], hear: ['heard', 'heard'], know: ['knew', 'known'],
    leave: ['left', 'left'], lose: ['lost', 'lost'], make: ['made', 'made'],
    meet: ['met', 'met'], pay: ['paid', 'paid'], put: ['put', 'put'],
    read: ['read', 'read'], run: ['ran', 'run'], say: ['said', 'said'],
    see: ['saw', 'seen'], send: ['sent', 'sent'], sing: ['sang', 'sung'],
    sit: ['sat', 'sat'], sleep: ['slept', 'slept'], speak: ['spoke', 'spoken'],
    spend: ['spent', 'spent'], stand: ['stood', 'stood'], swim: ['swam', 'swum'],
    teach: ['taught', 'taught'], take: ['took', 'taken'], tell: ['told', 'told'],
    think: ['thought', 'thought'], understand: ['understood', 'understood'],
    wake: ['woke', 'woken'], wear: ['wore', 'worn'], win: ['won', 'won'],
    write: ['wrote', 'written'],
  };
  it('pasado simple', () => {
    const mal = Object.entries(LIBRO).filter(([v, [p]]) => simplePast(v) !== p)
      .map(([v, [p]]) => `${v}: app «${simplePast(v)}» ≠ libro «${p}»`);
    expect(mal.join(' | ')).toBe('');
  });
  it('participio', () => {
    const mal = Object.entries(LIBRO).filter(([v, [, pp]]) => pastParticiple(v) !== pp)
      .map(([v, [, pp]]) => `${v}: app «${pastParticiple(v)}» ≠ libro «${pp}»`);
    expect(mal.join(' | ')).toBe('');
  });
  it('la lista que usa la app está toda en el libro', () => {
    const fuera = VERBOS_IRREGULARES.filter(v => !LIBRO[v]);
    expect(fuera.join(' ')).toBe('');
  });
});

describe('la escala de irregulares crece con el curso', () => {
  it('cada lista contiene a la anterior', () => {
    // El vocabulario no se pierde al subir: lo visto sigue valiendo.
    const escala = [VERBOS_IRREGULARES_BASICO, VERBOS_IRREGULARES,
                    VERBOS_IRREGULARES_INTERMEDIO, VERBOS_IRREGULARES_AVANZADO];
    for (let i = 1; i < escala.length; i++)
      expect(escala[i - 1].filter(v => !escala[i].includes(v)).join(' ')).toBe('');
  });
  it('y cada una es más grande que la anterior', () => {
    const t = [VERBOS_IRREGULARES_BASICO, VERBOS_IRREGULARES,
               VERBOS_IRREGULARES_INTERMEDIO, VERBOS_IRREGULARES_AVANZADO].map(l => l.length);
    expect(t).toEqual([...t].sort((a, b) => a - b));
    expect(new Set(t).size).toBe(t.length);   // ninguna repite tamaño: cada libro suma
  });
  it('los de Intermedio Alto (pág. 165) conjugan como dice el libro', () => {
    const NUEVOS = {
      beat: ['beat', 'beaten'], bite: ['bit', 'bitten'], draw: ['drew', 'drawn'],
      hang: ['hung', 'hung'], hurt: ['hurt', 'hurt'], mean: ['meant', 'meant'],
      ride: ['rode', 'ridden'], set: ['set', 'set'], shine: ['shone', 'shone'],
    };
    const mal = Object.entries(NUEVOS)
      .filter(([v, [p, pp]]) => simplePast(v) !== p || pastParticiple(v) !== pp)
      .map(([v, [p, pp]]) => `${v}: ${simplePast(v)}/${pastParticiple(v)} ≠ ${p}/${pp}`);
    expect(mal.join(' | ')).toBe('');
  });
  it('`shine` no vuelve a «shined»', () => {
    // Faltaba en los datos, igual que `lend`. Salió del cruce contra AEF 3.
    expect(simplePast('shine')).toBe('shone');
  });
  it('`lie` se queda REGULAR y fuera de la práctica', () => {
    /* Son dos verbos escritos igual: «recostarse» (lay/lain, el del libro) y
       «mentir» (lied). Poner la forma del libro rompería «He lied to me», que
       es el sentido que más sale en clase. */
    expect(simplePast('lie')).toBe('lied');
    for (const l of [VERBOS_IRREGULARES_BASICO, VERBOS_IRREGULARES,
                     VERBOS_IRREGULARES_INTERMEDIO, VERBOS_IRREGULARES_AVANZADO])
      expect(l).not.toContain('lie');
  });
  it('los de doble forma quedan fuera en todos los niveles', () => {
    // `dream` y `smell` tienen dos formas válidas y la práctica compara contra
    // una sola: marcaría mal a quien escriba la otra.
    for (const l of [VERBOS_IRREGULARES_BASICO, VERBOS_IRREGULARES,
                     VERBOS_IRREGULARES_INTERMEDIO, VERBOS_IRREGULARES_AVANZADO]) {
      expect(l).not.toContain('dream');
      expect(l).not.toContain('smell');
    }
  });
  it('los de Intermedio (pág. 164) conjugan como dice el libro', () => {
    const NUEVOS = {
      choose: ['chose', 'chosen'], cut: ['cut', 'cut'], grow: ['grew', 'grown'],
      hit: ['hit', 'hit'], keep: ['kept', 'kept'], lend: ['lent', 'lent'],
      let: ['let', 'let'], ring: ['rang', 'rung'], sell: ['sold', 'sold'],
      shut: ['shut', 'shut'], steal: ['stole', 'stolen'], throw: ['threw', 'thrown'],
    };
    const mal = Object.entries(NUEVOS)
      .filter(([v, [p, pp]]) => simplePast(v) !== p || pastParticiple(v) !== pp)
      .map(([v, [p, pp]]) => `${v}: ${simplePast(v)}/${pastParticiple(v)} ≠ ${p}/${pp}`);
    expect(mal.join(' | ')).toBe('');
  });
  it('`lend` no vuelve a «lended»', () => {
    // Faltaba en los datos de la app y la regla regular inventaba una forma que
    // no existe. Salió de cruzar contra el libro; ningún chequeo interno lo veía.
    expect(simplePast('lend')).toBe('lent');
    expect(pastParticiple('lend')).toBe('lent');
  });
  it('`dream` y `learn` quedan fuera a propósito', () => {
    // `dream` tiene DOS formas válidas y la práctica compara contra una sola;
    // `learn` es regular y ya está en la otra lista.
    for (const lista of [VERBOS_IRREGULARES_BASICO, VERBOS_IRREGULARES, VERBOS_IRREGULARES_INTERMEDIO]) {
      expect(lista).not.toContain('dream');
      expect(lista).not.toContain('learn');
    }
    expect(VERBOS_REGULARES).toContain('learn');
  });
});

/* ── Revisión periódica de la unidad ────────────────────────────────────────
   El profesor reportó el selector de unidad como «desaparecido» y no había
   desaparecido: ya lo había respondido, así que salía la línea compacta en vez
   de la tarjeta. Eso destapó el problema real, que no es de visibilidad: el
   dato CADUCA SOLO. Un curso avanza ~una unidad por clase, dos clases por
   semana (3-4 los intensivos), y nadie vuelve a tocar un ajuste que puso una
   vez. El fallo es silencioso y siempre hacia el mismo lado: una unidad vieja
   solo puede hacer la app más chica, y esconde justo lo que se vio en la última
   clase. Por eso se vuelve a preguntar, y por eso se prueba también lo que NO
   debe preguntar. */
describe('cuándo se vuelve a preguntar hasta dónde va la clase', () => {
  const hoy = '2026-08-12';
  const haceDias = (n) => {
    const d = new Date(`${hoy}T12:00:00`);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  it('el plazo sale de curriculum.json y es un número de días usable', () => {
    // Escrito a mano en cada app, los dos números acabarían diciendo cosas
    // distintas — que es exactamente lo que pasó con el nivel de `would`.
    expect(DIAS_REVISION).toBeGreaterThan(0);
    expect(DIAS_REVISION).toBeLessThanOrEqual(30);
  });

  it('recién puesta no se pregunta', () => {
    expect(unidadPorRevisar('5B', hoy, hoy)).toBe(false);
  });

  it('un día antes del plazo todavía no', () => {
    expect(unidadPorRevisar('5B', haceDias(DIAS_REVISION - 1), hoy)).toBe(false);
  });

  it('cumplido el plazo, sí', () => {
    expect(unidadPorRevisar('5B', haceDias(DIAS_REVISION), hoy)).toBe(true);
    expect(unidadPorRevisar('5B', haceDias(DIAS_REVISION * 4), hoy)).toBe(true);
  });

  it('«todo el curso» no se pregunta nunca: no esconde nada', () => {
    // Con '' no hay contenido oculto, así que no hay nada que se ponga viejo.
    // Preguntarlo cada semana sería molestar sin motivo.
    expect(unidadPorRevisar('', haceDias(400), hoy)).toBe(false);
  });

  it('sin responder tampoco: para eso está la tarjeta original', () => {
    expect(unidadPorRevisar(null, null, hoy)).toBe(false);
  });

  it('con unidad y SIN fecha se pregunta', () => {
    // Es el caso de quien ya tenía una unidad puesta antes de que esto
    // existiera: su valor es justamente el más viejo de todos.
    expect(unidadPorRevisar('5B', null, hoy)).toBe(true);
  });

  it('el cruce de mes y de año se cuenta en días, no en texto', () => {
    // Comparar 'yyyy-mm-dd' como texto daría bien el orden pero no la RESTA, y
    // el plazo es una resta. Enero contra diciembre es donde eso se rompe.
    expect(unidadPorRevisar('5B', '2025-12-30', '2026-01-02')).toBe(false);
    expect(unidadPorRevisar('5B', '2025-12-30', '2026-01-06')).toBe(true);
  });
});
