// Smooth scroll on ONE clock: Lenis is driven by gsap.ticker, ScrollTrigger reads Lenis.
// Reduced motion → native scroll, no Lenis.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
const listeners = new Set<(s: ScrollState) => void>();

export type ScrollState = { y: number; velocity: number; progress: number };
const state: ScrollState = { y: 0, velocity: 0, progress: 0 };

export function initScroll() {
  if (lenis || prefersReducedMotion()) {
    if (!lenis) addEventListener('scroll', nativeTick, { passive: true });
    return;
  }
  // anchors: false. Chapter links inside the pinned stage are resolved by the Line component.
  lenis = new Lenis({ lerp: 0.15, wheelMultiplier: 1, touchMultiplier: 1.2, anchors: false });
  lenis.on('scroll', (l: Lenis) => {
    state.y = l.scroll;
    state.velocity = l.velocity;
    state.progress = l.limit > 0 ? l.scroll / l.limit : 0;
    ScrollTrigger.update();
    listeners.forEach((fn) => fn(state));
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function nativeTick() {
  const max = document.documentElement.scrollHeight - innerHeight;
  state.velocity = scrollY - state.y;
  state.y = scrollY;
  state.progress = max > 0 ? scrollY / max : 0;
  listeners.forEach((fn) => fn(state));
}

export const onScroll = (fn: (s: ScrollState) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const scrollState = () => state;
export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();
export function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else scrollTo(0, 0);
  state.y = 0;
  state.velocity = 0;
}
/** Pitch mode's move between beats: one even glide, slow out of the stop and slow into the next,
 *  so a pinned scene plays through at a steady pace. Without motion it jumps. */
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export function glideTo(y: number, duration: number, onComplete?: () => void) {
  if (lenis) lenis.scrollTo(y, { duration, easing: inOutCubic, force: true, onComplete: () => onComplete?.() });
  else {
    scrollTo({ top: y, behavior: 'instant' });
    onComplete?.();
  }
}
export function scrollToTarget(target: string | HTMLElement | number, immediate = false) {
  // An immediate jump (landing on a link's place after a page change) applies even while the
  // scroll is held for the transition.
  if (lenis) lenis.scrollTo(target, { duration: 1.4, immediate, force: immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else if (typeof target === 'number') scrollTo({ top: target });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView();
}
