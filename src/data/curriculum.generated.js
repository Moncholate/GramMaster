/* AUTO-GENERATED from Grammar HUB/curriculum.json — do not edit by hand.
   Change curriculum.json and run `npm run sync-curriculum` in Grammar HUB. */

export const NIVELES = ["basico1","basico2","elemental1","elemental2","intermedio1","intermedio2","avanzado"];

export const UNIDADES_POR_CURSO = {
  "basico1": [
    "1A",
    "1B",
    "2A",
    "2B",
    "3A",
    "3B",
    "4A",
    "4B",
    "5A",
    "5B",
    "6A",
    "6B"
  ],
  "basico2": [
    "7A",
    "7B",
    "8A",
    "8B",
    "9A",
    "9B",
    "10A",
    "10B",
    "11A",
    "11B",
    "12A",
    "12B"
  ],
  "elemental1": [
    "1A",
    "1B",
    "1C",
    "2A",
    "2B",
    "2C",
    "3A",
    "3B",
    "3C",
    "4A",
    "4B",
    "4C",
    "5A",
    "5B",
    "5C",
    "6A",
    "6B",
    "6C"
  ],
  "elemental2": [
    "7A",
    "7B",
    "7C",
    "8A",
    "8B",
    "8C",
    "9A",
    "9B",
    "9C",
    "10A",
    "10B",
    "10C",
    "11A",
    "11B",
    "11C",
    "12A",
    "12B",
    "12C"
  ],
  "intermedio1": [
    "1A",
    "1B",
    "1C",
    "2A",
    "2B",
    "2C",
    "3A",
    "3B",
    "3C",
    "4A",
    "4B",
    "4C",
    "5A",
    "5B",
    "5C",
    "6A",
    "6B",
    "6C"
  ],
  "intermedio2": [
    "7A",
    "7B",
    "7C",
    "8A",
    "8B",
    "8C",
    "9A",
    "9B",
    "9C",
    "10A",
    "10B",
    "10C",
    "11A",
    "11B",
    "11C",
    "12A",
    "12B",
    "12C"
  ],
  "avanzado": [
    "1A",
    "1B",
    "2A",
    "2B",
    "3A",
    "3B",
    "4A",
    "4B",
    "5A",
    "5B",
    "6A",
    "6B",
    "7A",
    "7B",
    "8A",
    "8B",
    "9A",
    "9B",
    "10A",
    "10B"
  ]
};

/* Cada cuántos días se le vuelve a preguntar al alumno si su curso sigue en esa
   unidad. Ver `$revision` en curriculum.json: el plazo es decisión del temario,
   no de cada app. */
export const DIAS_REVISION = 7;

/* id → { cefr, unidad, unidadBe, unidadInterrogativa, unidadTerceraPersona,
   unidadIrregulares }. Solo están los campos que ese contenido usa. */
export const CURRICULO = {
  "to-be-pres": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "simple-present": {
    "cefr": "basico1",
    "unidad": "5A",
    "unidadBe": "2B",
    "unidadInterrogativa": "5B",
    "unidadTerceraPersona": "6A"
  },
  "present-continuous": {
    "cefr": "basico2",
    "unidad": "9A"
  },
  "to-be-past": {
    "cefr": "basico2",
    "unidad": "10B"
  },
  "simple-past": {
    "cefr": "basico2",
    "unidad": "11A",
    "unidadBe": "10B",
    "unidadIrregulares": "11B"
  },
  "future-going-to": {
    "cefr": "elemental2",
    "unidad": "10B"
  },
  "present-perfect": {
    "cefr": "elemental2",
    "unidad": "12A"
  },
  "past-continuous": {
    "cefr": "intermedio1",
    "unidad": "2B"
  },
  "simple-future": {
    "cefr": "intermedio1",
    "unidad": "6A"
  },
  "past-perfect": {
    "cefr": "intermedio2",
    "unidad": "12A"
  },
  "used-to": {
    "cefr": "intermedio2",
    "unidad": "11A"
  },
  "present-perfect-continuous": {
    "cefr": "avanzado",
    "unidad": "2B"
  },
  "subject-question": {
    "cefr": "intermedio2",
    "unidad": "12C"
  },
  "modal": {
    "cefr": "basico2",
    "unidad": "8A"
  },
  "can": {
    "cefr": "basico2",
    "unidad": "8A"
  },
  "would": {
    "cefr": "basico2",
    "unidad": "10A"
  },
  "could": {
    "cefr": "elemental2",
    "unidad": "8A"
  },
  "will": {
    "cefr": "intermedio1",
    "unidad": "6A"
  },
  "must": {
    "cefr": "intermedio2",
    "unidad": "7C"
  },
  "have-to": {
    "cefr": "intermedio2",
    "unidad": "7C"
  },
  "should": {
    "cefr": "intermedio2",
    "unidad": "8A"
  },
  "shall": {
    "cefr": "intermedio2",
    "unidad": "8A"
  },
  "might": {
    "cefr": "intermedio2",
    "unidad": "11B"
  },
  "may": {
    "cefr": "intermedio2",
    "unidad": "11B"
  },
  "wh-what": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-where": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-who": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-whom": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-when": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-why": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-how": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-how-old": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-what-time": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-what-color": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-which": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-what-kind": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-how-far": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-how-fast": {
    "cefr": "basico1",
    "unidad": "2B"
  },
  "wh-how-often": {
    "cefr": "basico1",
    "unidad": "6B"
  },
  "wh-whose": {
    "cefr": "elemental1",
    "unidad": "4A"
  },
  "wh-how-much": {
    "cefr": "elemental2",
    "unidad": "9B"
  },
  "wh-how-many": {
    "cefr": "elemental2",
    "unidad": "9B"
  },
  "wh-how-long": {
    "cefr": "intermedio2",
    "unidad": "9B"
  },
  "conditional-1": {
    "cefr": "intermedio2",
    "unidad": "8B"
  },
  "conditional-2": {
    "cefr": "intermedio2",
    "unidad": "9A"
  },
  "conditional-3": {
    "cefr": "avanzado",
    "unidad": "9A"
  }
};

/* Devuelve los campos de currículo de un id, y AVISA si no existe: un id mal
   escrito daría `undefined` y el contenido quedaría disponible desde la clase 1
   sin que nadie se entere. */
export const delCurriculo = (id) => {
  const c = CURRICULO[id];
  if (!c) throw new Error(`curriculum.json no tiene «${id}»`);
  return c;
};
