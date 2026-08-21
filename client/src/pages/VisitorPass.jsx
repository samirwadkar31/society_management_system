import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtWhen(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function VisitorPass() {
  const { id } = useParams();
  const [list, setList] = useState([]);
  const v = list.find((x) => x._id === id);

  useEffect(() => {
    api('/visitors').then(setList);
  }, [id]);

  if (!v) {
    return (
      <div className="pass-page">
        <p>Loading pass…</p>
      </div>
    );
  }

  return (
    <div className="pass-page">
      <Link className="go-link" to="/app/visitors">
        ← All visitors
      </Link>
      <div className="card pass-doc">
        <div className="kicker">Visitor pass</div>
        <h2>Kutumb Residency</h2>
        <p className="bill-who">
          {v.name} · {pretty(v.purpose)}
          <br />
          Visiting {v.visitingUser?.name} · {v.visitingUser?.block}-{v.visitingUser?.flatNo}
          {v.entryAt ? (
            <>
              <br />
              In {fmtWhen(v.entryAt)}
              {v.exitAt ? ` · Out ${fmtWhen(v.exitAt)}` : ''}
            </>
          ) : null}
        </p>
        <QRCodeSVG value={v.passCode} size={140} />
        <div className="pass-code">{v.passCode}</div>
        <p>Show this at the gate. Security will scan or type the code.</p>
        <button className="btn btn-ghost" onClick={() => window.print()}>
          Print
        </button>
      </div>
    </div>
  );
}
