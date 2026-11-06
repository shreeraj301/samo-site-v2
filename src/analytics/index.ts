// Google Analytics 4, loaded only after the visitor says yes in the cookie banner (Consent.tsx),
// as the privacy policy promises. Until then nothing from Google is fetched and nothing is stored.
//
//   NEXT_PUBLIC_GA_ID   the GA4 Measurement ID (G-...). Unset: no banner, no analytics.
//                       "G-PREVIEW" shows the banner for review but never loads Google's script.
//
// Never runs in pitch mode (html[data-pitch]): a founder's demo is not a visit.
// The choice is kept in localStorage ("samo-consent"); the footer's Cookie preferences reopens it.

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const KEY = 'samo-consent';
export type Choice = 'granted' | 'denied';

const listeners = new Set<() => void>();
let loaded = false;

// Where this visit came from, read once on the first page (kept in memory only, so no consent
// is needed). The audit form sends it with the request, so a lead says which post brought it.
let source = '';
export function readSource() {
  if (source || typeof location === 'undefined') return source;
  const q = new URLSearchParams(location.search);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => q.get(k)).filter(Boolean).join(' / ');
  let ref = '';
  try { ref = document.referrer && new URL(document.referrer).hostname !== location.hostname ? new URL(document.referrer).hostname : ''; } catch { /* no referrer */ }
  source = utm || ref || 'direct';
  return source;
}

const pitching = () => typeof document !== 'undefined' && document.documentElement.hasAttribute('data-pitch');

export function getChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

export function setChoice(c: Choice) {
  try { localStorage.setItem(KEY, c); } catch { /* private mode: the choice lasts this page */ }
  if (c === 'granted') load();
  else if (loaded) {
    // Turned off after it ran: stop collection now and drop Google's cookies on this domain.
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    document.cookie.split(';').map((part) => part.split('=')[0].trim()).filter((n) => n === '_ga' || n.startsWith('_ga_'))
      .forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, '')}`; document.cookie = `${n}=; Max-Age=0; path=/`; });
  }
}

/** Someone asked to see the banner again (footer link). */
export function askAgain() { listeners.forEach((fn) => fn()); }
export function onAskAgain(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export const analyticsOn = () => Boolean(GA_ID) && !pitching();

/** Load gtag if the visitor agreed earlier. Called once on boot. */
export function resume() {
  readSource();
  if (analyticsOn() && getChoice() === 'granted') load();
}

function load() {
  if (loaded || !analyticsOn() || GA_ID === 'G-PREVIEW') return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  // gtag must push `arguments` itself, not an array: Google's script reads it that way.
  window.gtag = function gtag() { window.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Send one event (only when analytics is on and agreed to). */
export function track(name: string, params?: Record<string, string | number>) {
  if (!loaded || pitching()) return;
  window.gtag?.('event', name, params);
}
