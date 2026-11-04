// Engine core: framework-agnostic page lifecycle. No DOM access at import time (SSR-safe).
//   boot(setup)            once, on first load: setup → page init → intro
//   leave() → cleanup()    before the route swaps
//   enter()                after the new page is in the DOM: init → enter animation → intro
// Project code hooks in with onPage(fn): fn runs on every page load inside a gsap.context, so the
// tweens and ScrollTriggers it creates are reverted automatically. Return a cleanup for the rest.
// No loader on this site: the catalog wall's pull-back is the intro.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScroll, resetScroll, scrollToTarget, startScroll, stopScroll } from './scroll';
import { initReveals } from './reveal';
import { playEnter, playLeave } from './transition';
import { prefersReducedMotion } from './env';

export { onScroll, scrollState, scrollToTarget, stopScroll, startScroll } from './scroll';
export { setTransition } from './transition';
export { ease, isTouch, isMobile, prefersReducedMotion } from './env';

export type PageFn = (page: { intro: gsap.core.Timeline; path: string }) => void | (() => void);
const pageFns = new Set<PageFn>();
const cleanups: (() => void)[] = [];
let ctx: gsap.Context | null = null;
let intro: gsap.core.Timeline | null = null;
let ready = false;
let booted = false;

/** Run fn on every page load (and now, if a page is ready). Returns an unsubscribe. */
export function onPage(fn: PageFn) {
  pageFns.add(fn);
  if (ready) {
    runPageFn(fn);
    refreshSoon(); // a late page hook can change heights (a pinned section): re-measure every trigger
  }
  return () => { pageFns.delete(fn); };
}

let refreshQueued = false;
function refreshSoon() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => { refreshQueued = false; ScrollTrigger.refresh(); });
}

function runPageFn(fn: PageFn) {
  ctx?.add(() => {
    const c = fn({ intro: intro!, path: location.pathname });
    if (typeof c === 'function') cleanups.push(c);
  });
}

export function syncFlags() {
  const h = document.documentElement.classList;
  h.add('js', 'is-booted');
  h.toggle('motion', !prefersReducedMotion());
}

function initPage() {
  syncFlags();
  ctx = gsap.context(() => {
    intro = initReveals(document);
  });
  ready = true;
  pageFns.forEach(runPageFn);
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export async function boot(setup?: () => void) {
  if (booted) return;
  booted = true;
  syncFlags();
  initScroll();
  setup?.();
  initPage();
  document.documentElement.classList.add('is-loaded');
  startScroll();
  intro?.play();
}

export async function leave() {
  stopScroll();
  await playLeave();
}

export function cleanup() {
  if (!ready) return;
  ready = false;
  cleanups.splice(0).forEach((c) => c());
  ctx?.revert();
  ctx = null;
}

/** Arriving from another page on a link with a #hash: land on that element, under the header.
 *  Pages with their own idea of where a hash lives (the pinned stage) correct this after. */
function landOnHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id && document.getElementById(id);
  if (!el) return;
  const header = document.querySelector('.header')?.getBoundingClientRect().height ?? 0;
  scrollToTarget(el.getBoundingClientRect().top + scrollY - header - 16, true);
}

export async function enter({ transition = true, scrollTop = true } = {}) {
  if (!booted) return;
  cleanup();
  if (scrollTop) resetScroll();
  initPage();
  landOnHash();
  if (transition) await playEnter();
  startScroll();
  intro?.play();
}
