'use client';
// Pitch mode: the home page as a row of stops, for showing Samo on a phone (or a laptop and a
// clicker). Tap the right of the screen, or press → / ↓ / Page Down / Space, for the next stop.
// Tap the left third, or press ← / ↑ / Page Up, to go back. Each move glides at an even pace, so the
// pinned scenes play through on the way. Scrolling still works as normal.
// On when the site is opened from the home screen, or with ?pitch in the address (?pitch=0 is off);
// the script in layout.tsx decides before first paint and marks <html data-pitch>.
// The controls show while moving and step out of the way once a stop has landed.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { collectBeats, dimAround, glideTo, isClaimed, onPage, onScroll, undim } from '@/engine';

const wanted = () => document.documentElement.hasAttribute('data-pitch');
const noop = () => () => {};
const LINGER = 1100; // how long the controls stay after a stop lands

const BLOCK = 'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable], .header, .menu, .pitch, .line__sku';
const FIELD = 'input, select, textarea, [contenteditable]';

export function Pitch() {
  const on = useSyncExternalStore(noop, wanted, () => false);
  const home = usePathname() === '/';
  const [beats, setBeats] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [awake, setAwake] = useState(false);
  const go = useRef<(dir: 1 | -1) => void>(() => {});

  useEffect(() => {
    if (!on) return;

    let list: number[] = [];
    let gliding = false;
    let target = 0;
    let rest: number | null = null; // where the last stop landed, while nothing has moved since
    let settle: ReturnType<typeof setTimeout> | undefined;
    let sleep: ReturnType<typeof setTimeout> | undefined;
    const wake = (ms = LINGER) => {
      setAwake(true);
      clearTimeout(sleep);
      sleep = setTimeout(() => setAwake(false), ms);
    };
    const nearest = (y: number) => list.reduce((best, b, i) => (Math.abs(b - y) < Math.abs(list[best] - y) ? i : best), 0);
    const measure = () => {
      list = location.pathname === '/' ? collectBeats() : [];
      setBeats(list);
      if (!gliding) setAt(nearest(scrollY));
    };

    go.current = (dir) => {
      if (list.length < 2) return;
      const y = scrollY;
      let i: number;
      if (gliding) i = target + dir;
      else if (dir > 0) i = list.findIndex((b) => b > y + 8);
      else i = list.findLastIndex((b) => b < y - 8);
      if (i < 0 || i >= list.length) { wake(); return; }
      const duration = 0.85 + 0.45 * Math.min(Math.abs(list[i] - y) / innerHeight, 2.5);
      gliding = true;
      target = i;
      rest = null;
      undim();
      setAt(i);
      wake(duration * 1000 + LINGER);
      clearTimeout(settle);
      settle = setTimeout(() => { gliding = false; }, duration * 1000 + 300);
      glideTo(list[i], duration, () => {
        gliding = false;
        rest = scrollY;
        // Landed: fade whatever the screen edge would cut.
        requestAnimationFrame(() => { if (rest !== null) dimAround(list[i]); });
      });
    };

    // A tap is a press that neither moved nor lingered, outside anything you can press anyway.
    let down: { x: number; y: number; t: number; id: number } | null = null;
    const onDown = (e: PointerEvent) => {
      const blocked = (e.target as Element).closest?.(BLOCK);
      down = e.isPrimary && e.button === 0 && !blocked ? { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId } : null;
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || e.pointerId !== d.id || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || e.timeStamp - d.t > 600) return;
      if (getSelection()?.toString() || document.querySelector('.menu.is-open') || isClaimed(e)) return;
      go.current(e.clientX < innerWidth * 0.3 ? -1 : 1);
    };
    const onCancel = () => { down = null; };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || list.length < 2) return;
      const t = e.target as Element;
      if (t.closest?.(FIELD) || document.querySelector('.menu.is-open')) return;
      const space = e.key === ' ' && !t.closest?.('a, button, summary');
      const next = ['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key) || (space && !e.shiftKey);
      const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) || (space && e.shiftKey);
      if (!next && !back) return;
      e.preventDefault();
      go.current(next ? 1 : -1);
    };

    const offScroll = onScroll(({ y }) => {
      if (rest !== null && Math.abs(y - rest) > 4) { rest = null; undim(); }
      if (!gliding && list.length) setAt(nearest(y));
    });
    const offPage = onPage(() => {
      rest = null;
      undim();
      // After the page's own triggers have measured.
      requestAnimationFrame(() => requestAnimationFrame(measure));
    });
    ScrollTrigger.addEventListener('refresh', measure);
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    addEventListener('pointercancel', onCancel, { passive: true });
    addEventListener('keydown', onKey);

    return () => {
      undim();
      offScroll();
      offPage();
      ScrollTrigger.removeEventListener('refresh', measure);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onCancel);
      removeEventListener('keydown', onKey);
      clearTimeout(sleep);
      clearTimeout(settle);
    };
  }, [on]);

  // Pitch mode only on the home page. Before hydration settles (on is still false) leave the class
  // the first-paint script set alone.
  useEffect(() => {
    if (on) document.documentElement.classList.toggle('is-pitch', home);
  }, [on, home]);

  if (!on || !home || beats.length < 2) return null;
  return (
    <nav className={`pitch${awake ? ' is-awake' : ''}`} aria-label="Pitch">
      <button type="button" className="pitch__btn" aria-label="Previous" disabled={at <= 0} onClick={() => go.current(-1)}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" /></svg>
      </button>
      <ol className="pitch__dots" aria-hidden="true">
        {beats.map((_, i) => <li key={i} className={i < at ? 'is-past' : i === at ? 'is-on' : undefined} />)}
      </ol>
      <p className="sr-only">Stop {at + 1} of {beats.length}</p>
      <button type="button" className="pitch__btn" aria-label="Next" disabled={at >= beats.length - 1} onClick={() => go.current(1)}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" /></svg>
      </button>
    </nav>
  );
}
