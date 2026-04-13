import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendValue, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-300',
    secondary: 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary dark:text-secondary-300',
    emergency: 'bg-red-50 dark:bg-red-900/30 text-emergency',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-warning',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-success',
  };

  return (
    <div className="card">
      <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-[32px] font-bold text-text-primary dark:text-slate-100 leading-tight">{value}</p>
      <p className="text-xs font-medium text-text-secondary dark:text-slate-400 mt-1">{label}</p>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-success' : 'text-emergency'}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendValue}
        </div>
      )}
    </div>
  );
}
