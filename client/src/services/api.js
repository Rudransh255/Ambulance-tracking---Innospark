const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const authAPI = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
};

export const ambulanceAPI = {
  getAll: () => request('/ambulances'),
  getMyAmbulance: () => request('/ambulances/my-ambulance'),
  updateStatus: (id, status) => request(`/ambulances/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  patientPickup: (id, data) => request(`/ambulances/${id}/pickup`, { method: 'POST', body: JSON.stringify(data) }),
  sos: (data) => request('/ambulances/sos', { method: 'POST', body: JSON.stringify(data) }),
};

export const hospitalAPI = {
  getAll: () => request('/hospitals'),
  getMine: () => request('/hospitals/my-hospital'),
  getById: (id) => request(`/hospitals/${id}`),
  getAlerts: (id) => request(`/hospitals/${id}/alerts`),
  acknowledgeAlert: (id) => request(`/hospitals/alerts/${id}/acknowledge`, { method: 'PUT' }),
  updateResources: (id, data) => request(`/hospitals/${id}/resources`, { method: 'PUT', body: JSON.stringify(data) }),
  getDoctors: (id) => request(`/hospitals/${id}/doctors`),
  toggleDoctorDuty: (id) => request(`/hospitals/doctors/${id}/toggle-duty`, { method: 'PUT' }),
};

export const bloodAPI = {
  getAvailability: (bloodGroup) => request(`/blood/availability${bloodGroup ? `?blood_group=${bloodGroup}` : ''}`),
  updateInventory: (hospitalId, data) => request(`/blood/inventory/${hospitalId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getRequests: () => request('/blood/requests'),
  postRequest: (data) => request('/blood/requests', { method: 'POST', body: JSON.stringify(data) }),
  respondToRequest: (id) => request(`/blood/requests/${id}/respond`, { method: 'POST' }),
};

export const donorAPI = {
  getProfile: () => request('/donors/profile'),
  updateAvailability: (isAvailable) => request('/donors/availability', { method: 'PUT', body: JSON.stringify({ is_available: isAvailable }) }),
  getHistory: () => request('/donors/history'),
  getAll: () => request('/donors'),
};

export const trafficAPI = {
  getAlerts: () => request('/traffic/alerts'),
  acknowledgeAlert: (id) => request(`/traffic/alerts/${id}/acknowledge`, { method: 'PUT' }),
  getActiveAmbulances: () => request('/traffic/active-ambulances'),
};

export const analyticsAPI = {
  getStats: () => request('/analytics/stats'),
  getResponseTimes: () => request('/analytics/response-times'),
  getBloodTrends: () => request('/analytics/blood-trends'),
  getHeatmap: () => request('/analytics/heatmap'),
};
