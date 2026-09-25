import { useEffect, useState, useCallback } from 'react';
import { BellRing, Check } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLiveData } from '../context/LiveDataContext';

export default function Alerts() {
  const { isAdmin } = useAuth();
  const { alerts: liveAlerts } = useLiveData();
  const [alerts, setAlerts] = useState([]);

  const load = useCallback(async () => {
    const { data } = await apiClient.get('/api/alerts', { params: { limit: 100 } });
    setAlerts(data.alerts);
  }, []);

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, [load, liveAlerts]);

  async function acknowledge(id) {
    await apiClient.patch(`/api/alerts/${id}/acknowledge`);
    load();
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h2>
            <BellRing size={18} /> Alert History
          </h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Message</th>
                {isAdmin && <th>Ack</th>}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a._id} className={a.acknowledged ? 'row-muted' : ''}>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.type}</td>
                  <td>
                    <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                  </td>
                  <td>{a.message}</td>
                  {isAdmin && (
                    <td>
                      {!a.acknowledged && (
                        <button className="btn-small" onClick={() => acknowledge(a._id)}>
                          <Check size={13} /> Acknowledge
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="empty-state">No alerts recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
