import { useEffect, useState } from 'react';
import { SlidersHorizontal, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

const emptyForm = {
  flockSize: 100,
  envThresholds: { tempWarning: 32, tempCritical: 36, humidityWarning: 70, humidityCritical: 80, gasWarning: 1500, gasCritical: 2500 },
  wasteAmmoniaThresholds: { moderate: 1200, high: 2200 },
  freshnessGasThresholds: { fresh: 800, checkBeforeUse: 1600 },
  birdWeightGain: { valueKg: 0.5, periodDays: 7 },
};

export default function Settings() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient.get('/api/settings').then(({ data }) => {
      const s = data.settings;
      setForm({
        flockSize: s.flockSize,
        envThresholds: s.envThresholds,
        wasteAmmoniaThresholds: s.wasteAmmoniaThresholds,
        freshnessGasThresholds: s.freshnessGasThresholds,
        birdWeightGain: { valueKg: s.birdWeightGain.valueKg, periodDays: s.birdWeightGain.periodDays },
      });
    });
  }, []);

  function setField(section, key, value) {
    setForm((f) =>
      section
        ? { ...f, [section]: { ...f[section], [key]: Number(value) } }
        : { ...f, [key]: Number(value) }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await apiClient.put('/api/settings', form);
      setMessage('Settings saved.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h2>
            <SlidersHorizontal size={18} /> Admin Settings
          </h2>
        </div>
        <p className="hint">
          These are set occasionally, not re-entered per calculation. The system uses them automatically on every new
          sensor reading.
        </p>
        {message && (
          <div className={message.includes('saved') ? 'form-message' : 'form-error'}>
            {message.includes('saved') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message}
          </div>
        )}

        <fieldset>
          <legend>Flock</legend>
          <label>
            Flock Size
            <input type="number" min="1" value={form.flockSize} onChange={(e) => setField(null, 'flockSize', e.target.value)} />
          </label>
          <label>
            Bird Weight Gain (kg, from periodic manual weighing)
            <input type="number" step="0.01" min="0" value={form.birdWeightGain.valueKg} onChange={(e) => setField('birdWeightGain', 'valueKg', e.target.value)} />
          </label>
          <label>
            Weighing Period (days)
            <input type="number" min="1" value={form.birdWeightGain.periodDays} onChange={(e) => setField('birdWeightGain', 'periodDays', e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Environmental Thresholds</legend>
          <label>
            Temperature Warning (°C)
            <input type="number" value={form.envThresholds.tempWarning} onChange={(e) => setField('envThresholds', 'tempWarning', e.target.value)} />
          </label>
          <label>
            Temperature Critical (°C)
            <input type="number" value={form.envThresholds.tempCritical} onChange={(e) => setField('envThresholds', 'tempCritical', e.target.value)} />
          </label>
          <label>
            Humidity Warning (%)
            <input type="number" value={form.envThresholds.humidityWarning} onChange={(e) => setField('envThresholds', 'humidityWarning', e.target.value)} />
          </label>
          <label>
            Humidity Critical (%)
            <input type="number" value={form.envThresholds.humidityCritical} onChange={(e) => setField('envThresholds', 'humidityCritical', e.target.value)} />
          </label>
          <label>
            Gas Warning (raw)
            <input type="number" value={form.envThresholds.gasWarning} onChange={(e) => setField('envThresholds', 'gasWarning', e.target.value)} />
          </label>
          <label>
            Gas Critical (raw)
            <input type="number" value={form.envThresholds.gasCritical} onChange={(e) => setField('envThresholds', 'gasCritical', e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Waste Ammonia Buildup Zones (coop gas sensor)</legend>
          <label>
            Moderate threshold (raw)
            <input type="number" value={form.wasteAmmoniaThresholds.moderate} onChange={(e) => setField('wasteAmmoniaThresholds', 'moderate', e.target.value)} />
          </label>
          <label>
            High threshold (raw)
            <input type="number" value={form.wasteAmmoniaThresholds.high} onChange={(e) => setField('wasteAmmoniaThresholds', 'high', e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Egg Freshness Thresholds (dedicated gas sensor)</legend>
          <label>
            Fresh below (raw)
            <input type="number" value={form.freshnessGasThresholds.fresh} onChange={(e) => setField('freshnessGasThresholds', 'fresh', e.target.value)} />
          </label>
          <label>
            Check Before Use below (raw)
            <input type="number" value={form.freshnessGasThresholds.checkBeforeUse} onChange={(e) => setField('freshnessGasThresholds', 'checkBeforeUse', e.target.value)} />
          </label>
        </fieldset>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
