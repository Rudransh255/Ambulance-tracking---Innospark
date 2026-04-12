import { useState, useEffect } from 'react';
import { Heart, Droplets, Clock, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { donorAPI, bloodAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import useAuthStore from '../../stores/authStore';
import StatCard from '../../components/common/StatCard';
import BloodGroupBadge from '../../components/common/BloodGroupBadge';

export default function DonorDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [urgentRequests, setUrgentRequests] = useState([]);

  useEffect(() => {
    loadData();
    const socket = getSocket();
    if (socket) {
      socket.on('alert:blood_urgent', (data) => {
        toast(`Urgent ${data.bloodGroup} blood needed at ${data.hospitalName}!`, { duration: 8000 });
        loadData();
      });
    }
  }, []);

  const loadData = async () => {
    try {
      const [profileData, requests] = await Promise.all([
        donorAPI.getProfile(),
        bloodAPI.getRequests(),
      ]);
      setProfile(profileData);
      setUrgentRequests(requests.filter((r) => r.status === 'open'));
    } catch (err) {
      // May not have a donor profile yet
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    try {
      const updated = await donorAPI.updateAvailability(!profile.is_available);
      setProfile({ ...profile, is_available: updated.is_available });
      toast.success(updated.is_available ? 'You are now available for donations' : 'Availability turned off');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const daysUntilEligible = profile?.last_donation_date
    ? Math.max(0, 56 - Math.floor((Date.now() - new Date(profile.last_donation_date).getTime()) / 86400000))
    : 0;

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
        <p className="text-sm text-text-secondary mt-1">Blood Donor Portal</p>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary-50 flex items-center justify-center">
                <Heart size={24} className="text-secondary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{profile.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <BloodGroupBadge group={profile.blood_group} size="lg" />
                  <span className={`badge ${profile.is_eligible ? 'bg-emerald-100 text-success' : 'bg-amber-100 text-amber-700'}`}>
                    {profile.is_eligible ? 'Eligible' : `${daysUntilEligible} days until eligible`}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={toggleAvailability} className="flex items-center gap-2">
              {profile.is_available ? (
                <>
                  <ToggleRight size={32} className="text-success" />
                  <span className="text-sm font-medium text-success">Available</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={32} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-muted">Unavailable</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Blood Group" value={profile?.blood_group || '-'} color="emergency" />
        <StatCard icon={Heart} label="Donations Made" value={3} color="secondary" />
        <StatCard icon={Clock} label="Days Until Eligible" value={daysUntilEligible} color="warning" />
        <StatCard icon={Calendar} label="Last Donation" value={profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'N/A'} color="primary" />
      </div>

      {/* Urgent Requests */}
      {urgentRequests.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Droplets size={20} className="text-emergency" />
            Urgent Blood Requests
          </h2>
          <div className="space-y-3">
            {urgentRequests.map((req) => (
              <UrgentRequestCard key={req.id} request={req} donorBloodGroup={profile?.blood_group} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UrgentRequestCard({ request, donorBloodGroup }) {
  const [responded, setResponded] = useState(false);
  const urgencyColors = {
    critical: 'border-l-emergency',
    high: 'border-l-warning',
    normal: 'border-l-primary',
  };

  const handleRespond = async () => {
    try {
      await bloodAPI.respondToRequest(request.id);
      setResponded(true);
      toast.success('Thank you! The hospital has been notified.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isMatch = request.blood_group === donorBloodGroup;

  return (
    <div className={`border-l-4 ${urgencyColors[request.urgency]} rounded-lg p-4 bg-clinical-alt/50`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BloodGroupBadge group={request.blood_group} />
            <span className={`badge ${request.urgency === 'critical' ? 'bg-red-100 text-emergency' : 'bg-amber-100 text-amber-700'}`}>
              {request.urgency}
            </span>
            {isMatch && <span className="badge bg-green-100 text-success">Match</span>}
          </div>
          <p className="text-sm font-medium">{request.hospital_name}</p>
          <p className="text-xs text-text-muted mt-1">
            {request.units_needed} units needed | {request.hospital_address}
          </p>
        </div>
        {responded ? (
          <span className="badge bg-emerald-100 text-success">Responded</span>
        ) : (
          <button onClick={handleRespond} className="btn-emergency text-xs">
            I Can Donate
          </button>
        )}
      </div>
    </div>
  );
}
