import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'donor', label: 'Blood Donor' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'ambulance_crew', label: 'Ambulance Crew' },
  { value: 'traffic_police', label: 'Traffic Police' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register: registerUser, user } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  if (user) return <Navigate to="/dashboard" replace />;

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        await registerUser(data);
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1044A0 0%, #7C3AED 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">LifePulse</h1>
          <p className="text-white/70 text-sm mt-1">Emergency Response Network</p>
        </div>

        <div className="card p-0 overflow-hidden">
          {/* Tab Toggle */}
          <div className="flex border-b border-clinical-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                isLogin ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                !isLogin ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Full Name</label>
                <input
                  {...register('full_name', { required: !isLogin && 'Name is required' })}
                  className="input-field"
                  placeholder="Enter your full name"
                />
                {errors.full_name && <p className="text-xs text-emergency mt-1">{errors.full_name.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-emergency mt-1">{errors.email.message}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input-field"
                  placeholder="+91 9876543210"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-emergency mt-1">{errors.password.message}</p>}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                  <select {...register('role', { required: !isLogin && 'Role is required' })} className="input-field">
                    <option value="">Select your role</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {errors.role && <p className="text-xs text-emergency mt-1">{errors.role.message}</p>}
                </div>

                {(selectedRole === 'donor' || selectedRole === 'patient') && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Blood Group</label>
                    <select {...register('blood_group')} className="input-field">
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {isLogin && (
            <div className="px-6 pb-6">
              <div className="bg-clinical-alt rounded-lg p-3">
                <p className="text-xs font-medium text-text-secondary mb-2">Demo Accounts (password: password123)</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-text-muted">
                  <span>patient@demo.com</span><span>Patient</span>
                  <span>donor@demo.com</span><span>Blood Donor</span>
                  <span>hospital@demo.com</span><span>Hospital Admin</span>
                  <span>ambulance@demo.com</span><span>Ambulance Crew</span>
                  <span>traffic@demo.com</span><span>Traffic Police</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
