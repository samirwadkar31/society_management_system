import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StackFilter, { monthLabel, takeStack, useStack } from '../components/StackFilter';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isoLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDay(iso) {
  if (!iso) return '';
  const [yy, mm, dd] = iso.split('-').map(Number);
  return `${dd} ${SHORT[mm - 1]} ${yy}`;
}

function monthDays(y, m) {
  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= last; d++) cells.push(d);
  return cells;
}

export default function Bookings() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [list, setList] = useState([]);
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [date, setDate] = useState(isoLocal(now));
  const [open, setOpen] = useState(false);
  const [facility, setFacility] = useState('');
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('20:00');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const { stack, setStack, month, setMonth } = useStack();

  const canBook = user.role === 'resident' || user.role === 'admin';
  const showWho = user.role !== 'resident';

  async function load() {
    const [f, b] = await Promise.all([api('/bookings/facilities'), api('/bookings')]);
    setFacilities(f);
    setList(b);
    if (f[0]) setFacility((cur) => cur || f[0]._id);
  }

  useEffect(() => {
    load();
  }, []);

  const today = isoLocal();
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear + 1, thisYear + 2, thisYear + 3];

  const days = useMemo(() => monthDays(y, m), [y, m]);
  const bookedDates = new Set(
    list.filter((x) => x.status !== 'cancelled' && x.status !== 'rejected').map((x) => x.date)
  );
  const shown = useMemo(
    () =>
      takeStack(
        list,
        stack,
        month,
        (b) => b.status === 'pending' || (b.status === 'approved' && b.date >= today),
        (b) => b.date
      ),
    [list, stack, month, today]
  );

  function pickDay(iso) {
    if (iso < today) return;
    setDate(iso);
  }

  function shift(dir) {
    const next = new Date(y, m + dir, 1);
    const ny = next.getFullYear();
    if (ny < thisYear || ny > thisYear + 3) return;
    setY(ny);
    setM(next.getMonth());
  }

  async function create(e) {
    e.preventDefault();
    setErr('');
    if (date < today) {
      setErr('Bookings are only for today or later.');
      return;
    }
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ facility, date, start, end, note })
      });
      setNote('');
      setOpen(false);
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function setStatus(id, status) {
    await api('/bookings/' + id + '/status', {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    load();
  }

  return (
    <div className="book-page">
      <div className="list-head">
        <h3>{user.role === 'admin' ? 'Bookings' : 'Book facility'}</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="Upcoming"
            past="Past"
          />
          {canBook && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              Request booking
            </button>
          )}
        </div>
      </div>

      <div className="book-body">
      <div className="card cal-card">
        <div className="cal-head">
          <button type="button" className="cal-shift" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <div className="cal-picks">
            <select
              className="cal-select"
              value={m}
              onChange={(e) => setM(Number(e.target.value))}
              aria-label="Month"
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="cal-select"
              value={y}
              onChange={(e) => setY(Number(e.target.value))}
              aria-label="Year"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="cal-shift" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="cal">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={'dow-' + i} className="cal-dow">
              {d}
            </div>
          ))}
          {days.map((d, i) => {
            if (!d) return <div key={'e-' + i} className="cal-blank" />;
            const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const past = iso < today;
            const cls = [
              'cal-day',
              iso === date ? 'is-selected' : '',
              bookedDates.has(iso) ? 'is-booked' : '',
              past ? 'is-past' : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                type="button"
                key={iso}
                className={cls}
                disabled={past}
                onClick={() => pickDay(iso)}
              >
                {d}
              </button>
            );
          })}
        </div>
        <p className="cal-hint">
          {fmtDay(date)} selected. A mark means that day already has a booking.
        </p>
      </div>

      <div className="card book-list">
        {shown.length === 0 ? (
          <div className="empty">
            {stack === 'live' ? 'Nothing upcoming.' : `No past bookings in ${monthLabel(month)}.`}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Date</th>
                <th>Time</th>
                {showWho && <th>Flat</th>}
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b._id}>
                  <td>
                    {b.facility?.name}
                    {b.note ? (
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{b.note}</div>
                    ) : null}
                  </td>
                  <td data-label="Date">{fmtDay(b.date)}</td>
                  <td data-label="Time">
                    {b.start}–{b.end}
                  </td>
                  {showWho && (
                    <td data-label="Flat">
                      {b.user?.block}-{b.user?.flatNo}
                    </td>
                  )}
                  <td data-label="Status">
                    <span className={'chip chip-' + b.status}>{pretty(b.status)}</span>
                  </td>
                  <td>
                    <div className="actions-row">
                      {user.role === 'admin' && b.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="mark-ok"
                            onClick={() => setStatus(b._id, 'approved')}
                            aria-label="Approve"
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="mark-no"
                            onClick={() => setStatus(b._id, 'rejected')}
                            aria-label="Reject"
                            title="Reject"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {user.role === 'admin' && b.status === 'approved' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(b._id, 'cancelled')}>
                          Cancel
                        </button>
                      )}
                      {user.role === 'resident' &&
                        (b.status === 'pending' || b.status === 'approved') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(b._id, 'cancelled')}>
                            Cancel
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <div className="kicker">Clubhouse</div>
            <h3>Request a booking</h3>
            {err && <div className="err">{err}</div>}
            <label>Facility</label>
            <select value={facility} onChange={(e) => setFacility(e.target.value)} required>
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
            <label>Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => pickDay(e.target.value)}
              required
            />
            <div className="grid-2">
              <div>
                <label>From</label>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div>
                <label>To</label>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
            <label>Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Birthday, meeting, puja…"
            />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit">
                Request booking
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
