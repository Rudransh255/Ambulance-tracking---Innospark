import { useState, useEffect } from 'react';
import { Heart, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { donorAPI } from '../../services/api';

export default function DonationHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await donorAPI.getHistory();
      setHistory(data);
    } catch (err) {
      toast.error('Failed to load donation history');
    }
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Donation History</h1>
        <p className="text-sm text-text-secondary mt-1">Your past blood donations</p>
      </div>

      {history.length === 0 ? (
        <div className="card text-center py-12">
          <Heart size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Donations Yet</h3>
          <p className="text-sm text-text-muted mt-1">Your donation history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center">
                  <Heart size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="font-medium">{entry.units_donated} unit(s) donated</p>
                  <p className="text-sm text-text-muted flex items-center gap-1">
                    <Building2 size={12} /> {entry.hospital_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium flex items-center gap-1 text-text-secondary">
                  <Calendar size={14} /> {new Date(entry.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-secondary-50 border-secondary-200">
        <div className="flex items-center gap-3">
          <Heart size={24} className="text-secondary" />
          <div>
            <p className="font-semibold text-secondary">Total Donations: {history.length}</p>
            <p className="text-sm text-secondary/70">
              Total units donated: {history.reduce((sum, h) => sum + h.units_donated, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
