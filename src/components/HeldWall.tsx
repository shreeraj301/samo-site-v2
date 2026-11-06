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

// clear: a block of copy the wall may sit behind. Its left edge then starts where that copy's
// words and fields end, and dissolves from there.
type Props = { moment: 'measure' | 'raw'; hole?: boolean; className: string; image: string; alt: string; clear?: string };

/** Right edge (px) of the words and form fields inside box. */
function inkRight(box: Element) {
  let right = -Infinity;
  const range = document.createRange();
  const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (r.width) right = Math.max(right, r.right);
  }
  box.querySelectorAll('input:not([type=hidden]), .select__btn, button').forEach((c) => {
    const r = c.getBoundingClientRect();
    if (r.width) right = Math.max(right, r.right);
  });
  return right;
}

export function HeldWall({ moment, hole = false, className, image, alt, clear }: Props) {
  const host = useRef<HTMLDivElement>(null);

  usePage(() => {
    const el = host.current;
    // On phones this wall is decoration around a form or a message: the still frame is enough.
    if (!el || !wallSupported() || isMobile() || isTouch()) return;
    const mobile = false;
    const w = new Wall(el, GRID);
    const enter = { v: 0 };
    // How far the copy reaches into the wall: that strip is never drawn (the camera centres the
    // catalog in the rest). Re-measured when either box changes size.
    let covered = 0;
    const box = clear ? document.querySelector(clear) : null;
    const measure = () => {
      if (!box) return;
      covered = Math.max(0, inkRight(box) + 24 - el.getBoundingClientRect().left);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (box) ro.observe(box);
    w.onFrame = () => {
      // Every edge that meets the page dissolves into it (the right one runs off the screen).
      // Sized from the wall itself, so it holds at every window size.
      const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
      w.clipLeft = covered;
      w.fadeLeft = clamp((w.width - covered) * 0.2, 72, 200);
      w.fadeTop = clamp(w.height * 0.12, 56, 120);
      w.fade = clamp(w.height * 0.16, 72, 160);
      const k = holdKey(w, moment, mobile);
      const from = { ...k, scale: k.scale * 1.6 };
      Object.assign(w.state, withIdle(mixKey(from, k, enter.v)), { hole: hole ? enter.v : 0 });
    };
    w.ready.then(() => {
      el.classList.add('is-live');
      gsap.to(enter, { v: 1, duration: 1.6, ease: ease.inOut });
    });
    return () => { ro.disconnect(); w.destroy(); };
  });

  return (
    <div ref={host} className={`wall wall--soft ${className}`}>
      <div className="wall__fallback">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} width={1200} height={1300} />
      </div>
    </div>
  );
}
