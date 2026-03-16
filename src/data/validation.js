import { commonVerbs, irregularVerbs } from './verbs';
import { englishDictionary } from './dictionary';

// Pronombres personales válidos como sujeto
export const validPronouns = [
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'someone', 'somebody', 'anyone', 'anybody', 'everyone', 'everybody',
  'no one', 'nobody', 'something', 'anything', 'everything', 'nothing'
];

// Sustantivos comunes que pueden ser sujetos
export const validSubjectNouns = [
  // Personas
  'man', 'woman', 'boy', 'girl', 'child', 'children', 'baby', 'person', 'people',
  'student', 'teacher', 'doctor', 'nurse', 'engineer', 'lawyer', 'artist', 'scientist',
  'worker', 'manager', 'boss', 'employee', 'customer', 'client', 'patient',
  'friend', 'neighbor', 'stranger', 'visitor', 'guest', 'host',
  // Familia
  'mother', 'father', 'mom', 'dad', 'parent', 'parents', 'brother', 'sister',
  'son', 'daughter', 'grandfather', 'grandmother', 'grandma', 'grandpa',
  'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'husband', 'wife', 'family',
  // Animales
  'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'chicken',
  'lion', 'tiger', 'bear', 'elephant', 'monkey', 'rabbit', 'mouse', 'rat',
  'snake', 'frog', 'spider', 'ant', 'bee', 'butterfly', 'animal', 'pet',
  // Cosas que pueden hacer acciones
  'car', 'bus', 'train', 'plane', 'boat', 'ship', 'bike', 'bicycle',
  'machine', 'computer', 'robot', 'phone', 'clock', 'alarm',
  'company', 'team', 'group', 'class', 'school', 'government', 'organization',
  'sun', 'moon', 'star', 'wind', 'rain', 'storm', 'fire', 'water',
  // Nombres en inglés
  'john', 'mary', 'james', 'sarah', 'michael', 'emma', 'david', 'lisa',
  'peter', 'anna', 'mark', 'julia', 'tom', 'kate', 'paul', 'laura'
];

// Nombres hispanos comunes (para usuarios de Sudamérica)
export const hispanicNames = [
  // Nombres masculinos
  'juan', 'jose', 'josé', 'carlos', 'luis', 'miguel', 'pedro', 'pablo', 'diego',
  'andres', 'andrés', 'jorge', 'ricardo', 'fernando', 'alejandro', 'gabriel',
  'daniel', 'mario', 'sergio', 'roberto', 'eduardo', 'francisco', 'javier',
  'antonio', 'manuel', 'rafael', 'raul', 'raúl', 'victor', 'víctor', 'oscar', 'óscar',
  'hector', 'héctor', 'arturo', 'adrian', 'adrián', 'alberto', 'alfredo', 'alvaro', 'álvaro',
  'armando', 'benito', 'bernardo', 'camilo', 'cesar', 'césar', 'claudio', 'cristian',
  'cristobal', 'cristóbal', 'dario', 'darío', 'domingo', 'emilio', 'enrique', 'ernesto',
  'esteban', 'fabian', 'fabián', 'federico', 'felipe', 'gerardo', 'gonzalo', 'guillermo',
  'gustavo', 'hernan', 'hernán', 'hugo', 'ignacio', 'ivan', 'iván', 'jaime', 'jesus', 'jesús',
  'joaquin', 'joaquín', 'leonardo', 'lucas', 'marcos', 'martin', 'martín', 'mateo', 'matias', 'matías',
  'mauricio', 'maximo', 'máximo', 'nicolas', 'nicolás', 'orlando', 'patricio', 'ramon', 'ramón',
  'rodrigo', 'ruben', 'rubén', 'santiago', 'sebastian', 'sebastián', 'tomas', 'tomás', 'valentin', 'valentín',
  // Nombres femeninos
  'maria', 'maría', 'ana', 'carmen', 'rosa', 'lucia', 'lucía', 'laura', 'andrea',
  'paula', 'carolina', 'daniela', 'gabriela', 'valentina', 'camila', 'sofia', 'sofía',
  'isabella', 'mariana', 'fernanda', 'alejandra', 'patricia', 'claudia', 'monica', 'mónica',
  'veronica', 'verónica', 'adriana', 'diana', 'elena', 'silvia', 'teresa', 'julia',
  'marta', 'cecilia', 'lorena', 'beatriz', 'alicia', 'angela', 'ángela', 'antonia',
  'barbara', 'bárbara', 'belen', 'belén', 'blanca', 'catalina', 'clara', 'constanza',
  'cristina', 'emilia', 'esperanza', 'estefania', 'estefanía', 'eugenia', 'eva', 'florencia',
  'francisca', 'gloria', 'graciela', 'guadalupe', 'ines', 'inés', 'irene', 'isabel',
  'josefina', 'juana', 'karla', 'leticia', 'lilia', 'liliana', 'lourdes', 'luisa',
  'magdalena', 'marcela', 'margarita', 'marisol', 'mercedes', 'micaela', 'natalia', 'nora',
  'norma', 'olivia', 'pamela', 'pilar', 'raquel', 'rebeca', 'regina', 'renata', 'rocio', 'rocío',
  'sandra', 'sara', 'susana', 'tamara', 'vanesa', 'vanessa', 'victoria', 'virginia', 'ximena', 'yolanda',
  // Apellidos comunes (también pueden usarse)
  'garcia', 'garcía', 'rodriguez', 'rodríguez', 'martinez', 'martínez', 'lopez', 'lópez',
  'gonzalez', 'gonzález', 'hernandez', 'hernández', 'perez', 'pérez', 'sanchez', 'sánchez',
  'ramirez', 'ramírez', 'torres', 'flores', 'rivera', 'gomez', 'gómez', 'diaz', 'díaz',
  'reyes', 'morales', 'jimenez', 'jiménez', 'ruiz', 'alvarez', 'álvarez', 'romero', 'mendoza',
  'vargas', 'castro', 'ortiz', 'rubio', 'molina', 'delgado', 'ortega', 'silva', 'moreno', 'muñoz'
];

// Artículos y determinantes que pueden preceder sustantivos
export const validDeterminers = [
  'the', 'a', 'an', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'some', 'any', 'no', 'every', 'each',
  'many', 'much', 'few', 'little', 'several', 'all', 'both', 'most'
];

// Todos los verbos válidos (comunes + irregulares)
export const allValidVerbs = [
  ...commonVerbs,
  ...Object.keys(irregularVerbs)
];

// Función para verificar si parece una palabra válida (inglés o nombre propio)
export const looksLikeValidWord = (word) => {
  if (!word || word.length === 0) return false;

  const lowerWord = word.toLowerCase();

  // Normalizar acentos para comparación
  const normalizedWord = lowerWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Primero verificar si es un nombre hispano conocido
  if (hispanicNames.includes(lowerWord) || hispanicNames.includes(normalizedWord)) {
    return true;
  }

  // Verificar patrones claramente inválidos (secuencias sin sentido)
  const clearlyInvalidPatterns = [
    /^[bcdfghjklmnpqrstvwxz]{5,}/i,  // 5+ consonantes al inicio
    /[bcdfghjklmnpqrstvwxz]{6,}/i,   // 6+ consonantes seguidas
    /^[aeiouáéíóú]{5,}/i,            // 5+ vocales al inicio
    /[aeiouáéíóú]{5,}/i,             // 5+ vocales seguidas
    /(.)\1{3,}/i,                     // misma letra 4+ veces seguidas
  ];

  for (const pattern of clearlyInvalidPatterns) {
    if (pattern.test(lowerWord)) {
      return false;
    }
  }

  // Debe tener al menos una vocal (incluyendo vocales con tilde)
  if (lowerWord.length > 2 && !/[aeiouyáéíóú]/i.test(lowerWord)) {
    return false;
  }

  // Si llegamos aquí, la palabra tiene una estructura razonable
  return true;
};

// Alias para compatibilidad
export const looksLikeEnglishWord = looksLikeValidWord;

// Función auxiliar para normalizar texto (quitar acentos)
const normalizeText = (text) => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Verificar si es un nombre propio (hispano o inglés)
const isKnownName = (word) => {
  const lower = word.toLowerCase();
  const normalized = normalizeText(word);
  return hispanicNames.includes(lower) ||
         hispanicNames.includes(normalized) ||
         validSubjectNouns.includes(lower);
};

// Validar sujeto
export const validateSubject = (subject, language = 'es') => {
  if (!subject || subject.trim() === '') {
    return { valid: false, warning: null };
  }

  const trimmedSubject = subject.trim();
  const words = trimmedSubject.toLowerCase().split(/\s+/);
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  const normalizedFirstWord = normalizeText(firstWord);

  // Caso 1: Es un pronombre válido
  if (words.length === 1 && validPronouns.includes(firstWord)) {
    return { valid: true, warning: null };
  }

  // Caso 2: Es un nombre hispano conocido
  if (words.length === 1 && isKnownName(firstWord)) {
    return { valid: true, warning: null, isProperNoun: true };
  }

  // Caso 3: Empieza con mayúscula (posible nombre propio)
  if (/^[A-ZÁÉÍÓÚÑ]/i.test(trimmedSubject)) {
    // Si parece un nombre válido (estructura razonable), aceptarlo
    if (looksLikeValidWord(firstWord)) {
      return { valid: true, warning: null, isProperNoun: true };
    }
  }

  // Caso 4: Determinante + sustantivo (ej: "the dog", "my friend")
  if (words.length >= 2 && validDeterminers.includes(firstWord)) {
    const noun = lastWord;
    if (validSubjectNouns.includes(noun) || englishDictionary.includes(noun) || isKnownName(noun)) {
      return { valid: true, warning: null };
    }
    // El determinante es válido pero el sustantivo no se reconoce
    if (!looksLikeValidWord(noun)) {
      return {
        valid: false,
        warning: language === 'es'
          ? `"${noun}" no parece ser una palabra válida`
          : `"${noun}" doesn't appear to be a valid word`
      };
    }
    // Palabra desconocida pero con estructura válida - no mostrar warning
    return { valid: true, warning: null };
  }

  // Caso 5: Sustantivo solo
  if (words.length === 1) {
    if (validSubjectNouns.includes(firstWord) || englishDictionary.includes(firstWord)) {
      return { valid: true, warning: null };
    }
    if (!looksLikeValidWord(firstWord)) {
      return {
        valid: false,
        warning: language === 'es'
          ? `"${subject}" no parece ser una palabra válida`
          : `"${subject}" doesn't appear to be a valid word`
      };
    }
    // Es una palabra con estructura válida, probablemente nombre propio
    return { valid: true, warning: null };
  }

  // Caso 6: Sujeto compuesto (X and Y)
  if (subject.toLowerCase().includes(' and ')) {
    const parts = subject.split(/ and /i);
    for (const part of parts) {
      const partValidation = validateSubject(part.trim(), language);
      if (!partValidation.valid) {
        return partValidation;
      }
    }
    return { valid: true, warning: null };
  }

  // Verificación general: ¿Parecen palabras válidas?
  for (const word of words) {
    if (!looksLikeValidWord(word) && !validDeterminers.includes(word)) {
      return {
        valid: false,
        warning: language === 'es'
          ? `"${word}" no parece ser una palabra válida`
          : `"${word}" doesn't appear to be a valid word`
      };
    }
  }

  return { valid: true, warning: null };
};

// Validar verbo
export const validateVerb = (verb, language = 'es') => {
  if (!verb || verb.trim() === '') {
    return { valid: false, warning: null };
  }

  const lowerVerb = verb.toLowerCase().trim();

  // Verificar si es un verbo conocido
  if (allValidVerbs.includes(lowerVerb)) {
    return { valid: true, warning: null };
  }

  // Verificar si parece una palabra válida
  if (!looksLikeEnglishWord(lowerVerb)) {
    return {
      valid: false,
      warning: language === 'es'
        ? `"${verb}" no parece ser un verbo válido en inglés`
        : `"${verb}" doesn't appear to be a valid English verb`
    };
  }

  // Está en el diccionario general pero no en verbos
  if (englishDictionary.includes(lowerVerb)) {
    return {
      valid: true,
      warning: language === 'es'
        ? `"${verb}" puede no ser un verbo`
        : `"${verb}" may not be a verb`
    };
  }

  // No está en ninguna lista
  return {
    valid: false,
    warning: language === 'es'
      ? `"${verb}" no está en nuestra lista de verbos. Verifica que sea correcto.`
      : `"${verb}" is not in our verb list. Please verify it's correct.`
  };
};

// Validar complemento (más permisivo)
export const validateComplement = (complement, language = 'es') => {
  if (!complement || complement.trim() === '') {
    return { valid: true, warning: null }; // Complemento es opcional
  }

  const words = complement.toLowerCase().trim().split(/\s+/);

  // Verificar cada palabra
  const invalidWords = [];
  for (const word of words) {
    // Ignorar números y palabras muy cortas
    if (/^\d+$/.test(word) || word.length <= 2) continue;

    // Ignorar puntuación
    const cleanWord = word.replace(/[.,!?;:'"()-]/g, '');
    if (!cleanWord) continue;

    // Solo marcar como inválido si realmente no parece una palabra válida
    if (!looksLikeValidWord(cleanWord) &&
        !englishDictionary.includes(cleanWord) &&
        !validDeterminers.includes(cleanWord) &&
        !isKnownName(cleanWord)) {
      invalidWords.push(cleanWord);
    }
  }

  if (invalidWords.length > 0) {
    return {
      valid: false,
      warning: language === 'es'
        ? `Palabras no reconocidas: ${invalidWords.join(', ')}`
        : `Unrecognized words: ${invalidWords.join(', ')}`
    };
  }

  return { valid: true, warning: null };
};
