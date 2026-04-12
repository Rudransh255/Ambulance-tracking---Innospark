const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { emergencyRequests, ambulances, donors, hospitals, bloodInventory, bloodGroups } = require('../data/mockData');

const router = express.Router();

// Get system stats
router.get('/stats', authMiddleware, (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  res.json({
    total_emergencies_this_month: emergencyRequests.filter(
      (er) => new Date(er.created_at) >= thisMonth
    ).length,
    active_ambulances: ambulances.filter((a) => a.status !== 'idle').length,
    total_ambulances: ambulances.length,
    registered_donors: donors.length,
    available_donors: donors.filter((d) => d.is_available && d.is_eligible).length,
    hospitals_online: hospitals.length,
  });
});

// Get response time metrics (simulated)
router.get('/response-times', authMiddleware, (req, res) => {
  const zones = ['North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'];
  const days = 30;
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const entry = { date: date.toISOString().split('T')[0] };
    zones.forEach((zone) => {
      entry[zone] = Math.floor(Math.random() * 10) + 5; // 5-15 minutes
    });
    data.push(entry);
  }

  res.json({ zones, data });
});

// Blood usage trends (simulated)
router.get('/blood-trends', authMiddleware, (req, res) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = months.map((month) => {
    const entry = { month };
    bloodGroups.forEach((bg) => {
      entry[bg] = Math.floor(Math.random() * 50) + 10;
    });
    return entry;
  });

  res.json(data);
});

// Emergency heatmap data (simulated)
router.get('/heatmap', authMiddleware, (req, res) => {
  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push({
      lat: 28.5 + Math.random() * 0.2,
      lng: 77.1 + Math.random() * 0.3,
      intensity: Math.random(),
    });
  }
  res.json(points);
});

module.exports = router;
