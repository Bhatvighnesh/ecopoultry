import { AlertOctagon } from 'lucide-react';

export default function AlertBanner({ alerts }) {
  const latestCritical = alerts.find((a) => a.severity === 'critical' && !a.acknowledged);
  if (!latestCritical) return null;

  return (
    <div className="alert-banner">
      <AlertOctagon size={20} />
      <div>
        <strong>Critical:</strong> {latestCritical.message}
      </div>
    </div>
  );
}
