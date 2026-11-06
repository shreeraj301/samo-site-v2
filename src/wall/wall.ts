// The catalog wall renderer. One canvas per mount, one instanced draw call, driven from the
// GSAP ticker (the site's single clock). It renders whatever `state` says; the driver in the
// page decides the state. Pauses off screen and when the tab is hidden.
import { Renderer, Program, Mesh, Geometry, Texture } from 'ogl';
import { gsap } from 'gsap';
import atlas from './atlas.json';
import { makeCatalog, type Catalog } from './data';
import { makeLabelCanvas, ROW, ROWS } from './labels';
import { vertex, fragment, PITCH } from './shaders';

export type WallState = {
  scale: number; // css px per world unit
  cx: number; // camera centre, world units
  cy: number;
  connect: number;
  data: number;
  design: number;
  video: number;
  measure: number;
  sort: number;
  fund: number;
  hole: number;
};

export const wallSupported = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; }
};

// Decoded off the main thread before the texture upload, so a big atlas never stalls a frame.
// Each picture is fetched once per visit: every wall on every page shares the same decoded image.
const images = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string) => {
  let p = images.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      img.decode().then(() => resolve(img), () => (img.complete && img.naturalWidth ? resolve(img) : reject(new Error(src))));
    });
    images.set(src, p);
    p.catch(() => images.delete(src)); // a failed fetch can be tried again
  }
  return p;
};
const ATLAS = '/img/atlas.webp';
const ATLAS_HD = '/img/atlas-hd.webp';
const HERO = '/img/hero-kurta.webp';
const HERO_S = '/img/hero-kurta-s.webp';

export class Wall {
  readonly catalog: Catalog;
  readonly state: WallState;
  readonly ready: Promise<void>;
  width = 0;
  height = 0;
  private renderer: Renderer;
  private program: Program;
  private mesh: Mesh;
  private host: HTMLElement;
  private visible = true;
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private alive = true;
  private hasTextures = false;
  private maxDpr = 1;
  private slow = 0; // smoothed frame cost, in 60 Hz frames
  private slowFrames = 0;
  private fastFrames = 0;
  private warm = 0;
  private minDpr = 0.75;
  private px = new Uint8Array(4);
  /** Height of the dissolve at the wall's lower edge, in css px (0 for none). */
  fade = 72;
  /** Spend scattered across the catalog with no sort (the picture of spend before Samo). */
  spread = 0;
  /** Css px of the canvas hidden under the copy panel (left on desktop, bottom on phones). The
   *  canvas spans the whole stage; the camera centres the story in the part you can see. */
  clipLeft = 0;
  clipBottom = 0;
  /** Width of the soft edge where the wall meets the copy panel, css px. */
  fadeLeft = 0;
  /** Soft top and right edges, css px (walls framed by the page rather than the screen). */
  fadeTop = 0;
  fadeRight = 0;
  /** Below this tile width (css px) a card is drawn as one flat block of colour; 0 = never.
   *  Set on phones, where the zoomed-out wall would otherwise read as photo noise. */
  flatBelow = 0;
  /** Extra per-frame hook (the driver's idle input). */
  onFrame: ((t: number) => void) | null = null;

  /** The sharp atlas for close-ups: 'auto' swaps it in after the first frames, 'first' loads it in
   *  place of the small one (its upload lands with the rest of the loading, never mid-move),
   *  'off' for walls only ever seen from afar. */
  private hd: 'auto' | 'first' | 'off';

  constructor(host: HTMLElement, { cols, rows }: { cols: number; rows: number }, { hd = 'auto' }: { hd?: 'auto' | 'first' | 'off' } = {}) {
    this.host = host;
    this.hd = hd;
    this.catalog = makeCatalog(cols, rows);
    this.state = { scale: 40, cx: 0, cy: 0, connect: 1, data: 0, design: 0, video: 0, measure: 0, sort: 0, fund: 0, hole: 0 };

    // Transparent canvas over the page ground: anything not drawn shows the ground, never black.
    // Phones get 1.5x: tiles stay sharp and the GPU has headroom to hold 60 fps while scrolling.
    this.maxDpr = Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2);
    this.minDpr = Math.min(this.maxDpr, matchMedia('(pointer: coarse)').matches ? 0.6 : 0.75);
    // Premultiplied alpha: the one blend every browser composites the same way. With it off, iPhone
    // Safari read the cleared (transparent) canvas as white, so the wall sat in a white box on the sand.
    this.renderer = new Renderer({ dpr: this.maxDpr, alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.classList.add('wall__canvas', 'gl-canvas');
    gl.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(gl.canvas);
    host.dataset.dpr = this.maxDpr.toFixed(2); // read by the ?fps readout

    const c = this.catalog;
    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]) },
      index: { data: new Uint16Array([0, 2, 1, 1, 2, 3]) },
      aCell: { instanced: 1, size: 2, data: c.cell },
      aSort: { instanced: 1, size: 2, data: c.sort },
      aA: { instanced: 1, size: 4, data: c.a },
      aB: { instanced: 1, size: 4, data: c.b },
    });
    const blank = new Texture(gl, { image: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1, generateMipmaps: false });
    this.program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        uViewport: { value: [1, 1] },
        uCenter: { value: [0, 0] },
        uScale: { value: 40 },
        uGrid: { value: [cols, rows] },
        uHeroCell: { value: c.heroCell },
        uData: { value: 0 },
        uConnect: { value: 1 },
        uClipL: { value: 0 },
        uClipB: { value: 0 },
        uFadeL: { value: 0 },
        uFadeT: { value: 0 },
        uFadeR: { value: 0 },
        uBuf: { value: [1, 1] },
        uDesign: { value: 0 },
        uSort: { value: 0 },
        uFund: { value: 0 },
        uSpread: { value: 0 },
        uVideo: { value: 0 },
        uMeasure: { value: 0 },
        uHole: { value: 0 },
        uTime: { value: 0 },
        uAA: { value: 0.02 },
        uWidths: { value: new Array(ROWS).fill(0) },
        uMissingW: { value: 0 },
        uFadePx: { value: 1 },
        uFlat: { value: 0 },
        uAtlas: { value: blank },
        uHero: { value: blank },
        uText: { value: blank },
        uAtlasGrid: { value: [atlas.cols, atlas.rows] },
        uTextRows: { value: ROWS },
      },
    });
    this.mesh = new Mesh(gl, { geometry, program: this.program, frustumCulled: false });

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '10%' });
    this.io.observe(host);
    gsap.ticker.add(this.tick);

    this.ready = this.load();
  }

  private async load() {
    const gl = this.renderer.gl;
    // A sharp atlas already fetched on this visit (the desktop opening) is reused by every later
    // wall instead of fetching the small one as well.
    const sharp = this.hd === 'first' || images.has(ATLAS_HD);
    const atlasSrc = sharp ? ATLAS_HD : ATLAS;
    // Walls never seen up close (phones, the results band) take the small hero photo, the same
    // file the HTML opening card shows, unless the big one is already here.
    const heroSrc = this.hd === 'off' && !images.has(HERO) ? HERO_S : HERO;
    if (sharp && this.hd === 'auto') this.hd = 'off'; // already sharp: nothing to swap in later
    const [atlasImg, heroImg] = await Promise.all([loadImage(atlasSrc), loadImage(heroSrc), document.fonts.ready]);
    if (!this.alive) return;
    const family = getComputedStyle(document.body).fontFamily;
    const { canvas, widths } = makeLabelCanvas(family);
    const u = this.program.uniforms;
    u.uAtlas.value = new Texture(gl, { image: atlasImg, anisotropy: 4 });
    u.uHero.value = new Texture(gl, { image: heroImg });
    u.uText.value = new Texture(gl, { image: canvas });
    u.uWidths.value = widths;
    u.uMissingW.value = widths[ROW.missing];
    this.hasTextures = true;
    document.documentElement.classList.add('gl-on');
    if (this.hd === 'auto') this.loadHd();
  }

  /** Swap in the sharp atlas for close-ups; the wall never waits for it. Off screen, upload it at
   *  once with a primed frame, so the first frame on screen is not the one that pays. */
  private loadHd() {
    if (this.hd !== 'auto') return;
    this.hd = 'off';
    loadImage(ATLAS_HD).then((img) => {
      if (!this.alive) return;
      this.program.uniforms.uAtlas.value = new Texture(this.renderer.gl, { image: img, anisotropy: 4 });
      if (!this.visible) this.prime();
    }).catch(() => {});
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    this.width = Math.max(1, r.width);
    this.height = Math.max(1, r.height);
    this.renderer.setSize(this.width, this.height);
  }

  /** The part of the canvas you can see (not under the copy panel), css px. */
  get visW() { return Math.max(1, this.width - this.clipLeft); }
  get visH() { return Math.max(1, this.height - this.clipBottom); }
  /** css px per world unit so that `n` tiles fit across the visible width. */
  scaleForTiles(n: number) { return this.visW / (n * PITCH[0]); }
  /** Scale at which a tile is `fraction` of the visible height. */
  scaleForHeight(fraction: number) { return (this.visH * fraction) / 1.25; }
  /** Scale that fits the whole wall with a margin. */
  fitScale(margin = 0.92) {
    const w = this.catalog.cols * PITCH[0];
    const h = this.catalog.rows * PITCH[1];
    return Math.min(this.visW / w, this.visH / h) * margin;
  }
  /** World position of a catalog cell. */
  cellWorld(c: number, r: number): [number, number] {
    return [(c - (this.catalog.cols - 1) / 2) * PITCH[0], (r - (this.catalog.rows - 1) / 2) * PITCH[1]];
  }
  heroWorld() { return this.cellWorld(this.catalog.heroCell[0], this.catalog.heroCell[1]); }
  /** The camera centre as drawn (shifted into the part of the canvas you can see). */
  private center(): [number, number] {
    const s = this.state;
    return [s.cx - this.clipLeft / 2 / s.scale, s.cy + this.clipBottom / 2 / s.scale];
  }
  /** Where catalog card i sits on screen, css px from the canvas' top left. Unsorted wall only. */
  cardRect(i: number) {
    const s = this.state;
    const [ux, uy] = this.center();
    const [wx, wy] = this.cellWorld(i % this.catalog.cols, Math.floor(i / this.catalog.cols));
    const x = (wx - ux) * s.scale + this.width / 2;
    const y = (wy - uy) * s.scale + this.height / 2;
    return { x: x - 0.5 * s.scale, y: y - 0.625 * s.scale, w: s.scale, h: 1.25 * s.scale };
  }
  /** The catalog card under a point (css px from the canvas' top left), or -1 in a gap. Unsorted wall only. */
  cardAt(x: number, y: number) {
    const s = this.state;
    const { cols, rows } = this.catalog;
    const [ux, uy] = this.center();
    const wx = (x - this.width / 2) / s.scale + ux;
    const wy = (y - this.height / 2) / s.scale + uy;
    const c = Math.round(wx / PITCH[0] + (cols - 1) / 2);
    const r = Math.round(wy / PITCH[1] + (rows - 1) / 2);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
    const [cx, cy] = this.cellWorld(c, r);
    return Math.abs(wx - cx) <= 0.5 && Math.abs(wy - cy) <= 0.625 ? r * cols + c : -1;
  }

  /** Adaptive resolution, the safety net behind calibrate(): when frames run long for a sustained
   *  stretch, draw fewer pixels; when they run fast again, climb back, never above what this
   *  device measured it can hold. Never skips frames: every frame is drawn, in sync. */
  private adapt() {
    if (this.warm < 60) { this.warm++; return; } // the first frames on screen are slow everywhere
    const r = gsap.ticker.deltaRatio();
    if (r > 3) return; // a tab switch or a one-off stall, not a trend
    this.slow += (r - this.slow) * 0.08;
    const dpr = this.renderer.dpr;
    if (this.slow > 1.22) {
      if (++this.slowFrames > 24 && dpr > this.minDpr) {
        this.setDpr(Math.max(this.minDpr, dpr * 0.8));
      }
    } else this.slowFrames = 0;
    if (this.slow < 1.04) {
      if (++this.fastFrames > 300 && dpr < this.maxDpr) this.setDpr(Math.min(this.maxDpr, dpr * 1.15));
    } else this.fastFrames = 0;
  }

  private setDpr(d: number) {
    this.renderer.dpr = d;
    this.renderer.setSize(this.width, this.height);
    this.host.dataset.dpr = d.toFixed(2);
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.slow = 1;
  }

  /** Measure this device before the wall is shown: draw a heavy frame of the story a few times
   *  (the canvas is still hidden), time each to completion, and lower the resolution until such
   *  a frame fits the budget. Fast GPUs keep full sharpness; slow ones trade a little sharpness
   *  for an even frame rate. Returns the measured cost in ms. Run once, after `ready`. */
  calibrate(heavy: WallState, budgetMs = 7) {
    if (!this.alive || !this.hasTextures) return 0;
    const gl = this.renderer.gl;
    const saved = { ...this.state };
    Object.assign(this.state, heavy);
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      this.draw(gsap.ticker.time);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.px); // waits for the GPU to finish
      times.push(performance.now() - t0);
    }
    Object.assign(this.state, saved);
    // The first frame pays for one-off driver work; the upper middle of the rest is the steady cost.
    const ms = times.slice(1).sort((a, b) => a - b)[2];
    const dpr = this.renderer.dpr;
    // Cost follows the pixel count, which goes with the square of the resolution.
    if (ms > budgetMs) this.setDpr(Math.max(this.minDpr, dpr * Math.sqrt(budgetMs / ms)));
    this.maxDpr = this.renderer.dpr;
    this.host.dataset.gpu = ms.toFixed(1);
    return ms;
  }

  /** Draw one frame now, on screen or not, so the shader compile and texture uploads happen
   *  while nothing is moving instead of on the first frame this wall scrolls into view. */
  prime() {
    if (!this.alive || !this.hasTextures) return;
    const v = this.visible;
    this.visible = true;
    this.tick(gsap.ticker.time);
    this.visible = v;
  }

  private tick = (time: number) => {
    if (!this.alive || !this.visible || document.hidden) return;
    this.onFrame?.(time);
    if (!this.hasTextures) return;
    this.adapt();
    this.draw(time);
  };

  private draw(time: number) {
    const s = this.state;
    const u = this.program.uniforms;
    u.uViewport.value = [this.width, this.height];
    // Centre the camera on the visible part: shift by half the covered width and height.
    u.uCenter.value = [s.cx - this.clipLeft / 2 / s.scale, s.cy + this.clipBottom / 2 / s.scale];
    const dpr = this.renderer.dpr;
    u.uClipL.value = this.clipLeft * dpr;
    u.uClipB.value = this.clipBottom * dpr;
    u.uFadeL.value = this.fadeLeft * dpr;
    u.uFadeT.value = this.fadeTop * dpr;
    u.uFadeR.value = this.fadeRight * dpr;
    const buf = u.uBuf.value as number[]; // updated in place: no new array every frame
    buf[0] = this.renderer.gl.drawingBufferWidth;
    buf[1] = this.renderer.gl.drawingBufferHeight;
    u.uConnect.value = s.connect;
    u.uScale.value = s.scale;
    u.uAA.value = 0.9 / (s.scale * this.renderer.dpr);
    u.uFadePx.value = this.fade * this.renderer.dpr;
    u.uFlat.value = this.flatBelow;
    u.uData.value = s.data;
    u.uDesign.value = s.design;
    u.uVideo.value = s.video;
    u.uMeasure.value = s.measure;
    u.uSort.value = s.sort;
    u.uFund.value = s.fund;
    u.uSpread.value = this.spread;
    u.uHole.value = s.hole;
    u.uTime.value = time;
    // Pixels under the copy panel are never drawn: the scissor stops them before the shader runs.
    // (The clear goes first and covers the whole canvas.)
    const gl = this.renderer.gl;
    const cl = Math.round(this.clipLeft * dpr);
    const cb = Math.round(this.clipBottom * dpr);
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(cl, cb, Math.max(0, W - cl), Math.max(0, H - cb));
    this.renderer.render({ scene: this.mesh, clear: false });
    gl.disable(gl.SCISSOR_TEST);
  }

  destroy() {
    this.alive = false;
    gsap.ticker.remove(this.tick);
    this.io.disconnect();
    this.ro.disconnect();
    const gl = this.renderer.gl;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    gl.canvas.remove();
  }
}
