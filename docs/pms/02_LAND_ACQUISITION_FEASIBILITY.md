# Submodule 02: Land Acquisition & Financial Feasibility

## 1. Overview & Objectives
**Land Acquisition** is the initial gate of any real estate project. Before committing capital, developers must scout candidate land parcels, register physical boundaries, assess zoning constraints, conduct micro-market valuation surveys, and run financial yield models.

The final output of this module is the **"Approved Plot Package"**, which packages all site inspection logs, drone surveys, boundary coordinates, and financial appraisals into a single verified dossier for the Legal Verification team.

---

## 2. Key Capabilities & Functional Workflow

```
Candidate Plot Registered ──> Site Physical Survey ──> Market Analysis ──> Feasibility Model ──> "Approved Plot Package"
```

### 2.1 Plot Scouting & Registry
- **Identification:** Plot Title, Village/Tehsil, Khasra Number, Khatuni details.
- **Physical Dimensions:** Total Area (stored in standard Sq. Yards, convertible to Bigha / Acres / Biswa based on regional preference).
- **Landowner Directory:** Primary owner name, co-sharers, contact numbers, asking price per Bigha.
- **Geo-Mapping:** GPS boundary vertices (Latitude/Longitude polygon points) and Google Maps pinning.

### 2.2 Site Inspection & Survey Logging
- Topography notes (flat, undulating, low-lying waterlogged area).
- Road access check (minimum 30ft / 60ft master plan approach road verification).
- High-tension electrical lines (HT lines) or canal proximity restrictions.
- Photo and drone footage attachment slots.

### 2.3 Micro-Market Rate Survey
- Competitor property pricing within a 5 km radius.
- Historical registry circle rates vs. actual market transaction rates.
- Expected sales price realization per sq. yard for developed residential plots or villas.

### 2.4 Financial Feasibility Engine
The built-in financial calculator evaluates project viability:
$$\text{Total Capital Outlay} = \text{Land Cost} + \text{Govt Stamp \& CLU Fees} + \text{Development Cost (Roads, Drainage, Power)} + \text{Contingency}$$
$$\text{Saleable Yield} = \text{Gross Land Area} \times (1 - \text{Roads \& Green Belt Deduction } [\%])$$
$$\text{Projected Revenue} = \text{Saleable Area} \times \text{Expected Realization Rate}$$
$$\text{Projected ROI } [\%] = \frac{\text{Projected Revenue} - \text{Total Capital Outlay}}{\text{Total Capital Outlay}} \times 100$$
- If $\text{Projected ROI} \ge 25\%$ and minimum approach road requirements are satisfied, the module enables the **"Generate Approved Plot Package"** button.

---

## 3. Data Schema Specifications

```javascript
// LandPlot Entity
{
  plotId: "PLT-JAIPUR-2026-004",
  projectId: "PRJ-EMERALD-VALLEY",
  location: {
    village: "Amer Tehsil",
    khasraNumbers: ["104/1", "104/2", "105"],
    coordinates: [
      { lat: 26.9855, lng: 75.8507 },
      { lat: 26.9862, lng: 75.8521 },
      { lat: 26.9841, lng: 75.8530 }
    ],
    totalAreaSqYards: 24200, // ~5 Bigha
    roadWidthFeet: 60
  },
  landowner: {
    primaryName: "Ramswaroop Sharma",
    phone: "9829011122",
    expectedPricePerSqYard: 6500,
    brokerAssigned: "BRK-0012"
  },
  feasibility: {
    landCost: 157300000,
    developmentCost: 48000000,
    saleableAreaSqYards: 15730, // 65% yield after road deductions
    projectedSalesRate: 18500,
    grossRealization: 291005000,
    netProfit: 85705000,
    projectedROI: 41.7, // Percentage
    status: "approved" // under_review | approved | rejected
  },
  status: "feasibilityDone", // identified | visitScheduled | visited | underAnalysis | feasibilityDone | approved | handedOverToLegal
  approvedPackageGenerated: true
}
```

---

## 4. Responsive UI & Screen Breakdown

- **Plot Registry Table (`/pms/land-acquisition`):**
  - Desktop: Displays Khasra, Area, Road Width, Landowner, Expected Cost, Status, and Action buttons.
  - Mobile: Collapses into expandable cards showing Plot ID, Area (in Bighas), Status Pill, and a primary "View Feasibility" button.
- **Feasibility Calculator Modal:**
  - Auto-calculates yields and margins in real-time as users modify asking prices or road widths without requiring page reload.
  - Full-screen scrollable drawer on mobile with large numeric inputs.

---

## 5. Security & Configuration Implementation
- Configured endpoints: `GET /api/v1/pms/plots`, `POST /api/v1/pms/plots`, `POST /api/v1/pms/plots/:id/feasibility`.
- Handled via `backend/src/config/index.js`; no raw environment variables in calculations or controllers.
- Role Access:
  - *Land Acquisition Managers:* Create/Edit plots and perform market analysis.
  - *Directors / CEOs:* Authorize the final "Approved Plot Package".
