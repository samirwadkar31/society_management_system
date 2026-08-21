import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { isFresh } from '../components/StackFilter';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    api('/dashboard').then(setStats).catch(() => {});
    api('/notices').then(setNotices).catch(() => {});
    if (user.role === 'staff') {
      api('/complaints').then(setJobs).catch(() => {});
    }
    if (user.role === 'security' || user.role === 'admin') {
      api('/visitors').then(setVisitors).catch(() => {});
    }
  }, [user.role]);

  if (!stats) return <p>Loading courtyard…</p>;

  if (user.role === 'admin') {
    return (
      <div className="dash">
        <div className="stats">
          <div className="stat">
            <small>Residents</small>
            <span className="stat-count">{stats.residents}</span>
            <p>{stats.pendingResidents} waiting approval</p>
            <Link className="stat-go" to="/app/residents">
              view residents →
            </Link>
          </div>
          <div className="stat">
            <small>Open complaints</small>
            <span className="stat-count">{stats.openComplaints}</span>
            <Link className="stat-go" to="/app/complaints">
              view complaints →
            </Link>
          </div>
          <div className="stat">
            <small>Unpaid bills</small>
            <span className="stat-count">{stats.pendingBills}</span>
            <Link className="stat-go" to="/app/bills">
              view bills →
            </Link>
          </div>
          <div className="stat">
            <small>Active SOS</small>
            <span className="stat-count">{stats.activeSos}</span>
            <p>{stats.todayVisitors} visitors today</p>
            <Link className="stat-go" to="/app/emergencies">
              view emergencies →
            </Link>
          </div>
        </div>
        <NoticesMini notices={notices} />
      </div>
    );
  }

  if (user.role === 'resident') {
    return (
      <div className="dash">
        <div className="stats">
          <div className="stat">
            <small>Open complaints</small>
            <span className="stat-count">{stats.myOpen}</span>
            <Link className="stat-go" to="/app/complaints">
              view complaints →
            </Link>
          </div>
          <div className="stat">
            <small>Unpaid bills</small>
            <span className="stat-count">{stats.myBills}</span>
            <Link className="stat-go" to="/app/bills">
              view bills →
            </Link>
          </div>
          <div className="stat">
            <small>Bookings</small>
            <span className="stat-count">{stats.myBookings}</span>
            <Link className="stat-go" to="/app/bookings">
              view bookings →
            </Link>
          </div>
          <div className="stat">
            <small>Visitors</small>
            <span className="stat-count">{stats.myVisitors ?? 0}</span>
            <Link className="stat-go" to="/app/visitors">
              view visitors →
            </Link>
          </div>
        </div>
        <NoticesMini notices={notices} />
      </div>
    );
  }

  if (user.role === 'staff') {
    const active = jobs.filter((j) => j.status !== 'resolved');
    return (
      <div className="dash">
        <div className="stats stats-2">
          <div className="stat">
            <small>On your plate</small>
            <span className="stat-count">{stats.assigned}</span>
            <Link className="stat-go" to="/app/complaints">
              all assigned →
            </Link>
          </div>
          <div className="stat">
            <small>Finished</small>
            <span className="stat-count">{stats.done}</span>
          </div>
        </div>
        <div className="card dash-fill">
          <div className="board-head">
            <h3>Assigned jobs</h3>
          </div>
          {active.length === 0 ? (
            <div className="empty">No open jobs.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Flat</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {active.map((j) => (
                  <tr key={j._id}>
                    <td>{j.title}</td>
                    <td data-label="Flat">
                      {j.raisedBy?.block}-{j.raisedBy?.flatNo}
                    </td>
                    <td data-label="Status">
                      <span className={'chip chip-' + j.status}>{pretty(j.status)}</span>
                    </td>
                    <td>
                      <Link className="go-link" to={'/app/complaints/' + j._id}>
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="stats stats-2">
        <div className="stat">
          <small>Expected / inside</small>
          <span className="stat-count">{stats.expected}</span>
          <Link className="stat-go" to="/app/gate">
            open gate →
          </Link>
        </div>
        <div className="stat">
          <small>Active SOS</small>
          <span className="stat-count">{stats.sos}</span>
          <Link className="stat-go" to="/app/emergencies">
            view emergencies →
          </Link>
        </div>
      </div>
      <div className="card dash-fill">
        <div className="board-head">
          <h3>Latest expected</h3>
          <Link className="go-link" to="/app/gate">
            Gate log →
          </Link>
        </div>
        {visitors.filter((v) => v.status === 'pre-approved' || v.status === 'entered').length === 0 ? (
          <div className="empty">No visitors expected.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Flat</th>
                <th>In / Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visitors
                .filter((v) => v.status === 'pre-approved' || v.status === 'entered')
                .slice(0, 8)
                .map((v) => (
                <tr key={v._id}>
                  <td>{v.name}</td>
                  <td data-label="Flat">
                    {v.visitingUser?.block}-{v.visitingUser?.flatNo}
                  </td>
                  <td data-label="In / Out">
                    <div>
                      In{' '}
                      {v.entryAt
                        ? new Date(v.entryAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Out{' '}
                      {v.exitAt
                        ? new Date(v.exitAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'}
                    </div>
                  </td>
                  <td data-label="Status">
                    <span className={'chip chip-' + v.status}>{pretty(v.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NoticesMini({ notices }) {
  const shown = notices.filter((n) => n.pinned || isFresh(n.createdAt)).slice(0, 4);
  return (
    <div className="board dash-fill">
      <div className="board-head">
        <h3>Notice board</h3>
        <Link className="go-link" to="/app/notices">
          See all →
        </Link>
      </div>
      {shown.length === 0 ? (
        <div className="empty">Nothing on the board yet.</div>
      ) : (
        <div className="board-row">
          {shown.map((n) => (
            <article
              key={n._id}
              className={'board-slip kind-' + n.type + (n.pinned ? ' is-pinned' : '')}
            >
              {n.pinned && (
                <span className="board-flag">
                  <span className="board-pin" />
                  Pinned
                </span>
              )}
              <span className="kicker">{pretty(n.type)}</span>
              <h4>{n.title}</h4>
              <p>{n.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
