/* ============================================================================
   LO BÁSICO · Grammaster
   ----------------------------------------------------------------------------
   Hermano de `basico.test.js` de Desgramatizador, y existe por lo mismo: allí
   un fallo de clase («She works in Santiago» daba el verbo «works in») demostró
   que teníamos 103 pruebas de casos finos y ninguna de lo primero que alguien
   escribe. Palabra del profesor: el idioma es ambiguo y eso se acepta, pero
   fallar en lo básico le quita valor a la propuesta.

   Aquí lo básico es OTRA COSA que en Desgramatizador. Esa app ANALIZA lo que le
   escriben, así que su suelo es leer bien una oración simple. Grammaster GENERA,
   así que su suelo es que ninguna oración salga mal conjugada. Por eso esto no
   es una lista de ejemplos: es la MATRIZ COMPLETA de tiempo × forma × sujeto,
   más una tabla escrita a mano de las oraciones canónicas.

   Regla para agregar: si hay que pensarlo, va en conjugation.test.js con su
   explicación. Lo de aquí tiene que poder romperse solo si la app está mal.
   ============================================================================ */
import { describe, it, expect } from 'vitest';
import { buildSentenceText } from './conjugation';
import { tenses, modals } from './data/grammar';
import { validateComplement } from './data/validation';

const SUJETOS = ['I', 'you', 'he', 'she', 'we', 'they'];
const FORMAS = ['affirmative', 'negative', 'interrogative'];
const arma = (o) => buildSentenceText({ complement: '', ...o });

/* ── La tabla canónica ───────────────────────────────────────────────────────
   Escrita a mano, verbo `work`, sujeto `she` (la tercera persona es donde más
   se falla) y `they` para contrastar el plural. Si algo de esto cambia, es que
   la app cambió de opinión sobre cómo se conjuga, y eso no puede pasar sin que
   alguien lo decida. */
describe('la tabla canónica', () => {
  const T = [
    ['simple-present', 'she', 'affirmative',    'She works.'],
    ['simple-present', 'she', 'negative',       "She doesn't work."],
    ['simple-present', 'she', 'interrogative',  'Does she work?'],
    ['simple-present', 'they', 'affirmative',   'They work.'],
    ['simple-present', 'they', 'negative',      "They don't work."],
    ['simple-present', 'they', 'interrogative', 'Do they work?'],
    ['simple-past', 'she', 'affirmative',       'She worked.'],
    ['simple-past', 'she', 'negative',          "She didn't work."],
    ['simple-past', 'she', 'interrogative',     'Did she work?'],
    ['present-continuous', 'she', 'affirmative',   'She is working.'],
    ['present-continuous', 'she', 'negative',      "She isn't working."],
    ['present-perfect', 'she', 'negative',         "She hasn't worked."],
    ['past-perfect', 'she', 'negative',            "She hadn't worked."],
    ['past-continuous', 'they', 'negative',        "They weren't working."],
    /* `am` es el único auxiliar sin negativa contraída: «amn't» no existe y
       «aren't I» solo vale en preguntas. No es un olvido, es la excepción. */
    ['present-continuous', 'I', 'negative',        'I am not working.'],
    ['present-continuous', 'she', 'interrogative', 'Is she working?'],
    ['present-perfect', 'she', 'affirmative',   'She has worked.'],
    ['present-perfect', 'they', 'affirmative',  'They have worked.'],
    ['past-continuous', 'she', 'affirmative',   'She was working.'],
    ['past-continuous', 'they', 'affirmative',  'They were working.'],
    ['past-perfect', 'she', 'affirmative',      'She had worked.'],
    ['simple-future', 'she', 'affirmative',     'She will work.'],
    ['simple-future', 'she', 'interrogative',   'Will she work?'],
    ['future-going-to', 'she', 'affirmative',   'She is going to work.'],
    ['used-to', 'she', 'affirmative',           'She used to work.'],
    ['used-to', 'she', 'interrogative',         'Did she use to work?'],
    ['present-perfect-continuous', 'she', 'affirmative', 'She has been working.'],
  ];
  for (const [tense, subject, mode, esperado] of T) {
    it(`${tense} · ${subject} · ${mode} → ${esperado}`, () => {
      expect(arma({ tense, subject, verb: 'work', mode })).toBe(esperado);
    });
  }
});

/* ── La matriz completa ──────────────────────────────────────────────────────
   180 oraciones (10 tiempos × 3 formas × 6 sujetos). No se comparan contra un
   texto esperado —eso sería reescribir el motor— sino contra INVARIANTES que
   tienen que cumplirse siempre. Cada una corresponde a un error que un alumno
   detectaría al instante. */
describe('la matriz completa: 10 tiempos × 3 formas × 6 sujetos', () => {
  const todas = [];
  for (const t of tenses) for (const mode of FORMAS) for (const subject of SUJETOS) {
    todas.push({ tense: t.id, mode, subject, texto: arma({ tense: t.id, subject, verb: 'work', mode }) });
  }

  it(`se generan las ${tenses.length * 3 * 6} y ninguna sale vacía`, () => {
    expect(todas.length).toBe(tenses.length * 3 * 6);
    expect(todas.filter(o => !o.texto || o.texto.trim().length < 4).map(o => `${o.tense}/${o.mode}/${o.subject}`).join(' ')).toBe('');
  });

  it('la interrogativa termina en «?» y las otras dos en «.»', () => {
    const mal = todas.filter(o => o.mode === 'interrogative' ? !o.texto.endsWith('?') : !o.texto.endsWith('.'));
    expect(mal.map(o => o.texto).join(' | ')).toBe('');
  });

  it('la negativa niega, y una sola vez', () => {
    const neg = todas.filter(o => o.mode === 'negative');
    /* Sin `\b` delante de `n't`: en «don't» no hay frontera de palabra entre
       la `o` y la `n`, así que anclarla daba por NO negadas todas las
       contraídas. Error mío al escribir el test, no de la app. */
    const sinNegar = neg.filter(o => !/(\bnot\b|n't)/.test(o.texto));
    expect(sinNegar.map(o => o.texto).join(' | ')).toBe('');
    const dobles = neg.filter(o => (o.texto.match(/n't/g) || []).length > 1);
    expect(dobles.map(o => o.texto).join(' | ')).toBe('');
  });

  it('la interrogativa empieza por auxiliar o modal, nunca por el sujeto', () => {
    const abre = new Set(['do', 'does', 'did', 'is', 'are', 'am', 'was', 'were',
                          'have', 'has', 'had', 'will', 'would', 'can', 'could',
                          'should', 'shall', 'may', 'might', 'must']);
    const mal = todas.filter(o => o.mode === 'interrogative'
      && !abre.has(o.texto.split(/\s+/)[0].toLowerCase()));
    expect(mal.map(o => o.texto).join(' | ')).toBe('');
  });

  it('DESPUÉS de do/does/did el verbo va en forma base', () => {
    /* «Did she worked?» es el error más frecuente de la clase y el que más
       delataría a la app si lo cometiera ella. */
    const mal = todas.filter(o => /\b(do|does|did)(n't)?\s+(\w+)/i.test(o.texto)
      && /\b(do|does|did)(n't)?\s+(works|worked|working)\b/i.test(o.texto));
    expect(mal.map(o => o.texto).join(' | ')).toBe('');
  });

  it('la -s de la tercera persona: solo con he/she/it, y solo en presente simple', () => {
    const pres = todas.filter(o => o.tense === 'simple-present' && o.mode === 'affirmative');
    const tercera = pres.filter(o => ['he', 'she'].includes(o.subject));
    const resto = pres.filter(o => !['he', 'she'].includes(o.subject));
    expect(tercera.filter(o => !/\bworks\b/.test(o.texto)).map(o => o.texto).join(' | ')).toBe('');
    expect(resto.filter(o => /\bworks\b/.test(o.texto)).map(o => o.texto).join(' | ')).toBe('');
  });

  it('el sujeto concuerda con el auxiliar de `be` y de `have`', () => {
    const pares = [
      /* `I` lleva am y was; lo ajeno es is/are/were/has. Los tenía todos como
         malos y marcaba «I was working», que está bien. */
      [/\bI (is|are|were|has)\b/, 'I con auxiliar ajeno'],
      [/\b(he|she) (are|were|have)\b/i, 'he/she con auxiliar de plural'],
      [/\b(we|they) (is|was|has)\b/i, 'we/they con auxiliar de singular'],
      [/\byou (is|was|has)\b/i, 'you con auxiliar de singular'],
    ];
    const mal = [];
    for (const o of todas) for (const [re, motivo] of pares)
      if (re.test(o.texto)) mal.push(`${o.texto}  (${motivo})`);
    expect(mal.join(' | ')).toBe('');
  });

  it('ningún auxiliar aparece dos veces seguidas', () => {
    /* «Does she does work?» y compañía: si el motor duplica el auxiliar, la
       oración sigue pareciendo inglesa de lejos y no lo hace de cerca. */
    const mal = todas.filter(o => /\b(do|does|did|is|are|was|were|have|has|had|will)\s+(do|does|did|is|are|was|were|have|has|had|will)\b/i.test(o.texto)
      && !/\b(has|have|had)\s+been\b/i.test(o.texto));
    expect(mal.map(o => o.texto).join(' | ')).toBe('');
  });

  it('la oración empieza en mayúscula y no lleva espacios dobles', () => {
    const mal = todas.filter(o => !/^[A-Z]/.test(o.texto) || /\s{2}/.test(o.texto) || /\s+[.?]/.test(o.texto));
    expect(mal.map(o => `«${o.texto}»`).join(' | ')).toBe('');
  });
});

/* ── Los modales ─────────────────────────────────────────────────────────────
   Un modal NO se conjuga y el verbo va siempre en base: «She can work», nunca
   «She can works». Es la regla que más se le escapa a un alumno, así que la app
   no puede fallarla. */
describe('los modales no se conjugan', () => {
  const conModal = modals.filter(m => m.id && m.id !== 'have-to');
  it(`los ${conModal.length} modales, con he/she, dejan el verbo en base`, () => {
    const mal = [];
    for (const m of conModal) for (const subject of ['he', 'she', 'they']) {
      const texto = arma({ tense: 'simple-present', subject, verb: 'work', mode: 'affirmative', modal: m.id });
      if (/\bworks\b|\bworked\b|\bworking\b/.test(texto)) mal.push(texto);
      if (!new RegExp(`\\b${m.id}\\b`, 'i').test(texto)) mal.push(`${texto} (falta «${m.id}»)`);
    }
    expect(mal.join(' | ')).toBe('');
  });
  it('`have to` SÍ se conjuga, que es lo que lo distingue', () => {
    expect(arma({ tense: 'simple-present', subject: 'she', verb: 'work', mode: 'affirmative', modal: 'have-to' }))
      .toBe('She has to work.');
    expect(arma({ tense: 'simple-present', subject: 'they', verb: 'work', mode: 'affirmative', modal: 'have-to' }))
      .toBe('They have to work.');
  });
});

/* ── El complemento se pega bien ─────────────────────────────────────────── */
describe('el complemento no se pierde ni se pega mal', () => {
  it('va antes del punto y separado por un espacio', () => {
    expect(arma({ tense: 'simple-present', subject: 'she', verb: 'work', mode: 'affirmative', complement: 'at home' }))
      .toBe('She works at home.');
    expect(arma({ tense: 'simple-present', subject: 'she', verb: 'work', mode: 'interrogative', complement: 'at home' }))
      .toBe('Does she work at home?');
  });
});

/* ── «be» no admite infinitivo pelado ────────────────────────────────────────
   Visto en clase (agosto 2026): una alumna quiso «He is tall», tecleó «talk» en
   el complemento y la app generó «He is talk.» sin decir nada.

   El corrector ortográfico no puede ayudar ahí, y hace bien en callarse: «talk»
   es una palabra correcta y bien escrita. Lo que falla no es la palabra sino que
   no encaja en ese hueco, y eso solo se ve teniendo el verbo delante.
   ------------------------------------------------------------------------- */
describe('validateComplement — después de «be» no va un verbo en forma base', () => {
  const av = (comp, verb = 'be') => validateComplement(comp, 'es', verb);

  it('caza el caso de clase', () => {
    expect(av('talk').valid).toBe(false);
    expect(av('talk').warning).toMatch(/verbo en forma base/);
  });

  it('avisa con cualquier otro verbo base', () => {
    for (const v of ['eat', 'run', 'swim', 'write', 'study']) {
      expect(av(v).valid, `«be + ${v}» debería avisar`).toBe(false);
    }
  });

  /* El ejemplo de -ing va FIJO en el mensaje. Construirlo con la palabra del
     alumno salía mal en cuanto el verbo dobla consonante o pierde la -e, y una
     app de gramática no puede imprimir «runing». */
  it('no imprime formas -ing mal escritas', () => {
    for (const v of ['run', 'swim', 'write']) {
      const w = av(v).warning;
      expect(w, `«${v}» generó una forma mal escrita`).not.toMatch(/runing|swiming|writeing/);
    }
  });

  it('deja pasar lo que SÍ puede ir detrás de «be»', () => {
    for (const c of ['tall', 'happy', 'tired', 'a teacher', 'talking', 'at home']) {
      expect(av(c).valid, `«be + ${c}» no debería avisar`).toBe(true);
    }
  });

  /* Solo con «be», y solo con una palabra suelta: «He is talk to Maria» es otro
     error y mandarle un adjetivo lo despistaría. */
  it('no se mete donde no le toca', () => {
    expect(av('talk', 'like').valid).toBe(true);
    expect(av('talk', 'want').valid).toBe(true);
    expect(av('talk to Maria').valid).toBe(true);
  });
});
