import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BellRing,
  FileDown,
  SlidersHorizontal,
  Users as UsersIcon,
  LogOut,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveData } from '../context/LiveDataContext';

export default function Sidebar({ open, onNavigate }) {
  const { user, logout, isAdmin } = useAuth();
  const { alerts } = useLiveData();
  const navigate = useNavigate();

  const unacknowledgedCritical = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleClick() {
    onNavigate?.();
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">
          <Leaf size={18} />
        </span>
        EcoPoultry
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleClick}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/productivity" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleClick}>
          <TrendingUp size={18} />
          Productivity
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleClick}>
          <BellRing size={18} />
          Alerts
          {unacknowledgedCritical > 0 && <span className="nav-badge">{unacknowledgedCritical}</span>}
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleClick}>
          <FileDown size={18} />
          Reports
        </NavLink>

        {isAdmin && (
          <>
            <div className="sidebar-section-label">Admin</div>
            <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleClick}>
              <SlidersHorizontal size={18} />
              Settings
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleClick}>
              <UsersIcon size={18} />
              Users
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-avatar">{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role}</div>
        </div>
        <button className="icon-btn" onClick={handleLogout} title="Logout">
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
