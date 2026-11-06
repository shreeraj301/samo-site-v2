// Share image for the home page (public/og.jpg): the headline left, the sorted wall right (the
// funded rows in blue on top). Run after capture-stills.cjs: node scripts/og.cjs
// (needs Playwright; crops the wall out of public/img/wall/ch-optimise.webp).
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = process.env.SITE_ROOT || path.join(__dirname, '..');
const file = (p) => path.join(root, p);
const b64 = (p) => fs.readFileSync(file(p)).toString('base64');
const font = (w) => `url(data:font/woff2;base64,${b64(`node_modules/geist/dist/fonts/geist-sans/Geist-${w}.woff2`)}) format('woff2')`;

// The wall without the page around it: everything that differs from the corner's colour.
async function wallOnly(src) {
  const { data, info } = await sharp(file(src)).raw().toBuffer({ resolveWithObject: true });
  const c = [data[0], data[1], data[2]];
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (Math.abs(data[i] - c[0]) + Math.abs(data[i + 1] - c[1]) + Math.abs(data[i + 2] - c[2]) > 30) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return sharp(file(src)).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
}

(async () => {
  const wall = (await wallOnly('public/img/wall/ch-optimise.webp')).toString('base64');
  const html = `<!doctype html><html><head><style>
@font-face { font-family: G; font-weight: 400; src: ${font('Regular')}; }
@font-face { font-family: G; font-weight: 500; src: ${font('Medium')}; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #f6f6f3; color: #161616; font-family: G; position: relative; }
.logo { position: absolute; left: 64px; top: 58px; width: 150px; }
.copy { position: absolute; left: 64px; bottom: 58px; width: 540px; }
h1 { font-size: 57px; line-height: 1.04; font-weight: 500; }
p { margin-top: 22px; font-size: 21px; line-height: 1.35; color: #5e5e5e; }
.wall { position: absolute; left: 637px; top: 46px; width: 530px; }
</style></head><body>
<img class="logo" src="data:image/webp;base64,${b64('public/img/samo-logo.webp')}">
<div class="copy"><h1>Put your ad spend on the SKUs that make you money.</h1><p>Catalog ads for brands with thousands of products.</p></div>
<img class="wall" src="data:image/png;base64,${wall}">
</body></html>`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file('public/og.jpg'), type: 'jpeg', quality: 86 });
  await browser.close();
  console.log('wrote public/og.jpg');
})();
