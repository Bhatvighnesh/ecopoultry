import { useEffect, useRef, useState } from 'react';

export default function StatCard({ label, value, unit, status, badgeLabel, sub, icon: Icon }) {
  const [pulsing, setPulsing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== undefined && value !== null && prevValue.current !== value && prevValue.current !== undefined) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 700);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
    prevValue.current = value;
    return undefined;
  }, [value]);

  const isLoading = value === undefined || value === null || value === '--';

  return (
    <div className={`stat-card ${status ? `stat-${status}` : ''} ${pulsing ? 'pulse' : ''}`}>
      <div className="stat-card-top">
        {Icon && (
          <span className="stat-icon">
            <Icon size={18} />
          </span>
        )}
        {badgeLabel && <span className={`badge badge-${status || 'safe'}`}>{badgeLabel}</span>}
      </div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${isLoading ? 'skeleton' : ''}`}>
        {isLoading ? '00.0' : value}
        {!isLoading && unit && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && !isLoading && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
