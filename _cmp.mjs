import { spawn } from 'node:child_process';
const { chromium } = await import('playwright');
const P = 5192, url = `http://localhost:${P}`;
const vite = spawn('npx', ['vite','--port',String(P),'--strictPort'], { cwd: process.cwd(), stdio:'ignore', shell:true });
let vivo=false; for (let i=0;i<60&&!vivo;i++){ try{ vivo=(await fetch(url)).ok; }catch{} if(!vivo) await new Promise(r=>setTimeout(r,500)); }
const b = await chromium.launch();
for (const w of [1100, 900, 768, 600, 430, 375]) {
  const p = await (await b.newContext({ viewport:{width:w, height:300} })).newPage();
  await p.goto(url,{waitUntil:'networkidle'});
  await p.waitForTimeout(300);
  const rep = await p.locator('button[title*="eportar"], button:has-text("Reportar")').first().boundingBox();
  const h1 = await p.locator('h1').first().boundingBox();
  console.log(`  ${String(w).padStart(4)}px → Reportar y=${Math.round(rep.y)} · título y=${Math.round(h1.y)} ${rep.y > h1.y + h1.height ? '· DEBAJO' : '· misma línea'}`);
  if (w === 375) await p.screenshot({ path: '_gm_375.png' });
}
await b.close(); vite.kill(); process.exit(0);
