'use client';
// A measured result that counts up from zero the first time it scrolls into view.
// The server renders the final figure, so crawlers, no-JS and reduced motion get it as is.
import { useRef } from 'react';
import { gsap } from 'gsap';
import { usePage } from '@/engine/next';
import { prefersReducedMotion } from '@/engine';

export function StatValue({ value, className = 'stat__value' }: { value: string; className?: string }) {
  const el = useRef<HTMLParagraphElement>(null);
  usePage(() => {
    const node = el.current;
    const m = value.match(/^(\d+)(.*)$/);
    if (!node || !m || prefersReducedMotion()) return;
    const to = +m[1];
    const n = { v: 0 };
    gsap.to(n, {
      v: to,
      duration: 1.6,
      ease: 'expo.out',
      scrollTrigger: { trigger: node, start: 'top 88%', once: true },
      onStart: () => { node.textContent = `0${m[2]}`; },
      onUpdate: () => { node.textContent = `${Math.round(n.v)}${m[2]}`; },
    });
  });
  return <p ref={el} className={className}>{value}</p>;
}
