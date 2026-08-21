import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../components/AuthShell';

export default function Reset() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const data = await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      setMsg(data.message);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <AuthShell title="Pick a new password." blurb="Then sign in and you’re back on the courtyard.">
      <form className="auth-form" onSubmit={submit}>
        <div className="kicker">Account</div>
        <h2>New password</h2>
        {err && <div className="err">{err}</div>}
        {msg && (
          <div className="okmsg">
            {msg} <Link to="/login?door=resident">Sign in</Link>
          </div>
        )}
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">
          Save password
        </button>
      </form>
    </AuthShell>
  );
}
