// Runtime text texture for the wall: product names, prices and ad labels, set in Geist once
// the font has loaded. One row per string, white on transparent; the shader colours it.
import atlas from './atlas.json';
import { LABELS, PRICES } from './data';
import { NAMES } from '@/data/products';


// Two columns of rows, so 55 product names, the prices and the labels fit in a texture no taller
// than phones allow (2048 x 3456). Strings are numbered down the left column, then the right.
export const TEXT_COLS = 2;
export const TEXT_ROWS = 36; // rows per column
export const ROWS = TEXT_COLS * TEXT_ROWS; // every string slot; a multiple of 4 (widths pack into vec4s)
export const ROW_H = 96; // tall rows keep the close-up frames crisp on 2x and 3x screens
export const TEX_W = 1024; // one column's width
export const TEXT_ASPECT = TEX_W / ROW_H;
export const ROW = {
  name: 0,
  price: atlas.products.length,
  label: atlas.products.length + PRICES.length,
  missing: atlas.products.length + PRICES.length + LABELS.length, // "Title missing": a feed error
};
if (ROW.missing >= ROWS) throw new Error('labels.ts: more strings than text rows');

export function productName(slot: number) {
  return NAMES[atlas.products[slot]] ?? '';
}

/** Draws every string. Returns the canvas and each string's width as a fraction of a column (TEX_W). */
export function makeLabelCanvas(fontFamily: string) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W * TEXT_COLS;
  canvas.height = TEXT_ROWS * ROW_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  const widths: number[] = [];
  const draw = (text: string, row: number, weight: number) => {
    ctx.font = `${weight} 60px ${fontFamily}`;
    const col = Math.floor(row / TEXT_ROWS);
    ctx.fillText(text, col * TEX_W + 2, (row - col * TEXT_ROWS) * ROW_H + ROW_H / 2 + 3);
    widths[row] = Math.min(1, (ctx.measureText(text).width + 4) / TEX_W);
  };
  atlas.products.forEach((slug, i) => draw(NAMES[slug] ?? slug, ROW.name + i, 500));
  PRICES.forEach((p, i) => draw(p, ROW.price + i, 400));
  LABELS.forEach((l, i) => draw(l, ROW.label + i, 500));
  draw('Title missing', ROW.missing, 500);
  for (let r = 0; r < ROWS; r++) widths[r] ??= 0;
  return { canvas, widths };
}
