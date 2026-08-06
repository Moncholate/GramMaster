// Selector de WH: qué pide cada palabra y qué pasa con las extensiones que no
// se sostienen solas. El bug original: el selector ofrecía «What kind of» con
// un clic y salía «What kind of does she like music?», inglés roto, sin aviso.
import { describe, it, expect } from 'vitest';
import { buildSentenceText } from './conjugation';
import { whWords, whSuggestions, whAsks, whExtPideSustantivo } from './data/grammar';

const usable = (ext) => (whExtPideSustantivo(ext) ? '' : (ext || '').trim());
const frase = (whWord, ext, extra = {}) => buildSentenceText({
  mode: 'interrogative', subject: 'she', verb: 'like', complement: 'music',
  tense: 'simple-present', whWord, whExtension: usable(ext), ...extra,
});

describe('WH: cada palabra declara qué dato pide', () => {
  it('todas las wh del selector tienen su dato', () => {
    for (const wh of whWords.filter(w => w.id)) {
      expect(whAsks[wh.id], `falta el dato de «${wh.name}»`).toBeTruthy();
      expect(whAsks[wh.id].es).toBeTruthy();
      expect(whAsks[wh.id].en).toBeTruthy();
    }
  });
  it('toda sugerencia resuelve a un dato (propio o el de su base)', () => {
    for (const [base, exts] of Object.entries(whSuggestions)) {
      for (const ext of exts) {
        const clave = `${base} ${ext}`.trim().toLowerCase().replace(/\s+of$/, '');
        expect(whAsks[clave] || whAsks[base], `«${base} ${ext}» sin dato`).toBeTruthy();
      }
    }
  });
  it('la compuesta manda sobre la base', () => {
    // «how many» pide una cantidad, no «una manera»
    expect(whAsks['how many'].es).not.toBe(whAsks.how.es);
    expect(whAsks['what time'].es).not.toBe(whAsks.what.es);
  });
});

describe('WH: extensión que necesita un sustantivo', () => {
  it('la detecta por la preposición final, venga de botón o escrita a mano', () => {
    expect(whExtPideSustantivo('kind of')).toBe(true);
    expect(whExtPideSustantivo('type of')).toBe(true);
    expect(whExtPideSustantivo('  sort of ')).toBe(true);
    expect(whExtPideSustantivo('kind of music')).toBe(false);
    expect(whExtPideSustantivo('time')).toBe(false);
    expect(whExtPideSustantivo('many')).toBe(false);
    expect(whExtPideSustantivo('')).toBe(false);
  });
  it('a medias NO llega a la oración: se arma la correcta sin la extensión', () => {
    expect(frase('what', 'kind of')).toBe('What does she like music?');
    expect(frase('what', 'type of')).toBe('What does she like music?');
    expect(frase('which', 'type of')).toBe('Which does she like music?');
  });
  it('con el sustantivo sí entra', () => {
    expect(frase('what', 'kind of music', { complement: '' }))
      .toBe('What kind of music does she like?');
  });
  it('las extensiones completas no se tocan', () => {
    expect(frase('what', 'time', { complement: '' })).toBe('What time does she like?');
    expect(frase('how', 'often', { complement: '' })).toBe('How often does she like?');
    expect(frase('how', 'many', { complement: '' })).toBe('How many does she like?');
    expect(frase('which', 'one', { complement: '' })).toBe('Which one does she like?');
  });
  it('sin wh, la pregunta no cambia', () => {
    expect(frase('', '', { complement: '' })).toBe('Does she like?');
  });
});

/* PREGUNTA DE SUJETO — AEF Intermedio II 12C, «questions without auxiliaries».
   Es el error clásico del hispanohablante: en español la pregunta de sujeto
   tampoco invierte («¿Quién vive aquí?»), pero el alumno arrastra el auxiliar
   del resto de las preguntas que ya aprendió y dice «Who does live here?».
   Va como MODO aparte porque cambia la estructura entera: sin auxiliar
   prestado, sin inversión y sin campo Sujeto. */
import { modes, whSubjectWords, COURSE_ORDER } from './data/grammar';

const pregSujeto = (whWord, whExtension = '', extra = {}) => buildSentenceText({
  mode: 'subject-question', subject: '', verb: 'call', complement: 'you',
  tense: 'simple-present', whWord, whExtension, ...extra,
});

describe('pregunta de sujeto: sin auxiliar prestado ni inversión', () => {
  it('presente y pasado simples no piden do/does/did', () => {
    expect(pregSujeto('who')).toBe('Who calls you?');
    expect(pregSujeto('who', '', { tense: 'simple-past' })).toBe('Who called you?');
    expect(pregSujeto('what', '', { tense: 'simple-past', verb: 'happen', complement: '' })).toBe('What happened?');
  });
  it('los tiempos compuestos conservan SU auxiliar, que no es prestado', () => {
    expect(pregSujeto('who', '', { tense: 'present-continuous' })).toBe('Who is calling you?');
    expect(pregSujeto('who', '', { tense: 'present-perfect' })).toBe('Who has called you?');
    expect(pregSujeto('who', '', { tense: 'past-perfect' })).toBe('Who had called you?');
    expect(pregSujeto('who', '', { tense: 'present-perfect-continuous' })).toBe('Who has been calling you?');
    expect(pregSujeto('who', '', { tense: 'future-going-to' })).toBe('Who is going to call you?');
    expect(pregSujeto('who', '', { tense: 'simple-future' })).toBe('Who will call you?');
  });
  it('la concordancia sale de la wh, no del campo Sujeto', () => {
    expect(pregSujeto('who', '', { verb: 'arrive', complement: '' })).toBe('Who arrives?');
    expect(pregSujeto('which', 'ones', { verb: 'arrive', complement: '' })).toBe('Which ones arrive?');
    expect(pregSujeto('how', 'many people', { verb: 'arrive', complement: '' })).toBe('How many people arrive?');
    expect(pregSujeto('how', 'much money', { verb: 'arrive', complement: '' })).toBe('How much money arrives?');
    // y en los compuestos tambien
    expect(pregSujeto('who', '', { tense: 'present-perfect', verb: 'call', complement: '' })).toBe('Who has called?');
    expect(pregSujeto('how', 'many people', { tense: 'present-perfect', verb: 'call', complement: '' }))
      .toBe('How many people have called?');
  });
  it('modales y have to', () => {
    expect(pregSujeto('who', '', { modal: 'can', verb: 'help', complement: '' })).toBe('Who can help?');
    expect(pregSujeto('who', '', { modal: 'have-to', verb: 'work', complement: '' })).toBe('Who has to work?');
    expect(pregSujeto('how', 'many people', { modal: 'have-to', verb: 'work', complement: '' }))
      .toBe('How many people have to work?');
  });
  it('el adverbio de frecuencia va donde va en una afirmación', () => {
    expect(pregSujeto('who', '', { verb: 'arrive', complement: 'late', adverb: 'always' }))
      .toBe('Who always arrives late?');
  });
  it('el campo Sujeto no participa: da igual lo que tenga', () => {
    expect(pregSujeto('who', '', { subject: 'she' })).toBe(pregSujeto('who', '', { subject: '' }));
  });
});

describe('pregunta de sujeto: dónde y con qué se ofrece', () => {
  it('el modo existe y está gateado al curso donde se enseña', () => {
    const m = modes.find(x => x.id === 'subject-question');
    expect(m).toBeTruthy();
    expect(m.cefr).toBe('intermedio2');
    // los otros tres no tienen gate: están desde el primer curso
    for (const otro of ['affirmative', 'negative', 'interrogative'])
      expect(modes.find(x => x.id === otro).cefr).toBeUndefined();
  });
  it('solo se ofrecen las wh que pueden ejecutar la acción', () => {
    expect(whSubjectWords).toContain('who');
    expect(whSubjectWords).toContain('what');
    // un lugar o un momento no hacen la acción
    expect(whSubjectWords).not.toContain('where');
    expect(whSubjectWords).not.toContain('when');
    expect(whSubjectWords).not.toContain('why');
  });
  it('el gate usa un curso real del orden CEFR', () => {
    expect(COURSE_ORDER).toContain(modes.find(x => x.id === 'subject-question').cefr);
  });
});
