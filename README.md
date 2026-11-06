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
- `src/components/Pitch.tsx` and `src/engine/beats.ts`: pitch mode (see below).
- `public/sw.js` and `src/components/Offline.tsx`: the offline kit. `src/app/manifest.ts`: the home-screen app.
- `src/app/api/audit/route.ts` and `src/components/AuditForm.tsx`: the audit request (see Settings).
- `src/analytics/` and `src/components/Consent.tsx`: GA4 and the cookie banner (see Settings).
- `src/app/globals.css` and `src/app/graphics.css`: all styles.
- `public/img/`: the product atlas, the logo, and the still wall frames (`img/wall/`) that people see without WebGL or with reduced motion.
- `DESIGN.md`: the concept, palette, type and motion rules.

## Pitch mode, home screen and offline

Pitch mode turns the home page into a row of stops for showing Samo on a phone (14 to 16, depending on the screen): the hero, the five steps, the reel, results before and after, the whole line, the statement, the report, the tools and the call to action. Tap the right side of the screen for the next stop and the left third to go back. On a laptop, use the arrow keys, Page Up and Page Down, Space or a presentation clicker. Each move glides at an even pace, so the pinned scenes play through on the way, and normal scrolling still works.

- Open the site with `?pitch` to switch it on in a browser (`?pitch=0` switches it off). The choice lasts for that tab.
- Added to a phone's home screen, the site opens full screen as its own app with pitch mode already on.
- The page keeps its normal layout. When a stop lands, anything the screen edge would cut fades out, and it comes back as soon as the page moves.
- Offline: on production builds a service worker keeps what each visit loads. In pitch mode it also saves every page and everything they use, so after one visit on good Wi-Fi the whole pitch works with no signal. Ordinary visitors never download more than they view.
- The home screen app and the offline kit need the live HTTPS site (or `localhost`). Over plain HTTP from a laptop on the same Wi-Fi, pitch mode still works with `?pitch`.
- Change `VERSION` in `public/sw.js` to clear every phone's saved copy.
- Add `?fps` to the address (`/?fps`, or `/?pitch&fps`) to show a small readout on any phone: frame rate, the longest recent frame, and each wall's resolution and measured cost. Use it to compare phones.

## Tool scripts

You only need these when the product photos or the wall change. They are not part of the site build, and `npm run lint` skips them.

`scripts/build_assets.py` rebuilds the product atlas and card images from the source photos. It needs Python 3 with numpy and Pillow (`pip install numpy pillow`). The source folder must hold `hero-kurta.png`, `sheet-a.png` and `sheet-b.png` (two 3 by 3 product sheets). Those photos are not in this repo, so ask for the `demo-product-photos` folder. Run it from the project root:

```bash
python3 scripts/build_assets.py <photo folder>
```

`scripts/og-audit.cjs` redraws the audit page's share image (`public/og-audit.jpg`): `node scripts/og-audit.cjs`.

`scripts/capture-stills.cjs` re-renders the still wall frames from the live WebGL build. Install the browser once, then run it against a production server:

```bash
npx playwright install chromium
npm run build && npx next start -p 4400
node scripts/capture-stills.cjs http://127.0.0.1:4400   # in a second terminal
```

## Settings (environment variables)

Set these in Vercel (Project, Settings, Environment Variables), or in `.env.local` on a laptop. None is needed to run the site: each feature falls back as described.

| Name | What it does | Without it |
|---|---|---|
| `RESEND_API_KEY` | Audit requests are emailed to the team through Resend, with the visitor as reply-to. Verify heysamo.com in Resend first. | The form opens the visitor's email app, filled in. |
| `AUDIT_TO` | Where audit requests go. | hello@heysamo.com |
| `AUDIT_FROM` | The sender on those emails. | Samo website, audit@heysamo.com |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID (G-...). Turns on the cookie banner and the footer's Cookie preferences. Google's script loads only after the visitor allows it, and never in pitch mode. `G-PREVIEW` shows the banner without loading Google, for review. | No banner, no analytics. |

Events sent to GA4: `book_call_click` and `audit_click` (with `place`: header, hero, footer, page), `generate_lead` (an audit request went through) and `sku_peek` (someone opened a card on the wall). Mark `generate_lead` and `book_call_click` as key events in GA4.

Social links: tag every link you post with UTM parameters, for example `https://heysamo.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch-reel`. GA4 reports them, and each audit request email says where the visitor came from.

## For the sales team: the site as an app on your phone

1. Open heysamo.com on the phone, on good Wi-Fi.
2. iPhone: Safari, Share, Add to Home Screen. Android: Chrome, the three-dot menu, Add to Home screen (or Install app).
3. Open it once from the home screen while still on Wi-Fi. From then on it opens full screen in pitch mode, and the pitch works with no signal.
4. In a meeting: tap the right side of the screen to go forward, the left third to go back.

## Replace before launch

1. **Founder call link** (`links.call`). It opens an email today. Swap in a calendar link when there is one.
2. **Results source** (`results.source` in `site.ts`). The three figures (43%, 13%, 32%) show no source. Fill in the brand or category, the test setup and the time window, and it appears under the numbers. Or take the figures out.
3. **Audit sending** and **analytics**: set the variables above.
4. **Audit checklist** (`audit.checks`). These come from what the privacy policy says Samo checks. Confirm them with the team.
5. **Product photos.** They are AI-generated demo products for a fictional "yourbrand". Swap in real catalog shots, then run both tool scripts.
6. **The wall's numbers** (4,752 SKUs, the funded and wasted counts) describe the demo catalog, not customer data. The page does not label them as a demo.
7. **Privacy policy.** It names PostHog and the Meta Pixel as well as Google Analytics. The site loads only GA4 (after consent). Trim the policy, or add those tools to the banner when you start using them.

## Deploy

Any host that runs Node.js 20.9 or newer can run `npm run build` and then `npm start`. Vercel needs no setup: run `npx vercel --prod`. The current heysamo.com is served through Cloudflare. Running this app there needs a Next.js adapter, so check that one supports Next.js 16 before choosing that route.

The canonical URL is `site.url` in `site.ts` (https://heysamo.com).
