import { Clock } from 'lucide-react';

export default function StaleBadge({ status }) {
  if (!status || !status.stale) return null;
  return (
    <span
      className="badge badge-stale"
      title={status.lastSeenAt ? `Last seen ${new Date(status.lastSeenAt).toLocaleTimeString()}` : 'No data yet'}
    >
      <Clock size={12} />
      Data may be outdated
    </span>
  );
}
