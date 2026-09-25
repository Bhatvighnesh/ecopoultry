import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="brand-mark">
            <Leaf size={20} />
          </span>
          <h1>EcoPoultry</h1>
        </div>
        <p className="login-subtitle">Smart Poultry Waste Management &amp; Productivity Analyzer</p>
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
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="login-hint">Live sensor dashboard for coop environment, waste, and flock productivity.</p>
      </form>
    </div>
  );
}
