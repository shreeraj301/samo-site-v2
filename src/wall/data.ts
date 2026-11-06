// The demo catalog behind the wall. Deterministic (seeded), so every visitor and every
// screenshot sees the same catalog. Classes and profit are invented for the illustration.
import atlas from './atlas.json';
import { LABEL_KEYS, LABEL_TEXT, type AdLabel } from '@/data/products';

export const PRODUCTS = atlas.products.length; // 55 demo products; slot 0, the kurta, is the hero SKU's alone
export const PRICES = ['₹999', '₹1,199', '₹1,399', '₹1,599', '₹1,799', '₹2,499', '₹2,899', '₹3,499'];
export const LABELS = LABEL_KEYS.map((k) => LABEL_TEXT[k]);
export const HERO_PRICE = 4; // ₹1,799

export const enum Cls { Winner = 0, Mid = 1, Waster = 2, SoldOut = 3 }
// 0 is no label; the rest follow LABEL_KEYS (src/data/products.ts).
export const enum Label { None = 0, Sale = 1, Bestseller = 2, NewIn = 3, Flat = 4, Bundle = 5, Trending = 6, Low = 7, Restock = 8 }

export type Catalog = {
  cols: number;
  rows: number;
  count: number;
  hero: number; // index of the hero SKU
  ranked: number; // SKUs left after sold-out sizes leave
  heroCell: [number, number];
  cell: Float32Array; // catalog position (c, r)
  sort: Float32Array; // position after the sort (c, r)
  a: Float32Array; // slot, class, label, seed
  b: Float32Array; // price, missing, delay, isHero
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const made = new Map<string, Catalog>();

/** The catalog for a wall of this size (built once per page: every wall shares it). */
export function makeCatalog(cols: number, rows: number, seed = 1799): Catalog {
  const key = `${cols}x${rows}:${seed}`;
  let c = made.get(key);
  if (!c) made.set(key, (c = build(cols, rows, seed, true)));
  return c;
}

function build(cols: number, rows: number, seed: number, place: boolean): Catalog {
  const rand = mulberry32(seed);
  const count = cols * rows;
  const heroC = Math.floor(cols * 0.5) - 1;
  const heroR = Math.floor(rows * 0.5) - 1;
  const hero = heroR * cols + heroC;

  const cell = new Float32Array(count * 2);
  const sort = new Float32Array(count * 2);
  const a = new Float32Array(count * 4);
  const b = new Float32Array(count * 4);
  const score = new Float32Array(count);
  const cls = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    cell[i * 2] = c;
    cell[i * 2 + 1] = r;

    const roll = rand();
    let k: Cls = roll < 0.12 ? Cls.Winner : roll < 0.64 ? Cls.Mid : roll < 0.9 ? Cls.Waster : Cls.SoldOut;
    // Two draws that used to pick the product at random. Still taken, so every later draw (and so
    // the classes, labels, prices and every count the story shows) stays exactly as it was.
    rand();
    rand();
    let label: Label;
    const lr = rand();
    // Each label fits what the SKU does: proof and restocks on what sells best, low stock and
    // offers on what sells, the deeper offers on what spends without selling.
    if (k === Cls.Winner) label = lr < 0.45 ? Label.Bestseller : lr < 0.65 ? Label.Trending : lr < 0.85 ? Label.NewIn : Label.Restock;
    else if (k === Cls.Mid) label = lr < 0.26 ? Label.Sale : lr < 0.44 ? Label.NewIn : lr < 0.6 ? Label.Low : Label.None;
    else label = lr < 0.25 ? Label.Sale : lr < 0.4 ? Label.Flat : lr < 0.55 ? Label.Bundle : Label.None;
    let price = Math.floor(rand() * PRICES.length);
    let missing = rand() < 0.32 ? 0.3 + rand() * 0.6 : 0;
    let isHero = 0;

    if (i === hero) {
      k = Cls.Winner; label = Label.Bestseller; price = HERO_PRICE; isHero = 1; missing = 0;
    }
    cls[i] = k;
    score[i] = k === Cls.SoldOut ? -1 : (k === Cls.Winner ? 3 : k === Cls.Mid ? 2 : 1) + rand();
    if (i === hero) score[i] = 3.94; // near the top, not first: it earns its place

    a[i * 4 + 1] = k;
    a[i * 4 + 2] = label;
    a[i * 4 + 3] = rand();
    b[i * 4] = price;
    b[i * 4 + 1] = missing;
    b[i * 4 + 3] = isHero;
  }

  // Rank by profit. Sold-out SKUs leave the wall, so the sorted catalog is shorter.
  const order = Array.from({ length: count }, (_, i) => i)
    .filter((i) => cls[i] !== Cls.SoldOut)
    .sort((x, y) => score[y] - score[x]);
  const ranked = order.length;
  order.forEach((i, rank) => {
    sort[i * 2] = rank % cols;
    sort[i * 2 + 1] = Math.floor(rank / cols);
    // Sort verb: the top of the list fills first, rows slot in one after another.
    b[i * 4 + 2] = (rank / ranked) * 0.75 + rand() * 0.08;
  });
  for (let i = 0; i < count; i++) {
    if (cls[i] === Cls.SoldOut) {
      sort[i * 2] = cell[i * 2];
      sort[i * 2 + 1] = cell[i * 2 + 1];
      b[i * 4 + 2] = 0;
    }
  }

  if (place) {
    const slots = placeProducts(cols, rows, hero, order);
    for (let i = 0; i < count; i++) a[i * 4] = slots[i];
  }
  return { cols, rows, count, hero, ranked, heroCell: [heroC, heroR], cell, sort, a, b };
}

// Close-up screens show at most this many cards across and down (the hero frame, the audit
// page's raw wall, phones). Inside any block this size no product shows twice.
const APART = [6, 5] as const;
// How far around each card to look for copies (cards), to keep them spread on wider screens.
const LOOK = 6;

/** Which product each card shows. The hero SKU is the kurta and the only kurta. Every other card
 *  takes one of the other 54, chosen card by card along the catalog's rows: never a product already
 *  in its 6 x 5 block (so no close-up screen repeats one), and among the rest, the one whose
 *  nearest copy is farthest away, counted in the catalog and in the sorted wall alike (so on the
 *  wide screens copies are spread out and never touch). Deterministic: the same wall for everyone. */
function placeProducts(cols: number, rows: number, hero: number, order: number[]) {
  const count = cols * rows;
  const n = PRODUCTS - 1;
  const slot = new Int8Array(count).fill(-1);
  slot[hero] = 0;
  // Where each card sits after the sort, and which card sits at each sorted place.
  const sortAt = new Int32Array(count).fill(-1);
  const sorted = new Int32Array(count).fill(-1);
  order.forEach((i, rank) => { sortAt[i] = rank; sorted[rank] = i; });
  const banned = new Uint8Array(n + 1);
  const near = new Float32Array(n + 1);
  const ROW_W = 1.22 * 1.22; // a card is taller than wide: rows count a little farther apart
  const TIE = 4 / 2 ** 32; // a hash's share: up to 4 (squared cards) either way

  for (let i = 0; i < count; i++) {
    if (i === hero) continue;
    banned.fill(0);
    near.fill(1e9);
    const c0 = i % cols;
    const r0 = (i / cols) | 0;
    // The catalog: only the rows above and this row's left part are placed yet.
    for (let dr = -LOOK; dr <= 0; dr++) {
      const r = r0 + dr;
      if (r < 0) continue;
      const base = r * cols;
      const dy = dr * dr * ROW_W;
      const inBlock = -dr < APART[1];
      const last = dr === 0 ? -1 : LOOK;
      for (let dc = -LOOK; dc <= last; dc++) {
        const c = c0 + dc;
        if (c < 0 || c >= cols) continue;
        const s = slot[base + c];
        if (s < 1) continue;
        if (inBlock && dc > -APART[0] && dc < APART[0]) banned[s] = 1;
        const d = dc * dc + dy;
        if (d < near[s]) near[s] = d;
      }
    }
    // The sorted wall: placed cards can sit anywhere around it.
    const rank = sortAt[i];
    if (rank >= 0) {
      const sc = rank % cols;
      const sr = (rank / cols) | 0;
      for (let dr = -LOOK; dr <= LOOK; dr++) {
        const r = sr + dr;
        if (r < 0 || r >= rows) continue;
        const base = r * cols;
        const dy = dr * dr * ROW_W;
        for (let dc = -LOOK; dc <= LOOK; dc++) {
          const c = sc + dc;
          if (c < 0 || c >= cols) continue;
          const j = sorted[base + c];
          if (j < 0 || j === i) continue;
          const s = slot[j];
          if (s < 1) continue;
          const d = dc * dc + dy;
          if (d < near[s]) near[s] = d;
        }
      }
    }
    // Farthest nearest copy wins; a fixed hash of card and product breaks near-ties.
    let best = -1;
    let choice = 1;
    for (let s = 1; s <= n; s++) {
      if (banned[s]) continue;
      const v = near[s] + (Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(s, 0x85ebca6b)) * TIE;
      if (v > best) { best = v; choice = s; }
    }
    slot[i] = choice;
  }
  return slot;
}

/** One card of the catalog as the wall draws it: its product, its price and label, whether the
 *  feed is missing its title, whether its ad runs as a video, and its profit class. */
export type Sku = {
  index: number;
  slug: string;
  price: string;
  label: AdLabel;
  missing: boolean;
  video: boolean;
  cls: Cls;
};

const f32 = Math.fround;
const fract = (x: number) => f32(x - Math.floor(x));

export function skuAt(c: Catalog, i: number): Sku {
  const label = c.a[i * 4 + 2];
  const hero = c.b[i * 4 + 3] > 0.5;
  return {
    index: i,
    slug: atlas.products[c.a[i * 4]],
    price: PRICES[c.b[i * 4]],
    label: label > 0 ? LABEL_KEYS[label - 1] : null,
    missing: c.b[i * 4 + 1] > 0,
    // The same test the shader makes (shaders.ts, isVid): about four in ten ads run as video.
    video: hero || fract(f32(c.a[i * 4 + 3] * f32(13.71))) <= 0.42,
    cls: c.a[i * 4 + 1] as Cls,
  };
}

/** The one demo catalog every wall on the site shows (same on phones, so the counts hold). */
export const GRID = { cols: 72, rows: 66 } as const;

/** Counts for the story's key, read straight from the demo catalog. */
export function catalogStats(c: Catalog = build(GRID.cols, GRID.rows, 1799, false)) {
  let missing = 0, winners = 0, wasters = 0, soldOut = 0;
  for (let i = 0; i < c.count; i++) {
    if (c.b[i * 4 + 1] > 0) missing++;
    const k = c.a[i * 4 + 1];
    if (k === Cls.Winner) winners++;
    else if (k === Cls.Waster) wasters++;
    else if (k === Cls.SoldOut) soldOut++;
  }
  return { total: c.count, missing, winners, wasters, soldOut };
}
