import { useState } from 'react';
import { api } from '../api';

export default function AddMember() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    staffType: 'general'
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api('/users', { method: 'POST', body: JSON.stringify(form) });
      setMsg('Member added. They can log in now.');
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: '',
        staffType: 'general'
      });
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="prof-page">
      <div className="list-head">
        <h3>Add member</h3>
      </div>
      <form className="card" onSubmit={submit} style={{ maxWidth: 480, overflow: 'auto' }}>
        {msg && <div className="okmsg">{msg}</div>}
        {err && <div className="err">{err}</div>}
        <div className="kicker">Committee</div>
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <div className="grid-2">
          <div>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="security">Security</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === 'staff' ? (
            <div>
              <label>Trade</label>
              <select
                value={form.staffType}
                onChange={(e) => setForm({ ...form, staffType: e.target.value })}
              >
                <option value="plumber">Plumber</option>
                <option value="electrician">Electrician</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="lift">Lift</option>
                <option value="general">General</option>
              </select>
            </div>
          ) : (
            <div>
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          )}
        </div>
        {form.role === 'staff' && (
          <>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </>
        )}
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} type="submit">
          Create login
        </button>
      </form>
    </div>
  );
}
