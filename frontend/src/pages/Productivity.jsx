import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeartPulse, Gauge, FlaskConical, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import apiClient from '../api/client';
import { useLiveData } from '../context/LiveDataContext';
import StatCard from '../components/StatCard';

const FCR_STATUS = { Efficient: 'safe', Average: 'warning', 'Needs Attention': 'critical' };
const PRED_STATUS = { Healthy: 'safe', Watch: 'warning', Critical: 'critical' };
const PRED_ICON = { Healthy: ShieldCheck, Watch: ShieldAlert, Critical: ShieldX };
const FRESHNESS_STATUS = { Fresh: 'safe', 'Check Before Use': 'warning', Stale: 'critical' };

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function Productivity() {
  const { productivity } = useLiveData();
  const [searchParams, setSearchParams] = useSearchParams();
  const source = searchParams.get('source') === 'demo' ? 'demo' : 'live';

  const [from, setFrom] = useState(() => toInputDate(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [fcr, setFcr] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [freshnessTests, setFreshnessTests] = useState([]);
  const [testingFreshness, setTestingFreshness] = useState(false);
  const [freshnessResult, setFreshnessResult] = useState(null);

  const loadPeriodData = useCallback(async () => {
    const params = {
      from: new Date(from).toISOString(),
      to: new Date(`${to}T23:59:59`).toISOString(),
      source,
    };
    const { data } = await apiClient.get('/api/productivity/fcr', { params });
    setFcr(data);
  }, [from, to, source]);

  const loadPredictions = useCallback(async () => {
    const { data } = await apiClient.get('/api/productivity/predictions', { params: { limit: 20, source } });
    setPredictions(data.predictions);
  }, [source]);

  const loadFreshnessTests = useCallback(async () => {
    const { data } = await apiClient.get('/api/sensors/freshness-test', { params: { limit: 20 } });
    setFreshnessTests(data.tests);
  }, []);

  useEffect(() => {
    loadPeriodData().catch((err) => console.error(err));
  }, [loadPeriodData]);

  useEffect(() => {
    loadPredictions().catch((err) => console.error(err));
    loadFreshnessTests().catch((err) => console.error(err));
  }, [loadPredictions, loadFreshnessTests]);

  useEffect(() => {
    loadFreshnessTests().catch(() => {});
  }, [productivity, loadFreshnessTests]);

  async function triggerFreshnessTest() {
    setTestingFreshness(true);
    setFreshnessResult(null);
    try {
      const gasReading = Math.round(300 + Math.random() * 2000);
      const { data } = await apiClient.post('/api/sensors/freshness-test', { gasReading });
      setFreshnessResult(data.test);
      loadFreshnessTests().catch(() => {});
    } finally {
      setTestingFreshness(false);
    }
  }

  const latestFeatureImportances = productivity?.featureImportances;
  const PredIcon = productivity ? PRED_ICON[productivity.classification] : null;

  return (
    <div className="page">
      <div className="source-toggle">
        <button
          className={`btn-small ${source === 'live' ? 'active-source' : ''}`}
          onClick={() => setSearchParams({})}
        >
          Live hardware
        </button>
        <button
          className={`btn-small ${source === 'demo' ? 'active-source' : ''}`}
          onClick={() => setSearchParams({ source: 'demo' })}
        >
          Synthetic data
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <HeartPulse size={18} /> Live Flock Status (ML Classifier)
          </h2>
        </div>
        {productivity ? (
          <>
            <div className={`classification-hero stat-${PRED_STATUS[productivity.classification]}`}>
              <span className="classification-hero-icon">
                {PredIcon && <PredIcon size={22} />}
              </span>
              <div>
                <div className="classification-hero-title">{productivity.classification}</div>
                <div className="classification-hero-sub">{(productivity.confidence * 100).toFixed(0)}% confidence</div>
              </div>
            </div>
            {latestFeatureImportances && (
              <div className="importance-bars">
                {Object.entries(latestFeatureImportances)
                  .filter(([key]) => key !== 'feedTrend')
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, val]) => (
                    <div key={key} className="importance-row">
                      <span className="importance-label">{key}</span>
                      <div className="importance-track">
                        <div className="importance-fill" style={{ width: `${val * 100}%` }} />
                      </div>
                      <span className="importance-pct">{(val * 100).toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            )}
            <p className="hint">
              Trained on a synthetic, domain-rule-labeled dataset (see README) - treat as a proof-of-concept, not a
              validated diagnostic.
            </p>
          </>
        ) : (
          <p className="empty-state">No classification yet.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Reporting Period</h2>
        </div>
        <div className="date-range-row">
          <label>
            From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </section>

      <div className="card-grid">
        <StatCard
          label="FCR"
          value={fcr?.fcr ?? null}
          status={fcr?.classification ? FCR_STATUS[fcr.classification] : undefined}
          badgeLabel={fcr?.classification}
          sub={fcr ? `feed ${fcr.feedConsumedKg}kg / gain ${fcr.weightGainKg}kg` : ''}
          icon={Gauge}
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <FlaskConical size={18} /> Egg Freshness Test
          </h2>
        </div>
        <p className="hint">
          Fired when a farmer holds an egg to the dedicated freshness MQ135 sensor. The button below simulates that
          physical trigger for demo purposes (no such sensor hardware is wired up yet).
        </p>
        <button onClick={triggerFreshnessTest} disabled={testingFreshness}>
          {testingFreshness ? 'Reading sensor...' : 'Trigger Freshness Test'}
        </button>
        {freshnessResult && (
          <div style={{ marginTop: '0.75rem' }}>
            <span className={`badge badge-${FRESHNESS_STATUS[freshnessResult.result]}`}>
              {freshnessResult.result} (gas={freshnessResult.gasReading})
            </span>
          </div>
        )}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Gas Reading</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {freshnessTests.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>{t.gasReading}</td>
                  <td>
                    <span className={`badge badge-${FRESHNESS_STATUS[t.result]}`}>{t.result}</span>
                  </td>
                </tr>
              ))}
              {freshnessTests.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">No freshness tests recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent Classifications</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Classification</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${PRED_STATUS[p.classification]}`}>{p.classification}</span>
                  </td>
                  <td>{(p.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
              {predictions.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">No classifications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
