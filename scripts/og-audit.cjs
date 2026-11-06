// Share image for /audit (public/og-audit.jpg), drawn like og.jpg: copy left, the wall right.
// Run: node scripts/og-audit.cjs   (needs Playwright; uses the audit page's own wall frame)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = process.env.SITE_ROOT || path.join(__dirname, '..');
const b64 = (p) => fs.readFileSync(path.join(root, p)).toString('base64');
const font = (w) => `url(data:font/woff2;base64,${b64(`node_modules/geist/dist/fonts/geist-sans/Geist-${w}.woff2`)}) format('woff2')`;

const html = `<!doctype html><html><head><style>
@font-face { font-family: G; font-weight: 400; src: ${font('Regular')}; }
@font-face { font-family: G; font-weight: 500; src: ${font('Medium')}; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #f6f6f3; color: #161616; font-family: G; display: grid; grid-template-columns: 1fr 520px; }
.copy { padding: 62px 0 64px 64px; display: flex; flex-direction: column; justify-content: space-between; }
.logo { width: 150px; }
h1 { font-size: 66px; line-height: 1.04; font-weight: 500; letter-spacing: -0.01em; max-width: 11ch; }
p { margin-top: 26px; font-size: 22px; line-height: 1.35; color: #5e5e5e; max-width: 26ch; }
.wall { position: relative; overflow: hidden; -webkit-mask-image: linear-gradient(to right, transparent, #000 110px); mask-image: linear-gradient(to right, transparent, #000 110px); }
/* The audit wall's right part: its left edge fades under the page's copy, so that part stays out of frame. */
.wall img { position: absolute; right: 0; top: 46px; height: 584px; width: auto; }
</style></head><body>
<div class="copy">
  <img class="logo" src="data:image/webp;base64,${b64('public/img/samo-logo.webp')}">
  <div><h1>A free feed audit, back in 48 hours.</h1><p>What we would fix first in your product feed and catalog ads.</p></div>
</div>
<div class="wall"><img src="data:image/webp;base64,${b64('public/img/wall/audit.webp')}"></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, 'public/og-audit.jpg'), type: 'jpeg', quality: 86 });
  await browser.close();
  console.log('wrote public/og-audit.jpg');
})();
