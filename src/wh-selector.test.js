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
