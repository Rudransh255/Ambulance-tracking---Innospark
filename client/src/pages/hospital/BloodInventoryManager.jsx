import { useState, useEffect } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { bloodAPI } from '../../services/api';
import BloodGroupBadge from '../../components/common/BloodGroupBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import useManagedHospital from '../../hooks/useManagedHospital';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodInventoryManager() {
  const [availability, setAvailability] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({ blood_group: 'O+', units_needed: 1, urgency: 'high' });
  const { hospital, hospitalId, isLoading } = useManagedHospital();

  useEffect(() => {
    if (hospitalId) {
      loadInventory();
    }
  }, [hospitalId]);

  const loadInventory = async () => {
    try {
      const data = await bloodAPI.getAvailability();
      setAvailability(data);
    } catch (err) {
      toast.error('Failed to load blood inventory');
    }
  };

  const handleUpdateInventory = async (bloodGroup, units) => {
    if (!hospitalId) return;

    try {
      await bloodAPI.updateInventory(hospitalId, { blood_group: bloodGroup, units_available: units });
      toast.success(`${bloodGroup} inventory updated`);
      loadInventory();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePostRequest = async () => {
    if (!hospitalId) return;

    try {
      await bloodAPI.postRequest({ hospital_id: hospitalId, ...requestData });
      toast.success('Urgent blood request posted! Donors will be notified.');
      setShowRequestModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const myInventory = availability?.per_hospital?.find((item) => item.hospital_id === hospitalId);

  if (isLoading) {
    return <LoadingSpinner className="h-64" />;
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blood Inventory</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage stock and urgent requests for {hospital?.name || 'your hospital'}
          </p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="btn-emergency flex items-center gap-2">
          <AlertTriangle size={16} />
          Post Urgent Request
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BLOOD_GROUPS.map((bg) => {
          const units = myInventory?.[bg] ?? 0;
          const statusColor = units >= 10 ? 'border-success' : units >= 3 ? 'border-warning' : 'border-emergency';
          return (
            <div key={bg} className={`card border-t-4 ${statusColor}`}>
              <div className="flex items-center justify-between mb-3">
                <BloodGroupBadge group={bg} size="lg" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateInventory(bg, Math.max(0, units - 1))}
                  className="w-8 h-8 rounded bg-clinical-alt hover:bg-clinical-border flex items-center justify-center text-sm font-bold"
                >
                  -
                </button>
                <p className="text-2xl font-bold text-center flex-1">{units}</p>
                <button
                  onClick={() => handleUpdateInventory(bg, units + 1)}
                  className="w-8 h-8 rounded bg-clinical-alt hover:bg-clinical-border flex items-center justify-center text-sm font-bold"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-text-muted text-center mt-1">units available</p>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Post Urgent Blood Request">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Blood Group Needed</label>
            <select
              className="input-field"
              value={requestData.blood_group}
              onChange={(e) => setRequestData({ ...requestData, blood_group: e.target.value })}
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Units Needed</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={requestData.units_needed}
              onChange={(e) => setRequestData({ ...requestData, units_needed: parseInt(e.target.value, 10) || 1 })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Urgency</label>
            <select
              className="input-field"
              value={requestData.urgency}
              onChange={(e) => setRequestData({ ...requestData, urgency: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button onClick={handlePostRequest} className="btn-emergency w-full flex items-center justify-center gap-2">
            <Send size={16} />
            Broadcast to Donors
          </button>
        </div>
      </Modal>
    </div>
  );
}
