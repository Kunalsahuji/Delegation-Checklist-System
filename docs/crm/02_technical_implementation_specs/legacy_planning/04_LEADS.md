# Section 04: Leads & Stage Pipeline

## 1. Overview
The Leads module is the heartbeat of the CRM. When an enquiry is qualified, it enters the Lead pipeline. Here, it progresses through predefined, ordered stages until it culminates in a booking (Won), drops out (Lost), or the client becomes an affiliated Channel Partner (Convert to Agent).

---

## 2. Core Functional Requirements
- **Enquiry → Lead Conversion**:
  - Automatically transfers all client info, budget, project choice, and previous conversation history.
- **Ordered Stage Pipeline**:
  - `Stage 1`: Discovery / Follow-up Call
  - `Stage 2`: Call for Visit Confirmation
  - `Stage 3`: Visit Confirmed
  - `Stage 4`: Site Visit Conducted
  - `Stage 5`: Feedback & Post-Visit Review
  - `Stage 6`: Negotiation & Token Advance
- **Stage Progression Rules**:
  - **Sequential Move**: Move to next stage with optional planned date, notes, and file attachments.
  - **Role Gating**: Only authorized roles can advance specific stages (e.g. Visit stages require field team authority).
  - **Undo Stage Transition**: Reverts one stage backward with logged reason if accidentally marked.
  - **Activity & Comment Feed**: Full chronological comments, `@mentions`, and attachment drawer.
- **Deal Outcomes**:
  - **Mark WON**: Prompts for booking details: Unit number, booked price, sold area (in Gaj/Yards), closing date, and broker commission.
  - **Mark LOST / DROPPED**: Mandatory drop category (*Budget constraint, Location mismatch, Postponed purchase, Bought from competitor*).
  - **Convert to Agent**: Converts client into a registered Broker in the network.

---

## 3. Data & API Contracts
- `POST /api/v1/crm/leads/from-enquiry/:enquiryId` — Convert qualified enquiry to lead.
- `GET /api/v1/crm/leads` — Query pipeline leads with stage, temperature, and ownership filters.
- `GET /api/v1/crm/leads/:id` — Full lead details, stage state, and customer profile.
- `POST /api/v1/crm/leads/:id/move-stage` — Advance stage with remarks & next planned date.
- `POST /api/v1/crm/leads/:id/undo-stage` — Undo previous stage transition.
- `POST /api/v1/crm/leads/:id/mark-won` — Finalize booking and log deal metrics.
- `POST /api/v1/crm/leads/:id/mark-dropped` — Terminate deal with mandatory reason.
- `POST /api/v1/crm/leads/:id/convert-to-agent` — Convert lead customer to Broker.

---

## 4. UI/UX Elements
- Visual horizontal stage stepper (progress bar) showing completed, current, and upcoming stages.
- Action buttons: `Move Stage`, `Undo`, `Mark Won`, `Drop`, `Reassign`.
- Collapsible tabs for Date History, File Attachments, and Activity Timeline.
