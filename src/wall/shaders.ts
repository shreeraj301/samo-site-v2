// The catalog wall: one instanced quad per SKU. Every visual that carries the concept
// (data filled in, the design wave, video, measurement, the sort, the funded band) is
// derived from the same handful of uniforms the driver sets.
import { ROW, TEXT_ASPECT } from './labels';

export const PITCH = [1.14, 1.39] as const; // tile 1 x 1.25 plus the gap, in world units
export const TILE_H = 1.25;

export const vertex = /* glsl */ `
precision highp float;
attribute vec2 position;
attribute vec2 aCell;
attribute vec2 aSort;
attribute vec4 aA; // slot, class, label, seed
attribute vec4 aB; // price, missing, delay, hero

uniform vec2 uViewport;
uniform vec2 uCenter;
uniform float uScale;
uniform vec2 uGrid;
uniform vec2 uHeroCell;
uniform float uData;
uniform float uConnect;
uniform float uVideo;
uniform float uDesign;
uniform float uSort;
uniform float uFund;
uniform float uSpread;
uniform float uWidths[32];

varying vec2 vUv;
varying vec4 vA;
varying vec4 vB;
varying vec4 vS; // data fill, design, sort progress, funded
varying vec3 vW; // name, price, label text widths (fraction of the text row)
varying float vX;
varying float vC; // connected (streamed in from the store)
varying float vV; // this tile's video is playing

const vec2 PITCH = vec2(${PITCH[0]}, ${PITCH[1]});

vec2 world(vec2 cell) { return (cell - (uGrid - 1.0) * 0.5) * PITCH; }

void main() {
  float seed = aA.w;
  // The sort: each SKU travels a straight line to its rank and stops hard (expo out).
  float st = clamp((uSort - aB.z) / 0.17, 0.0, 1.0);
  float e = st >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * st);
  vec2 p = mix(world(aCell), world(aSort), e);
  float lift = sin(3.14159 * st) * 0.14;

  // Every step spreads out from the hero SKU, each wave with a little randomness in its edge.
  float dist = length((aCell - uHeroCell) * vec2(1.0, 1.22)) / length(uGrid * vec2(0.55, 0.65));
  bool isHero = aB.w > 0.5;
  // Connect: the catalog streams in from the store, nearest first.
  float dc = dist * 0.85 + fract(seed * 7.7) * 0.12;
  float conn = isHero ? 1.0 : smoothstep(dc, dc + 0.05, uConnect * 1.08);
  // Enrich: missing titles and attributes fill in as a wave.
  float de = dist * 0.8 + fract(seed * 2.9) * 0.18;
  float data = smoothstep(de, de + 0.06, uData * 1.1);
  // Design: eased so the part of the wave you can see (near the hero) takes most of the scroll.
  float dd = max(0.0, dist + (fract(seed * 3.17) - 0.5) * 0.08);
  float design = uDesign > 0.0 ? smoothstep(dd, dd + 0.06, pow(uDesign, 1.8) * 1.12) : 0.0;
  // About four in ten ads run as video, each starting at its own moment.
  float isVid = isHero ? 1.0 : step(fract(seed * 13.71), 0.42);
  float vs = isHero ? 0.05 : 0.12 + fract(seed * 5.31) * 0.8;
  vV = smoothstep(vs, vs + 0.06, uVideo) * isVid;
  vC = conn;
  float fund = uFund * (aA.y < 0.5 ? 1.0 : 0.0) * e;
  // Spend before Samo: about one SKU in five, picked with no regard to what sells.
  fund = max(fund, uSpread * step(fract(seed * 7.31 + 0.13), 0.2));

  // A connecting tile drops into its slot and grows to size.
  float ce = 1.0 - pow(1.0 - conn, 3.0);
  p.y -= (1.0 - ce) * 0.7;
  vec2 local = (position - 0.5) * vec2(1.0, ${TILE_H.toFixed(2)}) * (1.0 + lift) * mix(0.5, 1.0, ce);
  vec2 sp = (p + local - uCenter) * uScale + uViewport * 0.5;
  gl_Position = vec4(sp.x / uViewport.x * 2.0 - 1.0, 1.0 - sp.y / uViewport.y * 2.0, 0.0, 1.0);

  vUv = position;
  vA = aA;
  vB = aB;
  vS = vec4(data, design, st, fund);
  int label = int(aA.z + 0.5);
  float lw = 0.0;
  if (label == 1) lw = uWidths[${ROW.label}];
  else if (label == 2) lw = uWidths[${ROW.label + 1}];
  else if (label == 3) lw = uWidths[${ROW.label + 2}];
  vW = vec3(uWidths[int(aA.x + 0.5)], uWidths[${ROW.price} + int(aB.x + 0.5)], lw);
  vX = p.x;
}`;

export const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uAtlas;
uniform sampler2D uHero;
uniform sampler2D uText;
uniform vec2 uAtlasGrid;
uniform float uTextRows;
uniform float uAA;
uniform float uVideo;
uniform float uMeasure;
uniform float uHole;
uniform float uTime;
uniform float uScale;
uniform float uMissingW;
uniform float uFadePx;
uniform float uClipL; // device px covered by the copy panel on the left (desktop)
uniform float uClipB; // device px covered by the copy panel at the bottom (phones)
uniform float uFadeL;
uniform float uFlat; // css px: under it a card is one flat block of colour (0 = off)

varying vec2 vUv;
varying vec4 vA;
varying vec4 vB;
varying vec4 vS;
varying float vC;
varying float vV;
varying vec3 vW;
varying float vX;

const vec3 WHITE = vec3(1.0);
const vec3 SAND = vec3(0.937, 0.910, 0.867);
const vec3 INK = vec3(0.086);
const vec3 MUTED = vec3(0.369);
const vec3 BLUE = vec3(0.047, 0.282, 0.655);
const vec3 MINT = vec3(0.302, 0.851, 0.604);
const vec3 SALE = vec3(0.725, 0.220, 0.165);

float box(vec2 p, vec2 a, vec2 b, float r) {
  vec2 c = (a + b) * 0.5;
  vec2 h = (b - a) * 0.5;
  vec2 q = abs(p - c) - h + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float fill(float d) { return 1.0 - smoothstep(-uAA, uAA, d); }

vec3 photo(vec2 uv) {
  if (vB.w > 0.5) return texture2D(uHero, vec2(uv.x, 1.0 - uv.y)).rgb;
  float col = mod(vA.x, uAtlasGrid.x);
  float row = floor(vA.x / uAtlasGrid.x + 0.001);
  vec2 t = (vec2(col, row) + uv * 0.996 + 0.002) / uAtlasGrid;
  return texture2D(uAtlas, vec2(t.x, 1.0 - t.y), -0.4).rgb;
}

// The product's colour: the middle of its photo, from a blurred level of the atlas.
vec3 tone() {
  if (vB.w > 0.5) return texture2D(uHero, vec2(0.5, 0.45)).rgb;
  float c = mod(vA.x, uAtlasGrid.x);
  float r = floor(vA.x / uAtlasGrid.x + 0.001);
  vec2 t = (vec2(c, r) + vec2(0.5, 0.45)) / uAtlasGrid;
  return texture2D(uAtlas, vec2(t.x, 1.0 - t.y), 5.5).rgb;
}

// Text from the label texture: one row per string, each row TEXT_ASPECT times wider than tall.
float text(vec2 p, vec2 origin, float h, float row, float width) {
  vec2 q = (p - origin) / vec2(${TEXT_ASPECT.toFixed(4)} * h, h);
  if (q.x < 0.0 || q.x > width || q.y < 0.0 || q.y > 1.0) return 0.0;
  // A negative LOD bias keeps small captions crisp instead of mip-blurred.
  return texture2D(uText, vec2(q.x, 1.0 - (row + q.y) / uTextRows), -0.85).a;
}

void main() {
  // Under the copy panel: nothing to draw, leave before any work.
  if (gl_FragCoord.x < uClipL || gl_FragCoord.y < uClipB) discard;
  vec2 p = vUv * vec2(1.0, 1.25);
  // Each step crosses a tile as a clean wipe, left to right, column by column (the same verb as
  // the Samo line), never as a fade where the old and the new card show at once.
  float wipeAA = uAA * 1.2;
  float dataT = vS.x * 1.03;
  float designT = vS.y * 1.03;
  float data = 1.0 - smoothstep(dataT - wipeAA, dataT, p.x);
  float design = 1.0 - smoothstep(designT - wipeAA, designT, p.x);
  // The wipe's edge is a thin mint line while it crosses the tile.
  float seam = (1.0 - smoothstep(0.0, uAA * 2.0, abs(p.x - designT))) * step(0.001, vS.y) * step(vS.y, 0.995);
  float fund = vS.w;
  float cls = vA.y;
  float label = floor(vA.z + 0.5);
  float seed = vA.w;
  float missing = vB.y;

  float alpha = fill(box(p, vec2(0.0), vec2(1.0, 1.25), 0.035)) * vC;
  if (alpha < 0.002) discard;

  // Card ground: white catalog card, then the brand's sand, then Samo blue once funded.
  vec3 col = mix(mix(WHITE, SAND, design), BLUE, fund);
  if (fund > 0.0) {
    float ph = fract(vX * 0.011 - uTime * 0.06);
    float edge = smoothstep(0.0, 0.025, ph) * (1.0 - smoothstep(0.025, 0.08, ph));
    col = mix(col, MINT, edge * 0.9 * fund);
  }

  // Photo, multiplied onto the card so product shots on white sit on any ground.
  vec2 pa = vec2(0.06);
  vec2 pb = vec2(0.94);
  float inPhoto = fill(box(p, pa, pb, 0.02));
  vec2 puv = (p - pa) / (pb - pa);
  float vid = vV * design;
  float z = 1.0 + vid * (0.07 + 0.05 * sin(uTime * 0.8 + seed * 6.283));
  vec2 pan = vid * 0.025 * vec2(sin(uTime * 0.5 + seed * 12.0), cos(uTime * 0.6 + seed * 7.0));
  vec3 img = photo(clamp((puv - 0.5) / z + 0.5 + pan, 0.0, 1.0));
  vec3 paper = mix(WHITE, SAND, design);
  col = mix(col, img * paper, inPhoto);

  // Video: a play mark on the photo and a progress line that runs along the ink strip.
  if (vid > 0.0) {
    vec2 c = vec2(0.78, 0.22);
    float disc = fill(length(p - c) - 0.13);
    col = mix(col, WHITE, disc * vid);
    // a small triangle pointing right, inside the disc
    vec2 q = (p - c) / 0.062;
    float play = 1.0 - smoothstep(0.0, uAA / 0.062, max(-q.x - 0.55, abs(q.y) * 1.15 + q.x * 0.66 - 0.62));
    col = mix(col, INK, play * disc * vid);
    float prog = fract(uTime * 0.16 + seed);
    float run = fill(box(p, vec2(0.0, 0.985), vec2(prog, 1.04), 0.0)) * design;
    col = mix(col, MINT, run * vid);
  }

  // Caption. Raw: name and price in ink on white, missing data as a pale bar until the feed fills it.
  float raw = 1.0 - design;
  // Under ~22 px a caption is texture noise: skip the text lookups (cheaper, and no shimmer).
  float legible = smoothstep(14.0, 22.0, uScale);
  if (raw > 0.0 && p.y > 0.96 && legible > 0.0) {
    float hasName = missing > 0.0 ? data : 1.0;
    // A missing title reads as a feed error until the feed fills it in.
    float err = text(p, vec2(0.06, 0.985), 0.12, ${ROW.missing}.0, uMissingW) * (1.0 - hasName) * legible;
    col = mix(col, SALE, err * raw);
    float name = text(p, vec2(0.06, 0.985), 0.12, vA.x, vW.x) * hasName * legible;
    col = mix(col, INK, name * raw);
    float price = text(p, vec2(0.06, 1.105), 0.1, ${ROW.price}.0 + vB.x, vW.y) * legible;
    col = mix(col, MUTED, price * raw);
  }
  // Designed: an ink strip with the price, and the treatment label on the photo.
  if (design > 0.0) {
    float strip = step(0.985, p.y);
    col = mix(col, mix(INK, BLUE, fund), strip * design);
    if (legible > 0.0) {
      float price = text(p, vec2(0.07, 1.055), 0.13, ${ROW.price}.0 + vB.x, vW.y) * legible;
      col = mix(col, WHITE, price * strip * design);
    }
    if (label > 0.5) {
      float lh = 0.1;
      vec2 la = vec2(0.1, 0.1);
      vec2 lb = la + vec2(vW.z * ${TEXT_ASPECT.toFixed(4)} * lh + 0.07, lh + 0.05);
      float pill = fill(box(p, la, lb, 0.025)) * design;
      vec3 bg = label < 1.5 ? SALE : label < 2.5 ? INK : WHITE;
      vec3 fg = label < 2.5 ? WHITE : INK;
      col = mix(col, bg, pill);
      float t = legible > 0.0 ? text(p, la + vec2(0.035, 0.025), lh, ${ROW.label}.0 + label - 1.0, vW.z) * legible : 0.0;
      col = mix(col, fg, t * pill);
    }
  }

  col = mix(col, MINT, seam);

  // A card a few pixels across can't show a photo, a price or a label: draw it as one flat block
  // in its product's colour, so the far wall reads as colour (grey once it wastes spend, blue once
  // funded) sitting straight on the page instead of as photo noise.
  // ('flat' is a reserved word in GLSL ES, hence the longer name.)
  float flatness = uFlat > 0.0 ? 1.0 - smoothstep(uFlat - 4.0, uFlat, uScale) : 0.0;
  if (flatness > 0.0) {
    vec3 t = tone();
    vec3 block = mix(t, vec3(dot(t, vec3(0.299, 0.587, 0.114))), 0.2) * 0.86;
    col = mix(col, mix(block, BLUE, fund), flatness);
  }

  // Measure: products that spend without selling go grey; sold-out sizes leave the wall.
  if (cls > 1.5 && cls < 2.5) {
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(l * 0.3 + 0.62), uMeasure * 0.9 * (1.0 - fund));
  }
  if (cls > 2.5) alpha *= 1.0 - uMeasure;
  // Seen from far away a funded card reads as one block of Samo blue: the band of spend.
  float far = smoothstep(26.0, 11.0, uScale);
  col = mix(col, BLUE, fund * far * 0.82);
  if (vB.w > 0.5) alpha *= 1.0 - uHole;
  // The wall's lower edge dissolves into the page (done here, not as a CSS mask on the canvas,
  // so the compositor has no extra pass to run every frame).
  if (uFadePx > 1.0) alpha *= smoothstep(uClipB, uClipB + uFadePx, gl_FragCoord.y);
  if (uFadeL > 1.0) alpha *= smoothstep(uClipL, uClipL + uFadeL, gl_FragCoord.x);

  gl_FragColor = vec4(col * alpha, alpha); // premultiplied (see the renderer in wall.ts)
}`;
