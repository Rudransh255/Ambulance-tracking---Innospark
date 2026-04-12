import { useEffect, useState } from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import AlertCard from '../../components/common/AlertCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useManagedHospital from '../../hooks/useManagedHospital';

export default function IncomingAlerts() {
  const [alerts, setAlerts] = useState([]);
  const { hospitalId, isLoading } = useManagedHospital();

  useEffect(() => {
    if (hospitalId) {
      loadAlerts(hospitalId);
    }
  }, [hospitalId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleIncomingAlert = (alert) => {
      if (alert.hospital_id === hospitalId) {
        setAlerts((prev) => [alert, ...prev]);
        toast('New incoming ambulance alert');
      }
    };

    socket.on('alert:hospital_incoming', handleIncomingAlert);
    return () => socket.off('alert:hospital_incoming', handleIncomingAlert);
  }, [hospitalId]);

  const loadAlerts = async (managedHospitalId) => {
    try {
      const data = await hospitalAPI.getAlerts(managedHospitalId);
      setAlerts(data);
    } catch (err) {
      toast.error('Failed to load incoming alerts');
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await hospitalAPI.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((alert) => (
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )));
      toast.success('Alert acknowledged - ER team notified');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" />;
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell size={24} className="text-warning" />
          Incoming Alerts
        </h1>
        <p className="text-sm text-text-secondary mt-1">Real-time notifications from incoming ambulances</p>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="badge bg-red-100 text-emergency">
          {alerts.filter((alert) => !alert.acknowledged).length} Pending
        </span>
        <span className="badge bg-emerald-100 text-success">
          {alerts.filter((alert) => alert.acknowledged).length} Acknowledged
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-secondary">No Incoming Alerts</h3>
          <p className="text-sm text-text-muted mt-1">
            Alerts will appear here when ambulances are en route to your hospital.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              actionLabel="Prepare ER"
              onAction={handleAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
