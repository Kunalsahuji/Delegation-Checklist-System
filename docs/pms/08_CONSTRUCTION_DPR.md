# Submodule 08: Construction Execution & Daily Progress Reports (DPR)

## 1. Overview & Objectives
The **Daily Progress Report (DPR)** is the **highest-traffic module** in the entire PMS. 

Every afternoon between 4:00 PM and 6:00 PM, site engineers on active construction sites need to report daily operations. To ensure 100% daily compliance, this interface is engineered **mobile-first** with large touch targets, automated labor tallying, fast camera photo uploads, and an end-to-end submission time of **under 90 seconds**.

---

## 2. Key Capabilities & Fast 90-Second Workflow

```
[4:30 PM: Site Engineer opens Mobile App]
       │
       ▼
Step 1: Manpower Headcount (Masons, Helpers, Carpenters, Operators)
       │
       ▼
Step 2: Material Consumption (Cement bags poured, Steel used, Sand truckloads)
       │
       ▼
Step 3: Work Activities Done (Foundation concrete poured, Boundary brickwork)
       │
       ▼
Step 4: Geo-Stamped Camera Photos (2 to 4 photos with automatic GPS stamp)
       │
       ▼
[Tap "Submit Today's DPR" — Done in < 90 Seconds]
```

### 2.1 Manpower & Labor Attendance Log
- Fast numerical stepper inputs:
  - Skilled Labor (Masons, Barbenders, Shuttering Carpenters, Plumbers, Electricians).
  - Unskilled Labor (Male Helpers, Female Helpers, Earthwork Excavators).
  - Machine Operators & Supervisory Staff.
- Automatically calculates total site workforce for the day.

### 2.2 Material Consumption Recording
- Fast select dropdown of project materials (e.g., Cement Bags, Rebar Steel, Bricks).
- Incremental quantity entry deducting in real-time from site inventory.
- Highlights over-consumption warnings if daily consumption exceeds standard engineering coefficients.

### 2.3 Executed Work & Machinery Hours
- Activity checklist: Excavation, PCC, RCC Raft, Brickwork, Internal Plaster, Road WBM base.
- Heavy machinery hours logged (JCB hours, Concrete Transit Mixer trips, Excavator hours).

### 2.4 Geo-Stamped Photo Proof
- Native mobile camera trigger allowing direct photo capture.
- Automated client-side stamping:
  - Project Name
  - Timestamp (IST)
  - GPS Coordinates (Latitude, Longitude)
- Instant image compression to under 300KB before transmission to ensure high speed on low-bandwidth 4G site connections.

---

## 3. Data Schema Specifications

```javascript
// ConstructionDpr Entity
{
  dprId: "DPR-2026-11-18-004",
  projectId: "PRJ-EMERALD-VALLEY",
  reportDate: "2026-11-18T00:00:00.000Z",
  submittedBy: {
    userId: "USR-ENG-005",
    name: "Vikram Meena (Site Engineer)"
  },
  weather: "clear", // clear | rainy | extreme_heat | dusty
  laborSummary: {
    skilledCount: 24,
    unskilledCount: 48,
    supervisorsCount: 4,
    totalManpower: 76
  },
  activitiesExecuted: [
    { package: "Boundary Wall", description: "Completed 45 running meters brickwork up to 6ft height", percentCompleted: 100 },
    { package: "Main Road", description: "Sub-base compaction and gravel leveling", percentCompleted: 60 }
  ],
  materialConsumed: [
    { itemCode: "MAT-CEMENT-OPC53", quantity: 180, unit: "Bags" },
    { itemCode: "MAT-STEEL-FE550D", quantity: 1.4, unit: "Metric Tons" },
    { itemCode: "MAT-BRICKS", quantity: 6500, unit: "Nos" }
  ],
  machineryLogs: [
    { equipment: "JCB Excavator", hoursRun: 6.5, dieselLiters: 45 },
    { equipment: "Concrete Mixer", hoursRun: 8.0, dieselLiters: 15 }
  ],
  photos: [
    {
      url: "/uploads/dpr/2026-11-18/brickwork-west.jpg",
      caption: "Boundary wall brick masonry - West Perimeter",
      gps: { lat: 26.9856, lng: 75.8509 },
      capturedAt: "2026-11-18T16:22:10.000Z"
    }
  ],
  status: "submitted" // draft | submitted | approved_by_pm
}
```

---

## 4. Responsive UI & Mobile Optimization

- **Single-Screen Quick Submit Mode:**
  - Designed specifically for 375px–430px smartphone screens.
  - Sticky bottom submit button (`fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t z-50`).
  - Haptic feedback and visual success toast upon transmission.
- **Offline / Low-Connectivity Resilience:**
  - Automatic `localStorage` draft saving prevents loss of data if cellular connectivity drops while photographing site work.

---

## 5. Security & Configuration Implementation
- Endpoints: `POST /api/v1/pms/dpr`, `GET /api/v1/pms/dpr/today`, `GET /api/v1/pms/dpr/history`.
- Configuration handled via `backend/src/config/index.js`.
- Daily automatic reminder triggered via system jobs if an active project has not submitted a DPR by 5:30 PM.
