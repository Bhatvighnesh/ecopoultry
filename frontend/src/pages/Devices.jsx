import { useEffect, useState, useCallback } from 'react';
import { Radio } from 'lucide-react';
import apiClient from '../api/client';

const POLL_MS = 6000;

function timeAgo(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return new Date(iso).toLocaleString();
}

function StatusBadge({ device }) {
  if (device.eventDriven) return <span className="badge badge-stale">Event-driven</span>;
  return device.online
    ? <span className="badge badge-safe">Online</span>
    : <span className="badge badge-critical">Offline</span>;
}

export default function Devices() {
  const [devices, setDevices] = useState([]);

  const load = useCallback(async () => {
    const { data } = await apiClient.get('/api/devices');
    setDevices(data.devices);
  }, []);

  useEffect(() => {
    load().catch((err) => console.error(err));
    const id = setInterval(() => load().catch((err) => console.error(err)), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const onlineCount = devices.filter((d) => d.online).length;
  const pollingCount = devices.filter((d) => !d.eventDriven).length;

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h2>
            <Radio size={18} /> Sensor Nodes
          </h2>
          {devices.length > 0 && (
            <span className="hint">
              {onlineCount} of {pollingCount} polling nodes online
            </span>
          )}
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Type</th>
                <th>Sensors</th>
                <th>Status</th>
                <th>Last seen</th>
                <th>Readings</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={`${d.kind}-${d.deviceId}`}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{d.deviceId}</td>
                  <td>{d.kind}</td>
                  <td className="hint">{d.sensors}</td>
                  <td>
                    <StatusBadge device={d} />
                  </td>
                  <td>{timeAgo(d.lastSeenAt)}</td>
                  <td>{d.readingCount.toLocaleString()}</td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">No sensor nodes have reported yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
