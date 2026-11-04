import type { Metadata } from 'next';
import Link from 'next/link';
import { HeldWall } from '@/components/HeldWall';
import { links, notFound } from '@/data/site';
import { Roll } from '@/components/Roll';

export const metadata: Metadata = {
  title: 'Page sold out',
  description: 'This page is not in the catalog any more. Go back to the Samo homepage or request a free feed audit.',
};

export default function NotFound() {
  return (
    <div className="lost">
      <HeldWall
        moment="raw"
        hole
        className="wall--lost"
        image="/img/wall/lost.webp"
        alt="A wall of plain catalog cards with one empty slot in the middle."
      />
      <div className="lost__panel">
        <h1>{notFound.title}</h1>
        <div className="hero__actions">
          <Link className="btn--stack" href="/"><span className="btn__face">{notFound.home}</span></Link>
          <Link className="btn btn--quiet" href={links.audit}><Roll>Get a free feed audit</Roll></Link>
        </div>
      </div>
    </div>
  );
}
