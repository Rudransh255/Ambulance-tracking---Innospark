const express = require('express');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const { alerts, ambulances, hospitals } = require('../data/mockData');

const router = express.Router();

// Get active traffic alerts
router.get('/alerts', authMiddleware, roleGuard('traffic_police'), (req, res) => {
  const trafficAlerts = alerts
    .filter((a) => a.type === 'ambulance_incoming' && !a.acknowledged)
    .map((a) => {
      const ambulance = ambulances.find((amb) => amb.id === a.ambulance_id);
      const hospital = hospitals.find((h) => h.id === a.hospital_id);
      return {
        ...a,
        vehicle_number: ambulance?.vehicle_number,
        ambulance_lat: ambulance?.current_lat,
        ambulance_lng: ambulance?.current_lng,
        destination_hospital: hospital?.name,
        destination_lat: hospital?.lat,
        destination_lng: hospital?.lng,
      };
    });
  res.json(trafficAlerts);
});

// Acknowledge alert
router.put('/alerts/:id/acknowledge', authMiddleware, roleGuard('traffic_police'), (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });

  alert.acknowledged = true;
  res.json({ message: 'Alert acknowledged.', alert });
});

// Get active transporting ambulances
router.get('/active-ambulances', authMiddleware, roleGuard('traffic_police'), (req, res) => {
  const active = ambulances
    .filter((a) => a.status === 'transporting' || a.status === 'dispatched')
    .map((a) => {
      const hospital = hospitals.find((h) => h.id === a.destination_hospital_id);
      return {
        ...a,
        destination_hospital_name: hospital?.name,
        destination_lat: hospital?.lat,
        destination_lng: hospital?.lng,
      };
    });
  res.json(active);
});

module.exports = router;
