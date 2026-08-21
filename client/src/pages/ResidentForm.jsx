import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ResidentForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [u, setU] = useState(null);
  const [status, setStatus] = useState('approved');
  const [block, setBlock] = useState('');
  const [flatNo, setFlatNo] = useState('');

  useEffect(() => {
    api('/users/' + id).then((d) => {
      setU(d);
      setStatus(d.status);
      setBlock(d.block || '');
      setFlatNo(d.flatNo || '');
    });
  }, [id]);

  async function save(e) {
    e.preventDefault();
    await api('/users/' + id, {
      method: 'PUT',
      body: JSON.stringify({ status, block, flatNo })
    });
    nav('/app/residents');
  }

  if (!u) {
    return (
      <div className="prof-page">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="prof-page">
      <Link className="go-link" to="/app/residents">
        ← All residents
      </Link>
      <form className="card" onSubmit={save} style={{ maxWidth: 520, marginTop: 12 }}>
        <div className="kicker">{pretty(u.residentType) || 'Resident'}</div>
        <h3>{u.name}</h3>
        <p className="flat-meta">
          {u.email}
          {u.phone ? ` · ${u.phone}` : ''}
        </p>
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="grid-2">
          <div>
            <label>Block</label>
            <input value={block} onChange={(e) => setBlock(e.target.value)} />
          </div>
          <div>
            <label>Flat</label>
            <input value={flatNo} onChange={(e) => setFlatNo(e.target.value)} />
          </div>
        </div>
        <Household title="Family" rows={u.familyMembers} line={(m) => `${m.name}${m.relation ? ` · ${m.relation}` : ''}`} />
        <Household title="Vehicles" rows={u.vehicles} line={(v) => [v.number, v.model].filter(Boolean).join(' · ')} />
        <Household title="Pets" rows={u.pets} line={(p) => [p.name, p.type].filter(Boolean).join(' · ')} />
        <Household
          title="Emergency contacts"
          rows={u.emergencyContacts}
          line={(c) => [c.name, c.phone].filter(Boolean).join(' · ')}
        />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} type="submit">
          Save
        </button>
      </form>
    </div>
  );
}

function Household({ title, rows, line }) {
  const list = rows || [];
  return (
    <section className="flat-sec">
      <div className="flat-sec-h">
        <span>{title}</span>
      </div>
      {list.length === 0 ? (
        <p className="flat-empty">None listed.</p>
      ) : (
        list.map((row, i) => (
          <p className="flat-meta" key={i}>
            {line(row)}
          </p>
        ))
      )}
    </section>
  );
}
