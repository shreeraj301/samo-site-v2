// A legal page in the site's own frame: a big title, the date, a contents list that stays beside
// the text on desktop, and the document itself in a readable column. The wording comes from
// src/data/legal.ts unchanged.
import type { LegalDoc } from '@/data/legal';
import { withContents } from '@/data/legal';
import { LegalContents } from './LegalContents';

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { html, toc } = withContents(doc.html);
  return (
    <article className="legal wrap" aria-labelledby="legal-title">
      <header className="legal__head">
        <h1 id="legal-title" className="legal__title" data-split="lines" data-intro>{doc.title}</h1>
        <p className="legal__date">Last updated: {doc.updated}</p>
      </header>
      <div className="legal__grid">
        <LegalContents items={toc} />
        <div className="legal__body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  );
}
