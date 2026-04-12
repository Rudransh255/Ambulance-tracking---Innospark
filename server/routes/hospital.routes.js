const express = require('express');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const { hospitals, hospitalResources, doctors, alerts, ambulances } = require('../data/mockData');

const router = express.Router();

function getManagedHospital(userId) {
  return hospitals.find((hospital) => hospital.admin_user_id === userId);
}

function ensureManagedHospitalAccess(req, res, hospitalId) {
  const managedHospital = getManagedHospital(req.user.id);
  if (!managedHospital) {
    res.status(404).json({ error: 'No hospital is assigned to this admin account.' });
    return null;
  }

  if (managedHospital.id !== hospitalId) {
    res.status(403).json({ error: 'You can only manage your assigned hospital.' });
    return null;
  }

  return managedHospital;
}

// Get the hospital managed by the current admin user
router.get('/my-hospital', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const hospital = getManagedHospital(req.user.id);
  if (!hospital) {
    return res.status(404).json({ error: 'No hospital is assigned to this admin account.' });
  }

  const resources = hospitalResources.find((resource) => resource.hospital_id === hospital.id);
  const hospitalDoctors = doctors.filter((doctor) => doctor.hospital_id === hospital.id);

  res.json({
    ...hospital,
    resources,
    doctors: hospitalDoctors,
    doctors_on_duty: hospitalDoctors.filter((doctor) => doctor.on_duty).length,
    total_doctors: hospitalDoctors.length,
  });
});

// Get all hospitals with resources
router.get('/', authMiddleware, (req, res) => {
  const result = hospitals.map((h) => {
    const resources = hospitalResources.find((r) => r.hospital_id === h.id);
    const hospitalDoctors = doctors.filter((d) => d.hospital_id === h.id);
    return {
      ...h,
      resources,
      doctors_on_duty: hospitalDoctors.filter((d) => d.on_duty).length,
      total_doctors: hospitalDoctors.length,
    };
  });
  res.json(result);
});

// Get alerts for a hospital
router.get('/:id/alerts', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const hospital = ensureManagedHospitalAccess(req, res, req.params.id);
  if (!hospital) return;

  const hospitalAlerts = alerts
    .filter((alert) => alert.hospital_id === hospital.id)
    .map((alert) => {
      const ambulance = ambulances.find((item) => item.id === alert.ambulance_id);
      return {
        ...alert,
        vehicle_number: ambulance?.vehicle_number,
        destination_hospital: hospital.name,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(hospitalAlerts);
});

// Get single hospital detail
router.get('/:id', authMiddleware, (req, res) => {
  const hospital = hospitals.find((h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found.' });

  const resources = hospitalResources.find((r) => r.hospital_id === hospital.id);
  const hospitalDoctors = doctors.filter((d) => d.hospital_id === hospital.id);

  res.json({ ...hospital, resources, doctors: hospitalDoctors });
});

// Update hospital resources
router.put('/:id/resources', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const hospital = ensureManagedHospitalAccess(req, res, req.params.id);
  if (!hospital) return;

  const { general_beds_available, icu_beds_available, ventilators_available, o2_tanks_available } = req.body;
  const resource = hospitalResources.find((r) => r.hospital_id === req.params.id);
  if (!resource) return res.status(404).json({ error: 'Hospital resources not found.' });

  if (general_beds_available !== undefined) resource.general_beds_available = general_beds_available;
  if (icu_beds_available !== undefined) resource.icu_beds_available = icu_beds_available;
  if (ventilators_available !== undefined) resource.ventilators_available = ventilators_available;
  if (o2_tanks_available !== undefined) resource.o2_tanks_available = o2_tanks_available;
  resource.updated_at = new Date().toISOString();

  const io = req.app.get('io');
  if (io) {
    io.emit('resource:updated', { hospitalId: req.params.id, resources: resource });
  }

  res.json(resource);
});

// Get doctors for a hospital
router.get('/:id/doctors', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const hospital = ensureManagedHospitalAccess(req, res, req.params.id);
  if (!hospital) return;

  const hospitalDoctors = doctors.filter((d) => d.hospital_id === req.params.id);
  res.json(hospitalDoctors);
});

// Toggle doctor duty status
router.put('/doctors/:id/toggle-duty', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const managedHospital = getManagedHospital(req.user.id);
  if (!managedHospital) {
    return res.status(404).json({ error: 'No hospital is assigned to this admin account.' });
  }

  const doctor = doctors.find((d) => d.id === req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });
  if (doctor.hospital_id !== managedHospital.id) {
    return res.status(403).json({ error: 'You can only manage doctors in your assigned hospital.' });
  }

  doctor.on_duty = !doctor.on_duty;
  res.json(doctor);
});

// Acknowledge a hospital alert
router.put('/alerts/:id/acknowledge', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const managedHospital = getManagedHospital(req.user.id);
  if (!managedHospital) {
    return res.status(404).json({ error: 'No hospital is assigned to this admin account.' });
  }

  const alert = alerts.find((item) => item.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });
  if (alert.hospital_id !== managedHospital.id) {
    return res.status(403).json({ error: 'You can only acknowledge alerts for your assigned hospital.' });
  }

  alert.acknowledged = true;
  res.json({ message: 'Alert acknowledged.', alert });
});

module.exports = router;
