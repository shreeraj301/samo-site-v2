'use client';
// The cookie banner the privacy policy promises, and the analytics boot (src/analytics).
// Shows only when a GA4 ID is set, never in pitch mode, and on the home page only after the
// opening has played, so it never sits on top of the first seconds. Not a modal: the page stays
// usable, and both answers are one tap of equal weight.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { analyticsOn, askAgain, getChoice, onAskAgain, readSource, resume, setChoice, track, type Choice } from '@/analytics';
import { opening } from '@/motion/opening';
import { onPage } from '@/engine';
import { consent, links } from '@/data/site';
import { Roll } from './Roll';

const placeOf = (el: Element) =>
  el.closest('.header, .menu') ? 'header' : el.closest('.footer') ? 'footer' : el.closest('.line') ? 'hero' : 'page';

export function Consent() {
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false); // opened from the footer: move focus into it
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    readSource();
    if (!analyticsOn()) return;
    resume();

    // Asked once per visit, after the page is ready. On the home page that is after the opening
    // (Line.tsx begins it from its own page hook, which runs before this one).
    let timer = 0;
    let shown = false;
    const show = () => {
      if (shown || getChoice()) return;
      shown = true;
      timer = window.setTimeout(() => { if (!getChoice()) setOpen(true); }, 700);
    };
    const offPage = onPage(() => {
      const cancelWait = opening.after(show);
      const cap = window.setTimeout(show, 6000); // an opening that never ends must not hide it forever
      return () => { cancelWait(); clearTimeout(cap); };
    });
    const off = onAskAgain(() => { setAsked(true); setOpen(true); });

    // Count the two things the site is for: booking a call and asking for an audit.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href === links.call.href) track('book_call_click', { place: placeOf(a) });
      else if (href === links.audit) track('audit_click', { place: placeOf(a) });
    };
    document.addEventListener('click', onClick);

    return () => { offPage(); clearTimeout(timer); off(); document.removeEventListener('click', onClick); };
  }, []);

  useEffect(() => { if (open && asked) first.current?.focus(); }, [open, asked]);

  const answer = (c: Choice) => { setChoice(c); setOpen(false); setAsked(false); };

  if (!open) return null;
  return (
    <section className="consent" aria-label={consent.label} data-asked={asked || undefined}>
      <p className="consent__text">
        {consent.text} <Link className="link" href={`${links.privacy}#cookies`}>{consent.more}</Link>
      </p>
      <div className="consent__actions">
        <button ref={first} type="button" className="btn btn--quiet" onClick={() => answer('granted')}><Roll>{consent.allow}</Roll></button>
        <button type="button" className="btn btn--quiet" onClick={() => answer('denied')}><Roll>{consent.deny}</Roll></button>
      </div>
    </section>
  );
}

/** The footer's "Cookie preferences": only there when there is something to choose. */
const noop = () => () => {};
export function CookiePreferences({ label }: { label: string }) {
  // Pitch mode is only known in the browser, so the server never renders it.
  const on = useSyncExternalStore(noop, analyticsOn, () => false);
  if (!on) return null;
  return (
    <li>
      <button type="button" className="footer__btn" onClick={askAgain}>{label}</button>
    </li>
  );
}
