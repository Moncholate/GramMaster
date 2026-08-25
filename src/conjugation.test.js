import { describe, it, expect, beforeEach } from 'vitest';
import { faltaPreposicion, validateComplement } from './data/validation';
import {
  buildConditionalText,
  presentParticiple,
  simplePast,
  pastParticiple,
  conjugate3p,
  smartCaseSubject,
  isThirdPersonSingular,
  registrarNombres,
  nombreAmbiguo,
  buildSentenceText,
  buildVerbPhrase,
  getAuxAndVerbForm,
  detectConjugatedVerbBase,
  getVerbChangeType,
  conditionalVerbPhrase,
  esWasPorWere,
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
      /* Contraída desde 2026-08-12: la app contraía do/does/did/will y dejaba
         enteros be y have, sin ninguna regla que lo explicara. Ver `negAux`. */
      .toBe("Victor isn't always a good teacher.");
  });
  it('adverbio con "be" como verbo principal: interrogativa (antes se perdía el adverbio)', () => {
    expect(s({ mode: 'interrogative', subject: 'Victor', verb: 'be', complement: 'a good teacher', tense: 'simple-present', adverb: 'always' }))
      .toBe('Is Victor always a good teacher?');
  });
  it('adverbio con "be" en pasado simple: negativa', () => {
    expect(s({ mode: 'negative', subject: 'she', verb: 'be', complement: 'happy', tense: 'simple-past', adverb: 'always' }))
      .toBe("She wasn't always happy.");
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
  const arma = (tipo, condicion, resultado, extra = {}) =>
    buildConditionalText({ tipo, condicion, resultado, ...extra });

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
    expect(arma(2, { subject: 'I', verb: 'have', complement: 'money' }, { subject: 'I', verb: 'travel' }, { ifAlFinal: true }))
      .toBe('I would travel if I had money.');
  });

  it('sin las dos cláusulas completas no devuelve nada a medias', () => {
    expect(arma(1, { subject: 'it', verb: '' }, { subject: 'I', verb: 'stay' })).toBe('');
    expect(arma(1, { subject: 'it', verb: 'rain' }, { subject: '', verb: 'stay' })).toBe('');
  });
});

/* El signo de las dos cláusulas es INDEPENDIENTE. Negar el resultado («no me
   quedaré») y negar la condición («si no llueve») son cosas distintas, y
   confundirlas es un error clásico. La interrogativa solo toca al resultado:
   la cláusula `if` nunca se pregunta. */
describe('condicionales: negativa e interrogativa', () => {
  const c1 = { subject: 'it', verb: 'rain' };
  const r1 = { subject: 'I', verb: 'stay', complement: 'home' };
  const tu = { subject: 'you', verb: 'stay', complement: 'home' };
  const arma = (a) => buildConditionalText(a);

  it('niega el RESULTADO', () => {
    expect(arma({ tipo: 1, condicion: c1, resultado: r1, modo: 'negative' }))
      .toBe("If it rains, I won't stay home.");
    expect(arma({ tipo: 2, condicion: { subject: 'I', verb: 'have', complement: 'money' }, resultado: { subject: 'I', verb: 'travel' }, modo: 'negative' }))
      .toBe("If I had money, I wouldn't travel.");
    expect(arma({ tipo: 3, condicion: { subject: 'I', verb: 'study' }, resultado: { subject: 'I', verb: 'pass' }, modo: 'negative' }))
      .toBe("If I had studied, I wouldn't have passed.");
  });

  it('niega la CONDICIÓN, que es otra cosa', () => {
    expect(arma({ tipo: 1, condicion: c1, resultado: r1, condicionNegativa: true }))
      .toBe("If it doesn't rain, I will stay home.");
    expect(arma({ tipo: 1, condicion: c1, resultado: r1, condicionNegativa: true, modo: 'negative' }))
      .toBe("If it doesn't rain, I won't stay home.");
  });

  it('interrogativa: pregunta el resultado, nunca el `if`', () => {
    expect(arma({ tipo: 1, condicion: c1, resultado: tu, modo: 'interrogative' }))
      .toBe('If it rains, will you stay home?');
    expect(arma({ tipo: 2, condicion: { subject: 'I', verb: 'have', complement: 'money' }, resultado: { subject: 'you', verb: 'travel' }, modo: 'interrogative' }))
      .toBe('If I had money, would you travel?');
    expect(arma({ tipo: 3, condicion: { subject: 'I', verb: 'study' }, resultado: { subject: 'you', verb: 'pass' }, modo: 'interrogative' }))
      .toBe('If I had studied, would you have passed?');
    // con el `if` al final la principal abre y conserva su mayúscula
    expect(arma({ tipo: 1, condicion: c1, resultado: tu, modo: 'interrogative', ifAlFinal: true }))
      .toBe('Will you stay home if it rains?');
  });

  it('el subjuntivo negado es `weren\'t`, no «were not»', () => {
    const be = { subject: 'I', verb: 'be', complement: 'you' };
    expect(arma({ tipo: 2, condicion: be, resultado: { subject: 'I', verb: 'travel' }, condicionNegativa: true }))
      .toBe("If I weren't you, I would travel.");
    expect(arma({ tipo: 2, condicion: { subject: 'she', verb: 'be', complement: 'here' }, resultado: { subject: 'we', verb: 'ask', complement: 'her' } }))
      .toBe('If she were here, we would ask her.');
  });
});

/* Nombres propios en minúscula. La lista de nombres solo tenía hispanos, así
   que «peter» escrito en minúscula se quedaba así. En el modo normal no se
   notaba —el sujeto abre la oración y se capitaliza igual— pero en una
   condicional va detrás de «If » y el fallo queda a la vista. */
/* SALIÓ EN CLASE (2026-08-11). El profesor puso de sujeto el nombre de un
   alumno, «Jans», y la app conjugó en plural: «Jans work». La regla del plural
   en -s se ejecutaba ANTES de mirar si la palabra era un nombre propio, así que
   se llevaba por delante a los 31 nombres terminados en -s que ya estaban en
   las listas. En un curso chileno eso es media lista de clase. */
describe('un nombre propio es singular aunque termine en -s', () => {
  const nombres = ['carlos', 'lucas', 'andrés', 'andres', 'matías', 'nicolás',
                   'tomás', 'marcos', 'jesús', 'luis', 'inés', 'mercedes',
                   'james', 'nicholas', 'charles', 'thomas', 'douglas',
                   'torres', 'flores', 'reyes', 'morales', 'vargas'];
  it('los conjuga en tercera persona', () => {
    const mal = nombres.filter(n => !isThirdPersonSingular(n));
    expect(mal.join(' ')).toBe('');
  });
  it('y la oración sale con la -s', () => {
    expect(buildSentenceText({ mode: 'affirmative', subject: 'carlos',
      verb: 'work', complement: 'at home', tense: 'simple-present' }))
      .toBe('Carlos works at home.');
  });
  it('sin robarle casos a la regla del plural', () => {
    // La lista de nombres no contiene ningún plural común: se verificó al
    // crearla y este test lo mantiene cierto.
    for (const p of ['students', 'teachers', 'my parents', 'the books', 'people'])
      expect(isThirdPersonSingular(p)).toBe(false);
  });
});

/* La otra mitad del caso «Jans»: los 397 nombres de las listas no pueden cubrir
   a cada alumno, y ante una palabra desconocida terminada en -s la app NO TIENE
   FORMA de saber si es un plural o un nombre. Medido antes de decidir: tratar lo
   desconocido como singular rompía 10 de 26 plurales corrientes. Así que la app
   no adivina: lo pregunta una vez y se acuerda. */
describe('la -s ambigua se pregunta, no se adivina', () => {
  beforeEach(() => registrarNombres([]));

  it('avisa con una palabra que no puede clasificar', () => {
    expect(nombreAmbiguo('Jans')).toBe('jans');
    expect(nombreAmbiguo('Sotomayors')).toBe('sotomayors');
  });
  it('NO avisa cuando tiene con qué decidir', () => {
    const callados = [
      'students',      // «student» está en el diccionario: es plural y punto
      'the students',  // con determinante es un sustantivo común, no un nombre
      'people',        // plural irregular
      'Carlos',        // nombre conocido
      'news',          // excepción: acaba en -s y es singular
      'he', 'they',    // pronombres
      'my brother',    // no acaba en -s
    ];
    expect(callados.filter(s => nombreAmbiguo(s))).toEqual([]);
  });
  it('al declararlo, deja de preguntar y conjuga en singular', () => {
    expect(isThirdPersonSingular('jans')).toBe(false);   // antes: leído como plural
    registrarNombres(['jans']);
    expect(nombreAmbiguo('Jans')).toBe(null);
    expect(isThirdPersonSingular('jans')).toBe(true);
    expect(buildSentenceText({ mode: 'affirmative', subject: 'jans',
      verb: 'work', complement: 'at home', tense: 'simple-present' }))
      .toBe('Jans works at home.');
    /* Y también se capitaliza a MITAD de oración. Lo destapó este test: al
       declararlo se conjugaba en singular pero seguía en minúscula dentro del
       complemento, porque `smartCase` miraba las listas y no el registro. */
    expect(smartCaseSubject('with jans')).toBe('with Jans');
  });
});

/* La -s no decide sola el número, y hay dos familias que lo demuestran en
   direcciones opuestas. Salieron sondeando el generador contra una lista de
   sujetos etiquetados a mano: de 47, estos eran los únicos que fallaban. */
describe('sujetos donde la -s miente', () => {
  it('las asignaturas en -ics son singulares', () => {
    for (const s of ['mathematics', 'physics', 'economics', 'gymnastics'])
      expect(isThirdPersonSingular(s)).toBe(true);
    expect(buildSentenceText({ mode: 'affirmative', subject: 'physics',
      verb: 'be', complement: 'difficult', tense: 'simple-present' }))
      .toBe('Physics is difficult.');
  });
  it('«police» va en plural aunque no acabe en -s', () => {
    expect(isThirdPersonSingular('the police')).toBe(false);
    expect(buildSentenceText({ mode: 'affirmative', subject: 'the police',
      verb: 'be', complement: 'here', tense: 'simple-present' }))
      .toBe('The police are here.');
  });
  it('sin tocar los plurales normales ni los nombres en -s', () => {
    for (const p of ['students', 'my parents', 'the books', 'people'])
      expect(isThirdPersonSingular(p)).toBe(false);
    for (const n of ['carlos', 'marcos', 'mercedes'])
      expect(isThirdPersonSingular(n)).toBe(true);
  });
  it('y ninguna de las dos familias se pregunta como nombre ambiguo', () => {
    expect(['physics', 'mathematics', 'the police'].filter(s => nombreAmbiguo(s))).toEqual([]);
  });
});

/* SALIÓ EN CLASE (2026-08-11). El profesor armó una oración con `go` y un lugar
   y la app la construyó sin decir que faltaba el `to`: el validador no recibía
   el verbo, así que no podía saberlo. */
describe('verbos que piden preposición', () => {
  it('avisa cuando falta', () => {
    expect(faltaPreposicion('go', 'the park')).toBe('to');
    expect(faltaPreposicion('listen', 'the music')).toBe('to');
    expect(faltaPreposicion('wait', 'the bus')).toBe('for');
    expect(faltaPreposicion('arrive', 'the station')).toBe('at');
    expect(faltaPreposicion('depend', 'the weather')).toBe('on');
  });
  it('se calla donde la versión sin preposición es CORRECTA', () => {
    /* Estas son las que convertirían el aviso en ruido. `home`, `there` y
       `swimming` no llevan determinante, y por eso ni se miran. */
    const correctas = [
      ['go', 'home'], ['go', 'there'], ['go', 'back'], ['go', 'abroad'],
      ['go', 'swimming'], ['go', 'by bus'], ['go', 'with friends'],
      ['go', 'to the park'],            // ya la lleva
      ['wait', 'a minute'],             // `a` no dispara: sería un aviso falso
      ['come', 'this way'],             // `this` tampoco
      ['walk', 'the dog'], ['drive', 'the car'], ['pay', 'the bill'],
      ['return', 'the book'], ['ask', 'the teacher'], ['look', 'the same'],
    ];
    const falsos = correctas.filter(([v, c]) => faltaPreposicion(v, c));
    expect(falsos.map(([v, c]) => `${v} ${c}`).join(' | ')).toBe('');
  });
  /* Pregunta del profesor: «si escribo go Duoc, ¿lo reconoce?». No lo hacía: el
     disparo era el determinante, así que «go Duoc», «go Santiago», «go school» y
     «go work» pasaban en silencio. */
  it('caza el nombre propio detrás de un verbo de movimiento', () => {
    expect(faltaPreposicion('go', 'Duoc')).toBe('to');
    expect(faltaPreposicion('go', 'Santiago')).toBe('to');
    expect(faltaPreposicion('come', 'Chile')).toBe('to');
    expect(faltaPreposicion('arrive', 'Valparaíso')).toBe('at');
    expect(validateComplement('Duoc', 'es', 'go').arreglo).toBe('to Duoc');
  });
  it('y el lugar pelado que lleva `to` sin artículo', () => {
    for (const l of ['school', 'work', 'university', 'class', 'bed', 'church'])
      expect(faltaPreposicion('go', l)).toBe('to');
    expect(validateComplement('school', 'es', 'go').arreglo).toBe('to school');
  });
  it('la mayúscula NO dispara donde no toca', () => {
    /* Palabra común con mayúscula, gerundio y las excepciones de movimiento. */
    const callados = [['go', 'Home'], ['go', 'There'], ['go', 'Swimming'],
                      ['go', 'North'], ['go', 'Tomorrow'], ['go', 'Dutch'],
                      ['go', 'Back'], ['go', 'Together']];
    expect(callados.filter(([v, c]) => faltaPreposicion(v, c))
      .map(([v, c]) => `${v} ${c}`).join(' | ')).toBe('');
  });
  it('el nombre propio no dispara con los verbos que NO son de movimiento', () => {
    /* «wait for school» o «wait for Duoc» no es lo que nadie quiere decir; ahí
       el aviso valdría menos que el silencio. */
    expect(faltaPreposicion('wait', 'school')).toBe(null);
    expect(faltaPreposicion('depend', 'Duoc')).toBe(null);
  });
  it('el arreglo NO se inventa el artículo', () => {
    /* «go park» necesitaría «to THE park» y el arreglo solo antepone la
       preposición, así que se calla en vez de sugerir mal. */
    expect(faltaPreposicion('go', 'park')).toBe(null);
    expect(faltaPreposicion('go', 'beach')).toBe(null);
  });
  it('el aviso trae el arreglo listo', () => {
    const r = validateComplement('the park', 'es', 'go');
    expect(r.valid).toBe(true);            // avisa, no bloquea
    expect(r.arreglo).toBe('to the park');
  });
});

describe('smartCase: nombres ingleses', () => {
  it('capitaliza el nombre aunque venga en minúscula', () => {
    expect(smartCaseSubject('peter')).toBe('Peter');
    expect(smartCaseSubject('john')).toBe('John');
    expect(smartCaseSubject('sarah')).toBe('Sarah');
    expect(smartCaseSubject('emma')).toBe('Emma');
    expect(smartCaseSubject('maria')).toBe('Maria');   // los hispanos ya andaban
  });

  it('NO toca las palabras comunes', () => {
    // No se puede usar «desconocido = nombre propio»: el diccionario de comunes
    // no tiene people, rain, exam… y quedarían capitalizados.
    for (const w of ['he', 'the dog', 'people', 'my brother', 'students'])
      expect(smartCaseSubject(w)).toBe(w);
  });

  it('no rompe los modales ni las palabras que también son nombre', () => {
    // `will`, `mark`, `rose`, `may`, `bill`… quedaron FUERA de la lista de
    // nombres a propósito: capitalizar «will» rompería el futuro.
    expect(smartCaseSubject('will')).toBe('will');
    // Los meses que NO son otra cosa se capitalizan solos.
    expect(smartCaseSubject('june')).toBe('June');
  });

  /* `may`, `march` y `august` son meses Y son otra palabra. Antes se
     capitalizaban a ciegas y salía «She works the March». Ahora las decide el
     motor de mayúsculas, que mira la palabra de al lado.

     Que «may» suelto se quede en minúscula no le quita la mayúscula a nada: si
     va de sujeto abre la oración y se capitaliza igual («May works.»), y si va
     de complemento con una preposición de tiempo delante el motor la reconoce
     («in May»). El único caso que pierde es «may» suelto como complemento, que
     además nadie sabría decir si es el mes o el modal. */
  it('los meses ambiguos esperan a tener contexto', () => {
    expect(smartCaseSubject('may')).toBe('may');
    expect(smartCaseSubject('in may')).toBe('in May');
    expect(smartCaseSubject('the march')).toBe('the march');
    expect(smartCaseSubject('in march')).toBe('in March');
    // Y en la oración completa el sujeto se capitaliza igual.
    expect(buildSentenceText({ mode: 'affirmative', subject: 'may', verb: 'work',
                               complement: '', tense: 'simple-present' })).toBe('May works.');
  });

  it('el nombre se capitaliza dentro de una condicional', () => {
    expect(buildConditionalText({ tipo: 1,
      condicion: { subject: 'peter', verb: 'run', complement: 'all day' },
      resultado: { subject: 'he', verb: 'be', complement: 'tired' } }))
      .toBe('If Peter runs all day, he will be tired.');
    // y el sujeto común de la condición NO se capitaliza pese a ir tras «If »
    expect(buildConditionalText({ tipo: 2,
      condicion: { subject: 'the dog', verb: 'bark' },
      resultado: { subject: 'sarah', verb: 'wake up' } }))
      .toBe('If the dog barked, Sarah would wake up.');
  });
});

describe('condicionales · la frase verbal de cada cláusula (modo práctica)', () => {
  const fv = (o) => conditionalVerbPhrase(o);

  it('1ª: presente simple en la condición, will en el resultado', () => {
    expect(fv({ tipo: 1, parte: 'condicion', subject: 'it', verb: 'rain' })).toBe('rains');
    expect(fv({ tipo: 1, parte: 'resultado', subject: 'I', verb: 'stay' })).toBe('will stay');
  });

  it('2ª: pasado simple en la condición, would en el resultado', () => {
    expect(fv({ tipo: 2, parte: 'condicion', subject: 'I', verb: 'win' })).toBe('won');
    expect(fv({ tipo: 2, parte: 'resultado', subject: 'I', verb: 'travel' })).toBe('would travel');
  });

  it('3ª: pasado perfecto en la condición, would have + participio en el resultado', () => {
    expect(fv({ tipo: 3, parte: 'condicion', subject: 'she', verb: 'call' })).toBe('had called');
    expect(fv({ tipo: 3, parte: 'resultado', subject: 'I', verb: 'go' })).toBe('would have gone');
  });

  it('el `were` del subjuntivo se pide para TODAS las personas', () => {
    // «If I were rich», no «If I was rich»: es la forma que se enseña
    expect(fv({ tipo: 2, parte: 'condicion', subject: 'I', verb: 'be' })).toBe('were');
    expect(fv({ tipo: 2, parte: 'condicion', subject: 'he', verb: 'be' })).toBe('were');
    expect(fv({ tipo: 2, parte: 'condicion', subject: 'they', verb: 'be' })).toBe('were');
  });

  it('negar una cláusula no arrastra a la otra', () => {
    expect(fv({ tipo: 1, parte: 'condicion', subject: 'it', verb: 'rain', negativa: true })).toBe("doesn't rain");
    expect(fv({ tipo: 2, parte: 'resultado', subject: 'I', verb: 'travel', negativa: true })).toBe("wouldn't travel");
    expect(fv({ tipo: 3, parte: 'resultado', subject: 'I', verb: 'go', negativa: true })).toBe("wouldn't have gone");
  });

  it('«was» por «were» se reconoce para AVISAR, no para dar por malo', () => {
    const base = { tipo: 2, parte: 'condicion', verb: 'be' };
    expect(esWasPorWere({ ...base, respuesta: 'was' })).toBe(true);
    expect(esWasPorWere({ ...base, respuesta: "wasn't" })).toBe(true);
    // y no se confunde con otros casos
    expect(esWasPorWere({ ...base, respuesta: 'were' })).toBe(false);
    expect(esWasPorWere({ tipo: 3, parte: 'condicion', verb: 'be', respuesta: 'was' })).toBe(false);
    expect(esWasPorWere({ tipo: 2, parte: 'resultado', verb: 'be', respuesta: 'was' })).toBe(false);
  });
});
