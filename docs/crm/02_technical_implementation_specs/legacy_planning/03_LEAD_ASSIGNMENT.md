# Section 03: Lead Assignment & Distribution

## 1. Overview
The Lead Assignment system controls how raw inquiries and active leads are routed among tele-sales agents, site sales executives, and coordinators. It prevents lead hoarding, ensures equitable distribution, and maintains an unbroken audit history.

---

## 2. Core Functional Requirements
- **Assignment Types**:
  - **Tele-Sales Assignee**: Handles initial calls and qualification screening.
  - **Field Sales Executive (Visit Assignee)**: Assigned once a site visit is confirmed to host the client on-site.
- **Assignment Modes**:
  - **Single Manual Assignment**: From lead/enquiry detail drawer.
  - **Bulk Multi-Select Assignment**: Select multiple rows in table and assign in one batch.
  - **Round-Robin Distribution**: Automatically distribute newly imported bulk leads evenly among active sales team members.
- **Audit & Reassignment Guard**:
  - When reassigning from one salesperson to another, mandatory minimum 15-character reason is required.
  - Preserves full chronological assignment history with timestamp and admin actor.

---

## 3. Data & API Contracts
- `POST /api/v1/crm/leads/:id/assign` — Assign or change primary sales owner.
- `POST /api/v1/crm/leads/:id/assign-visit` — Assign dedicated site visit executive.
- `POST /api/v1/crm/leads/bulk-assign` — Batch assign multiple lead IDs to a user.
- `GET /api/v1/crm/leads/:id/assignments` — Fetch chronological assignment history.

---

## 4. UI/UX Elements
- Dedicated "Reassign Lead" modal displaying previous owner, proposed new owner, and mandatory reason field.
- Bulk distribution panel with user capacity indicators.
