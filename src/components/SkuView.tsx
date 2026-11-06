// One SKU from the wall, before and after: the catalog card as the feed has it, the ad Samo makes
// from it (with its title, filled in when the feed had none), and where it ends up, shown on the
// ad itself. Shown in the copy panel while the wall rings the card (Line.tsx).
import { AdCard } from './AdCard';
import { NAMES } from '@/data/products';
import { peek } from '@/data/site';
import type { Sku } from '@/wall/data';

const SWATCH = ['swatch--blue', 'swatch--ink', 'swatch--grey', 'swatch--out'];
// What happens to the ad, drawn on the card the way the wall draws it: a Samo blue edge for the
// SKUs that get the spend first, grey for the ones skipped, faded out when sold out.
const FATE = ['is-fund', 'is-kept', 'is-skip', 'is-out'];

export function SkuView({ sku, onClose }: { sku: Sku | null; onClose: () => void }) {
  const live = !!sku && sku.cls < 2; // sells: it stays in the ads
  return (
    <section className="line__sku" aria-label={peek.region} aria-live="polite">
      {sku && (
        <div key={sku.index} className="sku">
          <div className="sku__head">
            <p className="sku__name">{NAMES[sku.slug]}</p>
            <button type="button" className="sku__close" onClick={onClose} aria-label={peek.close}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="sku__pair">
            <figure className="sku__card">
              <AdCard slug={sku.slug} state="raw" price={sku.price} missingTitle={sku.missing} />
              <figcaption>{peek.before}<span className="sr-only">: {sku.missing ? peek.said.missing : peek.said.asIs}</span></figcaption>
            </figure>
            <svg className="sku__arrow" viewBox="0 0 20 12" width="20" height="12" aria-hidden="true"><path d="M1 6h17M13 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <figure className={`sku__card sku__card--after ${FATE[sku.cls]}`}>
              {/* Still advertised (it sells): its label and video run. Skipped or sold out: neither. */}
              <AdCard slug={sku.slug} state={live && sku.video ? 'video' : 'designed'} label={live ? sku.label : null} price={sku.price} />
              <figcaption>{peek.after}<span className="sr-only">: {live && sku.video ? peek.said.video : peek.said.ad}{sku.missing ? `, ${peek.said.titled}` : ''}</span></figcaption>
            </figure>
          </div>
          <p className="sku__outcome"><i className={`swatch ${SWATCH[sku.cls]}`} aria-hidden="true" />{peek.outcome[sku.cls]}</p>
        </div>
      )}
    </section>
  );
}
