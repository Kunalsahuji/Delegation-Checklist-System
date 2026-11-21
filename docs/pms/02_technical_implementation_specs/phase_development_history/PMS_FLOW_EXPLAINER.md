# PMS (Project Management System) — Business Flow & Lifecycle Explainer

> **Audience:** Management, Developers, Project Managers, and QA.  
> **Purpose:** Plain-English walkthrough of how land turns into completed real estate developments, how each team participates, and how the system prevents fraud, cost overruns, and timeline delays.

---

## 1. Executive Summary in 60 Seconds

The journey of any real estate project follows a strict 4-act progression:
1. **Act 1: Sourcing & Clearance (Stages 1–4):** Identifying raw land, verifying that the seller has clear title ownership with zero legal disputes, purchasing the land, and mutating revenue records.
2. **Act 2: Licensing & Baseline (Stages 5–7):** Getting layout approvals from town planning bodies, securing RERA licenses, establishing engineering budgets, and locking the project baseline.
3. **Act 3: Execution & Control (Stages 8–10):** Daily site construction via DPRs (labor, material, photos), quality snag checks, and measuring contractor work for monthly billing.
4. **Act 4: Delivery & Handover (Stages 11–13):** Completing units, issuing occupancy certificates, handing over keys to buyers (synced with CRM), and servicing after-sales warranty defects.

---

## 2. Real-World Indian Real Estate Terminology Dictionary

To ensure all developers and stakeholders speak the same language, PMS incorporates standard Indian real estate metrics:

| Term | Full Meaning | Real Estate Context in PMS |
| :--- | :--- | :--- |
| **Bigha / Biswa / Acre** | Land Measurement Units | 1 Acre = 4,840 sq. yards; 1 Bigha varies by state (typically ~1,600–3,025 sq. yards). PMS stores standard sq. yards and displays localized land units. |
| **Khasra & Khatauni** | Land Revenue Records | **Khasra** identifies the specific parcel of agricultural land; **Khatauni** lists the owners and their respective share percentages. |
| **Jamabandi / Fard** | Record of Rights (RoR) | The government land ledger proving historical ownership and cultivating rights. |
| **Encumbrance Certificate (EC)** | Non-Liability Certificate | Issued by the Sub-Registrar confirming whether the property has existing mortgages, bank liens, or legal attachments over the past 30 years. |
| **CLU** | Change of Land Use | Legal conversion granted by the state government allowing agricultural land to be developed for residential/commercial projects. |
| **RERA** | Real Estate Regulatory Authority | Statutory registration number required before advertising, booking, or selling any plot or apartment to the public. |
| **BOQ** | Bill of Quantities | Engineering schedule detailing every bag of cement, ton of steel, and meter of pipe needed to build the project. |
| **DPR** | Daily Progress Report | Daily field submission by site engineers logging weather, active labor headcount, work executed today, and photographic evidence. |
| **MB** | Measurement Book | Formal engineering record containing physical tape measurements of work executed by civil contractors before releasing payment. |
| **RA Bill** | Running Account Bill | Periodic invoice (usually monthly) submitted by contractors claiming payment for verified quantities in the MB minus retention money. |
| **Retention Money** | Security Deposit | 5% to 10% withheld from contractor bills, refunded only after 12 months (Defect Liability Period) if no structural flaws appear. |

---

## 3. Step-by-Step Business Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. PLOT INTAKE: Land scouting, GPS coordinates, seller │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 2. FEASIBILITY: Cost vs revenue, yield analysis        │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 3. LEGAL AUDIT: 4-step title, EC, revenue, advocate op │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 4. PURCHASE & REGISTRY: Token, registry deed, mutation │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 5. GOVT APPROVALS: CLU, town layout sanction, RERA reg │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 6. BASELINE LOCK: BOQ, material & cost budget frozen   │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 7. CONSTRUCTION & DPR: Daily labor, material & photos  │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 8. QUALITY & SNAGS: Inspection checklists & punch lists│
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 9. RA BILLING: MB measurements, retention, payment     │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 10. HANDOVER: Possession letter, buyer keys & CRM link │
   └────────────────────────────────────────────────────────┘
```

### Stage 1 & 2: Land Intake & Feasibility
- Land scouts discover a parcel of land.
- Details entered: Survey number, Khasra number, land area, asking price per bigha.
- Feasibility engine calculates: Total land cost + estimated conversion charges + development cost (roads, water, electrical) vs. saleable area yield. If ROI $\ge 25\%$, it is approved as an **"Approved Plot Package"**.

### Stage 3: Legal Verification Gate
- An advocate conducts a 30-year search at the Sub-Registrar's office.
- The 4-step verification checks:
  1. *Title verification:* Unbroken ownership chain for 30 years.
  2. *Encumbrance check:* Nil encumbrance certificate issued.
  3. *Revenue records:* Name matches revenue ledger without family disputes.
  4. *Advocate legal opinion:* Formal written certificate greenlighting purchase.

### Stage 4: Purchase & Mutation
- Agreement to Sell is drafted; advance token (Bayana) paid.
- Balance paid upon executing the Sale Deed at the Sub-Registrar's office.
- Revenue mutation filed to transfer Patwari ownership records into the developer's entity name.

### Stage 5: Approvals & Master Layout
- Architect prepares 2D master layout and road circulation plan.
- Town Planning Authority sanctions the layout map.
- Environmental, Fire, and Water approvals obtained; RERA registration granted.

### Stage 6: Baseline Lock Engine
- Engineering team prepares the BOQ (Bill of Quantities): total tons of steel, bags of cement, labor hours, and milestone timeline.
- Once approved by the CEO/Director, the **Baseline is LOCKED**.
- If actual steel prices or quantities rise later, engineers cannot casually edit the budget — they must submit an audited **Change Request (CR)** explaining the variance.

### Stage 7: Construction DPR (Daily Progress Reports)
- Every afternoon by 5:00 PM, site engineers open the mobile PMS app.
- They log:
  1. Number of masons, helpers, and carpenters on site today.
  2. Concrete poured (in cubic meters), bricks laid, earth excavated.
  3. Geo-stamped camera photos of the actual foundation/structure.
- The submission takes $<90$ seconds and immediately updates executive dashboards.

### Stage 8: Quality Control & Snags
- Site engineers and third-party inspectors run quality checks (e.g., concrete 28-day cube strength tests).
- If a defect is found (e.g., plaster honeycombing or misaligned brickwork), an inspector raises a **Snag Ticket** with a photo.
- The contractor is assigned to fix it. Once fixed, a rectification photo is uploaded, verified, and the snag is marked closed.

### Stage 9: Contractor Measurement & RA Billing
- At the end of the billing cycle, the engineer and contractor take tape measurements on site and log them into the **Measurement Book (MB)**.
- The contractor submits their **Running Account (RA) Bill**.
- The system automatically checks that billed quantities do not exceed BOQ limits, deducts 5% retention money, applies TDS and GST, and sends it to Accounts for payment disbursement.

### Stage 10: Handover & CRM Link
- Once local authorities issue the Completion Certificate (CC), the customer is invited for a joint walkthrough.
- Any minor touch-up snags are logged and resolved within 7 days.
- The possession letter and physical keys are delivered. The customer record in CRM updates to "Delivered / Handed Over".
