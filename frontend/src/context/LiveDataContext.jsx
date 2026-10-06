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

const sourceOfNode = (nodeId) => (/^demo-/.test(nodeId || '') ? 'demo' : 'live');

export function LiveDataProvider({ source = 'live', children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [environment, setEnvironment] = useState(null);
  const [ammoniaZone, setAmmoniaZone] = useState(null);
  const [envHistory, setEnvHistory] = useState([]);
  const [wasteRate, setWasteRate] = useState(null);
  const [avgActivity, setAvgActivity] = useState(null);
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
    const { data } = await apiClient.get('/api/dashboard/summary', { params: { source } });
    setEnvironment(data.environment);
    setAmmoniaZone(data.ammoniaZone);
    setWasteRate(data.wasteRate);
    setAvgActivity(data.avgActivity);
    setActuatorStates(data.actuatorStates);
    setProductivity(data.productivity);
    setStaleness(data.staleness);
    setSettings(data.settings);
    if (data.environment) setEnvHistory((h) => pushCapped(h, data.environment));
  }, [source]);

  useEffect(() => {
    if (!user) return undefined;

    refreshSummary().catch((err) => console.error('Failed to load dashboard summary', err));

    const isMine = (nodeId) => sourceOfNode(nodeId) === source;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('environment:new', ({ reading, ammoniaZone: zone }) => {
      if (!isMine(reading.nodeId)) return;
      setEnvironment(reading);
      setAmmoniaZone(zone);
      setEnvHistory((h) => pushCapped(h, reading));
    });

    socket.on('waste:update', ({ reading, rate }) => {
      if (isMine(reading.nodeId)) setWasteRate(rate);
    });

    socket.on('actuator:update', (entry) => {
      setActuatorStates((prev) => ({ ...prev, [entry.device]: entry.state }));
    });

    socket.on('productivity:new', (prediction) => {
      if (prediction.source === source) setProductivity(prediction);
    });

    socket.on('alert:new', (alert) => {
      setAlerts((a) => [alert, ...a].slice(0, 50));
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
  }, [user, source, refreshSummary]);

  const value = {
    environment,
    ammoniaZone,
    envHistory,
    wasteRate,
    avgActivity,
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
