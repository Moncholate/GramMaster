/* ============================================================================
   CONTRASTE DE LO QUE SE VE · Grammaster
   Uso:  npm run check-contraste
   ----------------------------------------------------------------------------
   El motor vive en design-tokens y llega generado: mide cada elemento con texto
   propio contra el fondo que REALMENTE tiene, que es el punto ciego que dejan
   `check-contraste-tw` (solo pares dentro de un className) y `check-dark` (solo
   cobertura de fondos). Su cabecera cuenta el porqué largo.

   Aquí va lo único que es de esta app: cómo llegar a la pantalla que vale la
   pena auditar, y qué fallos se decidieron dejar.

   Necesita Playwright, y a propósito NO está en package.json — `npm ci` corre
   en el despliegue y se bajaría los navegadores en cada build:

       npm i -D playwright && npx playwright install chromium
   ============================================================================ */
import { correr } from './contraste-render.generated.mjs';

correr({
  nombre: 'GRAMMASTER',
  puerto: 5177,

  /* Se rellena y se genera porque el panel de resultado —donde estaban casi
     todos los fallos— no existe en el DOM hasta que hay una oración. Auditar la
     pantalla inicial habría dado un verde que no significaba nada.
     Con adverbio a propósito: añade la cuarta pieza y hace crecer la fórmula,
     que es justo donde estaba el 2,04:1. */
  conducir: async (page) => {
    await page.getByPlaceholder(/I, you, he, she/).fill('she');
    await page.getByPlaceholder(/work, study, play/).fill('work');
    /* «in january» y no «at home»: además de servir de complemento, dispara el
       aviso de mayúscula, que si no no existiría en el DOM y se quedaría sin
       medir. Un elemento que solo aparece cuando el alumno se equivoca es justo
       el que nadie mira. */
    await page.getByPlaceholder(/yesterday, at home/).fill('in january');
    await page.getByRole('button', { name: /Selecciona un tiempo/ }).click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Presente Simple")').first().click();
    await page.waitForTimeout(400);
    const adv = page.locator('select').filter({ hasText: 'Sin adverbio' }).first();
    if (await adv.count()) { await adv.selectOption({ index: 1 }); await page.waitForTimeout(250); }
    await page.getByRole('button', { name: 'Generar Oración' }).click();
    await page.waitForTimeout(700);
    await page.locator('button:has-text("Ver los 3 modos")').first().click();
    await page.waitForTimeout(400);
  },

  /* Las cinco pestañas, no solo Construye. Auditar únicamente donde quedó
     `conducir` daba un verde que valía para un quinto de la app: en
     Desgramatizador ese mismo punto ciego escondía 33 elementos bajo AA, y la
     mayoría en la Guía — la pantalla donde el alumno se aprende el código de
     colores.
     Se navega DESPUÉS de generar, así que Historial y Progreso llegan con datos
     de verdad en vez de con su estado vacío, que es el que no tiene nada que
     medir. */
  pantallas: [
    { nombre: 'Construye', ir: (page) => page.locator('nav button, footer button').filter({ hasText: 'Construye' }).first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Guía',      ir: (page) => page.locator('nav button, footer button').filter({ hasText: 'Guía' }).first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Práctica',  ir: (page) => page.locator('nav button, footer button').filter({ hasText: 'Práctica' }).first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Progreso',  ir: (page) => page.locator('nav button, footer button').filter({ hasText: 'Progreso' }).first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Historial', ir: (page) => page.locator('nav button, footer button').filter({ hasText: 'Historial' }).first().click().then(() => page.waitForTimeout(500)) },
  ],

  cambiarTema: async (page) => {
    await page.locator('button:has-text("Oscuro")').first().click();
    await page.waitForTimeout(600);
  },

  /* Un fallo que se decide no arreglar se anota aquí con su motivo, y entonces
     deja de contar. Mismo criterio que `check-dark.mjs`: exige una decisión
     humana UNA VEZ y la deja escrita. Sin esta lista, o la sonda vive en rojo
     —y se deja de mirar— o alguien la silencia sin explicar por qué. */
  revisados: [
    {
      txt: '●',
      motivo: 'Punto de aspecto del selector de tiempos. Sale de un token de FAMILIA ' +
              '(tenseFamilies), va `aria-hidden` y es redundante con el nombre del tiempo ' +
              'que tiene al lado, que sí se lee. Cambiar el color de una familia entera ' +
              'por un glifo decorativo sería desproporcionado.',
    },
  ],
});
