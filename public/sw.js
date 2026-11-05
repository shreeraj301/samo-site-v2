// Samo's offline kit. Pages come from the network when it answers quickly and from this cache when
// it does not, so a pitch keeps running on bad or no signal. Built files (hashed names) and images
// are served from the cache once saved.
// Ordinary visits only keep what they already loaded. Pitch mode asks for the whole kit: every page
// and everything those pages use, so the site works offline after one visit on good Wi-Fi.
// Bump VERSION to drop everything saved before.
const VERSION = 'samo-1';
const PAGES = ['/', '/audit', '/privacy', '/terms', '/data-deletion'];
const WAIT = 3000; // how long a page waits for the network before using the saved copy

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const same = (url) => new URL(url, self.location.origin).origin === self.location.origin;
const isRsc = (req) => req.headers.get('RSC') === '1' || new URL(req.url).searchParams.has('_rsc');

async function save(urls) {
  const cache = await caches.open(VERSION);
  await Promise.all([...new Set(urls)].filter(same).map(async (u) => {
    try {
      if (await cache.match(u)) return;
      const res = await fetch(u, { credentials: 'same-origin' });
      if (res.ok) await cache.put(u, res);
    } catch {}
  }));
}

// Every built file and image a page names, including the code it loads later.
const ASSET = /\/(?:_next\/static|img|icons)\/[^"'\s,)\\]+/g;
async function kit() {
  const cache = await caches.open(VERSION);
  const found = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/apple-icon.png', '/icon.png'];
  await Promise.all(PAGES.map(async (p) => {
    try {
      const res = await fetch(p, { cache: 'reload' });
      if (!res.ok) return;
      await cache.put(p, res.clone());
      const html = await res.text();
      for (const m of html.matchAll(ASSET)) found.push(m[0].replace(/&amp;/g, '&'));
    } catch {}
  }));
  // Stylesheets name the fonts.
  const css = found.filter((u) => u.endsWith('.css'));
  await save(found);
  await Promise.all(css.map(async (u) => {
    const res = await cache.match(u);
    if (res) await save([...(await res.text()).matchAll(/url\(([^)]+)\)/g)].map((m) => new URL(m[1].replace(/["']/g, ''), self.location.origin + u).pathname));
  }));
}

self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'keep' && Array.isArray(d.urls)) e.waitUntil(save(d.urls));
  if (d.type === 'kit') e.waitUntil(kit());
});

async function page(req) {
  const cache = await caches.open(VERSION);
  const key = new URL(req.url).pathname;
  const net = fetch(req).then((res) => {
    if (res.ok) cache.put(key, res.clone());
    return res;
  });
  const timer = new Promise((r) => setTimeout(r, WAIT));
  const first = await Promise.race([net.catch(() => null), timer]);
  if (first) return first;
  const saved = await cache.match(key);
  if (saved) return saved;
  try { return await net; } catch { return (await cache.match('/')) || Response.error(); }
}

async function built(req) {
  const cache = await caches.open(VERSION);
  const saved = await cache.match(req);
  if (saved) return saved;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function fresh(req) {
  const cache = await caches.open(VERSION);
  const saved = await cache.match(req);
  const net = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => saved);
  return saved || net;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !same(req.url) || isRsc(req)) return;
  const { pathname } = new URL(req.url);
  if (req.mode === 'navigate') e.respondWith(page(req));
  else if (pathname.startsWith('/_next/static/')) e.respondWith(built(req));
  else if (/^\/(img|icons)\/|\.(png|webp|jpg|svg|webmanifest)$/.test(pathname)) e.respondWith(fresh(req));
});
