require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const { initializeSocket } = require('./socket/index');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Make io accessible to routes
app.set('io', io);

// ─── Middleware ──────────────────────────────────────────
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/ambulances', require('./routes/ambulance.routes'));
app.use('/api/hospitals', require('./routes/hospital.routes'));
app.use('/api/blood', require('./routes/blood.routes'));
app.use('/api/donors', require('./routes/donor.routes'));
app.use('/api/traffic', require('./routes/traffic.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Socket.IO ──────────────────────────────────────────
initializeSocket(io);

// ─── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  LifePulse API Server running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Socket.IO: ws://localhost:${PORT}\n`);
  console.log('  Demo accounts (password: password123):');
  console.log('    Patient:        patient@demo.com');
  console.log('    Donor:          donor@demo.com');
  console.log('    Hospital Admin: hospital@demo.com');
  console.log('    Ambulance Crew: ambulance@demo.com');
  console.log('    Traffic Police: traffic@demo.com\n');
});
