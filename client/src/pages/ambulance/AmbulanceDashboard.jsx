import { useState, useEffect } from 'react';
import { Ambulance, UserCheck, Navigation, Building2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ambulanceAPI, hospitalAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import AmbulanceMap from '../../components/map/AmbulanceMap';

const STATUS_FLOW = ['idle', 'dispatched', 'at_scene', 'transporting', 'arrived'];

export default function AmbulanceDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupData, setPickupData] = useState({
    patient_name: '',
    patient_age: '',
    condition: '',
    severity: 'moderate',
    destination_hospital_id: '',
  });

  const [sosAlert, setSosAlert] = useState(null);
  const [acknowledgedSos, setAcknowledgedSos] = useState(null);

  useEffect(() => {
    loadData();
    const socket = getSocket();
    if (socket) {
      socket.on('sos:dispatched', (data) => {
        toast('New SOS emergency dispatched!', { icon: '🚨' });
        loadData();
      });

      socket.on('sos:new_emergency', (data) => {
        setSosAlert(data);
        toast(`SOS! Patient ${data.patient_name} needs emergency pickup!`, { icon: '🚨', duration: 10000 });
        loadData();
      });

      socket.on('sos:alert', (data) => {
        setSosAlert(data);
        toast(`SOS Alert! Ambulance ${data.ambulance_vehicle} dispatched for ${data.patient_name}`, { icon: '🚑', duration: 8000 });
        loadData();
      });

      return () => {
        socket.off('sos:dispatched');
        socket.off('sos:new_emergency');
        socket.off('sos:alert');
      };
    }
  }, []);

  const loadData = async () => {
    try {
      const [ambData, hospData] = await Promise.all([
        ambulanceAPI.getMyAmbulance(),
        hospitalAPI.getAll(),
      ]);
      setAmbulance(ambData.ambulance);
      setActiveEmergency(ambData.activeEmergency);
      setHospitals(hospData);
    } catch (err) {
      // May not have an assigned ambulance
      try {
        const hospData = await hospitalAPI.getAll();
        setHospitals(hospData);
      } catch {}
    }
  };

  const updateStatus = async (newStatus) => {
    if (!ambulance) return;
    try {
      const updated = await ambulanceAPI.updateStatus(ambulance.id, newStatus);
      setAmbulance(updated);
      toast.success(`Status updated to: ${newStatus.replace('_', ' ')}`);

      const socket = getSocket();
      if (socket) {
        socket.emit('ambulance:status_change', { ambulanceId: ambulance.id, status: newStatus });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePickup = async () => {
    if (!ambulance || !pickupData.destination_hospital_id) {
      toast.error('Please select a destination hospital');
      return;
    }
    try {
      const result = await ambulanceAPI.patientPickup(ambulance.id, pickupData);
      setAmbulance({ ...ambulance, status: 'transporting' });
      setActiveEmergency(result.emergency);
      setShowPickupModal(false);
      toast.success('Patient picked up. Hospital and traffic police notified!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const currentStatusIndex = ambulance ? STATUS_FLOW.indexOf(ambulance.status) : -1;

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ambulance Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            {ambulance ? `Vehicle: ${ambulance.vehicle_number}` : 'No ambulance assigned'}
          </p>
        </div>
        {ambulance && <StatusBadge status={ambulance.status} />}
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
              <p className="text-sm text-red-600">Immediate response required</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
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
              <p className="text-xs text-gray-500 uppercase font-medium">ETA</p>
              <p className="font-semibold">{sosAlert.eta_minutes || 'N/A'} minutes</p>
            </div>
          </div>
          <button
            onClick={() => { setAcknowledgedSos(sosAlert); setSosAlert(null); }}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Acknowledged SOS - Patient Location */}
      {acknowledgedSos && acknowledgedSos.pickup_lat && acknowledgedSos.pickup_lng && (
        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation size={20} className="text-red-600" />
              <h2 className="font-semibold text-red-700">Navigate to Patient - {acknowledgedSos.patient_name}</h2>
            </div>
            <button
              onClick={() => setAcknowledgedSos(null)}
              className="text-xs px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Condition</p>
              <p className="font-semibold text-red-600">{acknowledgedSos.emergency?.patient_condition || 'Emergency SOS'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Severity</p>
              <p className="font-semibold text-red-600 uppercase">{acknowledgedSos.emergency?.severity || 'Critical'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">ETA</p>
              <p className="font-semibold">{acknowledgedSos.eta_minutes || 'N/A'} min</p>
            </div>
          </div>
          <AmbulanceMap
            ambulances={ambulance ? [ambulance] : []}
            sosLocation={{ lat: acknowledgedSos.pickup_lat, lng: acknowledgedSos.pickup_lng }}
            center={[acknowledgedSos.pickup_lat, acknowledgedSos.pickup_lng]}
            zoom={14}
            className="h-[300px]"
          />
        </div>
      )}

      {/* Status Controls */}
      {ambulance && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">Status Controls</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((status, idx) => (
              <button
                key={status}
                onClick={() => {
                  if (status === 'transporting') {
                    setShowPickupModal(true);
                  } else {
                    updateStatus(status);
                  }
                }}
                disabled={ambulance.status === status}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  ambulance.status === status
                    ? 'bg-primary text-white'
                    : idx <= currentStatusIndex
                    ? 'bg-primary-50 text-primary'
                    : 'bg-clinical-alt text-text-secondary hover:bg-clinical-border'
                }`}
              >
                {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Emergency */}
      {activeEmergency && (
        <div className="card border-l-4 border-l-emergency">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-emergency" />
            <h2 className="font-semibold">Active Emergency</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs">Condition</p>
              <p className="font-medium">{activeEmergency.patient_condition}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Severity</p>
              <p className="font-medium capitalize">{activeEmergency.severity}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Status</p>
              <StatusBadge status={activeEmergency.status} />
            </div>
            <div>
              <p className="text-text-muted text-xs">Hospital Notified</p>
              <p className="font-medium">{activeEmergency.hospital_notified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-clinical-border">
          <h2 className="font-semibold">Navigation Map</h2>
        </div>
        <AmbulanceMap
          ambulances={ambulance ? [ambulance] : []}
          hospitals={hospitals}
          className="h-[400px]"
          showRoute={ambulance?.status === 'transporting' && ambulance?.destination_hospital_id}
          routePoints={
            ambulance?.destination_hospital_id
              ? [
                  { lat: ambulance.current_lat, lng: ambulance.current_lng },
                  (() => {
                    const h = hospitals.find((h) => h.id === ambulance.destination_hospital_id);
                    return h ? { lat: h.lat, lng: h.lng } : { lat: 28.6, lng: 77.2 };
                  })(),
                ]
              : []
          }
        />
      </div>

      {/* Patient Pickup Modal */}
      <Modal isOpen={showPickupModal} onClose={() => setShowPickupModal(false)} title="Patient Pickup">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Patient Name</label>
            <input
              className="input-field"
              value={pickupData.patient_name}
              onChange={(e) => setPickupData({ ...pickupData, patient_name: e.target.value })}
              placeholder="Enter patient name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Age</label>
            <input
              className="input-field"
              type="number"
              value={pickupData.patient_age}
              onChange={(e) => setPickupData({ ...pickupData, patient_age: e.target.value })}
              placeholder="Age"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Condition Notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={pickupData.condition}
              onChange={(e) => setPickupData({ ...pickupData, condition: e.target.value })}
              placeholder="Describe patient condition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Severity</label>
            <select
              className="input-field"
              value={pickupData.severity}
              onChange={(e) => setPickupData({ ...pickupData, severity: e.target.value })}
            >
              <option value="moderate">Moderate</option>
              <option value="serious">Serious</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Destination Hospital</label>
            <select
              className="input-field"
              value={pickupData.destination_hospital_id}
              onChange={(e) => setPickupData({ ...pickupData, destination_hospital_id: e.target.value })}
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} (Beds: {h.resources?.general_beds_available}, ICU: {h.resources?.icu_beds_available})
                </option>
              ))}
            </select>
          </div>
          <button onClick={handlePickup} className="btn-emergency w-full">
            Confirm Patient Pickup
          </button>
          <p className="text-xs text-text-muted text-center">
            This will automatically notify the destination hospital and traffic police.
          </p>
        </div>
      </Modal>
    </div>
  );
}
