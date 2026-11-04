'use client';
// The Samo line: a strip of products moves through a white and mint scan line (the logo's top
// two layers, on a Samo blue band). Two copies of the strip sit on top of each other, the catalog cards clipped to the
// left of the line and the finished ads clipped to the right, so each product is made pixel
// column by pixel column while the clips stay still. Only transforms change per frame.
// Once a card is through, its 9:16 and 1:1 versions slide out from behind it and its video runs.
// One clock (GSAP ticker), paused off screen; scroll speeds it up, hover slows it, touch drags it.
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePage } from '@/engine/next';
import { isTouch, onScroll, prefersReducedMotion } from '@/engine';
import { AdCard } from './AdCard';
import { type AdLabel } from '@/data/products';
import { reel } from '@/data/site';

const LABELS: AdLabel[] = ['bestseller', 'sale', 'new', null, 'sale', 'bestseller', 'new', 'sale', null, 'bestseller', 'new', 'sale'];
const ORDER = ['block-print-kurta', 'court-sneaker', 'wrap-dress', 'silk-saree', 'denim-jacket', 'kolhapuri-sandals', 'gold-hoops', 'cable-knit', 'crossbody-bag', 'mustard-dupatta', 'oxford-shirt', 'block-print-palazzo'];
const units = ORDER.map((slug, i) => ({ slug, label: LABELS[i % LABELS.length], missing: i % 3 === 1 }));
const SCAN = 0.5; // the line's place across the track (CSS: --scan)
const START = 2.3; // units already past the line on first paint, so the still tells the story

export function Reel() {
  const root = useRef<HTMLElement>(null);

  usePage(() => {
    const section = root.current;
    const track = section?.querySelector<HTMLElement>('.reel__track');
    if (!section || !track) return;
    const raw = [...track.querySelectorAll<HTMLElement>('.reel__lane--raw .reel__unit')];
    const made = [...track.querySelectorAll<HTMLElement>('.reel__lane--made .reel__unit')];
    let unitW = 0, trackW = 0, scanX = 0;
    const measure = () => {
      unitW = raw[0].offsetWidth;
      trackW = track.offsetWidth;
      scanX = trackW * SCAN;
    };
    measure();

    // Lay out every unit for a strip offset. The made flag flips once the whole card is through.
    const isMade: boolean[] = [];
    const place = (offset: number) => {
      const span = unitW * raw.length;
      for (let i = 0; i < raw.length; i++) {
        let x = ((i * unitW + offset) % span + span) % span - unitW;
        if (x > trackW + unitW) x -= span;
        const t = `translate3d(${x.toFixed(2)}px,0,0)`;
        raw[i].style.transform = t;
        made[i].style.transform = t;
        const m = x >= scanX;
        if (m !== isMade[i]) {
          isMade[i] = m;
          made[i].classList.toggle('is-made', m);
        }
      }
    };

    if (prefersReducedMotion()) {
      const still = () => { measure(); place(scanX - unitW * START); };
      still();
      const ro = new ResizeObserver(still);
      ro.observe(track);
      return () => ro.disconnect();
    }

    let offset = scanX - unitW * START;
    let speed = 0;
    const base = 46; // px per second
    let boost = 0;
    let hover = false;
    let drag: { x: number; o: number } | null = null;
    let visible = false;
    place(offset);

    const offScroll = onScroll(({ velocity }) => { boost = Math.min(Math.abs(velocity) * 22, 900); });
    const tick = () => {
      if (!visible) return;
      const dt = gsap.ticker.deltaRatio() / 60;
      const want = drag ? 0 : hover ? 6 : base + boost;
      speed += (want - speed) * Math.min(1, dt * 4);
      boost *= Math.pow(0.04, dt);
      if (!drag) offset += speed * dt;
      place(offset);
    };
    gsap.ticker.add(tick);
    const st = ScrollTrigger.create({
      trigger: section, start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { visible = s.isActive; section.classList.toggle('is-on', s.isActive); },
    });

    const enter = () => { hover = true; };
    const leave = () => { hover = false; };
    const down = (e: PointerEvent) => {
      if (!isTouch() && e.pointerType === 'mouse') return;
      drag = { x: e.clientX, o: offset };
    };
    const move = (e: PointerEvent) => { if (drag) offset = drag.o + (e.clientX - drag.x); };
    const up = () => { drag = null; };
    track.addEventListener('pointerenter', enter);
    track.addEventListener('pointerleave', leave);
    track.addEventListener('pointerdown', down);
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    const ro = new ResizeObserver(() => { measure(); place(offset); });
    ro.observe(track);

    return () => {
      gsap.ticker.remove(tick);
      offScroll();
      st.kill();
      ro.disconnect();
      track.removeEventListener('pointerenter', enter);
      track.removeEventListener('pointerleave', leave);
      track.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  });

  return (
    <section ref={root} className="reel band band--blue" aria-labelledby="reel-title">
      <div className="reel__head wrap">
        <h2 id="reel-title" className="reel__title" data-split="lines">{reel.title}</h2>
      </div>
      <div className="reel__track" data-warm role="img" aria-label="Product photos cross a blue line and come out as designed ads in three sizes, each with a video.">
        <div className="reel__lane reel__lane--raw" aria-hidden="true">
          {units.map((u, i) => (
            <div key={i} className="reel__unit">
              <AdCard slug={u.slug} state="raw" missingTitle={u.missing} className="reel__main" />
            </div>
          ))}
        </div>
        <div className="reel__lane reel__lane--made" aria-hidden="true">
          {units.map((u, i) => (
            <div key={i} className="reel__unit">
              <AdCard slug={u.slug} state="video" format="9:16" label={u.label} className="reel__size reel__size--story" />
              <AdCard slug={u.slug} state="designed" format="1:1" label={u.label} className="reel__size reel__size--square" />
              <AdCard slug={u.slug} state="video" label={u.label} className="reel__main" />
            </div>
          ))}
        </div>
        <div className="reel__line" aria-hidden="true" />
      </div>
    </section>
  );
}
