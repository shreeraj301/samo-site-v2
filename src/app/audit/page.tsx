import type { Metadata } from 'next';
import { AuditForm } from '@/components/AuditForm';
import { HeldWall } from '@/components/HeldWall';
import { audit } from '@/data/site';

const title = 'Free feed audit';
const description = 'Send Samo your store and get back, within 48 hours, what we would fix first in your product feed and catalog ads. Free, no setup needed.';
// Its own share image (scripts/og-audit.cjs). openGraph is replaced, not merged, so it is spelled out.
const image = { url: '/og-audit.jpg', width: 1200, height: 630, alt: 'A free feed audit, back in 48 hours. Samo.' };

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: 'website', siteName: 'Samo', title: `${title} | Samo`, description, url: '/audit', images: [image] },
  twitter: { card: 'summary_large_image', title: `${title} | Samo`, description, images: [image.url] },
};

export default function Audit() {
  return (
    <div className="audit wrap grid">
      <div className="audit__copy">
        <h1 className="audit__title">{audit.title}</h1>
        <section className="audit__checks" aria-labelledby="checks-title">
          <h2 id="checks-title">{audit.checksTitle}</h2>
          <ul>
            {audit.checks.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </section>
        <AuditForm />
      </div>
      <div className="audit__side">
        <HeldWall
          clear=".audit__copy"
          moment="measure"
          className="wall--audit"
          image="/img/wall/audit.webp"
          imagePhone="/img/wall/audit-m.webp"
          alt="A catalog of product ads where products that waste spend are greyed out and sold-out sizes have left gaps."
        />
      </div>
    </div>
  );
}
