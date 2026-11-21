# Section 08: Unified CRM Calendar

## 1. Overview
The Calendar module provides a bird's-eye temporal view of all customer-facing appointments across the sales team. Instead of looking through separate tables, reps and managers see all Scheduled Site Visits, Planned Follow-up Calls, and Deal Deadlines on an interactive month, week, or day calendar.

---

## 2. Core Functional Requirements
- **Aggregated Event Types**:
  - `Site Visits`: Marked in Green (with Project and client name).
  - `Follow-up Calls`: Marked in Blue.
  - `Overdue Items`: Highlighted in Red.
- **Calendar Views**:
  - **Month View**: Macro view of activity density and upcoming visit clusters.
  - **Week / Day View**: Time-blocked schedule for field executives.
- **Interactive Capabilities**:
  - Clicking any event opens a quick drawer with client info, phone number, and action buttons.
  - Drag-and-drop or click to reschedule appointment dates.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/calendar/events?from=...&to=...` — Returns composite events array (reminders, visits, stage deadlines) scoped to date range and user permissions.

---

## 4. UI/UX Elements
- Modern responsive calendar grid with month/week/day toggles.
- Filter chips to toggle specific event types (Visits only, Calls only).
- Quick detail popup on date cell click.
