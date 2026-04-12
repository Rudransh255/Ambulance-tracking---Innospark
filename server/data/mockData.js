const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Pre-hashed password for all demo accounts: "password123"
const DEMO_PASSWORD_HASH = '$2b$12$LJ3m4ys3Lk0YDDEqdMQPaOCGNqjxMKRPz8vGqKqVFHOvXBzFy8S6e';

// ─── Users ──────────────────────────────────────────────
const users = [
  {
    id: 'u1',
    email: 'patient@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'patient',
    full_name: 'Aarav Sharma',
    phone: '+919876543210',
    blood_group: 'O+',
    created_at: new Date().toISOString(),
  },
  {
    id: 'u2',
    email: 'donor@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'donor',
    full_name: 'Priya Patel',
    phone: '+919876543211',
    blood_group: 'A+',
    created_at: new Date().toISOString(),
  },
  {
    id: 'u3',
    email: 'hospital@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'hospital_admin',
    full_name: 'Dr. Vikram Singh',
    phone: '+919876543212',
    blood_group: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'u4',
    email: 'ambulance@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'ambulance_crew',
    full_name: 'Rajesh Kumar',
    phone: '+919876543213',
    blood_group: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'u5',
    email: 'traffic@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'traffic_police',
    full_name: 'Inspector Mehra',
    phone: '+919876543214',
    blood_group: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'u6',
    email: 'donor2@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'donor',
    full_name: 'Sneha Gupta',
    phone: '+919876543215',
    blood_group: 'B+',
    created_at: new Date().toISOString(),
  },
];

// ─── Hospitals ──────────────────────────────────────────
const hospitals = [
  {
    id: 'h1',
    name: 'City General Hospital',
    address: 'MG Road, Sector 12, New Delhi',
    lat: 28.6139,
    lng: 77.2090,
    phone: '+911123456789',
    admin_user_id: 'u3',
  },
  {
    id: 'h2',
    name: 'Apollo Emergency Center',
    address: 'Sarita Vihar, New Delhi',
    lat: 28.5355,
    lng: 77.2857,
    phone: '+911123456790',
    admin_user_id: null,
  },
  {
    id: 'h3',
    name: 'AIIMS Trauma Centre',
    address: 'Ansari Nagar, New Delhi',
    lat: 28.5672,
    lng: 77.2100,
    phone: '+911123456791',
    admin_user_id: null,
  },
  {
    id: 'h4',
    name: 'Max Super Speciality',
    address: 'Saket, New Delhi',
    lat: 28.5280,
    lng: 77.2190,
    phone: '+911123456792',
    admin_user_id: null,
  },
  {
    id: 'h5',
    name: 'Safdarjung Hospital',
    address: 'Ring Road, New Delhi',
    lat: 28.5685,
    lng: 77.2065,
    phone: '+911123456793',
    admin_user_id: null,
  },
];

// ─── Hospital Resources ─────────────────────────────────
const hospitalResources = [
  { id: 'hr1', hospital_id: 'h1', general_beds_available: 45, icu_beds_available: 8, ventilators_available: 5, o2_tanks_available: 30, updated_at: new Date().toISOString() },
  { id: 'hr2', hospital_id: 'h2', general_beds_available: 22, icu_beds_available: 3, ventilators_available: 2, o2_tanks_available: 15, updated_at: new Date().toISOString() },
  { id: 'hr3', hospital_id: 'h3', general_beds_available: 60, icu_beds_available: 12, ventilators_available: 8, o2_tanks_available: 50, updated_at: new Date().toISOString() },
  { id: 'hr4', hospital_id: 'h4', general_beds_available: 35, icu_beds_available: 6, ventilators_available: 4, o2_tanks_available: 25, updated_at: new Date().toISOString() },
  { id: 'hr5', hospital_id: 'h5', general_beds_available: 50, icu_beds_available: 10, ventilators_available: 6, o2_tanks_available: 40, updated_at: new Date().toISOString() },
];

// ─── Doctors ────────────────────────────────────────────
const doctors = [
  { id: 'd1', hospital_id: 'h1', name: 'Dr. Ananya Mehta', specialization: 'Emergency Medicine', on_duty: true },
  { id: 'd2', hospital_id: 'h1', name: 'Dr. Rohit Kapoor', specialization: 'Cardiology', on_duty: true },
  { id: 'd3', hospital_id: 'h1', name: 'Dr. Sunita Rao', specialization: 'Orthopedics', on_duty: false },
  { id: 'd4', hospital_id: 'h2', name: 'Dr. Amit Joshi', specialization: 'General Surgery', on_duty: true },
  { id: 'd5', hospital_id: 'h2', name: 'Dr. Neha Verma', specialization: 'Neurology', on_duty: true },
  { id: 'd6', hospital_id: 'h3', name: 'Dr. Karan Malhotra', specialization: 'Trauma Surgery', on_duty: true },
  { id: 'd7', hospital_id: 'h3', name: 'Dr. Pooja Singh', specialization: 'Emergency Medicine', on_duty: true },
  { id: 'd8', hospital_id: 'h4', name: 'Dr. Arjun Nair', specialization: 'Cardiology', on_duty: false },
  { id: 'd9', hospital_id: 'h5', name: 'Dr. Meera Sharma', specialization: 'Pediatrics', on_duty: true },
  { id: 'd10', hospital_id: 'h5', name: 'Dr. Sanjay Gupta', specialization: 'General Medicine', on_duty: true },
];

// ─── Blood Inventory ────────────────────────────────────
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const bloodInventory = [];
let biId = 1;
hospitals.forEach((hospital) => {
  bloodGroups.forEach((bg) => {
    bloodInventory.push({
      id: `bi${biId++}`,
      hospital_id: hospital.id,
      blood_group: bg,
      units_available: Math.floor(Math.random() * 20) + 1,
      updated_at: new Date().toISOString(),
    });
  });
});

// ─── Ambulances ─────────────────────────────────────────
const ambulances = [
  { id: 'a1', vehicle_number: 'DL-01-AB-1234', crew_user_id: 'u4', status: 'idle', current_lat: 28.6200, current_lng: 77.2150, destination_hospital_id: null, updated_at: new Date().toISOString() },
  { id: 'a2', vehicle_number: 'DL-02-CD-5678', crew_user_id: null, status: 'idle', current_lat: 28.5500, current_lng: 77.2500, destination_hospital_id: null, updated_at: new Date().toISOString() },
  { id: 'a3', vehicle_number: 'DL-03-EF-9012', crew_user_id: null, status: 'idle', current_lat: 28.5800, current_lng: 77.2300, destination_hospital_id: null, updated_at: new Date().toISOString() },
  { id: 'a4', vehicle_number: 'DL-04-GH-3456', crew_user_id: null, status: 'transporting', current_lat: 28.5600, current_lng: 77.2200, destination_hospital_id: 'h3', updated_at: new Date().toISOString() },
  { id: 'a5', vehicle_number: 'DL-05-IJ-7890', crew_user_id: null, status: 'at_scene', current_lat: 28.5400, current_lng: 77.2700, destination_hospital_id: null, updated_at: new Date().toISOString() },
];

// ─── Donors ─────────────────────────────────────────────
const donors = [
  { id: 'dn1', user_id: 'u2', blood_group: 'A+', last_donation_date: '2024-06-15', is_eligible: true, is_available: true, lat: 28.6100, lng: 77.2200 },
  { id: 'dn2', user_id: 'u6', blood_group: 'B+', last_donation_date: '2024-08-01', is_eligible: true, is_available: true, lat: 28.5500, lng: 77.2400 },
  { id: 'dn3', user_id: null, blood_group: 'O+', last_donation_date: '2024-07-20', is_eligible: true, is_available: true, lat: 28.5900, lng: 77.2000 },
  { id: 'dn4', user_id: null, blood_group: 'A-', last_donation_date: '2024-09-01', is_eligible: false, is_available: true, lat: 28.5700, lng: 77.2600 },
  { id: 'dn5', user_id: null, blood_group: 'AB+', last_donation_date: '2024-05-10', is_eligible: true, is_available: false, lat: 28.5300, lng: 77.2100 },
  { id: 'dn6', user_id: null, blood_group: 'O-', last_donation_date: '2024-04-25', is_eligible: true, is_available: true, lat: 28.6000, lng: 77.2350 },
  { id: 'dn7', user_id: null, blood_group: 'B-', last_donation_date: '2024-03-12', is_eligible: true, is_available: true, lat: 28.5450, lng: 77.2550 },
  { id: 'dn8', user_id: null, blood_group: 'O+', last_donation_date: '2024-08-15', is_eligible: true, is_available: true, lat: 28.5650, lng: 77.2150 },
];

// ─── Emergency Requests ─────────────────────────────────
const emergencyRequests = [
  {
    id: 'er1',
    patient_user_id: 'u1',
    ambulance_id: 'a4',
    pickup_lat: 28.5750,
    pickup_lng: 77.2350,
    patient_condition: 'Chest pain, difficulty breathing',
    severity: 'critical',
    status: 'in_transit',
    hospital_notified: true,
    traffic_notified: true,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ─── Blood Requests ─────────────────────────────────────
const bloodRequests = [
  {
    id: 'br1',
    hospital_id: 'h1',
    blood_group: 'O-',
    units_needed: 3,
    urgency: 'critical',
    status: 'open',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'br2',
    hospital_id: 'h3',
    blood_group: 'A+',
    units_needed: 2,
    urgency: 'high',
    status: 'open',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

// ─── Alerts (in-memory feed) ────────────────────────────
const alerts = [
  {
    id: 'al1',
    type: 'ambulance_incoming',
    emergency_id: 'er1',
    ambulance_id: 'a4',
    hospital_id: 'h3',
    severity: 'critical',
    patient_condition: 'Chest pain, difficulty breathing',
    eta_minutes: 8,
    acknowledged: false,
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

// ─── Donation History ───────────────────────────────────
const donationHistory = [
  { id: 'dh1', donor_id: 'dn1', hospital_id: 'h1', units_donated: 1, date: '2024-06-15' },
  { id: 'dh2', donor_id: 'dn1', hospital_id: 'h3', units_donated: 1, date: '2024-02-10' },
  { id: 'dh3', donor_id: 'dn2', hospital_id: 'h2', units_donated: 1, date: '2024-08-01' },
  { id: 'dh4', donor_id: 'dn1', hospital_id: 'h1', units_donated: 1, date: '2023-12-20' },
];

module.exports = {
  users,
  hospitals,
  hospitalResources,
  doctors,
  bloodInventory,
  ambulances,
  donors,
  emergencyRequests,
  bloodRequests,
  alerts,
  donationHistory,
  bloodGroups,
};
