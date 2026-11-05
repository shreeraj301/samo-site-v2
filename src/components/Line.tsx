'use client';
// The home page's pinned stage. The catalog wall spans the whole stage; the copy panel slides in
// over its left side (bottom on phones) once the opening pull-back is under way, and the wall's
// camera centres the story in the part still showing. One driver (scroll progress through this
// section) decides which step is active and every value the wall renders.
// Without motion it is a plain sequence of sections, each with a still of the wall.
import { Fragment, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePage } from '@/engine/next';
import { addBeats, ease, isTouch, prefersReducedMotion, scrollToTarget } from '@/engine';
import { Wall, wallSupported } from '@/wall/wall';
import { clamp01, follower, mixKey, smooth, storyKeys, withIdle } from '@/wall/drive';
import { opening } from '@/motion/opening';
import { chapters, hero, links } from '@/data/site';
import { catalogStats, GRID } from '@/wall/data';
import { Roll } from './Roll';
import { AdCard } from './AdCard';

// The counts come from the same seeded catalog the wall draws, so the key matches the picture.
const stats = catalogStats();
const fmt = (n: number) => n.toLocaleString('en-IN');

const STEPS = 6.3; // five steps, a push-in on the funded band, and a short hold
const HOLD = 0.7; // the hero holds still for a moment before the story starts
const UNITS = STEPS + HOLD;
const toK = (p: number) => Math.max(0, p * UNITS - HOLD);
// The count each chapter shows, in chapter order (1..5).
const values = chapters.map((c) => stats[c.key.stat]);
const extra = (e?: 'soldOut' | 'skipped') =>
  e === 'soldOut' ? <>, and {fmt(stats.soldOut)} sold out</> : e === 'skipped' ? <>. {fmt(stats.wasters)} skipped</> : null;


// Set once the stage has been set up: later visits arrive from another page, behind the curtain.
let visited = false;

export function Line() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  usePage(() => {
    const section = root.current;
    const stage = stageRef.current;
    if (!section || !stage || prefersReducedMotion()) return;

    const frames = [...section.querySelectorAll<HTMLElement>('[data-chapter]')];
    const steps = [...section.querySelectorAll<HTMLAnchorElement>('[data-step]')];
    const panel = section.querySelector<HTMLElement>('.line__copy')!;
    // The count rolls like an odometer: each digit reel slots to its new figure (the sort verb).
    const count = section.querySelector<HTMLElement>('.line__count');
    const reels = [...section.querySelectorAll<HTMLElement>('.count__reel')];
    const shift = section.querySelector<HTMLElement>('.count__shift');
    const roll = (v: number | null) => {
      const digits = v === null ? '    ' : String(v).padStart(4, ' ');
      reels.forEach((r, c) => r.style.setProperty('--d', digits[c] === ' ' ? '10' : digits[c]));
      if (!count || !shift) return;
      // Under a thousand, the empty thousands reel and the comma slide out to the left.
      const lead = [...shift.children].slice(0, 2) as HTMLElement[];
      const em = parseFloat(getComputedStyle(count.querySelector('.count__num')!).fontSize) || 1;
      const out = lead.reduce((w, e) => w + e.getBoundingClientRect().width, 0) / em;
      shift.style.translate = v !== null && v < 1000 ? `-${out}em 0` : '0 0';
    };
    let active = -1;
    const setActive = (i: number) => {
      if (i === active) return;
      active = i;
      section.dataset.active = String(i);
      roll(i > 0 ? values[i - 1] : null);
      if (i > 0) frames[0]?.classList.remove('is-first');
      frames.forEach((f, j) => {
        f.classList.toggle('is-active', j === i);
        f.classList.toggle('is-past', j < i);
      });
      steps.forEach((s, j) => {
        if (j + 1 === i) s.setAttribute('aria-current', 'step');
        else s.removeAttribute('aria-current');
        s.classList.toggle('is-done', j + 1 < i);
      });
    };
    setActive(0);

    let target = 0;

    // The copy panel covers part of the canvas: on desktop its left side, on phones its bottom.
    // Followed live, so a window that crosses the phone width keeps the wall in the right place.
    const phone = matchMedia('(max-width: 767px)');
    let mobile = phone.matches;
    let panelSize = 0;
    let hostH = 0;
    const host = stage.querySelector<HTMLElement>('.wall');
    const startEl = stage.querySelector<HTMLElement>('.wall__start');
    const measurePanel = () => {
      panelSize = mobile ? panel.offsetHeight : panel.offsetWidth;
      hostH = host?.clientHeight ?? 0;
    };
    measurePanel();

    // The opening. The plain HTML kurta holds until the wall has drawn the same kurta in the same
    // place, so the swap can't be seen. Then one clock plays the pull-back, the panel sliding in
    // and the headline. The heavy setup (compiling, uploads, measuring the device) all lands in
    // the hold, while nothing moves. If the wall is slow (the network, a weak phone, no WebGL),
    // the same motion plays on the HTML kurta, and the wall takes over later at the same spot.
    // CSS has a safety net that brings the panel in on its own if this script never runs.
    const intro = { v: 0 }; // camera: 0 = the one kurta, 1 = the hero frame
    const open = { u: 0 }; // panel: 0 = off screen, 1 = in
    let started = false;
    let live = false;
    let pulled = false;
    let pendingSwap = false;
    let gone = false;
    let panelDone = !section.classList.contains('is-intro');
    // A script this late finds the CSS safety net already playing: that one finishes the panel.
    const driven = !panelDone && !panel.getAnimations().some((a) => Number(a.currentTime) >= 4000);
    if (driven) section.classList.add('is-run');
    const wallOn = !!host && wallSupported();
    let wall: Wall | null = null;
    let tl: gsap.core.Timeline | null = null;
    let pull: gsap.core.Tween | null = null;
    let startTimer = 0;
    let deadlineTimer = 0;
    opening.begin();

    const covered = () => {
      if (panelDone) return panelSize;
      if (driven) return panelSize * open.u;
      // The CSS safety net is sliding it in: read where it is.
      const m = new DOMMatrixReadOnly(getComputedStyle(panel).transform);
      return Math.max(0, panelSize - Math.abs(mobile ? m.m42 : m.m41));
    };
    // Everything that waited for the opening runs once the panel is in and the camera has pulled back.
    const finish = () => { if (panelDone && (pulled || !wallOn)) opening.end(); };

    const movePanel = () => {
      const off = (1 - open.u) * 100;
      panel.style.transform = mobile ? `translate3d(0, ${off}%, 0)` : `translate3d(${-off}%, 0, 0)`;
      // Until the wall is live, the HTML kurta moves the way the wall's camera would: it stays
      // centred in the part still showing and, on phones, keeps its share of that height.
      if (live || !startEl) return;
      const c = panelSize * open.u;
      startEl.style.transform = mobile
        ? `translate3d(0, ${-c / 2}px, 0) scale(${hostH ? (hostH - c) / hostH : 1})`
        : `translate3d(${c / 2}px, 0, 0)`;
    };

    // Swap the HTML kurta for the wall: the wall draws the very frame the HTML shows, then shows.
    const swap = () => {
      if (!wall || live || gone) return;
      live = true;
      clearTimeout(deadlineTimer);
      wall.prime();
      host!.classList.add('is-live');
    };
    // A wall that arrives after the opening has played on the HTML kurta: it starts from the one
    // kurta too and pulls back, unless the visitor has already scrolled on.
    const takeOver = () => {
      pendingSwap = false;
      const atHero = toK(target) < 0.05;
      intro.v = atHero ? 0 : 1;
      swap();
      const done = () => { pulled = true; finish(); };
      if (atHero) pull = gsap.to(intro, { v: 1, duration: 2.4, delay: 0.25, ease: ease.inOut, onComplete: done });
      else done();
    };

    // The panel is in: the page's own layout takes over from the inline motion, at the same spot.
    const settlePanel = () => {
      if (panelDone) return;
      panelDone = true;
      open.u = 1;
      section.classList.remove('is-intro');
      panel.style.transform = '';
      if (startEl) startEl.style.transform = '';
      if (pendingSwap) takeOver();
      finish();
    };
    const onPanelIn = (e: AnimationEvent) => { if (e.target === panel) settlePanel(); };
    panel.addEventListener('animationend', onPanelIn);

    const play = () => {
      if (started || gone) return;
      started = true;
      clearTimeout(startTimer);
      clearTimeout(deadlineTimer);
      tl = gsap.timeline();
      // With the wall live, the camera pulls back from the one kurta as the catalog streams in...
      if (live) tl.to(intro, { v: 1, duration: 2.4, ease: ease.inOut, onComplete: () => { pulled = true; finish(); } }, 0);
      // ...the panel slides in over it once that is under way, and the headline slots in.
      tl.to(open, { u: 1, duration: 1.15, ease: ease.out, onUpdate: movePanel, onComplete: settlePanel }, 0.25);
      tl.call(() => section.classList.add('is-copy'), undefined, 0.65);
    };

    // When the opening may start: a beat on the kurta first (after the curtain, arriving from
    // another page), and no more than about 1.5 s of waiting for the wall.
    const now = performance.now();
    const firstLoad = !visited;
    visited = true;
    const minStart = firstLoad ? Math.max(800, now + 150) : now + 900;
    const deadline = firstLoad ? Math.max(1500, now + 700) : now + 1500;
    const landed = scrollY > 2 || chapters.some((c) => `#${c.id}` === location.hash);
    if (!driven) {
      started = true; // the CSS safety net plays the panel and the headline
    } else if (landed) {
      // Arriving part way down the story: no opening, everything at rest.
      started = true;
      pulled = true;
      intro.v = 1;
      section.classList.add('is-copy');
      settlePanel();
    } else if (wallOn) {
      deadlineTimer = window.setTimeout(play, deadline - now);
    } else {
      startTimer = window.setTimeout(play, Math.max(0, minStart - now));
    }

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => {
        target = s.progress;
        if (!started && s.progress > 0.002) play(); // scrolling during the hold starts it at once
        const k = Math.min(toK(target), 5);
        const i = k < 0.45 ? 0 : Math.min(5, Math.round(k));
        setActive(i);
        // The rail under the active step fills as you scroll through it.
        if (i > 0) steps[i - 1]?.style.setProperty('--p', clamp01(k - (i - 0.5)).toFixed(3));
      },
    });

    // Chapter links (here and in the header) scroll to that chapter's place in the stage.
    const stepY = (k: number) => {
      const top = section.getBoundingClientRect().top + scrollY;
      const dist = section.offsetHeight - innerHeight;
      return top + ((k + HOLD) / UNITS) * dist + 1;
    };
    const scrollToStep = (k: number, immediate = false) => scrollToTarget(stepY(k), immediate);
    // Pitch mode stops where each step has landed.
    const offBeats = addBeats(section, () => [1, 2, 3, 4, 5].map(stepY), stage);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname) return;
      const i = chapters.findIndex((c) => `#${c.id}` === url.hash);
      if (i < 0) return;
      e.preventDefault();
      scrollToStep(i + 1);
    };
    document.addEventListener('click', onClick, true);
    const fromHash = chapters.findIndex((c) => `#${c.id}` === location.hash);
    if (fromHash >= 0) requestAnimationFrame(() => scrollToStep(fromHash + 1, true));
    // Keyboard focus inside a chapter that is out of view brings that chapter in.
    const onFocus = (e: FocusEvent) => {
      const f = (e.target as Element).closest<HTMLElement>('[data-chapter]');
      const i = f ? frames.indexOf(f) : -1;
      if (i >= 0 && i !== active) scrollToStep(i, true);
    };
    section.addEventListener('focusin', onFocus);

    const onPhone = () => {
      mobile = phone.matches;
      measurePanel();
      if (wall) {
        wall.fadeLeft = mobile ? 0 : 56;
        wall.flatBelow = mobile ? 11 : 0;
      }
    };
    phone.addEventListener('change', onPhone);
    const ro = new ResizeObserver(measurePanel);
    ro.observe(panel);
    if (host) ro.observe(host);
    if (host && wallOn) {
      // Phones never show a card big enough to need the sharp atlas: the small one saves ~240 KB.
      const w = (wall = new Wall(host, GRID, { hd: mobile ? 'off' : 'first' }));
      w.fadeLeft = mobile ? 0 : 56;
      w.flatBelow = mobile ? 11 : 0;
      // On touch the camera eases after the scroll (see follower); on desktop Lenis already has.
      const follow = follower(isTouch());
      // The camera's keyframes change only with the canvas or the panel: worked out again then.
      let story = storyKeys(w, mobile);
      const keyFor = { w: 0, h: 0, c: -1, m: mobile };
      w.onFrame = (time) => {
        const p = follow(target, time);
        const c = covered();
        w.clipLeft = mobile ? 0 : c;
        w.clipBottom = mobile ? c : 0;
        if (keyFor.w !== w.width || keyFor.h !== w.height || keyFor.c !== c || keyFor.m !== mobile) {
          Object.assign(keyFor, { w: w.width, h: w.height, c, m: mobile });
          story = storyKeys(w, mobile);
        }
        const { introStart, keys, heroFade } = story;
        const k = Math.min(toK(p), 6);
        // Phones: the hero frame ends on whole cards, so only the cut-off remainder dissolves;
        // once the story moves, the usual soft edge returns.
        w.fade = mobile ? heroFade + (72 - heroFade) * clamp01(k / 0.5) : 72;
        const i = Math.min(5, Math.floor(k));
        const f = k - i;
        const from = i === 0 ? mixKey(introStart, keys[0], intro.v) : keys[i];
        // The sort reads best almost linear with scroll; the other moves ease in and out.
        // Each move is centred on the moment the copy changes (half way), so words and wall agree.
        const t = i === 4 ? clamp01((f - 0.05) / 0.85) : smooth(0.2, 0.8, f);
        // Held still while it stands in for the HTML kurta; the idle drift comes in with the pull-back.
        Object.assign(w.state, withIdle(mixKey(from, keys[i + 1], t), i === 0 ? intro.v : 1));
      };
      w.ready.then(() => {
        if (gone) return;
        // Measure this device on a heavy frame of the story (the design step, every card an ad),
        // with the panel at its final size, while the canvas is still hidden.
        w.clipLeft = mobile ? 0 : panelSize;
        w.clipBottom = mobile ? panelSize : 0;
        w.calibrate({ ...storyKeys(w, mobile).keys[3], hole: 0 });
        if (!started) {
          swap();
          // The swap fades over 0.2 s: the camera holds until it is done.
          startTimer = window.setTimeout(play, Math.max(250, minStart - performance.now()));
        } else if (!panelDone) pendingSwap = true; // the HTML opening is playing: take over once it lands
        else takeOver();
      }, () => { pulled = true; finish(); }); // no wall after all: the HTML kurta stays
    }

    return () => {
      gone = true;
      clearTimeout(startTimer);
      clearTimeout(deadlineTimer);
      tl?.kill();
      pull?.kill();
      opening.reset();
      offBeats();
      phone.removeEventListener('change', onPhone);
      document.removeEventListener('click', onClick, true);
      section.removeEventListener('focusin', onFocus);
      panel.removeEventListener('animationend', onPanelIn);
      ro.disconnect();
      wall?.destroy();
      st.kill();
    };
  });

  return (
    <section ref={root} className="line is-intro" data-active="0" aria-label="How Samo works">
      <div ref={stageRef} className="line__stage">
        <div className="line__copy">
          <nav className="line__chapters" aria-label="Steps">
            {chapters.map((c) => (
              <a key={c.id} href={`#${c.id}`} data-step data-no-transition><span>{c.name}</span></a>
            ))}
          </nav>
          {/* The visible, rolling count. Each chapter also carries its count as text for readers. */}
          <div className="line__count" aria-hidden="true">
            <p className="count__num">
              <span className="count__shift">
                {[0, 1, 2, 3].map((c) => (
                  <Fragment key={c}>
                    <span className="count__col">
                      <span className="count__reel" style={{ ['--c' as string]: c }}>
                        {'0123456789'.split('').map((d) => <span key={d}>{d}</span>)}
                        <span>&nbsp;</span>
                      </span>
                    </span>
                    {c === 0 && <span className="count__comma">,</span>}
                  </Fragment>
                ))}
              </span>
            </p>
            <p className="count__label">
              {chapters.map((c, i) => (
                <span key={c.id} className="count__item" data-k={i + 1}>
                  <span>
                    {c.key.swatch && <i className={`swatch swatch--${c.key.swatch}`} />}
                    {c.key.label}
                    {extra(c.key.extra)}
                  </span>
                </span>
              ))}
            </p>
          </div>
          <div className="line__frames">
            <div className="chapter chapter--hero is-active is-first" data-chapter data-beat>
              <h1 className="hero__title slot"><span>{hero.title}</span></h1>
              <div className="slot hero__cta" style={{ ['--i' as string]: 1 }}>
                <div className="hero__actions">
                  <a className="btn--stack" href={links.call.href}><span className="btn__face">{hero.primary}</span></a>
                  <a className="btn btn--quiet" href={links.audit}><Roll>{hero.secondary}</Roll></a>
                </div>
              </div>
              <figure className="chapter__figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/wall/ch-hero.webp" alt={`A wall of catalog cards with the ${hero.sku.name} at ${hero.sku.price} in the middle.`} width={1200} height={1000} loading="lazy" />
              </figure>
            </div>
            {chapters.map((c) => (
              <article key={c.id} id={c.id} className="chapter" data-chapter data-beat>
                <div className="chapter__key">
                  <p className="key__value slot"><span>{fmt(stats[c.key.stat])}</span></p>
                  <p className="key__label slot" style={{ ['--i' as string]: 1 }}>
                    <span>
                      {c.key.swatch && <i className={`swatch swatch--${c.key.swatch}`} aria-hidden="true" />}
                      {c.key.label}
                      {extra(c.key.extra)}
                    </span>
                  </p>
                </div>
                <h2 className="chapter__title slot" style={{ ['--i' as string]: 1 }}><span>{c.title}</span></h2>
                <figure className="chapter__figure">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/img/wall/${c.id}.webp`} alt={c.alt} width={1200} height={1000} loading="lazy" />
                </figure>
              </article>
            ))}
          </div>
        </div>
        <div className="wall wall--hero">
          {/* The opening frame in plain HTML, so it is there at first paint; the live wall fades in over it. */}
          <div className="wall__fallback wall__start">
            <AdCard slug="block-print-kurta" state="raw" className="wall__start-card" priority src="/img/hero-kurta-s.webp" />
          </div>
        </div>
      </div>
    </section>
  );
}

