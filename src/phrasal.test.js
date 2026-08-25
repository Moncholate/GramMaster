// El campo Verbo con más de una palabra.
//
// EL CASO QUE LO ORIGINÓ: el profesor escribió dos verbos y la app generó «She
// work studies.» sin frenarlo — el conjugador conjugaba la ÚLTIMA palabra. Al
// mirarlo apareció algo peor: el mismo camino rechazaba los 13 phrasal verbs
// del vocabulario del curso, y si el alumno ignoraba el aviso salía «She get
// ups» y «She get upped». La app enseñando inglés roto con verbos que ella misma
// enseña.
//
// Son dos arreglos que van juntos y por eso están en el mismo archivo: aceptar
// los frasales sin conjugarlos bien, o conjugarlos bien sin aceptarlos, deja el
// problema a medias en la dirección contraria.
import { describe, it, expect } from 'vitest';
import { buildSentenceText, conjugate3p, simplePast, presentParticiple, pastParticiple } from './conjugation';
import { validateVerb } from './data/validation';
import { PHRASAL_VERB_LIST } from './data/phrasal.generated.js';

const frase = (verb, tense, mode = 'affirmative') =>
  buildSentenceText({ mode, subject: 'she', verb, complement: '', tense });

describe('los frasales se conjugan por la CABEZA, no por la partícula', () => {
  it('la partícula nunca se conjuga', () => {
    expect(conjugate3p('get up')).toBe('gets up');
    expect(simplePast('get up')).toBe('got up');
    expect(presentParticiple('get up')).toBe('getting up');
    expect(pastParticiple('get up')).toBe('gotten up');
  });

  it('la irregularidad de la cabeza se conserva', () => {
    // El fallo que esto impide: «wake ups», «wake upped».
    expect(conjugate3p('wake up')).toBe('wakes up');
    expect(simplePast('wake up')).toBe('woke up');
    expect(simplePast('put on')).toBe('put on');      // invariable, y sigue siéndolo
    expect(simplePast('take off')).toBe('took off');
  });

  it('los verbos de una palabra no cambian', () => {
    expect(conjugate3p('study')).toBe('studies');
    expect(simplePast('stop')).toBe('stopped');
    expect(presentParticiple('run')).toBe('running');
  });

  it('en la oración completa, en los tres modos', () => {
    expect(frase('get up', 'simple-present')).toBe('She gets up.');
    expect(frase('get up', 'simple-past')).toBe('She got up.');
    expect(frase('get up', 'present-continuous')).toBe('She is getting up.');
    expect(frase('get up', 'simple-present', 'negative')).toBe("She doesn't get up.");
    expect(frase('get up', 'simple-present', 'interrogative')).toBe('Does she get up?');
  });

  /* Barrido: ningún frasal de la lista compartida puede producir una partícula
     conjugada. Es la comprobación que caza el caso que nadie escribió a mano. */
  it('ninguno de los 40 frasales conjuga su partícula', () => {
    for (const partes of PHRASAL_VERB_LIST) {
      const v = partes.join(' ');
      const cola = partes.slice(1).join(' ');
      for (const fn of [conjugate3p, simplePast, presentParticiple, pastParticiple]) {
        const salida = fn(v);
        expect(salida.endsWith(cola), `«${v}» → «${salida}»: la partícula cambió`).toBe(true);
      }
    }
  });
});

describe('el campo Verbo distingue tres casos distintos', () => {
  it('un phrasal del curso NO es un error', () => {
    for (const v of ['get up', 'wake up', 'look for', 'go out', 'put on', 'sit down']) {
      const r = validateVerb(v, 'es');
      expect(r.valid, `«${v}» debería aceptarse`).toBe(true);
      expect(r.warning).toBe(null);
    }
  });

  it('dos verbos: lo dice y ofrece quedarse con el primero', () => {
    const r = validateVerb('work study', 'es');
    expect(r.valid).toBe(false);
    expect(r.warning).toContain('un solo verbo');
    expect(r.arreglo).toBe('work');
    expect(r.alComplemento).toBeUndefined();   // no hay nada que mover: sobra un VERBO
  });

  it('verbo + complemento: ofrece MOVER la palabra, no tirarla', () => {
    const r = validateVerb('study english', 'es');
    expect(r.valid).toBe(false);
    expect(r.warning).toContain('complemento');
    expect(r.arreglo).toBe('study');
    expect(r.alComplemento).toBe('english');
  });

  /* «want to eat» es una perífrasis, no dos verbos sueltos. Decirle a quien la
     escribe que «sobra un verbo» sería confundirlo justo cuando está usando bien
     una estructura que el curso enseña. */
  it('«want to eat» no se trata como dos verbos', () => {
    const r = validateVerb('want to eat', 'es');
    expect(r.warning).not.toContain('un solo verbo');
    expect(r.alComplemento).toBe('to eat');
  });

  it('lo que no empieza por verbo sigue por el camino de siempre', () => {
    expect(validateVerb('xyz abc', 'es').warning).toContain('no está en nuestra lista');
  });

  it('un verbo normal sigue sin aviso', () => {
    expect(validateVerb('work', 'es')).toEqual({ valid: true, warning: null });
  });
});
