import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, uploadFile } from '../api';
import { useAuth } from '../context/AuthContext';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [c, setC] = useState(null);
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [proof, setProof] = useState(null);

  async function load() {
    setC(await api('/complaints/' + id));
  }

  useEffect(() => {
    load();
    if (user.role === 'admin') {
      api('/users/staff').then(setStaff).catch(() => {});
    }
  }, [id]);

  async function assign(e) {
    e.preventDefault();
    await api('/complaints/' + id + '/assign', {
      method: 'POST',
      body: JSON.stringify({ staffId })
    });
    load();
  }

  async function setStatus(status) {
    let proofMedia = c.proofMedia || [];
    if (proof) {
      const up = await uploadFile(proof);
      proofMedia = [...proofMedia, up.url];
    }
    await api('/complaints/' + id + '/status', {
      method: 'POST',
      body: JSON.stringify({ status, proofMedia })
    });
    load();
  }

  async function comment(e) {
    e.preventDefault();
    await api('/complaints/' + id + '/comment', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    setText('');
    load();
  }

  async function escalate() {
    await api('/complaints/' + id + '/escalate', { method: 'POST' });
    load();
  }

  async function rate(e) {
    e.preventDefault();
    await api('/complaints/' + id + '/rate', {
      method: 'POST',
      body: JSON.stringify({ rating, ratingComment: text })
    });
    load();
  }

  if (!c) return <p>Loading...</p>;

  const hours = (Date.now() - new Date(c.createdAt).getTime()) / 36e5;

  return (
    <div>
      <Link className="go-link" to="/app/complaints">
        ← All complaints
      </Link>
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="kicker">{pretty(c.category)}</div>
          <h3>{c.title}</h3>
          <div className="chip-row">
            <span className={'chip chip-' + c.priority}>{pretty(c.priority)}</span>
            <span className={'chip chip-' + c.status}>{pretty(c.status)}</span>
          </div>
          <p className="detail-meta">
            {c.raisedBy?.name} · {c.raisedBy?.block}-{c.raisedBy?.flatNo}
            {c.assignedTo
              ? ` · Assigned to ${c.assignedTo.name} (${pretty(c.assignedTo.staffType)})`
              : ' · Not assigned yet'}
          </p>
          {c.description && <p>{c.description}</p>}
          <div className="media-row">
            {(c.media || []).map((m, i) =>
              String(m).includes('video') ? (
                <video key={i} src={m} controls />
              ) : (
                <img key={i} src={m} alt="" />
              )
            )}
          </div>
          {(c.proofMedia || []).length > 0 && (
            <div>
              <div className="kicker">Resolution proof</div>
              {(c.proofMedia || []).map((m, i) => (
                <img key={i} src={m} alt="proof" style={{ maxWidth: 160, borderRadius: 10 }} />
              ))}
            </div>
          )}
          {c.rating && (
            <p>
              Rated {c.rating}/5 — {c.ratingComment}
            </p>
          )}
        </div>
        <div>
          {user.role === 'admin' && (
            <form className="card" onSubmit={assign}>
              <div className="kicker">Committee</div>
              <h3>Assign staff</h3>
              <label>Staff</label>
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
                <option value="">Select</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({pretty(s.staffType)})
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} type="submit">
                Assign
              </button>
            </form>
          )}
          {user.role === 'staff' && (
            <div className="card">
              <div className="kicker">Job</div>
              <h3>Update status</h3>
              <label>Proof photo</label>
              <input type="file" onChange={(e) => setProof(e.target.files[0])} />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setStatus('in-progress')}>
                  In progress
                </button>
                <button className="btn btn-primary btn-sm" type="button" onClick={() => setStatus('resolved')}>
                  Mark resolved
                </button>
              </div>
            </div>
          )}
          {(user.role === 'resident' || user.role === 'admin') &&
            c.status !== 'resolved' &&
            (hours >= 48 || user.role === 'admin') && (
              <button className="btn btn-danger btn-sm" type="button" onClick={escalate}>
                Escalate
              </button>
            )}
          {user.role === 'resident' && c.status === 'resolved' && !c.rating && (
            <form className="card" onSubmit={rate}>
              <div className="kicker">Your flat</div>
              <h3>Rate resolution</h3>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <textarea
                placeholder="Comment"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="submit">
                Submit rating
              </button>
            </form>
          )}
          <div className="card">
            <div className="kicker">Courtyard</div>
            <h3>Comments</h3>
            {(c.comments || []).length === 0 && <p className="flat-empty">No comments yet.</p>}
            {(c.comments || []).map((cm, i) => (
              <div className="comment" key={i}>
                <b>{cm.user?.name}</b>
                <p>{cm.text}</p>
              </div>
            ))}
            {!(user.role === 'resident' && c.status === 'resolved' && !c.rating) && (
              <form onSubmit={comment}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} required />
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} type="submit">
                  Add comment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
