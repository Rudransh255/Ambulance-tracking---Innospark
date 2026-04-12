import { useState, useEffect } from 'react';
import { Droplets, Search, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { bloodAPI } from '../../services/api';
import BloodGroupBadge from '../../components/common/BloodGroupBadge';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodAvailability() {
  const [availability, setAvailability] = useState(null);
  const [filterGroup, setFilterGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAvailability();
  }, [filterGroup]);

  const loadAvailability = async () => {
    try {
      const data = await bloodAPI.getAvailability(filterGroup || undefined);
      setAvailability(data);
    } catch (err) {
      toast.error('Failed to load blood availability');
    }
  };

  const getStatusColor = (units) => {
    if (units >= 15) return 'bg-success';
    if (units >= 5) return 'bg-warning';
    return 'bg-emergency';
  };

  const getStatusBg = (units) => {
    if (units >= 15) return 'bg-emerald-50 border-success';
    if (units >= 5) return 'bg-amber-50 border-warning';
    return 'bg-red-50 border-emergency';
  };

  const chartData = availability?.summary?.map((s) => ({
    name: s.blood_group,
    units: s.total_units,
  })) || [];

  const filteredHospitals = availability?.per_hospital?.filter((h) =>
    h.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">City-Wide Blood Availability</h1>
        <p className="text-sm text-text-secondary mt-1">
          Real-time blood inventory across all registered hospitals and blood banks
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="input-field pl-9"
            placeholder="Search hospital or blood bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(availability?.summary || []).map((s) => (
          <div key={s.blood_group} className={`card border-t-4 ${getStatusBg(s.total_units)}`}>
            <div className="flex items-center justify-between mb-2">
              <BloodGroupBadge group={s.blood_group} size="lg" />
              <div className={`w-3 h-3 rounded-full ${getStatusColor(s.total_units)}`} />
            </div>
            <p className="text-2xl font-bold">{s.total_units}</p>
            <p className="text-xs text-text-muted">units across {s.hospital_count} centers</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-semibold mb-4">Availability Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="units" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Hospital Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-clinical-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 size={18} />
            Hospital-Wise Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-clinical-alt">
              <tr className="text-xs text-text-secondary font-medium">
                <th className="text-left px-4 py-3">Hospital</th>
                {BLOOD_GROUPS.map((bg) => (
                  <th key={bg} className="text-center px-2 py-3">{bg}</th>
                ))}
                <th className="text-center px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredHospitals.map((h) => (
                <tr key={h.hospital_id} className="border-t border-clinical-border hover:bg-clinical-alt/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{h.hospital_name}</p>
                    <p className="text-xs text-text-muted">{h.address}</p>
                  </td>
                  {BLOOD_GROUPS.map((bg) => {
                    const units = h[bg] || 0;
                    return (
                      <td key={bg} className="text-center px-2 py-3">
                        <span className={`text-sm font-semibold ${units === 0 ? 'text-emergency' : units < 5 ? 'text-warning' : 'text-success'}`}>
                          {units}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-3 text-xs text-text-muted">
                    {h.last_updated ? new Date(h.last_updated).toLocaleTimeString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
