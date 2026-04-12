import { useState, useEffect } from 'react';
import { AlertTriangle, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';
import { bloodAPI, donorAPI } from '../../services/api';
import BloodGroupBadge from '../../components/common/BloodGroupBadge';

export default function UrgentRequests() {
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [responded, setResponded] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reqData, profileData] = await Promise.all([
        bloodAPI.getRequests(),
        donorAPI.getProfile(),
      ]);
      setRequests(reqData.filter((r) => r.status === 'open' || r.status === 'partially_fulfilled'));
      setProfile(profileData);
    } catch {}
  };

  const handleRespond = async (id) => {
    try {
      await bloodAPI.respondToRequest(id);
      setResponded((prev) => new Set([...prev, id]));
      toast.success('Hospital notified of your availability!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const urgencyOrder = { critical: 0, high: 1, normal: 2 };
  const sorted = [...requests].sort((a, b) => (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2));

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Urgent Blood Requests</h1>
        <p className="text-sm text-text-secondary mt-1">
          Active requests from hospitals in your area
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="card text-center py-12">
          <Droplets size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Urgent Requests</h3>
          <p className="text-sm text-text-muted mt-1">All blood needs are currently met. Thank you!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((req) => {
            const isMatch = req.blood_group === profile?.blood_group;
            const hasResponded = responded.has(req.id);
            const urgencyBg = req.urgency === 'critical' ? 'border-l-emergency' : req.urgency === 'high' ? 'border-l-warning' : 'border-l-primary';

            return (
              <div key={req.id} className={`card border-l-4 ${urgencyBg}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BloodGroupBadge group={req.blood_group} size="lg" />
                      <span className={`badge ${req.urgency === 'critical' ? 'bg-red-100 text-emergency' : req.urgency === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-primary'}`}>
                        {req.urgency}
                      </span>
                      {isMatch && <span className="badge bg-green-100 text-success">Your blood group</span>}
                    </div>
                    <h3 className="font-semibold">{req.hospital_name}</h3>
                    <p className="text-sm text-text-muted">{req.hospital_address}</p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">{req.units_needed} units</span> needed
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Posted {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {hasResponded ? (
                      <span className="badge bg-emerald-100 text-success text-sm">Responded</span>
                    ) : (
                      <button onClick={() => handleRespond(req.id)} className="btn-emergency">
                        I Can Donate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
