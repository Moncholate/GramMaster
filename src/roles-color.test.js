// El formulario y la oración tienen que hablar del mismo color.
//
// EL BUG QUE ESTE TEST IMPIDE: durante meses tres de las cuatro etiquetas de
// campo llevaron el color de OTRO rol. «Sujeto» iba en indigo, que es el del
// MODAL; «Verbo» en rose, que es el del AUXILIAR; «Complemento» en emerald, que
// no es de nadie (el suyo es slate). No era un matiz discutible: indigo y rose
// salen en la MISMA pantalla queriendo decir otra cosa, así que el alumno
// escribía en una casilla rotulada en rose y al generar veía el verbo en rojo y
// el rose puesto en el auxiliar. La app enseñaba un código de colores y se lo
// desmentía en el formulario.
//
// Nadie lo iba a cazar mirando: cada pantalla, por separado, se ve coherente.
// Solo salta si comparas las dos, y eso es justo lo que hace este test.
//
// Se lee el JSX como TEXTO a propósito. Montar el componente exigiría el DOM
// entero (y App.jsx son 4.000 líneas), y lo que hay que comprobar no es
// comportamiento sino una correspondencia entre dos listas de clases: la que
// escribe el formulario a mano y la que genera design-tokens.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROLE_TW } from './tokens.generated.js';

const APP = readFileSync(join(import.meta.dirname, 'App.jsx'), 'utf8');

// La clase de texto del rol, tal y como la genera design-tokens.
// ROLE_TW trae «text-blue-600 hover:bg-blue-50»; aquí solo importa la primera.
const colorDe = (rol) => ROLE_TW[rol].split(/\s+/)[0];

/* Cada campo del formulario y el rol que le corresponde. La etiqueta se busca
   por el texto de la traducción que muestra (`t.subject`, `t.verb`…), que es lo
   que la ata a un campo concreto y no a cualquier `<span>` del archivo. */
const CAMPOS = [
  { campo: 'Sujeto',      rol: 'subject',    marca: 't.subject}' },
  { campo: 'Verbo',       rol: 'verb',       marca: 't.verb}' },
  { campo: 'Complemento', rol: 'complement', marca: 't.complement}' },
  { campo: 'Adverbio',    rol: 'adverb',     marca: 't.adverbLabel}' },
];

/* La etiqueta es el <span className="text-sm font-medium …">{t.X}</span> que
   está dentro del <label>. La misma traducción aparece además como
   `placeholder={t.subject}` en el <input>, así que quedarse con la PRIMERA
   coincidencia agarraba el campo en vez del rótulo: hay que recorrerlas todas y
   quedarse con la que de verdad es un <span> de etiqueta. */
const etiquetaDe = (marca) => {
  const aguja = '{' + marca;
  for (let i = APP.indexOf(aguja); i !== -1; i = APP.indexOf(aguja, i + 1)) {
    const abre = APP.lastIndexOf('<span', i);
    if (abre === -1) continue;
    const trozo = APP.slice(abre, i);
    // Que no haya otra etiqueta abierta por el medio: si la hay, este <span> no
    // es el que encierra la marca sino uno anterior, y el trozo es basura.
    if (trozo.indexOf('<', 1) !== -1) continue;
    if (trozo.includes('text-sm font-medium')) return trozo;
  }
  return null;
};

describe('el color de cada campo es el de SU rol', () => {
  for (const { campo, rol, marca } of CAMPOS) {
    it(`${campo} usa ${rol}`, () => {
      const etiqueta = etiquetaDe(marca);
      expect(etiqueta, `no se encontró la etiqueta de ${campo}`).toBeTruthy();

      const esperado = colorDe(rol);
      expect(
        etiqueta.includes(esperado),
        `La etiqueta «${campo}» debería llevar «${esperado}» (el color de ${rol} ` +
        `según design-tokens) y lleva: ${etiqueta.match(/text-[a-z]+-\d+/g)?.join(', ') || 'ninguna clase de color'}`
      ).toBe(true);
    });
  }

  /* El sujeto tiene una segunda cara: en las preguntas de sujeto el hueco lo
     ocupa la palabra wh-, así que ahí el teal es CORRECTO y no un resto del
     cruce viejo. Se fija para que nadie lo "arregle" a azul por simetría. */
  it('en pregunta de sujeto la etiqueta pasa al color wh, no al del sujeto', () => {
    const etiqueta = etiquetaDe('t.subject}');
    expect(etiqueta).toContain(colorDe('wh-word'));
    expect(etiqueta).toContain('esPregSujeto');
  });

  /* Cerrojo sobre la confusión concreta que hubo, por si alguien reintroduce
     las clases viejas en otro sitio del formulario. */
  it('ningún campo vuelve a llevar el color de otro rol', () => {
    const ajenos = [
      ['Sujeto',      't.subject}',    colorDe('modal'),     'el MODAL'],
      ['Verbo',       't.verb}',       colorDe('auxiliary'), 'el AUXILIAR'],
      ['Complemento','t.complement}', 'text-emerald',        'ningún rol'],
    ];
    for (const [campo, marca, clase, dueño] of ajenos) {
      expect(
        etiquetaDe(marca).includes(clase),
        `«${campo}» volvió a llevar «${clase}», que es de ${dueño}`
      ).toBe(false);
    }
  });
});
