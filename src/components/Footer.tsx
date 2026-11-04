'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { finale, links, site } from '@/data/site';
import { Roll } from './Roll';

export function Footer() {
  const pathname = usePathname();
  // On the audit page the audit is already here: offer the inbox instead.
  const onAudit = pathname === links.audit;
  return (
    <footer className="footer">
      <a className="finale__cta" href={links.call.href}>{finale.cta}</a>
      <div className="finale__alt">
        {onAudit
          ? <a className="btn btn--quiet" href={`mailto:${site.email}`}><Roll>{site.email}</Roll></a>
          : <Link className="btn btn--quiet" href={links.audit}><Roll>{finale.alt}</Roll></Link>}
      </div>
      <div className="footer__base">
        <Link href="/" className="logo" aria-label="Samo, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/samo-logo.webp" alt="" width={913} height={314} loading="lazy" />
        </Link>
        <ul className="footer__links">
          <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
          <li><Link href={links.privacy}>Privacy</Link></li>
          <li><Link href={links.terms}>Terms</Link></li>
          <li><Link href={links.dataDeletion}>Data deletion</Link></li>
          <li>© 2026 {site.legal}</li>
        </ul>
      </div>
    </footer>
  );
}
