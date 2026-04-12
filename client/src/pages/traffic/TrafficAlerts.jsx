import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { trafficAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import AlertCard from '../../components/common/AlertCard';

export default function TrafficAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
    const socket = getSocket();
    if (socket) {
      socket.on('alert:traffic_clear_route', (data) => {
        const alert = {
          id: Date.now().toString(),
          ambulance_id: data.ambulanceId,
          vehicle_number: data.vehicleNumber,
          destination_hospital: data.destination,
          eta_minutes: data.eta_minutes,
          severity: 'critical',
          patient_condition: 'Emergency patient in transit - Clear route immediately',
          acknowledged: false,
        };
        setAlerts((prev) => [alert, ...prev]);
        toast('New route clearing alert!', { icon: '🚨' });
      });
    }
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await trafficAPI.getAlerts();
      setAlerts(data);
    } catch (err) {
      toast.error('Failed to load alerts');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await trafficAPI.acknowledgeAlert(id);
    } catch {}
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    toast.success('Route acknowledged');
  };

  const filtered = filter === 'all' ? alerts
    : filter === 'pending' ? alerts.filter((a) => !a.acknowledged)
    : alerts.filter((a) => a.acknowledged);

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Route Alerts</h1>
        <p className="text-sm text-text-secondary mt-1">Ambulance route clearing notifications</p>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'acknowledged'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-clinical-alt text-text-secondary hover:bg-clinical-border'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold">All Clear</h3>
          <p className="text-sm text-text-muted mt-1">No {filter !== 'all' ? filter : ''} alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} actionLabel="Acknowledge" onAction={handleAcknowledge} />
          ))}
        </div>
      )}
    </div>
  );
}
