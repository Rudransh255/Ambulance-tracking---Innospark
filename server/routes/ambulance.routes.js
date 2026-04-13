const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const { ambulances, emergencyRequests, hospitals, users, alerts } = require('../data/mockData');

const router = express.Router();

// Get all ambulances
router.get('/', authMiddleware, (req, res) => {
  const enriched = ambulances.map((a) => {
    const crew = users.find((u) => u.id === a.crew_user_id);
    const destHospital = hospitals.find((h) => h.id === a.destination_hospital_id);
    return {
      ...a,
      crew_name: crew ? crew.full_name : null,
      destination_hospital_name: destHospital ? destHospital.name : null,
    };
  });
  res.json(enriched);
});

// Get ambulance for current crew member
router.get('/my-ambulance', authMiddleware, roleGuard('ambulance_crew'), (req, res) => {
  const ambulance = ambulances.find((a) => a.crew_user_id === req.user.id);
  if (!ambulance) return res.status(404).json({ error: 'No ambulance assigned.' });

  const activeEmergency = emergencyRequests.find(
    (er) => er.ambulance_id === ambulance.id && !['delivered', 'cancelled'].includes(er.status)
  );

  res.json({ ambulance, activeEmergency });
});

// Update ambulance status
router.put('/:id/status', authMiddleware, roleGuard('ambulance_crew'), (req, res) => {
  const { status } = req.body;
  const ambulance = ambulances.find((a) => a.id === req.params.id);
  if (!ambulance) return res.status(404).json({ error: 'Ambulance not found.' });

  ambulance.status = status;
  ambulance.updated_at = new Date().toISOString();
  res.json(ambulance);
});

// Patient pickup — triggers alerts
router.post('/:id/pickup', authMiddleware, roleGuard('ambulance_crew'), (req, res) => {
  const { patient_name, patient_age, condition, severity, destination_hospital_id } = req.body;
  const ambulance = ambulances.find((a) => a.id === req.params.id);
  if (!ambulance) return res.status(404).json({ error: 'Ambulance not found.' });

  ambulance.status = 'transporting';
  ambulance.destination_hospital_id = destination_hospital_id;
  ambulance.updated_at = new Date().toISOString();

  const emergency = {
    id: uuidv4(),
    patient_user_id: null,
    ambulance_id: ambulance.id,
    pickup_lat: ambulance.current_lat,
    pickup_lng: ambulance.current_lng,
    patient_condition: condition,
    severity: severity || 'moderate',
    status: 'in_transit',
    hospital_notified: true,
    traffic_notified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  emergencyRequests.push(emergency);

  // Create alert for hospital
  const hospital = hospitals.find((h) => h.id === destination_hospital_id);
  const alert = {
    id: uuidv4(),
    type: 'ambulance_incoming',
    emergency_id: emergency.id,
    ambulance_id: ambulance.id,
    hospital_id: destination_hospital_id,
    severity: emergency.severity,
    patient_condition: condition,
    eta_minutes: Math.floor(Math.random() * 15) + 5,
    acknowledged: false,
    created_at: new Date().toISOString(),
  };
  alerts.push(alert);

  // Emit via socket if available
  const io = req.app.get('io');
  if (io) {
    io.to(`hospital_${destination_hospital_id}`).emit('alert:hospital_incoming', alert);
    io.to('traffic_police').emit('alert:traffic_clear_route', {
      ambulanceId: ambulance.id,
      vehicleNumber: ambulance.vehicle_number,
      routeCoords: [
        { lat: ambulance.current_lat, lng: ambulance.current_lng },
        { lat: hospital?.lat, lng: hospital?.lng },
      ],
      destination: hospital?.name,
      eta_minutes: alert.eta_minutes,
    });
    io.emit('ambulance:position', {
      ambulanceId: ambulance.id,
      ...ambulance,
    });
  }

  res.json({ emergency, alert, message: 'Patient picked up. Hospital and traffic police notified.' });
});

// SOS dispatch - find nearest ambulance
router.post('/sos', authMiddleware, (req, res) => {
  const { lat, lng, medical_history } = req.body;

  const idleAmbulances = ambulances.filter((a) => a.status === 'idle');
  if (idleAmbulances.length === 0) {
    return res.status(503).json({ error: 'No ambulances available. Please call emergency services.' });
  }

  // Find nearest idle ambulance (simple distance calc)
  let nearest = idleAmbulances[0];
  let minDist = Infinity;
  idleAmbulances.forEach((a) => {
    const dist = Math.sqrt(Math.pow(a.current_lat - lat, 2) + Math.pow(a.current_lng - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = a;
    }
  });

  nearest.status = 'dispatched';
  nearest.updated_at = new Date().toISOString();

  // Auto-reset ambulance to idle after 2 minutes (demo purposes)
  setTimeout(() => {
    nearest.status = 'idle';
    nearest.updated_at = new Date().toISOString();
  }, 2 * 60 * 1000);

  const emergency = {
    id: uuidv4(),
    patient_user_id: req.user.id,
    ambulance_id: nearest.id,
    pickup_lat: lat,
    pickup_lng: lng,
    patient_condition: medical_history || 'SOS Emergency',
    severity: 'critical',
    status: 'dispatched',
    hospital_notified: false,
    traffic_notified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  emergencyRequests.push(emergency);

  const io = req.app.get('io');
  if (io) {
    io.emit('ambulance:position', { ambulanceId: nearest.id, ...nearest });
    io.to(`user_${req.user.id}`).emit('sos:dispatched', {
      emergency,
      ambulance: nearest,
      eta_minutes: Math.floor(minDist * 1000) + 3,
    });

    // Notify the ambulance crew member
    if (nearest.crew_user_id) {
      io.to(`user_${nearest.crew_user_id}`).emit('sos:new_emergency', {
        emergency,
        patient_name: req.user.full_name,
        pickup_lat: lat,
        pickup_lng: lng,
        eta_minutes: Math.floor(minDist * 1000) + 3,
      });
    }

    // Also notify all ambulance crew role users
    io.to('role_ambulance_crew').emit('sos:alert', {
      emergency,
      ambulance_vehicle: nearest.vehicle_number,
      patient_name: req.user.full_name,
      pickup_lat: lat,
      pickup_lng: lng,
    });

    // Notify nearest hospital
    let nearestHospital = hospitals[0];
    let minHospDist = Infinity;
    hospitals.forEach((h) => {
      const dist = Math.sqrt(Math.pow(h.lat - lat, 2) + Math.pow(h.lng - lng, 2));
      if (dist < minHospDist) {
        minHospDist = dist;
        nearestHospital = h;
      }
    });

    if (nearestHospital) {
      io.to(`hospital_${nearestHospital.id}`).emit('sos:hospital_alert', {
        emergency,
        ambulance_vehicle: nearest.vehicle_number,
        patient_name: req.user.full_name,
        pickup_lat: lat,
        pickup_lng: lng,
        eta_minutes: Math.floor(minDist * 1000) + 3,
        hospital_name: nearestHospital.name,
      });

      // Also notify all hospital admins
      io.to('role_hospital_admin').emit('sos:hospital_alert', {
        emergency,
        ambulance_vehicle: nearest.vehicle_number,
        patient_name: req.user.full_name,
        pickup_lat: lat,
        pickup_lng: lng,
        eta_minutes: Math.floor(minDist * 1000) + 3,
        hospital_name: nearestHospital.name,
      });
    }
  }

  res.json({
    emergency,
    ambulance: {
      id: nearest.id,
      vehicle_number: nearest.vehicle_number,
      current_lat: nearest.current_lat,
      current_lng: nearest.current_lng,
    },
    eta_minutes: Math.floor(minDist * 1000) + 3,
    message: 'Ambulance dispatched to your location.',
  });
});

module.exports = router;
