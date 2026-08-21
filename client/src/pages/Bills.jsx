import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import DocLink from '../components/DocLink';
import StackFilter, { monthLabel, takeStack, useStack } from '../components/StackFilter';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const TYPES = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'vargani', label: 'Vargani' },
  { id: 'sinking-fund', label: 'Sinking fund' },
  { id: 'other', label: 'Other' }
];

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function typeLabel(b) {
  const id = b.type || 'maintenance';
  return TYPES.find((t) => t.id === id)?.label || pretty(id);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function dueInput(month, year, day = 10) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Bills() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    type: 'maintenance',
    title: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: 4500,
    dueDate: dueInput(now.getMonth() + 1, now.getFullYear())
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const { stack, setStack, month, setMonth } = useStack();

  const needsTitle = form.type === 'vargani' || form.type === 'other';
  const showFlat = user.role !== 'resident';
  const shown = useMemo(
    () =>
      takeStack(
        list,
        stack,
        month,
        (b) => b.status !== 'paid',
        (b) =>
          b.paidAt ||
          `${b.year}-${String(b.month).padStart(2, '0')}-01`
      ),
    [list, stack, month]
  );

  async function load() {
    setList(await api('/bills'));
  }

  useEffect(() => {
    load();
  }, []);

  function setType(type) {
    setForm({
      ...form,
      type,
      title: type === 'maintenance' ? '' : form.title,
      amount: type === 'vargani' ? 501 : type === 'maintenance' ? 4500 : form.amount
    });
  }

  async function generate(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const data = await api('/bills/generate', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setMsg(data.message);
      setOpen(false);
      load();
    } catch (ex) {
      setErr(ex.message || 'Could not create bills.');
    }
  }

  async function pay(bill) {
    const order = await api('/bills/' + bill._id + '/order', { method: 'POST' });
    if (order.demo) {
      await api('/bills/' + bill._id + '/verify', {
        method: 'POST',
        body: JSON.stringify({ razorpay_payment_id: 'demo_pay' })
      });
      load();
      return;
    }
    const options = {
      key: order.key,
      amount: order.order.amount,
      currency: 'INR',
      name: 'Kutumb Residency',
      description: bill.title || typeLabel(bill),
      order_id: order.order.id,
      handler: async function (response) {
        await api('/bills/' + bill._id + '/verify', {
          method: 'POST',
          body: JSON.stringify(response)
        });
        load();
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <div>
      <div className="list-head">
        <h3>Bills</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="Unpaid"
            past="Paid"
          />
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              Create for all flats
            </button>
          )}
        </div>
      </div>
      {msg && <div className="okmsg" style={{ marginBottom: 12 }}>{msg}</div>}

      <div className="card">
        {shown.length === 0 ? (
          <div className="empty">
            {stack === 'live' ? 'Nothing unpaid.' : `No paid bills in ${monthLabel(month)}.`}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {showFlat && <th>Flat</th>}
                <th>Type</th>
                <th>Month</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Late fee</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b._id}>
                  {showFlat && (
                    <td data-label="Flat">
                      {b.resident?.name || '—'}
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {b.resident?.block}-{b.resident?.flatNo}
                      </div>
                    </td>
                  )}
                  <td data-label="Type">
                    {typeLabel(b)}
                    {b.title ? (
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{b.title}</div>
                    ) : null}
                  </td>
                  <td data-label="Month">
                    {MONTHS[b.month - 1]} {b.year}
                  </td>
                  <td data-label="Due">{fmtDate(b.dueDate)}</td>
                  <td data-label="Amount">₹{b.amount}</td>
                  <td data-label="Late fee">{b.lateFee ? `₹${b.lateFee}` : '—'}</td>
                  <td data-label="Status">
                    <span className={'chip chip-' + b.status}>{pretty(b.status)}</span>
                  </td>
                  <td>
                    <div className="doc-row">
                      <DocLink to={'/app/bills/' + b._id}>Bill</DocLink>
                      {b.status === 'paid' && (
                        <DocLink to={'/app/bills/' + b._id + '/receipt'}>Receipt</DocLink>
                      )}
                      {b.status !== 'paid' && user.role === 'resident' && (
                        <button className="btn btn-primary btn-sm" onClick={() => pay(b)}>
                          Pay
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

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={generate}>
            <div className="kicker">All approved flats</div>
            <h3>Create bills</h3>
            {err && <div className="err">{err}</div>}
            <label>Type</label>
            <select value={form.type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {needsTitle && (
              <>
                <label>What is this for</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={form.type === 'vargani' ? 'Ganesh Chaturthi' : 'Painting the building'}
                  required
                />
              </>
            )}
            {!needsTitle && form.type === 'sinking-fund' && (
              <>
                <label>What is this for</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Lift replacement"
                />
              </>
            )}
            <div className="grid-2">
              <div>
                <label>Month</label>
                <select
                  value={form.month}
                  onChange={(e) => {
                    const month = Number(e.target.value);
                    setForm({ ...form, month, dueDate: dueInput(month, form.year) });
                  }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => {
                    const year = Number(e.target.value);
                    setForm({ ...form, year, dueDate: dueInput(form.month, year) });
                  }}
                />
              </div>
            </div>
            <label>Pay by</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
            <label>Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              required
            />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit">
                Generate for all flats
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
