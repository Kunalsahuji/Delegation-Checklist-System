# Submodule 06: Pre-Site Establishment & Contractor Tendering

## 1. Overview & Objectives
Before heavy civil machinery arrives on site, developers must establish basic physical infrastructure and onboard verified civil, electrical, and MEP contractors through formal Work Orders.

The **Pre-Site Establishment & Contractor Tendering** module manages:
1. **Site Infrastructure Setup** (Borewell water, temporary power meter, site office, security guard room).
2. **Contractor & Subcontractor Directory** (GST, labor license, PF/ESI compliance, trade expertise).
3. **Work Order (WO) Issuance** (Agreed item rates, milestone schedules, retention money clauses).

---

## 2. Key Capabilities & Workflow

```
Site Setup Verification ──> Contractor Qualification ──> Work Package Tendering ──> Work Order (WO)
```

### 2.1 Pre-Site Setup Checklist
- Digital sign-off checklist:
  - Boundary demarcation & fencing.
  - Site engineer cabin and cement storage shed (waterproof).
  - Dedicated electricity line / diesel generator (DG set).
  - Ground water borewell & overhead temporary tank.

### 2.2 Contractor & Vendor Master
- Trade classification: *Earthwork & Excavation*, *Civil RCC & Masonry*, *Plumbing & Sanitary*, *Electrical Infrastructure*, *Roads & Paver Blocks*.
- Verification of GSTIN, PAN, and EPFO/ESIC labor insurance compliance.
- Historical performance rating (1 to 5 stars) based on prior projects.

### 2.3 Work Packages & Work Orders (WO)
- Defining work packages (e.g., *"Package A: Boundary Wall & Main Gatehouse Construction"*).
- Rate contracts with unit rates (per cubic meter of concrete, per sq. ft of plaster).
- Automated generation of legal **Work Orders** with terms:
  - 5% to 10% retention money withheld.
  - Mobilization advance terms and recovery schedule.
  - Liquidated damages / penalty per week for unjustified site delays.

---

## 3. Data Schema Specifications

```javascript
// PmsContractor Entity
{
  contractorId: "CON-CIVIL-009",
  companyName: "Shree Ram Construction Co.",
  contactPerson: "Mahesh Choudhary",
  phone: "9829055443",
  trades: ["Civil RCC", "Masonry", "Plaster"],
  compliance: {
    gstin: "08AABCS1234D1ZP",
    pan: "AABCS1234D",
    laborLicenseValidTill: "2027-03-31"
  },
  rating: 4.8
}

// WorkOrder Entity
{
  workOrderId: "WO-2026-081",
  projectId: "PRJ-EMERALD-VALLEY",
  contractorId: "CON-CIVIL-009",
  packageName: "Boundary Wall & Gatehouse Construction",
  financialTerms: {
    totalEstimatedValue: 4800000,
    retentionMoneyPercent: 5,
    advancePaid: 500000,
    advanceRecoveryPercentPerBill: 10
  },
  milestones: [
    { title: "Foundation & Plinth Complete", targetDate: "2026-09-30", value: 1200000, status: "completed" },
    { title: "Brickwork up to 8ft height", targetDate: "2026-10-31", value: 1800000, status: "in_progress" },
    { title: "Plaster & Coping Complete", targetDate: "2026-11-30", value: 1800000, status: "pending" }
  ],
  status: "active" // draft | active | completed | terminated
}
```

---

## 4. Responsive UI & Interface Breakdown

- **Contractor Directory View:**
  - Fast search by trade (Civil, Electrical, Roads) and status.
  - Mobile: Swipeable contact cards with one-tap phone call (`tel:`) action.
- **Work Order Generator:**
  - Multi-step modal for defining milestone tranches and retention terms.
  - Clean PDF printable view formatted for A4 contract printout.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/contractors`, `POST /api/v1/pms/contractors`, `POST /api/v1/pms/work-orders`.
- Configuration handled via `backend/src/config/index.js`.
