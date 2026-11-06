// The demo catalog behind the wall. Deterministic (seeded), so every visitor and every
// screenshot sees the same catalog. Classes and profit are invented for the illustration.
import atlas from './atlas.json';

export const PRODUCTS = atlas.products.length; // 19 demo products, slot 0 is the hero kurta
export const PRICES = ['₹999', '₹1,199', '₹1,399', '₹1,599', '₹1,799', '₹2,499', '₹2,899', '₹3,499'];
export const LABELS = ['Sale 30% off', 'Bestseller', 'New in'];
export const HERO_PRICE = 4; // ₹1,799

export const enum Cls { Winner = 0, Mid = 1, Waster = 2, SoldOut = 3 }
export const enum Label { None = 0, Sale = 1, Bestseller = 2, NewIn = 3 }

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

export function makeCatalog(cols: number, rows: number, seed = 1799): Catalog {
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
    let slot = 1 + Math.floor(rand() * (PRODUCTS - 1));
    if (rand() < 0.05) slot = 0; // a few more kurtas in other colours of the same print
    let label: Label;
    const lr = rand();
    if (k === Cls.Winner) label = lr < 0.7 ? Label.Bestseller : Label.NewIn;
    else if (k === Cls.Mid) label = lr < 0.38 ? Label.Sale : lr < 0.62 ? Label.NewIn : Label.None;
    else label = lr < 0.5 ? Label.Sale : Label.None;
    let price = Math.floor(rand() * PRICES.length);
    let missing = rand() < 0.32 ? 0.3 + rand() * 0.6 : 0;
    let isHero = 0;

    if (i === hero) {
      k = Cls.Winner; slot = 0; label = Label.Bestseller; price = HERO_PRICE; isHero = 1; missing = 0;
    }
    cls[i] = k;
    score[i] = k === Cls.SoldOut ? -1 : (k === Cls.Winner ? 3 : k === Cls.Mid ? 2 : 1) + rand();
    if (i === hero) score[i] = 3.94; // near the top, not first: it earns its place

    a[i * 4] = slot;
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

  return { cols, rows, count, hero, ranked, heroCell: [heroC, heroR], cell, sort, a, b };
}

/** One card of the catalog as the wall draws it: its product, its price and label, whether the
 *  feed is missing its title, whether its ad runs as a video, and its profit class. */
export type Sku = {
  index: number;
  slug: string;
  price: string;
  label: 'sale' | 'bestseller' | 'new' | null;
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
    label: label === Label.Sale ? 'sale' : label === Label.Bestseller ? 'bestseller' : label === Label.NewIn ? 'new' : null,
    missing: c.b[i * 4 + 1] > 0,
    // The same test the shader makes (shaders.ts, isVid): about four in ten ads run as video.
    video: hero || fract(f32(c.a[i * 4 + 3] * f32(13.71))) <= 0.42,
    cls: c.a[i * 4 + 1] as Cls,
  };
}

/** The one demo catalog every wall on the site shows (same on phones, so the counts hold). */
export const GRID = { cols: 72, rows: 66 } as const;

/** Counts for the story's key, read straight from the demo catalog. */
export function catalogStats(c: Catalog = makeCatalog(GRID.cols, GRID.rows)) {
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
