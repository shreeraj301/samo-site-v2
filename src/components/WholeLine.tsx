// One SKU through Samo's five steps, edge to edge. When the row comes into view, the kurta lands on
// Connect, then moves step to step: it slides over as it was, and the Samo line rebuilds it,
// the tools' spans light up only under their own steps, and Samo's span fills under all five in
// time with the line. The same grid turns on its side on phones.
import type { CSSProperties } from 'react';
import { AdCard, type CardState } from './AdCard';
import { wholeLine } from '@/data/site';

const STATES: CardState[] = ['raw', 'enriched', 'video', 'measured', 'funded'];
const STEP = 0.7; // seconds between steps as the line sweeps across
const START = 0.6; // Connect lands first
const v = (o: Record<string, string | number>) => o as CSSProperties;

export function WholeLine() {
  const { title, sku, steps, spans, samo, numbers } = wholeLine;
  const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);
  const summary = [
    ...spans.map((s) => `${s.label} cover ${and(steps.slice(s.from - 1, s.to))}.`),
    `Nothing else covers ${steps[steps.length - 1]}.`,
    `${samo} runs all five steps, from ${steps[0]} to ${steps[steps.length - 1]}.`,
  ].join(' ');
  const card = (i: number, className: string, count = false) => (
    <AdCard
      slug={sku}
      state={STATES[i]}
      label={i < 2 ? null : 'bestseller'}
      missingTitle={i === 0}
      numbers={STATES[i] === 'measured' ? numbers : undefined}
      countFrom={count && STATES[i] === 'measured' ? START + i * STEP + 0.2 : undefined}
      className={className}
    />
  );

  return (
    <section className="whole" aria-labelledby="whole-title">
      <h2 id="whole-title" className="whole__title wrap" data-split="lines">{title}</h2>
      <p className="sr-only">{summary}</p>
      <div className="whole__line wrap" data-inview data-warm aria-hidden="true" style={v({ '--step': `${STEP}s`, '--start': `${START}s` })}>
        {steps.map((name, i) => (
          <div key={name} className={i === steps.length - 1 ? 'whole__step whole__step--last' : 'whole__step'} style={v({ '--i': i, '--at': i + 1 })}>
            <div className="whole__build">
              {i > 0 && card(i - 1, 'whole__from')}
              {card(i, 'whole__card', true)}
              <i className="whole__seam" />
            </div>
            <p className="whole__name">{name}</p>
          </div>
        ))}
        {spans.map((s, i) => (
          <p key={s.label} className="whole__span" style={v({ '--from': s.from, '--to': s.to + 1, '--i': i })}>
            <span>{s.label}</span>
          </p>
        ))}
        <p className="whole__samo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/samo-logo.webp" alt="" width={913} height={314} loading="lazy" />
        </p>
      </div>
    </section>
  );
}
