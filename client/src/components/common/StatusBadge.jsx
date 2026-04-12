import { Circle } from 'lucide-react';

const statusStyles = {
  idle: { bg: 'bg-gray-100 text-gray-600', dot: 'text-gray-400' },
  dispatched: { bg: 'bg-blue-100 text-blue-700', dot: 'text-blue-500' },
  at_scene: { bg: 'bg-amber-100 text-amber-700', dot: 'text-amber-500' },
  transporting: { bg: 'bg-red-100 text-red-700', dot: 'text-red-500' },
  arrived: { bg: 'bg-emerald-100 text-emerald-700', dot: 'text-emerald-500' },
  // Blood request statuses
  open: { bg: 'bg-blue-100 text-blue-700', dot: 'text-blue-500' },
  partially_fulfilled: { bg: 'bg-amber-100 text-amber-700', dot: 'text-amber-500' },
  fulfilled: { bg: 'bg-emerald-100 text-emerald-700', dot: 'text-emerald-500' },
  expired: { bg: 'bg-gray-100 text-gray-600', dot: 'text-gray-400' },
  // Emergency statuses
  requested: { bg: 'bg-amber-100 text-amber-700', dot: 'text-amber-500' },
  picked_up: { bg: 'bg-blue-100 text-blue-700', dot: 'text-blue-500' },
  in_transit: { bg: 'bg-red-100 text-red-700', dot: 'text-red-500' },
  delivered: { bg: 'bg-emerald-100 text-emerald-700', dot: 'text-emerald-500' },
};

const statusLabels = {
  idle: 'Idle',
  dispatched: 'Dispatched',
  at_scene: 'At Scene',
  transporting: 'Transporting',
  arrived: 'Arrived',
  open: 'Open',
  partially_fulfilled: 'Partial',
  fulfilled: 'Fulfilled',
  expired: 'Expired',
  requested: 'Requested',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.idle;
  return (
    <span className={`badge ${style.bg} gap-1.5`}>
      <Circle size={8} className={`${style.dot} fill-current`} />
      {statusLabels[status] || status}
    </span>
  );
}
