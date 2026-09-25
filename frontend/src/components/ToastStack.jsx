import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLiveData } from '../context/LiveDataContext';

const AUTO_DISMISS_MS = 7000;

function Toast({ alert, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast">
      <AlertTriangle size={18} className="toast-icon" />
      <div className="toast-body">
        <strong>{alert.severity === 'critical' ? 'Critical alert' : 'Warning'}</strong>
        <div>{alert.message}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastStack() {
  const { toasts, dismissToast } = useLiveData();
  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map((alert) => (
        <Toast key={alert._id} alert={alert} onClose={() => dismissToast(alert._id)} />
      ))}
    </div>
  );
}
