import { useState, useEffect } from 'react';
import { MapPin, Ambulance, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { trafficAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import AmbulanceMap from '../../components/map/AmbulanceMap';
import StatCard from '../../components/common/StatCard';
import AlertCard from '../../components/common/AlertCard';

export default function TrafficDashboard() {
  const [activeAmbulances, setActiveAmbulances] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
    const socket = getSocket();
    if (socket) {
      socket.on('ambulance:position', handlePositionUpdate);
      socket.on('alert:traffic_clear_route', handleNewAlert);
      return () => {
        socket.off('ambulance:position', handlePositionUpdate);
        socket.off('alert:traffic_clear_route', handleNewAlert);
      };
    }
  }, []);

  const loadData = async () => {
    try {
      const [ambData, alertData] = await Promise.all([
        trafficAPI.getActiveAmbulances(),
        trafficAPI.getAlerts(),
      ]);
      setActiveAmbulances(ambData);
      setAlerts(alertData);
    } catch (err) {
      toast.error('Failed to load traffic data');
    }
  };

  const handlePositionUpdate = (data) => {
    setActiveAmbulances((prev) => {
      const idx = prev.findIndex((a) => a.id === data.ambulanceId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], current_lat: data.lat, current_lng: data.lng, status: data.status };
        return updated;
      }
      if (data.status === 'transporting' || data.status === 'dispatched') {
        return [...prev, { id: data.ambulanceId, ...data, current_lat: data.lat, current_lng: data.lng }];
      }
      return prev;
    });
  };

  const handleNewAlert = (data) => {
    toast('Route clearing alert received!', { icon: '🚨', duration: 6000 });
    const alert = {
      id: Date.now().toString(),
      ambulance_id: data.ambulanceId,
      vehicle_number: data.vehicleNumber,
      destination_hospital: data.destination,
      eta_minutes: data.eta_minutes,
      severity: 'critical',
      patient_condition: 'Emergency patient in transit',
      acknowledged: false,
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const handleAcknowledge = async (id) => {
    try {
      await trafficAPI.acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
      toast.success('Alert acknowledged - corridor clearing initiated');
    } catch {
      // For dynamically created alerts, just update locally
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    }
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Traffic Control - Live Map</h1>
        <p className="text-sm text-text-secondary mt-1">Real-time ambulance tracking and route management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Ambulance} label="Active Ambulances" value={activeAmbulances.length} color="emergency" />
        <StatCard icon={AlertTriangle} label="Pending Alerts" value={alerts.filter((a) => !a.acknowledged).length} color="warning" />
        <StatCard icon={MapPin} label="Routes Monitored" value={activeAmbulances.length} color="primary" />
      </div>

      {/* Full-screen Map */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-clinical-border">
          <h2 className="font-semibold">City-Wide Ambulance Tracker</h2>
        </div>
        <AmbulanceMap
          ambulances={activeAmbulances}
          className="h-[500px]"
        />
      </div>

      {/* Alert Feed */}
      {alerts.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Route Clearing Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                actionLabel="Acknowledge"
                onAction={handleAcknowledge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
