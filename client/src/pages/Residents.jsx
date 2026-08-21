import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Residents() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  async function load(nextQ = q, nextStatus = status) {
    const params = new URLSearchParams({ role: 'resident' });
    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);
    setList(await api('/users?' + params.toString()));
  }

  useEffect(() => {
    load();
  }, []);

  function apply(e) {
    e.preventDefault();
    load();
  }

  return (
    <div>
      <div className="list-head">
        <h3>Residents</h3>
      </div>
      <form className="filter-bar" onSubmit={apply}>
        <input
          placeholder="Search name / flat"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn btn-primary btn-sm" type="submit">
          Filter
        </button>
      </form>
      <div className="card">
        {list.length === 0 ? (
          <div className="empty">No residents match.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Flat</th>
                <th>Type</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.name}
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email}</div>
                  </td>
                  <td data-label="Flat">
                    {u.block}-{u.flatNo}
                  </td>
                  <td data-label="Type">{pretty(u.residentType)}</td>
                  <td data-label="Status">
                    <span className={'chip chip-' + u.status}>{pretty(u.status)}</span>
                  </td>
                  <td>
                    <Link className="go-link" to={'/app/residents/' + u._id}>
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
