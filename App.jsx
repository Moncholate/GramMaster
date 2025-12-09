import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Volume2, VolumeX, Award, Target, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, X, History, Copy, Check, TrendingUp, Trash2 } from 'lucide-react';

const EnglishSentenceBuilder = () => {
  const [language, setLanguage] = useState('es');
  const [subject, setSubject] = useState('');
  const [verb, setVerb] = useState('');
  const [complement, setComplement] = useState('');
  const [selectedTense, setSelectedTense] = useState('');
  const [selectedMode, setSelectedMode] = useState('affirmative');
  const [selectedModal, setSelectedModal] = useState('');
  const [whWord, setWhWord] = useState('');
  const [whExtension, setWhExtension] = useState('');
  const [whWarning, setWhWarning] = useState('');
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [semanticWarning, setSemanticWarning] = useState(null);
  const [showTimeGuide, setShowTimeGuide] = useState(false);
  const [isIrregular, setIsIrregular] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [manualPast, setManualPast] = useState('');
  const [manualParticiple, setManualParticiple] = useState('');
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
  const [practiceType, setPracticeType] = useState(''); // 'fill', 'correct', 'build'
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceResult, setPracticeResult] = useState(null);
  const [showGrammarAnalysis, setShowGrammarAnalysis] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light', 'dark', 'highContrast'
  const [tenseCategory, setTenseCategory] = useState('present'); // 'present', 'past', 'future'

  const translations = {
    es: {
      title: 'Constructor de Oraciones',
      subtitle: 'Aprende inglés construyendo oraciones perfectas',
      practiceMode: 'Modo Práctica',
      subject: 'Sujeto',
      verb: 'Verbo',
      complement: 'Complemento',
      mode: 'Modo de la oración',
      affirmative: 'Afirmativa',
      negative: 'Negativa',
      interrogative: 'Interrogativa',
      whWord: 'Palabra interrogativa',
      modalVerb: 'Verbo modal',
      tense: 'Tiempo verbal',
      generate: 'Generar Oración',
      generatedSentence: 'Oración Generada',
      listen: 'Escuchar',
      stop: 'Detener',
      irregularDetected: 'Verbo irregular detectado',
      editForms: 'Editar formas',
      markIrregular: 'Marcar como irregular',
      cancelOverride: 'Cancelar',
      pastSimple: 'Pasado Simple',
      pastParticiple: 'Participio Pasado',
      modalNote: 'Los verbos modales no se conjugan y van seguidos del verbo en forma base',
      timeGuideTitle: 'Guía de Marcadores Temporales',
      timeGuidePast: 'Pasado',
      timeGuidePresent: 'Presente',
      timeGuideFuture: 'Futuro',
      semanticWarning: 'Incoherencia temporal detectada',
      semanticSuccess: 'Coherencia temporal correcta',
      fixTimeMarker: 'Corregir marcador',
      changeTense: 'Cambiar a',
      whExtension: 'Extensión',
      whSuggestions: 'Sugerencias',
      whPreview: 'Vista previa',
      optional: 'Opcional',
      required: 'Requerido',
      speed: 'Velocidad',
      slow: 'Lento',
      normal: 'Normal',
      fast: 'Rápido',
      // Fase 1
      history: 'Historial',
      progress: 'Progreso',
      todaySentences: 'Hoy',
      totalSentences: 'Total histórico',
      sessionSentences: 'Esta sesión',
      clearHistory: 'Limpiar historial',
      noHistory: 'No hay oraciones en el historial',
      copyToClipboard: 'Copiar',
      copied: '¡Copiado!',
      deleteFromHistory: 'Eliminar',
      commonVerbs: 'Verbos comunes',
      recentVerbs: 'Verbos recientes',
      spellingError: 'Posible error ortográfico',
      didYouMean: '¿Quisiste decir',
      ignoreSuggestion: 'Ignorar',
      // Fase 2
      practiceTitle: 'Modo Práctica',
      practiceSubtitle: 'Mejora tus habilidades con ejercicios interactivos',
      fillInBlank: 'Completar espacios',
      correctError: 'Corregir errores',
      buildSentence: 'Construir oración',
      startPractice: 'Iniciar Práctica',
      exitPractice: 'Salir de Práctica',
      checkAnswer: 'Verificar Respuesta',
      nextQuestion: 'Siguiente',
      correct: '¡Correcto!',
      incorrect: 'Incorrecto',
      theCorrectAnswer: 'La respuesta correcta es',
      yourAnswer: 'Tu respuesta',
      grammarAnalysis: 'Análisis Gramatical',
      structure: 'Estructura',
      explanation: 'Explicación',
      ruleApplied: 'Regla aplicada',
      themes: 'Temas',
      lightTheme: 'Claro',
      darkTheme: 'Oscuro',
      highContrastTheme: 'Alto Contraste',
    },
    en: {
      title: 'Sentence Builder',
      subtitle: 'Learn English by building perfect sentences',
      practiceMode: 'Practice Mode',
      subject: 'Subject',
      verb: 'Verb',
      complement: 'Complement',
      mode: 'Sentence Mode',
      affirmative: 'Affirmative',
      negative: 'Negative',
      interrogative: 'Interrogative',
      whWord: 'WH-Question Word',
      modalVerb: 'Modal Verb',
      tense: 'Verb Tense',
      generate: 'Generate Sentence',
      generatedSentence: 'Generated Sentence',
      listen: 'Listen',
      stop: 'Stop',
      irregularDetected: 'Irregular verb detected',
      editForms: 'Edit forms',
      markIrregular: 'Mark as irregular',
      cancelOverride: 'Cancel',
      pastSimple: 'Past Simple',
      pastParticiple: 'Past Participle',
      modalNote: 'Modal verbs do not conjugate and are always followed by the base form',
      timeGuideTitle: 'Time Markers Guide',
      timeGuidePast: 'Past',
      timeGuidePresent: 'Present',
      timeGuideFuture: 'Future',
      semanticWarning: 'Temporal inconsistency detected',
      semanticSuccess: 'Correct temporal coherence',
      fixTimeMarker: 'Fix marker',
      changeTense: 'Change to',
      whExtension: 'Extension',
      whSuggestions: 'Suggestions',
      whPreview: 'Preview',
      optional: 'Optional',
      required: 'Required',
      speed: 'Speed',
      slow: 'Slow',
      normal: 'Normal',
      fast: 'Fast',
      // Fase 1
      history: 'History',
      progress: 'Progress',
      todaySentences: 'Today',
      totalSentences: 'All time',
      sessionSentences: 'This session',
      clearHistory: 'Clear history',
      noHistory: 'No sentences in history',
      copyToClipboard: 'Copy',
      copied: 'Copied!',
      deleteFromHistory: 'Delete',
      commonVerbs: 'Common verbs',
      recentVerbs: 'Recent verbs',
      spellingError: 'Possible spelling error',
      didYouMean: 'Did you mean',
      ignoreSuggestion: 'Ignore',
      // Fase 2
      practiceTitle: 'Practice Mode',
      practiceSubtitle: 'Improve your skills with interactive exercises',
      fillInBlank: 'Fill in the blanks',
      correctError: 'Correct errors',
      buildSentence: 'Build sentence',
      startPractice: 'Start Practice',
      exitPractice: 'Exit Practice',
      checkAnswer: 'Check Answer',
      nextQuestion: 'Next',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      theCorrectAnswer: 'The correct answer is',
      yourAnswer: 'Your answer',
      grammarAnalysis: 'Grammar Analysis',
      structure: 'Structure',
      explanation: 'Explanation',
      ruleApplied: 'Rule applied',
      themes: 'Themes',
      lightTheme: 'Light',
      darkTheme: 'Dark',
      highContrastTheme: 'High Contrast',
    }
  };

  const t = translations[language];

  // FASE 1: Verbos comunes para autocompletar
  const commonVerbs = [
    'be', 'have', 'do', 'say', 'go', 'get', 'make', 'know', 'think', 'take',
    'see', 'come', 'want', 'use', 'find', 'give', 'tell', 'work', 'call', 'try',
    'ask', 'need', 'feel', 'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin',
    'seem', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play', 'run', 'move',
    'like', 'live', 'believe', 'hold', 'bring', 'happen', 'write', 'sit', 'stand', 'lose',
    'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch',
    'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open',
    'walk', 'win', 'teach', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait',
    'serve', 'die', 'send', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'raise',
    'pass', 'sell', 'decide', 'return', 'explain', 'hope', 'develop', 'carry', 'break', 'receive',
    // Verbos adicionales importantes
    'study', 'cook', 'clean', 'dance', 'sing', 'swim', 'drive', 'fly', 'sleep', 'wake',
    'eat', 'drink', 'travel', 'visit', 'enjoy', 'practice', 'exercise', 'relax', 'rest', 'shop',
    'paint', 'draw', 'design', 'plan', 'organize', 'prepare', 'finish', 'complete', 'achieve', 'improve',
    'increase', 'decrease', 'solve', 'answer', 'choose', 'select', 'prefer', 'hate', 'miss', 'forget',
    'recognize', 'realize', 'notice', 'observe', 'discover', 'explore', 'search', 'look', 'listen', 'smell',
    'taste', 'touch', 'feel', 'hurt', 'heal', 'save', 'protect', 'attack', 'defend', 'fight',
    'argue', 'discuss', 'debate', 'agree', 'disagree', 'accept', 'refuse', 'reject', 'approve', 'deny',
    'promise', 'warn', 'advise', 'suggest', 'recommend', 'order', 'command', 'request', 'beg', 'demand'
  ];

  // Diccionario ampliado para corrección ortográfica
  const englishDictionary = [
    // Pronombres
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    // Verbos comunes (incluye la lista ampliada)
    ...commonVerbs,
    // Sustantivos comunes
    'day', 'time', 'person', 'year', 'way', 'thing', 'man', 'world', 'life', 'hand',
    'part', 'child', 'eye', 'woman', 'place', 'work', 'week', 'case', 'point', 'government',
    'company', 'number', 'group', 'problem', 'fact', 'home', 'water', 'room', 'mother', 'area',
    'money', 'story', 'month', 'lot', 'right', 'study', 'book', 'word', 'business', 'issue',
    'side', 'kind', 'head', 'house', 'service', 'friend', 'father', 'power', 'hour', 'game',
    'line', 'end', 'member', 'law', 'car', 'city', 'name', 'president', 'team', 'minute',
    'idea', 'kid', 'body', 'information', 'back', 'parent', 'face', 'others', 'level', 'office',
    'door', 'health', 'art', 'war', 'history', 'party', 'result', 'change', 'morning', 'reason',
    'research', 'girl', 'guy', 'food', 'moment', 'air', 'teacher', 'force', 'education',
    // Adjetivos comunes
    'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
    'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
    'few', 'public', 'bad', 'same', 'able', 'best', 'better', 'free', 'human', 'local',
    'sure', 'real', 'late', 'hard', 'major', 'personal', 'current', 'national', 'available',
    // Preposiciones y conjunciones
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as', 'into', 'through', 'after',
    'over', 'between', 'under', 'to', 'from', 'up', 'down', 'out', 'off', 'of',
    'and', 'or', 'but', 'because', 'if', 'when', 'while', 'although', 'than',
    // Adverbios
    'very', 'really', 'never', 'always', 'often', 'sometimes', 'usually', 'already', 'still',
    'just', 'now', 'here', 'there', 'where', 'how', 'why', 'today', 'tomorrow', 'yesterday',
    'tonight', 'again', 'once', 'twice', 'too', 'also', 'only', 'even', 'much', 'more',
    // Tiempo
    'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday',
    'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march',
    'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
    // Lugares
    'school', 'park', 'hospital', 'restaurant', 'store', 'market', 'bank', 'library',
    'church', 'station', 'airport', 'hotel', 'street', 'building', 'beach', 'mountain',
    // Familia
    'family', 'brother', 'sister', 'son', 'daughter', 'husband', 'wife', 'grandfather',
    'grandmother', 'uncle', 'aunt', 'cousin', 'baby',
    // Otros
    'football', 'soccer', 'basketball', 'music', 'movie', 'computer', 'phone', 'internet',
    'email', 'class', 'student', 'test', 'homework', 'job', 'coffee', 'lunch', 'dinner',
    'breakfast', 'drink', 'eat', 'sleep', 'study', 'paper', 'dog', 'cat', 'animal', 'color',
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'brown', 'pink'
  ];

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

  const timeMarkers = {
    past: {
      remote: [
        { text: 'long ago', tense: 'simple-past', desc: 'Hace mucho tiempo' },
        { text: 'in 1990', tense: 'simple-past', desc: 'Fechas específicas antiguas' },
        { text: 'centuries ago', tense: 'simple-past', desc: 'Hace siglos' },
        { text: 'in the past', tense: 'simple-past', desc: 'En el pasado' },
        { text: 'back then', tense: 'simple-past', desc: 'En aquel entonces' }
      ],
      recent: [
        { text: 'yesterday', tense: 'simple-past', desc: 'Ayer' },
        { text: 'last night', tense: 'simple-past', desc: 'Anoche' },
        { text: 'last week', tense: 'simple-past', desc: 'La semana pasada' },
        { text: 'last month', tense: 'simple-past', desc: 'El mes pasado' },
        { text: 'last year', tense: 'simple-past', desc: 'El año pasado' },
        { text: 'an hour ago', tense: 'simple-past', desc: 'Hace una hora' },
        { text: 'two days ago', tense: 'simple-past', desc: 'Hace dos días' }
      ],
      duration: [
        { text: 'for 2 years', tense: 'present-perfect', desc: 'Durante/Por 2 años' },
        { text: 'since 2020', tense: 'present-perfect', desc: 'Desde 2020' },
        { text: 'for a long time', tense: 'present-perfect', desc: 'Durante mucho tiempo' },
        { text: 'since Monday', tense: 'present-perfect', desc: 'Desde el lunes' },
        { text: 'all day', tense: 'present-perfect-continuous', desc: 'Todo el día' }
      ]
    },
    present: {
      exact: [
        { text: 'now', tense: 'present-continuous', desc: 'Ahora' },
        { text: 'right now', tense: 'present-continuous', desc: 'Ahora mismo' },
        { text: 'at the moment', tense: 'present-continuous', desc: 'En este momento' },
        { text: 'at present', tense: 'present-continuous', desc: 'Actualmente' }
      ],
      routine: [
        { text: 'every day', tense: 'simple-present', desc: 'Todos los días' },
        { text: 'always', tense: 'simple-present', desc: 'Siempre' },
        { text: 'usually', tense: 'simple-present', desc: 'Usualmente' },
        { text: 'often', tense: 'simple-present', desc: 'A menudo' },
        { text: 'sometimes', tense: 'simple-present', desc: 'A veces' },
        { text: 'never', tense: 'simple-present', desc: 'Nunca' },
        { text: 'on Mondays', tense: 'simple-present', desc: 'Los lunes' }
      ],
      period: [
        { text: 'these days', tense: 'present-continuous', desc: 'Estos días' },
        { text: 'nowadays', tense: 'simple-present', desc: 'Hoy en día' },
        { text: 'currently', tense: 'present-continuous', desc: 'Actualmente' },
        { text: 'this week', tense: 'present-continuous', desc: 'Esta semana' },
        { text: 'this month', tense: 'present-continuous', desc: 'Este mes' },
        { text: 'today', tense: 'simple-present', desc: 'Hoy' }
      ]
    },
    future: {
      near: [
        { text: 'soon', tense: 'simple-future', desc: 'Pronto' },
        { text: 'in a minute', tense: 'simple-future', desc: 'En un minuto' },
        { text: 'tomorrow', tense: 'simple-future', desc: 'Mañana' },
        { text: 'next week', tense: 'simple-future', desc: 'La próxima semana' },
        { text: 'in a few days', tense: 'simple-future', desc: 'En unos días' }
      ],
      far: [
        { text: 'next year', tense: 'simple-future', desc: 'El próximo año' },
        { text: 'in 2030', tense: 'simple-future', desc: 'En 2030' },
        { text: 'someday', tense: 'simple-future', desc: 'Algún día' },
        { text: 'in the future', tense: 'simple-future', desc: 'En el futuro' },
        { text: 'one day', tense: 'simple-future', desc: 'Un día' }
      ],
      intentions: [
        { text: 'tonight', tense: 'future-going-to', desc: 'Esta noche' },
        { text: 'this weekend', tense: 'future-going-to', desc: 'Este fin de semana' },
        { text: 'next month', tense: 'future-going-to', desc: 'El próximo mes' },
        { text: 'later', tense: 'future-going-to', desc: 'Más tarde' }
      ]
    }
  };

  const modes = [
    { id: 'affirmative', emoji: '✓', color: 'emerald' },
    { id: 'negative', emoji: '✕', color: 'rose' },
    { id: 'interrogative', emoji: '?', color: 'amber' },
  ];

  const tenses = [
    { id: 'simple-present', nameEn: 'Simple Present', nameEs: 'Presente Simple', example: 'I work', timeType: 'present', descEn: 'Habits, facts, routines', descEs: 'Hábitos, hechos, rutinas' },
    { id: 'present-continuous', nameEn: 'Present Continuous', nameEs: 'Presente Continuo', example: 'I am working', timeType: 'present', descEn: 'Actions happening now', descEs: 'Acciones ocurriendo ahora' },
    { id: 'simple-past', nameEn: 'Simple Past', nameEs: 'Pasado Simple', example: 'I worked', timeType: 'past', descEn: 'Completed actions in the past', descEs: 'Acciones completadas en el pasado' },
    { id: 'past-continuous', nameEn: 'Past Continuous', nameEs: 'Pasado Continuo', example: 'I was working', timeType: 'past', descEn: 'Actions in progress in the past', descEs: 'Acciones en progreso en el pasado' },
    { id: 'simple-future', nameEn: 'Simple Future', nameEs: 'Futuro Simple', example: 'I will work', timeType: 'future', descEn: 'Predictions, spontaneous decisions', descEs: 'Predicciones, decisiones espontáneas' },
    { id: 'future-going-to', nameEn: 'Future (going to)', nameEs: 'Futuro (going to)', example: 'I am going to work', timeType: 'future', descEn: 'Plans and intentions', descEs: 'Planes e intenciones' },
    { id: 'present-perfect', nameEn: 'Present Perfect', nameEs: 'Presente Perfecto', example: 'I have worked', timeType: 'present', descEn: 'Past actions with present relevance', descEs: 'Acciones pasadas con relevancia presente' },
    { id: 'past-perfect', nameEn: 'Past Perfect', nameEs: 'Pasado Perfecto', example: 'I had worked', timeType: 'past', descEn: 'Actions before another past action', descEs: 'Acciones antes de otra acción pasada' },
    { id: 'future-perfect', nameEn: 'Future Perfect', nameEs: 'Futuro Perfecto', example: 'I will have worked', timeType: 'future', descEn: 'Actions completed before a future time', descEs: 'Acciones completadas antes de un tiempo futuro' },
    { id: 'present-perfect-continuous', nameEn: 'Present Perfect Continuous', nameEs: 'Presente Perfecto Continuo', example: 'I have been working', timeType: 'present', descEn: 'Actions that started in the past and continue', descEs: 'Acciones que empezaron en el pasado y continúan' },
    { id: 'past-perfect-continuous', nameEn: 'Past Perfect Continuous', nameEs: 'Pasado Perfecto Continuo', example: 'I had been working', timeType: 'past', descEn: 'Continuous actions before a past moment', descEs: 'Acciones continuas antes de un momento pasado' },
    { id: 'used-to', nameEn: 'Used to', nameEs: 'Used to', example: 'I used to work', timeType: 'past', descEn: 'Past habits that no longer exist', descEs: 'Hábitos pasados que ya no existen' },
    { id: 'would-past', nameEn: 'Would (past habit)', nameEs: 'Would (hábito pasado)', example: 'I would work', timeType: 'past', descEn: 'Repeated actions in the past', descEs: 'Acciones repetidas en el pasado' },
  ];

  const modals = [
    { id: '', name: '—', descEs: 'Sin verbo modal', descEn: 'No modal' },
    { id: 'can', name: 'Can', descEs: 'Habilidad', descEn: 'Ability' },
    { id: 'could', name: 'Could', descEs: 'Habilidad pasada', descEn: 'Past ability' },
    { id: 'should', name: 'Should', descEs: 'Consejo', descEn: 'Advice' },
    { id: 'would', name: 'Would', descEs: 'Condicional', descEn: 'Conditional' },
    { id: 'must', name: 'Must', descEs: 'Obligación', descEn: 'Obligation' },
    { id: 'may', name: 'May', descEs: 'Permiso', descEn: 'Permission' },
    { id: 'might', name: 'Might', descEs: 'Posibilidad', descEn: 'Possibility' },
    { id: 'will', name: 'Will', descEs: 'Futuro', descEn: 'Future' },
    { id: 'shall', name: 'Shall', descEs: 'Sugerencia', descEn: 'Suggestion' },
  ];

  const whWords = [
    { id: '', name: '—' },
    { id: 'what', name: 'What' },
    { id: 'where', name: 'Where' },
    { id: 'when', name: 'When' },
    { id: 'why', name: 'Why' },
    { id: 'who', name: 'Who' },
    { id: 'how', name: 'How' },
  ];

  const whSuggestions = {
    'what': ['kind of', 'type of', 'time'],
    'how': ['much', 'many', 'often', 'long'],
  };

  const uncountableNouns = ['water', 'rice', 'bread', 'money', 'music', 'wine', 'coffee', 'tea', 'milk', 'sugar', 'air', 'time', 'information', 'advice', 'homework', 'furniture', 'luggage'];
  const countableNouns = ['books', 'apples', 'cars', 'students', 'houses', 'bottles'];

  const irregularVerbs = {
    // Verbos irregulares básicos
    go: { past: 'went', participle: 'gone' },
    eat: { past: 'ate', participle: 'eaten' },
    see: { past: 'saw', participle: 'seen' },
    do: { past: 'did', participle: 'done' },
    have: { past: 'had', participle: 'had' },
    make: { past: 'made', participle: 'made' },
    take: { past: 'took', participle: 'taken' },
    be: { past: 'was/were', participle: 'been' },
    come: { past: 'came', participle: 'come' },
    get: { past: 'got', participle: 'got/gotten' },
    give: { past: 'gave', participle: 'given' },
    find: { past: 'found', participle: 'found' },
    think: { past: 'thought', participle: 'thought' },
    tell: { past: 'told', participle: 'told' },
    become: { past: 'became', participle: 'become' },
    leave: { past: 'left', participle: 'left' },
    feel: { past: 'felt', participle: 'felt' },
    bring: { past: 'brought', participle: 'brought' },
    begin: { past: 'began', participle: 'begun' },
    keep: { past: 'kept', participle: 'kept' },
    // Verbos irregulares adicionales (80+ más)
    know: { past: 'knew', participle: 'known' },
    say: { past: 'said', participle: 'said' },
    write: { past: 'wrote', participle: 'written' },
    sit: { past: 'sat', participle: 'sat' },
    stand: { past: 'stood', participle: 'stood' },
    hear: { past: 'heard', participle: 'heard' },
    run: { past: 'ran', participle: 'run' },
    read: { past: 'read', participle: 'read' },
    meet: { past: 'met', participle: 'met' },
    speak: { past: 'spoke', participle: 'spoken' },
    hold: { past: 'held', participle: 'held' },
    send: { past: 'sent', participle: 'sent' },
    lose: { past: 'lost', participle: 'lost' },
    pay: { past: 'paid', participle: 'paid' },
    buy: { past: 'bought', participle: 'bought' },
    sell: { past: 'sold', participle: 'sold' },
    win: { past: 'won', participle: 'won' },
    fall: { past: 'fell', participle: 'fallen' },
    break: { past: 'broke', participle: 'broken' },
    choose: { past: 'chose', participle: 'chosen' },
    drive: { past: 'drove', participle: 'driven' },
    fly: { past: 'flew', participle: 'flown' },
    forget: { past: 'forgot', participle: 'forgotten' },
    grow: { past: 'grew', participle: 'grown' },
    hide: { past: 'hid', participle: 'hidden' },
    ride: { past: 'rode', participle: 'ridden' },
    rise: { past: 'rose', participle: 'risen' },
    shake: { past: 'shook', participle: 'shaken' },
    show: { past: 'showed', participle: 'shown' },
    sing: { past: 'sang', participle: 'sung' },
    sink: { past: 'sank', participle: 'sunk' },
    speak: { past: 'spoke', participle: 'spoken' },
    steal: { past: 'stole', participle: 'stolen' },
    swim: { past: 'swam', participle: 'swum' },
    tear: { past: 'tore', participle: 'torn' },
    throw: { past: 'threw', participle: 'thrown' },
    wake: { past: 'woke', participle: 'woken' },
    wear: { past: 'wore', participle: 'worn' },
    build: { past: 'built', participle: 'built' },
    burn: { past: 'burnt/burned', participle: 'burnt/burned' },
    catch: { past: 'caught', participle: 'caught' },
    teach: { past: 'taught', participle: 'taught' },
    fight: { past: 'fought', participle: 'fought' },
    seek: { past: 'sought', participle: 'sought' },
    sleep: { past: 'slept', participle: 'slept' },
    spend: { past: 'spent', participle: 'spent' },
    understand: { past: 'understood', participle: 'understood' },
    lead: { past: 'led', participle: 'led' },
    feed: { past: 'fed', participle: 'fed' },
    bleed: { past: 'bled', participle: 'bled' },
    breed: { past: 'bred', participle: 'bred' },
    deal: { past: 'dealt', participle: 'dealt' },
    dream: { past: 'dreamt/dreamed', participle: 'dreamt/dreamed' },
    lay: { past: 'laid', participle: 'laid' },
    mean: { past: 'meant', participle: 'meant' },
    shoot: { past: 'shot', participle: 'shot' },
    slide: { past: 'slid', participle: 'slid' },
    split: { past: 'split', participle: 'split' },
    spread: { past: 'spread', participle: 'spread' },
    sweep: { past: 'swept', participle: 'swept' },
    swing: { past: 'swung', participle: 'swung' },
    bend: { past: 'bent', participle: 'bent' },
    bite: { past: 'bit', participle: 'bitten' },
    blow: { past: 'blew', participle: 'blown' },
    draw: { past: 'drew', participle: 'drawn' },
    drink: { past: 'drank', participle: 'drunk' },
    forbid: { past: 'forbade', participle: 'forbidden' },
    freeze: { past: 'froze', participle: 'frozen' },
    hang: { past: 'hung', participle: 'hung' },
    hit: { past: 'hit', participle: 'hit' },
    hurt: { past: 'hurt', participle: 'hurt' },
    let: { past: 'let', participle: 'let' },
    light: { past: 'lit', participle: 'lit' },
    put: { past: 'put', participle: 'put' },
    quit: { past: 'quit', participle: 'quit' },
    ring: { past: 'rang', participle: 'rung' },
    set: { past: 'set', participle: 'set' },
    shut: { past: 'shut', participle: 'shut' },
    stick: { past: 'stuck', participle: 'stuck' },
    sting: { past: 'stung', participle: 'stung' },
    strike: { past: 'struck', participle: 'struck' },
    swear: { past: 'swore', participle: 'sworn' },
    cut: { past: 'cut', participle: 'cut' },
    cost: { past: 'cost', participle: 'cost' },
    beat: { past: 'beat', participle: 'beaten' },
    dig: { past: 'dug', participle: 'dug' },
    prove: { past: 'proved', participle: 'proven' },
    bet: { past: 'bet', participle: 'bet' },
    cast: { past: 'cast', participle: 'cast' },
    shed: { past: 'shed', participle: 'shed' },
    burst: { past: 'burst', participle: 'burst' },
    weep: { past: 'wept', participle: 'wept' },
    kneel: { past: 'knelt', participle: 'knelt' },
    lean: { past: 'leant/leaned', participle: 'leant/leaned' },
    leap: { past: 'leapt/leaped', participle: 'leapt/leaped' },
    spell: { past: 'spelt/spelled', participle: 'spelt/spelled' },
    spill: { past: 'spilt/spilled', participle: 'spilt/spilled' },
  };

  // FASE 1: Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('sentenceHistory');
    const savedStats = localStorage.getItem('sessionStats');
    const savedTotal = localStorage.getItem('totalAllTime');
    
    if (savedHistory) {
      setSentenceHistory(JSON.parse(savedHistory));
    }
    
    if (savedTotal) {
      setTotalAllTime(parseInt(savedTotal));
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

  // Aplicar sugerencia de corrección
  const applySuggestion = (field, oldWord, newWord) => {
    if (field === 'subject') {
      setSubject(prev => prev.replace(new RegExp(oldWord, 'gi'), newWord));
    } else if (field === 'verb') {
      setVerb(prev => prev.replace(new RegExp(oldWord, 'gi'), newWord));
    } else if (field === 'complement') {
      setComplement(prev => prev.replace(new RegExp(oldWord, 'gi'), newWord));
    }
  };

  // FASE 2: Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    // Aplicar clases al body para tema oscuro
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  // FASE 2: Generar pregunta de práctica
  const generatePracticeQuestion = (type) => {
    const randomTense = tenses[Math.floor(Math.random() * tenses.length)];
    const randomMode = modes[Math.floor(Math.random() * modes.length)].id;
    const subjects = ['I', 'You', 'He', 'She', 'We', 'They', 'Maria', 'John'];
    const verbs = ['work', 'play', 'study', 'eat', 'go', 'make', 'write', 'read'];
    const complements = ['at home', 'in the park', 'every day', 'yesterday', 'tomorrow'];
    
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomComplement = complements[Math.floor(Math.random() * complements.length)];

    if (type === 'fill') {
      // Completar espacios en blanco
      const blanks = Math.random() > 0.5 ? 'verb' : 'subject';
      return {
        type: 'fill',
        subject: blanks === 'subject' ? '____' : randomSubject,
        verb: blanks === 'verb' ? '____' : randomVerb,
        complement: randomComplement,
        tense: randomTense,
        mode: randomMode,
        correctAnswer: blanks === 'subject' ? randomSubject : randomVerb,
        blankType: blanks
      };
    } else if (type === 'correct') {
      // Encontrar y corregir error
      // Generar intencionalmente una oración con error
      return {
        type: 'correct',
        subject: randomSubject,
        verb: randomVerb,
        complement: randomComplement,
        tense: randomTense,
        mode: randomMode,
        // Aquí simularíamos un error común
        hasError: true,
        errorType: 'verb_form'
      };
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
  };

  // FASE 2: Verificar respuesta de práctica
  const checkPracticeAnswer = () => {
    if (!practiceQuestion) return;
    
    const isCorrect = practiceAnswer.toLowerCase().trim() === practiceQuestion.correctAnswer.toLowerCase().trim();
    setPracticeResult({
      correct: isCorrect,
      userAnswer: practiceAnswer,
      correctAnswer: practiceQuestion.correctAnswer
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

  const isThirdPersonSingular = (subjectText) => {
    const subj = subjectText.toLowerCase().trim();
    
    // Detectar sujetos compuestos con "and" o comas
    if (subj.includes(' and ') || subj.includes(',')) {
      return false; // Sujetos compuestos son siempre plural
    }
    
    // Pronombres específicos
    if (subj === 'he' || subj === 'she' || subj === 'it') return true;
    if (subj === 'i' || subj === 'you' || subj === 'we' || subj === 'they') return false;
    
    // Un solo sustantivo singular (por defecto)
    return true;
  };

  const presentParticiple = (v) => {
    if (v.endsWith('e') && !v.endsWith('ee')) return v.slice(0, -1) + 'ing';
    return v + 'ing';
  };

  const simplePast = (v) => {
    const lowerV = v.toLowerCase();
    if (isIrregular && manualPast) return manualPast;
    if (irregularVerbs[lowerV]) return irregularVerbs[lowerV].past;
    if (v.endsWith('e')) return v + 'd';
    if (v.endsWith('y') && !v.match(/[aeiou]y$/)) return v.slice(0, -1) + 'ied';
    return v + 'ed';
  };

  const pastParticiple = (v) => {
    const lowerV = v.toLowerCase();
    if (isIrregular && manualParticiple) return manualParticiple;
    if (irregularVerbs[lowerV]) return irregularVerbs[lowerV].participle;
    return simplePast(v);
  };

  const validateWhExtension = (extension) => {
    if (!extension) return '';
    
    const lowerExt = extension.toLowerCase().trim();
    const words = lowerExt.split(' ');
    
    for (const word of words) {
      const cleanWord = word.replace(/[,.!?]/g, '');
      
      if (words.includes('many')) {
        if (uncountableNouns.includes(cleanWord)) {
          return 'Warning: "' + cleanWord + '" is uncountable. Try "How much" instead.';
        }
      }

      if (words.includes('much')) {
        if (countableNouns.includes(cleanWord)) {
          return 'Warning: "' + cleanWord + '" is countable/plural. Try "How many" instead.';
        }
      }
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
    if (shouldRegenerate && subject && verb && selectedTense) {
      generateSentence();
      setShouldRegenerate(false);
    }
  }, [complement, selectedTense, shouldRegenerate]);

  useEffect(() => {
    const warning = validateWhExtension(whExtension);
    setWhWarning(warning);
    checkSemanticCoherence(complement, selectedTense);
  }, [whExtension, complement, selectedTense, language]);

  useEffect(() => {
    const lowerVerb = verb.toLowerCase();
    if (irregularVerbs[lowerVerb] && !showManualOverride) {
      setIsIrregular(true);
      setManualPast(irregularVerbs[lowerVerb].past);
      setManualParticiple(irregularVerbs[lowerVerb].participle);
    } else if (!showManualOverride) {
      setIsIrregular(false);
      setManualPast('');
      setManualParticiple('');
    }
  }, [verb, showManualOverride]);

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

  const generateSentence = () => {
    if (!subject || !verb || !selectedTense) {
      alert('Please complete all fields');
      return;
    }

    const whValidation = validateWhExtension(whExtension);
    setWhWarning(whValidation);

    const subj = subject.toLowerCase();
    const comp = complement ? ' ' + complement : '';
    const participle = pastParticiple(verb);
    let sentence = '';
    let fullWhWord = whWord;
    
    if (whWord && whExtension.trim()) {
      fullWhWord = whWord + ' ' + whExtension.trim();
    }

    if (selectedMode === 'affirmative') {
      if (selectedModal) {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + selectedModal + ' ' + verb + comp + '.';
      } else if (selectedTense === 'simple-present') {
        const conjugated = isThirdPersonSingular(subject) ? verb + 's' : verb;
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + conjugated + comp + '.';
      } else if (selectedTense === 'present-continuous') {
        // Para sujetos compuestos, siempre "are"
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + ' ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'simple-past') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + simplePast(verb) + comp + '.';
      } else if (selectedTense === 'past-continuous') {
        // Para sujetos compuestos, siempre "were"
        let wasWere = 'were';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + wasWere + ' ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'simple-future') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' will ' + verb + comp + '.';
      } else if (selectedTense === 'future-going-to') {
        // Para sujetos compuestos, siempre "are"
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + ' going to ' + verb + comp + '.';
      } else if (selectedTense === 'present-perfect') {
        // Para sujetos compuestos, siempre "have"
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + ' ' + participle + comp + '.';
      } else if (selectedTense === 'past-perfect') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had ' + participle + comp + '.';
      } else if (selectedTense === 'future-perfect') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' will have ' + participle + comp + '.';
      } else if (selectedTense === 'present-perfect-continuous') {
        // Para sujetos compuestos, siempre "have"
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + ' been ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'past-perfect-continuous') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had been ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'used-to') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' used to ' + verb + comp + '.';
      } else if (selectedTense === 'would-past') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' would ' + verb + comp + '.';
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
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + negModal + ' ' + verb + comp + '.';
      } else if (selectedTense === 'simple-present') {
        const aux = isThirdPersonSingular(subject) ? "doesn't" : "don't";
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + aux + ' ' + verb + comp + '.';
      } else if (selectedTense === 'present-continuous') {
        // Para sujetos compuestos, siempre "are"
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + ' not ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'simple-past') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " didn't " + verb + comp + '.';
      } else if (selectedTense === 'past-continuous') {
        // Para sujetos compuestos, siempre "were"
        let wasWere = 'were';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + wasWere + ' not ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'simple-future') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " won't " + verb + comp + '.';
      } else if (selectedTense === 'future-going-to') {
        // Para sujetos compuestos, siempre "are"
        let beForm = 'are';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + beForm + ' not going to ' + verb + comp + '.';
      } else if (selectedTense === 'present-perfect') {
        // Para sujetos compuestos, siempre "have"
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + ' not ' + participle + comp + '.';
      } else if (selectedTense === 'past-perfect') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had not ' + participle + comp + '.';
      } else if (selectedTense === 'future-perfect') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' will not have ' + participle + comp + '.';
      } else if (selectedTense === 'present-perfect-continuous') {
        // Para sujetos compuestos, siempre "have"
        let hasHave = 'have';
        if (!subj.includes(' and ') && !subj.includes(',')) {
          hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
        }
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' ' + hasHave + ' not been ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'past-perfect-continuous') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + ' had not been ' + presentParticiple(verb) + comp + '.';
      } else if (selectedTense === 'used-to') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " didn't use to " + verb + comp + '.';
      } else if (selectedTense === 'would-past') {
        sentence = subject.charAt(0).toUpperCase() + subject.slice(1) + " wouldn't " + verb + comp + '.';
      }
    } else if (selectedMode === 'interrogative') {
      if (fullWhWord) {
        const whCap = fullWhWord.charAt(0).toUpperCase() + fullWhWord.slice(1);
        if (selectedModal) {
          sentence = whCap + ' ' + selectedModal + ' ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'simple-present') {
          const aux = isThirdPersonSingular(subject) ? 'does' : 'do';
          sentence = whCap + ' ' + aux + ' ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'present-continuous') {
          // Para sujetos compuestos, siempre "are"
          let beForm = 'are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
          }
          sentence = whCap + ' ' + beForm + ' ' + subject + ' ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'simple-past') {
          sentence = whCap + ' did ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'past-continuous') {
          // Para sujetos compuestos, siempre "were"
          let wasWere = 'were';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'was' : 'were';
          }
          sentence = whCap + ' ' + wasWere + ' ' + subject + ' ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'simple-future') {
          sentence = whCap + ' will ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'future-going-to') {
          // Para sujetos compuestos, siempre "are"
          let beForm = 'are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'am' : isThirdPersonSingular(subject) ? 'is' : 'are';
          }
          sentence = whCap + ' ' + beForm + ' ' + subject + ' going to ' + verb + comp + '?';
        } else if (selectedTense === 'present-perfect') {
          // Para sujetos compuestos, siempre "have"
          let hasHave = 'have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
          }
          sentence = whCap + ' ' + hasHave + ' ' + subject + ' ' + participle + comp + '?';
        } else if (selectedTense === 'past-perfect') {
          sentence = whCap + ' had ' + subject + ' ' + participle + comp + '?';
        } else if (selectedTense === 'future-perfect') {
          sentence = whCap + ' will ' + subject + ' have ' + participle + comp + '?';
        } else if (selectedTense === 'present-perfect-continuous') {
          // Para sujetos compuestos, siempre "have"
          let hasHave = 'have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'has' : 'have';
          }
          sentence = whCap + ' ' + hasHave + ' ' + subject + ' been ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'past-perfect-continuous') {
          sentence = whCap + ' had ' + subject + ' been ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'used-to') {
          sentence = whCap + ' did ' + subject + ' use to ' + verb + comp + '?';
        } else if (selectedTense === 'would-past') {
          sentence = whCap + ' would ' + subject + ' ' + verb + comp + '?';
        }
      } else {
        if (selectedModal) {
          sentence = selectedModal.charAt(0).toUpperCase() + selectedModal.slice(1) + ' ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'simple-present') {
          const aux = isThirdPersonSingular(subject) ? 'Does' : 'Do';
          sentence = aux + ' ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'present-continuous') {
          // Para sujetos compuestos, siempre "Are"
          let beForm = 'Are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'Am' : isThirdPersonSingular(subject) ? 'Is' : 'Are';
          }
          sentence = beForm + ' ' + subject + ' ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'simple-past') {
          sentence = 'Did ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'past-continuous') {
          // Para sujetos compuestos, siempre "Were"
          let wasWere = 'Were';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            wasWere = (subj === 'i' || isThirdPersonSingular(subject)) && subj !== 'you' ? 'Was' : 'Were';
          }
          sentence = wasWere + ' ' + subject + ' ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'simple-future') {
          sentence = 'Will ' + subject + ' ' + verb + comp + '?';
        } else if (selectedTense === 'future-going-to') {
          // Para sujetos compuestos, siempre "Are"
          let beForm = 'Are';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            beForm = subj === 'i' ? 'Am' : isThirdPersonSingular(subject) ? 'Is' : 'Are';
          }
          sentence = beForm + ' ' + subject + ' going to ' + verb + comp + '?';
        } else if (selectedTense === 'present-perfect') {
          // Para sujetos compuestos, siempre "Have"
          let hasHave = 'Have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'Has' : 'Have';
          }
          sentence = hasHave + ' ' + subject + ' ' + participle + comp + '?';
        } else if (selectedTense === 'past-perfect') {
          sentence = 'Had ' + subject + ' ' + participle + comp + '?';
        } else if (selectedTense === 'future-perfect') {
          sentence = 'Will ' + subject + ' have ' + participle + comp + '?';
        } else if (selectedTense === 'present-perfect-continuous') {
          // Para sujetos compuestos, siempre "Have"
          let hasHave = 'Have';
          if (!subj.includes(' and ') && !subj.includes(',')) {
            hasHave = isThirdPersonSingular(subject) ? 'Has' : 'Have';
          }
          sentence = hasHave + ' ' + subject + ' been ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'past-perfect-continuous') {
          sentence = 'Had ' + subject + ' been ' + presentParticiple(verb) + comp + '?';
        } else if (selectedTense === 'used-to') {
          sentence = 'Did ' + subject + ' use to ' + verb + comp + '?';
        } else if (selectedTense === 'would-past') {
          sentence = 'Would ' + subject + ' ' + verb + comp + '?';
        }
      }
    }
    
    setGeneratedSentence(sentence);

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
      }
    };

    setSentenceHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Mantener últimas 20
    setSessionStats(prev => ({
      total: prev.total + 1,
      today: prev.today + 1
    }));
    setTotalAllTime(prev => prev + 1);
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

  // FASE 2: Clases para temas
  const getThemeClasses = () => {
    if (theme === 'dark') {
      return {
        bg: 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900',
        card: 'bg-gray-800 border-gray-700',
        text: 'text-gray-100',
        textSecondary: 'text-gray-300',
        input: 'bg-gray-700 border-gray-600 text-gray-100',
        button: 'bg-gray-700 hover:bg-gray-600',
      };
    } else if (theme === 'highContrast') {
      return {
        bg: 'bg-black',
        card: 'bg-white border-4 border-black',
        text: 'text-black',
        textSecondary: 'text-gray-800',
        input: 'bg-white border-4 border-black text-black',
        button: 'bg-black text-white border-4 border-black hover:bg-gray-800',
      };
    }
    // Light theme (default)
    return {
      bg: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
      card: 'bg-white border-gray-100',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      input: 'bg-white border-gray-200 text-gray-800',
      button: 'bg-white border-gray-200 hover:bg-gray-50',
    };
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} py-8 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BookOpen className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">{t.subtitle}</p>
          
          <div className="flex gap-3 justify-center mt-4 flex-wrap">
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className={`px-5 py-2.5 ${themeClasses.button} border-2 rounded-xl transition-all font-medium shadow-sm`}
            >
              {language === 'es' ? '🇬🇧 English' : '🇪🇸 Español'}
            </button>

            {/* FASE 2: Selector de temas */}
            <div className="relative group">
              <button
                className={`px-5 py-2.5 ${themeClasses.button} border-2 rounded-xl transition-all font-medium shadow-sm flex items-center gap-2`}
              >
                🎨 {t.themes}
              </button>
              <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50">
                <div className={`${themeClasses.card} rounded-xl shadow-xl border-2 p-2 space-y-1 min-w-[150px]`}>
                  <button
                    onClick={() => setTheme('light')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${theme === 'light' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                  >
                    ☀️ {t.lightTheme}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                  >
                    🌙 {t.darkTheme}
                  </button>
                  <button
                    onClick={() => setTheme('highContrast')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${theme === 'highContrast' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                  >
                    ⚫⚪ {t.highContrastTheme}
                  </button>
                </div>
              </div>
            </div>
            
            {/* FASE 2: Botón de modo práctica funcional */}
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            >
              <Award className="w-5 h-5" />
              {practiceMode ? t.exitPractice : t.practiceMode}
            </button>
          </div>
        </div>

        {/* FASE 1: Panel de Progreso */}
        <div className={`${themeClasses.card} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-bold ${themeClasses.text}`}>{t.progress}</h3>
            </div>
            
            <div className="flex gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">{t.sessionSentences}</p>
                <p className="text-2xl font-bold text-blue-600">{sessionStats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">{t.todaySentences}</p>
                <p className="text-2xl font-bold text-purple-600">{sessionStats.today}</p>
              </div>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="text-center hover:scale-105 transition-transform cursor-pointer group"
                title={t.history}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-xs text-gray-500">{t.totalSentences}</p>
                  <History className="w-3 h-3 text-gray-400 group-hover:text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600 group-hover:text-amber-700">{totalAllTime}</p>
              </button>
            </div>
          </div>
        </div>

        {/* FASE 2: Panel de Modo Práctica */}
        {practiceMode && (
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-1 rounded-2xl shadow-lg">
            <div className={`${themeClasses.card} rounded-xl p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-green-600" />
                <h3 className={`text-lg font-bold ${themeClasses.text}`}>{t.practiceTitle}</h3>
              </div>
              <p className={`${themeClasses.textSecondary} mb-6`}>{t.practiceSubtitle}</p>

              {!practiceQuestion ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => startPractice('fill')}
                    className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl border-2 border-blue-200 transition-all"
                  >
                    <div className="text-4xl mb-3">📝</div>
                    <h4 className="font-bold text-blue-900 mb-2">{t.fillInBlank}</h4>
                    <p className="text-sm text-blue-700">{language === 'es' ? 'Completa la oración con la palabra correcta' : 'Complete the sentence with the correct word'}</p>
                  </button>

                  <button
                    onClick={() => startPractice('correct')}
                    className="p-6 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl border-2 border-orange-200 transition-all"
                  >
                    <div className="text-4xl mb-3">✏️</div>
                    <h4 className="font-bold text-orange-900 mb-2">{t.correctError}</h4>
                    <p className="text-sm text-orange-700">{language === 'es' ? 'Encuentra y corrige el error' : 'Find and correct the error'}</p>
                  </button>

                  <button
                    onClick={() => startPractice('build')}
                    className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border-2 border-purple-200 transition-all"
                  >
                    <div className="text-4xl mb-3">🏗️</div>
                    <h4 className="font-bold text-purple-900 mb-2">{t.buildSentence}</h4>
                    <p className="text-sm text-purple-700">{language === 'es' ? 'Construye la oración desde cero' : 'Build the sentence from scratch'}</p>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {practiceType === 'fill' && (
                    <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                      <p className="text-lg mb-4">
                        <span className="font-semibold">{practiceQuestion.subject}</span>{' '}
                        <span className="font-semibold text-blue-600">{practiceQuestion.blankType === 'verb' ? '____' : practiceQuestion.verb}</span>{' '}
                        <span>{practiceQuestion.complement}</span>
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        {language === 'es' ? 'Tiempo:' : 'Tense:'} {language === 'es' ? practiceQuestion.tense.nameEs : practiceQuestion.tense.nameEn}
                      </p>
                      <input
                        type="text"
                        value={practiceAnswer}
                        onChange={(e) => setPracticeAnswer(e.target.value)}
                        placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Write your answer...'}
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none mb-3"
                        disabled={practiceResult !== null}
                      />
                    </div>
                  )}

                  {practiceResult && (
                    <div className={`p-4 rounded-xl border-2 ${practiceResult.correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <div className="flex items-start gap-3">
                        {practiceResult.correct ? (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-6 h-6 text-red-600 flex-shrink-0" />
                        )}
                        <div>
                          <h4 className={`font-bold mb-2 ${practiceResult.correct ? 'text-green-900' : 'text-red-900'}`}>
                            {practiceResult.correct ? t.correct : t.incorrect}
                          </h4>
                          {!practiceResult.correct && (
                            <div>
                              <p className="text-sm text-red-700 mb-1">
                                <strong>{t.yourAnswer}:</strong> {practiceResult.userAnswer}
                              </p>
                              <p className="text-sm text-red-700">
                                <strong>{t.theCorrectAnswer}:</strong> {practiceResult.correctAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!practiceResult ? (
                      <button
                        onClick={checkPracticeAnswer}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold"
                      >
                        {t.checkAnswer}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const question = generatePracticeQuestion(practiceType);
                          setPracticeQuestion(question);
                          setPracticeAnswer('');
                          setPracticeResult(null);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                      >
                        {t.nextQuestion}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPracticeQuestion(null);
                        setPracticeAnswer('');
                        setPracticeResult(null);
                      }}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all font-semibold"
                    >
                      {t.exitPractice}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FASE 1: Modal de Historial */}
        {showHistory && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-800">{t.history}</h3>
              </div>
              <div className="flex gap-2">
                {sentenceHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center gap-2 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.clearHistory}
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sentenceHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t.noHistory}</p>
                </div>
              ) : (
                sentenceHistory.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-800 mb-2">{item.sentence}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                            {language === 'es' ? item.config.tense?.nameEs : item.config.tense?.nameEn}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
                            {item.config.mode}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                            {new Date(item.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(item.sentence)}
                          className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                          title={t.copyToClipboard}
                        >
                          <Copy className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => deleteFromHistory(index)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title={t.deleteFromHistory}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* FASE 2: Análisis Gramatical */}
        {generatedSentence && !practiceMode && (
          <div className={`${themeClasses.card} rounded-2xl shadow-sm border p-6`}>
            <button
              onClick={() => setShowGrammarAnalysis(!showGrammarAnalysis)}
              className="w-full flex justify-between items-center text-left"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>{t.grammarAnalysis}</h3>
              </div>
              {showGrammarAnalysis ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showGrammarAnalysis && (() => {
              const analysis = generateGrammarAnalysis();
              if (!analysis) return null;
              
              return (
                <div className="mt-4 space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-3">{t.structure}:</h4>
                    <div className="space-y-2">
                      {analysis.structure.map((part, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className={`px-3 py-1 rounded-lg font-bold text-white ${
                            part.color === 'blue' ? 'bg-blue-600' :
                            part.color === 'green' ? 'bg-green-600' :
                            'bg-purple-600'
                          }`}>
                            {part.text}
                          </span>
                          <p className="text-sm text-gray-700 flex-1">{part.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-900 mb-2">{t.explanation}:</h4>
                    <p className="text-sm text-purple-800">{analysis.explanation}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2">{t.ruleApplied}:</h4>
                    <p className="text-sm text-green-800">{analysis.rule}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Time Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowTimeGuide(!showTimeGuide)}
            className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">{t.timeGuideTitle}</h3>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                {language === 'es' ? '¡Haz click para usar!' : 'Click to use!'}
              </span>
            </div>
            {showTimeGuide ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {showTimeGuide && (
            <div className="p-5 pt-0 space-y-2">
              {/* Instrucciones de uso */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-indigo-900 mb-1">
                      {language === 'es' ? '💡 Modo Interactivo Activado' : '💡 Interactive Mode Active'}
                    </h4>
                    <p className="text-sm text-indigo-700">
                      {language === 'es' 
                        ? 'Haz click en cualquier marcador para agregarlo automáticamente a tu oración y obtener el tiempo verbal sugerido.'
                        : 'Click any time marker to automatically add it to your sentence and get the suggested tense.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-rose-50 to-red-50 p-4 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-rose-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="text-lg">⏮️</span>
                    {t.timeGuidePast}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeMarkers.past.map(marker => {
                      // Verifica si el marcador está en el complemento (case insensitive y trim)
                      const isActive = complement.trim().toLowerCase().includes(marker.text.toLowerCase());
                      
                      // Verifica si el tiempo verbal seleccionado es de la categoría PAST
                      const currentTenseObj = tenses.find(t => t.id === selectedTense);
                      const isCompatible = currentTenseObj && currentTenseObj.timeType === 'past' && !isActive;
                      
                      return (
                        <button
                          key={marker.text}
                          onClick={() => applyTimeMarker(marker.text, marker.tense)}
                          className={`group relative px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all transform hover:scale-105 hover:shadow-md ${
                            isActive
                              ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-2 scale-105'
                              : isCompatible
                              ? 'bg-rose-300 text-rose-900 hover:bg-rose-400 border-2 border-rose-400'
                              : 'bg-white text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                          title={language === 'es' ? 'Click para usar' : 'Click to use'}
                        >
                          {marker.text}
                          {isActive && (
                            <CheckCircle className="w-3 h-3 inline ml-1 animate-pulse" />
                          )}
                          
                          {/* Tooltip con tiempo verbal sugerido */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            ✨ {tenses.find(t => t.id === marker.tense)?.[language === 'es' ? 'nameEs' : 'nameEn']}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="text-lg">▶️</span>
                    {t.timeGuidePresent}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeMarkers.present.map(marker => {
                      // Verifica si el marcador está en el complemento (case insensitive y trim)
                      const isActive = complement.trim().toLowerCase().includes(marker.text.toLowerCase());
                      
                      // Verifica si el tiempo verbal seleccionado es de la categoría PRESENT
                      const currentTenseObj = tenses.find(t => t.id === selectedTense);
                      const isCompatible = currentTenseObj && currentTenseObj.timeType === 'present' && !isActive;
                      
                      return (
                        <button
                          key={marker.text}
                          onClick={() => applyTimeMarker(marker.text, marker.tense)}
                          className={`group relative px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all transform hover:scale-105 hover:shadow-md ${
                            isActive
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 scale-105'
                              : isCompatible
                              ? 'bg-blue-300 text-blue-900 hover:bg-blue-400 border-2 border-blue-400'
                              : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                          title={language === 'es' ? 'Click para usar' : 'Click to use'}
                        >
                          {marker.text}
                          {isActive && (
                            <CheckCircle className="w-3 h-3 inline ml-1 animate-pulse" />
                          )}
                          
                          {/* Tooltip con tiempo verbal sugerido */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            ✨ {tenses.find(t => t.id === marker.tense)?.[language === 'es' ? 'nameEs' : 'nameEn']}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                  <h4 className="font-semibold text-emerald-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="text-lg">⏭️</span>
                    {t.timeGuideFuture}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeMarkers.future.map(marker => {
                      // Verifica si el marcador está en el complemento (case insensitive y trim)
                      const isActive = complement.trim().toLowerCase().includes(marker.text.toLowerCase());
                      
                      // Verifica si el tiempo verbal seleccionado es de la categoría FUTURE
                      const currentTenseObj = tenses.find(t => t.id === selectedTense);
                      const isCompatible = currentTenseObj && currentTenseObj.timeType === 'future' && !isActive;
                      
                      return (
                        <button
                          key={marker.text}
                          onClick={() => applyTimeMarker(marker.text, marker.tense)}
                          className={`group relative px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all transform hover:scale-105 hover:shadow-md ${
                            isActive
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-2 scale-105'
                              : isCompatible
                              ? 'bg-emerald-300 text-emerald-900 hover:bg-emerald-400 border-2 border-emerald-400'
                              : 'bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={language === 'es' ? 'Click para usar' : 'Click to use'}
                        >
                          {marker.text}
                          {isActive && (
                            <CheckCircle className="w-3 h-3 inline ml-1 animate-pulse" />
                          )}
                          
                          {/* Tooltip con tiempo verbal sugerido */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            ✨ {tenses.find(t => t.id === marker.tense)?.[language === 'es' ? 'nameEs' : 'nameEn']}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Leyenda de colores */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 mt-4 border border-gray-200">
                <h5 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide text-center">
                  {language === 'es' ? '🎨 Guía Visual' : '🎨 Visual Guide'}
                </h5>
                <div className="flex flex-wrap gap-6 justify-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-rose-600 rounded-lg ring-2 ring-rose-400 ring-offset-2 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-semibold">
                      {language === 'es' ? 'Seleccionado' : 'Selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-rose-300 rounded-lg border-2 border-rose-400"></div>
                    <span className="text-gray-700 font-semibold">
                      {language === 'es' ? 'Compatible' : 'Compatible'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white rounded-lg border border-rose-200"></div>
                    <span className="text-gray-700 font-semibold">
                      {language === 'es' ? 'Disponible' : 'Available'}
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-600 mt-3 italic">
                  {language === 'es' 
                    ? '💡 Los marcadores compatibles se iluminan cuando seleccionas un tiempo verbal'
                    : '💡 Compatible markers light up when you select a verb tense'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Form */}
        {!practiceMode && (
        <div className="space-y-6">
          
          {/* SECCIÓN 1: Componentes de la Oración */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2.5 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {language === 'es' ? 'Componentes de la Oración' : 'Sentence Components'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  {t.subject} 
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                    {t.required}
                  </span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="I, you, he, she, we, they, John, Maria, my family..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-gray-500 italic">
                    {language === 'es' ? '👤 Quién realiza la acción' : '👤 Who performs the action'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {subject.length}/100
                  </span>
                </div>
                
                {/* Alertas de corrección ortográfica */}
                {spellingErrors.subject.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {spellingErrors.subject.map((error, idx) => (
                      <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800">
                              <strong>"{error.word}"</strong> - {t.spellingError}
                            </p>
                            {error.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs text-yellow-700">{t.didYouMean}:</span>
                                {error.suggestions.map((suggestion, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => applySuggestion('subject', error.word, suggestion)}
                                    className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded text-xs font-medium transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FASE 1: Campo de verbo con autocompletar */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <Sparkles className="w-4 h-4 text-green-600" />
                  </div>
                  {t.verb}
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                    {t.required}
                  </span>
                </label>
                <input
                  type="text"
                  value={verb}
                  onChange={(e) => {
                    setVerb(e.target.value);
                    setShowVerbSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowVerbSuggestions(verb.length > 0)}
                  onBlur={() => setTimeout(() => setShowVerbSuggestions(false), 200)}
                  placeholder="work, study, play, eat, go, write, read, think..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors"
                  maxLength={50}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-gray-500 italic">
                    {language === 'es' ? '⚡ La acción principal' : '⚡ The main action'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {verb.length}/50
                  </span>
                </div>
                
                {/* FASE 1: Sugerencias de verbos mejoradas */}
                {showVerbSuggestions && verbSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-indigo-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2 border-b border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {language === 'es' ? 'Verbos sugeridos' : 'Suggested verbs'}
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      {verbSuggestions.map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setVerb(v);
                            setShowVerbSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                          <span className="text-indigo-500">→</span>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Alertas de corrección ortográfica */}
                {spellingErrors.verb.length > 0 && !showVerbSuggestions && (
                  <div className="mt-2 space-y-2">
                    {spellingErrors.verb.map((error, idx) => (
                      <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800">
                              <strong>"{error.word}"</strong> - {t.spellingError}
                            </p>
                            {error.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs text-yellow-700">{t.didYouMean}:</span>
                                {error.suggestions.map((suggestion, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => applySuggestion('verb', error.word, suggestion)}
                                    className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded text-xs font-medium transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <div className="bg-purple-100 p-1.5 rounded-lg">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  {t.complement}
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {t.optional}
                  </span>
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="at home, yesterday, in the park, every day, with friends..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors"
                  maxLength={150}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-gray-500 italic">
                    {language === 'es' ? '📍 Dónde, cuándo, cómo, con quién' : '📍 Where, when, how, with whom'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {complement.length}/150
                  </span>
                </div>
                
                {/* Alertas de corrección ortográfica */}
                {spellingErrors.complement.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {spellingErrors.complement.map((error, idx) => (
                      <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800">
                              <strong>"{error.word}"</strong> - {t.spellingError}
                            </p>
                            {error.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs text-yellow-700">{t.didYouMean}:</span>
                                {error.suggestions.map((suggestion, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => applySuggestion('complement', error.word, suggestion)}
                                    className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded text-xs font-medium transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sección de Verbos Irregulares mejorada */}
            {(isIrregular || showManualOverride || verb) && (
              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-emerald-100 p-1.5 rounded-lg">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    {language === 'es' ? 'Verbos Irregulares' : 'Irregular Verbs'}
                  </h3>
                </div>
            {isIrregular && !showManualOverride && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 p-4 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-500 p-2 rounded-lg flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 mb-1">
                        {t.irregularDetected}
                      </p>
                      <p className="text-sm text-emerald-700">
                        <strong>{verb}</strong> → <strong>{manualPast}</strong> (past) → <strong>{manualParticiple}</strong> (participle)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManualOverride(true)}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    {t.editForms}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Override */}
            {(!isIrregular || showManualOverride) && verb && (
              <button
                onClick={() => setShowManualOverride(!showManualOverride)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 hover:gap-2 transition-all"
              >
                {showManualOverride ? (
                  <>
                    <X className="w-4 h-4" />
                    {t.cancelOverride}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t.markIrregular}
                  </>
                )}
              </button>
            )}

            {showManualOverride && (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 space-y-4 border-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">1</span>
                      {t.pastSimple}
                    </label>
                    <input
                      type="text"
                      value={manualPast}
                      onChange={(e) => {
                        setManualPast(e.target.value);
                        setIsIrregular(true);
                      }}
                      placeholder="went, ate, saw..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">2</span>
                      {t.pastParticiple}
                    </label>
                    <input
                      type="text"
                      value={manualParticiple}
                      onChange={(e) => {
                        setManualParticiple(e.target.value);
                        setIsIrregular(true);
                      }}
                      placeholder="gone, eaten, seen..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
              </div>
          )}

          </div>

          {/* SECCIÓN 2: Configuración Gramatical */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2.5 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {language === 'es' ? 'Configuración Gramatical' : 'Grammar Settings'}
              </h2>
            </div>

          {/* Sentence Mode - BOTONES MÁS PEQUEÑOS */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              {t.mode} <span className="text-indigo-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`relative px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedMode === mode.id
                      ? `border-${mode.color}-500 bg-gradient-to-br from-${mode.color}-50 to-${mode.color}-100 shadow-md scale-105`
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className={`text-xl mb-1 ${selectedMode === mode.id ? 'scale-110' : ''} transition-transform`}>
                    {mode.emoji}
                  </div>
                  <div className={`font-semibold text-sm ${selectedMode === mode.id ? `text-${mode.color}-700` : 'text-gray-700'}`}>
                    {mode.id === 'affirmative' ? t.affirmative : mode.id === 'negative' ? t.negative : t.interrogative}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* WH Questions */}
          {selectedMode === 'interrogative' && (
            <div className="mb-8 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border-2 border-amber-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                {t.whWord} <span className="text-gray-400 text-xs">({t.optional})</span>
              </label>
              
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
                {whWords.map((wh) => (
                  <button
                    key={wh.id}
                    onClick={() => {
                      setWhWord(wh.id);
                      setWhExtension('');
                      setWhWarning('');
                    }}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      whWord === wh.id
                        ? 'bg-amber-500 text-white shadow-md scale-105'
                        : 'bg-white text-gray-700 hover:bg-amber-100 border-2 border-amber-200'
                    }`}
                  >
                    {wh.name}
                  </button>
                ))}
              </div>

              {whWord && (
                <div className="space-y-4 mt-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      {t.whExtension}
                    </label>
                    <input
                      type="text"
                      value={whExtension}
                      onChange={(e) => setWhExtension(e.target.value)}
                      placeholder="kind of, much, many..."
                      className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {whSuggestions[whWord] && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        {t.whSuggestions}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {whSuggestions[whWord].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setWhExtension(suggestion)}
                            className="px-4 py-2 bg-white border-2 border-amber-300 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors"
                          >
                            {whWord} {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {whExtension.trim() && (
                    <div className="bg-amber-100 border-2 border-amber-300 p-3 rounded-lg text-center">
                      <span className="text-sm font-bold text-amber-900">
                        {t.whPreview}: "{whWord.charAt(0).toUpperCase() + whWord.slice(1)} {whExtension.trim()}"
                      </span>
                    </div>
                  )}

                  {whWarning && (
                    <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0" />
                        <p className="text-sm text-yellow-900 font-medium">{whWarning}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Verbs */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              {t.modalVerb} <span className="text-gray-400 text-xs">({t.optional})</span>
            </label>
            
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {modals.map((modal) => (
                <button
                  key={modal.id}
                  onClick={() => setSelectedModal(modal.id)}
                  className={`group relative px-2 py-2.5 rounded-lg text-center transition-all ${
                    selectedModal === modal.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110 border-2 border-purple-600'
                      : 'bg-white text-gray-700 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300'
                  }`}
                  title={language === 'es' ? modal.descEs : modal.descEn}
                >
                  <div className={`font-bold text-xs transition-all ${
                    selectedModal === modal.id ? 'text-white' : 'text-gray-800'
                  }`}>
                    {modal.name}
                  </div>
                  
                  {/* Tooltip con descripción */}
                  {modal.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                      {language === 'es' ? modal.descEs : modal.descEn}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {selectedModal && (
              <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500 p-1.5 rounded-lg flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900 mb-1">
                      {modals.find(m => m.id === selectedModal)?.name}
                      {' - '}
                      <span className="font-normal">
                        {language === 'es' 
                          ? modals.find(m => m.id === selectedModal)?.descEs 
                          : modals.find(m => m.id === selectedModal)?.descEn}
                      </span>
                    </p>
                    <p className="text-xs text-purple-700">
                      {t.modalNote}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verb Tenses */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              {t.tense} <span className="text-indigo-600">*</span>
            </label>
            
            {/* Tabs para categorías */}
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setTenseCategory('present')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  tenseCategory === 'present'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {language === 'es' ? 'Presente' : 'Present'}
              </button>
              <button
                onClick={() => setTenseCategory('past')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  tenseCategory === 'past'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {language === 'es' ? 'Pasado' : 'Past'}
              </button>
              <button
                onClick={() => setTenseCategory('future')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  tenseCategory === 'future'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {language === 'es' ? 'Futuro' : 'Future'}
              </button>
            </div>

            {/* Tiempos verbales filtrados por categoría */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tenses
                .filter(tense => tense.timeType === tenseCategory)
                .map((tense) => (
                  <button
                    key={tense.id}
                    onClick={() => setSelectedTense(tense.id)}
                    className={`group relative px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      selectedTense === tense.id
                        ? tenseCategory === 'present'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md scale-105'
                          : tenseCategory === 'past'
                          ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-rose-100 shadow-md scale-105'
                          : 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className={`font-semibold text-xs ${
                      selectedTense === tense.id 
                        ? tenseCategory === 'present'
                          ? 'text-blue-700'
                          : tenseCategory === 'past'
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                        : 'text-gray-800'
                    }`}>
                      {language === 'es' ? tense.nameEs : tense.nameEn}
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedTense === tense.id 
                        ? tenseCategory === 'present'
                          ? 'text-blue-600'
                          : tenseCategory === 'past'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                        : 'text-gray-500'
                    }`}>
                      {tense.example}
                    </div>
                    
                    {/* Descripción de uso */}
                    <div className={`text-xs mt-1 font-medium italic ${
                      selectedTense === tense.id 
                        ? tenseCategory === 'present'
                          ? 'text-blue-500'
                          : tenseCategory === 'past'
                          ? 'text-rose-500'
                          : 'text-emerald-500'
                        : 'text-gray-400'
                    }`}>
                      {language === 'es' ? tense.descEs : tense.descEn}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          </div>

          {/* SECCIÓN 3: Generar Oración */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-2xl shadow-lg">
            <div className="bg-white rounded-xl p-6">
              <button
                onClick={generateSentence}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base font-semibold"
              >
                <RefreshCw className="w-5 h-5" />
                {t.generate}
              </button>
            </div>
          </div>

        </div>
        )}

        {/* Generated Sentence */}
        {generatedSentence && (
          <div className="space-y-4">
            {/* Título de sección para resultado */}
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                {language === 'es' ? 'Tu Oración Generada' : 'Your Generated Sentence'}
              </h2>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-2xl shadow-2xl">
              <div className="bg-white rounded-xl p-8">
                <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t.generatedSentence}
                </h2>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
                  {generatedSentence}
                </p>
                
                <div className="flex items-center gap-4 flex-wrap">
                  {/* FASE 1: Botón copiar */}
                  <button
                    onClick={() => copyToClipboard(generatedSentence)}
                    className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        {t.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        {t.copyToClipboard}
                      </>
                    )}
                  </button>

                  {!isSpeaking ? (
                    <button
                      onClick={speakSentence}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <Volume2 className="w-5 h-5" />
                      {t.listen}
                    </button>
                  ) : (
                    <button
                      onClick={stopSpeaking}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 font-semibold shadow-lg animate-pulse"
                    >
                      <VolumeX className="w-5 h-5" />
                      {t.stop}
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">{t.speed}:</span>
                    <select
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-indigo-400 focus:outline-none"
                    >
                      <option value="0.7">0.7x ({t.slow})</option>
                      <option value="0.9">0.9x ({t.normal})</option>
                      <option value="1.0">1.0x</option>
                      <option value="1.2">1.2x ({t.fast})</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Semantic Warning */}
            {semanticWarning && (
              <div className={`p-5 rounded-xl border-2 ${
                semanticWarning.type === 'warning' 
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300' 
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
              }`}>
                <div className="flex items-start gap-4">
                  {semanticWarning.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-bold mb-2 ${
                      semanticWarning.type === 'warning' ? 'text-amber-900' : 'text-emerald-900'
                    }`}>
                      {semanticWarning.type === 'warning' ? t.semanticWarning : t.semanticSuccess}
                    </h3>
                    {semanticWarning.type === 'warning' && (
                      <div className="flex gap-3 flex-wrap mt-4">
                        <button
                          onClick={applyTimeMarkerFix}
                          className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-md hover:shadow-lg"
                        >
                          {t.fixTimeMarker}
                        </button>
                        {semanticWarning.suggestedTense && (
                          <button
                            onClick={applyTenseFix}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                          >
                            {t.changeTense} {semanticWarning.suggestedTense}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnglishSentenceBuilder;
