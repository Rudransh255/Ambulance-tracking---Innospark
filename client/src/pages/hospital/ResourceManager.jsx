import { useEffect, useState } from 'react';
import { Bed, Wind, Droplets, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useManagedHospital from '../../hooks/useManagedHospital';

const fieldStyles = {
  primary: { wrapper: 'bg-primary-50', icon: 'text-primary' },
  warning: { wrapper: 'bg-amber-50', icon: 'text-warning' },
  secondary: { wrapper: 'bg-secondary-50', icon: 'text-secondary' },
  success: { wrapper: 'bg-emerald-50', icon: 'text-success' },
};

export default function ResourceManager() {
  const [resources, setResources] = useState(null);
  const [saving, setSaving] = useState(false);
  const { hospital, hospitalId, isLoading, refreshHospital } = useManagedHospital();

  useEffect(() => {
    if (hospital?.resources) {
      setResources(hospital.resources);
    }
  }, [hospital]);

  const handleSave = async () => {
    if (!hospitalId || !resources) return;

    setSaving(true);
    try {
      const updated = await hospitalAPI.updateResources(hospitalId, resources);
      setResources(updated);
      await refreshHospital(false);
      toast.success('Resources updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !resources) {
    return <LoadingSpinner className="h-64" />;
  }

  const fields = [
    { key: 'general_beds_available', label: 'General Beds', icon: Bed, color: 'primary' },
    { key: 'icu_beds_available', label: 'ICU Beds', icon: Bed, color: 'warning' },
    { key: 'ventilators_available', label: 'Ventilators', icon: Wind, color: 'secondary' },
    { key: 'o2_tanks_available', label: 'O2 Tanks', icon: Droplets, color: 'success' },
  ];

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resource Manager</h1>
          <p className="text-sm text-text-secondary mt-1">
            Update resource availability for {hospital?.name || 'your hospital'}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, icon: Icon, color }) => {
          const styles = fieldStyles[color];
          return (
            <div key={key} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg ${styles.wrapper} flex items-center justify-center`}>
                  <Icon size={20} className={styles.icon} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-text-muted">Currently available</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setResources({ ...resources, [key]: Math.max(0, resources[key] - 1) })}
                  className="w-10 h-10 rounded-md bg-clinical-alt hover:bg-clinical-border flex items-center justify-center text-lg font-bold transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={resources[key]}
                  onChange={(e) => setResources({ ...resources, [key]: parseInt(e.target.value, 10) || 0 })}
                  className="input-field text-center text-2xl font-bold flex-1"
                />
                <button
                  onClick={() => setResources({ ...resources, [key]: resources[key] + 1 })}
                  className="w-10 h-10 rounded-md bg-clinical-alt hover:bg-clinical-border flex items-center justify-center text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-text-muted text-center">
        Last updated: {new Date(resources.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
