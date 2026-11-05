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
import { addBeats, ease, prefersReducedMotion, scrollToTarget } from '@/engine';
import { Wall, wallSupported } from '@/wall/wall';
import { clamp01, mixKey, smooth, storyKeys, withIdle } from '@/wall/drive';
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
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => {
        target = s.progress;
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

    // The copy panel covers part of the canvas: on desktop its right edge, on phones its top edge.
    // Followed live, so a window that crosses the phone width keeps the wall in the right place.
    const phone = matchMedia('(max-width: 767px)');
    let mobile = phone.matches;
    let panelSize = 0;
    let panelDone = !section.classList.contains('is-intro');
    const measurePanel = () => { panelSize = mobile ? panel.offsetHeight : panel.offsetWidth; };
    measurePanel();
    const covered = () => {
      if (panelDone) return panelSize;
      // While the panel slides in (a CSS animation, so it never waits for scripts), read where it is.
      const m = new DOMMatrixReadOnly(getComputedStyle(panel).transform);
      return Math.max(0, panelSize - Math.abs(mobile ? m.m42 : m.m41));
    };
    const onPanelIn = (e: AnimationEvent) => {
      if (e.target !== panel) return;
      panelDone = true;
      section.classList.remove('is-intro');
    };
    panel.addEventListener('animationend', onPanelIn);

    let wall: Wall | null = null;
    const onPhone = () => {
      mobile = phone.matches;
      measurePanel();
      if (wall) {
        wall.fadeLeft = mobile ? 0 : 56;
        wall.flatBelow = mobile ? 11 : 0;
      }
    };
    phone.addEventListener('change', onPhone);
    const host = stage.querySelector<HTMLElement>('.wall');
    const ro = new ResizeObserver(measurePanel);
    ro.observe(panel);
    if (host && wallSupported()) {
      // Phones never show a card big enough to need the sharp atlas: the small one saves ~240 KB.
      const w = (wall = new Wall(host, GRID, { hd: mobile ? 'off' : 'first' }));
      w.fadeLeft = mobile ? 0 : 56;
      w.flatBelow = mobile ? 11 : 0;
      const intro = { v: 0 };
      w.onFrame = () => {
        // No second smoothing: the scroll is already eased once (Lenis), so the wall, the count
        // and the copy all read the same position in the same frame.
        const p = target;
        const c = covered();
        w.clipLeft = mobile ? 0 : c;
        w.clipBottom = mobile ? c : 0;
        const { introStart, keys, heroFade } = storyKeys(w, mobile);
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
        Object.assign(w.state, withIdle(mixKey(from, keys[i + 1], t)));
      };
      w.ready.then(() => {
        w.prime(); // the first frame is on the canvas before the still steps aside
        host.classList.add('is-live');
        // The opening: the kurta fills the screen, then the camera pulls back as the catalog
        // starts streaming in around it.
        gsap.to(intro, { v: 1, duration: 2.4, delay: 0.25, ease: ease.inOut });
      });
    }

    return () => {
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
            <AdCard slug="block-print-kurta" state="raw" className="wall__start-card" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
