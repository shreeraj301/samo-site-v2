# Samo site: design record

## Brief
- Subject: Samo (heysamo.com) by Acuai Labs. Managed catalog-ads service plus product for enterprise brands with 5k to 10k+ SKUs.
- Audience: performance marketing leads and founders at large-catalog D2C brands (India first, prices in ₹).
- Job: book a call with the founder, or request the free feed audit (48 hours).
- Facts used (all from the live site or the owner): the line (feed, design, video, measure, spend), channels (Meta, Google, ChatGPT), stack (Shopify, Meta, GMC, ChatGPT, GA4, Claude, Slack, WhatsApp), results 43% ROAS / 13% CTR / 32% cost per purchase, performance plan (pay only if ROAS improves), hello@heysamo.com.
- Assumptions (placeholder: true in src/data/site.ts): results source line, audit checklist contents, founder calendar link (falls back to email), wall SKU count is illustrative.

## Concept card
```
Idea:        Your whole catalog on one wall, and Samo works every SKU until the spend lands on the ones that earn.
Metaphor:    a catalog being re-ranked: thousands of product cards that get data, designs, video, a profit number, then a new order.
Signature:   The sort. One driver (scroll through the line) moves ~4,800 instanced tiles from catalog order to profit order; the top band turns Samo blue. Opens on one readable SKU and pulls back to thousands.
Emotion:     "Oh. That's my catalog." Calm, exact, a little vertigo at the scale.
Motion verb: sort. Straight paths, decisive stops, no bounce, things slot into rows.
Screenshot:  the sorted wall: a dense field of tiny ads, the funded rows in blue at the top, the grey tail below, the sold-out holes.
```
Runner-up borrowed: "One SKU, one week" gives the hero its single SKU (the block-print kurta) that we follow into the sort.

## Rules from the owner (override skill defaults)
Samo slop list: no eyebrows, tags, italic words, Instrument Serif, negative tracking, dividers, bordered containers, diagrams, section numbering, code breadcrumbs, tracked uppercase, multiple tints or opacities, excess text. Concentric radii. Smooth subtle premium hover on clickable cards. Product name is always "Samo".
- Display tracking is 0 everywhere (skill default of negative tracking overridden).
- Labels Sale / Bestseller / New in appear only inside the demo ads, because they are the product.

## Palette (solid colours only)
| Role | Hex | Use |
|---|---|---|
| ground | #F6F6F3 | page |
| ink | #161616 | text, 15.9:1 on ground |
| muted | #5E5E5E | secondary text, 6.0:1 on ground |
| raised | #ECECE8 | secondary button fill, form fields |
| accent | #0C48A7 | Samo blue: funded tiles, primary CTA, focus ring, curtain |
| highlight | #4DD99A | mint, rare: logo layer, the funded band's leading edge |
Demo brand ("yourbrand", inside ads only): sand #EFE8DD, sale red #B9382A, ink labels.

## Type
Geist only (brand typeface), weights 400 and 500. Tracking 0. Display leading 1.0, body 1.5.
Scale: --t-xl clamp(2.5rem→5.25rem), --t-l clamp(1.75rem→2.75rem), --t-m 1.25→1.5rem, body 1→1.125rem, --t-s 0.875rem.
Numbers: tabular figures for results.

## Grid and rhythm
12 columns, gutter clamp(16px, 2vw, 32px), margins = gutter. Text hangs from column 1; the wall owns columns 5 to 12 (right bleed). Section moods: line = pinned full viewport; results = airy; statement = normal; stack = tight; footer = full viewport.

## Shape
Radius 10px on buttons and fields; nested elements use radius minus padding. Tiles: 3% of tile width.
Button layer offset: 4px (3px in the header), equal x and y, like the logo's extrusion.

## Motion language
- Eases: expo.out (entrances), expo.inOut (curtain), power3.out (hover). Hover 0.35 to 0.5 s, chapter swap 0.7 s, curtain 0.8 s each way.
- Buttons are built like the logo (owner's request): a face over a blue layer over a mint layer, each with the logo's hairline ink outline, offset down-right. Primary = white face + blue + mint, used only for the main action. Secondary = a quiet flat fill whose label slots up one row (an uncoloured stack was tried and rejected by the owner). Hover presses the face half way into the stack, a click lands it on the first layer. Nav: underline draws.
- Inline links: underline at rest that rises.
- Page transition: six blue rows slot in from the left with a 40 ms stagger, cover, then slot out to the right.
- Chapter choreography: the count's digit reels roll to the new figure (55 ms stagger left to right), its label slots in, then the heading and body slot up. Under a thousand, the empty thousands reel and comma slide out to the left.
- Results count up from zero once, on first view (real figures only).
- Inline links: an underline at rest; a mint band rises under the words on hover.
- Secondary (quiet) buttons: hover turns the fill into the stack's white face with the hairline, and the label rolls.
- The footer CTA lifts into the logo on hover: white face, ink hairline, blue then mint layers.
- The wall's bottom edge dissolves into the page (in the shader, not a CSS mask), so a row is never cut.
- Scroll: Lenis (lerp 0.15) on the GSAP ticker is the only smoothing. The wall, the count and the copy read the same scroll position in the same frame; nothing re-smooths it.
- The Samo line (reel): products travel left to right through a blue and mint line; two stacked copies of the strip are clipped either side of it, so a card turns from catalog card into ad column by column while only transforms change. Its 9:16 and 1:1 versions slide out once it is through. Scroll speeds it up, hover slows it, touch drags it.
- In-view graphics (whole line, report, stack pass) play once with CSS transitions when `.is-in` lands; their loops rest while off screen (`.is-vis`).
- Idle: the wall breathes (video tiles keep playing, the funded band's mint edge travels, a slow 0.5% camera drift with the pointer). Off screen: paused. Reduced motion: still.

## Composition
```
HOME
[header: wordmark ........ How it works · Free feed audit · (Book a call)]
LINE (sticky stage, ~600svh)
  opening: one kurta fills the screen, the camera pulls back as the catalog streams in,
           then the copy panel slides in over the left five columns (bottom half on phones)
  the wall fills the whole stage; the camera centres the story in the part still showing
  steps: Connect · Enrich · Design (photo and video) · Measure · Optimize, then a push-in
  panel: step rail (a line fills under the active step) · rolling count · one headline
REEL (Samo blue band)   title · strip through the white/mint line, edge to edge
RESULTS (ink band)      pinned: title, Before/With Samo, 43% 13% 32% | live wall, spend scattered → sorted
WHOLE LINE              title · one kurta through the five steps, edge to edge · tool spans · Samo bar with logo
STATEMENT + REPORT      centred statement · the weekly SKU report card, built like the logo
STACK                   title · Data in (logos) | Samo logo + one SKU through the line | Ads out, Reports (logos)
FOOTER                  "Book a call with the founder" across the full width · audit button · small print
/privacy /terms /data-deletion   big title · date · sticky contents | the document, copied word for word
```
No grey explainer paragraphs anywhere: headlines, counts and graphics carry the meaning.
Mobile: the wall fills the stage and the copy panel covers its lower half; the step rail stays one line; results pin with the wall on top; the whole line turns on its side.

## Genericness test (what changed)
- Centered hero over illustration → split stage where the hero IS the product (a real catalog card that becomes a catalog).
- Numbered 01 to 05 feature cards → one continuous object performing each step.
- Integration card grid → three-column index by direction of data.
- Stat row with fake-looking source → the source line is real data in the content file, flagged until filled.

## Decisions
- No loader: the wall's pull-back is the intro (under 2 s). LCP is the H1.
- No-GL and reduced motion: chapters stack as normal sections, each with a static rendered wall frame.

## Build notes
- The wall renders on a transparent canvas, adapts its resolution when frames run long (down to 0.5x), pauses off screen.
- Header and 404 panel backgrounds are 0.995 alpha on purpose: an opaque layer over the WebGL canvas trips occlusion culling in software compositors and drops a strip of the canvas.
- Static frames of the wall (public/img/wall) come from scripts/capture-stills.cjs; re-run it after changing the wall. `node scripts/capture-stills.cjs <url> frames` renders only the results pair (before.webp, after.webp).
- HTML ad cards are drawn cheaply on purpose: ads use the photo pre-multiplied onto sand (p-<slug>-sand.webp, made by build_assets.py), so cards need no blend mode, no isolation and no clipping. With blend modes and clipped corners, the reel's first raster cost a 50 ms frame on an RTX 3060 at 165 Hz; without them it is one or two dropped frames.
- Wall steps cross each tile as a wipe (left to right, with a thin mint edge), never a crossfade, so a tile never shows two states at once.
- In-view sections: triggers are re-measured after any late page hook (the pinned results band changes heights below it); without that, in-view motion fired early and loops stayed paused.
- Stack wires are small software canvases, not stroked SVG paths: the first stroked path on a page made the GPU build its path pipeline mid-scroll (an 80 ms frame on an RTX 3060).
- Thumbnails (report, wire cards) use 160 px images (p-<slug>-t.webp, p-<slug>-sand-t.webp).

