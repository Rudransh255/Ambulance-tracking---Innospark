import { useEffect, useState } from 'react';
import { Bed, Droplets, Ambulance, AlertTriangle, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { ambulanceAPI, hospitalAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import StatCard from '../../components/common/StatCard';
import AlertCard from '../../components/common/AlertCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useManagedHospital from '../../hooks/useManagedHospital';

export default function HospitalDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const { hospital, hospitalId, isLoading, refreshHospital } = useManagedHospital();

  useEffect(() => {
    if (hospitalId) {
      loadData(hospitalId);
    }
  }, [hospitalId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleIncomingAlert = (alert) => {
      if (alert.hospital_id === hospitalId) {
        setAlerts((prev) => [alert, ...prev]);
        toast('Incoming ambulance alert!', { duration: 6000 });
      }
    };

    const handleResourceUpdate = ({ hospitalId: updatedHospitalId }) => {
      if (updatedHospitalId === hospitalId) {
        refreshHospital(false);
      }
    };

    socket.on('alert:hospital_incoming', handleIncomingAlert);
    socket.on('resource:updated', handleResourceUpdate);

    return () => {
      socket.off('alert:hospital_incoming', handleIncomingAlert);
      socket.off('resource:updated', handleResourceUpdate);
    };
  }, [hospitalId, refreshHospital]);

  const loadData = async (managedHospitalId) => {
    try {
      const [alertData, ambulanceData] = await Promise.all([
        hospitalAPI.getAlerts(managedHospitalId),
        ambulanceAPI.getAll(),
      ]);

      setAlerts(alertData);
      setAmbulances(
        ambulanceData.filter((ambulance) => (
          ['transporting', 'dispatched'].includes(ambulance.status)
          && ambulance.destination_hospital_id === managedHospitalId
        ))
      );
    } catch (err) {
      toast.error('Failed to load dashboard data');
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await hospitalAPI.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((alert) => (
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )));
      toast.success('ER preparation initiated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resources = hospital?.resources;

  if (isLoading) {
    return <LoadingSpinner className="h-64" />;
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{hospital?.name || 'Hospital Dashboard'}</h1>
        <p className="text-sm text-text-secondary mt-1">Resource management and incoming alerts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bed} label="Beds Available" value={resources?.general_beds_available || 0} color="primary" />
        <StatCard icon={Bed} label="ICU Available" value={resources?.icu_beds_available || 0} color="warning" />
        <StatCard icon={Droplets} label="O2 Tanks" value={resources?.o2_tanks_available || 0} color="success" />
        <StatCard icon={Ambulance} label="Incoming Ambulances" value={ambulances.length} color="emergency" />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-warning" />
          Incoming Alerts
        </h2>
        {alerts.length === 0 && ambulances.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No incoming alerts at this time</p>
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
            {ambulances
              .filter((ambulance) => !alerts.some((alert) => alert.ambulance_id === ambulance.id))
              .map((ambulance) => (
                <AlertCard
                  key={ambulance.id}
                  alert={{
                    id: ambulance.id,
                    ambulance_id: ambulance.id,
                    vehicle_number: ambulance.vehicle_number,
                    severity: 'moderate',
                    patient_condition: 'Patient in transit',
                    eta_minutes: Math.floor(Math.random() * 15) + 3,
                    destination_hospital: ambulance.destination_hospital_name,
                  }}
                />
              ))}
          </div>
        )}
      </div>

      {hospital?.doctors && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Stethoscope size={20} className="text-secondary" />
            On-Duty Doctors
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {hospital.doctors
              .filter((doctor) => doctor.on_duty)
              .map((doctor) => (
                <div key={doctor.id} className="flex items-center gap-3 p-3 rounded-lg bg-clinical-alt">
                  <div className="w-8 h-8 rounded-full bg-secondary-50 flex items-center justify-center">
                    <Stethoscope size={14} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doctor.name}</p>
                    <p className="text-xs text-text-muted">{doctor.specialization}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
