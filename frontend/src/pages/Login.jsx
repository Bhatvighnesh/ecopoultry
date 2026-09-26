import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, AlertCircle, Activity, Cpu, BarChart3, Bird, Wifi, Thermometer, Gauge, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: Activity, text: 'Real-time coop environment monitoring' },
  { icon: Cpu, text: 'Closed-loop actuator control, automatically' },
  { icon: BarChart3, text: 'ML-powered flock health & productivity insights' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-showcase">
        <span className="login-blob b1" />
        <span className="login-blob b2" />
        <span className="login-blob b3" />

        <div className="login-showcase-content">
          <div className="login-brand">
            <span className="brand-mark">
              <Leaf size={20} />
            </span>
            <h1>EcoPoultry</h1>
          </div>
          <div className="login-illustration">
            <span className="illo-ring r1" />
            <span className="illo-ring r2" />
            <span className="illo-core">
              <Bird size={38} />
            </span>
            <span className="illo-badge badge-wifi">
              <Wifi size={15} />
            </span>
            <span className="illo-badge badge-temp">
              <Thermometer size={15} />
            </span>
            <span className="illo-badge badge-gauge">
              <Gauge size={15} />
            </span>
          </div>

          <h2>Smart poultry management, run by sensors.</h2>
          <p className="login-showcase-sub">
            Waste, biogas, and productivity metrics calculated automatically from live sensor
            data — with an ML classifier watching flock health in real time.
          </p>
          <ul className="login-features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="feature-icon">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-brand">
            <span className="brand-mark">
              <Leaf size={20} />
            </span>
            <h1>EcoPoultry</h1>
          </div>
          <p className="login-form-eyebrow">Welcome back</p>
          <p className="login-subtitle">Sign in to your coop's live dashboard.</p>
          {error && (
            <div className="form-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="login-hint">Live sensor dashboard for coop environment, waste, and flock productivity.</p>
        </form>
      </div>
    </div>
  );
}
