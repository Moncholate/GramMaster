import { commonVerbs, irregularVerbs } from './verbs';
import { englishDictionary } from './dictionary';
import { PHRASAL_VERB_LIST } from './phrasal.generated.js';

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

/* Nombres de pila ingleses. La lista de nombres solo tenía hispanos, así que
   «peter» o «john» escritos en minúscula se quedaban así: smartCase devuelve
   tal cual lo que no reconoce. En el modo normal no se notaba porque el sujeto
   abre la oración y se capitaliza igual; en una condicional va detrás de «If »
   y el fallo queda a la vista.
   NO se puede usar «desconocido = nombre propio»: el diccionario de comunes no
   tiene people, rain, exam, bus… y los capitalizaría a todos.
   EXCLUIDOS a propósito los que chocan con palabra común o modal: will, mark,
   rose, grace, may, june, bill, jack, pat, sue, art, dawn, faith, hope, ray.
   Verificado: cero colisiones con englishDictionary, pronombres, determinantes
   ni verbos irregulares. */
export const englishNames = [
  "peter", "john", "james", "robert", "michael", "william", "david", "richard", "thomas", "charles",
  "daniel", "matthew", "anthony", "george", "kevin", "brian", "edward", "ronald", "timothy", "jason",
  "jeffrey", "ryan", "jacob", "nicholas", "eric", "stephen", "jonathan", "justin", "scott", "brandon",
  "benjamin", "samuel", "gregory", "alexander", "patrick", "dennis", "jerry", "tyler", "aaron", "henry",
  "douglas", "adam", "nathan", "zachary", "walter", "kyle", "harold", "jeremy", "keith", "roger",
  "gerald", "ethan", "arthur", "terry", "christian", "andrew", "joshua", "kenneth", "paul", "steven",
  "joseph", "oliver", "lucas", "noah", "liam", "mason", "logan", "mary", "patricia", "jennifer",
  "linda", "elizabeth", "barbara", "susan", "jessica", "sarah", "karen", "nancy", "lisa", "betty",
  "margaret", "sandra", "ashley", "dorothy", "kimberly", "emily", "donna", "michelle", "carol", "amanda",
  "melissa", "deborah", "stephanie", "rebecca", "laura", "sharon", "cynthia", "kathleen", "amy", "angela",
  "shirley", "anna", "brenda", "pamela", "nicole", "ruth", "katherine", "samantha", "christine", "catherine",
  "virginia", "debra", "rachel", "janet", "emma", "carolyn", "heather", "diane", "julie", "joyce",
  "evelyn", "joan", "christina", "kelly", "martha", "lauren", "frances", "alice", "judy", "megan",
  "cheryl", "andrea", "hannah", "jacqueline", "gloria", "teresa", "sara", "janice", "marie", "julia",
  "olivia", "sophia", "isabella", "charlotte", "amelia", "harper", "lucy", "chloe",
];

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
/* ── El campo Verbo con más de una palabra ───────────────────────────────────
   Antes todas caían en el mismo mensaje —«no está en nuestra lista de verbos»—,
   que es cierto y no sirve: no dice QUÉ arreglar. Y peor: metía en el mismo saco
   tres cosas distintas, una de ellas correcta.

     get up          phrasal verb. NO es un error: está en el vocabulario del
                     curso y la app lo enseña. Se acepta.
     study english   verbo + complemento. La segunda palabra tiene casilla
                     propia, así que se ofrece moverla.
     work study      dos verbos. Una oración lleva uno.

   La distinción sale de datos que ya existen (la lista de frasales del Hub y la
   de verbos), no de una lista nueva escrita a mano.

   Por qué importa hacerlo bien: un aviso de «solo un verbo por campo» a secas le
   diría al alumno que «get up» está mal, que es falso. La app afirmando algo
   falso es peor que la app callada. */
const esFrasal = (palabras) =>
  PHRASAL_VERB_LIST.some(p => p.length === palabras.length && p.every((w, i) => w === palabras[i]));

export const analizarVerboMultiple = (lowerVerb) => {
  const palabras = lowerVerb.split(/\s+/).filter(Boolean);
  if (palabras.length < 2) return null;

  if (esFrasal(palabras)) return { tipo: 'frasal' };

  const [cabeza, ...resto] = palabras;
  if (!allValidVerbs.includes(cabeza)) return null;   // la cabeza no es verbo: el flujo normal lo dirá

  /* `to` NO cuenta como segundo verbo: «want to eat» es una perífrasis, no dos
     verbos sueltos, y decirle a quien la escribe que sobra un verbo sería
     confundirlo. Se trata como complemento, que es donde de verdad va. */
  const segundo = resto[0] === 'to' ? resto[1] : resto[0];
  if (segundo && allValidVerbs.includes(segundo) && resto[0] !== 'to')
    return { tipo: 'dosVerbos', cabeza, sobra: resto.join(' ') };

  return { tipo: 'conComplemento', cabeza, sobra: resto.join(' ') };
};

export const validateVerb = (verb, language = 'es') => {
  if (!verb || verb.trim() === '') {
    return { valid: false, warning: null };
  }

  const lowerVerb = verb.toLowerCase().trim();

  // Verificar si es un verbo conocido
  if (allValidVerbs.includes(lowerVerb)) {
    return { valid: true, warning: null };
  }

  const multiple = analizarVerboMultiple(lowerVerb);
  if (multiple) {
    const es = language === 'es';
    if (multiple.tipo === 'frasal') return { valid: true, warning: null };
    if (multiple.tipo === 'dosVerbos') {
      return {
        valid: false,
        arreglo: multiple.cabeza,
        warning: es
          ? `Una oración lleva un solo verbo, y aquí hay dos: «${multiple.cabeza}» y «${multiple.sobra}»`
          : `A sentence takes one verb, and there are two here: "${multiple.cabeza}" and "${multiple.sobra}"`,
      };
    }
    // conComplemento
    return {
      valid: false,
      arreglo: multiple.cabeza,
      alComplemento: multiple.sobra,
      warning: es
        ? `«${multiple.sobra}» va en el complemento, no en el verbo`
        : `"${multiple.sobra}" belongs in the complement, not in the verb`,
    };
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
/* VERBOS QUE PIDEN PREPOSICIÓN. Salió en clase (2026-08-11): el profesor armó
   una oración con `go` y un lugar, y la app la construyó sin avisar de que
   faltaba el `to`. El validador del complemento solo miraba que las palabras
   existieran, y ni siquiera recibía el verbo.

   La tabla es CORTA a propósito, y varios candidatos obvios están fuera porque
   la versión sin preposición también es correcta y el aviso sería falso:
     `walk the dog`, `drive the car`, `fly a plane`, `move the table`,
     `return the book`, `pay the bill`, `ask the teacher`, `travel the world`.
   `look` queda fuera por lo mismo: «you look the same» es correcto, y es
   frecuente. Se pierde el aviso de «look at», que es una pena, pero un aviso
   que se equivoca en clase vale menos que ninguno. */
export const PREPOSICION_DEL_VERBO = {
  go: 'to', come: 'to', listen: 'to', belong: 'to',
  arrive: 'at', wait: 'for', depend: 'on',
};

/* El disparo es el DETERMINANTE, no el lugar. «go the park» está mal siempre;
   «go home», «go there», «go swimming» y «go by bus» no empiezan por
   determinante y por eso ni se miran.
   `a`, `an`, `this` y `that` NO están en la lista aunque sean determinantes:
   «wait a minute» y «come this way» son correctos y darían aviso falso. */
const DETERMINANTES_DE_OBJETO = ['the', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];

/* Lo que SÍ puede ir pegado a un verbo de movimiento sin preposición. Es la
   lista de excepciones de verdad, y por eso el aviso no las mira. */
const SEGUROS_TRAS_MOVIMIENTO = [
  'home', 'there', 'here', 'back', 'away', 'abroad', 'downtown', 'downstairs',
  'upstairs', 'inside', 'outside', 'somewhere', 'anywhere', 'everywhere', 'nowhere',
  'north', 'south', 'east', 'west', 'left', 'right', 'straight', 'ahead',
  'together', 'alone', 'first', 'again', 'anyway', 'too',
  'today', 'tomorrow', 'yesterday', 'tonight', 'now', 'later', 'early', 'late', 'soon',
  'dutch',   // «go Dutch» es una expresión hecha, no un lugar
];

/* Lugares que llevan `to` PELADO, sin artículo: «go to school», «go to work»,
   «go to bed». Escritos solos («go school») les falta la preposición igual que
   a «go the park», pero sin determinante delante nadie los veía.
   Solo para verbos de MOVIMIENTO: «wait for school» no es lo que nadie quiere
   decir, y sería un aviso peor que el silencio.
   Los que además piden artículo («go to THE park») quedan fuera a propósito:
   el arreglo sería «to park» y estaría mal, y sugerir mal es peor que callar. */
const MOVIMIENTO = ['go', 'come', 'arrive'];
const LUGARES_SIN_ARTICULO = ['school', 'work', 'university', 'college', 'class',
                              'bed', 'church', 'town', 'prison', 'hospital', 'sea'];

/* Un nombre propio detrás de un verbo de movimiento SIEMPRE pide preposición:
   «go Duoc», «go Santiago», «go Chile». Se detecta por la mayúscula, y aquí eso
   es fiable porque el campo de complemento lleva `autoCapitalize="none"`: el
   teclado del móvil no la pone, así que una mayúscula ahí es intención.
   Se descartan las palabras comunes escritas con mayúscula y los gerundios
   («Go Swimming»), que no son lugares. */
const pareceNombrePropio = (cruda) => {
  const baja = cruda.toLowerCase();
  return /^[A-ZÁÉÍÓÚÑÜ]/.test(cruda)
    && !SEGUROS_TRAS_MOVIMIENTO.includes(baja)
    && !/ing$/.test(baja)
    && !englishDictionary.includes(baja);
};

export const faltaPreposicion = (verb, complement) => {
  const v = String(verb || '').toLowerCase().trim();
  const prep = PREPOSICION_DEL_VERBO[v];
  if (!prep) return null;
  const cruda = String(complement || '').trim().split(/\s+/)[0] || '';
  const primera = cruda.toLowerCase();
  if (DETERMINANTES_DE_OBJETO.includes(primera)) return prep;
  if (MOVIMIENTO.includes(v)) {
    if (LUGARES_SIN_ARTICULO.includes(primera)) return prep;
    if (pareceNombrePropio(cruda)) return prep;
  }
  return null;
};

export const validateComplement = (complement, language = 'es', verb = '') => {
  if (!complement || complement.trim() === '') {
    return { valid: true, warning: null }; // Complemento es opcional
  }

  /* Va antes que la revisión de ortografía: si falta la preposición, eso es lo
     que hay que decir, no que «park» no esté en el diccionario. */
  const prep = faltaPreposicion(verb, complement);
  if (prep) {
    const v = verb.toLowerCase().trim();
    const ejemplo = `${v} ${prep} ${complement.trim()}`;
    return {
      valid: true,                       // es un aviso, no un bloqueo
      warning: language === 'es'
        ? `«${v}» pide «${prep}» antes del complemento: ${ejemplo}`
        : `"${v}" needs "${prep}" before the complement: ${ejemplo}`,
      arreglo: `${prep} ${complement.trim()}`,
    };
  }

  /* DESPUÉS DE `be`, UN VERBO EN FORMA BASE NO PUEDE SER EL COMPLEMENTO.
     Detrás de is/are/was/were va un adjetivo («He is tall»), un sintagma nominal
     («He is a teacher»), un -ing («He is working») o un participio. Lo que no
     cabe es un infinitivo pelado: «He is talk» no es una oración.

     Visto en clase: una alumna quiso «He is tall», escribió «talk» y la app le
     generó «He is talk.» sin decir nada. El corrector ortográfico no puede
     ayudar ahí, y hace bien en callarse — «talk» es una palabra correcta y bien
     escrita. Lo que falla no es la palabra, es que no encaja en ese hueco, y eso
     solo se ve con el verbo delante. Por eso va aquí y no en spelling.js.

     Es la misma regla que el analizador de Desgramatizador ya aplica al leer
     («be no admite infinitivo pelado»), traída al lado que ESCRIBE.

     Solo una palabra: «He is talk to Maria» es otro error distinto y decirle que
     use un adjetivo lo despistaría. Y solo si esa palabra no es también otra
     cosa —«work» y «study» son verbo y sustantivo, así que «He is work» podría
     ser un intento legítimo de «He is work[ing]» o de un sustantivo— por eso se
     exige que NO esté en el diccionario general como sustantivo. */
  const verbLimpio = String(verb || '').toLowerCase().trim();
  const compLimpio = complement.toLowerCase().trim();
  if (verbLimpio === 'be' && /^[a-z]+$/.test(compLimpio) && allValidVerbs.includes(compLimpio)) {
    return {
      valid: false,
      /* El ejemplo de -ing es FIJO. Construirlo con la palabra del alumno
         (`${compLimpio}ing`) parecía más útil y salía mal en cuanto el verbo
         dobla consonante o pierde la -e: «runing», «swiming», «writeing». La
         forma buena la sabe `presentParticiple` de conjugation.js, pero ese
         módulo importa este, así que traerlo aquí cerraría un ciclo. Antes que
         enseñar una forma mal escrita en una app de gramática, se enseña una
         bien escrita que no es la suya. */
      warning: language === 'es'
        ? `Después de «be» no va un verbo en forma base: «${compLimpio}» es un verbo. Ahí va un adjetivo («tall»), un sustantivo («a teacher») o un verbo en -ing («talking»).`
        : `A base verb can't follow "be": "${compLimpio}" is a verb. That slot takes an adjective ("tall"), a noun ("a teacher") or an -ing form ("talking").`,
    };
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
