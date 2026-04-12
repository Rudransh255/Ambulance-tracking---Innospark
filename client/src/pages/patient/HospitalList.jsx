import { useState, useEffect } from 'react';
import { Building2, Bed, Wind, Droplets, Stethoscope, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalAPI } from '../../services/api';
import AmbulanceMap from '../../components/map/AmbulanceMap';

export default function HospitalList() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      const data = await hospitalAPI.getAll();
      setHospitals(data);
    } catch (err) {
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-text-muted">Loading hospitals...</div>;

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Nearby Hospitals</h1>
        <p className="text-sm text-text-secondary mt-1">Real-time hospital resource availability</p>
      </div>

      <AmbulanceMap hospitals={hospitals} className="h-[300px]" />

      <div className="grid gap-4 md:grid-cols-2">
        {hospitals.map((h) => (
          <div key={h.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-text-primary">{h.name}</h3>
                <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {h.address}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResourceItem icon={Bed} label="General Beds" value={h.resources?.general_beds_available} />
              <ResourceItem icon={Bed} label="ICU Beds" value={h.resources?.icu_beds_available} />
              <ResourceItem icon={Wind} label="Ventilators" value={h.resources?.ventilators_available} />
              <ResourceItem icon={Droplets} label="O2 Tanks" value={h.resources?.o2_tanks_available} />
            </div>

            <div className="mt-3 pt-3 border-t border-clinical-border flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Stethoscope size={12} />
                {h.doctors_on_duty} / {h.total_doctors} doctors on duty
              </span>
              <span>{h.phone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceItem({ icon: Icon, label, value }) {
  const color = value >= 10 ? 'text-success' : value >= 3 ? 'text-warning' : 'text-emergency';
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-text-muted" />
      <div>
        <p className={`text-sm font-semibold ${color}`}>{value ?? 0}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}
