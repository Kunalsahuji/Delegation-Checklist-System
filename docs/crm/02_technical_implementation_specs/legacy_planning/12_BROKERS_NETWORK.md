# Section 12: Brokers & Channel Partner Network

## 1. Overview
Channel partners (external property brokers, agents, and realtors) drive a substantial share of real estate sales. The Brokers module manages partner onboarding, categorization into achievement tiers, tracking their referred leads, and crediting them for closed transactions based on square yards sold.

---

## 2. Core Functional Requirements
- **Broker Master Record**:
  - Full Name, Agency Name, Phone, Email, RERA Registration Number.
  - Assigned Relationship Manager (Internal Company Salesperson).
  - Commission Tier Level (*Bronze, Silver, Gold, Platinum*).
- **Referral Tracking**:
  - Direct association between an Enquiry/Lead and the referring Broker.
  - Phone duplicate validation blocks brokers from re-registering existing direct company leads.
- **Yard Credit & Achievement Tally**:
  - When a referred lead is marked "Won", the sold plot/villa area (in Gaj / Sq. Yards) is automatically credited to the broker's lifetime tally.
  - Upgrades tier level automatically when milestone targets (e.g. > 1,000 Yards sold) are met.
- **Client to Agent Conversion**:
  - Fast one-click action to convert an existing satisfied buyer into an external referral agent.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/brokers` — List brokers with tier, referrals count, and yards sold.
- `POST /api/v1/crm/brokers` — Register new broker.
- `GET /api/v1/crm/brokers/:id/leads` — View all client leads referred by this broker.
- `PATCH /api/v1/crm/brokers/:id/tier` — Update broker level and commission rates.

---

## 4. UI/UX Elements
- Broker directory with search, tier filter, and lifetime metrics.
- Referral performance modal showing past referred clients and deal statuses.
