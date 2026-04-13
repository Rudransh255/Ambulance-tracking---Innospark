import { Bell, LogOut, User, Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import useThemeStore from '../../stores/themeStore';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const roleLabels = {
    patient: 'Patient',
    donor: 'Blood Donor',
    hospital_admin: 'Hospital Admin',
    ambulance_crew: 'Ambulance Crew',
    traffic_police: 'Traffic Police',
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-clinical-border dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-clinical-alt dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-lg font-bold text-primary dark:text-primary-300 hidden sm:block">LifePulse</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-clinical-alt dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-text-secondary" />}
        </button>

        <button className="relative p-2 rounded-md hover:bg-clinical-alt dark:hover:bg-slate-700 transition-colors" aria-label="Notifications">
          <Bell size={20} className="text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emergency rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-clinical-alt dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-text-primary dark:text-slate-100">{user?.full_name}</p>
              <p className="text-xs text-text-muted dark:text-slate-400">{roleLabels[user?.role]}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-level-2 border border-clinical-border dark:border-slate-700 py-1 z-50">
              <div className="px-4 py-2 border-b border-clinical-border dark:border-slate-700">
                <p className="text-sm font-medium dark:text-slate-100">{user?.full_name}</p>
                <p className="text-xs text-text-muted dark:text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
