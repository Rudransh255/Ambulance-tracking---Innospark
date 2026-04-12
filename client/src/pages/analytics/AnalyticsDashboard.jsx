import { useState, useEffect } from 'react';
import {
  BarChart3,
  Ambulance,
  Heart,
  Building2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import AmbulanceMap from '../../components/map/AmbulanceMap';

const COLORS = ['#1044A0', '#7C3AED', '#DC2626', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#EC4899'];

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [responseTimes, setResponseTimes] = useState(null);
  const [bloodTrends, setBloodTrends] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [statsData, rtData, btData, hmData] = await Promise.all([
        analyticsAPI.getStats(),
        analyticsAPI.getResponseTimes(),
        analyticsAPI.getBloodTrends(),
        analyticsAPI.getHeatmap(),
      ]);
      setStats(statsData);
      setResponseTimes(rtData);
      setBloodTrends(btData);
      setHeatmapPoints(hmData);
    } catch (err) {
      toast.error('Failed to load analytics');
    }
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" />
          Analytics Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">System-wide metrics and trends</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Emergencies This Month"
          value={stats?.total_emergencies_this_month || 0}
          color="emergency"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          icon={Ambulance}
          label="Active Ambulances"
          value={`${stats?.active_ambulances || 0} / ${stats?.total_ambulances || 0}`}
          color="primary"
        />
        <StatCard
          icon={Heart}
          label="Registered Donors"
          value={stats?.registered_donors || 0}
          color="secondary"
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          icon={Building2}
          label="Hospitals Online"
          value={stats?.hospitals_online || 0}
          color="success"
        />
      </div>

      {/* Response Time Chart */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Average Response Times (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={responseTimes?.data?.slice(-15) || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {responseTimes?.zones?.map((zone, i) => (
              <Line
                key={zone}
                type="monotone"
                dataKey={zone}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Blood Usage Trends */}
      <div className="card">
        <h2 className="font-semibold mb-4">Blood Usage Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={bloodTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {['O+', 'A+', 'B+', 'AB+'].map((bg, i) => (
              <Area
                key={bg}
                type="monotone"
                dataKey={bg}
                stackId="1"
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Emergency Heatmap (using map with markers) */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-clinical-border">
          <h2 className="font-semibold">Emergency Incident Density</h2>
          <p className="text-xs text-text-muted mt-1">Higher density areas shown with markers</p>
        </div>
        <AmbulanceMap
          className="h-[400px]"
          ambulances={heatmapPoints.map((p, i) => ({
            id: `hp-${i}`,
            current_lat: p.lat,
            current_lng: p.lng,
            status: p.intensity > 0.7 ? 'transporting' : p.intensity > 0.4 ? 'dispatched' : 'idle',
            vehicle_number: `Zone ${i + 1}`,
          }))}
        />
      </div>
    </div>
  );
}
