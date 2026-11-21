# Section 09: Bulk Messaging & Broadcast Campaigns

## 1. Overview
The Bulk Message module allows sales operations to broadcast announcements, festival offers, new project launches, and price revision alerts to targeted segments of clients via WhatsApp and SMS without manual copy-pasting.

---

## 2. Core Functional Requirements
- **Audience Segmentation**:
  - Filter target recipients by:
    - Status (*All Enquiries, Active Leads, Dropped Leads*).
    - Temperature (*Hot, Warm, Cold*).
    - Project interest.
    - Budget range.
- **Message Templates**:
  - Pre-approved templates with dynamic merge tags:
    - `{{client_name}}`, `{{project_name}}`, `{{sales_rep_name}}`, `{{brochure_link}}`.
- **Campaign Execution & Delivery Logs**:
  - Previews sample personalized message before sending.
  - Logs send status (*Queued, Sent, Delivered, Failed*) per recipient.
  - Rate-limited queue to prevent carrier/WhatsApp API spam throttling.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/bulk-messages/templates` — List approved message templates.
- `POST /api/v1/crm/bulk-messages/campaigns` — Create and trigger a broadcast campaign with audience filters.
- `GET /api/v1/crm/bulk-messages/campaigns/:id` — View real-time dispatch progress and delivery statistics.

---

## 4. UI/UX Elements
- 3-Step Wizard:
  1. *Select Audience* (shows recipient count count badge in real-time).
  2. *Compose Message / Pick Template* (with live preview).
  3. *Review & Send*.
