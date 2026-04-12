# Tech Stack Document
# Emergency Response Network — LifePulse

---

## 1. Architecture Overview

LifePulse follows a modern client-server architecture with real-time capabilities at its core. The system is split into three layers: a React-based frontend, a Node.js/Express backend with WebSocket support, and a PostgreSQL database with Redis for caching and pub/sub.

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│  React + Vite  |  Leaflet Maps  |  Socket.IO Client │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────┐
│                   SERVER LAYER                      │
│  Node.js + Express  |  Socket.IO  |  REST API       │
│  JWT Auth  |  Role Middleware  |  Notification Svc   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    DATA LAYER                       │
│  PostgreSQL (Supabase)  |  Redis (pub/sub + cache)  │
│  PostGIS (geospatial)   |  Supabase Realtime        │
└─────────────────────────────────────────────────────┘
```

---

## 2. Frontend

| Technology | Purpose | Why This Choice |
|---|---|---|
| **React 18** | UI framework | Component-based, large ecosystem, fast development for hackathons |
| **Vite** | Build tool | Near-instant HMR, fast builds, zero-config setup |
| **React Router v6** | Client-side routing | Role-based route protection, nested layouts |
| **Tailwind CSS** | Styling | Utility-first, rapid prototyping, consistent design tokens |
| **Leaflet.js + React Leaflet** | Interactive maps | Free, open-source, lightweight alternative to Google Maps |
| **Socket.IO Client** | Real-time updates | Bi-directional communication for live ambulance tracking |
| **Lucide React** | Icon library | Clean, consistent SVG icons (no emojis per design requirement) |
| **Recharts** | Data visualization | Blood availability charts, analytics dashboards |
| **React Hook Form** | Form handling | Lightweight, performant form validation |
| **Zustand** | State management | Minimal boilerplate, perfect for medium-complexity state |
| **React Hot Toast** | Notifications | Toast notifications for alerts and status updates |

### Frontend Project Structure

```
src/
├── components/
│   ├── common/          # Button, Input, Card, Modal, Badge
│   ├── map/             # AmbulanceMap, TrackingMarker, RouteOverlay
│   ├── dashboard/       # StatCard, ResourceTable, BloodChart
│   └── layout/          # Sidebar, Navbar, RoleGuard
├── pages/
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── patient/         # SOSPanel, TrackAmbulance, HospitalList
│   ├── hospital/        # ResourceManager, BloodInventory, IncomingAlerts
│   ├── ambulance/       # CrewDashboard, PatientIntake, Navigation
│   ├── traffic/         # RouteAlerts, ActiveAmbulances
│   ├── donor/           # DonorProfile, UrgentRequests, DonationHistory
│   └── admin/           # Analytics, Heatmap, SystemOverview
├── hooks/               # useSocket, useGeolocation, useAuth
├── services/            # api.js, socket.js, notification.js
├── stores/              # authStore, ambulanceStore, bloodStore
└── utils/               # constants, helpers, validators
```

---

## 3. Backend

| Technology | Purpose | Why This Choice |
|---|---|---|
| **Node.js 20** | Runtime | Non-blocking I/O ideal for real-time tracking workloads |
| **Express.js** | HTTP framework | Minimal, flexible, well-documented |
| **Socket.IO** | WebSocket server | Reliable real-time communication with fallback support |
| **Supabase JS Client** | Database access | Direct Postgres access with built-in auth and realtime |
| **JSON Web Tokens (jsonwebtoken)** | Authentication | Stateless auth tokens with role claims |
| **bcrypt** | Password hashing | Industry-standard password security |
| **node-cron** | Scheduled tasks | Donor eligibility checks, stale data cleanup |
| **Twilio / Fast2SMS** | SMS notifications | Delivering alerts to traffic police and donors via SMS |
| **Nodemailer** | Email notifications | Hospital alert emails, donor request confirmations |
| **Helmet + CORS** | Security middleware | HTTP header hardening, cross-origin policy |
| **dotenv** | Environment config | Secrets management |
| **Morgan + Winston** | Logging | Request logging and structured application logs |

### Backend Project Structure

```
server/
├── config/              # db.js, redis.js, env.js
├── middleware/           # auth.js, roleGuard.js, errorHandler.js, rateLimiter.js
├── routes/
│   ├── auth.routes.js
│   ├── ambulance.routes.js
│   ├── hospital.routes.js
│   ├── blood.routes.js
│   ├── donor.routes.js
│   └── traffic.routes.js
├── controllers/         # Business logic for each route group
├── services/
│   ├── notification.service.js    # SMS, email, push dispatch
│   ├── geolocation.service.js     # Distance calculations, nearest-entity queries
│   ├── blood.service.js           # Inventory aggregation, donor matching
│   └── alert.service.js           # Patient-pickup trigger orchestration
├── socket/
│   ├── index.js                   # Socket.IO initialization
│   ├── ambulance.handler.js       # Location broadcast, status updates
│   └── alert.handler.js           # Real-time alert distribution
├── models/              # Supabase table schemas / query builders
├── utils/               # helpers, validators, constants
└── index.js             # Entry point
```

---

## 4. Database — Supabase (PostgreSQL + PostGIS)

Supabase provides a managed PostgreSQL instance with built-in authentication, row-level security, real-time subscriptions, and PostGIS for geospatial queries.

### Core Tables

```
users
├── id (UUID, PK)
├── email
├── password_hash
├── role (enum: patient, donor, hospital_admin, ambulance_crew, traffic_police)
├── full_name
├── phone
├── created_at

ambulances
├── id (UUID, PK)
├── vehicle_number
├── crew_user_id (FK → users)
├── status (enum: idle, dispatched, at_scene, transporting, arrived)
├── current_lat
├── current_lng
├── destination_hospital_id (FK → hospitals)
├── updated_at

hospitals
├── id (UUID, PK)
├── name
├── address
├── lat
├── lng
├── phone
├── admin_user_id (FK → users)

hospital_resources
├── id (UUID, PK)
├── hospital_id (FK → hospitals)
├── general_beds_available
├── icu_beds_available
├── ventilators_available
├── o2_tanks_available
├── updated_at

doctors
├── id (UUID, PK)
├── hospital_id (FK → hospitals)
├── name
├── specialization
├── on_duty (boolean)

blood_inventory
├── id (UUID, PK)
├── hospital_id (FK → hospitals)
├── blood_group (enum: A+, A-, B+, B-, AB+, AB-, O+, O-)
├── units_available
├── updated_at

donors
├── id (UUID, PK)
├── user_id (FK → users)
├── blood_group
├── last_donation_date
├── is_eligible (boolean, computed)
├── is_available (boolean)
├── lat
├── lng

emergency_requests
├── id (UUID, PK)
├── patient_user_id (FK → users)
├── ambulance_id (FK → ambulances)
├── pickup_lat
├── pickup_lng
├── patient_condition
├── severity (enum: critical, serious, moderate)
├── status (enum: requested, dispatched, picked_up, in_transit, delivered)
├── hospital_notified (boolean)
├── traffic_notified (boolean)
├── created_at
├── updated_at

blood_requests
├── id (UUID, PK)
├── hospital_id (FK → hospitals)
├── blood_group
├── units_needed
├── urgency (enum: critical, high, normal)
├── status (enum: open, partially_fulfilled, fulfilled, expired)
├── created_at
```

### Geospatial Queries (PostGIS)

PostGIS enables efficient "find nearest" queries:

```sql
-- Find hospitals within 10km of ambulance, ordered by distance
SELECT *, ST_Distance(
  ST_MakePoint(lng, lat)::geography,
  ST_MakePoint(ambulance_lng, ambulance_lat)::geography
) AS distance_meters
FROM hospitals
WHERE ST_DWithin(
  ST_MakePoint(lng, lat)::geography,
  ST_MakePoint(ambulance_lng, ambulance_lat)::geography,
  10000
)
ORDER BY distance_meters;
```

---

## 5. Real-Time Communication

| Layer | Technology | Use Case |
|---|---|---|
| Ambulance → Server | Socket.IO | GPS location streaming every 3–5 seconds |
| Server → Hospital | Socket.IO + SMS | Patient pickup alerts, incoming ambulance notifications |
| Server → Traffic Police | Socket.IO + SMS | Route and corridor clearing alerts |
| Server → Donors | Push + SMS | Urgent blood request broadcasts |
| Server → Patient | Socket.IO | Live ambulance tracking on map |
| Database → Server | Supabase Realtime | Resource updates, blood inventory changes |

### Socket Events

```
Client → Server:
  ambulance:location_update    { ambulanceId, lat, lng, heading, speed }
  ambulance:patient_pickup     { ambulanceId, emergencyId, patientData, severity }
  ambulance:status_change      { ambulanceId, status }
  hospital:resource_update     { hospitalId, resources }
  blood:inventory_update       { hospitalId, bloodGroup, units }

Server → Client:
  ambulance:position           { ambulanceId, lat, lng, heading, speed, eta }
  alert:hospital_incoming      { emergencyId, ambulanceId, eta, patientData, severity }
  alert:traffic_clear_route    { ambulanceId, routeCoords, destination }
  alert:blood_urgent           { requestId, bloodGroup, unitsNeeded, hospitalName, location }
  resource:updated             { hospitalId, resources }
```

---

## 6. Third-Party Services and APIs

| Service | Purpose | Free Tier |
|---|---|---|
| **Supabase** | Database, auth, realtime | 500 MB database, 50K monthly active users |
| **OpenStreetMap + Leaflet** | Map tiles and rendering | Completely free, open source |
| **OSRM (Open Source Routing Machine)** | Route calculation and ETA | Self-hostable, free |
| **Fast2SMS** | SMS delivery (India) | Free tier available for hackathons |
| **Firebase Cloud Messaging** | Push notifications | Free |
| **Vercel** | Frontend hosting | Free tier with generous limits |
| **Railway / Render** | Backend hosting | Free tier available |

---

## 7. Authentication Flow

```
1. User registers → POST /api/auth/register
   → Password hashed with bcrypt (salt rounds: 12)
   → User created in Supabase with role assignment
   → JWT issued (contains: userId, role, email)

2. User logs in → POST /api/auth/login
   → Credentials verified
   → JWT issued (expires: 24h)
   → Refresh token issued (expires: 7d)

3. Protected routes → Authorization: Bearer <token>
   → JWT verified by auth middleware
   → Role checked by roleGuard middleware
   → Request proceeds or 403 returned
```

---

## 8. Deployment Architecture (Hackathon)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │  Railway /   │     │  Supabase    │
│  (Frontend)  │────▶│  Render      │────▶│  (Database)  │
│  React App   │     │  (Backend)   │     │  PostgreSQL  │
└──────────────┘     │  Node.js     │     │  + PostGIS   │
                     │  Socket.IO   │     │  + Realtime  │
                     └──────────────┘     └──────────────┘
```

---

## 9. Development Tools

| Tool | Purpose |
|---|---|
| **Git + GitHub** | Version control and collaboration |
| **VS Code** | Code editor with live share for pair programming |
| **Postman** | API testing and documentation |
| **Supabase Dashboard** | Database management, SQL editor, logs |
| **ESLint + Prettier** | Code quality and formatting |
| **Vite Dev Server** | Hot module replacement during development |

---

## 10. Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>

# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>

# SMS (Fast2SMS)
FAST2SMS_API_KEY=<key>

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=<id>
FIREBASE_PRIVATE_KEY=<key>
FIREBASE_CLIENT_EMAIL=<email>

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<key>
```

---

## 11. Key Technical Decisions

| Decision | Rationale |
|---|---|
| Leaflet over Google Maps | Free, no API key billing concerns, sufficient for hackathon scope |
| Supabase over raw PostgreSQL | Built-in auth, realtime subscriptions, dashboard, and PostGIS — reduces setup time dramatically |
| Socket.IO over raw WebSockets | Automatic reconnection, room support, fallback to polling, event-based API |
| Zustand over Redux | Minimal boilerplate, simpler learning curve, sufficient for this scale |
| Lucide icons over emojis | Per design requirement: clean, consistent, professional SVG icons throughout the UI |
| SMS alerts over app-only notifications | Traffic police and hospital staff may not have the app open — SMS ensures delivery |
