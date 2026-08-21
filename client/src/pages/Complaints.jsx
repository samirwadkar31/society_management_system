import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, uploadFile } from '../api';
import { useAuth } from '../context/AuthContext';
import StackFilter, { monthLabel, takeStack, useStack } from '../components/StackFilter';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Complaints() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'plumbing',
    priority: 'medium',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const { stack, setStack, month, setMonth } = useStack();

  async function load() {
    setList(await api('/complaints'));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setErr('');
    try {
      const media = [];
      if (file) {
        const up = await uploadFile(file);
        media.push(up.url);
      }
      await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({ ...form, media })
      });
      setOpen(false);
      setForm({ title: '', category: 'plumbing', priority: 'medium', description: '' });
      setFile(null);
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  const canRaise = user.role === 'resident' || user.role === 'admin';
  const showFlat = user.role !== 'resident';
  const shown = useMemo(
    () =>
      takeStack(
        list,
        stack,
        month,
        (c) => c.status !== 'resolved',
        (c) => c.updatedAt || c.createdAt
      ),
    [list, stack, month]
  );

  return (
    <div>
      <div className="list-head">
        <h3>{user.role === 'staff' ? 'Assigned jobs' : 'Complaints'}</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="Open"
            past="Resolved"
          />
          {canRaise && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              Raise complaint
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {shown.length === 0 ? (
          <div className="empty">
            {stack === 'live'
              ? 'Nothing open.'
              : `No resolved jobs in ${monthLabel(month)}.`}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned to</th>
                {showFlat && <th>Flat</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c._id}>
                  <td>{c.title}</td>
                  <td data-label="Category">{pretty(c.category)}</td>
                  <td data-label="Priority">
                    <span className={'chip chip-' + c.priority}>{pretty(c.priority)}</span>
                  </td>
                  <td data-label="Status">
                    <span className={'chip chip-' + c.status}>{pretty(c.status)}</span>
                  </td>
                  <td data-label="Assigned">{c.assignedTo?.name || 'Unassigned'}</td>
                  {showFlat && (
                    <td data-label="Flat">
                      {c.raisedBy?.block}-{c.raisedBy?.flatNo}
                    </td>
                  )}
                  <td>
                    <Link className="go-link" to={'/app/complaints/' + c._id}>
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <div className="kicker">New slip</div>
            <h3>Raise a complaint</h3>
            {err && <div className="err">{err}</div>}
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Kitchen tap leaking"
              required
            />
            <div className="grid-2">
              <div>
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="lift">Lift</option>
                  <option value="security">Security</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <label>What happened</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="A short note for staff."
            />
            <label>Photo / video</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
