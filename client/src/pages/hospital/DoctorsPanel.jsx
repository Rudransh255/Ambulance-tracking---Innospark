import { useEffect, useState } from 'react';
import { Stethoscope, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useManagedHospital from '../../hooks/useManagedHospital';

export default function DoctorsPanel() {
  const [doctors, setDoctors] = useState([]);
  const { hospital, hospitalId, isLoading } = useManagedHospital();

  useEffect(() => {
    if (hospitalId) {
      loadDoctors(hospitalId);
    }
  }, [hospitalId]);

  const loadDoctors = async (managedHospitalId) => {
    try {
      const data = await hospitalAPI.getDoctors(managedHospitalId);
      setDoctors(data);
    } catch (err) {
      toast.error('Failed to load doctors');
    }
  };

  const toggleDuty = async (doctorId) => {
    try {
      const updated = await hospitalAPI.toggleDoctorDuty(doctorId);
      setDoctors((prev) => prev.map((doctor) => (
        doctor.id === doctorId ? { ...doctor, on_duty: updated.on_duty } : doctor
      )));
      toast.success(`Doctor ${updated.on_duty ? 'marked on duty' : 'marked off duty'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" />;
  }

  const onDuty = doctors.filter((doctor) => doctor.on_duty).length;

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Doctors Panel</h1>
        <p className="text-sm text-text-secondary mt-1">
          {hospital?.name || 'Your hospital'} has {onDuty} of {doctors.length} doctors currently on duty
        </p>
      </div>

      <div className="grid gap-3">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className={`card flex items-center justify-between ${!doctor.on_duty ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                doctor.on_duty ? 'bg-secondary-50' : 'bg-gray-100'
              }`}>
                <Stethoscope size={18} className={doctor.on_duty ? 'text-secondary' : 'text-gray-400'} />
              </div>
              <div>
                <p className="font-medium">{doctor.name}</p>
                <p className="text-xs text-text-muted">{doctor.specialization}</p>
              </div>
            </div>

            <button
              onClick={() => toggleDuty(doctor.id)}
              className="flex items-center gap-2 text-sm"
            >
              {doctor.on_duty ? (
                <>
                  <ToggleRight size={28} className="text-success" />
                  <span className="text-success font-medium">On Duty</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={28} className="text-text-muted" />
                  <span className="text-text-muted font-medium">Off Duty</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
