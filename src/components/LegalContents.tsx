'use client';
// Contents for a legal page: smooth-scrolls to a section and marks the one you are reading.
import { useRef } from 'react';
import { usePage } from '@/engine/next';
import { scrollToTarget } from '@/engine';

export function LegalContents({ items }: { items: { id: string; label: string }[] }) {
  const nav = useRef<HTMLElement>(null);

  usePage(() => {
    const el = nav.current;
    if (!el) return;
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a')];
    const heads = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const offset = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) * 16 + 24 || 88;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a');
      if (!a || !el.contains(a)) return;
      const target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target.getBoundingClientRect().top + scrollY - offset());
      history.replaceState(null, '', a.hash);
    };
    // The section you are reading: the last heading above a line a third of the way down.
    const onScroll = () => {
      const line = innerHeight / 3;
      let current = 0;
      heads.forEach((h, i) => { if (h.getBoundingClientRect().top < line) current = i; });
      links.forEach((l, i) => (i === current ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current')));
    };
    onScroll();
    el.addEventListener('click', onClick);
    addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('click', onClick); removeEventListener('scroll', onScroll); };
  });

  return (
    <nav ref={nav} className="legal__toc" aria-label="On this page">
      <ul>
        {items.map((i) => (
          <li key={i.id}><a href={`#${i.id}`} data-no-transition>{i.label}</a></li>
        ))}
      </ul>
    </nav>
  );
}
