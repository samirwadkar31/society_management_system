import { useEffect, useMemo, useState } from 'react';
import { api, uploadFile } from '../api';
import { useAuth } from '../context/AuthContext';
import StackFilter, { isFresh, monthLabel, takeStack, useStack } from '../components/StackFilter';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Notices() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'general',
    pinned: false
  });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const { stack, setStack, month, setMonth } = useStack();

  async function load() {
    setList(await api('/notices'));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setErr('');
    try {
      const attachments = [];
      if (file) {
        const up = await uploadFile(file);
        attachments.push(up.url);
      }
      await api('/notices', {
        method: 'POST',
        body: JSON.stringify({ ...form, attachments })
      });
      setOpen(false);
      setForm({ title: '', body: '', type: 'general', pinned: false });
      setFile(null);
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function remove(id) {
    if (!confirm('Remove this notice?')) return;
    await api('/notices/' + id, { method: 'DELETE' });
    load();
  }

  async function togglePin(n) {
    await api('/notices/' + n._id, {
      method: 'PUT',
      body: JSON.stringify({ pinned: !n.pinned })
    });
    load();
  }

  const shown = useMemo(
    () =>
      takeStack(
        list,
        stack,
        month,
        (n) => n.pinned || isFresh(n.createdAt),
        (n) => n.createdAt
      ),
    [list, stack, month]
  );

  return (
    <div>
      <div className="list-head">
        <h3>Notices</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="On the board"
            past="Archive"
          />
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              Pin a notice
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {shown.length === 0 ? (
          <div className="empty">
            {stack === 'live' ? 'Nothing on the board yet.' : `No notices in ${monthLabel(month)}.`}
          </div>
        ) : (
          <div className="board-row notice-grid">
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
                {(n.attachments || []).map((a, i) => (
                  <p key={i}>
                    <a href={a} target="_blank" rel="noreferrer">
                      Attachment
                    </a>
                  </p>
                ))}
                <small>
                  {n.createdBy?.name} ·{' '}
                  {new Date(n.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </small>
                {user.role === 'admin' && (
                  <div className="doc-row" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => togglePin(n)}>
                      {n.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      type="button"
                      className="flat-x"
                      onClick={() => remove(n._id)}
                      aria-label="Remove"
                      title="Remove"
                    >
                      −
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <div className="kicker">Notice board</div>
            <h3>Pin a notice</h3>
            {err && <div className="err">{err}</div>}
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="general">General</option>
              <option value="water">Water</option>
              <option value="power">Power</option>
              <option value="meeting">Meeting</option>
              <option value="event">Event</option>
            </select>
            <label>Note</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="A short note for the building."
            />
            <label>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />{' '}
              Pin on top
            </label>
            <label>Document / image</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit">
                Publish
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
