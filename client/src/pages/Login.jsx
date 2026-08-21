import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const DOORS = {
  resident: {
    kicker: 'Your flat',
    heading: 'Resident sign in',
    intro: 'This door is for residents. Committee still approves new flats.',
    title: 'Come in. The courtyard is open.',
    blurb: 'Try the resident demo, or sign in with your own account.',
    demos: [['Resident', 'resident@kutumb.local', 'Resident@123']],
    showRegister: true
  },
  admin: {
    kicker: 'Committee',
    heading: 'Admin sign in',
    intro: 'The secretary’s desk — flats, bills, the notice board.',
    title: 'The committee desk is open.',
    blurb: 'One demo for the admin. Approvals, bills, the courtyard.',
    demos: [['Admin', 'admin@kutumb.local', 'Admin@123']],
    showRegister: false
  },
  staff: {
    kicker: 'Staff & gate',
    heading: 'Staff sign in',
    intro: 'Trades and security. Pick who you are trying.',
    title: 'Jobs first. Then the gate.',
    blurb: 'Plumber, electrician, housekeeping, lift, general, or security.',
    demos: [
      ['Plumber', 'staff@kutumb.local', 'Staff@123'],
      ['Electrician', 'electric@kutumb.local', 'Staff@123'],
      ['Housekeeping', 'housekeeping@kutumb.local', 'Staff@123'],
      ['Lift', 'lift@kutumb.local', 'Staff@123'],
      ['General', 'general@kutumb.local', 'Staff@123'],
      ['Security', 'security@kutumb.local', 'Security@123']
    ],
    showRegister: false
  }
};

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const door = DOORS[params.get('door')] ? params.get('door') : 'resident';
  const spec = DOORS[door];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setErr('');
  }, [door]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      login(data.token, data.user);
      nav('/app');
    } catch (ex) {
      setErr(ex.message);
    }
  }

  const demoClass =
    spec.demos.length === 1 ? 'demo-box demo-one' : spec.demos.length > 4 ? 'demo-box demo-staff' : 'demo-box';

  return (
    <AuthShell tone={door} title={spec.title} blurb={spec.blurb}>
      <form className="auth-form" onSubmit={submit}>
        <div className="kicker">{spec.kicker}</div>
        <h2>{spec.heading}</h2>
        <p>{spec.intro}</p>
        {err && <div className="err">{err}</div>}
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        <div className="auth-actions">
          <button className="btn btn-primary" type="submit">
            Enter society
          </button>
          <Link className="text-link" to="/forgot">
            Forgot password?
          </Link>
        </div>
        {spec.showRegister ? (
          <p>
            New to the building? <Link to="/register">Create a resident account</Link>
          </p>
        ) : (
          <p>
            Live in the building? <Link to="/login?door=resident">Resident door</Link>
          </p>
        )}
        <div className={demoClass}>
          <span>Demo</span>
          {spec.demos.map(([label, em, pw]) => (
            <button
              type="button"
              key={em}
              onClick={() => {
                setEmail(em);
                setPassword(pw);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </form>
    </AuthShell>
  );
}
