'use client';
// Registers the offline kit (public/sw.js) on production builds. Once the page has settled, it
// hands over what this visit already loaded, so the next visit works without a connection.
// In pitch mode it asks for the whole kit: every page and everything they use.
import { useEffect } from 'react';

export function Offline() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        const reg = await navigator.serviceWorker.ready;
        timer = setTimeout(() => {
          const urls = performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.startsWith(location.origin));
          reg.active?.postMessage({ type: 'keep', urls });
          if (document.documentElement.hasAttribute('data-pitch')) reg.active?.postMessage({ type: 'kit' });
        }, 4000);
      } catch {}
    };
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
    return () => { clearTimeout(timer); removeEventListener('load', start); };
  }, []);
  return null;
}
