const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const { bloodInventory, bloodRequests, hospitals, donors, users, bloodGroups } = require('../data/mockData');

const router = express.Router();

function getManagedHospital(userId) {
  return hospitals.find((hospital) => hospital.admin_user_id === userId);
}

// Get city-wide blood availability
router.get('/availability', authMiddleware, (req, res) => {
  const { blood_group } = req.query;

  // Aggregate by blood group
  const summary = bloodGroups.map((bg) => {
    const entries = bloodInventory.filter((bi) => bi.blood_group === bg);
    const total = entries.reduce((sum, e) => sum + e.units_available, 0);
    return { blood_group: bg, total_units: total, hospital_count: entries.length };
  });

  // Per-hospital breakdown
  let perHospital = hospitals.map((h) => {
    const inventory = {};
    bloodGroups.forEach((bg) => {
      const entry = bloodInventory.find((bi) => bi.hospital_id === h.id && bi.blood_group === bg);
      inventory[bg] = entry ? entry.units_available : 0;
    });
    const lastUpdate = bloodInventory
      .filter((bi) => bi.hospital_id === h.id)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

    return {
      hospital_id: h.id,
      hospital_name: h.name,
      address: h.address,
      ...inventory,
      last_updated: lastUpdate?.updated_at,
    };
  });

  if (blood_group) {
    const filtered = summary.filter((s) => s.blood_group === blood_group);
    return res.json({ summary: filtered, per_hospital: perHospital });
  }

  res.json({ summary, per_hospital: perHospital });
});

// Update blood inventory
router.put('/inventory/:hospitalId', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const managedHospital = getManagedHospital(req.user.id);
  if (!managedHospital) {
    return res.status(404).json({ error: 'No hospital is assigned to this admin account.' });
  }
  if (managedHospital.id !== req.params.hospitalId) {
    return res.status(403).json({ error: 'You can only manage blood inventory for your assigned hospital.' });
  }

  const { blood_group, units_available } = req.body;
  const entry = bloodInventory.find(
    (bi) => bi.hospital_id === req.params.hospitalId && bi.blood_group === blood_group
  );
  if (!entry) return res.status(404).json({ error: 'Inventory entry not found.' });

  entry.units_available = units_available;
  entry.updated_at = new Date().toISOString();

  const io = req.app.get('io');
  if (io) {
    io.emit('blood:inventory_updated', { hospitalId: req.params.hospitalId, blood_group, units_available });
  }

  res.json(entry);
});

// Get all blood requests
router.get('/requests', authMiddleware, (req, res) => {
  const enriched = bloodRequests.map((br) => {
    const hospital = hospitals.find((h) => h.id === br.hospital_id);
    return { ...br, hospital_name: hospital?.name, hospital_address: hospital?.address };
  });
  res.json(enriched);
});

// Post urgent blood request
router.post('/requests', authMiddleware, roleGuard('hospital_admin'), (req, res) => {
  const { hospital_id, blood_group, units_needed, urgency } = req.body;
  const managedHospital = getManagedHospital(req.user.id);
  if (!managedHospital) {
    return res.status(404).json({ error: 'No hospital is assigned to this admin account.' });
  }
  if (managedHospital.id !== hospital_id) {
    return res.status(403).json({ error: 'You can only post requests for your assigned hospital.' });
  }

  const request = {
    id: uuidv4(),
    hospital_id,
    blood_group,
    units_needed,
    urgency: urgency || 'normal',
    status: 'open',
    created_at: new Date().toISOString(),
  };
  bloodRequests.push(request);

  const hospital = hospitals.find((h) => h.id === hospital_id);

  // Notify matching donors
  const io = req.app.get('io');
  if (io) {
    io.emit('alert:blood_urgent', {
      requestId: request.id,
      bloodGroup: blood_group,
      unitsNeeded: units_needed,
      hospitalName: hospital?.name,
      urgency,
    });
  }

  res.status(201).json(request);
});

// Respond to blood request (donor)
router.post('/requests/:id/respond', authMiddleware, roleGuard('donor'), (req, res) => {
  const request = bloodRequests.find((br) => br.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Blood request not found.' });

  request.status = 'partially_fulfilled';
  res.json({ message: 'Thank you! The hospital has been notified of your availability.', request });
});

module.exports = router;
