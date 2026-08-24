/* ============================================================================
   CONTRASTE DE LO QUE SE VE · `node check-contraste-render.mjs` desde aquí.
   ----------------------------------------------------------------------------
   POR QUÉ EXISTE, teniendo ya dos chequeos de contraste en design-tokens.

   `check-contraste-tw.mjs` mide pares de clases dentro de un mismo `className`,
   y lo dice en su cabecera: NO infiere el fondo del padre. `check-dark.mjs`
   comprueba cobertura de fondos, que es otra cosa todavía. Entre los dos queda
   un punto ciego enorme: el texto cuyo fondo lo pone un ANCESTRO, que en esta
   app es prácticamente todo — la tarjeta blanca envuelve el panel entero.

   Ahí vivían todos los fallos que se arreglaron en agosto de 2026:

     el botón «Ver los 3 modos»          2,81:1  (indigo sobre la tarjeta)
     los colores de rol en oscuro        2,73:1  el VERBO, el peor sitio posible
     la fórmula del tiempo en oscuro     2,04:1  el texto que enseña la estructura
     «(Opcional)», pistas, barra inferior 2,54:1  el mismo gris en siete sitios

   Ninguno lo podía ver un analizador de clases. Este arranca la app de verdad,
   recorre cada elemento con texto propio y mide su color contra el fondo que
   REALMENTE tiene: compone los translúcidos y sube por el árbol hasta el primer
   fondo opaco. Y aplica el umbral que toca —4,5:1, o 3:1 si el texto es grande—
   leyendo el tamaño y el peso ya calculados por el navegador.

   ── Cómo se usa ────────────────────────────────────────────────────────────
   Necesita Playwright, y a propósito NO está en package.json: `npm ci` correría
   en el despliegue y se descargaría los navegadores en cada build. Es una
   herramienta que se corre a mano, como los chequeos de design-tokens.

       npm i -D playwright && npx playwright install chromium
       node check-contraste-render.mjs

   Si falta, esto REVIENTA con instrucciones en vez de saltarse solo: una sonda
   que se salta en silencio deja de cumplir su propósito sin que nadie se entere.

   ── REVISADOS ──────────────────────────────────────────────────────────────
   Un fallo que se decide no arreglar se anota abajo con su motivo, y entonces
   deja de contar. Mismo criterio que `check-dark.mjs`: exige una decisión humana
   UNA VEZ, y la deja escrita. Sin esa lista, o el chequeo vive en rojo —y deja
   de mirarse— o alguien lo silencia sin explicar por qué.
   ============================================================================ */
import { spawn } from 'node:child_process';

const PUERTO = 5177;
const URL = `http://localhost:${PUERTO}`;

/* Excepciones decididas. `txt` es un trozo del texto del elemento; se compara
   por inclusión para no depender de la traducción exacta. */
const REVISADOS = [
  {
    txt: '●',
    motivo: 'Punto de aspecto del selector de tiempos. Sale de un token de FAMILIA ' +
            '(tenseFamilies), va `aria-hidden` y es redundante con el nombre del tiempo ' +
            'que tiene al lado, que sí se lee. Cambiar el color de una familia entera ' +
            'por un glifo decorativo sería desproporcionado.',
  },
];

/* ── El auditor, que corre DENTRO del navegador ───────────────────────────── */
const AUDITOR = () => {
  const lum = (r, g, b) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = s => { const m = (s || '').match(/[\d.]+/g); return m ? m.slice(0, 4).map(Number) : null; };

  /* El fondo EFECTIVO: sube por el árbol hasta el primer fondo opaco y compone
     los translúcidos que haya encontrado por el camino. Suponer blanco —o el
     fondo del padre inmediato— daba ratios inventados. */
  const fondo = (el) => {
    const capas = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && (c[3] === undefined || c[3] > 0)) { capas.push(c); if ((c[3] ?? 1) >= 1) break; }
    }
    if (!capas.length) return [255, 255, 255];
    let base = capas[capas.length - 1].slice(0, 3);
    for (let i = capas.length - 2; i >= 0; i--) {
      const c = capas[i], a = c[3] ?? 1;
      base = [0, 1, 2].map(k => Math.round(c[k] * a + base[k] * (1 - a)));
    }
    return base;
  };

  const out = [];
  for (const el of document.querySelectorAll('*')) {
    // Solo el texto PROPIO del elemento: si se contara el heredado, cada
    // contenedor repetiría el fallo de sus hijos y la lista sería ilegible.
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!txt) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (el.closest('.sr-only')) continue;

    /* Un elemento cuyo texto es SOLO emoji no se audita: el emoji trae sus
       propios colores y la propiedad `color` no lo alcanza. Los símbolos que no
       son emoji («*», «●») SÍ se auditan: esos sí los pinta el CSS. */
    if (!txt.replace(/\p{Extended_Pictographic}|[️‍\s]/gu, '')) continue;

    const fg = parse(cs.color);
    if (!fg || (fg[3] ?? 1) === 0) continue;
    const bg = fondo(el);
    const l1 = lum(...fg.slice(0, 3)), l2 = lum(...bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    const px = parseFloat(cs.fontSize), peso = parseInt(cs.fontWeight) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const umbral = grande ? 3 : 4.5;
    if (ratio >= umbral) continue;

    out.push({
      txt: txt.slice(0, 40), ratio: +ratio.toFixed(2), umbral,
      px: Math.round(px), peso,
      fg: 'rgb(' + fg.slice(0, 3).join(',') + ')', bg: 'rgb(' + bg.join(',') + ')',
    });
  }
  return out;
};

/* ── Arranque ─────────────────────────────────────────────────────────────── */
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('\n  Falta Playwright. Esta sonda arranca la app de verdad, así que lo necesita:\n');
  console.error('      npm i -D playwright && npx playwright install chromium\n');
  console.error('  No está en package.json a propósito: `npm ci` correría en el despliegue');
  console.error('  y se bajaría los navegadores en cada build.\n');
  process.exit(1);
}

/* Por `npx` y con `shell:true` a propósito: resolver el binario de vite a mano
   falla porque su package.json no exporta `./bin/vite.js`, y la ruta de
   `node_modules/.bin` cambia de nombre entre Windows y Linux. */
const vite = spawn('npx', ['vite', '--port', String(PUERTO)],
  { cwd: process.cwd(), stdio: 'ignore', shell: true });
const cerrar = () => { try { vite.kill(); } catch {} };
process.on('exit', cerrar); process.on('SIGINT', () => { cerrar(); process.exit(130); });

const esperar = async () => {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(URL); if (r.ok) return true; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
};
if (!await esperar()) { console.error('  El servidor de desarrollo no levantó en ' + URL); process.exit(1); }

/* ── Llevar la app a un estado representativo ─────────────────────────────── */
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1100, height: 1050 } })).newPage();
await page.goto(URL, { waitUntil: 'networkidle' });

/* Se rellena y se genera porque el panel de resultado —donde estaban casi todos
   los fallos— no existe en el DOM hasta que hay una oración. Auditar la pantalla
   inicial habría dado un verde que no significaba nada. */
await page.getByPlaceholder(/I, you, he, she/).fill('she');
await page.getByPlaceholder(/work, study, play/).fill('work');
await page.getByPlaceholder(/yesterday, at home/).fill('at home');
await page.getByRole('button', { name: /Selecciona un tiempo/ }).click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Presente Simple")').first().click();
await page.waitForTimeout(400);
// Con adverbio: añade la cuarta pieza y su fórmula, que es donde estaba el 2,04:1.
const adv = page.locator('select').filter({ hasText: 'Sin adverbio' }).first();
if (await adv.count()) { await adv.selectOption({ index: 1 }); await page.waitForTimeout(250); }
await page.getByRole('button', { name: 'Generar Oración' }).click();
await page.waitForTimeout(700);
await page.locator('button:has-text("Ver los 3 modos")').first().click();
await page.waitForTimeout(400);

/* ── Medir en los dos temas ───────────────────────────────────────────────── */
const revisado = (f) => REVISADOS.find(r => f.txt.includes(r.txt));
let fallos = 0, perdonados = 0;

for (const tema of ['claro', 'oscuro']) {
  if (tema === 'oscuro') {
    await page.locator('button:has-text("Oscuro")').first().click();
    await page.waitForTimeout(600);
  }
  const encontrados = await page.evaluate(AUDITOR);
  const nuevos = encontrados.filter(f => !revisado(f));
  perdonados += encontrados.length - nuevos.length;

  console.log(`\n── modo ${tema} ──`);
  if (!nuevos.length) console.log('   ✓ ningún elemento bajo AA');
  for (const f of nuevos.sort((a, b) => a.ratio - b.ratio)) {
    fallos++;
    console.log(`   ✗ ${String(f.ratio).padStart(5)}:1 (pide ${f.umbral})  ${f.px}px/${f.peso}  «${f.txt}»`);
    console.log(`       ${f.fg} sobre ${f.bg}`);
  }
}

await browser.close();
cerrar();

if (perdonados) console.log(`\n   ${perdonados} perdonado(s) por estar en REVISADOS`);
console.log(fallos ? `\n✗ ${fallos} elemento(s) bajo AA` : '\nCONTRASTE OK · lo que se ve, se lee');
process.exit(fallos ? 1 : 0);
