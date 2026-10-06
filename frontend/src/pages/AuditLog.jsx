import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import apiClient from '../api/client';

function summarize(details) {
  if (!details || Object.keys(details).length === 0) return '—';
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(', ');
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    apiClient
      .get('/api/audit', { params: { limit: 200 } })
      .then(({ data }) => setEntries(data.entries))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h2>
            <History size={18} /> Admin Activity
          </h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._id}>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                  <td>{e.actorEmail}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{e.action}</td>
                  <td>{e.target || '—'}</td>
                  <td className="hint">{summarize(e.details)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">No admin actions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
