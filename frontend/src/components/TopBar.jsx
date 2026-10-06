import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import { useLiveData } from '../context/LiveDataContext';
import { getTheme, applyTheme } from '../theme';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/productivity': 'Productivity',
  '/alerts': 'Alerts',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/users': 'Users',
  '/demo': 'Synthetic Data',
  '/devices': 'Devices',
  '/audit': 'Audit Log',
};

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { connected } = useLiveData();
  const title = TITLES[pathname] || 'EcoPoultry';
  const [theme, setTheme] = useState(getTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <header className="topbar">
      <button className="icon-btn topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-spacer" />
      <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <span className="connection-pill">
        <span className={`dot ${connected ? 'dot-online' : 'dot-offline'}`} />
        <span className="label-text">{connected ? 'Live' : 'Disconnected'}</span>
      </span>
    </header>
  );
}
