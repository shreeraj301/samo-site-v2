'use client';
// Audit request, the way the live site does it: the visitor's email app opens with their store
// filled in for hello@heysamo.com. Only the store is needed; catalog size is optional.
// Swap `send` for a POST to an API route or CRM when one exists.
import { useState, type FormEvent } from 'react';
import { audit, site } from '@/data/site';

const checkStore = (v: string) => (/^\S+\.\S+$/.test(v.trim().replace(/^https?:\/\//, '')) ? '' : 'Add your store’s web address, like yourbrand.com');

export function AuditForm() {
  const f = audit.form;
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const store = String(data.get('store') || '');
    const bad = checkStore(store);
    setError(bad);
    if (bad) {
      e.currentTarget.querySelector<HTMLInputElement>('[name="store"]')?.focus();
      return;
    }
    const size = String(data.get('size') || '');
    const body = [`Store URL: ${store.trim()}`, size && `Catalog size: ${size}`].filter(Boolean).join('\n');
    location.href = `mailto:${site.email}?subject=${encodeURIComponent('Free feed audit')}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (sent) {
    return (
      <p className="form__sent" role="status">
        {f.sent} <a className="link" href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    );
  }

  return (
    <form className="form" noValidate onSubmit={onSubmit} aria-label="Request your audit">
      <div className="field" data-invalid={error ? 'true' : undefined}>
        <label htmlFor="f-store">{f.store.label}</label>
        <input
          id="f-store"
          name="store"
          type="text"
          autoComplete="url"
          inputMode="url"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'f-store-err' : undefined}
          onBlur={(e) => { if (e.target.value) setError(checkStore(e.target.value)); }}
          onInput={() => error && setError('')}
        />
        {error && <span className="field__error" id="f-store-err">{error}</span>}
      </div>
      <div className="field">
        <label htmlFor="f-size">{f.size.label}</label>
        <select id="f-size" name="size" defaultValue="">
          <option value="">Not sure</option>
          {f.size.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <button className="btn--stack" type="submit"><span className="btn__face">{f.submit}</span></button>
    </form>
  );
}
