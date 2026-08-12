import { NIVELES, delCurriculo } from './curriculum.generated';

/* Modos de oración.
   Antes cada uno traía su propio tono (emerald / rose / amber) y los dos ejes
   quedaban CRUZADOS: la negativa era rose, que es el color del rol `auxiliary`
   — o sea, el mismo tono que el «doesn't» que la construye — y la interrogativa
   era amber, que es el del rol `adverb`, al que pertenece el «not» que marca la
   negativa. La forma es propiedad de la ORACIÓN ENTERA, no de una pieza, así
   que ya no toma tono de la rampa de roles: el color va solo en el SIGNO
   (+ − ?), que sale de design-tokens, y el estado activo se marca con la
   cápsula neutra. Ver `forms` en tokens.json. */
export const modes = [
  {
    id: 'affirmative',
  },
  {
    id: 'negative',
  },
  {
    id: 'interrogative',
  },
  /* La pregunta de sujeto SALIÓ de aquí (AEF Intermedio II 12C, «questions
     without auxiliaries»). Con los dos ejes es forma `?` + tipo abierta —una
     pregunta abierta sin auxiliar—, no una cuarta forma hermana de las otras
     tres, y figurar en esta lista la hacía parecer un cuarto valor de una
     variable que solo tiene tres. Ahora vive junto a la wh-word, que es de lo
     que habla, y el curso que la gatea se comprueba ahí.
     Su vocabulario en el motor (`subject-question`) NO cambió. */
];

/* EL CURRÍCULO YA NO VIVE AQUÍ. Nivel y unidad de cada contenido salen de
   `Grammar HUB/curriculum.json` vía `npm run sync-curriculum`, que escribe
   `curriculum.generated.js` para esta app y `cefr.generated.js` para Question
   Lab. Las unidades a su vez salen de `syllabus-aef.md`, que es el temario real.

   Por qué generado y no copiado: el nivel de cada contenido estaba escrito a
   mano en Grammaster Y en Question Lab, y `would` se quedó un curso y medio
   tarde en las DOS, porque corregirlo en una no corrige la otra. Con un solo
   archivo, arreglar el temario arregla las tres apps a la vez.

   Sin unidad, la práctica pregunta por contenido del curso que el alumno aún no
   ha visto — y como la racha y las insignias castigan el fallo, lo penaliza por
   no saber algo que nadie le ha enseñado. */
export { UNIDADES_POR_CURSO } from './curriculum.generated';

/* Orden DENTRO del curso. Comparar como texto no sirve: «10A» < «9B» carácter a
   carácter. Sin unidad (`null`) devuelve -1 = disponible desde el principio, que
   es lo correcto para lo que se enseña en Practical English y no figura en la
   columna de gramática del temario (ver la Trampa 2 de la memoria del syllabus). */
export const unidadIndice = (u) => {
  const m = /^(\d+)([A-Z])$/.exec(String(u || ''));
  return m ? Number(m[1]) * 10 + (m[2].charCodeAt(0) - 65) : -1;
};

/* ¿La clase ya vio este contenido? Curso anterior = visto entero; curso actual =
   hasta la unidad donde va la clase, contando la etapa temprana de `be`.

   VIVE AQUÍ Y NO EN App.jsx A PROPÓSITO. Estaba escrita dentro del componente y
   el MODO REPASO se hizo su propia versión, más floja: comparaba solo el curso
   y se saltaba la unidad. Resultado: la práctica normal respetaba el temario y
   el repaso no, así que un alumno de Intermedio II en la semana 1 podía recibir
   Pasado Perfecto —la 12A— en la única actividad que además puntúa y alimenta
   la racha. Dos filtros para la misma pregunta es la forma segura de que uno de
   los dos se quede atrás; ahora hay uno, es puro y se puede testear. */
export const estaVisto = (item, nivel, unidad) => {
  if (!item) return false;
  const i = COURSE_ORDER.indexOf(item.cefr);
  const actual = COURSE_ORDER.indexOf(nivel);
  if (i < 0 || actual < 0) return false;
  if (i < actual) return true;
  if (i > actual) return false;
  const tope = unidad ? unidadIndice(unidad) : Infinity;
  return unidadIndice(item.unidad) <= tope
      || (item.unidadBe != null && unidadIndice(item.unidadBe) <= tope);
};

/* POR ETAPAS. El libro no enseña un tiempo de golpe: primero `be` y bastante
   después el resto de los verbos.
     Presente simple → be en Básico I 1A-2B, los demás verbos en 5A,
                       las preguntas en 5B y he/she/it en 6A
     Pasado simple   → was/were en Básico II 10B, los regulares en 11A,
                       los irregulares en 11B
   La app tenía UN ítem para todo eso, así que un alumno de Básico I en la
   unidad 2 aparecía como que no había visto nada — cuando lleva tres clases con
   el verbo `be`. `unidadBe` es la etapa temprana; entre esa unidad y `unidad`
   el tiempo se practica SOLO con `be`, que es exactamente lo que sabe.

   `unidadBe` del presente simple es la 2B y no la 1A, aunque el `be` empiece en
   la 1A: el libro lo reparte por personas (1A yo/tú, 1B he/she/it, 2A el plural)
   y las preguntas Wh- llegan en la 2B. Decisión del docente (2026-08-08): son
   cuatro clases seguidas y el desfase dura poco, así que se abre cuando el `be`
   está COMPLETO en vez de llenar el modelo de campos por persona. La app no se
   usa todas las clases; se pierden tres y se gana no preguntar nunca de más.
   El corte que sí importa ahí es cerradas antes que abiertas, y para la 2B las
   dos existen — eso pesará al propagarlo a Question Lab, que es todo preguntas.

   `unidadInterrogativa` y `unidadTerceraPersona` son el mismo mecanismo aplicado
   a la FORMA y a la PERSONA en vez de al verbo: en la 5A el alumno arma (+) y
   (−) con I/you/we/they, nada más. Sin esto la práctica sorteaba la forma al
   azar entre las tres y podía pedirle «Does she work?», que son justo las dos
   cosas que aún no ha visto.
   Complementos que funcionan con `be`: «I am every day» no existe, así que la
   lista de siempre no sirve tal cual. */
export const COMPLEMENTOS_BE = ['at home', 'at school', 'in the park', 'with friends',
                                'happy', 'tired', 'ready', 'late', 'busy'];

/* COMPLEMENTOS. Para un verbo que se sostiene solo, cualquiera de estos vale.
   Para uno que exige objeto directo NO: «He created every day» es agramatical,
   no solo raro, y esa era la única razón por la que la práctica no podía usar
   medio diccionario. Cada verbo transitivo trae su objeto en `OBJETO_DE_VERBO`. */
export const COMPLEMENTOS_ADVERBIALES = ['every day', 'at school', 'at home',
  'in the park', 'with friends', 'in the morning', 'on weekends'];
/* Solo de TIEMPO, para lo que va DESPUÉS de un objeto. Los de lugar no sirven
   ahí: «visited the museum at home» se contradice. Y todos tienen que aguantar
   cualquier tiempo verbal, así que nada de «last night», que choca con el
   presente simple. */
export const COMPLEMENTOS_TIEMPO = ['every day', 'in the morning', 'on weekends',
                                    'after class'];

/* UN complemento canónico por verbo, no una lista por categorías. Con
   categorías salía «parked the tickets»: `park` no admite cualquier cosa,
   admite un vehículo. Elegido uno a uno, la variedad la ponen el sujeto, el
   tiempo, la forma y el adverbial que puede ir detrás.
   Casi todos son objetos directos; `live` está por el otro motivo: pide un
   LUGAR («She lived in the morning» es tan falso como «She created at home»).
   Que un verbo NO esté aquí significa que se sostiene con cualquier adverbial.
   No puede faltar ninguno por descuido: hay un test que recorre todos los pozos
   de la práctica y exige que cada verbo esté clasificado en un lado o en otro.
   Nada de posesivos: «She raised my hand» es gramatical pero dice otra cosa, y
   el sujeto lo sortea la app. */
export const COMPLEMENTO_DE_VERBO = {
  // Regulares del libro (pág. 133)
  answer: 'the question', ask: 'a question', book: 'the tickets', call: 'the doctor',
  carry: 'the bags', change: 'the plan', clean: 'the kitchen', close: 'the door',
  cook: 'dinner', finish: 'the book', hate: 'the food', help: 'the children',
  invite: 'the neighbors', like: 'the movie', live: 'in Santiago', love: 'the song',
  miss: 'the bus', need: 'a new phone', offer: 'the coffee', open: 'the window',
  pack: 'the bags', paint: 'the wall', park: 'the car', pass: 'the test',
  play: 'the guitar', rent: 'a car', start: 'the class', stop: 'the car',
  study: 'English', travel: 'to Europe', turn: 'the page', use: 'the computer',
  want: 'a new phone', wash: 'the dishes', watch: 'the game',
  // Regulares que se abren desde Intermedio
  accept: 'the offer', achieve: 'the goal', add: 'the numbers', advise: 'the students',
  allow: 'the change', approve: 'the plan', believe: 'the story', complete: 'the course',
  consider: 'the offer', create: 'a website', debate: 'the topic', defend: 'the project',
  demand: 'an answer', deny: 'the story', design: 'the poster', develop: 'the app',
  discover: 'the truth', discuss: 'the problem', enjoy: 'the concert', explain: 'the rules',
  explore: 'the city', follow: 'the instructions', include: 'the details',
  notice: 'the mistake', observe: 'the birds', order: 'a pizza', organize: 'the party',
  plan: 'the trip', practice: 'the piano', prefer: 'coffee', prepare: 'the presentation',
  promise: 'an answer', protect: 'the environment', raise: 'the money', reach: 'the top',
  realize: 'the mistake', receive: 'the message', recognize: 'the song',
  recommend: 'the restaurant', reject: 'the offer', remember: 'the address',
  request: 'a copy', save: 'the file', select: 'the winner', serve: 'the food',
  solve: 'the problem', suggest: 'a plan', taste: 'the soup', touch: 'the screen',
  visit: 'the museum', warn: 'the neighbors',
  // Irregulares
  beat: 'the champion', become: 'a teacher', begin: 'the lesson', bite: 'the apple',
  break: 'the window', bring: 'the tickets', build: 'a house', buy: 'a new phone',
  catch: 'the ball', choose: 'the blue one', come: 'to the party', cut: 'the bread',
  do: 'the homework', draw: 'a picture', drink: 'the coffee', drive: 'the car',
  eat: 'the cake', feel: 'the pain', find: 'the keys', fly: 'to Madrid',
  forget: 'the address', get: 'the message', go: 'to the beach', leave: 'the office',
  give: 'the answer', grow: 'vegetables', hang: 'the picture', have: 'a car',
  hear: 'the news', hit: 'the ball', hurt: 'the player', keep: 'the receipt',
  know: 'the answer', lend: 'the book', lose: 'the keys', make: 'a cake',
  meet: 'the team', pay: 'the bill', read: 'the news', ride: 'a bike',
  ring: 'the bell', say: 'goodbye', see: 'the movie', sell: 'the house', send: 'the message',
  shut: 'the door', sing: 'a song', speak: 'English', spend: 'the money',
  steal: 'the money', take: 'the bus', teach: 'English', tell: 'the truth',
  throw: 'the ball', understand: 'the question', wear: 'a jacket', win: 'the game',
  write: 'a letter',
};

/* La otra mitad: los que aceptan cualquiera de los adverbiales libres.
   Está escrita entera, en vez de deducirla por descarte, justamente para que
   olvidar un verbo sea un test en rojo y no una oración agramatical suelta. */
export const VERBOS_CON_ADVERBIAL_LIBRE = [
  // Regulares del libro (pág. 133)
  'arrive', 'cry', 'decide', 'learn', 'listen', 'look', 'move',
  'relax', 'stay', 'talk', 'wait', 'walk', 'work',
  // Regulares que se abren desde Intermedio
  'agree', 'appear', 'argue', 'continue', 'dance', 'disagree', 'exercise',
  'heal', 'improve', 'refuse', 'rest', 'return', 'search', 'shop', 'try',
  // Irregulares
  'fall', 'run', 'sit', 'sleep', 'stand', 'swim', 'think', 'wake',
];
/* `come`, `go`, `fly`, `travel` y `leave` NO están aquí aunque parezcan
   intransitivos: piden `to` delante del lugar. «She came at school» es falso, y
   salía una de cada tres veces. Llevan complemento fijo, y la regla de no
   encadenar dos frases preposicionales impide que se les pegue otra detrás. */

/* Verbos que la app NO puede armar, aunque el alumno los sepa. No es nivel, es
   estructura: la oración es «sujeto + verbo + complemento» y estos piden otra
   cosa. Los seis sujetos de la práctica son personas, y eso también pesa.
     put / set          → exigen además un lugar: «I put the book» está incompleto
     let                → objeto + infinitivo sin `to`: «let me go»
     cost               → pide un precio, y el sujeto es una persona
     mean               → su objeto natural es una cláusula, no un sustantivo
     shine, rain, snow  → su sujeto natural es el sol o el cielo, no «She»
   `rain` y `snow` estaban en el pozo desde el principio, porque vienen en la
   página 133 del libro: la práctica podía producir «She rained at school». Se
   vio leyendo las oraciones generadas, no midiendo nada.
   `check in` sale por lo mismo (la partícula), y `dream`/`smell`/`lie` NO están
   aquí: esos salen por tener dos formas válidas o dos significados. */
export const VERBOS_FUERA_DE_PRACTICA = ['cost', 'let', 'mean', 'put', 'rain',
                                         'set', 'shine', 'snow'];

/* Los verbos que el LIBRO lista, copiados de la página 133 de American English
   File («Regular and irregular verbs»), aportada por el profesor.
   Importa que salgan de ahí y no de una lista inventada: en Básico II el alumno
   maneja quince verbos, y preguntarle por uno que no ha visto es lo mismo que
   preguntarle por un tiempo que no ha visto.
   La práctica usaba `eat`, `read` y `run`, que NO están en ninguna de las dos
   listas — y las tres son irregulares, así que en la unidad de los regulares
   pedían una forma que el alumno no tenía por qué conocer. */
export const VERBOS_REGULARES = [
  'answer', 'arrive', 'ask', 'book', 'call', 'carry', 'change', 'clean', 'close',
  'cook', 'cry', 'decide', 'finish', 'hate', 'help', 'invite', 'learn', 'like',
  'listen', 'live', 'look', 'love', 'miss', 'move', 'need', 'offer', 'open',
  'pack', 'paint', 'park', 'pass', 'play', 'rain', 'relax', 'rent', 'snow',
  'start', 'stay', 'stop', 'study', 'talk', 'travel', 'turn', 'use', 'wait',
  'walk', 'want', 'wash', 'watch', 'work',
];
/* `check in` está en la página pero se queda fuera: es un phrasal verb y la
   partícula rompe el armado de la oración. No es una omisión, es una decisión. */

/* DESDE INTERMEDIO la lista de arriba queda corta: son verbos de Starter y a
   esa altura el alumno maneja cientos. Decisión del docente (2026-08-08): «se
   les puede preguntar cualquiera de los regulares existentes, si total ya saben
   la regla». Los irregulares siguen escalonados por curso porque ahí sí hay una
   forma que memorizar; en los regulares lo único que se practica es `-ed`.

   El límite nunca fue el vocabulario, era el ARMADO: mientras el complemento
   solo podía ser adverbial, un verbo que exige objeto salía agramatical («He
   created at school»). Con `OBJETO_DE_VERBO` eso deja de ser un límite y entran
   también los transitivos.
   Los que siguen fuera lo están por otra cosa:
     `smell` → «smelled (also smelt)», dos formas válidas y la práctica compara
       contra una. Igual que `dream`. Ver [[ambiguedad-lexica]].
     `kill`, `attack`, `die` → se sostienen perfectamente, pero es material de
       aula. Decisión de tono, no de gramática.
     `happen`, `increase`, `decrease`, `seem` → su sujeto natural no es una
       persona, y los seis sujetos de la práctica lo son.
     `hope` → su complemento es una cláusula («hoped that…»), no un sustantivo.

   Todos pasaron por el conjugador uno a uno, con las trampas de ortografía que
   tenían que salir bien: `agree` → agreeing (no «agreing»), `plan` → planned
   (dobla) y `visit` → visited (NO dobla). El test las fija. */
export const VERBOS_REGULARES_AMPLIA = [
  ...VERBOS_REGULARES,
  // Se sostienen sin objeto
  'agree', 'appear', 'argue', 'continue', 'dance', 'disagree', 'exercise',
  'heal', 'improve', 'refuse', 'rest', 'return', 'search', 'shop', 'try',
  // Transitivos, cada uno con su objeto en OBJETO_DE_VERBO
  'accept', 'achieve', 'add', 'advise', 'allow', 'approve', 'believe',
  'complete', 'consider', 'create', 'debate', 'defend', 'demand', 'deny',
  'design', 'develop', 'discover', 'discuss', 'enjoy', 'explain', 'explore',
  'follow', 'include', 'notice', 'observe', 'order', 'organize', 'plan',
  'practice', 'prefer', 'prepare', 'promise', 'protect', 'raise', 'reach',
  'realize', 'receive', 'recognize', 'recommend', 'reject', 'remember',
  'request', 'save', 'select', 'serve', 'solve', 'suggest', 'taste', 'touch',
  'visit', 'warn',
];

/* IRREGULARES POR CURSO. El libro los va soltando: en Básico son doce y en
   Elemental la tabla completa. Sin la distinción, un alumno de Básico II podía
   recibir «swam» o «understood», que aparecen dos cursos más arriba.
   En las dos listas falta `be` a propósito: tiene su propia etapa (`unidadBe`).
   `can` tampoco está: es modal y no lleva participio («can → could → —»).
   Las formas se cruzaron una a una contra el libro y coinciden todas; el test
   que lo comprueba está en curriculo.test.js y es lo que impide que se pudran. */
export const VERBOS_IRREGULARES_BASICO = [
  'buy', 'do', 'get', 'go', 'have', 'leave', 'say', 'see', 'send', 'sit', 'tell', 'write',
];
/* Página 165 (AEF 3). Suma once a la de Intermedio, menos tres que se quedan
   fuera y NO por olvido:
     `lie`   → dos verbos distintos escritos igual: «recostarse» (lay/lain, el
       que da el libro) y «mentir» (lied, regular). Preguntarlo enseñaría uno de
       los dos como si fuera el único. Ver la nota en verbs.js.
     `smell` → «smelled (also smelt)», dos formas válidas, y la práctica compara
       contra una sola. Mismo caso que `dream`.
     `dream` → ya estaba fuera por lo mismo. Curioso: AEF 2 prefiere «dreamt» y
       AEF 3 prefiere «dreamed». Ni los libros se ponen de acuerdo. */
export const VERBOS_IRREGULARES_AVANZADO = [
  'beat', 'become', 'begin', 'bite', 'break', 'bring', 'build', 'buy', 'catch',
  'choose', 'come', 'cost', 'cut', 'do', 'draw', 'drink', 'drive', 'eat', 'fall',
  'feel', 'find', 'fly', 'forget', 'get', 'give', 'go', 'grow', 'hang', 'have',
  'hear', 'hit', 'hurt', 'keep', 'know', 'leave', 'lend', 'let', 'lose', 'make',
  'mean', 'meet', 'pay', 'put', 'read', 'ride', 'ring', 'run', 'say', 'see',
  'sell', 'send', 'set', 'shine', 'shut', 'sing', 'sit', 'sleep', 'speak',
  'spend', 'stand', 'steal', 'swim', 'take', 'teach', 'tell', 'think', 'throw',
  'understand', 'wake', 'wear', 'win', 'write',
];

/* Página 164 (AEF 2). Suma catorce a la tabla de Elemental.
   Dos que el libro lista y aquí NO entran, y no es olvido:
     `learn` → el libro da «learned», que es la forma regular, y ya está en
       VERBOS_REGULARES. Meterlo aquí lo duplicaría.
     `dream` → el libro da «dreamt (also dreamed)». La app produce «dreamed» y
       las dos son correctas, pero la práctica compara contra UNA respuesta:
       marcaría mal a quien escriba la otra. Un verbo con dos formas válidas
       necesita un trato que este ejercicio no tiene. */
export const VERBOS_IRREGULARES_INTERMEDIO = [
  'become', 'begin', 'break', 'bring', 'build', 'buy', 'catch', 'choose', 'come',
  'cost', 'cut', 'do', 'drink', 'drive', 'eat', 'fall', 'feel', 'find', 'fly',
  'forget', 'get', 'give', 'go', 'grow', 'have', 'hear', 'hit', 'keep', 'know',
  'leave', 'lend', 'let', 'lose', 'make', 'meet', 'pay', 'put', 'read', 'ring',
  'run', 'say', 'see', 'sell', 'send', 'shut', 'sing', 'sit', 'sleep', 'speak',
  'spend', 'stand', 'steal', 'swim', 'take', 'teach', 'tell', 'think', 'throw',
  'understand', 'wake', 'wear', 'win', 'write',
];

/* Página 165 (AEF 1). Incluye `eat`, `read` y `run`, que en Básico NO estaban. */
export const VERBOS_IRREGULARES = [
  'become', 'begin', 'break', 'bring', 'build', 'buy', 'catch', 'come', 'cost',
  'do', 'drink', 'drive', 'eat', 'fall', 'feel', 'find', 'fly', 'forget',
  'get', 'give', 'go', 'have', 'hear', 'know', 'leave', 'lose', 'make',
  'meet', 'pay', 'put', 'read', 'run', 'say', 'see', 'send', 'sing',
  'sit', 'sleep', 'speak', 'spend', 'stand', 'swim', 'teach', 'take',
  'tell', 'think', 'understand', 'wake', 'wear', 'win', 'write',
];

/* Cuándo se ofrece cada condicional en el modo práctica. Sale del temario:
   la 1ª y la 2ª en Intermedio II (AEF Int. II 8B y 9A), la 3ª en Intermedio
   Alto (AEF 3 9A). Ver la memoria del syllabus antes de mover esto. */
export const CONDICIONALES_POR_CURSO = [1, 2, 3].map(tipo => ({
  tipo, ...delCurriculo(`conditional-${tipo}`),
}));

/* Pares condición/resultado para la práctica. Van EMPAREJADOS a mano y no
   combinados al azar porque una condicional tiene que tener sentido: «If it
   rains, I will stay at home» enseña; «If it rains, I will eat at school» es
   ruido que distrae de la forma, que es lo que se practica.
   Todos funcionan en los tres tipos, que es lo que permite sortear el tipo sin
   tocar el par. `be` aparece a propósito: es el que dispara el `were` del
   subjuntivo en la 2ª. */
export const PARES_CONDICIONAL = [
  { cond: { subject: 'it',   verb: 'rain',  complement: '' },
    res:  { subject: 'I',    verb: 'stay',  complement: 'at home' } },
  { cond: { subject: 'you',  verb: 'ask',   complement: 'me' },
    res:  { subject: 'I',    verb: 'help',  complement: 'you' } },
  { cond: { subject: 'I',    verb: 'win',   complement: 'the lottery' },
    res:  { subject: 'I',    verb: 'travel', complement: 'the world' } },
  { cond: { subject: 'she',  verb: 'call',  complement: 'me' },
    res:  { subject: 'I',    verb: 'answer', complement: '' } },
  { cond: { subject: 'we',   verb: 'leave', complement: 'early' },
    res:  { subject: 'we',   verb: 'arrive', complement: 'on time' } },
  { cond: { subject: 'I',    verb: 'be',    complement: 'rich' },
    res:  { subject: 'I',    verb: 'buy',   complement: 'a house' } },
  { cond: { subject: 'he',   verb: 'study', complement: 'more' },
    res:  { subject: 'he',   verb: 'pass',  complement: 'the exam' } },
  { cond: { subject: 'they', verb: 'be',    complement: 'here' },
    res:  { subject: 'we',   verb: 'start', complement: 'the meeting' } },
];

/* Solo estas pueden ser sujeto. «Where lives here?» no existe: un lugar no
   ejecuta la acción. */
export const whSubjectWords = ['who', 'what', 'which', 'how'];

// Orden de cursos para el filtro acumulativo. Mismo array que la suite entera.
export const COURSE_ORDER = NIVELES;

/* Tiempos verbales. `cefr` y las unidades NO se escriben aquí: salen de
   `delCurriculo(id)`, que las lee del generado. Aquí quedan solo los nombres,
   los ejemplos y las descripciones, que son de esta app. */
export const tenses = [
  { id: 'simple-present',   ...delCurriculo('simple-present'),   nameEn: 'Simple Present',             nameEs: 'Presente Simple',             example: 'I work',              timeType: 'present', descEn: 'Habits, facts, routines',                       descEs: 'Hábitos, hechos, rutinas' },
  { id: 'present-continuous', ...delCurriculo('present-continuous'), nameEn: 'Present Continuous',     nameEs: 'Presente Continuo',           example: 'I am working',        timeType: 'present', descEn: 'Actions happening now',                         descEs: 'Acciones ocurriendo ahora' },
  { id: 'simple-past',      ...delCurriculo('simple-past'),      nameEn: 'Simple Past',                nameEs: 'Pasado Simple',               example: 'I worked',            timeType: 'past',    descEn: 'Completed actions in the past',                 descEs: 'Acciones completadas en el pasado' },
  { id: 'future-going-to',  ...delCurriculo('future-going-to'),  nameEn: 'Future (going to)',          nameEs: 'Futuro (going to)',           example: 'I am going to work',  timeType: 'future',  descEn: 'Plans and intentions',                          descEs: 'Planes e intenciones' },
  { id: 'present-perfect',  ...delCurriculo('present-perfect'),  nameEn: 'Present Perfect',            nameEs: 'Presente Perfecto',           example: 'I have worked',       timeType: 'present', descEn: 'Past actions with present relevance',           descEs: 'Acciones pasadas con relevancia presente' },
  { id: 'past-continuous',  ...delCurriculo('past-continuous'),  nameEn: 'Past Continuous',            nameEs: 'Pasado Continuo',             example: 'I was working',       timeType: 'past',    descEn: 'Actions in progress in the past',               descEs: 'Acciones en progreso en el pasado' },
  { id: 'simple-future',    ...delCurriculo('simple-future'),    nameEn: 'Simple Future (will)',       nameEs: 'Futuro Simple (will)',        example: 'I will work',         timeType: 'future',  descEn: 'Predictions, spontaneous decisions',            descEs: 'Predicciones, decisiones espontáneas' },
  { id: 'past-perfect',     ...delCurriculo('past-perfect'),     nameEn: 'Past Perfect',               nameEs: 'Pasado Perfecto',             example: 'I had worked',        timeType: 'past',    descEn: 'Actions before another past action',            descEs: 'Acciones antes de otra acción pasada' },
  { id: 'used-to',          ...delCurriculo('used-to'),          nameEn: 'Used to',                    nameEs: 'Used to',                     example: 'I used to work',      timeType: 'past',    descEn: 'Past habits that no longer exist',              descEs: 'Hábitos pasados que ya no existen' },
  { id: 'present-perfect-continuous', ...delCurriculo('present-perfect-continuous'), nameEn: 'Present Perfect Continuous', nameEs: 'Presente Perfecto Continuo', example: 'I have been working', timeType: 'present', descEn: 'Actions that started in the past and continue', descEs: 'Acciones que empezaron en el pasado y continúan' },
];
// Contrastados contra syllabus-aef.md (temario real de los cursos). Se quitaron:
//   would-past  → no es un tiempo (would + base = misma forma que un modal), el
//                 temario solo nombra `would` para la 2ª condicional y el hábito
//                 pasado ya lo cubre `used to`. Vive como modal.
//   future-perfect y past-perfect-continuous → no se enseñan en ningún curso
//                 (confirmado con el profesor: tampoco en Practical English).

// Verbos modales con información semántica completa
export const modals = [
  { id: '', name: '—', category: null, cefr: null, descEs: 'Sin verbo modal', descEn: 'No modal', fullDescEs: '', fullDescEn: '' },
  {
    id: 'can', ...delCurriculo('can'),
    name: 'Can',
    category: 'ability',
    descEs: 'Habilidad / Posibilidad',
    descEn: 'Ability / Possibility',
    timeContext: 'present',
    fullDescEs: 'Expresa habilidad o posibilidad en el presente. No necesita tiempo verbal adicional.',
    fullDescEn: 'Expresses ability or possibility in the present. Does not need an additional tense.'
  },
  {
    // Elemental II por Practical English (pedir algo). Como gramática de
    // habilidad pasada llega en AEF 3 4B, pero el alumno ya lo usa antes.
    // La unidad la dio el docente (2026-08-08): aparece DESPUÉS de la 7C, o sea
    // que la primera clase en que puede salir es la 8A. No está en la columna de
    // gramática del temario porque Practical English no figura ahí.
    id: 'could', ...delCurriculo('could'),
    name: 'Could',
    category: 'ability',
    descEs: 'Pedir algo / Cortesía',
    descEn: 'Requests / Politeness',
    timeContext: 'past',
    fullDescEs: 'Sirve para pedir algo con cortesía (Could I have…? / Could you help me?). Más adelante se estudia también como habilidad en el pasado.',
    fullDescEn: 'Used to ask for things politely (Could I have…? / Could you help me?). Later it is also studied as past ability.'
  },
  {
    // No tiene unidad propia: se nombra junto a `might`, así que va a su nivel.
    id: 'may', ...delCurriculo('may'),
    name: 'May',
    category: 'ability',
    descEs: 'Permiso / Posibilidad',
    descEn: 'Permission / Possibility',
    timeContext: 'present',
    fullDescEs: 'Expresa permiso formal o posibilidad. Alternativa más formal de "might".',
    fullDescEn: 'Expresses formal permission or possibility. A more formal alternative to "might".'
  },
  {
    id: 'might', ...delCurriculo('might'),
    name: 'Might',
    category: 'ability',
    descEs: 'Posibilidad remota',
    descEn: 'Remote possibility',
    timeContext: 'neutral',
    fullDescEs: 'Expresa posibilidad con menor certeza que "may". Neutral en tiempo.',
    fullDescEn: 'Expresses possibility with less certainty than "may". Time-neutral.'
  },
  {
    id: 'must', ...delCurriculo('must'),
    name: 'Must',
    category: 'obligation',
    descEs: 'Obligación fuerte',
    descEn: 'Strong obligation',
    timeContext: 'present',
    fullDescEs: 'Expresa obligación fuerte o certeza lógica. Se refiere principalmente al presente.',
    fullDescEn: 'Expresses strong obligation or logical certainty. Mainly refers to the present.'
  },
  {
    id: 'should', ...delCurriculo('should'),
    name: 'Should',
    category: 'obligation',
    descEs: 'Consejo / Deber moral',
    descEn: 'Advice / Moral duty',
    timeContext: 'neutral',
    fullDescEs: 'Expresa consejo u obligación moral. Es neutral en tiempo, se aplica al presente o futuro.',
    fullDescEn: 'Expresses advice or moral obligation. Time-neutral, applies to present or future.'
  },
  {
    id: 'will', ...delCurriculo('will'),
    name: 'Will',
    category: 'future',
    descEs: 'Futuro / Voluntad',
    descEn: 'Future / Willingness',
    timeContext: 'future',
    fullDescEs: 'Expresa futuro, predicciones o voluntad. Ya indica tiempo futuro por sí mismo.',
    fullDescEn: 'Expresses future, predictions, or willingness. Already indicates future time by itself.'
  },
  {
    /* Básico II por Practical English (invitar/ofrecer). Su uso condicional
       llega en Intermedio II 9A, pero eso es la 2ª condicional: una estructura
       completa (If + pasado, would + base), no el modal suelto.
       CORRECCIÓN del docente (2026-08-08): estaba en Elemental I y aparece
       antes, después de la 9B de Básico II — la primera clase en que puede
       salir es la 10A. La nota vieja de syllabus-aef.md decía Elemental I; esta
       es más precisa y la reemplaza. */
    id: 'would', ...delCurriculo('would'),
    name: 'Would',
    category: 'future',
    descEs: 'Invitar / Ofrecer',
    descEn: 'Invitations / Offers',
    timeContext: 'conditional',
    fullDescEs: 'Sirve para invitar y ofrecer con cortesía (Would you like…?). Más adelante aparece en la segunda condicional. El tiempo verbal seleccionado no afectará la estructura.',
    fullDescEn: 'Used to invite and offer politely (Would you like…?). Later it appears in the second conditional. The selected tense will not affect the structure.'
  },
  {
    // No tiene unidad propia: se nombra junto a `should`, así que va a su nivel.
    id: 'shall', ...delCurriculo('shall'),
    name: 'Shall',
    category: 'future',
    descEs: 'Sugerencia / Ofrecimiento',
    descEn: 'Suggestion / Offer',
    timeContext: 'future',
    fullDescEs: 'Usado para sugerencias u ofrecimientos formales (Shall we…?). Alternativa más formal de "should".',
    fullDescEn: 'Used for suggestions or formal offers (Shall we…?). A more formal alternative to "should".'
  },
  {
    // Intermedio II 7C, junto a `must`. Es el único "modal" que se conjuga
    // (has to / doesn't have to), así que el conjugador lo trata aparte.
    id: 'have-to', ...delCurriculo('have-to'),
    name: 'Have to',
    category: 'obligation',
    descEs: 'Obligación externa',
    descEn: 'External obligation',
    timeContext: 'present',
    fullDescEs: 'Expresa una obligación que viene de fuera: una regla, un horario, otra persona. Se conjuga (he has to) y se niega con do/does (she doesn\'t have to). Contrasta con "must", que nace de quien habla.',
    fullDescEn: 'Expresses an obligation coming from outside: a rule, a schedule, someone else. It conjugates (he has to) and is negated with do/does (she doesn\'t have to). Contrasts with "must", which comes from the speaker.'
  },
];

// Palabras interrogativas WH (base)
export const whWords = [
  { id: '', name: '—' },
  { id: 'what', name: 'What' },
  { id: 'where', name: 'Where' },
  { id: 'when', name: 'When' },
  { id: 'why', name: 'Why' },
  { id: 'who', name: 'Who' },
  { id: 'which', name: 'Which' },
  { id: 'how', name: 'How' },
];

// Sugerencias de extensión por palabra base (no exhaustivas — el usuario puede escribir cualquier cosa)
export const whSuggestions = {
  'what': ['kind of', 'type of', 'color', 'time', 'size'],
  'which': ['one', 'ones', 'type of'],
  'how': ['much', 'many', 'often', 'long', 'far', 'old'],
};

/* «What kind of» y «What type of» no se sostienen solas: piden un sustantivo
   detrás. Como el selector las ofrece con un clic, salía «What kind of does she
   like music?». La señal es la preposición al final, así que también cubre lo
   que el alumno escriba a mano. */
export const whExtPideSustantivo = (ext) => /\bof$/i.test((ext || '').trim());

/* Qué tipo de dato pide cada wh. Mismo vocabulario que Question Lab (WH_HINTS)
   a propósito: es la misma explicación en las dos apps, y en QL es justamente
   lo que la actividad «Responde» enseña a distinguir.
   Las claves compuestas ganan sobre la base: «how many» pide una cantidad, no
   «una manera». */
export const whAsks = {
  what:         { es: 'una cosa o idea 💡',       en: 'a thing or idea 💡' },
  where:        { es: 'un lugar 📍',              en: 'a place 📍' },
  when:         { es: 'un momento 🕐',            en: 'a time 🕐' },
  why:          { es: 'because + una razón 💬',   en: 'because + a reason 💬' },
  who:          { es: 'una persona 🧑',           en: 'a person 🧑' },
  which:        { es: 'una opción ✅',            en: 'an option ✅' },
  how:          { es: 'una manera ✨',            en: 'a way ✨' },
  'how many':   { es: 'una cantidad 🔢',          en: 'a quantity 🔢' },
  'how much':   { es: 'una cantidad o precio 💰', en: 'an amount or price 💰' },
  'how often':  { es: 'una frecuencia 🔁',        en: 'a frequency 🔁' },
  'how long':   { es: 'una duración ⏳',          en: 'a duration ⏳' },
  'how far':    { es: 'una distancia 🗺️',         en: 'a distance 🗺️' },
  'how old':    { es: 'una edad 🎂',              en: 'an age 🎂' },
  'what time':  { es: 'una hora 🕒',              en: 'a clock time 🕒' },
  'what color': { es: 'un color 🎨',              en: 'a colour 🎨' },
  'what size':  { es: 'una talla 📏',             en: 'a size 📏' },
  'what kind':  { es: 'un tipo 🏷️',               en: 'a kind 🏷️' },
  'what type':  { es: 'un tipo 🏷️',               en: 'a type 🏷️' },
  'which one':  { es: 'una opción ✅',            en: 'an option ✅' },
  'which ones': { es: 'varias opciones ✅',       en: 'several options ✅' },
  'which type': { es: 'un tipo 🏷️',               en: 'a type 🏷️' },
};

// Adverbios de frecuencia (van entre sujeto y verbo)
export const frequencyAdverbs = [
  { id: '', name: '—', descEs: 'Sin adverbio', descEn: 'No adverb' },
  { id: 'always', name: 'Always', descEs: 'Siempre (100%)', descEn: 'Always (100%)', percentage: 100 },
  { id: 'usually', name: 'Usually', descEs: 'Usualmente (80%)', descEn: 'Usually (80%)', percentage: 80 },
  { id: 'often', name: 'Often', descEs: 'A menudo (70%)', descEn: 'Often (70%)', percentage: 70 },
  { id: 'frequently', name: 'Frequently', descEs: 'Frecuentemente (70%)', descEn: 'Frequently (70%)', percentage: 70 },
  { id: 'sometimes', name: 'Sometimes', descEs: 'A veces (50%)', descEn: 'Sometimes (50%)', percentage: 50 },
  { id: 'occasionally', name: 'Occasionally', descEs: 'Ocasionalmente (30%)', descEn: 'Occasionally (30%)', percentage: 30 },
  { id: 'rarely', name: 'Rarely', descEs: 'Raramente (10%)', descEn: 'Rarely (10%)', percentage: 10 },
  { id: 'seldom', name: 'Seldom', descEs: 'Rara vez (10%)', descEn: 'Seldom (10%)', percentage: 10 },
  { id: 'hardly ever', name: 'Hardly ever', descEs: 'Casi nunca (5%)', descEn: 'Hardly ever (5%)', percentage: 5 },
  { id: 'never', name: 'Never', descEs: 'Nunca (0%)', descEn: 'Never (0%)', percentage: 0 },
];

// Marcadores de tiempo
export const timeMarkers = {
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
      { text: 'every week', tense: 'simple-present', desc: 'Cada semana' },
      { text: 'every month', tense: 'simple-present', desc: 'Cada mes' },
      { text: 'on Mondays', tense: 'simple-present', desc: 'Los lunes' },
      { text: 'on weekends', tense: 'simple-present', desc: 'Los fines de semana' },
      { text: 'in the morning', tense: 'simple-present', desc: 'En la mañana' },
      { text: 'at night', tense: 'simple-present', desc: 'En la noche' }
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

// Helper para aplanar los marcadores de tiempo por categoría
export const getFlattenedMarkers = (category) => {
  const categoryMarkers = timeMarkers[category];
  return Object.values(categoryMarkers).flat();
};

// Marcadores adicionales para tiempos no cubiertos arriba
export const extraTimeMarkers = {
  'past-continuous':           ['when I arrived', 'at that moment', 'all morning', 'while she slept', 'at 8 pm'],
  'past-perfect':              ['before I left', 'by then', 'already', 'when she arrived', 'never before'],
  'used-to':                   ['as a child', 'when I was young', 'every summer', 'in the past', 'years ago'],
  'present-perfect-continuous':['for hours', 'since this morning', 'lately', 'recently', 'all week'],
};

// Retorna chips de marcador de tiempo para un tiempo verbal dado
export const getMarkersByTense = (tenseId) => {
  // Buscar en timeMarkers (todos los grupos) filtrando por tense
  const all = Object.values(timeMarkers).flatMap(cat => Object.values(cat).flat());
  const fromMain = all.filter(m => m.tense === tenseId).map(m => m.text);
  const fromExtra = extraTimeMarkers[tenseId] || [];
  // Deduplicate
  return [...new Set([...fromMain, ...fromExtra])];
};

// Sustantivos contables e incontables (para validación)
export const uncountableNouns = ['water', 'rice', 'bread', 'money', 'music', 'wine', 'coffee', 'tea', 'milk', 'sugar', 'air', 'time', 'information', 'advice', 'homework', 'furniture', 'luggage'];
export const countableNouns = ['books', 'apples', 'cars', 'students', 'houses', 'bottles'];
