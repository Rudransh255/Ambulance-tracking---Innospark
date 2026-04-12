const jwt = require('jsonwebtoken');
const { ambulances, hospitals } = require('../data/mockData');

function initializeSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email} (${socket.user.role})`);

    socket.join(`role_${socket.user.role}`);
    socket.join(`user_${socket.user.id}`);

    if (socket.user.role === 'traffic_police') {
      socket.join('traffic_police');
    }

    if (socket.user.role === 'hospital_admin') {
      const managedHospital = hospitals.find((hospital) => hospital.admin_user_id === socket.user.id);
      if (managedHospital) {
        socket.join(`hospital_${managedHospital.id}`);
      }
    }

    socket.on('ambulance:location_update', (data) => {
      const { ambulanceId, lat, lng, heading, speed } = data;
      const ambulance = ambulances.find((item) => item.id === ambulanceId);
      if (!ambulance) return;

      ambulance.current_lat = lat;
      ambulance.current_lng = lng;
      ambulance.updated_at = new Date().toISOString();

      io.emit('ambulance:position', {
        ambulanceId,
        lat,
        lng,
        heading,
        speed,
        status: ambulance.status,
        vehicle_number: ambulance.vehicle_number,
      });
    });

    socket.on('ambulance:status_change', (data) => {
      const { ambulanceId, status } = data;
      const ambulance = ambulances.find((item) => item.id === ambulanceId);
      if (!ambulance) return;

      ambulance.status = status;
      ambulance.updated_at = new Date().toISOString();
      io.emit('ambulance:status_updated', { ambulanceId, status });
    });

    socket.on('hospital:resource_update', (data) => {
      io.emit('resource:updated', data);
    });

    socket.on('blood:inventory_update', (data) => {
      io.emit('blood:inventory_updated', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  setInterval(() => {
    ambulances.forEach((ambulance) => {
      if (!['transporting', 'dispatched'].includes(ambulance.status)) {
        return;
      }

      ambulance.current_lat += (Math.random() - 0.5) * 0.002;
      ambulance.current_lng += (Math.random() - 0.5) * 0.002;
      ambulance.updated_at = new Date().toISOString();

      io.emit('ambulance:position', {
        ambulanceId: ambulance.id,
        lat: ambulance.current_lat,
        lng: ambulance.current_lng,
        status: ambulance.status,
        vehicle_number: ambulance.vehicle_number,
        heading: Math.random() * 360,
        speed: Math.floor(Math.random() * 40) + 20,
      });
    });
  }, 4000);
}

module.exports = { initializeSocket };
