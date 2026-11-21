# Section 06: Follow-ups & Reminders

## 1. Overview
High-value property deals require multiple consistent touchpoints over days and weeks. The Follow-ups module acts as the salesperson's daily operational task list, grouping calls and meetings due today, highlighting overdue tasks, and enabling one-click rescheduling.

---

## 2. Core Functional Requirements
- **Daily Follow-Up Worklist**:
  - Filter views: `Due Today`, `Overdue`, `Upcoming (Next 7 Days)`, `Completed`.
- **Quick Action Bar**:
  - `Log Call Result`: Connected, Not Reachable, Busy, Switched Off.
  - `Snooze / Reschedule`: Push follow-up date by +1 Day, +3 Days, or custom date/time.
  - `Add Quick Remark`: Appends note to history without leaving the list.
- **Overdue Visual Alerts**:
  - Highlighting tasks that have slipped past their scheduled date to prevent lead neglect.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/followups` — List follow-up items with status filters (`today`, `overdue`, `upcoming`).
- `POST /api/v1/crm/followups/:id/complete` — Mark follow-up completed and log call outcome.
- `POST /api/v1/crm/followups/:id/reschedule` — Shift follow-up date with mandatory reason.

---

## 4. UI/UX Elements
- Streamlined compact card layout for rapid dialing and status updates.
- One-click reschedule dropdown buttons.
- Direct quick links into the full Lead/Enquiry details.
