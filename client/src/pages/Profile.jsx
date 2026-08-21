import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function save(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const updated = await api('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name, phone })
      });
      setUser(updated);
      setMsg('Profile saved');
    } catch (ex) {
      setErr(ex.message || 'Could not save.');
    }
  }

  async function changePass(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const data = await api('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setMsg(data.message);
      setCurrent('');
      setNew('');
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="prof-page">
      <div className="list-head">
        <h3>Profile</h3>
      </div>
      <div className="card">
        {msg && <div className="okmsg">{msg}</div>}
        {err && <div className="err">{err}</div>}
        <form onSubmit={save}>
          <div className="flat-sec-h">
            <span>You</span>
          </div>
          <p className="flat-meta">
            {user.email}
            {user.residentType ? ` · ${pretty(user.residentType)}` : ` · ${pretty(user.role)}`}
          </p>
          <div className="flat-row cols-you">
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Phone
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>
          <button className="btn btn-primary btn-sm" type="submit">
            Save
          </button>
        </form>
        <form className="prof-pass" onSubmit={changePass}>
          <div className="flat-sec-h">
            <span>Password</span>
          </div>
          <div className="flat-row cols-you">
            <label>
              Current
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </label>
            <label>
              New
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
                required
              />
            </label>
          </div>
          <button className="btn btn-primary btn-sm" type="submit">
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
