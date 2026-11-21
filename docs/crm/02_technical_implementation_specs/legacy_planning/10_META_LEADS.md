# Section 10: Meta (Facebook / Instagram) Leads Integration

## 1. Overview
Real estate marketing relies heavily on Facebook and Instagram Instant Forms (Lead Ads). The Meta Leads module captures inbound submissions instantly via webhook, maps form fields into TaskFlow enquiries, and distributes them immediately before the lead goes cold.

---

## 2. Core Functional Requirements
- **Webhook Intake**:
  - Secure webhook endpoint listening for Meta Leadgen events.
  - Automatically parses `full_name`, `phone_number`, `email`, `city`, and custom ad question fields.
- **Form-to-Project Mapping**:
  - Configuration page mapping specific Meta Ad Forms or Campaign IDs to specific TaskFlow Projects (e.g. "Ad Form XYZ" → "Green Valley Luxury Villas").
- **Instant Notification & Auto-Assignment**:
  - Creates a new Enquiry record in real-time.
  - Auto-assigns to the available tele-caller on duty.
  - Dispatches an immediate alert notification.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/meta/webhook` — Webhook verification challenge endpoint (Meta requirement).
- `POST /api/v1/crm/meta/webhook` — Real-time lead submission receiver.
- `GET /api/v1/crm/meta/mappings` — List and configure Ad Form to Project rules.
- `POST /api/v1/crm/meta/test-lead` — Developer sandbox tool to simulate Meta lead intake.

---

## 4. UI/UX Elements
- Configuration screen showing active connected Meta forms with status badges.
- Inbound Meta leads feed with ad campaign name tags.
