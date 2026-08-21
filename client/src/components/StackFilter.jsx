import { useEffect, useRef, useState } from 'react';

export function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function inMonth(date, key) {
  if (!date || !key) return false;
  if (typeof date === 'string' && /^\d{4}-\d{2}/.test(date)) {
    return date.slice(0, 7) === key;
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
}

export function monthChoices() {
  const now = new Date();
  const opts = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    });
  }
  return opts;
}

export function useStack() {
  const [stack, setStack] = useState('live');
  const [month, setMonth] = useState(thisMonth);
  return { stack, setStack, month, setMonth };
}

export function takeStack(list, stack, month, isLive, when) {
  if (stack === 'live') return list.filter(isLive);
  return list.filter((item) => !isLive(item) && inMonth(when(item), month));
}

export function monthLabel(key) {
  const hit = monthChoices().find((o) => o.value === key);
  return hit ? hit.label : key;
}

export function isFresh(date, days = 30) {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < days * 24 * 60 * 60 * 1000;
}

function MonthPick({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function close(e) {
      if (!box.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="stack-month" ref={box}>
      <button
        type="button"
        className="stack-month-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        {monthLabel(value)}
      </button>
      {open && (
        <ul className="stack-month-list" role="listbox">
          {monthChoices().map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                className={o.value === value ? 'is-on' : ''}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StackFilter({
  stack,
  onStack,
  month,
  onMonth,
  live = 'Live',
  past = 'Past'
}) {
  return (
    <div className="stack-filter">
      <select value={stack} onChange={(e) => onStack(e.target.value)} aria-label="Which items">
        <option value="live">{live}</option>
        <option value="past">{past}</option>
      </select>
      {stack === 'past' && <MonthPick value={month} onChange={onMonth} />}
    </div>
  );
}
