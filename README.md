# heysamo.com, rebuilt

The site is built around one idea: a brand's whole catalog sits on a single wall, and Samo works every SKU until the spend lands on the ones that earn. The home page is a pinned story. The wall starts as one product card and grows to 4,752. Then it picks up data, designs and video, gets measured, and re-sorts by profit so a blue band of funded SKUs ends up on top. The five chapters follow Samo's process: Connect, Enrich, Design, Measure, Optimise.

## Run it

You need Node.js 20.9 or newer.

```bash
npm ci               # installs the exact versions in package-lock.json
npm run build
npm start            # http://localhost:3000
```

If `NODE_ENV` is set to `production` on your machine, npm skips the dev packages the build needs (TypeScript and ESLint among them). Install with `npm ci --include=dev` in that case.

Use `npm run dev` while you edit, and `npm run lint` to check the code. Judge motion and speed on the production build, because the dev server is slower.

Pages: `/` (home), `/audit` (free feed audit), `/privacy`, `/terms`, `/data-deletion`, plus a 404 page, `sitemap.xml` and `robots.txt`.

## Stack

Next.js 16 (App Router) with React 19 and TypeScript. Motion is GSAP (ScrollTrigger, SplitText) with Lenis for smooth scrolling. The catalog wall is WebGL, drawn with OGL in a single instanced draw call. Next.js 16 changed some APIs, so check the docs in `node_modules/next/dist/docs/` before relying on older patterns.

## Where things live

- `src/data/site.ts`: every word on the site, plus the links. Edit copy here.
- `src/data/legal.ts`: the privacy, terms and data deletion text, copied word for word from the documents dated 7 October 2026. Change the source document first, then copy it again.
- `src/wall/`: the catalog wall.
  - `data.ts`: the seeded demo catalog (72 by 66 cards) and the counts shown in each chapter.
  - `shaders.ts`: how a tile is drawn.
  - `drive.ts`: the camera and wall state for each chapter.
  - `wall.ts`: the WebGL setup and render loop.
- `src/components/Line.tsx`: the pinned home story.
- `src/engine/`: smooth scrolling, page transitions and the in-view triggers that start CSS animations.
- `src/app/globals.css` and `src/app/graphics.css`: all styles.
- `public/img/`: the product atlas, the logo, and the still wall frames (`img/wall/`) that people see without WebGL or with reduced motion.
- `DESIGN.md`: the concept, palette, type and motion rules.

## Tool scripts

You only need these when the product photos or the wall change. They are not part of the site build, and `npm run lint` skips them.

`scripts/build_assets.py` rebuilds the product atlas and card images from the source photos. It needs Python 3 with numpy and Pillow (`pip install numpy pillow`). The source folder must hold `hero-kurta.png`, `sheet-a.png` and `sheet-b.png` (two 3 by 3 product sheets). Those photos are not in this repo, so ask for the `demo-product-photos` folder. Run it from the project root:

```bash
python3 scripts/build_assets.py <photo folder>
```

`scripts/capture-stills.cjs` re-renders the still wall frames from the live WebGL build. Install the browser once, then run it against a production server:

```bash
npx playwright install chromium
npm run build && npx next start -p 4400
node scripts/capture-stills.cjs http://127.0.0.1:4400   # in a second terminal
```

## Replace before launch

1. **Cookie banner.** The privacy policy in `legal.ts` says analytics and advertising cookies are set only after the visitor agrees in a cookie banner, and that a "Cookie preferences" link sits in the footer of every page. This site has neither. Add both, or change the policy to match what the site does.
2. **Results source.** The three figures in `results.stats` in `site.ts` (43%, 13%, 32%) show no source. Add the brand or category, the test setup, the time window and the baseline, or take the figures out.
3. **Founder call link** (`links.call`). It opens an email today. Swap in a calendar link when there is one.
4. **Audit form.** It opens a pre-filled email to hello@heysamo.com. Point `AuditForm.tsx` at a real endpoint (an API route or the CRM) when one exists.
5. **Audit checklist** (`audit.checks`). These come from what the privacy policy says Samo checks. Confirm them with the team.
6. **Product photos.** They are AI-generated demo products for a fictional "yourbrand". Swap in real catalog shots, then run both tool scripts.
7. **The wall's numbers** (4,752 SKUs, the funded and wasted counts) describe the demo catalog, not customer data. The page does not label them as a demo.

## Deploy

Any host that runs Node.js 20.9 or newer can run `npm run build` and then `npm start`. Vercel needs no setup: run `npx vercel --prod`. The current heysamo.com is served through Cloudflare. Running this app there needs a Next.js adapter, so check that one supports Next.js 16 before choosing that route.

The canonical URL is `site.url` in `site.ts` (https://heysamo.com).
