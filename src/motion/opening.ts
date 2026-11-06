// The home page's opening owns the first seconds: anything heavy elsewhere on the page (another
// wall to compile and upload) waits until it has played, so no frame of it is ever dropped.
let done = true; // pages without an opening have nothing to wait for
let began = false;
const queue = new Set<() => void>();
// The page's markup can arrive (and other code can run) before Line.tsx has begun its opening:
// a page that has one (data-opening) and will play it (motion allowed) counts as waiting.
const expected = () =>
  !began && typeof document !== 'undefined' && document.querySelector('[data-opening]') !== null
  && !matchMedia('(prefers-reduced-motion: reduce)').matches;

export const opening = {
  /** The opening is about to play (Line.tsx). */
  begin() { done = false; began = true; },
  /** It has played: run everything that waited. */
  end() {
    done = true;
    const fns = [...queue];
    queue.clear();
    fns.forEach((fn) => fn());
  },
  /** Leaving the page: forget the waiting list without running it. */
  reset() { done = true; began = false; queue.clear(); },
  /** Run fn once the opening has played (now, if it has). Returns a cancel. */
  after(fn: () => void) {
    if (done && !expected()) { fn(); return () => {}; }
    queue.add(fn);
    return () => { queue.delete(fn); };
  },
};
