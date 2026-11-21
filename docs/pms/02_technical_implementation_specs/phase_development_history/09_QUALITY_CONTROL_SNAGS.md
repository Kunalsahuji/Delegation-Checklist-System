# Submodule 09: Quality Assurance & Snag Lifecycle Management

## 1. Overview & Objectives
Maintaining engineering standards and structural safety requires systematic quality inspections. When construction defects (honeycombing, surface cracks, plumb deviations, or electrical conduit misalignment) occur, they must be resolved immediately before milestone payments are approved.

The **Quality Assurance & Snag Lifecycle Management** module enforces:
1. Phase-wise digital inspection checklists (e.g., Concrete Pre-Pour check, Plaster plumb check).
2. The closed-loop **Snag Lifecycle**: Raise defect $\rightarrow$ Assign to Contractor $\rightarrow$ Contractor Rectification $\rightarrow$ Photo Proof $\rightarrow$ Verify & Close.
3. Defect severity classification (Critical, Major, Minor).

---

## 2. Key Capabilities & 5-Step Snag Workflow

```
[Quality Inspector detects defect]
               │
               ▼
1. RAISE SNAG (Description, Severity, Location, Defect Photo)
               │
               ▼
2. ASSIGN (Designated Contractor with Target Rectification Date)
               │
               ▼
3. RECTIFICATION (Contractor fixes work, submits Rectified Photo)
               │
               ▼
4. VERIFICATION (Inspector re-inspects on site, checks tolerances)
               │
               ▼
5. CLOSE SNAG (Marked resolved; unlocks contractor milestone payment)
```

### 2.1 Inspection Checklists
Pre-configured civil checklists:
- **Pre-Pour Concrete Inspection:** Shuttering alignment, cover blocks placed, rebar spacing, cleanliness of formwork.
- **Post-Demoulding Inspection:** Honeycombing check, curing water ponding, dimension check.
- **Masonry & Plaster Inspection:** Right-angle check, chicken-mesh wire installed at brick-RCC joints, smooth float finish.

### 2.2 The 5-Step Snag Lifecycle
Every defect ticket follows a strict state transition:
1. `OPEN`: Defect captured with compulsory visual photograph and GPS location.
2. `ASSIGNED`: Linked to the responsible trade contractor and site foreman.
3. `RECTIFIED`: Contractor submits before-and-after photo evidence.
4. `VERIFIED`: Quality engineer performs physical re-test.
5. `CLOSED`: Sign-off logged; defect archived in quality compliance ledger.

---

## 3. Data Schema Specifications

```javascript
// QualitySnag Entity
{
  snagId: "SNG-2026-089",
  projectId: "PRJ-EMERALD-VALLEY",
  location: "Villa 12, First Floor Master Bedroom",
  severity: "major", // critical | major | minor
  category: "plaster_cracks",
  description: "Diagonal settlement crack visible near lintel beam joint.",
  contractorAssigned: "CON-CIVIL-009",
  targetClosureDate: "2026-11-25T00:00:00.000Z",
  lifecycle: {
    raisedBy: "USR-QA-003",
    raisedAt: "2026-11-18T10:15:00.000Z",
    initialPhotoUrl: "/uploads/snags/sng-089-defect.jpg",
    rectifiedPhotoUrl: null,
    rectifiedAt: null,
    closedBy: null,
    closedAt: null
  },
  status: "assigned" // open | assigned | in_rectification | verified | closed
}
```

---

## 4. Responsive UI & Interface Breakdown

- **Snag Punch List:**
  - Card-based filterable list by severity (`Critical` Rose, `Major` Amber, `Minor` Blue).
  - Quick action buttons: "Upload Rectification Photo" and "Verify & Close".
- **Visual Comparison Modal:**
  - Side-by-side or before/after slider showing Initial Defect Photo vs. Rectification Photo.
  - Fully responsive on mobile screens with pinch-to-zoom support.

---

## 5. Security & Configuration Implementation
- Endpoints: `GET /api/v1/pms/snags`, `POST /api/v1/pms/snags`, `PATCH /api/v1/pms/snags/:id/rectify`, `PATCH /api/v1/pms/snags/:id/close`.
- Configuration handled via `backend/src/config/index.js`.
- Milestone Payment Block: If a contractor has overdue `critical` snags, the system automatically warns the billing engineer and halts RA bill approval.
