import type { Metadata } from 'next';
import { AuditForm } from '@/components/AuditForm';
import { HeldWall } from '@/components/HeldWall';
import { audit } from '@/data/site';

export const metadata: Metadata = {
  title: 'Free feed audit',
  description: 'Send Samo your store and get back, within 48 hours, what we would fix first in your product feed and catalog ads. Free, no setup needed.',
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
          moment="measure"
          className="wall--audit"
          image="/img/wall/audit.webp"
          alt="A catalog of product ads where products that waste spend are greyed out and sold-out sizes have left gaps."
        />
      </div>
    </div>
  );
}
