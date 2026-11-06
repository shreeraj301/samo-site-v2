'use client';
// Audit request. Posts to /api/audit, which emails the lead to the team (Resend). If sending is not
// set up yet (no API key), the visitor's email app opens with the request filled in, as before.
// Store and email are needed; catalog size is optional. Errors show on blur and clear on typing.
import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { audit, site } from '@/data/site';
import { readSource, track } from '@/analytics';
import { Select } from './Select';

type Field = 'store' | 'email';
const sizes = [{ value: '', label: 'Not sure' }, ...audit.form.size.options.map((o) => ({ value: o, label: o }))];
const bare = (v: string) => v.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
const checks: Record<Field, (v: string) => string> = {
  store: (v) => (/^\S+\.\S+$/.test(bare(v)) ? '' : audit.form.store.error),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : audit.form.email.error),
};

export function AuditForm() {
  const f = audit.form;
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'mailto' | 'failed'>('idle');
  const [sentTo, setSentTo] = useState({ store: '', email: '' });

  const check = (name: Field, v: string) => setErrors((e) => ({ ...e, [name]: checks[name](v) }));
  const clear = (name: Field) => errors[name] && setErrors((e) => ({ ...e, [name]: '' }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === 'sending') return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) || '').trim();
    const next = { store: checks.store(value('store')), email: checks.email(value('email')) };
    setErrors(next);
    const firstBad = (Object.keys(next) as Field[]).find((k) => next[k]);
    if (firstBad) {
      form.querySelector<HTMLInputElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }

    const lead = { store: value('store'), email: value('email'), size: value('size'), company: value('company'), source: readSource() };
    setState('sending');
    let res: Response | null = null;
    try {
      res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
    } catch { /* offline or blocked: handled below */ }

    if (res?.ok) {
      setSentTo({ store: bare(lead.store), email: lead.email });
      setState('sent');
      track('generate_lead', { form: 'feed_audit' });
      return;
    }
    if (res?.status === 503) {
      // Sending is not set up on this deployment: hand over to the visitor's email app.
      const body = [`Store URL: ${lead.store}`, lead.size && `Catalog size: ${lead.size}`].filter(Boolean).join('\n');
      location.href = `mailto:${site.email}?subject=${encodeURIComponent('Free feed audit')}&body=${encodeURIComponent(body)}`;
      setState('mailto');
      return;
    }
    setState('failed');
  };

  if (state === 'sent' || state === 'mailto') {
    return (
      <div className="form__sent" role="status">
        {state === 'sent' ? (
          <>
            <h2 className="form__sent-title" tabIndex={-1} ref={(el) => el?.focus({ preventScroll: false })}>{f.done.title}</h2>
            <p>{f.done.body(sentTo.store, sentTo.email)}</p>
          </>
        ) : (
          <p>{f.sent} <a className="link" href={`mailto:${site.email}`}>{site.email}</a>.</p>
        )}
      </div>
    );
  }

  const field = (name: Field, label: string, props: InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field" data-invalid={errors[name] ? 'true' : undefined}>
      <label htmlFor={`f-${name}`}>{label}</label>
      <input
        id={`f-${name}`}
        name={name}
        required
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `f-${name}-err` : undefined}
        onBlur={(e) => { if (e.target.value) check(name, e.target.value); }}
        onInput={() => clear(name)}
        {...props}
      />
      {errors[name] && <span className="field__error" id={`f-${name}-err`}>{errors[name]}</span>}
    </div>
  );

  return (
    <form className="form" noValidate onSubmit={onSubmit} aria-label={f.label} aria-busy={state === 'sending'}>
      {field('store', f.store.label, { type: 'text', autoComplete: 'url', inputMode: 'url', spellCheck: false })}
      {field('email', f.email.label, { type: 'email', autoComplete: 'email', spellCheck: false })}
      <div className="field">
        <label id="f-size-label" htmlFor="f-size">{f.size.label}</label>
        <Select id="f-size" name="size" labelId="f-size-label" options={sizes} />
      </div>
      {/* People never see this; bots fill it in, and the server drops those. */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="f-company">Company</label>
        <input id="f-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state === 'failed' && (
        <p className="form__failed" role="alert">
          {f.failed} <a className="link" href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      )}
      <button className="btn--stack" type="submit" disabled={state === 'sending'}>
        <span className="btn__face">{state === 'sending' ? f.sending : f.submit}</span>
      </button>
    </form>
  );
}
