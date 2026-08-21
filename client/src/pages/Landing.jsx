import { Link } from 'react-router-dom';
import LiveDeck from '../components/LiveDeck';

const stories = [
  {
    n: '01',
    t: 'Complaints',
    d: 'Raise it, assign a plumber, attach a photo, rate the fix. The leak does not die in a group chat.'
  },
  {
    n: '02',
    t: 'Maintenance',
    d: 'Generate the month’s bills, add a late fee, pay online, print a receipt for the file.'
  },
  {
    n: '03',
    t: 'The gate',
    d: 'Pre-approve a guest or a delivery. They get a QR pass. Security logs in and out.'
  },
  {
    n: '04',
    t: 'SOS',
    d: 'Fire, medical, leakage. Admin and the gate get it at once — not after someone runs downstairs.'
  }
];

const doors = [
  ['Admin', 'Committee', 'Approve flats, assign jobs, generate bills, pin the notice board.', '/login?door=admin'],
  ['Resident', 'Your flat', 'Family, vehicles, visitors, bills, and a red SOS if you need it.', '/login?door=resident'],
  ['Staff', 'The work', 'Jobs on your name. Update the status, upload proof, close it.', '/login?door=staff'],
  ['Security', 'The gate', 'Expected visitors, QR check-in, and every emergency still open.', '/login?door=staff']
];

export default function Landing() {
  return (
    <div className="land">
      <div className="hero-screen">
        <nav className="land-nav">
          <div className="brand">
            <div className="brand-mark">K</div>
            <div>
              <strong>Kutumb</strong>
              <span>Residency</span>
            </div>
          </div>
          <div className="row nav-actions">
            <Link className="btn btn-teal" to="/login?door=staff">
              Staff sign in
            </Link>
          </div>
        </nav>
        <header className="hero-wrap">
          <section className="hero">
            <div className="hero-copy">
              <div className="kicker light">A quieter way to run the building</div>
              <h1>
                The society,
                <br />
                <em>finally on one page.</em>
              </h1>
              <p className="hero-lead">
                Complaints, bills, the clubhouse, the gate, SOS — without a
                WhatsApp group of 240 unread messages.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-ivory" to="/login?door=resident">
                  Resident
                </Link>
                <Link className="btn btn-gold" to="/login?door=admin">
                  Admin
                </Link>
              </div>
              <p className="hero-note">
                Three doors — <b>Resident</b> in ivory, <b>Admin</b> in brass,{' '}
                <b>Staff sign in</b> (top right) for trades and the gate.
                <br />
                New to the building?{' '}
                <Link to="/register">Create a resident account</Link>
                — the committee approves it.
              </p>
            </div>

            <LiveDeck />
          </section>
        </header>
      </div>

      <section className="features">
        <div className="section-head">
          <div className="kicker">What lives here</div>
          <h2>Less chasing. More of the actual society.</h2>
          <p className="section-lead">
            Four things a secretary usually hunts across chats, Excel and the
            guard’s notebook — kept in one place.
          </p>
        </div>
        <div className="story-grid peek-row">
          {stories.map((s) => (
            <article className="story-card" key={s.n}>
              <span className="story-num">{s.n}</span>
              <div className="story-rule" />
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="roles">
        <div className="section-head">
          <div className="kicker">Four logins</div>
          <h2>Same building. Different doors.</h2>
          <p className="section-lead">
            You see only what your role should see. Each door has its own demo.
          </p>
        </div>
        <div className="door-grid">
          {doors.map(([t, tag, d, href]) => (
            <Link className="door-card" key={t} to={href}>
              <span>{tag}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="land-cta">
        <div>
          <h2>Walk the courtyard.</h2>
          <p>Register your flat. The committee approves you, then you can sign in.</p>
        </div>
        <Link className="btn btn-ivory" to="/register">
          Open Kutumb
        </Link>
      </footer>
    </div>
  );
}
