import { useEffect, useState } from 'react';
import { Link, useMatch, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import DocLink from '../components/DocLink';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function Receipt() {
  const { id } = useParams();
  const { user } = useAuth();
  const isReceipt = Boolean(useMatch('/app/bills/:id/receipt'));
  const [b, setB] = useState(null);

  useEffect(() => {
    api('/bills/' + id).then(setB);
  }, [id]);

  async function pay() {
    const order = await api('/bills/' + id + '/order', { method: 'POST' });
    if (order.demo) {
      const paid = await api('/bills/' + id + '/verify', {
        method: 'POST',
        body: JSON.stringify({ razorpay_payment_id: 'demo_pay' })
      });
      setB({ ...b, ...paid, resident: paid.resident || b.resident });
      return;
    }
    const options = {
      key: order.key,
      amount: order.order.amount,
      currency: 'INR',
      name: 'Kutumb Residency',
      description: b.title || pretty(b.type || 'maintenance'),
      order_id: order.order.id,
      handler: async function (response) {
        const paid = await api('/bills/' + id + '/verify', {
          method: 'POST',
          body: JSON.stringify(response)
        });
        setB({ ...b, ...paid, resident: paid.resident || b.resident });
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  if (!b) {
    return (
      <div className="bill-page">
        <p>Loading…</p>
      </div>
    );
  }

  const paid = b.status === 'paid';
  const kind = b.title || pretty(b.type || 'maintenance');
  const total = b.amount + (b.lateFee || 0);
  const who = b.resident?.name || '';
  const flat = b.resident ? `${b.resident.block}-${b.resident.flatNo}` : '';
  const as =
    b.resident?.residentType === 'tenant'
      ? 'Tenant'
      : b.resident?.residentType === 'owner'
        ? 'Owner'
        : '';

  if (isReceipt && !paid) {
    return (
      <div className="bill-page">
        <Link className="go-link" to="/app/bills">
          ← All bills
        </Link>
        <div className="card bill-doc">
          <div className="kicker">Kutumb Residency</div>
          <h2>Receipt</h2>
          <p className="bill-who">This receipt is created after the bill is paid.</p>
          <DocLink to={'/app/bills/' + id}>Bill</DocLink>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-page">
      <Link className="go-link" to="/app/bills">
        ← All bills
      </Link>
      <div className="card bill-doc">
        <div className="kicker">Kutumb Residency</div>
        <h2>
          {kind} {isReceipt ? 'receipt' : 'bill'}
        </h2>
        <span className={'chip chip-' + b.status}>{pretty(b.status)}</span>
        <p className="bill-who">
          {who}
          {as ? ` · ${as}` : ''}
          <br />
          {flat}
        </p>
        <dl className="bill-lines">
          <dt>Type</dt>
          <dd>{pretty(b.type || 'maintenance')}</dd>
          {b.title ? (
            <>
              <dt>For</dt>
              <dd>{b.title}</dd>
            </>
          ) : null}
          <dt>Period</dt>
          <dd>
            {MONTHS[b.month - 1]} {b.year}
          </dd>
          {!isReceipt && (
            <>
              <dt>Pay by</dt>
              <dd>{fmtDate(b.dueDate)}</dd>
            </>
          )}
          <dt>Amount</dt>
          <dd>₹{b.amount}</dd>
          <dt>Late fee</dt>
          <dd>{b.lateFee ? `₹${b.lateFee}` : '—'}</dd>
          <dt className="is-total">Total</dt>
          <dd className="is-total">₹{total}</dd>
          {isReceipt && (
            <>
              <dt>Paid on</dt>
              <dd>{fmtDate(b.paidAt)}</dd>
              <dt>Ref</dt>
              <dd>{b.razorpayPaymentId}</dd>
            </>
          )}
        </dl>
        <div className="row">
          {!isReceipt && !paid && user.role === 'resident' && (
            <button className="btn btn-primary" onClick={pay}>
              Pay ₹{total}
            </button>
          )}
          {!isReceipt && paid && <DocLink to={'/app/bills/' + id + '/receipt'}>Receipt</DocLink>}
          {isReceipt && <DocLink to={'/app/bills/' + id}>Bill</DocLink>}
          <button className="btn btn-ghost" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
