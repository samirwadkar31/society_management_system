import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../components/AuthShell';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  phone: '',
  block: 'A',
  flatNo: '',
  residentType: 'owner'
};

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setDone({
        name: form.name.trim(),
        email: form.email.trim(),
        block: form.block,
        flatNo: form.flatNo.trim()
      });
      setForm(EMPTY);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        title="The committee has your request."
        blurb="You’ll sign in after they approve the flat."
      >
        <div className="auth-form">
          <div className="kicker">Submitted</div>
          <h2>You’re on the board</h2>
          <p>
            {done.name
              ? `${done.name}’s request for Block ${done.block}, Flat ${done.flatNo} is with the committee.`
              : `Block ${done.block}, Flat ${done.flatNo} is with the committee.`}{' '}
            They’ll approve your access before you can come in
            {done.email ? ` as ${done.email}` : ''}.
          </p>
          <div className="auth-actions">
            <button className="btn btn-primary" type="button" onClick={() => nav('/login?door=resident')}>
              Go to sign in
            </button>
            <Link className="text-link" to="/">
              Back to home
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Register your flat on the society board."
      blurb="The committee approves you before you can sign in."
    >
      <form className="auth-form auth-form-register" onSubmit={submit}>
        <div className="kicker">New resident</div>
        <h2>Join Kutumb</h2>
        {err && <div className="err">{err}</div>}
        <div className="grid-2">
          <div>
            <label>Full name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
          </div>
          <div>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div className="grid-2">
          <div>
            <label>Block</label>
            <select value={form.block} onChange={(e) => set('block', e.target.value)}>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
          </div>
          <div>
            <label>Flat no</label>
            <input value={form.flatNo} onChange={(e) => set('flatNo', e.target.value)} required />
          </div>
        </div>
        <label>You are</label>
        <select value={form.residentType} onChange={(e) => set('residentType', e.target.value)}>
          <option value="owner">Owner</option>
          <option value="tenant">Tenant</option>
        </select>
        <button className="btn btn-primary" style={{ marginTop: 18 }} type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit for approval'}
        </button>
        <p>
          Already in? <Link to="/login?door=resident">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
