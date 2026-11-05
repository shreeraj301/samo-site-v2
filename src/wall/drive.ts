// Shared driver helpers: keyframes in "wall state" space, interpolated with the zoom in log
// space so a pull-back from one SKU to thousands feels even all the way.
import type { Wall, WallState } from './wall';
import { PITCH } from './shaders';
import { idle } from '@/motion/idle';

export type Key = Omit<WallState, 'hole'>;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixKey(a: Key, b: Key, t: number): Key {
  return {
    scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), t)),
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    connect: lerp(a.connect, b.connect, t),
    data: lerp(a.data, b.data, t),
    design: lerp(a.design, b.design, t),
    video: lerp(a.video, b.video, t),
    measure: lerp(a.measure, b.measure, t),
    sort: lerp(a.sort, b.sort, t),
    fund: lerp(a.fund, b.fund, t),
  };
}

/** The story's keyframes for a given wall size. 0 = hero, 1..5 = connect, enrich, design (photo
 *  and video), measure, optimize; 6 = the push-in on the funded hero SKU. */
export function storyKeys(w: Wall, mobile: boolean) {
  const [hx, hy] = w.heroWorld();
  const tiles = (n: number) => w.scaleForTiles(n);
  const fit = w.fitScale(0.94);
  const emptyRows = w.catalog.rows - Math.ceil(w.catalog.ranked / w.catalog.cols);
  const sortedCy = -(emptyRows * PITCH[1]) / 2;
  const base: Key = { scale: 1, cx: hx, cy: hy, connect: 1, data: 0, design: 0, video: 0, measure: 0, sort: 0, fund: 0 };
  const done = { data: 1, design: 1, video: 1 };
  // Where the hero SKU lands after the sort: the last beat pushes in on it, inside the blue band.
  const h = w.catalog.hero;
  const [sx, sy] = w.cellWorld(w.catalog.sort[h * 2], w.catalog.sort[h * 2 + 1]);
  const hero = mobile ? heroFrame(w, hx, hy) : { scale: tiles(4.2), cx: hx, cy: hy, fade: w.fade };
  return {
    // First frame: the one kurta fills the screen, nothing else connected yet.
    introStart: { ...base, scale: w.scaleForHeight(mobile ? 0.62 : 0.74), connect: 0 },
    // How much of the wall's lower edge dissolves on the hero frame (css px).
    heroFade: hero.fade,
    keys: [
      { ...base, scale: hero.scale, cx: hero.cx, cy: hero.cy, connect: 0.16 },
      // Connect pulls back while the catalog streams in; Enrich leans in to read the titles.
      { ...base, scale: tiles(mobile ? 5 : 8.5), connect: 1 },
      { ...base, scale: tiles(mobile ? 4 : 6.4), data: 1 },
      { ...base, scale: tiles(mobile ? 7 : 13), ...done },
      // Phones see part of the wall a little closer, so tiles stay readable as tiles.
      { ...base, scale: fit * (mobile ? 1.6 : 1), cx: 0, cy: 0, ...done, measure: 1 },
      mobile
        ? { ...base, ...pushIn(w, 0, -1e3, fit * 1.6), ...done, measure: 1, sort: 1, fund: 1 }
        : { ...base, scale: fit, cx: 0, cy: sortedCy, ...done, measure: 1, sort: 1, fund: 1 },
      { ...base, ...pushIn(w, sx, sy, tiles(mobile ? 7 : 16)), ...done, measure: 1, sort: 1, fund: 1 },
    ] as Key[],
  };
}

/** Phones: the hero frame shows whole cards only. Five, six or seven across, whichever leaves the
 *  least of a row hanging off the bottom; columns sit between the screen edges, and the first
 *  whole row starts right under the header with the hero SKU's row in the middle. What is left
 *  of the next row dissolves into the copy panel. */
function heroFrame(w: Wall, hx: number, hy: number) {
  let best = { n: 5, scale: w.scaleForTiles(5), rows: 1, rest: 1 };
  for (const n of [5, 6, 7]) {
    const scale = w.scaleForTiles(n);
    const rows = w.visH / (PITCH[1] * scale);
    const rest = rows - Math.floor(rows);
    if (rows >= 1 && rest < best.rest) best = { n, scale, rows, rest };
  }
  const { n, scale, rows, rest } = best;
  const gap = (PITCH[1] - 1.25) / 2;
  const above = Math.floor((Math.floor(rows) - 1) / 2);
  return {
    scale,
    // An even count puts the hero SKU just left of centre, so the outer cards stay whole.
    cx: hx + (n % 2 ? 0 : PITCH[0] / 2),
    cy: hy - above * PITCH[1] - 0.625 - gap + w.visH / 2 / scale,
    fade: Math.max(12, rest * PITCH[1] * scale),
  };
}

/** Frame the hero SKU's new place with the top of the wall just inside the top edge. */
function pushIn(w: Wall, sx: number, sy: number, scale: number) {
  const halfW = w.visW / 2 / scale;
  const halfH = w.visH / 2 / scale;
  const [left, top] = w.cellWorld(0, 0);
  const [right] = w.cellWorld(w.catalog.cols - 1, 0);
  // A wall narrower than the screen sits in the middle; a wider one follows the SKU but never
  // shows past its own edge.
  const cx = right - left + 1 <= halfW * 2 ? 0 : Math.min(Math.max(sx, left - 0.5 + halfW), right + 0.5 - halfW);
  const cy = Math.max(sy, top - 0.625 + halfH - 0.9);
  return { scale, cx, cy };
}

/** A pinned state for pages that hold one moment of the story (audit, 404). */
export function holdKey(w: Wall, which: 'measure' | 'raw', mobile: boolean): Key {
  const [hx, hy] = w.heroWorld();
  if (which === 'raw') return { scale: w.scaleForTiles(mobile ? 4.2 : 7), cx: hx, cy: hy, connect: 1, data: 0, design: 0, video: 0, measure: 0, sort: 0, fund: 0 };
  return { scale: w.scaleForTiles(mobile ? 9 : 14), cx: hx, cy: hy, connect: 1, data: 1, design: 1, video: 1, measure: 1, sort: 0, fund: 0 };
}

/** Idle input: the camera breathes a few pixels with the pointer and a slow clock. */
export function withIdle(s: Key): Key {
  const px = 1 / s.scale;
  return {
    ...s,
    cx: s.cx + idle.x * 16 * px + Math.sin(idle.t * 0.21) * 4 * px,
    cy: s.cy + idle.y * 12 * px + Math.cos(idle.t * 0.17) * 3 * px,
  };
}
