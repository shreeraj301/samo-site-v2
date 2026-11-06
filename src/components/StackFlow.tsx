// Where the data comes from and where the ads go. The tools sit on either side as their own
// marks, wired into Samo in the middle, where one product after another crosses the Samo line
// and comes out as an ad set. Product cards ride the wires: plain cards in, designed ads out.
import type { CSSProperties } from 'react';
import { AdCard } from './AdCard';
import { Logo } from './Logos';
import { stack } from '@/data/site';
import { FlowWires } from './FlowWires';

type ToolGroup = (typeof stack.groups)[number];
const LOOP = [
  { slug: 'block-print-kurta', label: 'bestseller' },
  { slug: 'wrap-dress', label: 'new' },
  { slug: 'court-sneaker', label: 'low' },
] as const;

function Group({ g, i }: { g: ToolGroup; i: number }) {
  return (
    <div className="stack__group" data-reveal="up" data-delay={i * 0.08} data-beat>
      <h3>{g.name}</h3>
      <ul className="tools">
        {g.tools.map((t) => (
          <li key={t.name} className="tool">
            <span className="tool__mark"><Logo name={t.logo} /></span>
            <span className="tool__name">{t.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StackFlow() {
  const [dataIn, adsOut, reports] = stack.groups;
  return (
    <section className="stack wrap" aria-labelledby="stack-title">
      <h2 id="stack-title" className="stack__title" data-split="lines" data-beat>{stack.title}</h2>
      <div className="flow" data-inview data-warm>
        <div className="flow__in"><Group g={dataIn} i={0} /></div>
        <div className="flow__pass" aria-hidden="true" data-beat>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="flow__logo" src="/img/samo-logo.webp" alt="" width={913} height={314} loading="lazy" />
          <div className="flow__units">
            {LOOP.map((p, k) => (
              <div key={p.slug} className="flow__unit" style={{ '--k': k } as CSSProperties}>
                <AdCard slug={p.slug} state="video" format="9:16" label={p.label} className="flow__size flow__size--story" />
                <AdCard slug={p.slug} state="designed" format="1:1" label={p.label} className="flow__size flow__size--square" />
                <div className="flow__made"><AdCard slug={p.slug} state="video" label={p.label} /></div>
                <div className="flow__raw"><AdCard slug={p.slug} state="raw" missingTitle={k === 0} /></div>
                <div className="flow__line" />
              </div>
            ))}
          </div>
        </div>
        <div className="flow__out">
          <Group g={adsOut} i={1} />
          <Group g={reports} i={2} />
        </div>
        <FlowWires />
      </div>
    </section>
  );
}
