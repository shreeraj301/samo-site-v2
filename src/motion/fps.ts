// A frame readout for testing on real phones: open the site with ?fps. Shows the frame rate over
// the last two seconds, the longest frame in that time, and each live wall's resolution and its
// measured cost per heavy frame (from Wall.calibrate). Never shown without the flag.
import { gsap } from 'gsap';

export function startFps() {
  if (!/[?&]fps\b/.test(location.search)) return;
  const el = document.createElement('div');
  el.className = 'fps';
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  const gaps: number[] = [];
  let last = performance.now();
  let shown = 0;
  gsap.ticker.add(() => {
    const now = performance.now();
    gaps.push(now - last);
    last = now;
    if (gaps.length > 120) gaps.shift();
    if (now - shown < 500) return;
    shown = now;
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const walls = [...document.querySelectorAll<HTMLElement>('.wall.is-live[data-dpr]')]
      .map((w) => `${w.classList.contains('wall--hero') ? 'hero' : 'wall'} ${w.dataset.dpr}x${w.dataset.gpu ? ` ${w.dataset.gpu}ms` : ''}`);
    el.textContent = [`${Math.round(1000 / avg)} fps`, `worst ${Math.round(Math.max(...gaps))} ms`, ...walls].join(' · ');
  });
}
