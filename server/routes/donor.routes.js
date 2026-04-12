const express = require('express');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const { donors, users, donationHistory, hospitals } = require('../data/mockData');

const router = express.Router();

// Get donor profile
router.get('/profile', authMiddleware, roleGuard('donor'), (req, res) => {
  const donor = donors.find((d) => d.user_id === req.user.id);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found.' });

  const user = users.find((u) => u.id === req.user.id);
  res.json({
    ...donor,
    full_name: user?.full_name,
    email: user?.email,
    phone: user?.phone,
  });
});

// Update donor availability
router.put('/availability', authMiddleware, roleGuard('donor'), (req, res) => {
  const donor = donors.find((d) => d.user_id === req.user.id);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found.' });

  donor.is_available = req.body.is_available;
  res.json(donor);
});

// Get donation history
router.get('/history', authMiddleware, roleGuard('donor'), (req, res) => {
  const donor = donors.find((d) => d.user_id === req.user.id);
  if (!donor) return res.json([]);

  const history = donationHistory
    .filter((dh) => dh.donor_id === donor.id)
    .map((dh) => {
      const hospital = hospitals.find((h) => h.id === dh.hospital_id);
      return { ...dh, hospital_name: hospital?.name };
    });

  res.json(history);
});

// Get all donors (for admin/analytics)
router.get('/', authMiddleware, (req, res) => {
  const enriched = donors.map((d) => {
    const user = users.find((u) => u.id === d.user_id);
    return {
      ...d,
      full_name: user?.full_name || 'Anonymous Donor',
      phone: user?.phone,
    };
  });
  res.json(enriched);
});

module.exports = router;
