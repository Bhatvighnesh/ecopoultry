import { useMemo } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Fan,
  Trash2,
  Flame,
  Sprout,
  Egg,
  CloudFog,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Radio,
  HeartPulse,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';
import { useLiveData } from '../context/LiveDataContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StaleBadge from '../components/StaleBadge';
import AlertBanner from '../components/AlertBanner';
import LiveChart from '../components/LiveChart';
import apiClient from '../api/client';

const AMMONIA_ZONE_STATUS = { Low: 'safe', Moderate: 'warning', High: 'critical' };

const PRED_STATUS = { Healthy: 'safe', Watch: 'warning', Critical: 'critical' };
const PRED_ICON = { Healthy: ShieldCheck, Watch: ShieldAlert, Critical: ShieldX };

const HERO_META = {
  safe: { icon: ShieldCheck, label: 'All systems normal' },
  warning: { icon: AlertTriangle, label: 'Attention needed' },
  critical: { icon: AlertOctagon, label: 'Critical condition detected' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const {
    environment,
    ammoniaZone,
    envHistory,
    wasteRate,
    henDay,
    actuatorStates,
    staleness,
    alerts,
    productivity,
  } = useLiveData();

  const chartLabels = useMemo(
    () => envHistory.map((r) => new Date(r.createdAt).toLocaleTimeString()),
    [envHistory]
  );

  async function toggleFan() {
    const next = actuatorStates.fan === 'on' ? 'off' : 'on';
    await apiClient.post('/api/actuators/relay', { device: 'fan', state: next });
  }

  const heroMeta = environment ? HERO_META[environment.status] : null;
  const HeroIcon = heroMeta ? heroMeta.icon : Radio;

  return (
    <div className="page">
      <section className={`dashboard-hero ${environment ? `hero-${environment.status}` : 'hero-pending'}`}>
        <span className="dashboard-hero-icon">
          <HeroIcon size={24} />
        </span>
        <div>
          <div className="dashboard-hero-greeting">
            {greeting()}
            {user?.name ? `, ${user.name}` : ''}
          </div>
          <div className="dashboard-hero-status">
            {heroMeta ? heroMeta.label : 'Waiting for the first sensor reading...'}
          </div>
        </div>
        <span className="dashboard-hero-time">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </section>

      <AlertBanner alerts={alerts} />

      <section>
        <div className="card-grid">
          <div>
            <StatCard
              label="Temperature"
              value={environment ? environment.temperature.toFixed(1) : null}
              unit="°C"
              status={environment?.status}
              icon={Thermometer}
            />
            <StaleBadge status={staleness.environment} />
          </div>
          <StatCard
            label="Humidity"
            value={environment ? environment.humidity.toFixed(1) : null}
            unit="%"
            status={environment?.status}
            icon={Droplets}
          />
          <StatCard
            label="Gas (MQ135)"
            value={environment ? environment.gas.toFixed(0) : null}
            unit="raw"
            status={environment?.status}
            icon={Wind}
          />
          <StatCard
            label="Activity"
            value={environment ? environment.activity.toFixed(1) : null}
            unit="/min"
            icon={Activity}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Environment Trend</h2>
          {environment && (
            <span className={`badge badge-${environment.status}`}>{environment.status.toUpperCase()}</span>
          )}
        </div>
        <LiveChart
          labels={chartLabels}
          series={[
            { label: 'Temp (°C)', data: envHistory.map((r) => r.temperature), color: '#d1364a' },
            { label: 'Humidity (%)', data: envHistory.map((r) => r.humidity), color: '#1f7a5c' },
          ]}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <Fan size={18} /> Actuator State (Closed-Loop Response)
          </h2>
        </div>
        <div className="actuator-row">
          <div className={`actuator-pill ${actuatorStates.fan === 'on' ? 'on' : 'off'}`}>
            <Fan size={16} /> Fan: {actuatorStates.fan?.toUpperCase()}
          </div>
          {isAdmin && (
            <button className="btn-small" onClick={toggleFan}>
              Manual override: turn {actuatorStates.fan === 'on' ? 'off' : 'on'}
            </button>
          )}
        </div>
      </section>

      <section>
        <div className="card-grid">
          <StatCard
            label="Measured Waste Rate"
            value={wasteRate ? wasteRate.kgPerDay : null}
            unit="kg/day"
            sub={wasteRate ? `${wasteRate.gramsPerHour} g/hr` : ''}
            icon={Trash2}
          />
          <StatCard
            label="Biogas Potential"
            value={wasteRate ? wasteRate.biogasM3PerDay : null}
            unit="m³/day"
            icon={Flame}
          />
          <StatCard
            label="Fertilizer Potential"
            value={wasteRate ? wasteRate.fertilizerKgPerDay : null}
            unit="kg/day"
            icon={Sprout}
          />
          <StatCard
            label="Ammonia Buildup Zone"
            value={ammoniaZone || null}
            status={ammoniaZone ? AMMONIA_ZONE_STATUS[ammoniaZone] : undefined}
            icon={CloudFog}
          />
        </div>
      </section>

      <section>
        <div className="card-grid">
          <StatCard
            label="Hen-Day Production (today)"
            value={henDay ? henDay.henDayPercent : null}
            unit="%"
            sub={henDay ? `${henDay.eggEventCount} eggs today` : ''}
            icon={Egg}
          />
        </div>
      </section>

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
                {(() => {
                  const PredIcon = PRED_ICON[productivity.classification];
                  return PredIcon ? <PredIcon size={22} /> : null;
                })()}
              </span>
              <div>
                <div className="classification-hero-title">{productivity.classification}</div>
                <div className="classification-hero-sub">
                  {(productivity.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            </div>
            {productivity.featureImportances && (
              <div className="importance-bars">
                {Object.entries(productivity.featureImportances)
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
          </>
        ) : (
          <div className="empty-state">No classification yet.</div>
        )}
      </section>
    </div>
  );
}
