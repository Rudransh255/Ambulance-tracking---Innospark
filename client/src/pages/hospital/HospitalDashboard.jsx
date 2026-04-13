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
  const [sosAlert, setSosAlert] = useState(null);
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

    const handleSosAlert = (data) => {
      setSosAlert(data);
      toast(`SOS Emergency! Patient ${data.patient_name} - Ambulance ${data.ambulance_vehicle} dispatched`, { icon: '🚨', duration: 10000 });
    };

    socket.on('alert:hospital_incoming', handleIncomingAlert);
    socket.on('resource:updated', handleResourceUpdate);
    socket.on('sos:hospital_alert', handleSosAlert);

    return () => {
      socket.off('alert:hospital_incoming', handleIncomingAlert);
      socket.off('resource:updated', handleResourceUpdate);
      socket.off('sos:hospital_alert', handleSosAlert);
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

      {/* SOS Alert Banner */}
      {sosAlert && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-700">INCOMING SOS EMERGENCY</h3>
              <p className="text-sm text-red-600">Prepare for incoming patient</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Patient</p>
              <p className="font-semibold">{sosAlert.patient_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Condition</p>
              <p className="font-semibold text-red-600">{sosAlert.emergency?.patient_condition || 'Emergency SOS'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Severity</p>
              <p className="font-semibold text-red-600 uppercase">{sosAlert.emergency?.severity || 'Critical'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Ambulance ETA</p>
              <p className="font-semibold">{sosAlert.eta_minutes} minutes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { toast.success('ER preparation initiated'); setSosAlert(null); }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700"
            >
              Prepare ER
            </button>
            <button
              onClick={() => setSosAlert(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
