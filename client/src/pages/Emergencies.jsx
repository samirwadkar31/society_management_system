import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StackFilter, { monthLabel, takeStack, useStack } from '../components/StackFilter';

function pretty(s) {
  if (!s) return '';
  return String(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtWhen(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Emergencies() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const { stack, setStack, month, setMonth } = useStack();

  async function load() {
    setList(await api('/emergencies'));
  }
  useEffect(() => {
    load();
  }, []);

  async function handle(id) {
    await api('/emergencies/' + id + '/handle', { method: 'POST' });
    load();
  }

  const canHandle = user.role !== 'resident';
  const shown = useMemo(
    () =>
      takeStack(
        list,
        stack,
        month,
        (e) => e.status === 'active',
        (e) => e.updatedAt || e.createdAt
      ),
    [list, stack, month]
  );

  return (
    <div>
      <div className="list-head">
        <h3>Emergencies</h3>
        <div className="list-head-tools">
          <StackFilter
            stack={stack}
            onStack={setStack}
            month={month}
            onMonth={setMonth}
            live="Active"
            past="Handled"
          />
        </div>
      </div>
      <div className="card">
        {shown.length === 0 ? (
          <div className="empty">
            {stack === 'live'
              ? 'No SOS yet. Quiet courtyard.'
              : `No handled SOS in ${monthLabel(month)}.`}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Flat</th>
                <th>Status</th>
                <th>When</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e._id}>
                  <td>
                    {pretty(e.type)}
                    {e.message ? (
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{e.message}</div>
                    ) : null}
                  </td>
                  <td data-label="Flat">
                    {e.raisedBy?.name}
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {e.block}-{e.flatNo}
                      {e.raisedBy?.phone ? ` · ${e.raisedBy.phone}` : ''}
                    </div>
                  </td>
                  <td data-label="Status">
                    <span className={'chip chip-' + e.status}>{pretty(e.status)}</span>
                  </td>
                  <td data-label="When">{fmtWhen(e.createdAt)}</td>
                  <td>
                    {e.status === 'active' && canHandle && (
                      <button className="btn btn-primary btn-sm" onClick={() => handle(e._id)}>
                        Mark handled
                      </button>
                    )}
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
