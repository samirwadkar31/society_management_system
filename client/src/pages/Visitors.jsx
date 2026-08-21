import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import DocLink from '../components/DocLink';
import StackFilter, { monthLabel, takeStack, useStack } from '../components/StackFilter';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function emptyForm() {
  return {
    name: '',
    phone: '',
    purpose: 'guest',
    vehicleNo: '',
    note: ''
  };
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

function InOut({ v }) {
  return (
    <>
      <div>In {fmtWhen(v.entryAt)}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Out {fmtWhen(v.exitAt)}</div>
    </>
  );
}

export default function Visitors() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(emptyForm);
  const { stack, setStack, month, setMonth } = useStack();

  const showFlat = user.role !== 'resident';
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

  async function load() {
    setList(await api('/visitors'));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setErr('');
    try {
      await api('/visitors', { method: 'POST', body: JSON.stringify(form) });
      setOpen(false);
      setForm(emptyForm());
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div>
      <div className="list-head">
        <h3>Visitors</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="Inside / expected"
            past="Left"
          />
          {user.role === 'resident' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setErr('');
                setForm(emptyForm());
                setOpen(true);
              }}
            >
              Pre-approve visitor
            </button>
          )}
        </div>
      </div>

      <div className="card">
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
                <th>Name</th>
                <th>Purpose</th>
                {showFlat && <th>Flat</th>}
                <th>In / Out</th>
                <th>Pass</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => (
                <tr key={v._id}>
                  <td>
                    {v.name}
                    {v.phone ? (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{v.phone}</div>
                    ) : null}
                  </td>
                  <td data-label="Purpose">{pretty(v.purpose)}</td>
                  {showFlat && (
                    <td data-label="Flat">
                      {v.visitingUser?.block}-{v.visitingUser?.flatNo}
                    </td>
                  )}
                  <td data-label="In / Out">
                    <InOut v={v} />
                  </td>
                  <td data-label="Code">{v.passCode}</td>
                  <td data-label="Status">
                    <span className={'chip chip-' + v.status}>{pretty(v.status)}</span>
                  </td>
                  <td>
                    <DocLink to={'/app/visitors/' + v._id + '/pass'}>Pass</DocLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <div className="kicker">The gate</div>
            <h3>Pre-approve a visitor</h3>
            {err && <div className="err">{err}</div>}
            <div className="grid-2">
              <div>
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label>Purpose</label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                >
                  <option value="guest">Guest</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <label>Vehicle no</label>
                <input
                  value={form.vehicleNo}
                  onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                />
              </div>
            </div>
            <label>Note</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit">
                Create pass
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
