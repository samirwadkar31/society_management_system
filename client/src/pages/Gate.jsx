import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import StackFilter, { monthLabel, takeStack, useStack } from '../components/StackFilter';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtWhen(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Gate() {
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [err, setErr] = useState('');
  const { stack, setStack, month, setMonth } = useStack();

  async function load() {
    setList(await api('/visitors'));
  }
  useEffect(() => {
    load();
  }, []);

  async function lookup(e) {
    e.preventDefault();
    setErr('');
    try {
      setFound(await api('/visitors/pass/' + code));
    } catch (ex) {
      setFound(null);
      setErr(ex.message);
    }
  }

  async function enter(id) {
    await api('/visitors/' + id + '/enter', { method: 'POST' });
    setFound(null);
    setCode('');
    load();
  }
  async function exit(id) {
    await api('/visitors/' + id + '/exit', { method: 'POST' });
    load();
  }

  const shown = useMemo(
    () =>
      takeStack(
        list,
        stack,
        month,
        (v) => v.status === 'pre-approved' || v.status === 'entered',
        (v) => v.exitAt || v.updatedAt || v.createdAt
      ),
    [list, stack, month]
  );

  return (
    <div className="gate-page">
      <div className="list-head">
        <h3>The gate</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="Inside / expected"
            past="Left"
          />
        </div>
      </div>
      <div className="book-body">
        <form className="card cal-card" onSubmit={lookup}>
          <div className="kicker">Pass</div>
          <h3>Find a visitor</h3>
          {err && <div className="err">{err}</div>}
          {found && (
            <div className="okmsg">
              {found.name} · {pretty(found.purpose)}
              <br />
              {found.visitingUser?.block}-{found.visitingUser?.flatNo}
              {found.entryAt ? (
                <>
                  <br />
                  In {fmtWhen(found.entryAt)}
                  {found.exitAt ? ` · Out ${fmtWhen(found.exitAt)}` : ''}
                </>
              ) : null}
              {found.status === 'pre-approved' && (
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => enter(found._id)}>
                    Mark entered
                  </button>
                </div>
              )}
            </div>
          )}
          <label>Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6 digit code"
          />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} type="submit">
            Find pass
          </button>
        </form>
        <div className="card book-list">
          {shown.length === 0 ? (
            <div className="empty">
              {stack === 'live'
                ? 'No visitors expected or inside.'
                : `Nobody left in ${monthLabel(month)}.`}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Flat</th>
                  <th>In / Out</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v._id}>
                    <td>
                      {v.name}
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{v.passCode}</div>
                    </td>
                    <td data-label="Flat">
                      {v.visitingUser?.block}-{v.visitingUser?.flatNo}
                    </td>
                    <td data-label="In / Out">
                      <div>In {fmtWhen(v.entryAt)}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Out {fmtWhen(v.exitAt)}</div>
                    </td>
                    <td data-label="Status">
                      <span className={'chip chip-' + v.status}>{pretty(v.status)}</span>
                    </td>
                    <td>
                      {v.status === 'pre-approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => enter(v._id)}>
                          In
                        </button>
                      )}
                      {v.status === 'entered' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => exit(v._id)}>
                          Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
