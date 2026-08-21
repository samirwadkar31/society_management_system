import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AuthShell from '../components/AuthShell';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState('');

  async function submit(e) {
    e.preventDefault();
    const data = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    setMsg(data.message);
    setLink(data.resetLink || '');
  }

  return (
    <AuthShell title="Forgot the password. Not the flat." blurb="We’ll send a reset link if this email is on the board.">
      <form className="auth-form" onSubmit={submit}>
        <div className="kicker">Account</div>
        <h2>Reset password</h2>
        {msg && <div className="okmsg">{msg}</div>}
        {link && (
          <p>
            Email is not configured on this machine. Use this demo link:{' '}
            <a href={link}>{link}</a>
          </p>
        )}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit">
          Send reset link
        </button>
        <p>
          <Link to="/login?door=resident">Back to sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
