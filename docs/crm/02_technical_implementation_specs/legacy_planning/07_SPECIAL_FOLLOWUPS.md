# Section 07: Special & VIP Follow-ups

## 1. Overview
Certain prospects warrant escalated executive attention: ultra-high-budget buyers, institutional investors, VIP referrals, or deals on the verge of closing. The Special Follow-ups module isolates these high-stake leads so sales leaders and senior negotiators can monitor them closely.

---

## 2. Core Functional Requirements
- **Criteria for Special Follow-up**:
  - Deals with budget above VIP threshold (e.g. > ₹2 Crore / luxury villas).
  - Explicit "VIP / Hot" priority flag set by management.
  - Deals stagnating at the final Negotiation stage for > 7 days.
- **Supervisor Oversight**:
  - Sales HOD / Director can add supervisory directives directly to the lead card.
  - Automated alert sent to executive if a VIP follow-up is missed by even 2 hours.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/special-followups` — Fetch VIP and high-value pipeline items.
- `POST /api/v1/crm/special-followups/:id/flag` — Flag or unflag a lead as a Special Follow-up.
- `POST /api/v1/crm/special-followups/:id/directive` — Add senior management directive.

---

## 4. UI/UX Elements
- Dedicated badge styling with gold/amber border.
- Highlighted banner in the top navigation when overdue VIP follow-ups exist.
