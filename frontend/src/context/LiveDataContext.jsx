import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

const LiveDataContext = createContext(null);

const MAX_HISTORY_POINTS = 60;

function pushCapped(arr, item, cap = MAX_HISTORY_POINTS) {
  const next = [...arr, item];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

export function LiveDataProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [environment, setEnvironment] = useState(null);
  const [ammoniaZone, setAmmoniaZone] = useState(null);
  const [envHistory, setEnvHistory] = useState([]);
  const [wasteRate, setWasteRate] = useState(null);
  const [henDay, setHenDay] = useState(null);
  const [actuatorStates, setActuatorStates] = useState({ fan: 'off', heater: 'off' });
  const [productivity, setProductivity] = useState(null);
  const [staleness, setStaleness] = useState({});
  const [settings, setSettings] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast._id !== id));
  }, []);

  const refreshSummary = useCallback(async () => {
    const { data } = await apiClient.get('/api/dashboard/summary');
    setEnvironment(data.environment);
    setAmmoniaZone(data.ammoniaZone);
    setWasteRate(data.wasteRate);
    setHenDay(data.henDay);
    setActuatorStates(data.actuatorStates);
    setProductivity(data.productivity);
    setStaleness(data.staleness);
    setSettings(data.settings);
    if (data.environment) setEnvHistory((h) => pushCapped(h, data.environment));
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    refreshSummary().catch((err) => console.error('Failed to load dashboard summary', err));

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('environment:new', ({ reading, ammoniaZone: zone }) => {
      setEnvironment(reading);
      setAmmoniaZone(zone);
      setEnvHistory((h) => pushCapped(h, reading));
    });

    socket.on('waste:update', ({ rate }) => setWasteRate(rate));

    socket.on('egg:new', ({ henDay: hd }) => setHenDay(hd));

    socket.on('actuator:update', (entry) => {
      setActuatorStates((prev) => ({ ...prev, [entry.device]: entry.state }));
    });

    socket.on('productivity:new', (prediction) => setProductivity(prediction));

    socket.on('alert:new', (alert) => {
      setAlerts((a) => [alert, ...a].slice(0, 50));
      setToasts((t) => [...t, alert]);
    });

    // Periodic refresh covers staleness flags (which need wall-clock time to
    // pass) and re-syncs state if a socket event was ever missed.
    const interval = setInterval(() => {
      refreshSummary().catch(() => {});
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [user, refreshSummary]);

  const value = {
    environment,
    ammoniaZone,
    envHistory,
    wasteRate,
    henDay,
    actuatorStates,
    productivity,
    staleness,
    settings,
    alerts,
    toasts,
    dismissToast,
    connected,
    refreshSummary,
  };

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error('useLiveData must be used within LiveDataProvider');
  return ctx;
}
