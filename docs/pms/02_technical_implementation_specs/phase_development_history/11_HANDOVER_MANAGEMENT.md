# Submodule 11: Handover Management & Customer Delivery

## 1. Overview & Objectives
The final act of the real estate development lifecycle is **Customer Handover**. This phase links construction completion back into the CRM sales journey.

The **Handover Management & Customer Delivery** module manages:
1. Completion Certificate (CC) & Occupancy Certificate (OC) verification.
2. Final deep cleaning and pre-possession snag punch-list clearance.
3. Joint customer walkthrough and signed inspection checklist.
4. Possession Letter, physical key handover protocol, and CRM status synchronization.
5. Defect Liability Period (DLP) warranty servicing (12-month post-handover warranty).

---

## 2. Key Capabilities & Workflow

```
Statutory OC/CC Received ──> Joint Walkthrough ──> Snag Sign-off ──> Key Handover ──> CRM Status Sync
```

### 2.1 Statutory Occupancy Certificate (OC)
- Tracks issuance of official Occupancy Certificate from local municipal authority certifying the building is fit for habitation.
- Ensures all permanent electrical meters and municipal water connections are activated.

### 2.2 Customer Pre-Possession Walkthrough
- Joint on-site inspection between the buyer and the Handover Manager.
- 40-point digital checklist:
  - Sanitary fittings check (water pressure, leak checks).
  - Electrical switches, MCB tripping check, socket power.
  - Door lock alignment, window sliding smoothness.
  - Tile hollow sound check and wall paint finish.

### 2.3 Key Handover & Possession Letter
- Verification of Zero Financial Dues (Accounts NOC confirming all buyer installment milestones are paid in CRM).
- Digital generation of official **Possession Letter**.
- Physical handover kit: Brass keys, electrical circuit diagrams, appliance warranty cards, maintenance society welcome kit.

### 2.4 CRM Synchronization & Defect Liability Period (DLP)
- Automatic webhook/event sent to CRM: Updates buyer status to `"Possession Taken"`.
- Activates the 12-Month Defect Liability Period (DLP):
  - Buyer can raise post-handover maintenance tickets (e.g., plumbing seepage, door hinge adjustment).
  - Automatically routes tickets to the contractor before retention money is released.

---

## 3. Data Schema Specifications

```javascript
// ProjectHandover Entity
{
  handoverId: "HND-2026-042",
  projectId: "PRJ-EMERALD-VALLEY",
  unitNumber: "Villa-12",
  buyerDetails: {
    crmLeadId: "LD-TEST-1794899636153-2",
    buyerName: "Sunita Meena",
    phone: "9829022222"
  },
  statutoryClearances: {
    occupancyCertificateNumber: "OC/2026/891",
    grantedDate: "2026-11-01T00:00:00.000Z",
    electricityMeterInstalled: true,
    waterConnectionActive: true
  },
  walkthroughInspection: {
    conductedDate: "2026-11-10T00:00:00.000Z",
    handoverManager: "USR-MGR-008",
    customerFeedbackRating: 5,
    minorSnagsReported: 0,
    customerSignatureUrl: "/uploads/handover/signatures/villa12-sunita.png"
  },
  possessionExecution: {
    accountsDuesCleared: true,
    accountsNocRef: "NOC-ACC-901",
    possessionLetterUrl: "/uploads/handover/possession-villa12.pdf",
    keyHandoverDate: "2026-11-15T11:00:00.000Z"
  },
  defectLiabilityPeriod: {
    startDate: "2026-11-15",
    endDate: "2027-11-14",
    openTicketsCount: 0
  },
  status: "completed" // scheduled | inspected | possession_delivered | dlp_active
}
```

---

## 4. Responsive UI & Interface Breakdown

- **Handover Checklist View:**
  - Fast touch-friendly checklist switches (`Yes / No / Rectify`) designed for tablet and mobile site walkthroughs.
  - Digital canvas for capturing customer signature directly on mobile/tablet screens.
- **Handover Dossier Preview:**
  - One-click PDF generation of the official Possession Certificate with company letterhead and security QR code.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/handover`, `POST /api/v1/pms/handover`, `POST /api/v1/pms/handover/:id/complete`.
- Configuration handled via `backend/src/config/index.js`.
- Security rule: Possession Letter cannot be generated unless `accountsDuesCleared` is verified by the Accounts department.
