# Submodule 04: Land Purchase & Sub-Registrar Execution

## 1. Overview & Objectives
Once a land parcel passes the 4-stage Legal Due Diligence gate, it moves into commercial closing: **Land Purchase & Registry**. This module tracks the contractual commitment, payment milestone schedule to the landowners, registry execution at the Sub-Registrar's Office, stamp duty payments, and revenue mutation (Dakhil-Kharij).

---

## 2. Key Capabilities & Workflow

```
Agreement to Sell (Bayana) ──> Payment Milestone Tracker ──> Sub-Registrar Execution ──> Revenue Mutation
```

### 2.1 Agreement to Sell (Bayana)
- Contract generation with agreed payment schedules (Token advance, First milestone, Final registry payout).
- Seller conditions: Delivery of vacant physical possession, clearing outstanding electricity/irrigation bills, removal of encroachments.

### 2.2 Payment Milestone Management
- Multi-tranche payment tracker linked to project accounts.
- Milestone reminders to prevent default penalties under the Agreement to Sell.
- Bank disbursement / Cheque / RTGS logging with transaction reference IDs.

### 2.3 Sub-Registrar Registry Execution
- Calculation of Government Stamp Duty, Registration Fee, and Municipal Surcharges based on Circle Rates.
- Sub-Registrar appointment booking and biometric witness attendance logging.
- Upload of registered Sale Deed (Khatoni/Bahi number, Book 1 volume registration).

### 2.4 Revenue Mutation (Dakhil-Kharij)
- Formal application tracking to the local Tehsil / Patwari office.
- Mutation approval tracking to ensure government records officially show the developer entity as the sole legal titleholder.

---

## 3. Data Schema Specifications

```javascript
// LandPurchase Entity
{
  purchaseId: "PUR-2026-004",
  plotId: "PLT-JAIPUR-2026-004",
  projectId: "PRJ-EMERALD-VALLEY",
  sellerDetails: {
    name: "Ramswaroop Sharma",
    panNumber: "ABCPS1234F",
    bankAccount: "50200012345678"
  },
  financials: {
    totalAgreedPrice: 157300000,
    stampDutyPaid: 9438000, // 6% stamp duty
    registrationFeePaid: 1573000, // 1%
    paymentSchedule: [
      { tranche: "Token Advance (Bayana)", amount: 15000000, dueDate: "2026-03-10", status: "paid", txRef: "HDFC98124" },
      { tranche: "At Registry Execution", amount: 142300000, dueDate: "2026-04-15", status: "paid", txRef: "RTGS-AXIS-0091" }
    ]
  },
  registryExecution: {
    subRegistrarOffice: "Sub-Registrar Amer-1",
    saleDeedNumber: "2026/AMER/1842",
    registrationDate: "2026-04-15T00:00:00.000Z",
    registeredSaleDeedUrl: "/uploads/registry/sale-deed-plt-004.pdf"
  },
  revenueMutation: {
    applicationNumber: "MUT-2026-781",
    patwariHalka: "Amer South",
    mutationDate: "2026-05-02T00:00:00.000Z",
    status: "mutated" // pending | applied | mutated | rejected
  }
}
```

---

## 4. Responsive UI & Screen Breakdown

- **Financial Progress Card:**
  - Progress bar showing Percentage Paid vs. Outstanding Balance.
  - Mobile: Clean numerical readout with large readable INR formatting (`₹15.73 Cr Total`).
- **Milestone Timeline:**
  - Vertical timeline on mobile, horizontal flow on desktop.
  - Integrated "Mark Tranche Paid" modal with payment receipt photo attachment.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/purchases`, `POST /api/v1/pms/purchases`, `PATCH /api/v1/pms/purchases/:id/milestone`.
- Environment configurations (e.g. payment alerts, accounting webhooks) managed strictly via `backend/src/config/index.js`.
