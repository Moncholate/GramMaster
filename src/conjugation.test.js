import { describe, it, expect } from 'vitest';
import {
  buildConditionalText,
  presentParticiple,
  simplePast,
  pastParticiple,
  conjugate3p,
  smartCaseSubject,
  buildSentenceText,
  buildVerbPhrase,
  getAuxAndVerbForm,
  detectConjugatedVerbBase,
  getVerbChangeType,
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

  it('adverbio con "be" como verbo principal: afirmativa', () => {
    expect(s({ mode: 'affirmative', subject: 'Victor', verb: 'be', complement: 'a good teacher', tense: 'simple-present', adverb: 'always' }))
      .toBe('Victor is always a good teacher.');
  });
  it('adverbio con "be" como verbo principal: negativa (antes se perdía el adverbio)', () => {
    expect(s({ mode: 'negative', subject: 'Victor', verb: 'be', complement: 'a good teacher', tense: 'simple-present', adverb: 'always' }))
      .toBe('Victor is not always a good teacher.');
  });
  it('adverbio con "be" como verbo principal: interrogativa (antes se perdía el adverbio)', () => {
    expect(s({ mode: 'interrogative', subject: 'Victor', verb: 'be', complement: 'a good teacher', tense: 'simple-present', adverb: 'always' }))
      .toBe('Is Victor always a good teacher?');
  });
  it('adverbio con "be" en pasado simple: negativa', () => {
    expect(s({ mode: 'negative', subject: 'she', verb: 'be', complement: 'happy', tense: 'simple-past', adverb: 'always' }))
      .toBe('She was not always happy.');
  });
  it('adverbio con "be" en pasado simple: interrogativa', () => {
    expect(s({ mode: 'interrogative', subject: 'she', verb: 'be', complement: 'happy', tense: 'simple-past', adverb: 'always' }))
      .toBe('Was she always happy?');
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
  it('going-to interrogativo', () => {
    const { auxiliary, verbForm } = getAuxAndVerbForm('she', 'travel', 'future-going-to', '', 'interrogative');
    expect(auxiliary).toBe('is going to');
    expect(verbForm).toBe('travel');
  });
  it('have to: se conjuga en 3ª persona', () => {
    expect(getAuxAndVerbForm('she', 'work', '', 'have-to', 'affirmative').auxiliary).toBe('has to');
    expect(getAuxAndVerbForm('they', 'work', '', 'have-to', 'affirmative').auxiliary).toBe('have to');
  });
  it('have to: niega con do/does, no con "not"', () => {
    expect(getAuxAndVerbForm('she', 'work', '', 'have-to', 'negative').auxiliary).toBe("doesn't have to");
    expect(getAuxAndVerbForm('i', 'work', '', 'have-to', 'negative').auxiliary).toBe("don't have to");
  });
  it('have to interrogativo: solo "does" se antepone al sujeto', () => {
    expect(getAuxAndVerbForm('she', 'work', '', 'have-to', 'interrogative').auxiliary).toBe('does have to');
  });
});

/* `have to` es el único "modal" de la lista que se conjuga y usa do/does.
   Se cubren las tres formas porque cada una toma una rama distinta. */
/* El teclado del móvil capitaliza la primera letra de cada campo, y eso llegaba
   a la oración final ("She works At home."). Al mismo tiempo el inglés SÍ
   capitaliza días, meses e idiomas — que el español no, y es un error clásico. */
describe('mayúsculas del complemento y del sujeto', () => {
  const s = (cfg) => buildSentenceText(cfg);

  it('baja la mayúscula automática del complemento', () => {
    expect(s({ mode: 'affirmative', subject: 'she', verb: 'work', complement: 'At home', tense: 'simple-present' }))
      .toBe('She works at home.');
  });
  it('conserva los nombres propios del complemento', () => {
    expect(s({ mode: 'affirmative', subject: 'they', verb: 'live', complement: 'in Peru', tense: 'simple-present' }))
      .toBe('They live in Peru.');
  });
  it('capitaliza los días aunque estén en el diccionario', () => {
    expect(s({ mode: 'affirmative', subject: 'i', verb: 'study', complement: 'on monday', tense: 'simple-present' }))
      .toBe('I study on Monday.');
  });
  it('capitaliza meses e idiomas', () => {
    expect(s({ mode: 'affirmative', subject: 'we', verb: 'travel', complement: 'in january', tense: 'simple-past' }))
      .toBe('We traveled in January.');
    expect(s({ mode: 'affirmative', subject: 'he', verb: 'speak', complement: 'english', tense: 'simple-present' }))
      .toBe('He speaks English.');
  });
  it('el sujeto sigue normalizando "i" y los nombres', () => {
    expect(s({ mode: 'affirmative', subject: 'i', verb: 'work', complement: '', tense: 'simple-present' }))
      .toBe('I work.');
    expect(s({ mode: 'affirmative', subject: 'maria', verb: 'work', complement: '', tense: 'simple-present' }))
      .toBe('Maria works.');
  });
});

describe('have to — modal que se comporta como verbo', () => {
  const s = (cfg) => buildSentenceText(cfg);
  it('afirmativa: has to en 3ª persona', () => {
    expect(s({ mode: 'affirmative', subject: 'she', verb: 'work', complement: 'on Sundays', modal: 'have-to' }))
      .toBe('She has to work on Sundays.');
  });
  it('afirmativa: have to en el resto', () => {
    expect(s({ mode: 'affirmative', subject: 'they', verb: 'study', complement: '', modal: 'have-to' }))
      .toBe('They have to study.');
  });
  it('negativa: doesn\'t have to (no "have to not")', () => {
    expect(s({ mode: 'negative', subject: 'she', verb: 'work', complement: '', modal: 'have-to' }))
      .toBe("She doesn't have to work.");
  });
  it('negativa: don\'t have to en el resto', () => {
    expect(s({ mode: 'negative', subject: 'I', verb: 'go', complement: '', modal: 'have-to' }))
      .toBe("I don't have to go.");
  });
  it('interrogativa: Does + sujeto + have to', () => {
    expect(s({ mode: 'interrogative', subject: 'she', verb: 'work', complement: 'today', modal: 'have-to' }))
      .toBe('Does she have to work today?');
  });
  it('interrogativa con WH', () => {
    expect(s({ mode: 'interrogative', subject: 'they', verb: 'go', complement: '', modal: 'have-to', whWord: 'when' }))
      .toBe('When do they have to go?');
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

describe('getVerbChangeType — clasificación para el desglose visual', () => {
  // Deriva verbForm como lo hace App.jsx (vía getAuxAndVerbForm) para que
  // el test ejercite el mismo camino real, no un valor inventado a mano.
  const changeType = (subject, verb, tenseId) => {
    const { verbForm } = getAuxAndVerbForm(subject, verb, tenseId, '', 'affirmative');
    return getVerbChangeType(verbForm, verb, tenseId);
  };

  it('cambio ortográfico -y→-ies en 3ra persona (el bug reportado: "study" en presente simple)', () => {
    expect(changeType('she', 'study', 'simple-present')).toBe('third-person-s');
  });
  it('otros verbos con -y→-ies', () => {
    expect(changeType('he', 'try', 'simple-present')).toBe('third-person-s');
    expect(changeType('it', 'carry', 'simple-present')).toBe('third-person-s');
  });
  it('3ra persona con +es normal', () => {
    expect(changeType('she', 'watch', 'simple-present')).toBe('third-person-s');
    expect(changeType('he', 'go', 'simple-present')).toBe('third-person-s');
  });
  it('3ra persona con +s normal', () => {
    expect(changeType('she', 'work', 'simple-present')).toBe('third-person-s');
  });
  it('sin cambio cuando el sujeto no es 3ra persona', () => {
    expect(changeType('I', 'work', 'simple-present')).toBe('base');
  });

  it('pasado simple regular', () => {
    expect(changeType('she', 'work', 'simple-past')).toBe('past');
    expect(changeType('she', 'study', 'simple-past')).toBe('past');
  });
  it('pasado simple irregular', () => {
    expect(changeType('she', 'go', 'simple-past')).toBe('irregular');
    expect(changeType('she', 'have', 'simple-past')).toBe('irregular');
  });

  it('participio regular en tiempos perfectos', () => {
    expect(changeType('she', 'work', 'present-perfect')).toBe('participle');
    expect(changeType('they', 'study', 'past-perfect')).toBe('participle');
  });
  it('participio irregular en tiempos perfectos', () => {
    expect(changeType('she', 'go', 'present-perfect')).toBe('irregular');
  });

  it('siempre -ing en continuos, sin importar irregularidad', () => {
    expect(changeType('she', 'run', 'present-continuous')).toBe('ing');
    expect(changeType('she', 'study', 'present-continuous')).toBe('ing');
    expect(changeType('she', 'be', 'present-continuous')).toBe('ing');
  });
});

/* ── Condicionales ────────────────────────────────────────────────────────
   Son DOS cláusulas ligadas y el tipo fija los dos tiempos, así que no entran
   en la lista de `tenses`: se arman llamando dos veces al mismo motor por
   cláusula. Lo único que no existía era `would have` + participio. */
describe('condicionales', () => {
  const arma = (tipo, condicion, resultado, ifAlFinal = false) =>
    buildConditionalText({ tipo, condicion, resultado, ifAlFinal });

  it('1ª — presente simple + will', () => {
    expect(arma(1, { subject: 'it', verb: 'rain' }, { subject: 'I', verb: 'stay', complement: 'home' }))
      .toBe('If it rains, I will stay home.');
    // la condición conjuga en 3ª persona como cualquier presente simple
    expect(arma(1, { subject: 'she', verb: 'call' }, { subject: 'we', verb: 'answer' }))
      .toBe('If she calls, we will answer.');
  });

  it('2ª — pasado simple + would', () => {
    expect(arma(2, { subject: 'I', verb: 'have', complement: 'money' }, { subject: 'I', verb: 'travel' }))
      .toBe('If I had money, I would travel.');
    // un nombre propio conserva su mayúscula aunque vaya después de "If"
    expect(arma(2, { subject: 'Maria', verb: 'live', complement: 'in Peru' }, { subject: 'we', verb: 'visit', complement: 'her' }))
      .toBe('If Maria lived in Peru, we would visit her.');
  });

  it('2ª — subjuntivo: `were` para todas las personas', () => {
    // Es la forma que enseña el libro en «If I were you, I'd…». Con el pasado
    // simple normal saldría «If I was you», que no es lo que se practica.
    expect(arma(2, { subject: 'I', verb: 'be', complement: 'you' }, { subject: 'I', verb: 'call', complement: 'her' }))
      .toBe('If I were you, I would call her.');
  });

  it('3ª — pasado perfecto + would have + participio', () => {
    expect(arma(3, { subject: 'I', verb: 'study' }, { subject: 'I', verb: 'pass', complement: 'the exam' }))
      .toBe('If I had studied, I would have passed the exam.');
    // participio irregular en la principal
    expect(arma(3, { subject: 'they', verb: 'arrive', complement: 'early' }, { subject: 'we', verb: 'see', complement: 'the show' }))
      .toBe('If they had arrived early, we would have seen the show.');
  });

  it('con el `if` al final no lleva coma y la principal abre la oración', () => {
    expect(arma(2, { subject: 'I', verb: 'have', complement: 'money' }, { subject: 'I', verb: 'travel' }, true))
      .toBe('I would travel if I had money.');
  });

  it('sin las dos cláusulas completas no devuelve nada a medias', () => {
    expect(arma(1, { subject: 'it', verb: '' }, { subject: 'I', verb: 'stay' })).toBe('');
    expect(arma(1, { subject: 'it', verb: 'rain' }, { subject: '', verb: 'stay' })).toBe('');
  });
});
