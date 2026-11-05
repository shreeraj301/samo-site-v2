// The weekly SKU report as it lands: a card built like the logo (a white face over blue and
// mint), three lists with their counts and the products on each. Colours match the wall:
// blue gets the spend, red is a feed error, grey spends without selling.
import type { CSSProperties } from 'react';
import { bySlug } from '@/data/products';
import { outcome } from '@/data/site';
import { Logo, logoTitle, type LogoName } from './Logos';
import { StatValue } from './StatValue';

export function WeeklyReport() {
  const { title, when, groups, channels } = outcome.report;
  const names = (channels as LogoName[]).map(logoTitle);
  return (
    <div className="report" data-inview data-warm data-beat>
      <div className="report__face">
        <div className="report__head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="report__logo" src="/img/samo-logo.webp" alt="Samo" width={913} height={314} loading="lazy" />
          <h3 className="report__title">{title}</h3>
          <p className="report__when">{when}</p>
        </div>
        <ul className="report__groups">
          {groups.map((g, i) => (
            <li key={g.key} className={`report__group report__group--${g.key}`} style={{ '--i': i } as CSSProperties}>
              <StatValue value={String(g.count)} className="report__count" />
              <div className="report__text">
                <p className="report__name"><span className="report__swatch" aria-hidden="true" />{g.name}</p>
                <p className="report__note">SKUs {g.note}</p>
              </div>
              <ul className="report__skus" aria-label={`${g.name}: ${g.skus.map((s) => bySlug(s).name).join(', ')}`}>
                {g.skus.map((s, j) => (
                  <li key={s} style={{ '--j': j } as CSSProperties}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/img/p-${s}-sand-t.webp`} alt="" width={160} height={160} loading="lazy" decoding="async" />
                    {g.key === 'fix' && <i className="report__dot" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="report__foot">
          <ul className="report__channels" aria-label={`Lands in ${names[0]} and ${names[1]}. Ask ${names[2]} or ${names[3]} about any SKU.`}>
            {(channels as LogoName[]).map((c, k) => <li key={c} title={logoTitle(c)} style={{ '--k': k } as CSSProperties}><Logo name={c} /></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
