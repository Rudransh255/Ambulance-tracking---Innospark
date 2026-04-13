import { useState, useEffect } from 'react';
import { Phone, MapPin, Building2, Droplets, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { ambulanceAPI, hospitalAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import AmbulanceMap from '../../components/map/AmbulanceMap';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosStatus, setSosStatus] = useState('');

  useEffect(() => {
    loadData();
    const socket = getSocket();
    if (socket) {
      socket.on('ambulance:position', handleAmbulanceUpdate);
      socket.on('sos:dispatched', handleSosDispatched);
      return () => {
        socket.off('ambulance:position', handleAmbulanceUpdate);
        socket.off('sos:dispatched', handleSosDispatched);
      };
    }
  }, []);

  const loadData = async () => {
    try {
      const [hospitalData, ambulanceData] = await Promise.all([
        hospitalAPI.getAll(),
        ambulanceAPI.getAll(),
      ]);
      setHospitals(hospitalData);
      setAmbulances(ambulanceData);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  const handleAmbulanceUpdate = (data) => {
    setAmbulances((prev) => {
      const idx = prev.findIndex((a) => a.id === data.ambulanceId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], current_lat: data.lat, current_lng: data.lng, status: data.status };
        return updated;
      }
      return prev;
    });
  };

  const handleSosDispatched = (data) => {
    setActiveEmergency(data);
    toast.success(`Ambulance dispatched! ETA: ${data.eta_minutes} minutes`);
  };

  const handleSOS = async () => {
    setSosLoading(true);
    setSosStatus('Sending SOS request...');
    try {
      const lat = 28.6139 + (Math.random() - 0.5) * 0.05;
      const lng = 77.2090 + (Math.random() - 0.5) * 0.05;

      const result = await ambulanceAPI.sos({ lat, lng, medical_history: 'Emergency SOS' });
      setActiveEmergency(result);
      setShowSosModal(false);
      setSosStatus(`Ambulance ${result.ambulance.vehicle_number} dispatched! ETA: ${result.eta_minutes} min`);
      setTimeout(() => setSosStatus(''), 8000);
    } catch (err) {
      const msg = err.message === 'Failed to fetch'
        ? 'Cannot connect to server. Please try again.'
        : (err.message || 'SOS request failed');
      setSosStatus('ERROR: ' + msg);
      setShowSosModal(false);
      setTimeout(() => setSosStatus(''), 6000);
    } finally {
      setSosLoading(false);
    }
  };

  const nearbyHospitals = hospitals.slice(0, 5);
  const activeAmbulances = ambulances.filter((a) => a.status !== 'idle');

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary dark:text-slate-100">Welcome, {user?.full_name}</h1>
        <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">Emergency services at your fingertips</p>
      </div>

      {/* SOS Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowSosModal(true)}
          className="relative w-40 h-40 rounded-full bg-emergency text-white flex flex-col items-center justify-center
            shadow-[0_0_0_8px_rgba(220,38,38,0.2),0_0_0_16px_rgba(220,38,38,0.1)]
            hover:shadow-[0_0_0_12px_rgba(220,38,38,0.3),0_0_0_24px_rgba(220,38,38,0.15)]
            transition-all duration-300 active:scale-95"
        >
          <Phone size={32} className="mb-1" />
          <span className="text-xl font-bold">SOS</span>
          <span className="text-xs opacity-80">Tap for help</span>
        </button>
      </div>

      {/* SOS Status */}
      {sosStatus && (
        <div className={`p-4 rounded-lg text-center font-semibold text-lg ${sosStatus.startsWith('ERROR') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
          {sosStatus}
        </div>
      )}

      {/* Active Emergency Tracking */}
      {activeEmergency && (
        <div className="card border-l-4 border-l-emergency bg-red-50">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <AlertTriangle size={20} className="text-emergency" />
            Active Emergency - Ambulance En Route
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">Ambulance</p>
              <p className="text-sm font-semibold">{activeEmergency.ambulance?.vehicle_number}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">ETA</p>
              <p className="text-sm font-semibold">{activeEmergency.eta_minutes} minutes</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">Status</p>
              <p className="text-sm font-semibold text-emergency">Dispatched</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">Emergency ID</p>
              <p className="text-sm font-semibold">{activeEmergency.emergency?.id?.slice(0, 8)}...</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">Track the ambulance on the live map below.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Nearby Hospitals" value={hospitals.length} color="primary" />
        <StatCard icon={MapPin} label="Active Ambulances" value={activeAmbulances.length} color="emergency" />
        <StatCard icon={Droplets} label="Blood Banks" value={hospitals.length} color="secondary" />
        <StatCard icon={Phone} label="Emergency Line" value="108" color="warning" />
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-clinical-border">
          <h2 className="text-lg font-semibold">Live Ambulance Map</h2>
        </div>
        <AmbulanceMap
          ambulances={ambulances}
          hospitals={hospitals}
          className="h-[400px]"
        />
      </div>

      {/* Nearby Hospitals Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-clinical-border">
          <h2 className="text-lg font-semibold">Nearby Hospitals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-clinical-alt">
              <tr className="text-xs text-text-secondary font-medium">
                <th className="text-left px-4 py-3">Hospital</th>
                <th className="text-center px-4 py-3">Beds</th>
                <th className="text-center px-4 py-3">ICU</th>
                <th className="text-center px-4 py-3">O2 Tanks</th>
                <th className="text-center px-4 py-3">Doctors</th>
              </tr>
            </thead>
            <tbody>
              {nearbyHospitals.map((h) => (
                <tr key={h.id} className="border-t border-clinical-border hover:bg-clinical-alt/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-text-muted">{h.address}</p>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`text-sm font-semibold ${h.resources?.general_beds_available < 10 ? 'text-emergency' : 'text-success'}`}>
                      {h.resources?.general_beds_available || 0}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`text-sm font-semibold ${h.resources?.icu_beds_available < 3 ? 'text-emergency' : 'text-success'}`}>
                      {h.resources?.icu_beds_available || 0}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3 text-sm">{h.resources?.o2_tanks_available || 0}</td>
                  <td className="text-center px-4 py-3 text-sm">{h.doctors_on_duty || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SOS Confirmation Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 text-center border border-transparent dark:border-slate-600 shadow-level-3">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Phone size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary dark:text-slate-100">Request Emergency Ambulance?</h3>
            <p className="text-sm text-text-secondary dark:text-slate-400 mb-6">
              The nearest available ambulance will be dispatched to your location immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSosModal(false)}
                className="flex-1 px-4 py-2 border border-clinical-border dark:border-slate-600 rounded-md text-sm font-medium text-text-primary dark:text-slate-200 hover:bg-clinical-alt dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSOS}
                disabled={sosLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {sosLoading ? 'Dispatching...' : 'Confirm SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
