'use client';
// A select built for the site: a field like the others, and a plain white list with the fields'
// hairline (no button layers: picking a size is not the main action). Follows the WAI-ARIA select-only
// combobox pattern: focus stays on the field, arrows move, Enter or Space picks, Esc closes,
// typing jumps to a match. A hidden input carries the value, so the form reads it as before.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';

export type SelectOption = { value: string; label: string };

type Props = { id: string; name: string; labelId: string; options: SelectOption[]; defaultValue?: string };

export function Select({ id, name, labelId, options, defaultValue = '' }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [side, setSide] = useState<'bottom' | 'top'>('bottom');
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const skipClick = useRef(false); // Enter/Space already handled on keydown
  const typed = useRef({ s: '', t: 0 });

  const last = options.length - 1;
  const chosen = Math.max(0, options.findIndex((o) => o.value === value));
  const optId = (i: number) => `${id}-opt-${i}`;

  const show = (i: number) => {
    // Open upwards when the list would run off the bottom of the screen.
    const r = btn.current?.getBoundingClientRect();
    const need = options.length * 44 + 32;
    if (r) setSide(innerHeight - r.bottom < need && r.top > innerHeight - r.bottom ? 'top' : 'bottom');
    setActive(i);
    setOpen(true);
  };
  const pick = (i: number) => {
    setValue(options[i].value);
    setOpen(false);
    btn.current?.focus();
  };

  // A press anywhere else puts it away.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const typeAhead = (ch: string) => {
    const now = Date.now();
    const t = typed.current;
    t.s = (now - t.t > 700 ? '' : t.s) + ch.toLowerCase();
    t.t = now;
    const from = open ? active : chosen;
    // A fresh letter looks after the current option; a longer string can match it.
    const order = options.map((_, n) => (from + (t.s.length > 1 ? n : n + 1)) % options.length);
    const i = order.find((n) => options[n].label.toLowerCase().startsWith(t.s));
    if (i === undefined) return;
    if (open) setActive(i);
    else setValue(options[i].value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    if (!open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End') {
        e.preventDefault();
        show(k === 'Home' ? 0 : k === 'End' ? last : chosen);
        return;
      }
    } else {
      const move = (i: number) => { e.preventDefault(); setActive(Math.max(0, Math.min(last, i))); };
      if (k === 'ArrowDown') return move(active + 1);
      if (k === 'ArrowUp') { if (e.altKey) { e.preventDefault(); return pick(active); } return move(active - 1); }
      if (k === 'Home' || k === 'PageUp') return move(0);
      if (k === 'End' || k === 'PageDown') return move(last);
      if (k === 'Enter' || k === ' ') { e.preventDefault(); skipClick.current = true; return pick(active); }
      if (k === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (k === 'Tab') { setOpen(false); return; }
    }
    if (k.length === 1 && k !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(k);
  };

  // Mouse, touch, Enter/Space on the closed field and screen readers all arrive here.
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (skipClick.current) { skipClick.current = false; e.preventDefault(); return; }
    if (open) setOpen(false);
    else show(chosen);
  };

  return (
    <div ref={root} className={`select${open ? ' is-open' : ''}`}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={btn}
        id={id}
        type="button"
        className="select__btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={labelId}
        aria-activedescendant={open ? optId(active) : undefined}
        onKeyDown={onKeyDown}
        onKeyUp={() => { skipClick.current = false; }}
        onClick={onClick}
      >
        <span className="select__value">{options[chosen].label}</span>
        <svg className="select__chev" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4.25 6 8.25l4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul id={`${id}-list`} className="select__list" role="listbox" aria-labelledby={labelId} tabIndex={-1} data-side={side} hidden={!open}>
        {options.map((o, i) => (
          <li
            key={o.value || 'none'}
            id={optId(i)}
            role="option"
            aria-selected={i === chosen}
            className={`select__opt${i === active ? ' is-active' : ''}`}
            style={{ '--i': i } as CSSProperties}
            onPointerDown={(e) => e.preventDefault()} // keep focus on the field
            onPointerMove={(e) => { if (e.pointerType === 'mouse' && i !== active) setActive(i); }}
            onClick={() => pick(i)}
          >
            {o.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
