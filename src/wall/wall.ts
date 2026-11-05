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
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  img.decode().then(() => resolve(img), () => (img.complete && img.naturalWidth ? resolve(img) : reject(new Error(src))));
});

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
    const atlasSrc = this.hd === 'first' ? '/img/atlas-hd.webp' : '/img/atlas.webp';
    const [atlasImg, heroImg] = await Promise.all([loadImage(atlasSrc), loadImage('/img/hero-kurta.webp'), document.fonts.ready]);
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
    loadImage('/img/atlas-hd.webp').then((img) => {
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

  /** Adaptive resolution: when frames run long for a sustained stretch, draw fewer pixels;
   *  when they run fast again, climb back. Never skips frames: every frame is drawn, in sync. */
  private adapt() {
    if (this.warm < 150) { this.warm++; return; } // loading frames are slow on every device
    const r = gsap.ticker.deltaRatio();
    if (r > 3) return; // a tab switch or a one-off stall, not a trend
    this.slow += (r - this.slow) * 0.06;
    const dpr = this.renderer.dpr;
    if (this.slow > 1.22) {
      if (++this.slowFrames > 45 && dpr > this.minDpr) {
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
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.slow = 1;
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
    const s = this.state;
    const u = this.program.uniforms;
    u.uViewport.value = [this.width, this.height];
    // Centre the camera on the visible part: shift by half the covered width and height.
    u.uCenter.value = [s.cx - this.clipLeft / 2 / s.scale, s.cy + this.clipBottom / 2 / s.scale];
    const dpr = this.renderer.dpr;
    u.uClipL.value = this.clipLeft * dpr;
    u.uClipB.value = this.clipBottom * dpr;
    u.uFadeL.value = this.fadeLeft * dpr;
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
    this.renderer.render({ scene: this.mesh });
  };

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
