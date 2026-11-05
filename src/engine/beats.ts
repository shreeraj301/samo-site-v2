// Beats: the stops pitch mode steps through, as scroll positions on the current page.
// A pinned section registers its own stops (where each scene has landed). Everything else is
// marked with data-beat in the markup: neighbouring marks inside the same section share one stop
// while they fit on screen together, and each stop centres what it shows.
// The page keeps its normal layout. Once a stop lands, anything the screen edge would cut fades
// out (dimAround), and it comes back as soon as the page moves (undim).

type Source = { el: Element; stage: Element; at: () => number[] };
type Stop = { y: number; keep: Element[] };
const sources = new Set<Source>();
let stops: Stop[] = [];

/** A pinned section's own stops. `stage` is its pinned part, the bit that shows on screen. */
export function addBeats(el: Element, at: () => number[], stage: Element = el) {
  const s = { el, stage, at };
  sources.add(s);
  return () => { sources.delete(s); };
}

const PAD = 16;
const marks = () => [...document.querySelectorAll<HTMLElement>('[data-beat]')]
  .filter((el) => el.offsetParent !== null && ![...sources].some((s) => s.el.contains(el)));

export function collectBeats(): number[] {
  const H = innerHeight;
  const max = document.documentElement.scrollHeight - H;

  type Frame = { top: number; bottom: number; group: Element | null; els: Element[] };
  const frames: Frame[] = [];
  for (const el of marks()) {
    const r = el.getBoundingClientRect();
    const box = { top: r.top + scrollY, bottom: r.bottom + scrollY, group: el.closest('section, footer'), els: [el] };
    const cur = frames[frames.length - 1];
    if (cur && cur.group === box.group && Math.max(cur.bottom, box.bottom) - cur.top <= H - PAD * 2) {
      cur.bottom = Math.max(cur.bottom, box.bottom);
      cur.els.push(el);
    } else frames.push(box);
  }
  const raw: Stop[] = [
    { y: 0, keep: [] },
    ...[...sources].flatMap((s) => s.at().map((y) => ({ y, keep: [s.el] }))),
    ...frames.map((f) => ({ y: (f.top + f.bottom - H) / 2, keep: f.els })),
  ];
  // In order, inside the page, and no two stops on the same spot.
  const out: Stop[] = [];
  for (const s of raw.map((s) => ({ ...s, y: Math.round(Math.min(max, Math.max(0, s.y))) })).sort((a, b) => a.y - b.y)) {
    const last = out[out.length - 1];
    if (last && s.y - last.y <= 40) last.keep.push(...s.keep);
    else out.push(s);
  }
  stops = out;
  return out.map((s) => s.y);
}

const dimmed = new Map<Element, Animation>();
const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** At a stop: fade out whatever is only partly on screen, except what the stop is showing. */
export function dimAround(y: number) {
  const keep = stops.find((s) => Math.abs(s.y - y) < 4)?.keep ?? [];
  const H = innerHeight;
  const cut = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 1 && r.top < H - 1 && (r.top < -1 || r.bottom > H + 1);
  };
  const fade = (el: Element) => {
    if (keep.includes(el) || dimmed.has(el)) return;
    dimmed.set(el, el.animate([{ filter: 'opacity(1)' }, { filter: 'opacity(0)' }], { duration: quiet() ? 0 : 350, easing: 'ease-out', fill: 'forwards' }));
  };
  sources.forEach((s) => { if (cut(s.stage)) fade(s.el); });
  marks().forEach((el) => { if (cut(el)) fade(el); });
}

/** The page is moving again: bring everything back. */
export function undim() {
  dimmed.forEach((a, el) => {
    a.cancel();
    if (!quiet() && el.isConnected) el.animate([{ filter: 'opacity(0)' }, { filter: 'opacity(1)' }], { duration: 200, easing: 'ease-out' });
  });
  dimmed.clear();
}
