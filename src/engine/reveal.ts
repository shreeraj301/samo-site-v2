// Declarative motion through data attributes:
//   data-split="lines|words"   masked text reveal (SplitText), on scroll or on intro
//   data-reveal="up|fade|clip" block reveal
//   data-intro                 play with the page intro instead of on scroll
//   data-delay="0.2"           extra delay (seconds)
//   data-count="₹2,140"        counts the figure up from zero once in view (after data-delay)
//   data-inview                adds .is-in once the element is well into view (CSS plays the rest),
//                              and .is-vis while it is on screen at all
// Every effect is skipped under reduced motion; CSS keeps content visible without JS.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ease, prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger, SplitText);

const durations = { lines: 0.95, words: 0.9 } as const;
const staggers = { lines: 0.07, words: 0.03 } as const;

function splitTween(el: HTMLElement, isIntro: boolean) {
  const type = (el.dataset.split || 'lines') as keyof typeof durations;
  const delay = parseFloat(el.dataset.delay || '0');
  const s = { tween: undefined as gsap.core.Tween | undefined, done: false, requested: false };
  SplitText.create(el, {
    type: type === 'lines' ? 'lines' : `lines,${type}`,
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit(self) {
      gsap.set(el, { visibility: 'visible' });
      if (s.done) return;
      const targets = type === 'lines' ? self.lines : self.words;
      // Sort verb: lines slot up into place, straight, no rotation.
      s.tween = gsap.from(targets, {
        yPercent: 105,
        duration: durations[type],
        stagger: staggers[type],
        ease: ease.out,
        delay,
        paused: isIntro && !s.requested,
        onComplete: () => { s.done = true; },
        scrollTrigger: isIntro ? undefined : { trigger: el, start: 'top 97%', once: true },
      });
      return s.tween;
    },
  });
  return () => { s.requested = true; s.tween?.play(); };
}

function blockTween(el: HTMLElement, paused: boolean) {
  const kind = el.dataset.reveal || 'up';
  const delay = parseFloat(el.dataset.delay || '0');
  const from: gsap.TweenVars =
    kind === 'fade' ? { autoAlpha: 0 }
    : kind === 'clip' ? { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 1 }
    : { y: 40, autoAlpha: 0 };
  const to: gsap.TweenVars = kind === 'clip' ? { clipPath: 'inset(0% 0% 0% 0%)' } : {};
  gsap.set(el, { visibility: 'visible' });
  return gsap.fromTo(el, from, {
    ...to,
    y: 0,
    autoAlpha: 1,
    duration: kind === 'fade' ? 0.8 : 1.0,
    ease: ease.out,
    delay,
    paused,
    scrollTrigger: paused ? undefined : { trigger: el, start: 'top 98%', once: true },
  });
}

/** Decode the pictures inside [data-warm] blocks well before they scroll in, so their first
 *  frame on screen does not pay for the decode. */
function warmImages(root: ParentNode) {
  const seen = new Set<string>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.querySelectorAll('img').forEach((img) => {
        const src = img.currentSrc || img.src;
        if (!src || seen.has(src)) return;
        seen.add(src);
        const pre = new Image();
        pre.src = src;
        pre.decode().catch(() => {});
      });
    });
  }, { rootMargin: '1600px 0px' });
  root.querySelectorAll('[data-warm]').forEach((el) => io.observe(el));
  return () => io.disconnect();
}

/** Wire every reveal inside `root`. Returns the intro timeline (paused) for the page entrance. */
export function initReveals(root: ParentNode = document) {
  const intro = gsap.timeline({ paused: true });
  const unwarm = warmImages(root);
  ScrollTrigger.create({ onKill: unwarm }); // reverted with the page's gsap context
  root.querySelectorAll<HTMLElement>('[data-inview]').forEach((el) => {
    if (prefersReducedMotion()) { el.classList.add('is-in'); return; }
    const start = el.dataset.inview?.includes(' ') ? el.dataset.inview : 'top 86%'; // React writes a bare attribute as "true"
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => el.classList.add('is-in') });
    // .is-vis while any of it is on screen, so looping motion inside can rest when it is not.
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (st) => el.classList.toggle('is-vis', st.isActive) });
  });
  if (prefersReducedMotion()) return intro;
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const m = (el.dataset.count || '').match(/^(\D*)([\d,]+)(.*)$/);
    if (!m) return;
    const to = +m[2].replace(/,/g, '');
    const n = { v: 0 };
    const show = () => { el.textContent = `${m[1]}${Math.round(n.v).toLocaleString('en-IN')}${m[3]}`; };
    gsap.to(n, {
      v: to, duration: 1.3, ease: 'expo.out', delay: parseFloat(el.dataset.delay || '0'),
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      onStart: show, onUpdate: show,
    });
  });
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const isIntro = el.hasAttribute('data-intro');
    const play = splitTween(el, isIntro);
    if (isIntro) intro.add(play, 0);
  });
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const isIntro = el.hasAttribute('data-intro');
    const t = blockTween(el, isIntro);
    if (isIntro) intro.add(() => { t.play(); }, 0);
  });
  return intro;
}
