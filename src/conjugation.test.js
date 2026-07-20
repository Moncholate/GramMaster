import { describe, it, expect } from 'vitest';
import {
  presentParticiple,
  simplePast,
  pastParticiple,
  conjugate3p,
  smartCaseSubject,
  buildSentenceText,
  buildVerbPhrase,
  getAuxAndVerbForm,
  detectConjugatedVerbBase,
} from './conjugation';

describe('presentParticiple', () => {
  it('be → being (no "bing")', () => {
    expect(presentParticiple('be')).toBe('being');
  });
  it('regular -e drop: make → making', () => {
    expect(presentParticiple('make')).toBe('making');
  });
  it('-ee stays: see → seeing', () => {
    expect(presentParticiple('see')).toBe('seeing');
  });
  it('-ie → -ying: die → dying', () => {
    expect(presentParticiple('die')).toBe('dying');
  });
  it('monosyllabic CVC doubles: run → running', () => {
    expect(presentParticiple('run')).toBe('running');
  });
  it('stressed-final bisyllabic doubles: begin → beginning', () => {
    expect(presentParticiple('begin')).toBe('beginning');
  });
  it('unstressed-final bisyllabic does not double: remember → remembering', () => {
    expect(presentParticiple('remember')).toBe('remembering');
  });
  it('unstressed-final bisyllabic does not double: visit → visiting', () => {
    expect(presentParticiple('visit')).toBe('visiting');
  });
});

describe('simplePast', () => {
  it('irregular: go → went', () => {
    expect(simplePast('go')).toBe('went');
  });
  it('unstressed bisyllabic no doubling: listen → listened', () => {
    expect(simplePast('listen')).toBe('listened');
  });
  it('unstressed bisyllabic no doubling: happen → happened', () => {
    expect(simplePast('happen')).toBe('happened');
  });
  it('unstressed bisyllabic no doubling: offer → offered', () => {
    expect(simplePast('offer')).toBe('offered');
  });
  it('stressed-final bisyllabic doubles: prefer → preferred', () => {
    expect(simplePast('prefer')).toBe('preferred');
  });
  it('monosyllabic CVC doubles: stop → stopped', () => {
    expect(simplePast('stop')).toBe('stopped');
  });
  it('consonant+y: study → studied', () => {
    expect(simplePast('study')).toBe('studied');
  });
  it('dual-form verbs use a single primary form, no slash: burn → burned', () => {
    expect(simplePast('burn')).toBe('burned');
  });
  it('dual-form verbs use a single primary form, no slash: dream → dreamed', () => {
    expect(simplePast('dream')).toBe('dreamed');
  });
});

describe('pastParticiple', () => {
  it('irregular with distinct participle: get → gotten (no slash)', () => {
    expect(pastParticiple('get')).toBe('gotten');
  });
  it('irregular: go → gone', () => {
    expect(pastParticiple('go')).toBe('gone');
  });
});

describe('conjugate3p', () => {
  it('irregular exception: have → has (not "haves")', () => {
    expect(conjugate3p('have')).toBe('has');
  });
  it('irregular exception: be → is', () => {
    expect(conjugate3p('be')).toBe('is');
  });
  it('-o adds -es: go → goes', () => {
    expect(conjugate3p('go')).toBe('goes');
  });
  it('-ch adds -es: watch → watches', () => {
    expect(conjugate3p('watch')).toBe('watches');
  });
  it('consonant+y: study → studies', () => {
    expect(conjugate3p('study')).toBe('studies');
  });
  it('vowel+y: play → plays', () => {
    expect(conjugate3p('play')).toBe('plays');
  });
});

describe('smartCaseSubject', () => {
  it('"i" always capitalizes to "I"', () => {
    expect(smartCaseSubject('i')).toBe('I');
  });
  it('known Hispanic names get capitalized: maria → Maria', () => {
    expect(smartCaseSubject('maria')).toBe('Maria');
  });
  it('pronouns mid-sentence stay lowercase: He → he', () => {
    expect(smartCaseSubject('He')).toBe('he');
  });
  it('common determiner+noun stays lowercase: The dog → the dog', () => {
    expect(smartCaseSubject('The dog')).toBe('the dog');
  });
});

describe('buildSentenceText — casos críticos de la revisión', () => {
  const s = (cfg) => buildSentenceText(cfg);

  it('C5: "I" nunca en minúscula en interrogativas', () => {
    expect(s({ mode: 'interrogative', subject: 'I', verb: 'work', complement: 'every day', tense: 'simple-present' }))
      .toBe('Do I work every day?');
  });
  it('C5: nombre propio conserva mayúscula en interrogativas', () => {
    expect(s({ mode: 'interrogative', subject: 'maria', verb: 'work', complement: '', tense: 'simple-present' }))
      .toBe('Does Maria work?');
  });

  it('C1: orden correcto en interrogativa de futuro perfecto', () => {
    expect(s({ mode: 'interrogative', subject: 'she', verb: 'work', complement: 'by then', tense: 'future-perfect' }))
      .toBe('Will she have worked by then?');
  });
  it('C1: orden correcto en interrogativa "going to"', () => {
    expect(s({ mode: 'interrogative', subject: 'she', verb: 'travel', complement: 'tomorrow', tense: 'future-going-to' }))
      .toBe('Is she going to travel tomorrow?');
  });
  it('C1: orden correcto en presente perfecto continuo interrogativo', () => {
    expect(s({ mode: 'interrogative', subject: 'she', verb: 'work', complement: 'all day', tense: 'present-perfect-continuous' }))
      .toBe('Has she been working all day?');
  });
  it('C1: orden correcto en used-to interrogativo', () => {
    expect(s({ mode: 'interrogative', subject: 'she', verb: 'work', complement: '', tense: 'used-to' }))
      .toBe('Did she use to work?');
  });
  it('C1: orden correcto en pasado perfecto continuo interrogativo', () => {
    expect(s({ mode: 'interrogative', subject: 'they', verb: 'study', complement: '', tense: 'past-perfect-continuous' }))
      .toBe('Had they been studying?');
  });

  it('C2/C3: be y have conjugan correctamente en presente continuo/simple', () => {
    expect(s({ mode: 'affirmative', subject: 'she', verb: 'be', complement: 'careful', tense: 'present-continuous' }))
      .toBe('She is being careful.');
    expect(s({ mode: 'affirmative', subject: 'she', verb: 'have', complement: 'breakfast', tense: 'simple-present' }))
      .toBe('She has breakfast.');
  });

  it('C6: sin doble negación cuando hay adverbio negativo (el estado de UI filtra el adverbio, esto valida la construcción con uno neutro)', () => {
    expect(s({ mode: 'negative', subject: 'she', verb: 'work', complement: '', tense: 'simple-present', adverb: 'always' }))
      .toBe("She doesn't always work.");
  });

  it('C7: formas duales sin barra', () => {
    expect(s({ mode: 'affirmative', subject: 'she', verb: 'get', complement: 'a car', tense: 'present-perfect' }))
      .toBe('She has gotten a car.');
  });

  it('WH: extensión "how many"', () => {
    expect(s({ mode: 'interrogative', subject: 'you', verb: 'have', complement: '', tense: 'simple-present', whWord: 'how', whExtension: 'many books' }))
      .toBe('How many books do you have?');
  });

  it('modales: negativo con contracción irregular', () => {
    expect(s({ mode: 'negative', subject: 'he', verb: 'go', complement: '', modal: 'may' }))
      .toBe('He may not go.');
  });
});

describe('buildVerbPhrase — modo práctica', () => {
  it('negativo presente simple, 3ra persona', () => {
    expect(buildVerbPhrase('She', 'work', 'simple-present', null, 'negative')).toBe("doesn't work");
  });
  it('afirmativo presente perfecto', () => {
    expect(buildVerbPhrase('I', 'work', 'present-perfect', null, 'affirmative')).toBe('have worked');
  });
  it('be como verbo principal', () => {
    expect(buildVerbPhrase('She', 'be', 'simple-present', null, 'affirmative')).toBe('is');
  });
  it('used-to negativo', () => {
    expect(buildVerbPhrase('She', 'work', 'used-to', null, 'negative')).toBe("didn't use to work");
  });
});

describe('getAuxAndVerbForm — usado por el desglose visual', () => {
  it('futuro perfecto interrogativo separa "will" de "have"', () => {
    const { auxiliary, verbForm } = getAuxAndVerbForm('she', 'work', 'future-perfect', '', 'interrogative');
    expect(auxiliary).toBe('will have');
    expect(verbForm).toBe('worked');
  });
  it('going-to interrogativo', () => {
    const { auxiliary, verbForm } = getAuxAndVerbForm('she', 'travel', 'future-going-to', '', 'interrogative');
    expect(auxiliary).toBe('is going to');
    expect(verbForm).toBe('travel');
  });
});

describe('detectConjugatedVerbBase — I5', () => {
  it('detecta pasado regular', () => {
    expect(detectConjugatedVerbBase('worked')).toBe('work');
  });
  it('detecta gerundio', () => {
    expect(detectConjugatedVerbBase('working')).toBe('work');
  });
  it('detecta 3ra persona', () => {
    expect(detectConjugatedVerbBase('works')).toBe('work');
  });
  it('detecta pasado irregular', () => {
    expect(detectConjugatedVerbBase('went')).toBe('go');
  });
  it('detecta participio irregular', () => {
    expect(detectConjugatedVerbBase('gone')).toBe('go');
  });
  it('detecta "has" → "have"', () => {
    expect(detectConjugatedVerbBase('has')).toBe('have');
  });
  it('no marca un verbo ya en forma base', () => {
    expect(detectConjugatedVerbBase('work')).toBeNull();
  });
  it('no marca un verbo irregular ya en forma base', () => {
    expect(detectConjugatedVerbBase('read')).toBeNull();
  });
  it('no marca texto sin sentido', () => {
    expect(detectConjugatedVerbBase('xyzabc')).toBeNull();
  });
});
