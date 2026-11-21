# Submodule 03: Legal Due Diligence & 4-Stage Verification Engine

## 1. Overview & Objectives
Real estate developments face severe financial and legal risk if land is purchased with disputed titles, pending litigations, undisclosed mortgages, or fraudulent revenue entries.

The **Legal Verification Engine** in PMS enforces an unbreakable, audited 4-stage legal review process. It consumes the **Approved Plot Package** from Land Acquisition (`POST /api/v1/pms/legal-cases/from-plot`) and prevents any advance payments or land registries until all 4 verification stages receive a clean advocate legal opinion.

---

## 2. Key Capabilities & 4-Stage Legal Workflow

```
[Approved Plot Package] ──> Create LegalCase
                                │
        ┌───────────────────────┼───────────────────────┬───────────────────────┐
        ▼                       ▼                       ▼                       ▼
Stage 1: Title Search   Stage 2: Encumbrance    Stage 3: Revenue Docs   Stage 4: Legal Opinion
(30-yr chain of title)  (Sub-Registrar Search)  (Jamabandi, Khasra)     (Advocate Signature)
        └───────────────────────┬───────────────────────┴───────────────────────┘
                                │
                                ▼
                   [Director PM Approval Gate]
                                │
                    (Advance to Land Purchase)
```

### 2.1 Stage 1: Title Search & Ownership Chain
- Verifies a continuous, unbroken 30-year chain of title ownership deeds.
- Identifies ancestral vs. self-acquired property status.
- Validates minor's rights, Hindu Undivided Family (HUF) claims, and legal heir succession certificates.

### 2.2 Stage 2: Encumbrance Verification (EC Check)
- Conducts searches at the Sub-Registrar’s Office for past 30 years (Forms 15 and 16).
- Checks for active bank mortgages, bank liens, court attachments, or recovery proceedings.
- Verifies that no prior unregistered Agreements to Sell (Bayana) or Powers of Attorney (POA) are active on the plot.

### 2.3 Stage 3: Revenue Documents & Physical Mutation
- Cross-references Jamabandi / Fard (Record of Rights).
- Checks Khasra / Girdawari entries for tenancy rights or agricultural disputes.
- Inspects Government Gazette records for past or proposed government acquisitions (National Highway authority, railway corridors, defense buffer zones).

### 2.4 Stage 4: Advocate Legal Opinion & Decision Gate
- Appointed panel advocate reviews all uploaded documents in the encrypted document vault.
- Issues a formal, digitally signed **Legal Search & Title Report**:
  - `Clean & Marketable Title`: Safe to proceed with purchase.
  - `Conditional / Rectifiable Issues`: Requires specific affidavits, release deeds, or indemnity bonds before purchase.
  - `Defective / High Risk`: Title disputed or non-marketable. Advance is blocked immediately.
- Final sign-off by **Legal Head** and **Managing Director**.

---

## 3. Data Schema & Contracts

```javascript
// LegalCase Entity
{
  caseId: "LEG-JAIPUR-2026-004",
  plotId: "PLT-JAIPUR-2026-004",
  projectId: "PRJ-EMERALD-VALLEY",
  advocateAssigned: {
    name: "Adv. K.S. Rathore & Associates",
    barCouncilEnrollment: "R-1092/2004",
    phone: "9829099887"
  },
  stages: {
    titleVerification: {
      status: "cleared", // pending | in_progress | cleared | flagged
      chainYearsVerified: 30,
      notes: "Chain verified from 1996 till 2026. Prior sale deeds registered without gaps."
    },
    encumbranceCheck: {
      status: "cleared",
      certificateNumber: "EC-2026-98112",
      validTillDate: "2026-06-30",
      bankLiensFound: false
    },
    revenueVerification: {
      status: "cleared",
      jamabandiYear: "2024-2025",
      mutationNumber: "982/Amer",
      tenancyDisputesFound: false
    },
    legalOpinion: {
      status: "approved",
      opinionType: "clean_and_marketable", // clean_and_marketable | conditional | defective
      opinionSummary: "Title is completely clean, marketable, and free from all encumbrances.",
      signedDate: "2026-03-04T00:00:00.000Z",
      opinionDocumentUrl: "/uploads/legal/opinion-plt-004.pdf"
    }
  },
  overallStatus: "approved", // in_review | query_raised | approved | rejected
  directorSignOff: {
    signedBy: "USR-DIR-001",
    signedAt: "2026-03-05T11:30:00.000Z"
  }
}
```

---

## 4. Responsive UI & Interface Breakdown

- **4-Stage Stepper View:**
  - Desktop: Horizontal card layout displaying all 4 stages simultaneously with status indicators and document download links.
  - Mobile: Interactive tabbed accordion allowing legal executives to toggle between Title, EC, Revenue, and Opinion tabs with large tap targets.
- **Document Vault:**
  - Upload component with PDF and image preview support.
  - Sticky bottom action bar on mobile with clear "Authorize Purchase" or "Raise Legal Query" buttons.

---

## 5. Security & Configuration Implementation
- Endpoints: `POST /api/v1/pms/legal-cases/from-plot`, `GET /api/v1/pms/legal-cases/:id`, `PATCH /api/v1/pms/legal-cases/:id/stage`.
- Configuration handled cleanly through `backend/src/config/index.js`.
- Strict RBAC: Only users with `pms:legal:sign` role can submit legal opinions; only Directors can grant final purchase clearance.
