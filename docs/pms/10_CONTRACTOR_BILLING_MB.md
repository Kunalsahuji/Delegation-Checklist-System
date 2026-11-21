# Submodule 10: Contractor Measurement Book (MB) & RA Billing

## 1. Overview & Objectives
Civil contractors are paid based on physically executed quantities measured in the field. To eliminate fraud, over-billing, and ghost measurements, civil engineering relies on the **Measurement Book (MB)** and **Running Account (RA) Bills**.

The **Contractor Measurement Book & RA Billing** module manages:
1. Joint physical measurements logged in the digital Measurement Book.
2. Verification against BOQ limits (preventing billing beyond approved quantities).
3. Automatic deduction calculation (Retention Money, Advance Recovery, TDS, GST).
4. Dual-approval disbursement gate (Site Engineer technical certification $\rightarrow$ Accounts release).

---

## 2. Key Capabilities & Workflow

```
Site Tape Measurements (MB) ──> RA Bill Submission ──> BOQ Cap Check & Deductions ──> Accounts Payout
```

### 2.1 Digital Measurement Book (MB) Entries
- Field measurements: $\text{Length} \times \text{Breadth} \times \text{Height/Depth} = \text{Total Quantity}$.
- Item code reference matching Work Order rate items (e.g., Cu.M of RCC, Sq.Ft of Plaster).
- Joint sign-off by Contractor Foreman and Site Engineer.

### 2.2 Running Account (RA) Bill Generation
- Periodic billing (RA Bill 01, RA Bill 02, etc.).
- Aggregates all approved MB items executed during the billing cycle.
- Calculates:
  - **Gross Value of Work Done (GVWD)**.
  - Prior cumulative payments already disbursed.
  - Net bill amount payable for current period.

### 2.3 Statutory & Contractual Deductions Engine
The billing engine automatically calculates:
$$\text{Net Payable} = \text{Gross Billed} - \text{Retention Money } (5\%) - \text{Advance Recovery } (10\%) - \text{TDS } (1\%\text{ or }2\%) + \text{GST } (18\%)$$
- Retained funds are sequestered in an internal retention escrow ledger until final project handover.

---

## 3. Data Schema Specifications

```javascript
// ContractorBill Entity
{
  billId: "RAB-2026-012",
  workOrderId: "WO-2026-081",
  projectId: "PRJ-EMERALD-VALLEY",
  contractorId: "CON-CIVIL-009",
  billNumber: "RA-03",
  billingPeriod: {
    startDate: "2026-10-01",
    endDate: "2026-10-31"
  },
  financials: {
    grossWorkDone: 1450000,
    deductions: {
      retentionMoneyAmount: 72500, // 5%
      advanceRecoveryAmount: 145000, // 10%
      tdsAmount: 29000, // 2% under Sec 194C
      safetyPenalties: 0
    },
    gstAmount: 261000, // 18%
    netPayableAmount: 1464500
  },
  approvals: {
    engineerCertified: { certifiedBy: "USR-ENG-005", date: "2026-11-02T10:00:00.000Z" },
    projectManagerApproved: { approvedBy: "USR-PM-002", date: "2026-11-03T14:30:00.000Z" },
    accountsDisbursed: { status: "paid", txReference: "CMS-NEFT-908124", date: "2026-11-05T16:00:00.000Z" }
  },
  status: "paid" // submitted | certified | approved | paid | rejected
}
```

---

## 4. Responsive UI & Interface Breakdown

- **Interactive Bill Breakdown Card:**
  - Clear summary breakdown: Gross $\rightarrow$ Deductions $\rightarrow$ Taxes $\rightarrow$ Net.
  - Mobile: Clean accordion with formatted currency (`₹14.64 Lakhs`) and one-click PDF voucher download.
- **MB Measurement Sheet Grid:**
  - Excel-style quick inline numeric inputs with auto-sum columns.
  - Horizontal scrolling wrapped in `.overflow-x-auto` with sticky description column.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/bills`, `POST /api/v1/pms/bills`, `POST /api/v1/pms/bills/:id/certify`, `POST /api/v1/pms/bills/:id/pay`.
- Configuration handled via `backend/src/config/index.js`.
- Security rule: No bill can be approved for payment without prior digital certification from the verified Site Engineer.
