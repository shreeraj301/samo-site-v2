'use client';
// The wires of the stack section: a line from each data tool into Samo and from Samo out to each
// channel, with product cards riding them (plain cards in, designed ads out). Drawn from the
// real positions of the logos, redrawn on resize. Desktop layout only; static under reduced motion.
import { useRef } from 'react';
import { usePage } from '@/engine/next';
import { prefersReducedMotion } from '@/engine';

const IN = ['block-print-kurta', 'wrap-dress'];
const OUT = ['block-print-kurta', 'wrap-dress', 'court-sneaker', 'gold-hoops', 'denim-jacket', 'silk-saree'];

export function FlowWires() {
  const root = useRef<HTMLDivElement>(null);

  usePage(() => {
    const el = root.current;
    const flow = el?.parentElement;
    if (!el || !flow) return;
    const wires = el.querySelector<HTMLElement>('.flow__lines')!;
    // Layout positions inside the flow (offsets ignore the reveal's transforms).
    const box = (n: HTMLElement) => {
      let left = 0, top = 0;
      for (let e: HTMLElement | null = n; e && e !== flow; e = e.offsetParent as HTMLElement | null) { left += e.offsetLeft; top += e.offsetTop; }
      return { left, top, width: n.offsetWidth, height: n.offsetHeight, right: left + n.offsetWidth };
    };
    const draw = () => {
      const f = { left: 0, top: 0, width: flow.offsetWidth, height: flow.offsetHeight };
      const u = flow.querySelector<HTMLElement>('.flow__units');
      const unit = u ? box(u) : null;
      // Data wires start after each tool's name, so nothing runs through the words.
      const ins = [...flow.querySelectorAll<HTMLElement>('.flow__in .tool__name')].map(box);
      const outs = [...flow.querySelectorAll<HTMLElement>('.flow__out .tool__mark')].map(box);
      el.dataset.on = String(innerWidth >= 1024 && !!unit);
      if (innerWidth < 1024 || !unit) { wires.replaceChildren(); el.querySelectorAll('.chip').forEach((c) => c.remove()); return; }
      const cy = unit.top + unit.height / 2 - f.top;
      const curve = (x1: number, y1: number, x2: number, y2: number, ox = 0, oy = 0) => {
        const dx = (x2 - x1) * 0.55;
        const P = (x: number, y: number) => `${(x - ox).toFixed(1)} ${(y - oy).toFixed(1)}`;
        return `M${P(x1, y1)} C${P(x1 + dx, y1)} ${P(x2 - dx, y2)} ${P(x2, y2)}`;
      };
      // Each wire is a small canvas drawn once, in software. A stroked SVG path makes the GPU build
      // its path pipeline on first sight, which stalled one frame for ~80 ms on a laptop GPU.
      const dpr = Math.min(devicePixelRatio, 2);
      const wire = (x1: number, y1: number, x2: number, y2: number) => {
        const left = Math.min(x1, x2) - 2, top = Math.min(y1, y2) - 2;
        const w = Math.abs(x2 - x1) + 4, h = Math.abs(y2 - y1) + 4;
        const c = document.createElement('canvas');
        c.className = 'wire';
        c.width = Math.ceil(w * dpr);
        c.height = Math.ceil(h * dpr);
        c.style.cssText = `left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
        const g = c.getContext('2d', { willReadFrequently: true });
        if (g) {
          g.scale(dpr, dpr);
          g.strokeStyle = '#d4d4ce';
          g.lineWidth = 1.5;
          g.stroke(new Path2D(curve(x1, y1, x2, y2, left, top)));
        }
        return c;
      };
      const ends = [
        ...ins.map((r) => [r.right - f.left + 16, r.top + r.height / 2 - f.top, unit.left - f.left - 24, cy]),
        ...outs.map((r) => [unit.right - f.left + 28, cy, r.left - f.left - 16, r.top + r.height / 2 - f.top]),
      ] as [number, number, number, number][];
      const pathsIn = ends.slice(0, ins.length).map((e) => curve(...e));
      const pathsOut = ends.slice(ins.length).map((e) => curve(...e));
      wires.replaceChildren(...ends.map((e) => wire(...e)));
      el.querySelectorAll('.chip').forEach((c) => c.remove());
      if (prefersReducedMotion()) return;
      const chip = (d: string, src: string, kind: 'in' | 'out', n: number) => {
        const c = document.createElement('span');
        c.className = `chip chip--${kind}`;
        c.style.offsetPath = `path("${d}")`;
        c.style.setProperty('--n', String(n));
        c.innerHTML = `<img src="/img/p-${src}${kind === 'out' ? '-sand' : ''}-t.webp" alt="" width="160" height="160" decoding="async">`;
        el.appendChild(c);
      };
      pathsIn.forEach((d, i) => chip(d, IN[i % IN.length], 'in', i));
      pathsOut.forEach((d, i) => chip(d, OUT[i % OUT.length], 'out', i));
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(flow);
    return () => ro.disconnect();
  });

  return (
    <div ref={root} className="flow__wires" aria-hidden="true">
      <div className="flow__lines" />
    </div>
  );
}
