import { Clock, Ambulance } from 'lucide-react';

const severityColors = {
  critical: 'border-l-emergency bg-red-50/50 dark:bg-red-900/20',
  serious: 'border-l-warning bg-amber-50/50 dark:bg-amber-900/20',
  moderate: 'border-l-primary bg-blue-50/50 dark:bg-blue-900/20',
};

const severityBadges = {
  critical: 'bg-red-100 dark:bg-red-900/40 text-emergency',
  serious: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  moderate: 'bg-blue-100 dark:bg-blue-900/40 text-primary dark:text-primary-300',
};

export default function AlertCard({ alert, onAction, actionLabel = 'Acknowledge' }) {
  const severity = alert.severity || 'moderate';

  return (
    <div className={`border-l-4 ${severityColors[severity]} rounded-lg p-4 shadow-level-1`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Ambulance size={16} className="text-text-secondary dark:text-slate-400" />
            <span className="text-sm font-semibold text-text-primary dark:text-slate-100">
              {alert.vehicle_number || `Ambulance ${alert.ambulance_id}`}
            </span>
            <span className={`badge ${severityBadges[severity]}`}>{severity}</span>
          </div>
          <p className="text-sm text-text-secondary dark:text-slate-400">{alert.patient_condition}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} /> ETA: {alert.eta_minutes} min
            </span>
            {alert.destination_hospital && (
              <span>To: {alert.destination_hospital}</span>
            )}
          </div>
        </div>
        {onAction && !alert.acknowledged && (
          <button onClick={() => onAction(alert.id)} className="btn-primary text-xs whitespace-nowrap">
            {actionLabel}
          </button>
        )}
        {alert.acknowledged && (
          <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-success">Acknowledged</span>
        )}
      </div>
    </div>
  );
}
