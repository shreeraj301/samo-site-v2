// Runtime text texture for the wall: product names, prices and ad labels, set in Geist once
// the font has loaded. One row per string, white on transparent; the shader colours it.
import atlas from './atlas.json';
import { LABELS, PRICES } from './data';
import { NAMES } from '@/data/products';


export const ROWS = 32;
export const ROW_H = 96; // tall rows keep the close-up frames crisp on 2x and 3x screens
export const TEX_W = 1024;
export const TEXT_ASPECT = TEX_W / ROW_H;
export const ROW = {
  name: 0,
  price: atlas.products.length,
  label: atlas.products.length + PRICES.length,
  missing: atlas.products.length + PRICES.length + LABELS.length, // "Title missing": a feed error
};

export function productName(slot: number) {
  return NAMES[atlas.products[slot]] ?? '';
}

/** Draws every string. Returns the canvas and each string's width as a fraction of TEX_W. */
export function makeLabelCanvas(fontFamily: string) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = ROWS * ROW_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  const widths: number[] = [];
  const draw = (text: string, row: number, weight: number) => {
    ctx.font = `${weight} 60px ${fontFamily}`;
    ctx.fillText(text, 2, row * ROW_H + ROW_H / 2 + 3);
    widths[row] = Math.min(1, (ctx.measureText(text).width + 4) / TEX_W);
  };
  atlas.products.forEach((slug, i) => draw(NAMES[slug] ?? slug, ROW.name + i, 500));
  PRICES.forEach((p, i) => draw(p, ROW.price + i, 400));
  LABELS.forEach((l, i) => draw(l, ROW.label + i, 500));
  draw('Title missing', ROW.missing, 500);
  for (let r = 0; r < ROWS; r++) widths[r] ??= 0;
  return { canvas, widths };
}
