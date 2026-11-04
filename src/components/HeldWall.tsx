'use client';
// The catalog wall holding one moment of the story: the audit page shows the catalog as Samo
// measures it; the 404 shows the raw catalog with one SKU missing. Same renderer, same idle.
import { useRef } from 'react';
import { gsap } from 'gsap';
import { usePage } from '@/engine/next';
import { ease, isMobile, isTouch } from '@/engine';
import { Wall, wallSupported } from '@/wall/wall';
import { GRID } from '@/wall/data';
import { holdKey, mixKey, withIdle } from '@/wall/drive';

type Props = { moment: 'measure' | 'raw'; hole?: boolean; className: string; image: string; alt: string };

export function HeldWall({ moment, hole = false, className, image, alt }: Props) {
  const host = useRef<HTMLDivElement>(null);

  usePage(() => {
    const el = host.current;
    // On phones this wall is decoration around a form or a message: the still frame is enough.
    if (!el || !wallSupported() || isMobile() || isTouch()) return;
    const mobile = false;
    const w = new Wall(el, GRID);
    const enter = { v: 0 };
    w.onFrame = () => {
      const k = holdKey(w, moment, mobile);
      const from = { ...k, scale: k.scale * 1.6 };
      Object.assign(w.state, withIdle(mixKey(from, k, enter.v)), { hole: hole ? enter.v : 0 });
    };
    w.ready.then(() => {
      el.classList.add('is-live');
      gsap.to(enter, { v: 1, duration: 1.6, ease: ease.inOut });
    });
    return () => w.destroy();
  });

  return (
    <div ref={host} className={`wall ${className}`}>
      <div className="wall__fallback">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} width={1200} height={1300} />
      </div>
    </div>
  );
}
