// One product, drawn as the catalog card or the ad Samo makes from it. Pure markup: the same
// card is used by the reel, the whole-line row, the report and the stack. Sizes come from
// the card's own width (container units), so it reads the same at any size. Ads use the photo
// baked onto the sand ground, so nothing on a card needs a blend mode or a clip to draw.
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
};

export function AdCard({ slug, state, format = '4:5', label = null, missingTitle = false, className = '', numbers, priority = false, countFrom, src }: Props) {
  const p = bySlug(slug);
  const isAd = state !== 'raw' && state !== 'enriched';
  return (
    <div className={`card card--${state} card--f${format.replace(':', '-')} ${className}`} aria-hidden="true">
      <div className="card__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src ?? `/img/p-${p.slug}${isAd ? '-sand' : ''}.webp`} alt="" width={512} height={512} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
        {isAd && label && <span className={`card__label card__label--${label}`}>{LABEL_TEXT[label]}</span>}
        {state === 'video' && <span className="card__play" />}
      </div>
      {isAd ? (
        <div className="card__strip">
          {state === 'measured' && numbers ? (
            <>
              <span><small>Spend</small><b data-count={countFrom ? numbers.spend : undefined} data-delay={countFrom}>{numbers.spend}</b></span>
              <span><small>Profit</small><b data-count={countFrom ? numbers.profit : undefined} data-delay={countFrom}>{numbers.profit}</b></span>
            </>
          ) : (
            <span>{p.price}</span>
          )}
          {state === 'video' && <i className="card__progress" />}
        </div>
      ) : (
        <div className="card__caption">
          <p className={missingTitle ? 'card__title is-missing' : 'card__title'}>{missingTitle ? 'Title missing' : p.name}</p>
          {state === 'enriched' && <p className="card__meta">{p.meta}</p>}
          <p className="card__price">{p.price}</p>
        </div>
      )}
    </div>
  );
}
