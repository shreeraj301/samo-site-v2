// One product, drawn as the catalog card or the ad Samo makes from it. Pure markup: the same
// card is used by the reel, the whole-line row, the report and the stack. Sizes come from
// the card's own width (container units), so it reads the same at any size. Ads use the photo
// baked onto the sand ground, so nothing on a card needs a blend mode or a clip to draw.
// Each ad size has its own layout, the way the format is seen:
//   4:5 feed post: the photo, then a strip with the name, the price and Shop now.
//   9:16 story: progress bars and the brand along the top, the product in the middle, the price
//     and a wide Shop now in the thumb zone at the bottom.
//   1:1 catalog card (carousels, shopping): the photo with a next arrow, then a white shelf
//     with the name and the price.
import type { ReactNode } from 'react';
import { bySlug, LABEL_TEXT, type AdLabel } from '@/data/products';

export type CardState = 'raw' | 'enriched' | 'designed' | 'video' | 'measured' | 'funded';
type Props = {
  slug: string;
  state: CardState;
  format?: '4:5' | '1:1' | '9:16';
  label?: AdLabel;
  missingTitle?: boolean;
  className?: string;
  numbers?: { spend: string; profit: string };
  /** The first thing on screen: load the photo at once. */
  priority?: boolean;
  /** Count the measured numbers up from zero when they come into view, after this many seconds. */
  countFrom?: number;
  /** A different photo file for this one card (the opening card uses the wall's own hero photo). */
  src?: string;
  /** This card's own price, when it differs from the product's (the cards on the wall). */
  price?: string;
};

// The demo brand every ad belongs to (a made-up name, like the products).
const BRAND = 'yourbrand';

export function AdCard({ slug, state, format = '4:5', label = null, missingTitle = false, className = '', numbers, priority = false, countFrom, src, price }: Props) {
  const p = bySlug(slug);
  const isAd = state !== 'raw' && state !== 'enriched';
  const sell = price ?? p.price;
  const cls = `card card--${state} card--f${format.replace(':', '-')} ${className}`;
  const photo = (extra?: ReactNode) => (
    <div className="card__photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src ?? `/img/p-${p.slug}${isAd ? '-sand' : ''}.webp`} alt="" width={512} height={512} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
      {isAd && label && <span className={`card__label card__label--${label}`}>{LABEL_TEXT[label]}</span>}
      {extra}
    </div>
  );

  if (isAd && format === '9:16') {
    return (
      <div className={cls} aria-hidden="true">
        <div className="card__bars"><i className="is-done" /><i><i className="card__progress" /></i><i /></div>
        <div className="card__brand"><span className="card__avatar">{BRAND[0]}</span><span><b>{BRAND}</b><small>Sponsored</small></span></div>
        {photo()}
        <p className="card__big">{sell}</p>
        <span className="card__cta card__cta--wide">Shop now</span>
      </div>
    );
  }
  if (isAd && format === '1:1') {
    return (
      <div className={cls} aria-hidden="true">
        {photo(<>{state === 'video' && <span className="card__play" />}<span className="card__next" /></>)}
        <div className="card__shelf"><small>{p.name}</small><b>{sell}</b></div>
      </div>
    );
  }
  return (
    <div className={cls} aria-hidden="true">
      {photo(state === 'video' && <span className="card__play" />)}
      {isAd ? (
        <div className="card__strip">
          {state === 'measured' && numbers ? (
            <>
              <span><small>Spend</small><b data-count={countFrom ? numbers.spend : undefined} data-delay={countFrom}>{numbers.spend}</b></span>
              <span><small>Profit</small><b data-count={countFrom ? numbers.profit : undefined} data-delay={countFrom}>{numbers.profit}</b></span>
            </>
          ) : (
            <>
              <span className="card__sell"><small>{p.name}</small>{sell}</span>
              <span className="card__cta">Shop now</span>
            </>
          )}
          {state === 'video' && <i className="card__progress" />}
        </div>
      ) : (
        <div className="card__caption">
          <p className={missingTitle ? 'card__title is-missing' : 'card__title'}>{missingTitle ? 'Title missing' : p.name}</p>
          {state === 'enriched' && <p className="card__meta">{p.meta}</p>}
          <p className="card__price">{sell}</p>
        </div>
      )}
    </div>
  );
}
