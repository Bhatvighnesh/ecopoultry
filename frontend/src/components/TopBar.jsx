import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useLiveData } from '../context/LiveDataContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/productivity': 'Productivity',
  '/alerts': 'Alerts',
  '/demo': 'Synthetic Data',
  '/devices': 'Devices',
  '/audit': 'Audit Log',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/users': 'Users',
};

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { connected } = useLiveData();
  const title = TITLES[pathname] || 'EcoPoultry';

  return (
    <header className="topbar">
      <button className="icon-btn topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-spacer" />
      <span className="connection-pill">
        <span className={`dot ${connected ? 'dot-online' : 'dot-offline'}`} />
        <span className="label-text">{connected ? 'Live' : 'Disconnected'}</span>
      </span>
    </header>
  );
}
