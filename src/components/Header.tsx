'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { links, hero } from '@/data/site';
import { stopScroll, startScroll } from '@/engine';

const nav = [
  { href: '/#ch-connect', label: 'How it works' },
  { href: links.audit, label: 'Free feed audit' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpenState] = useState(false);
  // The menu is out of the page (hidden) while closed; it stays shown through its close motion.
  const [shown, setShown] = useState(false);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setOpen = (v: boolean) => {
    clearTimeout(closing.current);
    if (v) setShown(true);
    else closing.current = setTimeout(() => setShown(false), 450);
    setOpenState(v);
  };
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { startScroll(); return; }
    stopScroll();
    const first = menu.current?.querySelector<HTMLElement>('a');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (e.key !== 'Tab' || !menu.current) return;
      const items = [toggle.current!, ...menu.current.querySelectorAll<HTMLElement>('a')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className="header">
        <Link href="/" className="logo" aria-label="Samo, home" aria-current={pathname === '/' ? 'page' : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/samo-logo.webp" alt="" width={913} height={314} />
        </Link>
        <nav className="nav" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="nav__link" aria-current={pathname === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
          <a className="btn--stack" href={links.call.href}><span className="btn__face">Book a call</span></a>
        </nav>
        <button
          ref={toggle}
          className="menu-toggle btn btn--quiet"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </header>
      <div id="menu" ref={menu} className={`menu${open && shown ? ' is-open' : ''}`} hidden={!open && !shown} inert={!open}>
        <ul className="menu__list">
          {nav.map((n, i) => (
            <li className="menu__item" key={n.href} style={{ ['--i' as string]: i }}>
              <Link href={n.href} onClick={() => setOpen(false)} aria-current={pathname === n.href ? 'page' : undefined}>{n.label}</Link>
            </li>
          ))}
        </ul>
        <div className="menu__item" style={{ ['--i' as string]: nav.length }}>
          <a className="btn--stack menu__cta" href={links.call.href}><span className="btn__face">{hero.primary}</span></a>
        </div>
      </div>
    </>
  );
}
