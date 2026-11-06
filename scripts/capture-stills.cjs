// Renders the static frames of the catalog wall from the live WebGL build, so visitors without
// WebGL or with reduced motion see the same pictures. Run against a production server:
//   npm run build && npx next start -p 4400 &  node scripts/capture-stills.cjs http://127.0.0.1:4400
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('path');

const base = process.argv[2] || 'http://127.0.0.1:4400';
const out = path.join(__dirname, '..', 'public', 'img', 'wall');
const STEPS = 6.3;
const HOLD = 0.7;
const chapters = ['ch-connect', 'ch-enrich', 'ch-design', 'ch-measure', 'ch-optimise'];
const args = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];

async function save(buf, name, width) {
  await sharp(buf).resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(out, name));
  console.log('wrote', name);
}

// Page chrome, the cookie card, the tap-a-card ring and hint, and copy that sits over a wall.
const hideUI = '.header, .lost__panel, .audit__copy, .skip-link, .consent, .wall__ring, .wall__hint { visibility: hidden !important; }';

// The results section's pair: spend scattered across the catalog, then spend on the sorted top.
// Both are cropped to the same box around the wall, so they line up side by side.
async function bounds(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  const [r0, g0, b0] = [data[0], data[1], data[2]]; // the band behind the wall, read from a corner
  for (let y = 0; y < info.height; y += 2) {
    for (let x = 0; x < info.width; x += 2) {
      const i = (y * info.width + x) * info.channels;
      if (Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0) > 24) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, w: info.width, h: info.height };
}

async function spendFrames(browser) {
  const shots = {};
  for (const which of ['before', 'after']) {
    const p = await browser.newPage({ viewport: { width: 2140, height: 1000 }, deviceScaleFactor: 2 });
    await p.addInitScript((w) => { window.__samoStill = w; }, which);
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: hideUI });
    await p.evaluate(() => { const r = document.querySelector('#results'); window.scrollTo(0, r.getBoundingClientRect().top + scrollY + 40); });
    await p.waitForSelector('.results__wall.is-live', { timeout: 60000 });
    await p.waitForTimeout(3000);
    shots[which] = await p.locator('.results__wall').screenshot();
    await p.close();
  }
  const b = await Promise.all(Object.values(shots).map(bounds));
  const pad = Math.round((Math.max(...b.map((r) => r.x1)) - Math.min(...b.map((r) => r.x0))) * 0.04);
  const left = Math.max(0, Math.min(...b.map((r) => r.x0)) - pad);
  const top = Math.max(0, Math.min(...b.map((r) => r.y0)) - pad);
  const width = Math.min(b[0].w, Math.max(...b.map((r) => r.x1)) + pad) - left;
  const height = Math.min(b[0].h, Math.max(...b.map((r) => r.y1)) + pad) - top;
  for (const [which, buf] of Object.entries(shots)) {
    const crop = await sharp(buf).extract({ left, top, width, height }).toBuffer();
    await save(crop, `${which}.webp`, 1200);
    await save(crop, `${which}-s.webp`, 720);
  }
  console.log('frame size', width, height, '->', 1200, Math.round((1200 * height) / width));
}

(async () => {
  require('fs').mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args });
  await spendFrames(browser);
  if (process.argv[3] === 'frames') { await browser.close(); return; }

  // Chapter frames: a wide viewport, cropped to the wall beside the copy panel (1.2 : 1).
  const page = await browser.newPage({ viewport: { width: 2140, height: 1000 } });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: hideUI });
  await page.waitForSelector('.wall--hero.is-live', { timeout: 60000 });
  await page.waitForTimeout(3600); // the opening pull-back and the panel have finished
  const clip = await page.evaluate(() => {
    const w = document.querySelector('.wall--hero').getBoundingClientRect();
    const height = w.height;
    const width = Math.round(height * 1.2);
    return { x: w.right - width, y: w.top, width, height };
  });
  // The hero after its pull-back, for the reduced-motion version of the hero.
  await save(await page.screenshot({ clip }), 'ch-hero.webp', 1200);
  for (let i = 0; i < chapters.length; i++) {
    await page.evaluate(([k, steps]) => {
      const s = document.querySelector('.line');
      window.scrollTo(0, s.offsetTop + ((k + 0.7) / (steps + 0.7)) * (s.offsetHeight - innerHeight));
    }, [i + 1, STEPS]);
    await page.waitForTimeout(2600);
    await save(await page.screenshot({ clip }), `${chapters[i]}.webp`, 1200);
  }
  await page.close();

  // The same two walls at phone size and 3x, where the live wall doesn't run (HeldWall.tsx): taken
  // on a wide-screen browser asked for the phone layout, so the picture is sharp on a phone.
  for (const [url, sel, name] of [['/audit', '.wall--audit', 'audit-m.webp'], ['/sold-out-page', '.wall--lost', 'lost-m.webp']]) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    await p.addInitScript(() => { window.__samoStill = 'phone'; try { localStorage.setItem('samo-consent', 'denied'); } catch {} });
    await p.goto(base + url, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: hideUI });
    await p.waitForSelector(`${sel}.is-live`);
    await p.waitForTimeout(2400);
    await save(await p.locator(sel).screenshot(), name, 1170);
    await p.close();
  }
  for (const [url, sel, name] of [['/audit', '.wall--audit', 'audit.webp'], ['/sold-out-page', '.wall--lost', 'lost.webp']]) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base + url, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: hideUI });
    await p.waitForSelector(`${sel}.is-live`);
    await p.waitForTimeout(2400);
    await save(await p.locator(sel).screenshot(), name, 1440);
    await p.close();
  }
  await browser.close();
})();
