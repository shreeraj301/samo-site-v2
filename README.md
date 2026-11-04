# heysamo.com, rebuilt

The site is built around one idea: a brand's whole catalog sits on a single wall, and Samo works every SKU until the spend lands on the ones that earn. The home page is a pinned story. The wall goes from one product card to 4,752 cards, picks up data, designs and video, gets measured, and then re-sorts by profit so a blue band of funded SKUs ends up on top.

## Run it

```bash
npm install
npm run build
npm start            # http://localhost:3000
```

Use `npm run dev` while you edit. Always judge motion and speed on the production build.

## Where things live

- `src/data/site.ts`: every word on the site, plus the links. Edit copy here.
- `src/wall/`: the catalog wall, built in WebGL.
  - `data.ts`: the seeded demo catalog and the counts shown in each chapter.
  - `shaders.ts`: how a tile is drawn.
  - `drive.ts`: the camera and state for each chapter.
- `src/components/Line.tsx`: the pinned home story.
- `public/img/`: the product atlas, the logo, and the static wall frames (`img/wall/`) that people see without WebGL or with reduced motion.
- `scripts/build_assets.py`: rebuilds the product atlas from the source photos.
- `scripts/capture-stills.cjs`: re-renders the static wall frames (chapters, results pair, audit, 404). Run it against a production server after you change the wall.
- `src/data/legal.ts`: the privacy, terms and data deletion text, copied word for word from the documents dated 7 October 2026. Change the source document first, then copy it again.
- `DESIGN.md`: the concept, palette, type and motion rules.

## Replace before launch

1. **Results source** (`results.source` in `site.ts`). Add the brand or category, the test setup, the time window and the baseline. The site currently says the source is still to be added.
2. **Founder call link** (`links.call`). It opens an email today. Swap in a calendar link when you have one.
3. **Audit form.** It opens a pre-filled email to hello@heysamo.com. Point `AuditForm.tsx` at a real endpoint (an API route or your CRM) when one exists.
4. **Audit checklist** (`audit.checks`). These are inferred from what Samo does, so confirm them with the team.
5. **Product photos.** They are AI-generated demo products for a fictional "yourbrand". Swap in real catalog shots, then run `python3 scripts/build_assets.py <photo folder>` and `scripts/capture-stills.cjs`.
6. **The wall's numbers** (4,752 SKUs, 549 funded and so on) describe the demo catalog. A caption on the wall says it is an example. The numbers are not customer data.

## Deploy

Vercel works with zero configuration: run `npx vercel --prod`. The canonical URL is `site.url` in `site.ts` (https://heysamo.com).
