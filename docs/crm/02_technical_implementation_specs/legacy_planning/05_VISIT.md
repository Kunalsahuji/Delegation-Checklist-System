# Section 05: Field Visits & Reports

## 1. Overview
In real estate sales, the physical site visit is the single most decisive conversion event. The Visits module schedules client project tours, assigns field representatives, validates that the executive was physically at the project site via GPS geo-fencing, and captures the client's visit feedback report.

---

## 2. Core Functional Requirements
- **Visit Scheduling**:
  - Sets visit date, time slot, pickup requirement, and assigned Project.
  - Designates the Field Sales Executive responsible for hosting the tour.
- **GPS Geo-Fenced Validation**:
  - When the field executive submits the Visit Report, their device coordinates (latitude/longitude) are checked against the Project's master geo-coordinates.
  - System flags reports submitted outside the project perimeter with an alert badge to ensure physical accountability.
- **Site Visit Report (SVR)**:
  - Units/Villas physically inspected.
  - Client interest level (*High, Medium, Low*).
  - Objections raised (*Road access, Pricing, Unit orientation, Vastu, etc.*).
  - Next recommended step (*Follow-up call, Send layout drawings, Token meeting*).

---

## 3. Data & API Contracts
- `POST /api/v1/crm/leads/:id/schedule-visit` — Schedule a site visit date/time.
- `GET /api/v1/crm/visits` — List all scheduled, completed, and missed visits.
- `POST /api/v1/crm/leads/:id/visit-report` — Submit completed visit report with coordinates.
- `GET /api/v1/crm/leads/:id/visit-reports` — View visit history for a specific lead.

---

## 4. UI/UX Elements
- "Scheduled Visits" board with date filter (Today, Upcoming, Completed).
- Visit Report modal with quick-select chips for units inspected, client sentiment, and photo attachment upload.
