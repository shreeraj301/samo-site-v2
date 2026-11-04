'use client';
// Results on an ink band: the catalog with spend scattered across it turns, as you scroll, into
// the same catalog sorted by profit with the spend on the top rows. The measured numbers sit
// beside it. Without WebGL or with reduced motion, the two pictures sit side by side instead.
import { useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePage } from '@/engine/next';
import { isMobile, prefersReducedMotion } from '@/engine';
import { Wall, wallSupported } from '@/wall/wall';
import { GRID } from '@/wall/data';
import { mixKey, smooth, storyKeys, withIdle } from '@/wall/drive';
import { results } from '@/data/site';
import { StatValue } from './StatValue';

type Still = Window & { __samoStill?: string };

export function Results() {
  const root = useRef<HTMLElement>(null);

  usePage(() => {
    const section = root.current;
    const host = section?.querySelector<HTMLElement>('.results__wall');
    if (!section || !host || prefersReducedMotion() || !wallSupported()) return;
    const mobile = isMobile();
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
    // Seen from afar only: the small atlas is all it needs.
    const w = new Wall(host, GRID, { hd: 'off' });
    w.fade = 0;
    w.onFrame = () => {
      const still = (window as Still).__samoStill;
      const v = still === 'before' ? 0 : still === 'after' ? 1 : t;
      const { keys } = storyKeys(w, mobile);
      // Spend leaves the scattered SKUs a little ahead of the sort, so it reads as moving up.
      w.spread = 1 - smooth(0, 0.7, v);
      Object.assign(w.state, withIdle(mixKey(keys[4], keys[5], v)));
    };
    w.ready.then(() => {
      host.classList.add('is-live');
      // Compile and upload while the visitor is still up top, at an idle moment.
      const prime = () => w.prime();
      if ('requestIdleCallback' in window) requestIdleCallback(prime, { timeout: 4000 });
      else setTimeout(prime, 2500);
    });
    return () => { st.kill(); w.destroy(); section.classList.remove('has-wall'); };
  });

  return (
    <section ref={root} id="results" className="results band band--ink" aria-labelledby="results-title">
      <div className="results__stage">
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
