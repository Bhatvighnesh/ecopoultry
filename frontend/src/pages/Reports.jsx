import { useState } from 'react';
import { FileDown, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function Reports() {
  const [from, setFrom] = useState(() => toInputDate(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/reports/export.csv', {
        params: { from: new Date(from).toISOString(), to: new Date(`${to}T23:59:59`).toISOString() },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ecopoultry-report-${from}_${to}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h2>
            <FileDown size={18} /> Export Report (CSV)
          </h2>
        </div>
        <p className="hint">
          Includes environmental data, measured waste/biogas/fertilizer trend, FCR, Hen-Day %, freshness tests,
          alerts, and productivity classifications for the selected range.
        </p>
        {error && (
          <div className="form-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <div className="date-range-row">
          <label>
            From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button onClick={handleDownload} disabled={downloading}>
            <FileDown size={16} />
            {downloading ? 'Generating...' : 'Download CSV'}
          </button>
        </div>
      </section>
    </div>
  );
}
