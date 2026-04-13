import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ambulance,
  Building2,
  Droplets,
  MapPin,
  Heart,
  BarChart3,
  X,
  AlertTriangle,
  Stethoscope,
  Users,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const roleMenus = {
  patient: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hospitals', icon: Building2, label: 'Nearby Hospitals' },
    { to: '/blood', icon: Droplets, label: 'Blood Availability' },
  ],
  donor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/blood', icon: Droplets, label: 'Blood Availability' },
    { to: '/donor/requests', icon: AlertTriangle, label: 'Urgent Requests' },
    { to: '/donor/history', icon: Heart, label: 'Donation History' },
  ],
  hospital_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hospital/resources', icon: Building2, label: 'Resources' },
    { to: '/hospital/blood', icon: Droplets, label: 'Blood Inventory' },
    { to: '/hospital/alerts', icon: AlertTriangle, label: 'Incoming Alerts' },
    { to: '/hospital/doctors', icon: Stethoscope, label: 'Doctors' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ],
  ambulance_crew: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  ],
  traffic_police: [
    { to: '/dashboard', icon: MapPin, label: 'Live Map' },
    { to: '/traffic/alerts', icon: AlertTriangle, label: 'Route Alerts' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const menu = roleMenus[user?.role] || [];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-slate-900 border-r border-clinical-border dark:border-slate-700
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-lg font-bold text-primary dark:text-primary-300">LifePulse</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-clinical-alt dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-clinical-border dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-text-muted dark:text-slate-500">
            <div className="w-2 h-2 rounded-full bg-success" />
            System Online
          </div>
        </div>
      </aside>
    </>
  );
}
