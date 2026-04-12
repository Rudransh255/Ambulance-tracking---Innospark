import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// Dashboards
import PatientDashboard from './pages/patient/PatientDashboard';
import AmbulanceDashboard from './pages/ambulance/AmbulanceDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import TrafficDashboard from './pages/traffic/TrafficDashboard';
import DonorDashboard from './pages/donor/DonorDashboard';

// Shared pages
import HospitalList from './pages/patient/HospitalList';
import BloodAvailability from './pages/blood/BloodAvailability';

// Hospital admin pages
import ResourceManager from './pages/hospital/ResourceManager';
import BloodInventoryManager from './pages/hospital/BloodInventoryManager';
import IncomingAlerts from './pages/hospital/IncomingAlerts';
import DoctorsPanel from './pages/hospital/DoctorsPanel';

// Donor pages
import UrgentRequests from './pages/donor/UrgentRequests';
import DonationHistory from './pages/donor/DonationHistory';

// Traffic pages
import TrafficAlerts from './pages/traffic/TrafficAlerts';

// Analytics
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner className="h-screen" size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function getDashboardComponent(role) {
  const map = {
    patient: PatientDashboard,
    donor: DonorDashboard,
    hospital_admin: HospitalDashboard,
    ambulance_crew: AmbulanceDashboard,
    traffic_police: TrafficDashboard,
  };
  return map[role] || PatientDashboard;
}

function DashboardRedirect() {
  const { user } = useAuthStore();
  const Component = getDashboardComponent(user?.role);
  return <Component />;
}

export default function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner className="h-screen" size="lg" />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRedirect />} />
        <Route path="hospitals" element={<HospitalList />} />
        <Route path="blood" element={<BloodAvailability />} />

        {/* Hospital admin routes */}
        <Route path="hospital/resources" element={<ResourceManager />} />
        <Route path="hospital/blood" element={<BloodInventoryManager />} />
        <Route path="hospital/alerts" element={<IncomingAlerts />} />
        <Route path="hospital/doctors" element={<DoctorsPanel />} />

        {/* Donor routes */}
        <Route path="donor/requests" element={<UrgentRequests />} />
        <Route path="donor/history" element={<DonationHistory />} />

        {/* Traffic routes */}
        <Route path="traffic/alerts" element={<TrafficAlerts />} />

        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
