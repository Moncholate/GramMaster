// Prueba de paridad: el ORDEN de las partes en el desglose visual coloreado
// (App.jsx → generateSentenceAnalysis) debe producir exactamente el mismo
// texto que buildSentenceText. Esto es lo que detectó el bug original (C1):
// "Will have she worked?" en el texto vs. un orden distinto en el desglose.
//
// `assemble()` de abajo es un espejo intencional del ensamblado de partes en
// App.jsx (bloque "Construir partes según el modo" dentro de
// generateSentenceAnalysis). Si ese bloque cambia, este espejo debe
// actualizarse junto con él — de lo contrario esta prueba deja de cumplir su
// propósito silenciosamente.
import { describe, it, expect } from 'vitest';
import { buildSentenceText, getAuxAndVerbForm, smartCaseSubject } from './conjugation';

const TENSES = [
  'simple-present', 'present-continuous', 'simple-past', 'past-continuous',
  'simple-future', 'future-going-to', 'present-perfect', 'past-perfect',
  'present-perfect-continuous', 'used-to', ];
const MODES = ['affirmative', 'negative', 'interrogative'];
const SUBJECTS = ['I', 'you', 'she', 'maria', 'the dogs', 'Tom and Ana'];
const VERBS = ['work', 'study', 'go', 'have'];

const assemble = ({ subject, verb, tense, mode, complement, adverb }) => {
  const { auxiliary, verbForm } = getAuxAndVerbForm(subject, verb, tense, '', mode);
  const subjectText = smartCaseSubject(subject);
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const auxUnits = [];
  if (auxiliary) {
    const words = auxiliary.split(' ');
    for (let i = 0; i < words.length; i++) {
      const pair = words[i + 1] ? words[i] + ' ' + words[i + 1] : null;
      if (pair && ['going to', 'used to', 'use to'].includes(pair)) { auxUnits.push(pair); i++; }
      else auxUnits.push(words[i]);
    }
  }
  const isBeMainVerb = verb === 'be' && (tense === 'simple-present' || tense === 'simple-past');
  const showAdverb = !!adverb;
  const parts = [];
  if (mode === 'subject-question') {
    // La wh ocupa la casilla del sujeto y el orden es el de una afirmacion.
    parts.push(cap(subjectText));
    if (showAdverb && auxUnits.length === 0) parts.push(adverb);
    auxUnits.forEach(a => parts.push(a));
    if (showAdverb && auxUnits.length > 0) parts.push(adverb);
    if (!isBeMainVerb) parts.push(verbForm.toLowerCase());
    if (complement) parts.push(complement);
    return parts.join(' ') + '?';
  }
  if (mode === 'interrogative') {
    const [firstAux, ...restAux] = auxUnits;
    if (firstAux) parts.push(cap(firstAux));
    parts.push(subjectText);
    if (showAdverb) parts.push(adverb);
    restAux.forEach(a => parts.push(a));
    if (!isBeMainVerb) parts.push(verbForm.toLowerCase());
    if (complement) parts.push(complement);
    return parts.join(' ') + '?';
  }
  parts.push(cap(subjectText));
  if (showAdverb && auxUnits.length === 0) parts.push(adverb);
  auxUnits.forEach(a => parts.push(a));
  if (showAdverb && auxUnits.length > 0) parts.push(adverb);
  if (!isBeMainVerb) parts.push(verbForm.toLowerCase());
  if (complement) parts.push(complement);
  return parts.join(' ') + '.';
};

describe('paridad texto ↔ desglose visual (los 13 tiempos × 3 modos × 6 sujetos × 4 verbos)', () => {
  for (const tense of TENSES) {
    for (const mode of MODES) {
      for (const subject of SUBJECTS) {
        for (const verb of VERBS) {
          it(`${tense} / ${mode} / ${subject} / ${verb}`, () => {
            const cfg = { mode, subject, verb, complement: 'every day', tense, adverb: '' };
            expect(assemble(cfg)).toBe(buildSentenceText(cfg));
          });
        }
      }
    }
  }
});

describe('paridad con adverbios de frecuencia (simple present / simple past)', () => {
  for (const mode of MODES) {
    for (const tense of ['simple-present', 'simple-past']) {
      for (const verb of ['work', 'be']) {
        it(`${tense} / ${mode} / ${verb} con "usually"`, () => {
          const cfg = { mode, subject: 'she', verb, complement: verb === 'be' ? 'happy' : 'at home', tense, adverb: 'usually' };
          expect(assemble(cfg)).toBe(buildSentenceText(cfg));
        });
      }
    }
  }
});

/* Pregunta de sujeto (AEF Intermedio II 12C). La wh ocupa la casilla del
   sujeto, así que para la paridad se pasa la wh COMO sujeto: es de ahí de donde
   sale la concordancia («Who has called?» pero «How many people have called?»).
   El resto del ensamblado es el de una afirmación, con «?» al final. */
describe('paridad — pregunta de sujeto', () => {
  const WH_SUJETOS = ['who', 'what', 'which one', 'which ones', 'how many people', 'how much money'];
  for (const tense of TENSES) {
    for (const wh of WH_SUJETOS) {
      for (const verb of ['work', 'go', 'be']) {
        it(`${tense} / ${wh} / ${verb}`, () => {
          const [whWord, ...resto] = wh.split(' ');
          const cfg = { mode: 'subject-question', subject: '', verb, complement: 'here',
            tense, adverb: '', whWord, whExtension: resto.join(' ') };
          // el espejo recibe la wh como sujeto, que es lo que hace App.jsx
          expect(assemble({ ...cfg, subject: wh })).toBe(buildSentenceText(cfg));
        });
      }
    }
  }
});
