/* ============================================================================
   EL VERBO QUE NO ES UN VERBO
   ----------------------------------------------------------------------------
   Nació en clase el 2026-08-27: un alumno escribió «somebody» en la casilla del
   verbo. La app se lo dijo —en rojo, bajo el campo— y él generó la oración
   igual, porque el botón Generar seguía tan disponible como siempre.

   La respuesta NO es bloquear. La lista de verbos es finita (234 formas base) y
   un verbo legítimo que no esté en ella no puede dejar al alumno sin poder
   trabajar. Lo que se le cobra es un SEGUNDO TOQUE, que es lo que obliga a leer.

   Lo que se prueba aquí es la regla pura, `revisarVerboAntesDeGenerar`, y sobre
   todo su contraparte: que no le pida confirmación a nadie que sí es un verbo.
   Un aviso que salta de más se aprende a ignorar en dos clases, y entonces
   volvemos al problema del principio pero peor.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import { revisarVerboAntesDeGenerar, validateVerb, validPronouns } from './data/validation';
import { detectConjugatedVerbBase } from './conjugation';
import { commonVerbs, irregularVerbs } from './data/verbs';

// Lo mismo que hace la app: validar y mirar si es una forma conjugada.
const revisar = (palabra, idioma = 'es') =>
  revisarVerboAntesDeGenerar(validateVerb(palabra, idioma), detectConjugatedVerbBase(palabra));

describe('la regla, pieza a pieza', () => {
  it('un verbo limpio no pide nada', () => {
    expect(revisarVerboAntesDeGenerar({ valid: true, warning: null }, null))
      .toEqual({ confirmar: false, tipo: null });
  });

  it('forma conjugada: gana sobre cualquier otro motivo, porque trae arreglo', () => {
    /* «worked» es a la vez conjugado y «no está en la lista de verbos». Se
       informa lo primero: es lo más seguro de los dos y se arregla con un clic. */
    expect(revisarVerboAntesDeGenerar({ valid: false, warning: 'lo que sea' }, 'work'))
      .toEqual({ confirmar: true, tipo: 'conjugado' });
  });

  it('inválido sin ser conjugado → noEsVerbo', () => {
    expect(revisarVerboAntesDeGenerar({ valid: false, warning: 'x' }, null))
      .toEqual({ confirmar: true, tipo: 'noEsVerbo' });
  });

  it('válido pero con aviso → dudoso', () => {
    expect(revisarVerboAntesDeGenerar({ valid: true, warning: 'puede no ser un verbo' }, null))
      .toEqual({ confirmar: true, tipo: 'dudoso' });
  });

  it('sin validación todavía, se pide confirmación en vez de dejar pasar', () => {
    expect(revisarVerboAntesDeGenerar(undefined, null).confirmar).toBe(true);
  });
});

describe('el caso de clase', () => {
  it('«somebody» en la casilla del verbo pide confirmación', () => {
    expect(revisar('somebody').confirmar).toBe(true);
  });

  /* Es el error entero de esa familia: el alumno pone en el verbo algo que era
     un SUJETO. Todos los pronombres que la app acepta como sujeto tienen que
     avisar si aparecen en la casilla del verbo. */
  it('ningún pronombre de sujeto pasa como verbo', () => {
    const pasan = validPronouns.filter(p => !revisar(p).confirmar);
    expect(pasan, `pasaron sin aviso: ${pasan.join(', ')}`).toEqual([]);
  });

  it('una palabra inventada también', () => {
    expect(revisar('xkcdz').confirmar).toBe(true);
  });

  it('un verbo conjugado avisa, y dice que es por la forma', () => {
    for (const [escrito, base] of [['worked', 'work'], ['working', 'work'], ['studies', 'study'], ['went', 'go']]) {
      const r = revisar(escrito);
      expect(r, escrito).toEqual({ confirmar: true, tipo: 'conjugado' });
      expect(detectConjugatedVerbBase(escrito), escrito).toBe(base);
    }
  });
});

describe('la contraparte: no molestar a quien escribió bien', () => {
  /* La prueba que de verdad importa. Si esto se pone en rojo, el aviso empezó a
     saltar sobre verbos legítimos y hay que arreglar la validación, NO relajar
     el aviso. */
  it('los 234 verbos del propio pozo generan sin pedir confirmación', () => {
    const pozo = [...new Set([...commonVerbs, ...Object.keys(irregularVerbs)])];
    const molestados = pozo.filter(v => revisar(v).confirmar);
    expect(molestados, `piden confirmación sin motivo: ${molestados.join(', ')}`).toEqual([]);
    expect(pozo.length).toBe(234);
  });

  it('en inglés se comporta igual: el idioma cambia el texto, no la decisión', () => {
    for (const v of ['work', 'go', 'be', 'have', 'study']) {
      expect(revisar(v, 'en').confirmar, v).toBe(false);
    }
    expect(revisar('somebody', 'en').confirmar).toBe(true);
  });
});
