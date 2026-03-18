import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, VolumeX, Award, AlertTriangle, CheckCircle, XCircle, HelpCircle, Sparkles, X, History, Copy, Check, Trash2, Clock, Play, Info, ExternalLink, BarChart2 } from 'lucide-react';
import {
  translations,
  commonVerbs,
  irregularVerbs,
  COURSE_ORDER,
  modes,
  tenses,
  modals,
  whWords,
  whSuggestions,
  frequencyAdverbs,
  timeMarkers,
  getFlattenedMarkers,
  uncountableNouns,
  countableNouns,
  englishDictionary,
  validateSubject,
  validateVerb,
  validateComplement
} from './data';

const COMPLEMENT_CHIPS = {
  'simple-present':             ['every day', 'on Mondays', 'in the morning', 'at work', 'at home'],
  'present-continuous':         ['right now', 'at the moment', 'this week', 'today'],
  'simple-past':                ['yesterday', 'last week', 'two days ago', 'last year', 'in 2020'],
  'future-going-to':            ['tomorrow', 'next week', 'this weekend', 'soon', 'next month'],
  'present-perfect':            ['already', 'just', 'never', 'recently', 'so far', 'yet'],
  'past-continuous':            ['yesterday at 8', 'last night', 'all morning', 'at that moment'],
  'simple-future':              ['tomorrow', 'next year', 'soon', 'in the future', 'next month'],
  'past-perfect':               ['before she arrived', 'already', 'by then', 'when I called'],
  'used-to':                    ['when I was a child', 'years ago', 'as a kid', 'in those days'],
  'present-perfect-continuous': ['for two hours', 'since this morning', 'all day', 'since Monday'],
  'would-past':                 ['when I was young', 'as a child', 'every summer', 'in those days'],
  'future-perfect':             ['by tomorrow', 'by next week', 'by then', 'by the time'],
  'past-perfect-continuous':    ['for an hour', 'since morning', 'all day', 'for years'],
};

const EnglishSentenceBuilder = () => {
  const [language, setLanguage] = useState('es');
  const [subject, setSubject] = useState('');
  const [verb, setVerb] = useState('');
  const [complement, setComplement] = useState('');
  const [selectedTense, setSelectedTense] = useState('');
  const [selectedMode, setSelectedMode] = useState('affirmative');
  const [selectedModal, setSelectedModal] = useState('');
  const [showModalPicker, setShowModalPicker] = useState(false);
  const [whWord, setWhWord] = useState('');
  const [whExtension, setWhExtension] = useState('');
  const [whWarning, setWhWarning] = useState('');
  const [selectedAdverb, setSelectedAdverb] = useState('');
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [semanticWarning, setSemanticWarning] = useState(null);
  const [showTimeGuide, setShowTimeGuide] = useState(false);
  const [isIrregular, setIsIrregular] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  
  // FASE 1: Nuevos estados
  const [sentenceHistory, setSentenceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, today: 0 });
  const [showVerbSuggestions, setShowVerbSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalAllTime, setTotalAllTime] = useState(0);
  
  // Corrector ortográfico
  const [spellingErrors, setSpellingErrors] = useState({
    subject: [],
    verb: [],
    complement: []
  });

  // FASE 2: Nuevos estados
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceType, setPracticeType] = useState('');
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceResult, setPracticeResult] = useState(null);
  const [identifyTenseAnswer, setIdentifyTenseAnswer] = useState('');
  const [identifyModeAnswer, setIdentifyModeAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showGrammarAnalysis, setShowGrammarAnalysis] = useState(false);
  const [cefrLevel, setCefrLevel] = useState('basico1');
  const [notification, setNotification] = useState(null); // { type: 'error' | 'success', message: string }

  const [practiceDays, setPracticeDays] = useState([]); // array of 'YYYY-MM-DD' strings
  const [srsData, setSrsData] = useState({}); // { 'tenseId|mode': { lastPracticed, timesCorrect, timesWrong, interval } }
  const [reviewUpToDate, setReviewUpToDate] = useState(false);

  // UI simplificada
  const [activePanel, setActivePanel] = useState(null); // 'history', 'practice', 'timeGuide', 'settings', 'progress'

  // Análisis gramatical visual
  const [sentenceAnalysis, setSentenceAnalysis] = useState(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [allModeSentences, setAllModeSentences] = useState(null);
  const [showAllModes, setShowAllModes] = useState(false);

  // Validación de entradas
  const [subjectValidation, setSubjectValidation] = useState({ valid: true, warning: null });
  const [verbValidation, setVerbValidation] = useState({ valid: true, warning: null });
  const [complementValidation, setComplementValidation] = useState({ valid: true, warning: null });

  const t = translations[language];

  // Mostrar notificación temporal
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función de distancia Levenshtein simplificada
  const levenshteinDistance = (str1, str2) => {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j] + 1
          );
        }
      }
    }
    return dp[m][n];
  };

  // Función para obtener sugerencias de corrección
  const getSpellingSuggestions = (word) => {
    if (!word || word.length < 2) return [];
    
    const lowerWord = word.toLowerCase();
    
    // Si la palabra está en el diccionario, no hay error
    if (englishDictionary.includes(lowerWord)) return [];
    
    // Buscar palabras similares
    const suggestions = englishDictionary
      .map(dictWord => ({
        word: dictWord,
        distance: levenshteinDistance(lowerWord, dictWord)
      }))
      .filter(item => item.distance <= 2 && item.distance > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(item => item.word);

    return suggestions;
  };

  // Función para verificar ortografía en un texto
  const checkSpelling = (text, field) => {
    if (!text || text.trim().length === 0) {
      setSpellingErrors(prev => ({ ...prev, [field]: [] }));
      return;
    }

    const words = text.split(/[\s,]+/).filter(w => w.length > 0);
    const errors = [];

    words.forEach(word => {
      const cleanWord = word.replace(/[.,!?;:]/g, '');
      const suggestions = getSpellingSuggestions(cleanWord);
      
      if (suggestions.length > 0) {
        errors.push({
          word: cleanWord,
          suggestions: suggestions
        });
      }
    });

    setSpellingErrors(prev => ({ ...prev, [field]: errors }));
  };

  // Grammar HUB: escuchar cambio de idioma y nivel vía postMessage
  useEffect(() => {
    const validLevels = ['basico1','basico2','elemental1','elemental2','intermedio1','intermedio2','avanzado'];
    const handler = (e) => {
      if (e.data?.type === 'GRAMMAR_HUB_LANG' && (e.data.lang === 'es' || e.data.lang === 'en')) {
        setLanguage(e.data.lang);
      }
      if (e.data?.type === 'GRAMMAR_HUB_LEVEL' && validLevels.includes(e.data.level)) {
        setCefrLevel(e.data.level);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // FASE 1: Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('sentenceHistory');
    const savedStats = localStorage.getItem('sessionStats');
    const savedTotal = localStorage.getItem('totalAllTime');
    const savedPracticeDays = localStorage.getItem('practiceDays');

    if (savedHistory) {
      setSentenceHistory(JSON.parse(savedHistory));
    }

    if (savedTotal) {
      setTotalAllTime(parseInt(savedTotal));
    }

    if (savedPracticeDays) {
      setPracticeDays(JSON.parse(savedPracticeDays));
    }

    const savedSrsData = localStorage.getItem('srsData');
    if (savedSrsData) {
      setSrsData(JSON.parse(savedSrsData));
    }
    
    // Verificar si es un nuevo día
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('lastVisit');
    
    if (savedStats && lastVisit === today) {
      setSessionStats(JSON.parse(savedStats));
    } else {
      // Nuevo día, resetear contador diario
      const newStats = { total: 0, today: 0 };
      setSessionStats(newStats);
      localStorage.setItem('lastVisit', today);
    }
  }, []);

  // FASE 1: Guardar en localStorage cuando cambie el historial
  useEffect(() => {
    if (sentenceHistory.length > 0) {
      localStorage.setItem('sentenceHistory', JSON.stringify(sentenceHistory));
    }
  }, [sentenceHistory]);

  useEffect(() => {
    localStorage.setItem('sessionStats', JSON.stringify(sessionStats));
  }, [sessionStats]);

  useEffect(() => {
    localStorage.setItem('totalAllTime', totalAllTime.toString());
  }, [totalAllTime]);

  // FASE 1: Filtrar verbos sugeridos
  const getVerbSuggestions = () => {
    if (!verb) return [];
    const lowerVerb = verb.toLowerCase();
    return commonVerbs.filter(v => v.startsWith(lowerVerb) && v !== lowerVerb).slice(0, 8);
  };

  // FASE 1: Copiar al portapapeles
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // FASE 1: Limpiar historial
  const clearHistory = () => {
    if (window.confirm(language === 'es' ? '¿Seguro que quieres limpiar el historial?' : 'Are you sure you want to clear the history?')) {
      setSentenceHistory([]);
      localStorage.removeItem('sentenceHistory');
    }
  };

  // FASE 1: Eliminar del historial
  const deleteFromHistory = (index) => {
    const newHistory = sentenceHistory.filter((_, i) => i !== index);
    setSentenceHistory(newHistory);
  };

  const formatTimestamp = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return (language === 'es' ? 'Hoy ' : 'Today ') + time;
    if (isYesterday) return (language === 'es' ? 'Ayer ' : 'Yesterday ') + time;
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + time;
  };

  const exportHistory = () => {
    const lines = sentenceHistory.map((item, i) => {
      const tenseName = language === 'es' ? item.config.tense?.nameEs : item.config.tense?.nameEn;
      return `${i + 1}. ${item.sentence}\n   [${tenseName || item.config.modal || ''} · ${item.config.mode} · ${formatTimestamp(item.timestamp)}]`;
    });
    const content = lines.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'grammaster-historial.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  // Registrar día de práctica en localStorage y estado
  const recordPracticeDay = () => {
    const today = new Date().toISOString().split('T')[0];
    setPracticeDays(prev => {
      if (prev.includes(today)) return prev;
      const updated = [...prev, today];
      localStorage.setItem('practiceDays', JSON.stringify(updated));
      return updated;
    });
  };

  // Calcular racha de días consecutivos
  const computeStreak = (days) => {
    if (!days || days.length === 0) return 0;
    const unique = [...new Set(days)].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (unique[0] !== today && unique[0] !== yesterdayStr) return 0;
    let streak = 1;
    for (let i = 0; i < unique.length - 1; i++) {
      const curr = new Date(unique[i]);
      const prev = new Date(unique[i + 1]);
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  };

  // Contar usos por tense.id desde el historial
  const computeTenseStats = () => {
    const counts = {};
    sentenceHistory.forEach(item => {
      const id = item.config?.tense?.id;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  };

  // Escapar caracteres especiales en RegExp
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Aplicar sugerencia de corrección
  const applySuggestion = (field, oldWord, newWord) => {
    const escapedOldWord = escapeRegExp(oldWord);
    if (field === 'subject') {
      setSubject(prev => prev.replace(new RegExp(escapedOldWord, 'gi'), newWord));
    } else if (field === 'verb') {
      setVerb(prev => prev.replace(new RegExp(escapedOldWord, 'gi'), newWord));
    } else if (field === 'complement') {
      setComplement(prev => prev.replace(new RegExp(escapedOldWord, 'gi'), newWord));
    }
  };


  // Limpiar tiempo verbal al cambiar de categoría
  useEffect(() => {
    setSelectedTense('');
  }, [cefrLevel]);

  // Limpiar adverbio cuando el tiempo verbal no es compatible
  useEffect(() => {
    if (selectedTense !== 'simple-present' && selectedTense !== 'simple-past') {
      setSelectedAdverb('');
    }
  }, [selectedTense]);

  // Limpiar adverbio cuando se selecciona un modal
  useEffect(() => {
    if (selectedModal) {
      setSelectedAdverb('');
    }
  }, [selectedModal]);

  // Retorna solo la frase verbal conjugada (sin sujeto ni complemento)
  const buildVerbPhrase = (subj, v, tenseId, modal, mode) => {
    const is3p = isThirdPersonSingular(subj);
    const subjLower = subj.toLowerCase();
    const beForm = subjLower === 'i' ? 'am' : is3p ? 'is' : 'are';
    const wasWere = (subjLower === 'i' || is3p) && subjLower !== 'you' ? 'was' : 'were';
    const hasHave = is3p ? 'has' : 'have';
    const pp = pastParticiple(v);
    const isBeVerb = v.toLowerCase() === 'be';
    if (mode === 'affirmative') {
      if (modal) return modal + ' ' + v;
      if (tenseId === 'simple-present') return isBeVerb ? beForm : (is3p ? conjugate3p(v) : v);
      if (tenseId === 'present-continuous') return beForm + ' ' + presentParticiple(v);
      if (tenseId === 'simple-past') return isBeVerb ? wasWere : simplePast(v);
      if (tenseId === 'past-continuous') return wasWere + ' ' + presentParticiple(v);
      if (tenseId === 'simple-future') return 'will ' + v;
      if (tenseId === 'future-going-to') return beForm + ' going to ' + v;
      if (tenseId === 'present-perfect') return hasHave + ' ' + pp;
      if (tenseId === 'past-perfect') return 'had ' + pp;
      if (tenseId === 'future-perfect') return 'will have ' + pp;
      if (tenseId === 'present-perfect-continuous') return hasHave + ' been ' + presentParticiple(v);
      if (tenseId === 'past-perfect-continuous') return 'had been ' + presentParticiple(v);
      if (tenseId === 'used-to') return 'used to ' + v;
      if (tenseId === 'would-past') return 'would ' + v;
    }
    if (mode === 'negative') {
      const negM = modal === 'can' ? "can't" : modal === 'could' ? "couldn't" : modal === 'should' ? "shouldn't" : modal === 'would' ? "wouldn't" : modal === 'will' ? "won't" : modal === 'must' ? "mustn't" : modal ? modal + ' not' : null;
      if (negM) return negM + ' ' + v;
      if (tenseId === 'simple-present') return isBeVerb ? beForm + ' not' : (is3p ? "doesn't" : "don't") + ' ' + v;
      if (tenseId === 'present-continuous') return beForm + ' not ' + presentParticiple(v);
      if (tenseId === 'simple-past') return isBeVerb ? wasWere + ' not' : "didn't " + v;
      if (tenseId === 'past-continuous') return wasWere + ' not ' + presentParticiple(v);
      if (tenseId === 'simple-future') return "won't " + v;
      if (tenseId === 'future-going-to') return beForm + ' not going to ' + v;
      if (tenseId === 'present-perfect') return hasHave + ' not ' + pp;
      if (tenseId === 'past-perfect') return 'had not ' + pp;
      if (tenseId === 'future-perfect') return 'will not have ' + pp;
      if (tenseId === 'present-perfect-continuous') return hasHave + ' not been ' + presentParticiple(v);
      if (tenseId === 'past-perfect-continuous') return 'had not been ' + presentParticiple(v);
      if (tenseId === 'used-to') return "didn't use to " + v;
      if (tenseId === 'would-past') return "wouldn't " + v;
    }
    if (mode === 'interrogative') {
      if (modal) return modal;
      if (tenseId === 'simple-present') return isBeVerb ? beForm : (is3p ? 'does' : 'do');
      if (tenseId === 'present-continuous') return beForm;
      if (tenseId === 'simple-past') return isBeVerb ? wasWere : 'did';
      if (tenseId === 'past-continuous') return wasWere;
      if (tenseId === 'simple-future') return 'will';
      if (tenseId === 'future-going-to') return beForm;
      if (tenseId === 'present-perfect') return hasHave;
      if (tenseId === 'past-perfect') return 'had';
      if (tenseId === 'future-perfect') return 'will';
      if (tenseId === 'present-perfect-continuous') return hasHave;
      if (tenseId === 'past-perfect-continuous') return 'had';
      if (tenseId === 'used-to') return 'did';
      if (tenseId === 'would-past') return 'would';
    }
    return v;
  };

  // Genera una oración con un error gramatical y retorna { sentence, wrongPart, correctPart }
  const buildWrongSentence = (subj, v, comp, tenseId, mode = 'affirmative') => {
    const is3p = isThirdPersonSingular(subj);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const compStr = comp ? ' ' + comp : '';
    const subjLower = subj.toLowerCase();
    const beForm = subjLower === 'i' ? 'am' : is3p ? 'is' : 'are';
    const wasWere = (subjLower === 'i' || is3p) && subjLower !== 'you' ? 'was' : 'were';
    const hasHave = is3p ? 'has' : 'have';
    const pp = pastParticiple(v);

    if (mode === 'affirmative') {
      if (tenseId === 'simple-present' && is3p)
        return { sentence: cap(subj) + ' ' + v + compStr + '.', wrongPart: v, correctPart: conjugate3p(v) };
      if (tenseId === 'simple-present' && !is3p)
        return { sentence: cap(subj) + ' ' + conjugate3p(v) + compStr + '.', wrongPart: conjugate3p(v), correctPart: v };
      if (tenseId === 'simple-past')
        return { sentence: cap(subj) + ' ' + v + compStr + '.', wrongPart: v, correctPart: simplePast(v) };
      if (tenseId === 'present-continuous')
        return { sentence: cap(subj) + ' ' + beForm + ' ' + v + compStr + '.', wrongPart: v, correctPart: presentParticiple(v) };
      if (tenseId === 'present-perfect')
        return { sentence: cap(subj) + ' ' + hasHave + ' ' + v + compStr + '.', wrongPart: v, correctPart: pp };
    }

    if (mode === 'negative') {
      if (tenseId === 'simple-present') {
        const wrong = is3p ? "don't" : "doesn't";
        const correct = is3p ? "doesn't" : "don't";
        return { sentence: cap(subj) + ' ' + wrong + ' ' + v + compStr + '.', wrongPart: wrong, correctPart: correct };
      }
      if (tenseId === 'simple-past')
        return { sentence: cap(subj) + " didn't " + simplePast(v) + compStr + '.', wrongPart: simplePast(v), correctPart: v };
      if (tenseId === 'present-continuous')
        return { sentence: cap(subj) + ' ' + beForm + ' not ' + v + compStr + '.', wrongPart: v, correctPart: presentParticiple(v) };
      if (tenseId === 'present-perfect') {
        const wrong = is3p ? 'have' : 'has';
        return { sentence: cap(subj) + ' ' + wrong + ' not ' + pp + compStr + '.', wrongPart: wrong, correctPart: hasHave };
      }
      if (tenseId === 'past-continuous')
        return { sentence: cap(subj) + ' ' + wasWere + ' not ' + v + compStr + '.', wrongPart: v, correctPart: presentParticiple(v) };
    }

    if (mode === 'interrogative') {
      if (tenseId === 'simple-present') {
        const wrong = is3p ? 'Do' : 'Does';
        const correct = is3p ? 'Does' : 'Do';
        return { sentence: wrong + ' ' + subj + ' ' + v + compStr + '?', wrongPart: wrong, correctPart: correct };
      }
      if (tenseId === 'simple-past')
        return { sentence: 'Did ' + subj + ' ' + simplePast(v) + compStr + '?', wrongPart: simplePast(v), correctPart: v };
      if (tenseId === 'present-continuous')
        return { sentence: cap(beForm) + ' ' + subj + ' ' + v + compStr + '?', wrongPart: v, correctPart: presentParticiple(v) };
      if (tenseId === 'present-perfect') {
        const wrong = is3p ? 'Have' : 'Has';
        return { sentence: wrong + ' ' + subj + ' ' + pp + compStr + '?', wrongPart: wrong, correctPart: cap(hasHave) };
      }
      if (tenseId === 'past-continuous')
        return { sentence: cap(wasWere) + ' ' + subj + ' ' + v + compStr + '?', wrongPart: v, correctPart: presentParticiple(v) };
    }

    // Fallback
    return { sentence: cap(subj) + ' ' + v + compStr + '.', wrongPart: v, correctPart: v };
  };

  // FASE 2: Generar pregunta de práctica
  const generatePracticeQuestion = (type) => {
    const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
    const availableTenses = tenses.filter(t => COURSE_ORDER.indexOf(t.cefr) <= courseIndex);
    const subjects = ['I', 'You', 'He', 'She', 'We', 'They'];
    const verbs = ['work', 'study', 'play', 'eat', 'live', 'travel', 'read', 'write', 'run', 'cook'];
    const complements = ['every day', 'at school', 'at home', 'in the park', 'with friends', 'in the morning', 'on weekends'];

    const subj = subjects[Math.floor(Math.random() * subjects.length)];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const comp = complements[Math.floor(Math.random() * complements.length)];

    if (type === 'fill') {
      const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
      const mode = Math.random() > 0.4 ? 'affirmative' : 'negative';
      const correctAnswer = buildVerbPhrase(subj, v, tense.id, null, mode);
      const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tense.id });
      // Aceptar formas contraídas y no contraídas
      const uncontracted = correctAnswer
        .replace("doesn't", "does not").replace("don't", "do not").replace("didn't", "did not")
        .replace("can't", "cannot").replace("won't", "will not").replace("wouldn't", "would not")
        .replace("shouldn't", "should not").replace("mustn't", "must not").replace("couldn't", "could not")
        .replace("isn't", "is not").replace("aren't", "are not").replace("wasn't", "was not")
        .replace("weren't", "were not").replace("haven't", "have not").replace("hasn't", "has not")
        .replace("hadn't", "had not");
      const contracted = correctAnswer
        .replace("does not", "doesn't").replace("do not", "don't").replace("did not", "didn't")
        .replace("will not", "won't").replace("would not", "wouldn't").replace("should not", "shouldn't")
        .replace("must not", "mustn't").replace("could not", "couldn't").replace("cannot", "can't")
        .replace("is not", "isn't").replace("are not", "aren't").replace("was not", "wasn't")
        .replace("were not", "weren't").replace("have not", "haven't").replace("has not", "hasn't")
        .replace("had not", "hadn't");
      const acceptedAnswers = [correctAnswer.toLowerCase()];
      if (uncontracted !== correctAnswer) acceptedAnswers.push(uncontracted.toLowerCase());
      if (contracted !== correctAnswer) acceptedAnswers.push(contracted.toLowerCase());
      return { type: 'fill', subject: subj, verb: v, complement: comp, tense, mode, correctAnswer, acceptedAnswers, fullSentence };
    }

    if (type === 'correct') {
      const simpleTenses = availableTenses.filter(t =>
        ['simple-present', 'simple-past', 'present-continuous', 'present-perfect', 'past-continuous'].includes(t.id)
      );
      const tense = (simpleTenses.length > 0 ? simpleTenses : availableTenses)[Math.floor(Math.random() * (simpleTenses.length || availableTenses.length))];
      const mode = ['affirmative', 'negative', 'interrogative'][Math.floor(Math.random() * 3)];
      const { sentence: wrongSentence, wrongPart, correctPart } = buildWrongSentence(subj, v, comp, tense.id, mode);
      const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tense.id });
      const acceptedAnswers = [correctPart.toLowerCase()];
      const uncontracted = correctPart.replace("doesn't","does not").replace("don't","do not").replace("didn't","did not").replace("hasn't","has not").replace("haven't","have not").replace("won't","will not");
      if (uncontracted !== correctPart) acceptedAnswers.push(uncontracted.toLowerCase());
      return { type: 'correct', subject: subj, verb: v, complement: comp, tense, mode, wrongSentence, wrongPart, correctAnswer: correctPart, acceptedAnswers, fullSentence };
    }

    if (type === 'identify') {
      const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
      // Si hay menos de 3 tiempos disponibles, solo pedir modo
      const askTense = availableTenses.length >= 3;
      const askMode = true; // siempre pedir modo
      const optionCount = courseIndex <= 1 ? 3 : courseIndex <= 3 ? 4 : 5;

      const mode = ['affirmative', 'negative', 'interrogative'][Math.floor(Math.random() * 3)];
      const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
      const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tense.id });

      // Distractores solo de los tiempos que el estudiante conoce
      const distractors = availableTenses
        .filter(t => t.id !== tense.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, optionCount - 1);
      const tenseOptions = askTense ? [...distractors, tense].sort(() => Math.random() - 0.5) : [];

      return { type: 'identify', subject: subj, verb: v, complement: comp, tense, mode, fullSentence, tenseOptions, askTense, askMode };
    }
  };

  // FASE 2: Iniciar modo práctica
  const startPractice = (type) => {
    setPracticeType(type);
    setPracticeMode(true);
    const question = generatePracticeQuestion(type);
    setPracticeQuestion(question);
    setPracticeAnswer('');
    setPracticeResult(null);
    setIdentifyTenseAnswer('');
    setIdentifyModeAnswer('');
    setShowHint(false);
  };

  // SRS: actualizar datos tras verificar respuesta
  const updateSRS = (tenseId, mode, isCorrect) => {
    if (!tenseId || !mode) return;
    const key = `${tenseId}|${mode}`;
    setSrsData(prev => {
      const existing = prev[key] || { lastPracticed: Date.now(), timesCorrect: 0, timesWrong: 0, interval: 1 };
      const updated = {
        ...existing,
        lastPracticed: Date.now(),
        timesCorrect: isCorrect ? existing.timesCorrect + 1 : existing.timesCorrect,
        timesWrong: isCorrect ? existing.timesWrong : existing.timesWrong + 1,
        interval: isCorrect ? Math.min(existing.interval * 2, 30) : 1,
      };
      const newData = { ...prev, [key]: updated };
      localStorage.setItem('srsData', JSON.stringify(newData));
      return newData;
    });
  };

  // SRS: obtener estructuras cuyo repaso está pendiente (ordenadas por más atrasado primero)
  const getPendingReviews = () => {
    const now = Date.now();
    return Object.entries(srsData)
      .filter(([, entry]) => entry.lastPracticed + entry.interval * 86400000 <= now)
      .map(([key, entry]) => {
        const [tenseId, mode] = key.split('|');
        return { key, tenseId, mode, ...entry };
      })
      .sort((a, b) => (a.lastPracticed + a.interval * 86400000) - (b.lastPracticed + b.interval * 86400000));
  };

  // SRS: generar pregunta tipo fill forzando tenseId y mode específicos
  const generateReviewQuestion = (tenseId, mode) => {
    const tense = tenses.find(t => t.id === tenseId);
    if (!tense) return null;
    const subjects = ['I', 'You', 'He', 'She', 'We', 'They'];
    const verbs = ['work', 'study', 'play', 'eat', 'live', 'travel', 'read', 'write', 'run', 'cook'];
    const complements = ['every day', 'at school', 'at home', 'in the park', 'with friends', 'in the morning', 'on weekends'];
    const subj = subjects[Math.floor(Math.random() * subjects.length)];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const comp = complements[Math.floor(Math.random() * complements.length)];
    const correctAnswer = buildVerbPhrase(subj, v, tenseId, null, mode);
    const fullSentence = buildSentenceText({ mode, subject: subj, verb: v, complement: comp, tense: tenseId });
    const uncontracted = correctAnswer
      .replace("doesn't", "does not").replace("don't", "do not").replace("didn't", "did not")
      .replace("can't", "cannot").replace("won't", "will not").replace("wouldn't", "would not")
      .replace("shouldn't", "should not").replace("mustn't", "must not").replace("couldn't", "could not")
      .replace("isn't", "is not").replace("aren't", "are not").replace("wasn't", "was not")
      .replace("weren't", "were not").replace("haven't", "have not").replace("hasn't", "has not")
      .replace("hadn't", "had not");
    const contracted = correctAnswer
      .replace("does not", "doesn't").replace("do not", "don't").replace("did not", "didn't")
      .replace("will not", "won't").replace("would not", "wouldn't").replace("should not", "shouldn't")
      .replace("must not", "mustn't").replace("could not", "couldn't").replace("cannot", "can't")
      .replace("is not", "isn't").replace("are not", "aren't").replace("was not", "wasn't")
      .replace("were not", "weren't").replace("have not", "haven't").replace("has not", "hasn't")
      .replace("had not", "hadn't");
    const acceptedAnswers = [correctAnswer.toLowerCase()];
    if (uncontracted !== correctAnswer) acceptedAnswers.push(uncontracted.toLowerCase());
    if (contracted !== correctAnswer) acceptedAnswers.push(contracted.toLowerCase());
    return { type: 'review', subject: subj, verb: v, complement: comp, tense, mode, correctAnswer, acceptedAnswers, fullSentence };
  };

  // SRS: iniciar modo repaso
  const startReview = () => {
    const pending = getPendingReviews();
    setPracticeType('review');
    setPracticeAnswer('');
    setPracticeResult(null);
    setIdentifyTenseAnswer('');
    setIdentifyModeAnswer('');
    setShowHint(false);
    const hasPracticed = Object.keys(srsData).length > 0;
    if (pending.length === 0 && hasPracticed) {
      // Hay datos pero ninguno está vencido → genuinamente al día
      setReviewUpToDate(true);
      setPracticeQuestion(null);
    } else if (pending.length === 0 && !hasPracticed) {
      // Sin datos: generar pregunta fill aleatoria del nivel actual para arrancar
      const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
      const available = tenses.filter(t => COURSE_ORDER.indexOf(t.cefr) <= courseIndex);
      const randomTense = available[Math.floor(Math.random() * available.length)];
      setReviewUpToDate(false);
      setPracticeQuestion(generateReviewQuestion(
        randomTense.id,
        ['affirmative', 'negative'][Math.floor(Math.random() * 2)]
      ));
    } else {
      setReviewUpToDate(false);
      setPracticeQuestion(generateReviewQuestion(pending[0].tenseId, pending[0].mode));
    }
  };

  // FASE 2: Verificar respuesta de práctica
  const checkPracticeAnswer = () => {
    if (!practiceQuestion) return;
    recordPracticeDay();
    if (practiceQuestion.type === 'identify') {
      const tenseOk = !practiceQuestion.askTense || identifyTenseAnswer === practiceQuestion.tense.id;
      const modeOk = identifyModeAnswer === practiceQuestion.mode;
      const isCorrect = tenseOk && modeOk;
      setPracticeResult({
        correct: isCorrect,
        tenseOk,
        modeOk,
        correctTense: language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn,
        correctMode: practiceQuestion.mode,
        fullSentence: practiceQuestion.fullSentence,
      });
      return;
    }
    const userAns = practiceAnswer.toLowerCase().trim().replace(/\.$/, '');
    const accepted = practiceQuestion.acceptedAnswers || [practiceQuestion.correctAnswer.toLowerCase()];
    const isCorrect = accepted.some(a => a.replace(/\.$/, '') === userAns);
    updateSRS(practiceQuestion.tense?.id, practiceQuestion.mode, isCorrect);

    let hint = null;
    if (!isCorrect) {
      const tenseId = practiceQuestion.tense?.id;
      const mode = practiceQuestion.mode;
      const subj = practiceQuestion.subject?.toLowerCase();
      const verb = practiceQuestion.verb?.toLowerCase();
      const is3p = ['he', 'she', 'it'].includes(subj);

      const hasAuxBe    = /\b(am|is|are)\b/.test(userAns);
      const hasWaWere   = /\b(was|were)\b/.test(userAns);
      const hasWill     = /\bwill\b/.test(userAns);
      const hasHaveHas  = /\b(have|has)\b/.test(userAns);
      const hasHad      = /\bhad\b/.test(userAns);
      const hasBeen     = /\bbeen\b/.test(userAns);
      const hasWould    = /\bwould\b/.test(userAns);
      const hasIngForm  = /\b\w+ing\b/.test(userAns);
      const hasGoingTo  = /going\s+to/.test(userAns);
      const hasUsedTo   = /used\s+to/.test(userAns);
      const hasNegAux   = /\b(don't|doesn't|didn't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't|mustn't|cannot|can't|not)\b/.test(userAns);
      const isBaseForm  = userAns === verb;

      const h = (es, en) => language === 'es' ? es : en;

      if (tenseId === 'simple-present') {
        if (mode === 'affirmative' && hasAuxBe && hasIngForm)
          hint = h('Para hábitos y rutinas se usa el Present Simple, no el Continuous.',
                   'For habits and routines, use Present Simple, not Continuous.');
        else if (mode === 'affirmative' && is3p && !/\w+(s|es|ies)\b/.test(userAns))
          hint = h('Recuerda agregar -s/-es al verbo con he/she/it en Present Simple.',
                   'Remember to add -s/-es to the verb with he/she/it in Present Simple.');
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: usa don't / doesn't + verbo base. Ejemplo: She doesn't work.",
                   "Negative: use don't / doesn't + base verb. Example: She doesn't work.");
      }

      else if (tenseId === 'present-continuous') {
        if (mode === 'affirmative' && hasIngForm && !hasAuxBe)
          hint = h('Falta el auxiliar be (am/is/are). Estructura: am/is/are + verbo-ing.',
                   'Missing auxiliary be (am/is/are). Structure: am/is/are + verb-ing.');
        else if (mode === 'affirmative' && !hasIngForm)
          hint = h('El Present Continuous necesita verbo-ing. Ejemplo: is working.',
                   'Present Continuous needs verb-ing. Example: is working.');
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: am/is/are + not + verbo-ing. Ejemplo: She isn't working.",
                   "Negative: am/is/are + not + verb-ing. Example: She isn't working.");
      }

      else if (tenseId === 'simple-past') {
        if (isBaseForm)
          hint = h('El Past Simple necesita la forma pasada (-ed para regulares, o forma irregular).',
                   'Past Simple needs the past form (-ed for regular verbs, or the irregular form).');
        else if (/\bdid\b/.test(userAns) && !isBaseForm)
          hint = h("Con 'did' el verbo va en forma base: did + work (no 'did worked').",
                   "With 'did' the verb stays in base form: did + work (not 'did worked').");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: didn't + verbo base. Ejemplo: She didn't work.",
                   "Negative: didn't + base verb. Example: She didn't work.");
      }

      else if (tenseId === 'future-going-to') {
        if (hasWill && !hasGoingTo)
          hint = h("'Going to' expresa planes e intenciones, no uses 'will' aquí. Estructura: am/is/are going to + verbo.",
                   "'Going to' expresses plans and intentions. Structure: am/is/are going to + verb.");
        else if (hasGoingTo && !hasAuxBe)
          hint = h("Falta el auxiliar be antes de 'going to'. Ejemplo: She is going to work.",
                   "Missing auxiliary be before 'going to'. Example: She is going to work.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: am/is/are + not going to + verbo. Ejemplo: She isn't going to work.",
                   "Negative: am/is/are + not going to + verb. Example: She isn't going to work.");
      }

      else if (tenseId === 'present-perfect') {
        if (!hasHaveHas && !hasHad)
          hint = h("El Present Perfect necesita have/has + participio pasado. Ejemplo: She has worked.",
                   "Present Perfect needs have/has + past participle. Example: She has worked.");
        else if (hasHad && !hasHaveHas)
          hint = h("Para Present Perfect usa have/has, no 'had' (eso es Past Perfect). Ejemplo: She has worked.",
                   "For Present Perfect use have/has, not 'had' (that's Past Perfect). Example: She has worked.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: have/has + not + participio. Ejemplo: She hasn't worked.",
                   "Negative: have/has + not + past participle. Example: She hasn't worked.");
      }

      else if (tenseId === 'past-continuous') {
        if (hasIngForm && !hasWaWere)
          hint = h("Falta el auxiliar was/were. Estructura: was/were + verbo-ing.",
                   "Missing was/were. Structure: was/were + verb-ing.");
        else if (!hasIngForm)
          hint = h("El Past Continuous necesita was/were + verbo-ing. Ejemplo: She was working.",
                   "Past Continuous needs was/were + verb-ing. Example: She was working.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: was/were + not + verbo-ing. Ejemplo: She wasn't working.",
                   "Negative: was/were + not + verb-ing. Example: She wasn't working.");
      }

      else if (tenseId === 'simple-future') {
        if (!hasWill && hasGoingTo)
          hint = h("'Will' expresa predicciones y decisiones espontáneas. Estructura: will + verbo base.",
                   "'Will' expresses predictions and spontaneous decisions. Structure: will + base verb.");
        else if (!hasWill)
          hint = h("El Simple Future necesita 'will' + verbo base. Ejemplo: She will work.",
                   "Simple Future needs 'will' + base verb. Example: She will work.");
        else if (hasWill && /will\s+\w+(s|es)\b/.test(userAns))
          hint = h("Después de 'will' el verbo siempre va en forma base, sin -s. Ejemplo: will work (no 'will works').",
                   "After 'will' the verb is always in base form, no -s. Example: will work (not 'will works').");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: won't + verbo base. Ejemplo: She won't work.",
                   "Negative: won't + base verb. Example: She won't work.");
      }

      else if (tenseId === 'past-perfect') {
        if (hasHaveHas && !hasHad)
          hint = h("Para Past Perfect usa 'had' (no have/has). Ambas personas usan 'had'. Ejemplo: She had worked.",
                   "For Past Perfect use 'had' (not have/has). All persons use 'had'. Example: She had worked.");
        else if (!hasHad)
          hint = h("El Past Perfect necesita 'had' + participio pasado. Ejemplo: She had worked.",
                   "Past Perfect needs 'had' + past participle. Example: She had worked.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: had + not + participio. Ejemplo: She hadn't worked.",
                   "Negative: had + not + past participle. Example: She hadn't worked.");
      }

      else if (tenseId === 'used-to') {
        if (/\buse\s+to\b/.test(userAns) && !hasUsedTo)
          hint = h("Es 'used to', no 'use to'. La forma siempre lleva -d. Ejemplo: She used to work.",
                   "It's 'used to', not 'use to'. Always with -d. Example: She used to work.");
        else if (!hasUsedTo)
          hint = h("'Used to' expresa hábitos del pasado. Estructura: used to + verbo base. Ejemplo: She used to work.",
                   "'Used to' expresses past habits. Structure: used to + base verb. Example: She used to work.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: didn't use to + verbo base. Ejemplo: She didn't use to work.",
                   "Negative: didn't use to + base verb. Example: She didn't use to work.");
      }

      else if (tenseId === 'present-perfect-continuous') {
        if (hasAuxBe && hasIngForm && !hasHaveHas)
          hint = h("Eso es Present Continuous. El Presente Perfecto Continuo necesita have/has + been + verbo-ing.",
                   "That's Present Continuous. Present Perfect Continuous needs have/has + been + verb-ing.");
        else if (hasHaveHas && !hasBeen)
          hint = h("Falta 'been'. Estructura completa: have/has + been + verbo-ing. Ejemplo: She has been working.",
                   "Missing 'been'. Full structure: have/has + been + verb-ing. Example: She has been working.");
        else if (!hasHaveHas)
          hint = h("El Presente Perfecto Continuo necesita have/has + been + verbo-ing. Ejemplo: She has been working.",
                   "Present Perfect Continuous needs have/has + been + verb-ing. Example: She has been working.");
      }

      else if (tenseId === 'would-past') {
        if (hasUsedTo)
          hint = h("'Used to' y 'would' expresan hábitos pasados, pero aquí se pide 'would'. Estructura: would + verbo base.",
                   "'Used to' and 'would' both express past habits, but here 'would' is required. Structure: would + base verb.");
        else if (!hasWould)
          hint = h("'Would' para hábitos pasados: would + verbo base. Ejemplo: She would work every day.",
                   "'Would' for past habits: would + base verb. Example: She would work every day.");
        else if (mode === 'negative' && !hasNegAux)
          hint = h("Negativo: wouldn't + verbo base. Ejemplo: She wouldn't work.",
                   "Negative: wouldn't + base verb. Example: She wouldn't work.");
      }

      else if (tenseId === 'future-perfect') {
        if (hasWill && !hasHaveHas && !hasBeen)
          hint = h("Eso es Simple Future. El Futuro Perfecto necesita will + have + participio. Ejemplo: She will have worked.",
                   "That's Simple Future. Future Perfect needs will + have + past participle. Example: She will have worked.");
        else if (hasWill && hasHaveHas && hasIngForm)
          hint = h("Futuro Perfecto usa participio pasado, no verbo-ing. Ejemplo: will have worked (no 'will have working').",
                   "Future Perfect uses past participle, not verb-ing. Example: will have worked (not 'will have working').");
        else if (!hasWill || !hasHaveHas)
          hint = h("El Futuro Perfecto necesita will + have + participio pasado. Ejemplo: She will have worked.",
                   "Future Perfect needs will + have + past participle. Example: She will have worked.");
      }

      else if (tenseId === 'past-perfect-continuous') {
        if (hasWaWere && hasIngForm && !hasHad)
          hint = h("Eso es Past Continuous. El Pasado Perfecto Continuo necesita had + been + verbo-ing.",
                   "That's Past Continuous. Past Perfect Continuous needs had + been + verb-ing.");
        else if (hasHad && !hasBeen)
          hint = h("Falta 'been'. Estructura completa: had + been + verbo-ing. Ejemplo: She had been working.",
                   "Missing 'been'. Full structure: had + been + verb-ing. Example: She had been working.");
        else if (!hasHad)
          hint = h("El Pasado Perfecto Continuo necesita had + been + verbo-ing. Ejemplo: She had been working.",
                   "Past Perfect Continuous needs had + been + verb-ing. Example: She had been working.");
      }

      // Fallback: negativo sin auxiliar (para tiempos no cubiertos arriba)
      if (!hint && mode === 'negative' && !hasNegAux)
        hint = h("Las oraciones negativas necesitan un auxiliar negativo (don't, didn't, won't, isn't, hadn't…).",
                 "Negative sentences need a negative auxiliary (don't, didn't, won't, isn't, hadn't…).");
    }

    setPracticeResult({
      correct: isCorrect,
      userAnswer: practiceAnswer,
      correctAnswer: practiceQuestion.correctAnswer,
      fullSentence: practiceQuestion.fullSentence,
      hint,
    });
  };

  // FASE 2: Generar análisis gramatical
  const generateGrammarAnalysis = () => {
    if (!generatedSentence) return null;

    const analysis = {
      structure: [],
      explanation: '',
      rule: ''
    };

    // Identificar partes de la oración
    const words = generatedSentence.split(' ');
    
    // Análisis básico
    analysis.structure.push({
      text: subject,
      type: 'subject',
      color: 'blue',
      description: language === 'es' ? 'Sujeto - Quién realiza la acción' : 'Subject - Who performs the action'
    });

    // Identificar auxiliares y verbos
    const currentTense = tenses.find(t => t.id === selectedTense);
    
    analysis.structure.push({
      text: verb,
      type: 'verb',
      color: 'green',
      description: language === 'es' ? 'Verbo - La acción principal' : 'Verb - The main action'
    });

    if (complement) {
      analysis.structure.push({
        text: complement,
        type: 'complement',
        color: 'purple',
        description: language === 'es' ? 'Complemento - Información adicional' : 'Complement - Additional information'
      });
    }

    // Explicación de la regla
    if (selectedMode === 'affirmative') {
      analysis.explanation = language === 'es' 
        ? `Oración afirmativa en ${currentTense?.nameEs}. El verbo se conjuga según el sujeto y el tiempo verbal.`
        : `Affirmative sentence in ${currentTense?.nameEn}. The verb is conjugated according to the subject and tense.`;
    } else if (selectedMode === 'negative') {
      analysis.explanation = language === 'es'
        ? `Oración negativa en ${currentTense?.nameEs}. Se usa un auxiliar negativo y el verbo base.`
        : `Negative sentence in ${currentTense?.nameEn}. Uses a negative auxiliary and the base verb.`;
    } else if (selectedMode === 'interrogative') {
      analysis.explanation = language === 'es'
        ? `Oración interrogativa en ${currentTense?.nameEs}. El auxiliar va al inicio de la oración.`
        : `Interrogative sentence in ${currentTense?.nameEn}. The auxiliary comes at the beginning.`;
    }

    analysis.rule = `${currentTense?.nameEn} - ${selectedMode}`;

    return analysis;
  };

  // Función para generar análisis visual de la oración
  const generateSentenceAnalysis = (config) => {
    let { subjectText, verbText, complementText, auxiliary, verbForm, tenseId, mode, modalId, whWordText, adverbText } = config;
    // Normalize to lowercase so visual tokens show correct casing
    subjectText = subjectText.toLowerCase();
    verbText = verbText.toLowerCase();
    if (complementText) complementText = complementText.toLowerCase();
    verbForm = verbForm ? verbForm.toLowerCase() : verbForm;
    const currentTense = tenses.find(t => t.id === tenseId);
    const currentModal = modalId ? modals.find(m => m.id === modalId) : null;
    const parts = [];
    const isInterrogative = mode === 'interrogative';

    // Explicaciones en español e inglés
    const explanations = {
      subject: {
        es: `Sujeto de la oración`,
        en: `Subject of the sentence`
      },
      auxiliary: {
        'am': { es: 'Verbo "to be" para 1ra persona singular (I)', en: '"To be" verb for 1st person singular (I)' },
        'is': { es: 'Verbo "to be" para 3ra persona singular (he/she/it)', en: '"To be" verb for 3rd person singular (he/she/it)' },
        'are': { es: 'Verbo "to be" para plural o "you"', en: '"To be" verb for plural or "you"' },
        'was': { es: 'Verbo "to be" en pasado para singular', en: '"To be" verb in past for singular' },
        'were': { es: 'Verbo "to be" en pasado para plural o "you"', en: '"To be" verb in past for plural or "you"' },
        'do': { es: 'Auxiliar "do" para presente (I/you/we/they)', en: 'Auxiliary "do" for present (I/you/we/they)' },
        'does': { es: 'Auxiliar "does" para 3ra persona singular', en: 'Auxiliary "does" for 3rd person singular' },
        'did': { es: 'Auxiliar "did" para pasado (todas las personas)', en: 'Auxiliary "did" for past (all persons)' },
        'will': { es: 'Auxiliar "will" para futuro simple', en: 'Auxiliary "will" for simple future' },
        'have': { es: 'Auxiliar "have" para tiempos perfectos (I/you/we/they)', en: 'Auxiliary "have" for perfect tenses (I/you/we/they)' },
        'has': { es: 'Auxiliar "has" para tiempos perfectos (3ra persona)', en: 'Auxiliary "has" for perfect tenses (3rd person)' },
        'had': { es: 'Auxiliar "had" para pasado perfecto', en: 'Auxiliary "had" for past perfect' },
        "don't": { es: 'Auxiliar negativo para presente', en: 'Negative auxiliary for present' },
        "doesn't": { es: 'Auxiliar negativo para 3ra persona singular', en: 'Negative auxiliary for 3rd person singular' },
        "didn't": { es: 'Auxiliar negativo para pasado', en: 'Negative auxiliary for past' },
        "won't": { es: 'Auxiliar/Modal negativo para futuro o rechazo', en: 'Negative auxiliary/modal for future or refusal' },
        'going to': { es: 'Estructura "going to" para futuro con intención/plan', en: '"Going to" structure for future with intention/plan' },
        'been': { es: 'Participio de "be" para tiempos perfectos continuos', en: 'Past participle of "be" for perfect continuous tenses' },
        'used to': { es: 'Estructura para hábitos pasados que ya no existen', en: 'Structure for past habits that no longer exist' },
        'not': { es: 'Partícula negativa', en: 'Negative particle' },
        // Modales
        'can': { es: 'Modal "can" - expresa habilidad o posibilidad', en: 'Modal "can" - expresses ability or possibility' },
        'could': { es: 'Modal "could" - habilidad pasada, posibilidad o cortesía', en: 'Modal "could" - past ability, possibility, or politeness' },
        'should': { es: 'Modal "should" - consejo u obligación moral', en: 'Modal "should" - advice or moral obligation' },
        'would': { es: 'Modal "would" - condicional, cortesía o hábito pasado', en: 'Modal "would" - conditional, politeness, or past habit' },
        'must': { es: 'Modal "must" - obligación fuerte o certeza', en: 'Modal "must" - strong obligation or certainty' },
        'may': { es: 'Modal "may" - permiso formal o posibilidad', en: 'Modal "may" - formal permission or possibility' },
        'might': { es: 'Modal "might" - posibilidad remota', en: 'Modal "might" - remote possibility' },
        'shall': { es: 'Modal "shall" - sugerencia u ofrecimiento formal', en: 'Modal "shall" - suggestion or formal offer' },
        // Modales negativos
        "can't": { es: 'Modal negativo - inhabilidad o imposibilidad', en: 'Negative modal - inability or impossibility' },
        "couldn't": { es: 'Modal negativo - inhabilidad pasada o imposibilidad', en: 'Negative modal - past inability or impossibility' },
        "shouldn't": { es: 'Modal negativo - consejo en contra', en: 'Negative modal - advice against' },
        "wouldn't": { es: 'Modal negativo - rechazo condicional', en: 'Negative modal - conditional refusal' },
        "mustn't": { es: 'Modal negativo - prohibición', en: 'Negative modal - prohibition' },
      },
      verbChanges: {
        'base': { es: 'Verbo en forma base (infinitivo sin "to")', en: 'Verb in base form (infinitive without "to")' },
        'third-person-s': { es: 'Se añade "-s" para 3ra persona singular en presente', en: '"-s" is added for 3rd person singular in present' },
        'ing': { es: 'Se añade "-ing" para formar el gerundio/participio presente', en: '"-ing" is added to form the gerund/present participle' },
        'past': { es: 'Verbo conjugado en pasado simple', en: 'Verb conjugated in simple past' },
        'participle': { es: 'Verbo en participio pasado', en: 'Verb in past participle' },
        'irregular': { es: 'Verbo irregular (no sigue la regla -ed)', en: 'Irregular verb (does not follow -ed rule)' },
      }
    };

    // Determinar el tipo de cambio del verbo
    const getVerbChangeType = () => {
      if (verbForm === verbText) return 'base';
      if (verbForm === verbText + 's' || verbForm === verbText + 'es') return 'third-person-s';
      if (verbForm.endsWith('ing')) return 'ing';
      if (irregularVerbs[verbText.toLowerCase()]) {
        if (verbForm === irregularVerbs[verbText.toLowerCase()].past) return 'irregular';
        if (verbForm === irregularVerbs[verbText.toLowerCase()].participle) return 'irregular';
      }
      if (verbForm.endsWith('ed') || verbForm !== verbText) return 'past';
      return 'base';
    };

    const verbChangeType = getVerbChangeType();
    const isIrregularVerb = irregularVerbs[verbText.toLowerCase()] !== undefined;

    // Preparar las partes individuales
    const subjectPart = {
      text: isInterrogative ? subjectText : subjectText.charAt(0).toUpperCase() + subjectText.slice(1),
      type: 'subject',
      color: 'blue',
      explanation: language === 'es' ? explanations.subject.es : explanations.subject.en,
      original: subjectText,
      changed: false
    };

    const auxiliaryParts = [];
    if (auxiliary) {
      const auxTokens = auxiliary.split(' ');
      auxTokens.forEach((aux, idx) => {
        const auxLower = aux.toLowerCase();
        const auxExplanation = explanations.auxiliary[auxLower] || explanations.auxiliary[aux];
        auxiliaryParts.push({
          text: (isInterrogative && idx === 0 && !whWordText) ? aux.charAt(0).toUpperCase() + aux.slice(1) : aux,
          type: 'auxiliary',
          color: 'purple',
          explanation: auxExplanation ? (language === 'es' ? auxExplanation.es : auxExplanation.en) : (language === 'es' ? 'Auxiliar verbal' : 'Verbal auxiliary'),
          original: null,
          changed: true,
          isNew: true
        });
      });
    }

    const verbExplanation = explanations.verbChanges[verbChangeType];
    let verbDetailedExplanation = language === 'es' ? verbExplanation.es : verbExplanation.en;

    if (isIrregularVerb && (verbChangeType === 'irregular' || verbChangeType === 'past')) {
      const irrForms = irregularVerbs[verbText.toLowerCase()];
      verbDetailedExplanation += language === 'es'
        ? ` (${verbText} → ${irrForms.past} → ${irrForms.participle})`
        : ` (${verbText} → ${irrForms.past} → ${irrForms.participle})`;
    }

    const verbPart = {
      text: verbForm,
      type: 'verb',
      color: 'green',
      explanation: verbDetailedExplanation,
      original: verbText,
      changed: verbForm !== verbText,
      transformation: verbForm !== verbText ? `${verbText} → ${verbForm}` : null
    };

    // Detectar si el complemento es un adverbial (tiempo/lugar/modo)
    const ADVERBIAL_STARTERS = ['at ', 'in ', 'on ', 'before ', 'after ', 'since ', 'for ', 'during ', 'by ', 'to ', 'from ', 'near ', 'behind ', 'through ', 'between ', 'under ', 'over ', 'along ', 'across ', 'around ', 'outside ', 'inside ', 'yesterday', 'today', 'tomorrow', 'every ', 'last ', 'next ', 'ago', 'this '];
    const isAdverbialText = (text) => {
      if (!text) return false;
      const lower = text.toLowerCase().trim();
      return ADVERBIAL_STARTERS.some(s => lower.startsWith(s) || lower === s.trim());
    };

    const isIntermediateOrAbove = COURSE_ORDER.indexOf(cefrLevel) >= COURSE_ORDER.indexOf('intermedio1');
    const complementIsAdverbial = isIntermediateOrAbove && isAdverbialText(complementText);
    const complementPart = complementText ? {
      text: complementText,
      type: complementIsAdverbial ? 'adverbial' : 'complement',
      color: complementIsAdverbial ? 'amber' : 'emerald',
      explanation: complementIsAdverbial
        ? (language === 'es' ? 'Adverbial — indica cuándo, dónde o cómo ocurre la acción' : 'Adverbial — indicates when, where, or how the action occurs')
        : (language === 'es' ? 'Complemento — objeto directo o atributo del sujeto' : 'Complement — direct object or subject attribute'),
      original: complementText,
      changed: false
    } : null;

    // Parte del adverbio de frecuencia
    const adverbPart = adverbText ? {
      text: adverbText,
      type: 'adverb',
      color: 'cyan',
      explanation: language === 'es'
        ? 'Adverbio de frecuencia - indica con qué frecuencia ocurre la acción'
        : 'Frequency adverb - indicates how often the action occurs',
      original: adverbText,
      changed: false
    } : null;

    // Para "to be" como verbo principal (sin modal), el be form ya es el verbo — no hay verbPart separado
    const isBeMainVerb = verbText.toLowerCase() === 'be' && !modalId &&
      (tenseId === 'simple-present' || tenseId === 'simple-past');

    // Construir partes según el modo
    if (isInterrogative) {
      // Orden interrogativo: [WH word] + Auxiliar + Sujeto + [Adverbio] + Verbo + Complemento + ?
      if (whWordText) {
        parts.push({
          text: whWordText.charAt(0).toUpperCase() + whWordText.slice(1),
          type: 'wh-word',
          color: 'pink',
          explanation: language === 'es'
            ? `Palabra interrogativa WH - indica qué información se busca`
            : `WH question word - indicates what information is being sought`,
          original: whWordText,
          changed: false
        });
      }
      auxiliaryParts.forEach(part => parts.push(part));
      parts.push(subjectPart);
      if (adverbPart) parts.push(adverbPart);
      if (!isBeMainVerb) parts.push(verbPart);
      if (complementPart) parts.push(complementPart);
      parts.push({
        text: '?',
        type: 'punctuation',
        color: 'gray',
        explanation: language === 'es' ? 'Signo de interrogación' : 'Question mark',
        original: '?',
        changed: false
      });
    } else {
      // Orden normal: Sujeto + [Adverbio si no hay auxiliar] + Auxiliar + [Adverbio si hay auxiliar] + Verbo + Complemento
      parts.push(subjectPart);
      if (adverbPart && !auxiliary) {
        // Sin auxiliar: Sujeto + Adverbio + Verbo
        parts.push(adverbPart);
      }
      auxiliaryParts.forEach(part => parts.push(part));
      if (adverbPart && auxiliary) {
        // Con auxiliar: Sujeto + Auxiliar + Adverbio + Verbo
        parts.push(adverbPart);
      }
      if (!isBeMainVerb) parts.push(verbPart);
      if (complementPart) parts.push(complementPart);
    }

    // Generar resumen de la estructura
    const tenseName = language === 'es' ? currentTense?.nameEs : currentTense?.nameEn;
    const modeNames = {
      affirmative: language === 'es' ? 'afirmativa' : 'affirmative',
      negative: language === 'es' ? 'negativa' : 'negative',
      interrogative: language === 'es' ? 'interrogativa' : 'interrogative'
    };

    // Determinar la estructura visual
    let structureText;
    if (currentModal) {
      structureText = language === 'es'
        ? `Estructura con modal: Sujeto + ${currentModal.name} + Verbo (forma base)${complementText ? ' + Complemento' : ''}`
        : `Structure with modal: Subject + ${currentModal.name} + Verb (base form)${complementText ? ' + Complement' : ''}`;
    } else {
      structureText = language === 'es'
        ? `Estructura: ${mode === 'interrogative' ? (auxiliary ? auxiliary.split(' ')[0].toUpperCase() : 'Aux') + ' + Sujeto' : 'Sujeto'} + ${auxiliary ? 'Auxiliar + ' : ''}Verbo${complementText ? ' + Complemento' : ''}`
        : `Structure: ${mode === 'interrogative' ? (auxiliary ? auxiliary.split(' ')[0].toUpperCase() : 'Aux') + ' + Subject' : 'Subject'} + ${auxiliary ? 'Auxiliary + ' : ''}Verb${complementText ? ' + Complement' : ''}`;
    }

    // Determinar la regla aplicada
    let ruleText;
    if (currentModal) {
      ruleText = language === 'es'
        ? currentModal.fullDescEs
        : currentModal.fullDescEn;
    } else {
      ruleText = currentTense ? (language === 'es' ? currentTense.descEs : currentTense.descEn) : '';
    }

    const summary = {
      tense: currentModal ? `${currentModal.name} (${language === 'es' ? currentModal.descEs : currentModal.descEn})` : tenseName,
      mode: modeNames[mode],
      structure: structureText,
      rule: ruleText,
      isModal: !!currentModal,
      modalInfo: currentModal ? {
        name: currentModal.name,
        timeContext: currentModal.timeContext,
        desc: language === 'es' ? currentModal.fullDescEs : currentModal.fullDescEn
      } : null
    };

    return { parts, summary };
  };

  const isThirdPersonSingular = (subjectText) => {
    const subj = subjectText.toLowerCase().trim();

    // Sujetos compuestos → siempre plural
    if (subj.includes(' and ') || subj.includes(',')) return false;

    // Pronombres explícitos
    if (subj === 'he' || subj === 'she' || subj === 'it') return true;
    if (subj === 'i' || subj === 'you' || subj === 'we' || subj === 'they') return false;

    const words = subj.split(' ');
    const firstWord = words[0];
    const lastWord = words[words.length - 1];

    // Cuantificadores que implican plural
    if (['both', 'all', 'many', 'several', 'few', 'most', 'some'].includes(firstWord)) return false;

    // Plurales irregulares comunes
    const irregularPlurals = ['people', 'children', 'men', 'women', 'teeth', 'feet', 'mice', 'geese', 'oxen'];
    if (irregularPlurals.includes(lastWord)) return false;

    // Plurales regulares: terminan en -s pero no en -ss, -us, -is
    // ni son palabras singulares o pronombres que terminan en -s
    const singularExceptions = ['this', 'his', 'hers', 'its', 'ours', 'yours', 'theirs', 'was', 'has', 'does', 'is', 'as', 'us'];
    if (
      lastWord.endsWith('s') &&
      !lastWord.endsWith('ss') &&
      !lastWord.endsWith('us') &&
      !lastWord.endsWith('is') &&
      !singularExceptions.includes(lastWord)
    ) return false;

    // Por defecto: sustantivo singular (he/she/it)
    return true;
  };

  const isCVCVerb = (v) => {
    const vowels = 'aeiou';
    const len = v.length;
    if (len < 3) return false;
    const last = v[len - 1];
    const mid = v[len - 2];
    const prev = v[len - 3];
    if (vowels.includes(last) || 'wxy'.includes(last)) return false;
    if (!vowels.includes(mid)) return false;
    if (vowels.includes(prev)) return false;
    // disqualify 2-syllable+ words stressed on first syllable (heuristic: 4+ letters with vowel before CVC)
    if (len >= 4 && vowels.includes(v[len - 4])) return false;
    return true;
  };

  const presentParticiple = (v) => {
    if (v.endsWith('ie')) return v.slice(0, -2) + 'ying';
    if (v.endsWith('e') && !v.endsWith('ee')) return v.slice(0, -1) + 'ing';
    if (isCVCVerb(v)) return v + v[v.length - 1] + 'ing';
    return v + 'ing';
  };

  const simplePast = (v) => {
    const lowerV = v.toLowerCase();
    if (irregularVerbs[lowerV]) return irregularVerbs[lowerV].past;
    if (v.endsWith('e')) return v + 'd';
    if (v.endsWith('y') && !v.match(/[aeiou]y$/)) return v.slice(0, -1) + 'ied';
    if (isCVCVerb(v)) return v + v[v.length - 1] + 'ed';
    return v + 'ed';
  };

  const pastParticiple = (v) => {
    const lowerV = v.toLowerCase();
    if (irregularVerbs[lowerV]) return irregularVerbs[lowerV].participle;
    return simplePast(v);
  };

  // Conjugación 3ª persona singular presente simple
  const conjugate3p = (v) => {
    if (v.endsWith('y') && !v.match(/[aeiou]y$/)) return v.slice(0, -1) + 'ies'; // study→studies
    if (v.match(/(s|sh|ch|x|z|o)$/)) return v + 'es'; // watch→watches, go→goes
    return v + 's';
  };

  const validateWhExtension = (extension) => {
    if (!extension) return '';

    const lowerExt = extension.toLowerCase().trim();
    const words = lowerExt.split(' ').map(w => w.replace(/[,.!?]/g, ''));

    const hasManyWord = words.includes('many');
    const hasMuchWord = words.includes('much');

    if (hasManyWord) {
      const uncountable = words.find(w => uncountableNouns.includes(w));
      if (uncountable) return 'Warning: "' + uncountable + '" is uncountable. Try "How much" instead.';
    }

    if (hasMuchWord) {
      const countable = words.find(w => countableNouns.includes(w));
      if (countable) return 'Warning: "' + countable + '" is countable/plural. Try "How many" instead.';
    }

    return '';
  };

  const checkSemanticCoherence = (complementText, tenseId) => {
    if (!complementText || !tenseId) {
      setSemanticWarning(null);
      return;
    }

    const lowerComp = complementText.toLowerCase();
    const currentTense = tenses.find(t => t.id === tenseId);
    if (!currentTense) return;

    let detectedMarker = null;
    let detectedType = null;

    // Buscar en la estructura anidada
    for (const [type, categories] of Object.entries(timeMarkers)) {
      for (const [category, markers] of Object.entries(categories)) {
        for (const markerObj of markers) {
          if (lowerComp.includes(markerObj.text)) {
            detectedMarker = markerObj.text;
            detectedType = type;
            break;
          }
        }
        if (detectedMarker) break;
      }
      if (detectedMarker) break;
    }

    if (!detectedMarker) {
      setSemanticWarning(null);
      return;
    }

    if (detectedType !== currentTense.timeType) {
      const suggestedTense = tenses.find(t => t.timeType === detectedType && t.id.includes('simple'));
      
      // Recolectar todos los marcadores del timeType actual
      const allCurrentMarkers = [];
      for (const [category, markers] of Object.entries(timeMarkers[currentTense.timeType])) {
        allCurrentMarkers.push(...markers.map(m => m.text));
      }
      
      setSemanticWarning({
        type: 'warning',
        marker: detectedMarker,
        markerType: detectedType,
        currentTense: language === 'es' ? currentTense.nameEs : currentTense.nameEn,
        suggestedTense: suggestedTense ? (language === 'es' ? suggestedTense.nameEs : suggestedTense.nameEn) : null,
        suggestedTenseId: suggestedTense ? suggestedTense.id : null,
        suggestedMarkers: allCurrentMarkers
      });
    } else {
      setSemanticWarning({
        type: 'success',
        marker: detectedMarker,
        currentTense: language === 'es' ? currentTense.nameEs : currentTense.nameEn
      });
    }
  };

  const [shouldRegenerate, setShouldRegenerate] = useState(false);

  const applyTimeMarkerFix = () => {
    if (semanticWarning && semanticWarning.suggestedMarkers && semanticWarning.suggestedMarkers.length > 0) {
      setComplement(semanticWarning.suggestedMarkers[0]);
      setShouldRegenerate(true);
    }
  };

  const applyTenseFix = () => {
    if (semanticWarning && semanticWarning.suggestedTenseId) {
      setSelectedTense(semanticWarning.suggestedTenseId);
      setShouldRegenerate(true);
    }
  };

  // NUEVA FUNCIÓN: Aplicar marcador temporal al hacer click
  const applyTimeMarker = (marker, suggestedTense) => {
    // Autocompletar en el campo complemento
    setComplement(marker);
    
    // Sugerir tiempo verbal compatible si no hay uno seleccionado o si es diferente
    if (!selectedTense || selectedTense !== suggestedTense) {
      setSelectedTense(suggestedTense);
    }
    
    // Scroll suave hacia el campo de complemento
    setTimeout(() => {
      const complementField = document.querySelector('input[placeholder*="at home"]');
      if (complementField) {
        complementField.focus();
        complementField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  useEffect(() => {
    if (shouldRegenerate) {
      if (subject && verb && selectedTense) generateSentence();
      setShouldRegenerate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complement, selectedTense, shouldRegenerate, subject, verb]);

  useEffect(() => {
    const warning = validateWhExtension(whExtension);
    setWhWarning(warning);
    checkSemanticCoherence(complement, selectedTense);
  }, [whExtension, complement, selectedTense, language]);

  useEffect(() => {
    const lowerVerb = verb.toLowerCase();
    setIsIrregular(!!irregularVerbs[lowerVerb]);
  }, [verb]);

  // Validación de entradas en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      if (subject.trim()) {
        setSubjectValidation(validateSubject(subject, language));
      } else {
        setSubjectValidation({ valid: true, warning: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [subject, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (verb.trim()) {
        setVerbValidation(validateVerb(verb, language));
      } else {
        setVerbValidation({ valid: true, warning: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [verb, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (complement.trim()) {
        setComplementValidation(validateComplement(complement, language));
      } else {
        setComplementValidation({ valid: true, warning: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [complement, language]);

  // Verificar ortografía en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpelling(subject, 'subject');
    }, 500);
    return () => clearTimeout(timer);
  }, [subject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpelling(verb, 'verb');
    }, 500);
    return () => clearTimeout(timer);
  }, [verb]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpelling(complement, 'complement');
    }, 500);
    return () => clearTimeout(timer);
  }, [complement]);

  // Helper: construye el texto de una oración para un modo dado (sin efectos secundarios)
  const buildSentenceText = ({ mode, subject: subj, verb: v, complement: comp, tense, modal, whWord: wh, whExtension: whExt, adverb: adv }) => {
    // Normalize inputs — correct casing is applied during sentence construction
    subj = subj.toLowerCase();
    v = v.toLowerCase();
    if (comp) comp = comp.toLowerCase();
    const subjLower = subj;
    const compStr = comp ? ' ' + comp : '';
    const pp = pastParticiple(v);
    const advSp = adv ? ' ' + adv + ' ' : ' ';
    const advAfter = adv ? ' ' + adv : '';
    const is3p = !subjLower.includes(' and ') && !subjLower.includes(',') && isThirdPersonSingular(subj);
    const beForm = subjLower === 'i' ? 'am' : is3p ? 'is' : 'are';
    const wasWere = (subjLower === 'i' || is3p) && subjLower !== 'you' ? 'was' : 'were';
    const hasHave = is3p ? 'has' : 'have';
    let fullWh = wh;
    if (wh && whExt && whExt.trim()) fullWh = wh + ' ' + whExt.trim();
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const isBeVerb = v.toLowerCase() === 'be';

    if (mode === 'affirmative') {
      if (modal)                              return cap(subj) + ' ' + modal + advSp + v + compStr + '.';
      if (tense === 'simple-present') {
        if (isBeVerb)                         return cap(subj) + ' ' + beForm + advSp.trimEnd() + compStr + '.';
        return cap(subj) + advSp + (is3p ? conjugate3p(v) : v) + compStr + '.';
      }
      if (tense === 'present-continuous')     return cap(subj) + ' ' + beForm + advSp + presentParticiple(v) + compStr + '.';
      if (tense === 'simple-past') {
        if (isBeVerb)                         return cap(subj) + ' ' + wasWere + advSp.trimEnd() + compStr + '.';
        return cap(subj) + advSp + simplePast(v) + compStr + '.';
      }
      if (tense === 'past-continuous')        return cap(subj) + ' ' + wasWere + advSp + presentParticiple(v) + compStr + '.';
      if (tense === 'simple-future')          return cap(subj) + ' will' + advSp + v + compStr + '.';
      if (tense === 'future-going-to')        return cap(subj) + ' ' + beForm + advSp + 'going to ' + v + compStr + '.';
      if (tense === 'present-perfect')        return cap(subj) + ' ' + hasHave + advSp + pp + compStr + '.';
      if (tense === 'past-perfect')           return cap(subj) + ' had' + advSp + pp + compStr + '.';
      if (tense === 'future-perfect')         return cap(subj) + ' will' + advSp + 'have ' + pp + compStr + '.';
      if (tense === 'present-perfect-continuous') return cap(subj) + ' ' + hasHave + advSp + 'been ' + presentParticiple(v) + compStr + '.';
      if (tense === 'past-perfect-continuous')    return cap(subj) + ' had' + advSp + 'been ' + presentParticiple(v) + compStr + '.';
      if (tense === 'used-to')                return cap(subj) + advSp + 'used to ' + v + compStr + '.';
      if (tense === 'would-past')             return cap(subj) + ' would' + advSp + v + compStr + '.';
    }
    if (mode === 'negative') {
      if (modal) {
        const negM = modal === 'can' ? "can't" : modal === 'could' ? "couldn't" : modal === 'should' ? "shouldn't" : modal === 'would' ? "wouldn't" : modal === 'will' ? "won't" : modal === 'must' ? "mustn't" : modal + " not";
        return cap(subj) + ' ' + negM + advSp + v + compStr + '.';
      }
      if (tense === 'simple-present') {
        if (isBeVerb)                         return cap(subj) + ' ' + beForm + " not" + (compStr ? ' ' + comp : '') + '.';
        return cap(subj) + ' ' + (is3p ? "doesn't" : "don't") + advSp + v + compStr + '.';
      }
      if (tense === 'present-continuous')     return cap(subj) + ' ' + beForm + ' not' + advSp + presentParticiple(v) + compStr + '.';
      if (tense === 'simple-past') {
        if (isBeVerb)                         return cap(subj) + ' ' + wasWere + " not" + (compStr ? ' ' + comp : '') + '.';
        return cap(subj) + " didn't" + advSp + v + compStr + '.';
      }
      if (tense === 'past-continuous')        return cap(subj) + ' ' + wasWere + ' not' + advSp + presentParticiple(v) + compStr + '.';
      if (tense === 'simple-future')          return cap(subj) + " won't" + advSp + v + compStr + '.';
      if (tense === 'future-going-to')        return cap(subj) + ' ' + beForm + ' not' + advSp + 'going to ' + v + compStr + '.';
      if (tense === 'present-perfect')        return cap(subj) + ' ' + hasHave + ' not' + advSp + pp + compStr + '.';
      if (tense === 'past-perfect')           return cap(subj) + ' had not' + advSp + pp + compStr + '.';
      if (tense === 'future-perfect')         return cap(subj) + ' will not' + advSp + 'have ' + pp + compStr + '.';
      if (tense === 'present-perfect-continuous') return cap(subj) + ' ' + hasHave + ' not' + advSp + 'been ' + presentParticiple(v) + compStr + '.';
      if (tense === 'past-perfect-continuous')    return cap(subj) + ' had not' + advSp + 'been ' + presentParticiple(v) + compStr + '.';
      if (tense === 'used-to')                return cap(subj) + " didn't" + advSp + "use to " + v + compStr + '.';
      if (tense === 'would-past')             return cap(subj) + " wouldn't" + advSp + v + compStr + '.';
    }
    if (mode === 'interrogative') {
      const whCap = fullWh ? cap(fullWh) + ' ' : '';
      const prefix = fullWh ? whCap : '';
      if (modal)                              return prefix + (fullWh ? modal : cap(modal)) + ' ' + subj + advAfter + ' ' + v + compStr + '?';
      if (tense === 'simple-present') {
        if (isBeVerb) {
          const bf = fullWh ? beForm : cap(beForm);
          return prefix + bf + ' ' + subj + (compStr ? ' ' + comp : '') + '?';
        }
        const aux = is3p ? 'does' : 'do';
        return prefix + (fullWh ? aux : cap(aux)) + ' ' + subj + advAfter + ' ' + v + compStr + '?';
      }
      if (tense === 'present-continuous')     return prefix + (fullWh ? beForm : cap(beForm)) + ' ' + subj + advAfter + ' ' + presentParticiple(v) + compStr + '?';
      if (tense === 'simple-past') {
        if (isBeVerb) {
          const ww = fullWh ? wasWere : cap(wasWere);
          return prefix + ww + ' ' + subj + (compStr ? ' ' + comp : '') + '?';
        }
        return prefix + (fullWh ? 'did ' : 'Did ') + subj + advAfter + ' ' + v + compStr + '?';
      }
      if (tense === 'past-continuous')        return prefix + (fullWh ? wasWere : cap(wasWere)) + ' ' + subj + advAfter + ' ' + presentParticiple(v) + compStr + '?';
      if (tense === 'simple-future')          return prefix + (fullWh ? 'will ' : 'Will ') + subj + advAfter + ' ' + v + compStr + '?';
      if (tense === 'future-going-to')        return prefix + (fullWh ? beForm : cap(beForm)) + ' ' + subj + advAfter + ' going to ' + v + compStr + '?';
      if (tense === 'present-perfect')        return prefix + (fullWh ? hasHave : cap(hasHave)) + ' ' + subj + advAfter + ' ' + pp + compStr + '?';
      if (tense === 'past-perfect')           return prefix + (fullWh ? 'had ' : 'Had ') + subj + advAfter + ' ' + pp + compStr + '?';
      if (tense === 'future-perfect')         return prefix + (fullWh ? 'will ' : 'Will ') + subj + advAfter + ' have ' + pp + compStr + '?';
      if (tense === 'present-perfect-continuous') return prefix + (fullWh ? hasHave : cap(hasHave)) + ' ' + subj + advAfter + ' been ' + presentParticiple(v) + compStr + '?';
      if (tense === 'past-perfect-continuous')    return prefix + (fullWh ? 'had ' : 'Had ') + subj + advAfter + ' been ' + presentParticiple(v) + compStr + '?';
      if (tense === 'used-to')                return prefix + (fullWh ? 'did ' : 'Did ') + subj + advAfter + ' use to ' + v + compStr + '?';
      if (tense === 'would-past')             return prefix + (fullWh ? 'would ' : 'Would ') + subj + advAfter + ' ' + v + compStr + '?';
    }
    return '';
  };

  // Fórmulas estructurales por tiempo verbal y modo
  const tenseFormulas = {
    'simple-present':             { aff: 'S + V(s/es) + C',                          neg: 'S + do/does not + V + C',                    int: 'Do/Does + S + V + C?' },
    'present-continuous':         { aff: 'S + am/is/are + V(ing) + C',               neg: 'S + am/is/are + not + V(ing) + C',            int: 'Am/Is/Are + S + V(ing) + C?' },
    'simple-past':                { aff: 'S + V(past) + C',                          neg: 'S + did not + V + C',                         int: 'Did + S + V + C?' },
    'past-continuous':            { aff: 'S + was/were + V(ing) + C',                neg: 'S + was/were + not + V(ing) + C',             int: 'Was/Were + S + V(ing) + C?' },
    'simple-future':              { aff: 'S + will + V + C',                         neg: 'S + will not + V + C',                        int: 'Will + S + V + C?' },
    'future-going-to':            { aff: 'S + am/is/are + going to + V + C',         neg: 'S + am/is/are + not + going to + V + C',      int: 'Am/Is/Are + S + going to + V + C?' },
    'present-perfect':            { aff: 'S + have/has + V(pp) + C',                 neg: 'S + have/has + not + V(pp) + C',              int: 'Have/Has + S + V(pp) + C?' },
    'past-perfect':               { aff: 'S + had + V(pp) + C',                      neg: 'S + had + not + V(pp) + C',                   int: 'Had + S + V(pp) + C?' },
    'future-perfect':             { aff: 'S + will + have + V(pp) + C',              neg: 'S + will + not + have + V(pp) + C',           int: 'Will + S + have + V(pp) + C?' },
    'present-perfect-continuous': { aff: 'S + have/has + been + V(ing) + C',         neg: 'S + have/has + not + been + V(ing) + C',      int: 'Have/Has + S + been + V(ing) + C?' },
    'past-perfect-continuous':    { aff: 'S + had + been + V(ing) + C',              neg: 'S + had + not + been + V(ing) + C',           int: 'Had + S + been + V(ing) + C?' },
    'used-to':                    { aff: 'S + used to + V + C',                      neg: 'S + did not + use to + V + C',                int: 'Did + S + use to + V + C?' },
    'would-past':                 { aff: 'S + would + V + C',                        neg: 'S + would not + V + C',                       int: 'Would + S + V + C?' },
  };

  const resetForm = () => {
    setSubject(''); setVerb(''); setComplement('');
    setSelectedTense(''); setSelectedMode('affirmative'); setSelectedModal('');
    setWhWord(''); setWhExtension(''); setWhWarning(''); setSelectedAdverb('');
    setGeneratedSentence(''); setSemanticWarning(null);
    setSentenceAnalysis(null); setShowAnalysisDetails(false);
    setAllModeSentences(null); setShowAllModes(false);
    setSubjectValidation({ valid: true, warning: null });
    setVerbValidation({ valid: true, warning: null });
    setComplementValidation({ valid: true, warning: null });
  };

  const generateSentence = () => {
    // Si hay modal, no se requiere tiempo. Si no hay modal, sí se requiere tiempo.
    if (!subject || !verb || (!selectedModal && !selectedTense)) {
      showNotification('error', language === 'es' ? 'Por favor completa todos los campos' : 'Please complete all fields');
      return;
    }

    const whValidation = validateWhExtension(whExtension);
    setWhWarning(whValidation);

    const subj = subject.toLowerCase();
    const isBeVerb = verb.toLowerCase() === 'be';
    const beFormSubj = subj === 'i' ? 'am' : (!subj.includes(' and ') && !subj.includes(',') && isThirdPersonSingular(subject)) ? 'is' : 'are';
    const wasWereSubj = (subj === 'i' || (!subj.includes(' and ') && !subj.includes(',') && isThirdPersonSingular(subject))) && subj !== 'you' ? 'was' : 'were';
    const capStr = s => s.charAt(0).toUpperCase() + s.slice(1);
    const comp = complement ? ' ' + complement : '';
    const participle = pastParticiple(verb);
    let sentence = '';
    let fullWhWord = whWord;

    // Adverbio de frecuencia
    const adverb = selectedAdverb ? selectedAdverb : '';
    const adverbSpace = adverb ? ' ' + adverb + ' ' : ' ';

    // Variables para análisis gramatical
    let auxiliary = '';
    let verbForm = verb;

    if (whWord && whExtension.trim()) {
      fullWhWord = whWord + ' ' + whExtension.trim();
    }

    if (selectedMode === 'affirmative') {
      if (selectedModal) {
        auxiliary = selectedModal;
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + selectedModal + adverbSpace + verb + comp + '.';
      } else if (selectedTense === 'simple-present') {
        if (isBeVerb) {
          auxiliary = beFormSubj; verbForm = beFormSubj;
          sentence = capStr(subject) + ' ' + beFormSubj + (adverb ? ' ' + adverb : '') + comp + '.';
        } else {
          const conjugated = isThirdPersonSingular(subject) ? conjugate3p(verb) : verb;
          verbForm = conjugated;
          // En presente simple sin auxiliar, el adverbio va antes del verbo
          sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + adverbSpace + conjugated + comp + '.';
        }
      } else if (selectedTense === 'present-continuous') {
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        auxiliary = beForm;
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + adverbSpace + verbForm + comp + '.';
      } else if (selectedTense === 'simple-past') {
        if (isBeVerb) {
          auxiliary = wasWereSubj; verbForm = wasWereSubj;
          sentence = capStr(subject) + ' ' + wasWereSubj + (adverb ? ' ' + adverb : '') + comp + '.';
        } else {
          verbForm = simplePast(verb);
          // En pasado simple sin auxiliar, el adverbio va antes del verbo
          sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + adverbSpace + verbForm + comp + '.';
        }
      } else if (selectedTense === 'past-continuous') {
        let wasWere = 'were';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
        }
        auxiliary = wasWere;
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + wasWere + adverbSpace + verbForm + comp + '.';
      } else if (selectedTense === 'simple-future') {
        auxiliary = 'will';
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' will' + adverbSpace + verb + comp + '.';
      } else if (selectedTense === 'future-going-to') {
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        auxiliary = beForm + ' going to';
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + adverbSpace + 'going to ' + verb + comp + '.';
      } else if (selectedTense === 'present-perfect') {
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        auxiliary = hasHave;
        verbForm = participle;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + adverbSpace + participle + comp + '.';
      } else if (selectedTense === 'past-perfect') {
        auxiliary = 'had';
        verbForm = participle;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had' + adverbSpace + participle + comp + '.';
      } else if (selectedTense === 'future-perfect') {
        auxiliary = 'will have';
        verbForm = participle;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' will' + adverbSpace + 'have ' + participle + comp + '.';
      } else if (selectedTense === 'present-perfect-continuous') {
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        auxiliary = hasHave + ' been';
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + adverbSpace + 'been ' + verbForm + comp + '.';
      } else if (selectedTense === 'past-perfect-continuous') {
        auxiliary = 'had been';
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had' + adverbSpace + 'been ' + verbForm + comp + '.';
      } else if (selectedTense === 'used-to') {
        auxiliary = 'used to';
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + adverbSpace + 'used to ' + verb + comp + '.';
      } else if (selectedTense === 'would-past') {
        auxiliary = 'would';
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' would' + adverbSpace + verb + comp + '.';
      }
    } else if (selectedMode === 'negative') {
      if (selectedModal) {
        const negModal = selectedModal === 'can' ? "can't" :
                        selectedModal === 'could' ? "couldn't" :
                        selectedModal === 'should' ? "shouldn't" :
                        selectedModal === 'would' ? "wouldn't" :
                        selectedModal === 'will' ? "won't" :
                        selectedModal === 'must' ? "mustn't" :
                        selectedModal + " not";
        auxiliary = negModal;
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + negModal + adverbSpace + verb + comp + '.';
      } else if (selectedTense === 'simple-present') {
        if (isBeVerb) {
          auxiliary = beFormSubj + ' not'; verbForm = beFormSubj;
          sentence = capStr(subject) + ' ' + beFormSubj + ' not' + comp + '.';
        } else {
          const aux = isThirdPersonSingular(subject) ? "doesn't" : "don't";
          auxiliary = aux; verbForm = verb;
          sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + aux + adverbSpace + verb + comp + '.';
        }
      } else if (selectedTense === 'present-continuous') {
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        auxiliary = beForm + ' not';
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + ' not' + adverbSpace + verbForm + comp + '.';
      } else if (selectedTense === 'simple-past') {
        if (isBeVerb) {
          auxiliary = wasWereSubj + ' not'; verbForm = wasWereSubj;
          sentence = capStr(subject) + ' ' + wasWereSubj + ' not' + comp + '.';
        } else {
          auxiliary = "didn't"; verbForm = verb;
          sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " didn't" + adverbSpace + verb + comp + '.';
        }
      } else if (selectedTense === 'past-continuous') {
        let wasWere = 'were';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
        }
        auxiliary = wasWere + ' not';
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + wasWere + ' not' + adverbSpace + verbForm + comp + '.';
      } else if (selectedTense === 'simple-future') {
        auxiliary = "won't";
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " won't" + adverbSpace + verb + comp + '.';
      } else if (selectedTense === 'future-going-to') {
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        auxiliary = beForm + ' not going to';
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + ' not' + adverbSpace + 'going to ' + verb + comp + '.';
      } else if (selectedTense === 'present-perfect') {
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        auxiliary = hasHave + ' not';
        verbForm = participle;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + ' not' + adverbSpace + participle + comp + '.';
      } else if (selectedTense === 'past-perfect') {
        auxiliary = 'had not';
        verbForm = participle;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had not' + adverbSpace + participle + comp + '.';
      } else if (selectedTense === 'future-perfect') {
        auxiliary = 'will not have';
        verbForm = participle;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' will not' + adverbSpace + 'have ' + participle + comp + '.';
      } else if (selectedTense === 'present-perfect-continuous') {
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        auxiliary = hasHave + ' not been';
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + ' not' + adverbSpace + 'been ' + verbForm + comp + '.';
      } else if (selectedTense === 'past-perfect-continuous') {
        auxiliary = 'had not been';
        verbForm = presentParticiple(verb);
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had not' + adverbSpace + 'been ' + verbForm + comp + '.';
      } else if (selectedTense === 'used-to') {
        auxiliary = "didn't use to";
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " didn't" + adverbSpace + "use to " + verb + comp + '.';
      } else if (selectedTense === 'would-past') {
        auxiliary = "wouldn't";
        verbForm = verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " wouldn't" + adverbSpace + verb + comp + '.';
      }
    } else if (selectedMode === 'interrogative') {
      // En interrogativas, el adverbio va después del sujeto
      const advAfterSubj = adverb ? ' ' + adverb : '';
      if (fullWhWord) {
        const whCap = fullWhWord.charAt(0).toUpperCase() + fullWhWord.slice(1);
        if (selectedModal) {
          auxiliary = selectedModal;
          verbForm = verb;
          sentence = whCap + ' ' + selectedModal + ' ' + subject + advAfterSubj + ' ' + verb + comp + '?';
        } else if (selectedTense === 'simple-present') {
          if (isBeVerb) {
            auxiliary = beFormSubj; verbForm = beFormSubj;
            sentence = whCap + ' ' + beFormSubj + ' ' + subject + advAfterSubj + comp + '?';
          } else {
            const aux = isThirdPersonSingular(subject) ? 'does' : 'do';
            auxiliary = aux; verbForm = verb;
            sentence = whCap + ' ' + aux + ' ' + subject + advAfterSubj + ' ' + verb + comp + '?';
          }
        } else if (selectedTense === 'present-continuous') {
          let beForm = 'are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
          }
          auxiliary = beForm;
          verbForm = presentParticiple(verb);
          sentence = whCap + ' ' + beForm + ' ' + subject + advAfterSubj + ' ' + verbForm + comp + '?';
        } else if (selectedTense === 'simple-past') {
          if (isBeVerb) {
            auxiliary = wasWereSubj; verbForm = wasWereSubj;
            sentence = whCap + ' ' + wasWereSubj + ' ' + subject + advAfterSubj + comp + '?';
          } else {
            auxiliary = 'did'; verbForm = verb;
            sentence = whCap + ' did ' + subject + advAfterSubj + ' ' + verb + comp + '?';
          }
        } else if (selectedTense === 'past-continuous') {
          let wasWere = 'were';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
          }
          auxiliary = wasWere;
          verbForm = presentParticiple(verb);
          sentence = whCap + ' ' + wasWere + ' ' + subject + advAfterSubj + ' ' + verbForm + comp + '?';
        } else if (selectedTense === 'simple-future') {
          auxiliary = 'will';
          verbForm = verb;
          sentence = whCap + ' will ' + subject + advAfterSubj + ' ' + verb + comp + '?';
        } else if (selectedTense === 'future-going-to') {
          let beForm = 'are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
          }
          auxiliary = beForm + ' going to';
          verbForm = verb;
          sentence = whCap + ' ' + beForm + ' ' + subject + advAfterSubj + ' going to ' + verb + comp + '?';
        } else if (selectedTense === 'present-perfect') {
          let hasHave = 'have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
          }
          auxiliary = hasHave;
          verbForm = participle;
          sentence = whCap + ' ' + hasHave + ' ' + subject + advAfterSubj + ' ' + participle + comp + '?';
        } else if (selectedTense === 'past-perfect') {
          auxiliary = 'had';
          verbForm = participle;
          sentence = whCap + ' had ' + subject + advAfterSubj + ' ' + participle + comp + '?';
        } else if (selectedTense === 'future-perfect') {
          auxiliary = 'will have';
          verbForm = participle;
          sentence = whCap + ' will ' + subject + advAfterSubj + ' have ' + participle + comp + '?';
        } else if (selectedTense === 'present-perfect-continuous') {
          let hasHave = 'have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
          }
          auxiliary = hasHave + ' been';
          verbForm = presentParticiple(verb);
          sentence = whCap + ' ' + hasHave + ' ' + subject + advAfterSubj + ' been ' + verbForm + comp + '?';
        } else if (selectedTense === 'past-perfect-continuous') {
          auxiliary = 'had been';
          verbForm = presentParticiple(verb);
          sentence = whCap + ' had ' + subject + advAfterSubj + ' been ' + verbForm + comp + '?';
        } else if (selectedTense === 'used-to') {
          auxiliary = 'did use to';
          verbForm = verb;
          sentence = whCap + ' did ' + subject + advAfterSubj + ' use to ' + verb + comp + '?';
        } else if (selectedTense === 'would-past') {
          auxiliary = 'would';
          verbForm = verb;
          sentence = whCap + ' would ' + subject + advAfterSubj + ' ' + verb + comp + '?';
        }
      } else {
        if (selectedModal) {
          auxiliary = selectedModal;
          verbForm = verb;
          sentence = selectedModal.charAt(0).toUpperCase() + selectedModal.slice(1) + ' ' + subject + advAfterSubj + ' ' + verb + comp + '?';
        } else if (selectedTense === 'simple-present') {
          if (isBeVerb) {
            auxiliary = beFormSubj; verbForm = beFormSubj;
            sentence = capStr(beFormSubj) + ' ' + subject + advAfterSubj + comp + '?';
          } else {
            const aux = isThirdPersonSingular(subject) ? 'does' : 'do';
            auxiliary = aux; verbForm = verb;
            sentence = aux.charAt(0).toUpperCase() + aux.slice(1) + ' ' + subject + advAfterSubj + ' ' + verb + comp + '?';
          }
        } else if (selectedTense === 'present-continuous') {
          let beForm = 'are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
          }
          auxiliary = beForm;
          verbForm = presentParticiple(verb);
          sentence = beForm.charAt(0).toUpperCase() + beForm.slice(1) + ' ' + subject + advAfterSubj + ' ' + verbForm + comp + '?';
        } else if (selectedTense === 'simple-past') {
          if (isBeVerb) {
            auxiliary = wasWereSubj; verbForm = wasWereSubj;
            sentence = capStr(wasWereSubj) + ' ' + subject + advAfterSubj + comp + '?';
          } else {
            auxiliary = 'did'; verbForm = verb;
            sentence = 'Did ' + subject + advAfterSubj + ' ' + verb + comp + '?';
          }
        } else if (selectedTense === 'past-continuous') {
          let wasWere = 'were';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
          }
          auxiliary = wasWere;
          verbForm = presentParticiple(verb);
          sentence = wasWere.charAt(0).toUpperCase() + wasWere.slice(1) + ' ' + subject + advAfterSubj + ' ' + verbForm + comp + '?';
        } else if (selectedTense === 'simple-future') {
          auxiliary = 'will';
          verbForm = verb;
          sentence = 'Will ' + subject + advAfterSubj + ' ' + verb + comp + '?';
        } else if (selectedTense === 'future-going-to') {
          let beForm = 'are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
          }
          auxiliary = beForm + ' going to';
          verbForm = verb;
          sentence = beForm.charAt(0).toUpperCase() + beForm.slice(1) + ' ' + subject + advAfterSubj + ' going to ' + verb + comp + '?';
        } else if (selectedTense === 'present-perfect') {
          let hasHave = 'have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
          }
          auxiliary = hasHave;
          verbForm = participle;
          sentence = hasHave.charAt(0).toUpperCase() + hasHave.slice(1) + ' ' + subject + advAfterSubj + ' ' + participle + comp + '?';
        } else if (selectedTense === 'past-perfect') {
          auxiliary = 'had';
          verbForm = participle;
          sentence = 'Had ' + subject + advAfterSubj + ' ' + participle + comp + '?';
        } else if (selectedTense === 'future-perfect') {
          auxiliary = 'will have';
          verbForm = participle;
          sentence = 'Will ' + subject + advAfterSubj + ' have ' + participle + comp + '?';
        } else if (selectedTense === 'present-perfect-continuous') {
          let hasHave = 'have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
          }
          auxiliary = hasHave + ' been';
          verbForm = presentParticiple(verb);
          sentence = hasHave.charAt(0).toUpperCase() + hasHave.slice(1) + ' ' + subject + advAfterSubj + ' been ' + verbForm + comp + '?';
        } else if (selectedTense === 'past-perfect-continuous') {
          auxiliary = 'had been';
          verbForm = presentParticiple(verb);
          sentence = 'Had ' + subject + advAfterSubj + ' been ' + verbForm + comp + '?';
        } else if (selectedTense === 'used-to') {
          auxiliary = 'did use to';
          verbForm = verb;
          sentence = 'Did ' + subject + advAfterSubj + ' use to ' + verb + comp + '?';
        } else if (selectedTense === 'would-past') {
          auxiliary = 'would';
          verbForm = verb;
          sentence = 'Would ' + subject + advAfterSubj + ' ' + verb + comp + '?';
        }
      }
    }
    
    // Única fuente de verdad: buildSentenceText maneja toda la lógica de conjugación
    sentence = buildSentenceText({ mode: selectedMode, subject, verb, complement, tense: selectedTense, modal: selectedModal, whWord, whExtension, adverb });
    setGeneratedSentence(sentence);

    // Generar las 3 variantes de modo
    const sentenceParams = { subject, verb, complement, tense: selectedTense, modal: selectedModal, whWord, whExtension, adverb };
    setAllModeSentences({
      aff: buildSentenceText({ mode: 'affirmative',   ...sentenceParams }),
      neg: buildSentenceText({ mode: 'negative',      ...sentenceParams }),
      int: buildSentenceText({ mode: 'interrogative', ...sentenceParams }),
    });

    // Generar análisis gramatical visual
    const analysis = generateSentenceAnalysis({
      subjectText: subject,
      verbText: verb,
      complementText: complement,
      auxiliary,
      verbForm,
      tenseId: selectedTense,
      mode: selectedMode,
      modalId: selectedModal,
      whWordText: fullWhWord,
      adverbText: adverb
    });
    setSentenceAnalysis(analysis);

    // FASE 1: Guardar en historial y actualizar estadísticas
    const newHistoryItem = {
      sentence,
      timestamp: new Date().toISOString(),
      config: {
        subject,
        verb,
        complement,
        tense: tenses.find(t => t.id === selectedTense),
        mode: selectedMode,
        modal: selectedModal,
        level: cefrLevel,
      }
    };

    setSentenceHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Mantener últimas 20
    setSessionStats(prev => ({
      total: prev.total + 1,
      today: prev.today + 1
    }));
    setTotalAllTime(prev => prev + 1);
    recordPracticeDay();
  };

  const speakSentence = () => {
    if ('speechSynthesis' in window && generatedSentence) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(generatedSentence);
      utterance.rate = speechRate;
      utterance.lang = 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const verbSuggestions = getVerbSuggestions();


  // Cerrar panel activo
  const closePanel = () => setActivePanel(null);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Modal/Panel lateral */}
      {activePanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closePanel}></div>
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {activePanel === 'history' && t.history}
                {activePanel === 'practice' && t.practiceMode}
                {activePanel === 'timeGuide' && t.timeGuideTitle}
                {activePanel === 'settings' && t.themes}
                {activePanel === 'progress' && t.progressTitle}
              </h3>
              <button onClick={closePanel} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Panel de Historial */}
              {activePanel === 'history' && (
                <div className="space-y-3">
                  {sentenceHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{t.noHistory}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button onClick={exportHistory} className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center justify-center gap-2">
                          <BookOpen className="w-4 h-4" /> {language === 'es' ? 'Exportar' : 'Export'}
                        </button>
                        <button onClick={clearHistory} className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2">
                          <Trash2 className="w-4 h-4" /> {t.clearHistory}
                        </button>
                      </div>
                      {sentenceHistory.map((item, index) => {
                        const tenseName = language === 'es' ? item.config.tense?.nameEs : item.config.tense?.nameEn;
                        const modeLabels = { affirmative: language === 'es' ? 'Afirmativa' : 'Affirmative', negative: language === 'es' ? 'Negativa' : 'Negative', interrogative: language === 'es' ? 'Interrogativa' : 'Interrogative' };
                        return (
                          <div key={index} className="bg-gray-50 p-4 rounded-xl border">
                            <p className="font-medium text-gray-800 mb-2">{item.sentence}</p>
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {tenseName && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{tenseName}</span>}
                              {item.config.modal && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">{item.config.modal}</span>}
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{modeLabels[item.config.mode] || item.config.mode}</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full ml-auto">{formatTimestamp(item.timestamp)}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => copyToClipboard(item.sentence)} className="p-2 hover:bg-indigo-100 rounded-lg"><Copy className="w-4 h-4 text-indigo-600" /></button>
                              <button onClick={() => deleteFromHistory(index)} className="p-2 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Panel de Práctica */}
              {activePanel === 'practice' && (
                <div className="space-y-4">
                  {!practiceQuestion ? (
                    <div className="space-y-3">
                      {reviewUpToDate ? (
                        <div className="text-center py-10">
                          <p className="text-4xl mb-3">✅</p>
                          <p className="font-semibold text-gray-700">{language === 'es' ? '¡Estás al día!' : "You're up to date!"}</p>
                          <p className="text-sm text-gray-400 mt-1">{language === 'es' ? 'Vuelve mañana para seguir repasando.' : 'Come back tomorrow to keep reviewing.'}</p>
                          <button onClick={() => setReviewUpToDate(false)} className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                            {language === 'es' ? 'Volver al menú' : 'Back to menu'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 text-sm mb-4">{t.practiceSubtitle}</p>
                          {/* Botón Modo Repaso */}
                          {(() => {
                            const pendingCount = getPendingReviews().length;
                            return (
                              <button onClick={startReview} className="w-full p-4 bg-gray-50 hover:bg-amber-50 rounded-xl border-2 border-transparent hover:border-amber-200 text-left transition-all relative">
                                <span className="text-2xl mr-3">🔄</span>
                                <span className="font-semibold">{language === 'es' ? 'Modo Repaso' : 'Review Mode'}</span>
                                <p className="text-xs text-gray-500 mt-1 ml-9">{language === 'es' ? 'Repasa estructuras según repetición espaciada' : 'Review structures using spaced repetition'}</p>
                                {pendingCount > 0 && (
                                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                          {[
                            { type: 'fill', icon: '📝', title: t.fillInBlank, desc: language === 'es' ? 'Completa la oración' : 'Complete the sentence' },
                            { type: 'correct', icon: '✏️', title: t.correctError, desc: language === 'es' ? 'Corrige el error' : 'Correct the error' },
                            { type: 'identify', icon: '🔍', title: language === 'es' ? 'Identificar tiempo' : 'Identify tense', desc: language === 'es' ? 'Reconoce el tiempo verbal y el modo' : 'Recognize the tense and mode' },
                          ].map(p => (
                            <button key={p.type} onClick={() => startPractice(p.type)} className="w-full p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl border-2 border-transparent hover:border-indigo-200 text-left transition-all">
                              <span className="text-2xl mr-3">{p.icon}</span>
                              <span className="font-semibold">{p.title}</span>
                              <p className="text-xs text-gray-500 mt-1 ml-9">{p.desc}</p>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Tarjeta de pregunta */}
                      <div className={`p-4 rounded-xl border ${practiceQuestion.type === 'identify' ? 'bg-purple-50 border-purple-200' : practiceQuestion.type === 'correct' ? 'bg-orange-50 border-orange-200' : practiceQuestion.type === 'review' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                        {(practiceQuestion.type === 'fill' || practiceQuestion.type === 'review') && (
                          <>
                            <p className={`text-xs font-medium mb-2 uppercase tracking-wide ${practiceQuestion.type === 'review' ? 'text-amber-600' : 'text-blue-500'}`}>
                              {practiceQuestion.type === 'review'
                                ? (language === 'es' ? '🔄 Repaso espaciado' : '🔄 Spaced review')
                                : (language === 'es' ? 'Completa el verbo' : 'Fill in the verb')}
                            </p>
                            <p className="text-lg font-medium mb-1">
                              <span className="text-gray-800">{practiceQuestion.subject}</span>
                              <span className="mx-2 px-3 py-0.5 bg-white border-2 border-blue-400 rounded text-blue-600 font-bold">____</span>
                              <span className="text-blue-400 text-sm font-normal">({practiceQuestion.verb})</span>
                              <span className="text-gray-800 ml-1">{practiceQuestion.complement}.</span>
                            </p>
                            <div className="flex gap-2 text-xs mt-1">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn}</span>
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{practiceQuestion.mode === 'affirmative' ? (language === 'es' ? 'Afirmativa' : 'Affirmative') : (language === 'es' ? 'Negativa' : 'Negative')}</span>
                            </div>
                            <input
                              type="text" value={practiceAnswer} onChange={(e) => setPracticeAnswer(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !practiceResult && checkPracticeAnswer()}
                              placeholder={language === 'es' ? 'Escribe la frase verbal...' : 'Type the verb phrase...'}
                              className={`w-full mt-3 px-4 py-2 border-2 rounded-lg focus:outline-none ${practiceQuestion.type === 'review' ? 'border-amber-300 focus:border-amber-500' : 'border-blue-300 focus:border-blue-500'}`}
                              disabled={!!practiceResult}
                            />
                          </>
                        )}
                        {practiceQuestion.type === 'correct' && (
                          <>
                            <p className="text-xs text-orange-500 font-medium mb-2 uppercase tracking-wide">{language === 'es' ? 'Corrige el error' : 'Correct the error'}</p>
                            <p className="text-lg font-medium mb-1">
                              {showHint && practiceQuestion.wrongPart
                                ? practiceQuestion.wrongSentence.split(practiceQuestion.wrongPart).map((part, i, arr) => (
                                    <span key={i}>
                                      {part}
                                      {i < arr.length - 1 && (
                                        <span className="line-through decoration-red-400 decoration-2 text-red-400">{practiceQuestion.wrongPart}</span>
                                      )}
                                    </span>
                                  ))
                                : practiceQuestion.wrongSentence
                              }
                            </p>
                            <div className="flex items-center gap-2 text-xs mt-1 mb-3">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn}</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{practiceQuestion.mode === 'affirmative' ? (language === 'es' ? 'Afirmativa' : 'Affirmative') : practiceQuestion.mode === 'negative' ? (language === 'es' ? 'Negativa' : 'Negative') : (language === 'es' ? 'Interrogativa' : 'Interrogative')}</span>
                              {!practiceResult && (
                                <button onClick={() => setShowHint(h => !h)} className="ml-auto px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors">
                                  {showHint ? (language === 'es' ? 'Ocultar pista' : 'Hide hint') : (language === 'es' ? 'Pista' : 'Hint')}
                                </button>
                              )}
                            </div>
                            <input
                              type="text" value={practiceAnswer} onChange={(e) => setPracticeAnswer(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !practiceResult && checkPracticeAnswer()}
                              placeholder={language === 'es' ? 'Escribe la parte correcta...' : 'Write the correct part...'}
                              className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                              disabled={!!practiceResult}
                            />
                          </>
                        )}
                        {practiceQuestion.type === 'identify' && (
                          <>
                            <p className="text-xs text-purple-500 font-medium mb-2 uppercase tracking-wide">
                              {practiceQuestion.askTense
                                ? (language === 'es' ? '¿Qué tiempo verbal y modo es?' : 'What tense and mode is this?')
                                : (language === 'es' ? '¿Qué modo tiene esta oración?' : 'What mode is this sentence?')}
                            </p>
                            <p className="text-xl font-semibold text-gray-800 mb-4">"{practiceQuestion.fullSentence}"</p>
                            {/* Opciones de tiempo (solo si hay suficientes tiempos disponibles) */}
                            {practiceQuestion.askTense && (
                              <>
                                <p className="text-xs font-medium text-gray-500 mb-2">{language === 'es' ? 'Tiempo verbal:' : 'Tense:'}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {practiceQuestion.tenseOptions.map(opt => (
                                    <button
                                      key={opt.id}
                                      onClick={() => !practiceResult && setIdentifyTenseAnswer(opt.id)}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                        practiceResult
                                          ? opt.id === practiceQuestion.tense.id
                                            ? 'bg-green-100 border-green-400 text-green-700'
                                            : identifyTenseAnswer === opt.id && !practiceResult?.tenseOk
                                              ? 'bg-red-100 border-red-300 text-red-600'
                                              : 'bg-gray-100 border-gray-200 text-gray-400'
                                          : identifyTenseAnswer === opt.id
                                            ? 'bg-purple-100 border-purple-400 text-purple-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                                      }`}
                                    >
                                      {language === 'es' ? opt.nameEs : opt.nameEn}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            {/* Opciones de modo (siempre) */}
                            <p className="text-xs font-medium text-gray-500 mb-2">{language === 'es' ? 'Modo:' : 'Mode:'}</p>
                            <div className="flex gap-2">
                              {[
                                { id: 'affirmative',   label: language === 'es' ? 'Afirmativa'   : 'Affirmative' },
                                { id: 'negative',      label: language === 'es' ? 'Negativa'      : 'Negative' },
                                { id: 'interrogative', label: language === 'es' ? 'Interrogativa' : 'Interrogative' },
                              ].map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => !practiceResult && setIdentifyModeAnswer(m.id)}
                                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                    practiceResult
                                      ? m.id === practiceQuestion.mode
                                        ? 'bg-green-100 border-green-400 text-green-700'
                                        : identifyModeAnswer === m.id && !practiceResult?.modeOk
                                          ? 'bg-red-100 border-red-300 text-red-600'
                                          : 'bg-gray-100 border-gray-200 text-gray-400'
                                      : identifyModeAnswer === m.id
                                        ? 'bg-purple-100 border-purple-400 text-purple-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Resultado */}
                      {practiceResult && (
                        <div className={`p-4 rounded-xl ${practiceResult.correct ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
                          <p className={`font-bold ${practiceResult.correct ? 'text-green-700' : 'text-red-700'}`}>{practiceResult.correct ? t.correct : t.incorrect}</p>
                          {practiceQuestion.type === 'identify' ? (
                            <div className="text-sm mt-1 space-y-0.5">
                              {!practiceResult.tenseOk && <p className="text-red-600">{language === 'es' ? 'Tiempo correcto:' : 'Correct tense:'} <span className="font-semibold">{practiceResult.correctTense}</span></p>}
                              {practiceQuestion.askMode && !practiceResult.modeOk && <p className="text-red-600">{language === 'es' ? 'Modo correcto:' : 'Correct mode:'} <span className="font-semibold">{practiceResult.correctMode}</span></p>}
                            </div>
                          ) : (
                            <>
                              {!practiceResult.correct && <p className="text-sm text-red-600 mt-1">{t.theCorrectAnswer}: <span className="font-semibold">{practiceResult.correctAnswer}</span></p>}
                              {practiceResult.hint && (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                                  💡 {practiceResult.hint}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 mt-2">{language === 'es' ? 'Oración completa:' : 'Full sentence:'} <span className="font-medium text-gray-800">{practiceResult.fullSentence}</span></p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Botones acción */}
                      <div className="flex gap-2">
                        {!practiceResult ? (
                          <button
                            onClick={checkPracticeAnswer}
                            disabled={practiceQuestion.type === 'identify' && ((practiceQuestion.askTense && !identifyTenseAnswer) || !identifyModeAnswer)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >{t.checkAnswer}</button>
                        ) : (
                          <button onClick={() => { if (practiceType === 'review') { startReview(); } else { setPracticeQuestion(generatePracticeQuestion(practiceType)); setPracticeAnswer(''); setPracticeResult(null); setIdentifyTenseAnswer(''); setIdentifyModeAnswer(''); setShowHint(false); } }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">{t.nextQuestion}</button>
                        )}
                        <button onClick={() => { setPracticeQuestion(null); setPracticeAnswer(''); setPracticeResult(null); setIdentifyTenseAnswer(''); setIdentifyModeAnswer(''); setReviewUpToDate(false); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium">{t.exitPractice}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Panel de Time Guide */}
              {activePanel === 'timeGuide' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">{language === 'es' ? 'Haz click en un marcador para agregarlo a tu oración' : 'Click a marker to add it to your sentence'}</p>
                  {['past', 'present', 'future'].map(category => (
                    <div key={category} className={`p-4 rounded-xl ${category === 'past' ? 'bg-rose-50' : category === 'present' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                      <h4 className={`font-semibold text-sm mb-3 ${category === 'past' ? 'text-rose-700' : category === 'present' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        {category === 'past' ? t.timeGuidePast : category === 'present' ? t.timeGuidePresent : t.timeGuideFuture}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {getFlattenedMarkers(category).map(marker => (
                          <button
                            key={marker.text}
                            onClick={() => { applyTimeMarker(marker.text, marker.tense); closePanel(); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              complement.toLowerCase().includes(marker.text.toLowerCase())
                                ? category === 'past' ? 'bg-rose-600 text-white' : category === 'present' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                                : 'bg-white border hover:shadow-sm'
                            }`}
                          >
                            {marker.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Panel de Progreso */}
              {activePanel === 'progress' && (() => {
                const streak = computeStreak(practiceDays);
                const tenseStats = computeTenseStats();
                const hasData = totalAllTime > 0;

                // Últimos 30 días para el calendario
                const last30 = Array.from({ length: 30 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (29 - i));
                  return d.toISOString().split('T')[0];
                });
                const daySet = new Set(practiceDays);

                // Tenses con datos + tenses disponibles hasta nivel actual
                const courseIndex = COURSE_ORDER.indexOf(cefrLevel);
                const unlockedTenses = tenses.filter(t => COURSE_ORDER.indexOf(t.cefr) <= courseIndex);
                const sortedTenses = [...unlockedTenses].sort((a, b) => (tenseStats[b.id] || 0) - (tenseStats[a.id] || 0));
                const maxCount = Math.max(...sortedTenses.map(t => tenseStats[t.id] || 0), 1);

                // Tiempo verbal más usado
                const topEntry = Object.entries(tenseStats).sort((a, b) => b[1] - a[1])[0];
                const topTense = topEntry ? tenses.find(t => t.id === topEntry[0]) : null;

                return (
                  <div className="space-y-5">
                    {!hasData ? (
                      <div className="text-center py-12 text-gray-400">
                        <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">{t.noDataYet}</p>
                      </div>
                    ) : (
                      <>
                        {/* 1. RACHA */}
                        <div className={`rounded-xl p-4 flex items-center gap-4 ${streak > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <span className="text-4xl">{streak > 0 ? '🔥' : '💤'}</span>
                          <div>
                            {streak > 0 ? (
                              <>
                                <p className="text-2xl font-bold text-orange-600">{streak} {streak === 1 ? t.dayStreakSingle : t.dayStreak}</p>
                                <p className="text-xs text-orange-500">{t.streakSubtitle}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-bold text-gray-500">0 {t.dayStreak}</p>
                                <p className="text-xs text-gray-400">{t.noStreakYet}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 2. CALENDARIO */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700">{t.practiceCalendar}</p>
                            <p className="text-xs text-gray-400">{t.last30Days}</p>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {last30.map(day => (
                              <div
                                key={day}
                                title={day}
                                className={`aspect-square rounded-sm ${daySet.has(day) ? 'bg-indigo-500' : 'bg-gray-100'}`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
                            <span className="text-xs text-gray-400">{language === 'es' ? 'Sin práctica' : 'No practice'}</span>
                            <div className="w-3 h-3 rounded-sm bg-indigo-500 ml-2" />
                            <span className="text-xs text-gray-400">{language === 'es' ? 'Practicó' : 'Practiced'}</span>
                          </div>
                        </div>

                        {/* 3. TIEMPOS VERBALES */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">{t.tenseProgress}</p>
                          <div className="space-y-2.5">
                            {sortedTenses.map(tenseItem => {
                              const count = tenseStats[tenseItem.id] || 0;
                              const pct = Math.round((count / maxCount) * 100);
                              const status = count >= 10 ? 'dominated' : count >= 3 ? 'practicing' : 'unexplored';
                              const statusColors = {
                                dominated: 'bg-emerald-100 text-emerald-700',
                                practicing: 'bg-blue-100 text-blue-700',
                                unexplored: 'bg-gray-100 text-gray-400',
                              };
                              const barColors = {
                                dominated: 'bg-emerald-500',
                                practicing: 'bg-blue-400',
                                unexplored: 'bg-gray-200',
                              };
                              return (
                                <div key={tenseItem.id}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-700 truncate max-w-[55%]">
                                      {language === 'es' ? tenseItem.nameEs : tenseItem.nameEn}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">{count}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>
                                        {t[status]}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${barColors[status]}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. ESTADÍSTICAS GENERALES */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">{t.generalStats}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-indigo-600">{totalAllTime}</p>
                              <p className="text-xs text-indigo-500 mt-0.5">{t.totalAllTime}</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-blue-600">{sessionStats.today}</p>
                              <p className="text-xs text-blue-500 mt-0.5">{t.todayCount}</p>
                            </div>
                          </div>
                          {topTense && (
                            <div className="mt-3 bg-gray-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">{t.mostUsedTense}</p>
                              <p className="font-semibold text-gray-800">
                                {language === 'es' ? topTense.nameEs : topTense.nameEn}
                                <span className="text-xs font-normal text-gray-400 ml-2">({topEntry[1]} {t.sentences})</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Header full-width */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/GramMaster/favicon.svg" alt="GramMaster" className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-[22%]" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{language === 'es' ? 'Los tiempos en la palma de tu mano.' : 'English tenses at your fingertips.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* IDIOMA toggle */}
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-0.5">{language === 'es' ? 'Idioma' : 'Language'}</span>
              <div className="flex bg-slate-100 border border-slate-300 rounded-lg p-0.5">
                <button onClick={() => setLanguage('es')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${language === 'es' ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`} title="Español">ES</button>
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${language === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`} title="English">EN</button>
              </div>
            </div>

            {/* Botones de acción — solo visibles en desktop */}
            <div className="hidden sm:flex items-center">
              <button onClick={() => setActivePanel('timeGuide')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t.timeGuideTitle}><Clock className="w-5 h-5 text-gray-600" /></button>
              <button onClick={() => setActivePanel('practice')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t.practiceMode}><Award className="w-5 h-5 text-gray-600" /></button>
              <button onClick={() => setActivePanel('progress')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t.progressTitle}><BarChart2 className="w-5 h-5 text-gray-600" /></button>
              <button onClick={() => setActivePanel('history')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" title={t.history}>
                <History className="w-5 h-5 text-gray-600" />
                {totalAllTime > 0 && <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold" style={{fontSize:'9px'}}>{totalAllTime > 99 ? '99+' : totalAllTime}</span>}
              </button>
            </div>
          </div>
        </header>

        {/* Área principal scrollable */}
        <main className="flex-1 overflow-y-auto py-4 px-4 sm:px-8 pb-24 sm:pb-6">
        <div className="max-w-5xl mx-auto space-y-4">

        {/* Formulario Principal */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* NIVEL + TIEMPO VERBAL en la misma fila */}
          <div className="pb-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 tracking-wide uppercase shrink-0">
                {language === 'es' ? 'Nivel' : 'Level'}
              </label>
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value)}
                className="w-28 sm:w-40 px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer shrink-0"
              >
                <option value="basico1">{language === 'es' ? 'Básico I' : 'Basic I'}</option>
                <option value="basico2">{language === 'es' ? 'Básico II' : 'Basic II'}</option>
                <option value="elemental1">{language === 'es' ? 'Elemental I' : 'Elementary I'}</option>
                <option value="elemental2">{language === 'es' ? 'Elemental II' : 'Elementary II'}</option>
                <option value="intermedio1">{language === 'es' ? 'Intermedio I' : 'Intermediate I'}</option>
                <option value="intermedio2">{language === 'es' ? 'Intermedio II' : 'Intermediate II'}</option>
                <option value="avanzado">{language === 'es' ? 'Intermedio Alto' : 'Upper-Interm.'}</option>
              </select>

              <div className="w-px h-5 bg-gray-200 shrink-0" />

              <label className="text-xs font-semibold text-gray-500 tracking-wide uppercase shrink-0">
                {t.tense} {!selectedModal && <span className="text-red-500">*</span>}
              </label>
              <select
                value={selectedTense}
                onChange={(e) => setSelectedTense(e.target.value)}
                disabled={!!selectedModal}
                className={`flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer ${selectedModal ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <option value="">{language === 'es' ? 'Selecciona un tiempo...' : 'Select a tense...'}</option>
                {['present', 'past', 'future'].map(timeType => {
                  const filtered = tenses.filter(t => t.timeType === timeType && COURSE_ORDER.indexOf(t.cefr) <= COURSE_ORDER.indexOf(cefrLevel));
                  if (filtered.length === 0) return null;
                  const groupLabel = timeType === 'present' ? (language === 'es' ? 'Presente' : 'Present') : timeType === 'past' ? (language === 'es' ? 'Pasado' : 'Past') : (language === 'es' ? 'Futuro' : 'Future');
                  return (
                    <optgroup key={timeType} label={groupLabel}>
                      {filtered.map(tense => (
                        <option key={tense.id} value={tense.id}>{language === 'es' ? tense.nameEs : tense.nameEn}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {selectedModal && (
                <span className="text-xs text-purple-500 shrink-0">
                  {language === 'es' ? 'no aplica con modal' : 'not used with modal'}
                </span>
              )}

              <div className="hidden sm:block w-px h-5 bg-gray-200 shrink-0" />

              <div className="flex w-full sm:w-auto sm:ml-auto items-center gap-2">
                <div className="flex flex-1 sm:flex-none rounded-lg border border-gray-200 overflow-hidden shrink-0">
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all border-r last:border-r-0 border-gray-200 ${
                        selectedMode === mode.id ? mode.activeClasses : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {mode.id === 'affirmative' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : mode.id === 'negative' ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <HelpCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span className="hidden sm:inline">
                        {mode.id === 'affirmative' ? t.affirmative : mode.id === 'negative' ? t.negative : t.interrogative}
                      </span>
                      <span className="sm:hidden">
                        {mode.id === 'affirmative' ? (language === 'es' ? 'Afirm.' : 'Affirm.') : mode.id === 'negative' ? (language === 'es' ? 'Neg.' : 'Neg.') : (language === 'es' ? 'Inter.' : 'Inter.')}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={resetForm}
                  title={language === 'es' ? 'Limpiar todo' : 'Clear all'}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {selectedTense && !selectedModal && (() => {
              const tenseData = tenses.find(t => t.id === selectedTense);
              const formula = tenseFormulas[selectedTense];
              if (!tenseData || !formula) return null;
              const modeKey = selectedMode === 'affirmative' ? 'aff' : selectedMode === 'negative' ? 'neg' : 'int';
              return (
                <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-mono font-semibold text-indigo-700 text-xs tracking-wide">{formula[modeKey]}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{language === 'es' ? tenseData.descEs : tenseData.descEn}</div>
                      <div className="text-gray-400 text-xs italic mt-0.5">{language === 'es' ? 'Ej.: ' : 'Ex.: '}{tenseData.example}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* WH Questions */}
          {selectedMode === 'interrogative' && (
            <div className="space-y-2">
              {/* Fila de chips base */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-6">WH</span>
                {whWords.filter(wh => wh.id !== '').map(wh => (
                  <button
                    key={wh.id}
                    type="button"
                    onClick={() => { setWhWord(whWord === wh.id ? '' : wh.id); setWhExtension(''); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      whWord === wh.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    {wh.name}
                  </button>
                ))}
              </div>
              {/* Extensión: solo para WH compuestas (What, Which, How) */}
              {whWord && whSuggestions[whWord] && (
                <div className="flex flex-wrap items-center gap-1.5 pl-8">
                  {whSuggestions[whWord].map(ext => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => setWhExtension(whExtension === ext ? '' : ext)}
                      className={`px-2.5 py-0.5 rounded-full text-xs border transition-all ${
                        whExtension === ext
                          ? 'bg-teal-100 text-teal-800 border-teal-400 font-medium'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'
                      }`}
                    >
                      {whWords.find(w => w.id === whWord)?.name} {ext}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={whExtension}
                    onChange={(e) => setWhExtension(e.target.value)}
                    placeholder={`${whWords.find(w => w.id === whWord)?.name} kind of...`}
                    className="flex-1 min-w-32 px-3 py-1 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 placeholder-gray-300"
                  />
                  {whExtension && (
                    <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      "{whWords.find(w => w.id === whWord)?.name} {whExtension}..."
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Campos principales */}
          <div className={`grid grid-cols-1 gap-4 ${(selectedTense === 'simple-present' || selectedTense === 'simple-past') && !selectedModal ? 'md:grid-cols-[2fr_1.5fr_2fr_2.5fr]' : 'md:grid-cols-[2fr_2fr_3fr]'}`}>
            {/* Sujeto */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">S</span>
                <span className="text-sm font-medium text-indigo-600">{t.subject}</span>
                <span className="text-red-500 text-xs">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="I, you, he, she, we..."
                className={`w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  !subjectValidation.valid ? 'border-red-400 bg-red-50' :
                  subjectValidation.warning ? 'border-amber-400 bg-amber-50 border-l-amber-400' :
                  'border-gray-300 border-l-indigo-400 focus:border-indigo-500'
                }`}
              />
              {!subjectValidation.valid && subjectValidation.warning && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {subjectValidation.warning}
                </p>
              )}
              {subjectValidation.valid && subjectValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {subjectValidation.warning}
                </p>
              )}
              {spellingErrors.subject.length > 0 && subjectValidation.valid && !subjectValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t.didYouMean}:
                  {spellingErrors.subject[0].suggestions.slice(0, 2).map((s, i) => (
                    <button key={i} onClick={() => applySuggestion('subject', spellingErrors.subject[0].word, s)} className="underline font-medium ml-1">{s}</button>
                  ))}
                </p>
              )}
            </div>

            {/* Adverbio de frecuencia - solo para Simple Present y Simple Past */}
            {(selectedTense === 'simple-present' || selectedTense === 'simple-past') && !selectedModal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.adverbLabel} <span className="text-gray-400 text-xs">({t.optional})</span>
                </label>
                <select
                  value={selectedAdverb}
                  onChange={(e) => setSelectedAdverb(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                >
                  {frequencyAdverbs.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}{adv.id && (language === 'es' ? ` - ${adv.descEs}` : ` (${adv.percentage}%)`)}
                    </option>
                  ))}
                </select>
                {selectedAdverb && (
                  <p className="text-xs text-indigo-600 mt-1">
                    {t.frequencyAdverbHint}
                  </p>
                )}
              </div>
            )}

            {/* Verbo */}
            <div className="relative">
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">V</span>
                <span className="text-sm font-medium text-rose-600">{t.verb}</span>
                <span className="text-red-500 text-xs">*</span>
              </label>
              <input
                type="text"
                value={verb}
                onChange={(e) => { setVerb(e.target.value); setShowVerbSuggestions(e.target.value.length > 0); }}
                onFocus={() => setShowVerbSuggestions(verb.length > 0)}
                onBlur={() => setTimeout(() => setShowVerbSuggestions(false), 200)}
                placeholder="work, study, play..."
                className={`w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  !verbValidation.valid ? 'border-red-400 bg-red-50' :
                  verbValidation.warning ? 'border-amber-400 bg-amber-50 border-l-amber-400' :
                  'border-gray-300 border-l-rose-400 focus:border-indigo-500'
                }`}
              />
              {showVerbSuggestions && verbSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {verbSuggestions.slice(0, 6).map((v) => (
                    <button key={v} onClick={() => { setVerb(v); setShowVerbSuggestions(false); }} className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">{v}</button>
                  ))}
                </div>
              )}
              {!verbValidation.valid && verbValidation.warning && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {verbValidation.warning}
                </p>
              )}
              {verbValidation.valid && verbValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {verbValidation.warning}
                </p>
              )}
              {isIrregular && irregularVerbs[verb.toLowerCase()] && verbValidation.valid && !verbValidation.warning && (
                <p className="text-xs text-emerald-600 mt-1">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {t.irregularDetected}: {irregularVerbs[verb.toLowerCase()].past}/{irregularVerbs[verb.toLowerCase()].participle}
                </p>
              )}
            </div>

            {/* Complemento */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">C</span>
                <span className="text-sm font-medium text-emerald-600">{t.complement}</span>
                <span className="text-gray-400 text-xs">({t.optional})</span>
              </label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="yesterday, at home..."
                className={`w-full px-4 py-2.5 border-y border-r rounded-lg border-l-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  !complementValidation.valid ? 'border-red-400 bg-red-50' :
                  complementValidation.warning ? 'border-amber-400 bg-amber-50 border-l-amber-400' :
                  'border-gray-300 border-l-emerald-400 focus:border-indigo-500'
                }`}
              />
              {!complementValidation.valid && complementValidation.warning && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {complementValidation.warning}
                </p>
              )}
              {complementValidation.valid && complementValidation.warning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {complementValidation.warning}
                </p>
              )}
              {selectedTense && COMPLEMENT_CHIPS[selectedTense] && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMPLEMENT_CHIPS[selectedTense].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setComplement(chip)}
                      className={`px-2 py-0.5 rounded-full text-xs border transition-all ${
                        complement === chip
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verbo modal */}
          <div>
            {/* Estado colapsado: badge si hay selección, botón trigger si no */}
            {!showModalPicker && (
              <div className="flex items-center gap-2">
                {selectedModal ? (() => {
                  const activeModal = modals.find(m => m.id === selectedModal);
                  return (
                    <>
                      <button
                        onClick={() => setShowModalPicker(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all"
                      >
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.modalVerb}</span>
                        <span className="font-bold text-sm text-purple-700">{activeModal?.name}</span>
                        <span className="text-xs text-purple-500">{language === 'es' ? activeModal?.descEs : activeModal?.descEn}</span>
                      </button>
                      <button
                        onClick={() => { setSelectedModal(''); setShowModalPicker(false); }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title={language === 'es' ? 'Quitar modal' : 'Remove modal'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  );
                })() : (
                  <button
                    onClick={() => setShowModalPicker(true)}
                    disabled={modals.filter(m => m.id !== '' && COURSE_ORDER.indexOf(m.cefr) <= COURSE_ORDER.indexOf(cefrLevel)).length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:text-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-400"
                  >
                    <span className="text-base leading-none">+</span>
                    {language === 'es' ? 'Agregar verbo modal' : 'Add modal verb'}
                    <span className="text-gray-300">
                      {modals.filter(m => m.id !== '' && COURSE_ORDER.indexOf(m.cefr) <= COURSE_ORDER.indexOf(cefrLevel)).length === 0
                        ? (language === 'es' ? '— disponible desde Básico II' : '— available from Basic II')
                        : `(${language === 'es' ? 'opcional' : 'optional'})`}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Estado expandido: picker completo */}
            {showModalPicker && (
              <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.modalVerb}</span>
                  <button onClick={() => setShowModalPicker(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'ability',    labelEs: 'Posibilidad / Habilidad', labelEn: 'Ability / Possibility', dotColor: 'bg-blue-400' },
                    { id: 'obligation', labelEs: 'Obligación / Consejo',    labelEn: 'Obligation / Advice',   dotColor: 'bg-amber-400' },
                    { id: 'future',     labelEs: 'Futuro / Condicional',    labelEn: 'Future / Conditional',  dotColor: 'bg-purple-400' },
                  ].map(group => {
                    const groupModals = modals.filter(m => m.id !== '' && m.category === group.id && COURSE_ORDER.indexOf(m.cefr) <= COURSE_ORDER.indexOf(cefrLevel));
                    if (groupModals.length === 0) return null;
                    return (
                      <div key={group.id}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full inline-block ${group.dotColor}`}></span>
                          {language === 'es' ? group.labelEs : group.labelEn}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {groupModals.map(modal => (
                            <button
                              key={modal.id}
                              onClick={() => { setSelectedModal(modal.id); setShowModalPicker(false); }}
                              className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                                selectedModal === modal.id
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <span className="font-bold text-sm">{modal.name}</span>
                              <span className={`text-[10px] mt-0.5 leading-tight text-center ${selectedModal === modal.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                {language === 'es' ? modal.descEs : modal.descEn}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botón Generar */}
          <button
            onClick={generateSentence}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {t.generate}
          </button>
        </div>

        {/* Generated Sentence con Análisis Visual */}
        {generatedSentence && (
          <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 mt-4 sm:mt-6">
            {/* Encabezado del resultado */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-600">{language === 'es' ? 'Oración generada' : 'Generated sentence'}</span>
              </div>
              {/* Leyenda de colores — solo las partes presentes en la oración */}
              {sentenceAnalysis && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                  {sentenceAnalysis.parts.some(p => p.type === 'wh-word') && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>WH</span>
                  )}
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>S</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>V</span>
                  {sentenceAnalysis.parts.some(p => p.type === 'complement') && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>C</span>
                  )}
                  {sentenceAnalysis.parts.some(p => p.type === 'adverbial') && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>A</span>
                  )}
                </div>
              )}
            </div>
            {/* Oración con colores */}
            {sentenceAnalysis ? (
              <div className="mb-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xl sm:text-2xl md:text-3xl font-bold">
                  {sentenceAnalysis.parts.map((part, index) => (
                    <span
                      key={index}
                      className={`relative group cursor-help transition-all duration-200 ${
                        part.type === 'wh-word' ? 'text-teal-700 hover:bg-teal-50' :
                        part.type === 'subject' ? 'text-indigo-600 hover:bg-indigo-50' :
                        part.type === 'adverb' ? 'text-indigo-500 hover:bg-indigo-50' :
                        part.type === 'auxiliary' ? 'text-rose-600 hover:bg-rose-50' :
                        part.type === 'verb' ? 'text-rose-600 hover:bg-rose-50' :
                        part.type === 'complement' ? 'text-emerald-600 hover:bg-emerald-50' :
                        part.type === 'adverbial' ? 'text-amber-600 hover:bg-amber-50' :
                        part.type === 'punctuation' ? 'text-gray-500' :
                        'text-gray-800'
                      } px-1 rounded`}
                    >
                      {part.text}
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        <span className="font-semibold block mb-1">
                          {part.type === 'wh-word' ? (language === 'es' ? 'Palabra WH' : 'WH Word') :
                           part.type === 'subject' ? t.subjectLabel :
                           part.type === 'adverb' ? t.adverbLabel :
                           part.type === 'auxiliary' ? t.auxiliaryLabel :
                           part.type === 'verb' ? t.verbLabel :
                           part.type === 'punctuation' ? (language === 'es' ? 'Puntuación' : 'Punctuation') :
                           part.type === 'adverbial' ? (language === 'es' ? 'Adverbial (A)' : 'Adverbial (A)') :
                           t.complementLabel + ' (C)'}
                        </span>
                        {part.explanation}
                        {part.transformation && (
                          <span className="block mt-1 text-green-300">{part.transformation}</span>
                        )}
                        {part.isNew && (
                          <span className="block mt-1 text-purple-300">{t.addedElement}</span>
                        )}
                        <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                      </span>
                    </span>
                  ))}
                  <span className="text-gray-800">{selectedMode === 'interrogative' ? '' : ''}</span>
                </div>

              </div>
            ) : (
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4">{generatedSentence}</p>
            )}

            {/* Botones de acción */}
            <div className="space-y-2">
              {/* Fila principal: Copiar + Escuchar + velocidad */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedSentence)}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t.copied : t.copyToClipboard}
                </button>
                <button
                  onClick={isSpeaking ? stopSpeaking : speakSentence}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${isSpeaking ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isSpeaking ? t.stop : t.listen}
                </button>
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="0.7">{t.slow}</option>
                  <option value="0.9">{t.normal}</option>
                  <option value="1.2">{t.fast}</option>
                </select>
              </div>
              {/* Analizar en Desgramatizador — ancho completo */}
              <a
                href={`https://moncholate.github.io/Desgramatizador/?texto=${encodeURIComponent(generatedSentence)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100"
              >
                <ExternalLink className="w-4 h-4" />
                {language === 'es' ? 'Analizar en Desgramatizador' : 'Analyze in Desgramatizador'}
              </a>
            </div>

            {/* Los 3 modos */}
            {allModeSentences && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowAllModes(!showAllModes)}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
                >
                  <span>{showAllModes ? '▾' : '▸'}</span>
                  {language === 'es' ? 'Ver los 3 modos' : 'See all 3 modes'}
                </button>
                {showAllModes && (
                  <div className="space-y-1.5">
                    {[
                      { key: 'aff', symbol: '✓', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', sym: 'text-emerald-500' },
                      { key: 'neg', symbol: '✕', bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    sym: 'text-rose-500' },
                      { key: 'int', symbol: '?', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   sym: 'text-amber-500' },
                    ].map(({ key, symbol, bg, border, text, sym }) => (
                      <div key={key} className={`flex items-baseline gap-2 px-3 py-2 rounded-lg ${bg} border ${border}`}>
                        <span className={`text-xs font-bold shrink-0 ${sym}`}>{symbol}</span>
                        <span className={`text-sm font-medium ${text}`}>{allModeSentences[key]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Semantic Warning - Compacto */}
            {semanticWarning && semanticWarning.type === 'warning' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700 flex-1">{t.semanticWarning}</span>
                <button onClick={applyTenseFix} className="text-xs font-medium text-amber-700 underline">{t.changeTense}</button>
              </div>
            )}
          </div>
        )}

        </div>
        </main>

      {/* Barra de navegación inferior — solo móvil */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="flex items-stretch">
          {[
            { panel: 'timeGuide', icon: <Clock className="w-5 h-5" />, label: language === 'es' ? 'Guía' : 'Guide' },
            { panel: 'practice',  icon: <Award className="w-5 h-5" />, label: language === 'es' ? 'Práctica' : 'Practice' },
            { panel: 'progress',  icon: <BarChart2 className="w-5 h-5" />, label: language === 'es' ? 'Progreso' : 'Progress' },
            { panel: 'history',   icon: <History className="w-5 h-5" />,  label: language === 'es' ? 'Historial' : 'History', badge: totalAllTime > 0 ? (totalAllTime > 99 ? '99+' : totalAllTime) : null },
          ].map(({ panel, icon, label, badge }) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
                activePanel === panel ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {icon}
              <span className="text-[10px] font-medium leading-tight">{label}</span>
              {badge && (
                <span className="absolute top-1.5 right-1/2 translate-x-3 bg-indigo-500 text-white font-bold rounded-full flex items-center justify-center" style={{fontSize:'9px', minWidth:'16px', height:'16px', padding:'0 3px'}}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
};

export default EnglishSentenceBuilder;
