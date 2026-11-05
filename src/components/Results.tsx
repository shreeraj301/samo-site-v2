'use client';
// Results on an ink band: the catalog with spend scattered across it turns, as you scroll, into
// the same catalog sorted by profit with the spend on the top rows. The measured numbers sit
// beside it. Without WebGL or with reduced motion, the two pictures sit side by side instead.
import { useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePage } from '@/engine/next';
import { addBeats, isTouch, prefersReducedMotion } from '@/engine';
import { Wall, wallSupported } from '@/wall/wall';
import { GRID } from '@/wall/data';
import { follower, mixKey, smooth, storyKeys, withIdle } from '@/wall/drive';
import { opening } from '@/motion/opening';
import { results } from '@/data/site';
import { StatValue } from './StatValue';

type Still = Window & { __samoStill?: string };

export function Results() {
  const root = useRef<HTMLElement>(null);

  usePage(() => {
    const section = root.current;
    const host = section?.querySelector<HTMLElement>('.results__wall');
    if (!section || !host || prefersReducedMotion() || !wallSupported()) return;
    // Followed live, so a window that crosses the phone width keeps the wall in the right place.
    const phone = matchMedia('(max-width: 767px)');
    let mobile = phone.matches;
    const onPhone = () => { mobile = phone.matches; if (w) w.flatBelow = mobile ? 11 : 0; };
    phone.addEventListener('change', onPhone);
    // Pinned and tall only when the live wall runs (the page refreshes its triggers after this).
    section.classList.add('has-wall');
    let t = 0;
    const st = ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => {
        t = smooth(0.12, 0.82, s.progress);
        section.classList.toggle('is-after', t > 0.5);
      },
    });
    // Pitch mode stops on the scattered catalog, then on the sorted one.
    const offBeats = addBeats(section, () => {
      const top = section.getBoundingClientRect().top + scrollY;
      return [top, top + 0.9 * (section.offsetHeight - innerHeight)];
    }, section.querySelector('.results__stage') ?? section);
    // Built once the home page's opening has played and the page is still, so compiling and
    // uploading never lands on a frame of the opening or of a scroll; at once if the visitor
    // heads this way first. Until then the two stills stand in.
    let w: Wall | null = null;
    // On touch the camera eases after the scroll (see follower); on desktop Lenis already has.
    const follow = follower(isTouch());
    let quiet = 0;
    let near: ScrollTrigger | null = null;
    const soon = () => { clearTimeout(quiet); quiet = window.setTimeout(build, 400); };
    const build = () => {
      if (w) return;
      removeEventListener('scroll', soon);
      near?.kill();
      const wall = (w = new Wall(host, GRID, { hd: 'off' })); // seen from afar only: the small atlas
      wall.fade = 0;
      wall.flatBelow = mobile ? 11 : 0; // phones: far cards as flat blocks of colour on the band
      wall.onFrame = (time) => {
        const still = (window as Still).__samoStill;
        const v = still === 'before' ? 0 : still === 'after' ? 1 : follow(t, time);
        const { keys } = storyKeys(wall, mobile);
        // Spend leaves the scattered SKUs a little ahead of the sort, so it reads as moving up.
        wall.spread = 1 - smooth(0, 0.7, v);
        Object.assign(wall.state, withIdle(mixKey(keys[4], keys[5], v)));
      };
      wall.ready.then(() => {
        if (w !== wall) return;
        wall.prime(); // the first frame is on the canvas before the stills step aside
        host.classList.add('is-live');
      }, () => {});
    };
    near = ScrollTrigger.create({ trigger: section, start: 'top bottom+=100%', onEnter: build });
    const offOpening = opening.after(() => { addEventListener('scroll', soon, { passive: true }); soon(); });
    return () => {
      offOpening();
      clearTimeout(quiet);
      removeEventListener('scroll', soon);
      near?.kill();
      offBeats();
      phone.removeEventListener('change', onPhone);
      st.kill();
      w?.destroy();
      w = null;
      section.classList.remove('has-wall');
    };
  });

  return (
    <section ref={root} id="results" className="results band band--ink" aria-labelledby="results-title">
      <div className="results__stage" data-beat>
        <div className="results__copy">
          <div className="results__head">
            <h2 id="results-title" className="results__title" data-split="lines">{results.title}</h2>
            <p className="results__state" aria-hidden="true">
              <span className="results__before">{results.before}</span>
              <span className="results__after">{results.after}</span>
            </p>
          </div>
          <ul className="results__list">
            {results.stats.map((s, i) => (
              <li key={s.label} data-reveal="up" data-delay={i * 0.08}>
                <StatValue value={s.value} />
                <p className="stat__label">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="results__wall wall">
          <div className="wall__fallback results__frames">
            {(['before', 'after'] as const).map((k) => (
              <figure key={k} className="frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/img/wall/${k}.webp`} srcSet={`/img/wall/${k}-s.webp 720w, /img/wall/${k}.webp 1200w`} sizes="(max-width: 767px) 50vw, 30vw" alt="" width={1200} height={1325} loading="lazy" decoding="async" />
                <figcaption>{results[k]}</figcaption>
              </figure>
            ))}
          </div>
          <p className="sr-only">{results.alt}</p>
        </div>
      </div>
    </section>
  );
}
