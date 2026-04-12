import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendValue, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary',
    secondary: 'bg-secondary-50 text-secondary',
    emergency: 'bg-red-50 text-emergency',
    warning: 'bg-amber-50 text-warning',
    success: 'bg-emerald-50 text-success',
  };

  return (
    <div className="card">
      <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-[32px] font-bold text-text-primary leading-tight">{value}</p>
      <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-success' : 'text-emergency'}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendValue}
        </div>
      )}
    </div>
  );
}
