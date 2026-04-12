# Design Document
# Emergency Response Network — LifePulse

---

## 1. Project Overview

The Emergency Response Network is a technology-driven healthcare ecosystem designed to bridge the gap between emergency services and the general population, particularly in underserved regions. The platform integrates blood donor networks with real-time ambulance tracking to ensure rapid medical response and accessibility.

---

## 2. Problem Statement

Healthcare accessibility is often limited by geographical barriers, lack of real-time data, and inefficient communication between patients, donors, and emergency responders. This leads to delayed life-saving interventions and resource misalignment.

---

## 3. Mission and Goals

- **Accessibility:** Ensure emergency services are available to everyone, regardless of location.
- **Affordability:** Optimize resource allocation through technology to reduce operational costs.
- **Proactivity:** Use real-time tracking and predictive matching to save critical minutes.
- **Reliability:** Build a robust, failsafe infrastructure for high-stakes medical situations.

---

## 4. Core Features and Functional Requirements

### A. Blood Donor Network

- **Real-time Matching:** Dynamic algorithm matching patients with the nearest compatible donors using PostGIS distance queries.
- **Donor Registry:** Comprehensive database with eligibility tracking (56-day cooldown), donation history, and availability status.
- **Urgent Request Pipeline:** Specialized queue for prioritizing critical surgical needs. When a hospital posts an urgent request, all eligible donors within a configurable radius receive SMS and push notifications.
- **City-Wide Blood Availability Chart:** Aggregated, filterable view of blood inventory across all registered blood banks and hospitals, broken down by blood group.

### B. Ambulance Tracking and Dispatch

- **Live Command Dashboard:** Real-time surveillance of all active ambulance units with status indicators (idle, dispatched, at scene, transporting, arrived).
- **Unit Dispatch Tracking:** Granular view of specific ambulance routes, traffic-aware ETA, and destination hospital.
- **Automated Alert Trigger:** On patient pickup confirmation, the system automatically notifies nearby hospitals (to prepare ER) and traffic police (to clear route corridors).
- **SOS Dispatch:** One-tap emergency button that captures the patient's GPS location and dispatches the nearest available ambulance.

### C. Hospital Resource Dashboard

- **Live Resource Visibility:** Each hospital's current availability displayed in real time — general beds, ICU beds, ventilators, O2 tanks, and on-duty specialist doctors.
- **Hospital Admin Panel:** Authorized staff update resource counts through a dedicated interface. Changes propagate immediately to all public-facing views.
- **Distance-Based Filtering:** Patients and ambulance crews can sort hospitals by proximity and available resources to make informed routing decisions.

### D. Regional Intelligence and Analytics

- **Incident Heatmapping:** Visualizing emergency density across city zones to predict demand and pre-position resources.
- **Response Time Metrics:** Average dispatch-to-arrival times per zone, tracked over time.
- **Blood Usage Trends:** Historical consumption data to help blood banks anticipate seasonal or regional demand.

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Patient     │  │  Hospital   │  │  Ambulance Crew /       │ │
│  │  Dashboard   │  │  Admin      │  │  Traffic Police /       │ │
│  │             │  │  Panel      │  │  Donor Portal           │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│              React + Leaflet + Socket.IO Client                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────────┐
│                        SERVER LAYER                             │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  REST     │  │  Socket.IO   │  │  Notification Service     │ │
│  │  API      │  │  Server      │  │  (SMS + Push + In-App)    │ │
│  └──────────┘  └──────────────┘  └────────────────────────────┘ │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Auth     │  │  Role-Based  │  │  Geospatial Query         │ │
│  │  (JWT)    │  │  Middleware   │  │  Engine (PostGIS)         │ │
│  └──────────┘  └──────────────┘  └────────────────────────────┘ │
│                                                                 │
│                    Node.js + Express                            │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                         DATA LAYER                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Supabase (PostgreSQL + PostGIS + Realtime + Auth)         │ │
│  │                                                             │ │
│  │  Tables: users, ambulances, hospitals, hospital_resources,  │ │
│  │          doctors, blood_inventory, donors,                  │ │
│  │          emergency_requests, blood_requests                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Visual Direction and UI/UX Principles

### A. The "Clinical Sanctuary" Aesthetic

Inspired by modern healthcare SaaS and medical testing interfaces, the UI emphasizes:

- **Calm and Trust:** Deep blues and healing purples reduce stress in high-pressure environments. Users are often in crisis — the interface should feel steady and reliable.
- **Clarity and Precision:** High-readability typography and clean, data-dense layouts. Every piece of information earns its place on the screen.
- **Clinical Cleanliness:** A palette of clinical whites, soft greys, and intentional whitespace. No visual clutter. No decorative elements that don't serve a purpose.
- **Icon-Driven, Not Emoji:** All interface elements use Lucide SVG icons for a professional, consistent look. No emojis anywhere in the UI.

### B. Design Tokens

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#1044A0` (Deep Trust Blue) | Headers, primary buttons, active states, navigation |
| **Secondary** | `#7C3AED` (Healing Purple) | Accents, secondary actions, donor-related elements |
| **Emergency** | `#DC2626` (Alert Red) | Critical alerts, SOS button, urgent blood requests |
| **Warning** | `#F59E0B` (Caution Amber) | Low stock warnings, moderate severity indicators |
| **Success** | `#10B981` (Recovery Green) | Confirmed actions, available status, fulfilled requests |
| **Background** | `#F8FAFC` (Clinical White) | Page backgrounds |
| **Surface** | `#FFFFFF` | Cards, panels, modals |
| **Surface Alt** | `#F1F5F9` | Sidebar, secondary panels, table stripes |
| **Border** | `#E2E8F0` | Card borders, dividers, input outlines |
| **Text Primary** | `#0F172A` | Headings, primary content |
| **Text Secondary** | `#64748B` | Labels, descriptions, metadata |
| **Text Muted** | `#94A3B8` | Placeholders, disabled states |

### C. Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| **H1 (Page Title)** | Plus Jakarta Sans | 700 (Bold) | 28px |
| **H2 (Section Title)** | Plus Jakarta Sans | 600 (Semi-Bold) | 22px |
| **H3 (Card Title)** | Plus Jakarta Sans | 600 (Semi-Bold) | 18px |
| **Body** | Plus Jakarta Sans | 400 (Regular) | 14px |
| **Body Small** | Plus Jakarta Sans | 400 (Regular) | 12px |
| **Label** | Plus Jakarta Sans | 500 (Medium) | 12px |
| **Button** | Plus Jakarta Sans | 600 (Semi-Bold) | 14px |
| **Stat Number** | Plus Jakarta Sans | 700 (Bold) | 32px |

### D. Spacing and Layout

| Token | Value |
|---|---|
| Base unit | 4px |
| Card padding | 24px |
| Section gap | 32px |
| Border radius (cards) | 8px |
| Border radius (buttons) | 6px |
| Border radius (inputs) | 6px |
| Border radius (badges) | 9999px (pill) |
| Sidebar width | 260px |
| Max content width | 1280px |

### E. Elevation and Shadows

| Level | Shadow | Usage |
|---|---|---|
| Level 0 | None | Flat elements, inline content |
| Level 1 | `0 1px 3px rgba(0,0,0,0.08)` | Cards, panels |
| Level 2 | `0 4px 12px rgba(0,0,0,0.10)` | Dropdowns, popovers |
| Level 3 | `0 8px 24px rgba(0,0,0,0.12)` | Modals, dialogs |

---

## 7. Page-by-Page Layout Specifications

### 7.1 Login / Register Page

- Centered card on a gradient background (Deep Trust Blue to Healing Purple, subtle).
- Logo and app name at the top of the card.
- Tab toggle: "Login" | "Register".
- Login: email input, password input, "Sign In" primary button, "Forgot Password" link.
- Register: full name, email, phone, password, role selector dropdown, blood group (if donor role selected), "Create Account" primary button.
- Role selector options: Patient, Blood Donor, Hospital Admin, Ambulance Crew, Traffic Police.

### 7.2 Patient Dashboard

- **Top Bar:** Logo, user name, notification bell icon (with unread count badge), profile dropdown.
- **SOS Section:** Large, prominent red SOS button centered at the top. Tapping opens a confirmation modal, then dispatches the nearest ambulance.
- **Track My Ambulance:** Full-width map card (Leaflet) showing the assigned ambulance's live position, route line, and ETA overlay. Visible only when an active emergency exists.
- **Nearby Hospitals:** Sortable table/card grid showing hospitals with columns: Hospital Name, Distance, Available Beds, ICU, O2 Tanks, On-Duty Doctors. Each row is clickable for detail view.
- **Blood Availability:** Link/tab to the city-wide blood chart (see 7.6).

### 7.3 Ambulance Crew Dashboard

- **Top Bar:** Status toggle (Idle / On Duty), current assignment info.
- **Map View:** Full-screen map with route to current destination hospital. Turn-by-turn is handled by the device's native maps (deep link).
- **Patient Intake Panel:** Slide-up panel to record patient details on pickup — name, age, condition notes, severity selector (Critical / Serious / Moderate). "Confirm Pickup" button triggers the automated hospital and traffic police alerts.
- **Status Controls:** Large buttons to update status: "At Scene," "Patient Picked Up," "In Transit," "Arrived at Hospital."

### 7.4 Hospital Admin Dashboard

- **Sidebar Navigation:** Dashboard, Resources, Blood Inventory, Incoming Alerts, Doctors.
- **Dashboard Overview:** Stat cards at top — Total Beds Available, ICU Available, O2 Tanks, Active Incoming Ambulances. Below: recent alert feed.
- **Resource Manager:** Editable form/table for updating bed counts, ICU, ventilators, O2 tanks. "Save" button with confirmation toast.
- **Blood Inventory Manager:** Table of all 8 blood groups with current unit counts. Inline editable. "Post Urgent Request" button per blood group.
- **Incoming Alerts:** Real-time feed of incoming ambulance notifications — showing ambulance ID, patient severity, ETA, and a "Prepare ER" acknowledgment button.
- **Doctors Panel:** List of registered doctors with name, specialization, and on-duty toggle switch.

### 7.5 Traffic Police Dashboard

- **Map View:** Full-screen city map showing all active ambulances currently transporting patients. Each ambulance marker shows direction of travel and route line.
- **Alert Feed:** Side panel listing incoming route-clearing alerts with ambulance ID, current location, route, destination hospital, and ETA. "Acknowledged" button per alert.

### 7.6 City-Wide Blood Availability Chart

- **Filter Bar:** Dropdown to filter by blood group, search input for hospital/blood bank name.
- **Summary Cards:** 8 cards (one per blood group) showing total units available across the city. Color-coded: green (sufficient), amber (low), red (critical).
- **Detail Table:** Below the cards, a table showing per-hospital breakdown — columns: Hospital/Blood Bank, Location, A+, A-, B+, B-, AB+, AB-, O+, O-, Last Updated.
- **Visualization:** Bar chart (Recharts) showing comparative availability across blood groups.

### 7.7 Donor Portal

- **Profile Section:** Blood group badge, eligibility status (with days until next eligible donation), availability toggle.
- **Urgent Requests Feed:** List of active urgent blood requests from hospitals. Each card shows: hospital name, blood group needed, units needed, urgency level (color-coded badge), distance from donor, "I Can Donate" button.
- **Donation History:** Table of past donations with date, hospital, units donated.

### 7.8 Analytics Dashboard (Admin)

- **Heatmap:** Leaflet map with emergency incident density overlay.
- **Response Time Chart:** Line chart showing average response times over the last 30 days, broken down by zone.
- **Blood Usage Trends:** Area chart showing blood consumption by group over time.
- **System Stats:** Stat cards — Total Emergencies This Month, Active Ambulances, Registered Donors, Hospitals Online.

---

## 8. Component Library

All components follow the design tokens defined above. No emojis. All icons from Lucide React.

### Stat Card
- White surface background, Level 1 shadow, 8px border radius.
- Icon (Lucide) in a soft-colored circle at the top-left.
- Large stat number (32px, bold) below.
- Label text (12px, secondary color) below the number.
- Optional trend indicator (up/down arrow icon with green/red color).

### Alert Card
- Left border accent (4px) colored by severity: red for critical, amber for serious, blue for moderate.
- Ambulance ID, patient condition summary, ETA, and timestamp.
- Action button on the right ("Prepare ER" / "Acknowledge").

### Resource Row
- Horizontal card with hospital name, distance badge, and resource indicators.
- Each resource shown as: icon + count. Color shifts from green to amber to red as availability drops.

### Blood Group Badge
- Pill-shaped badge with the blood group label.
- Background color derived from a consistent mapping (e.g., O- always uses a specific shade).

### Map Markers
- **Ambulance (Idle):** Blue circle with ambulance icon.
- **Ambulance (Transporting):** Pulsing red circle with ambulance icon and directional arrow.
- **Hospital:** White circle with hospital cross icon.
- **Patient SOS:** Pulsing red dot.

### Status Badge
- Pill badge with icon + label.
- Color mapping: Idle = grey, Dispatched = blue, At Scene = amber, Transporting = red (pulsing), Arrived = green.

---

## 9. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| Desktop (1280px+) | Full sidebar + content area |
| Tablet (768px–1279px) | Collapsible sidebar, stacked cards |
| Mobile (below 768px) | Bottom navigation, full-width cards, map takes priority |

The SOS button and ambulance tracking map are prioritized on mobile, ensuring patients in crisis have the fastest possible path to help.

---

## 10. Accessibility

- All interactive elements have visible focus states (2px outline in primary color).
- Color is never the sole indicator — all status badges include text labels alongside color.
- Minimum contrast ratio of 4.5:1 for body text, 3:1 for large text.
- All icons include `aria-label` attributes.
- Map markers include ARIA descriptions for screen readers.
- Form inputs include associated labels and error messages.

---

## 11. Notification Design

| Notification Type | Channel | Visual Treatment |
|---|---|---|
| Ambulance incoming (to hospital) | In-app + SMS | Red left-border alert card with ETA countdown |
| Route clearing (to traffic police) | In-app + SMS | Blue left-border alert card with map preview |
| Urgent blood request (to donors) | Push + SMS | Amber left-border card with "I Can Donate" CTA |
| SOS confirmation (to patient) | In-app | Green confirmation toast with ambulance ETA |
| Resource update confirmation | In-app | Green success toast |

---

## 12. Target Audience

| Audience | Design Priority |
|---|---|
| EMS and Paramedics | Large touch targets, minimal input fields, status-first layout |
| Hospital Operations Staff | Data-dense dashboards, quick-edit resource forms, alert feed |
| Voluntary Blood Donors | Clear urgency indicators, one-tap response, minimal friction |
| Traffic Police | Map-dominant view, high-visibility route overlays, simple acknowledgment |
| Patients and Public | SOS prominence, live tracking, hospital resource visibility |

---

## 13. Future Design Considerations

- **Dark Mode:** For ambulance crews and traffic police working night shifts. Inverted token palette with reduced blue light.
- **AI Smart Routing:** Visual overlay on the map showing AI-recommended routes factoring live traffic.
- **Telemedicine Bridge:** Video call UI embedded in the ambulance crew dashboard, allowing hospital doctors to assess the patient during transit.
- **Multi-Language Support:** Hindi and regional language toggle in the top bar for wider accessibility in underserved regions.
- **Offline Mode:** Cached map tiles and local-first data sync for areas with poor connectivity.
