import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const NAV = {
  admin: [
    ['/app', 'Courtyard'],
    ['/app/residents', 'Residents'],
    ['/app/complaints', 'Complaints'],
    ['/app/bills', 'Bills'],
    ['/app/bookings', 'Bookings'],
    ['/app/notices', 'Notices'],
    ['/app/visitors', 'Visitors'],
    ['/app/emergencies', 'Emergencies'],
    ['/app/members', 'Add member'],
    ['/app/profile', 'Profile']
  ],
  resident: [
    ['/app', 'Home'],
    ['/app/flat', 'My flat'],
    ['/app/complaints', 'Complaints'],
    ['/app/bills', 'Bills'],
    ['/app/bookings', 'Book facility'],
    ['/app/notices', 'Notices'],
    ['/app/visitors', 'Visitors'],
    ['/app/profile', 'Profile']
  ],
  staff: [
    ['/app', 'Jobs'],
    ['/app/complaints', 'All assigned'],
    ['/app/emergencies', 'Emergencies'],
    ['/app/profile', 'Profile']
  ],
  security: [
    ['/app', 'Gate'],
    ['/app/gate', 'Check in / out'],
    ['/app/emergencies', 'Emergencies'],
    ['/app/notices', 'Notices'],
    ['/app/profile', 'Profile']
  ]
};

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosType, setSosType] = useState('security');
  const [sosMsg, setSosMsg] = useState('');

  const links = NAV[user.role] || [];

  async function sendSos(e) {
    e.preventDefault();
    await api('/emergencies', {
      method: 'POST',
      body: JSON.stringify({ type: sosType, message: sosMsg })
    });
    setSosOpen(false);
    setSosMsg('');
    alert('SOS sent to admin and security');
    nav('/app/emergencies');
  }

  return (
    <div className="shell">
      {menuOpen && <div className="menu-scrim" onClick={() => setMenuOpen(false)} />}
      <aside className={'side' + (menuOpen ? ' open' : '')}>
        <div className="side-top">
          <div className="brand">
            <div className="brand-mark">K</div>
            <div>
              <strong>Kutumb</strong>
              <span>Residency</span>
            </div>
          </div>
          <button
            className="menu-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink
              key={to + label}
              to={to}
              end={to === '/app'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {user.role === 'resident' && (
          <button className="sos" onClick={() => setSosOpen(true)}>
            SOS emergency
          </button>
        )}
        <div className="who">
          <div>{user.name}</div>
          <small>
            {user.role}
            {user.flatNo ? ` · ${user.block}-${user.flatNo}` : ''}
          </small>
          <button
            className="linkish"
            onClick={() => {
              logout();
              nav('/');
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="menu-btn" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <span />
            <span />
            <span />
          </button>
          <div className="topbar-who">
            <div className="kicker">Kutumb courtyard</div>
            <h2 className="hello">
              <span className="hello-hi">Welcome, </span>
              {user.name.split(' ')[0]}
              {user.flatNo ? (
                <span className="hello-flat">
                  {' '}
                  · {user.block}-{user.flatNo}
                </span>
              ) : null}
            </h2>
          </div>
          {user.role === 'resident' && (
            <button className="sos-top" type="button" onClick={() => setSosOpen(true)}>
              SOS
            </button>
          )}
        </div>
        <div className="page">
          <Outlet />
        </div>
      </div>

      {sosOpen && (
        <div className="modal-bg" onClick={() => setSosOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={sendSos}>
            <div className="kicker">Emergency</div>
            <h3>Raise SOS</h3>
            <p>This reaches admin, security and relevant staff immediately.</p>
            <label>Type</label>
            <select value={sosType} onChange={(e) => setSosType(e.target.value)}>
              <option value="fire">Fire</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="electrical">Electrical</option>
              <option value="water">Water leakage</option>
            </select>
            <label>Details</label>
            <textarea value={sosMsg} onChange={(e) => setSosMsg(e.target.value)} required />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-danger" type="submit">
                Send SOS
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setSosOpen(false)}>
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
