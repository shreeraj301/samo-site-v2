// Global motion: runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, onScroll, setTransition } from '@/engine';
import { startIdle } from './idle';

export function setupMotion() {
  // Page transition in the motion verb: six blue rows slot in from the left, one after another,
  // like a list being re-sorted, then slot out to the right over the new page.
  setTransition({
    leave: (c) => gsap.timeline()
      .set(c, { autoAlpha: 1 })
      .fromTo(c.children, { xPercent: -101 }, { xPercent: 0, duration: 0.7, ease: ease.inOut, stagger: 0.04 }),
    enter: (c) => gsap.timeline()
      .to(c.children, { xPercent: 101, duration: 0.7, ease: ease.inOut, stagger: 0.04 })
      .set(c, { autoAlpha: 0 }),
  });

  // The header steps aside while reading down and comes back on the way up. In pitch mode it stays
  // away below the hero, so going back a beat never covers the top of the frame. Over the pinned
  // home stage it always stays: the wall is laid out under it, so stepping aside would only leave
  // an empty strip at the top of the screen.
  let last = 0;
  let pinEnd = 0;
  const measurePin = () => {
    const line = document.querySelector<HTMLElement>('.motion .line');
    pinEnd = line ? line.offsetTop + line.offsetHeight - innerHeight : 0;
  };
  ScrollTrigger.addEventListener('refresh', measurePin);
  onScroll(({ y }) => {
    if (Math.abs(y - last) < 6) return;
    const h = document.documentElement;
    h.classList.toggle('frame-away', y > 200 && y >= pinEnd && (y > last || h.classList.contains('is-pitch')));
    last = y;
  });

  startIdle();
}
