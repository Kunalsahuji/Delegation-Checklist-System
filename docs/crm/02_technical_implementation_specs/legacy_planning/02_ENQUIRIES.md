# Section 02: Enquiry Intake & Qualification

## 1. Overview
The Enquiries module is the top of the funnel. It captures all initial expressions of interest before they are verified. Tele-sales teams work in this module to qualify prospects and determine whether they meet the criteria to enter the active sales pipeline.

---

## 2. Core Functional Requirements
- **Intake Sources**:
  - Manual New Enquiry Form (Single entry).
  - Bulk CSV/Excel Import with validation.
  - Direct Walk-in registration.
- **Phone Duplicate Prevention**:
  - Real-time lookup on mobile number entry.
  - If phone exists on an active lead or registered broker, flags duplicate and allows viewing existing file instead of creating conflicting records.
- **Key Fields**:
  - Client Name, Mobile, Alternate Phone, Email.
  - Source (*Meta Ads, Walk-in, Broker Reference, Direct, etc.*).
  - Interested Project, Property Type (*Villa, Plot, Apartment*).
  - Budget Min & Max.
  - Client Temperature (*Hot, Warm, Cold*).
  - Next Follow-up Date & Time.
- **Qualification Workflow**:
  - **Mark Qualified**: Confirms buyer eligibility and triggers prompt to convert to active Lead.
  - **Mark Not Qualified (Rejected)**: Captures reason (*Budget too low, Out of area, Invalid number*). Can be reopened later.
  - **Put On Hold**: Client requested call-back at a future date.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/enquiries` — Filter by status, source, temperature, date range, search query.
- `POST /api/v1/crm/enquiries` — Create new enquiry with duplicate check.
- `GET /api/v1/crm/enquiries/check-phone?phone=...` — Duplicate check endpoint.
- `PATCH /api/v1/crm/enquiries/:id` — Update client info, budget, or remarks.
- `POST /api/v1/crm/enquiries/:id/qualify` — Mark qualified with screening answers.
- `POST /api/v1/crm/enquiries/:id/reject` — Mark rejected with reason.
- `POST /api/v1/crm/enquiries/bulk-import` — Upload and parse spreadsheet of leads.

---

## 4. UI/UX Elements
- Data table with color-coded status badges and temperature indicators.
- Side drawer modal for comprehensive enquiry details and qualification questions.
- Fast inline action buttons (*Call, Remark, Qualify, Reschedule*).
