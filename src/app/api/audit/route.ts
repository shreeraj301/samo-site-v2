// Audit requests from /audit. Each one is emailed to the team through Resend, with the visitor as
// reply-to, so answering the lead is one Reply in the inbox.
//
// Needs RESEND_API_KEY (and heysamo.com verified in Resend). Without it this answers 503 with
// { fallback: true } and the form opens the visitor's email app instead, as the site did before.
// Optional: AUDIT_TO (default hello@heysamo.com), AUDIT_FROM (default "Samo website <audit@heysamo.com>").
import { site } from '@/data/site';

const MAX = 300;
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, MAX) : '');
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isStore = (v: string) => /^\S+\.\S+$/.test(v.replace(/^https?:\/\//, ''));

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }

  // Bots fill every field; people never see this one. Say yes and send nothing.
  if (clean(body.company)) return Response.json({ ok: true });

  const store = clean(body.store);
  const email = clean(body.email);
  const size = clean(body.size);
  const source = clean(body.source);
  if (!isStore(store) || !isEmail(email)) return Response.json({ error: 'invalid' }, { status: 422 });

  const key = process.env.RESEND_API_KEY;
  if (!key) return Response.json({ fallback: true }, { status: 503 });

  const lines = [`Store: ${store}`, `Email: ${email}`, `Catalog size: ${size || 'Not given'}`];
  if (source) lines.push(`Came from: ${source}`);
  lines.push('', 'Reply to this email to answer them directly.');
  const text = lines.join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AUDIT_FROM || `Samo website <audit@${new URL(site.url).hostname}>`,
      to: [process.env.AUDIT_TO || site.email],
      reply_to: email,
      subject: `Feed audit: ${store.replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
      text,
    }),
  }).catch(() => null);

  if (!res || !res.ok) return Response.json({ error: 'send-failed' }, { status: 502 });
  return Response.json({ ok: true });
}
