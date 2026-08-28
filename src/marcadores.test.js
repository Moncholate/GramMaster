/* ============================================================================
   EL AVISO DE MARCADOR NO PUEDE CONTRADECIR LA CLASE
   ----------------------------------------------------------------------------
   La app avisa cuando el complemento trae un marcador que no cuadra con el
   tiempo elegido («I work yesterday»). Es un aviso útil, pero comparaba a secas
   el tipo del marcador con el del tiempo, y así marcaba como incoherente algo
   que el profesor enseña como correcto (28-ago-2026):

     «El Presente Continuo y el be going to son intercambiables» — o sea que
     «I am meeting Ana tomorrow» está bien, y la app decía que «tomorrow» no
     cuadra con el Presente Continuo.

   Un aviso que se equivoca es peor que no tenerlo: el alumno aprende a
   ignorarlo, y encima le contradice al profesor. Lo que se prueba aquí es que
   el aviso sigue saltando donde debe y calla donde el curso dice que calle.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import { detectarMarcador, marcadorCuadra, tenses } from './data/grammar';

const tiempo = (id) => tenses.find(t => t.id === id);
const cuadra = (tenseId, texto) => {
  const m = detectarMarcador(texto);
  return m ? marcadorCuadra(tiempo(tenseId), m.tipo) : true;
};

describe('detectar el marcador', () => {
  it('lo encuentra dentro del complemento y le pone tipo', () => {
    expect(detectarMarcador('at home yesterday')).toEqual({ texto: 'yesterday', tipo: 'past' });
    expect(detectarMarcador('every day')).toEqual({ texto: 'every day', tipo: 'present' });
    expect(detectarMarcador('with Ana tomorrow')).toEqual({ texto: 'tomorrow', tipo: 'future' });
  });

  it('sin marcador no inventa ninguno', () => {
    expect(detectarMarcador('at home')).toBe(null);
    expect(detectarMarcador('')).toBe(null);
    expect(detectarMarcador(null)).toBe(null);
  });
});

describe('el aviso salta donde debe', () => {
  it('un marcador de pasado con un tiempo de presente', () => {
    expect(cuadra('simple-present', 'yesterday')).toBe(false);
    expect(cuadra('present-perfect', 'yesterday')).toBe(false);   // «I have worked yesterday» no
  });

  it('un marcador de futuro con un tiempo de pasado', () => {
    expect(cuadra('simple-past', 'tomorrow')).toBe(false);
  });

  it('y calla cuando el marcador es del mismo tiempo', () => {
    expect(cuadra('simple-present', 'every day')).toBe(true);
    expect(cuadra('simple-past', 'last week')).toBe(true);
    expect(cuadra('simple-future', 'tomorrow')).toBe(true);
    expect(cuadra('future-going-to', 'next month')).toBe(true);
  });
});

describe('lo que el curso enseña como intercambiable', () => {
  /* Presente Continuo + marcador de futuro = plan ya acordado. Es el mismo
     contenido que «be going to», y así se enseña. */
  it('el Presente Continuo acepta marcadores de futuro', () => {
    for (const marcador of ['tomorrow', 'tonight', 'next week', 'this weekend', 'later']) {
      expect(cuadra('present-continuous', marcador), marcador).toBe(true);
    }
  });

  it('y sigue aceptando los suyos de presente', () => {
    for (const marcador of ['now', 'right now', 'at the moment', 'these days']) {
      expect(cuadra('present-continuous', marcador), marcador).toBe(true);
    }
  });

  /* Solo en esa dirección: «I'm going to work now» sí es raro, y ahí el aviso
     tiene que seguir saltando. */
  it('pero «going to» no acepta marcadores de presente', () => {
    expect(cuadra('future-going-to', 'right now')).toBe(false);
  });

  it('el pasado sigue siendo incompatible con el Presente Continuo', () => {
    expect(cuadra('present-continuous', 'yesterday')).toBe(false);
  });
});
