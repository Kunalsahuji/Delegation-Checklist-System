/**
 * PMS Documentation Generator
 * Generates authoritative, comprehensive Markdown architecture & workflow documents
 * for PMS Master and all 13 individual submodules with Mermaid diagrams.
 */
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../../docs/pms');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// -------------------------------------------------------------
// 1. MASTER FLOW & ARCHITECTURE
// -------------------------------------------------------------
const masterDoc = `# Project Management System (PMS) — Master Architecture & Flow Guide

## Executive Overview
The **TaskFlow PMS Engine** is an enterprise-grade, 13-stage real estate and infrastructure lifecycle management platform. It governs real estate development projects from raw land scouting and feasibility studies through legal clearance, financial modeling, baseline governance, procurement, construction execution, quality snags, cost accounting, handover, and 10-year defect liability (DLP) warranty tracking.

Each project strictly follows a **single-direction governance rail** where stages cannot advance until mandatory checklists, quantitative validations, and executive approvals are fulfilled.

---

## PMS 13-Stage Master Lifecycle Flow

\`\`\`mermaid
flowchart TD
    S01["Stage 01: Land Acquisition & Feasibility"] --> S02["Stage 02: Legal Verification & Title Search"]
    S02 --> S03["Stage 03: Land Purchase & Registry"]
    S03 --> S04["Stage 04: Project Planning & Sanctions"]
    S04 --> S05["Stage 05: Pre-Site Mobilization & Contractor Selection"]
    S05 --> S06["Stage 06: Baseline Planning & Governance Lock"]
    S06 --> S07["Stage 07: Procurement & FIFO Inventory Control"]
    S07 --> S08["Stage 08: Construction Execution Engine & DPR"]
    S08 --> S09["Stage 09: Quality Control & Snag Resolution"]
    S09 --> S10["Stage 10: Project Control & Variance (EVM / SPI / CPI)"]
    S10 --> S11["Stage 11: Finance & Contractor RA Billing"]
    S11 --> S12["Stage 12: Handover, Possession & Key Handover"]
    S12 --> S13["Stage 13: After-Sales Warranty & DLP Management"]

    classDef stage fill:#f8fafc,stroke:#3b82f6,stroke-width:2px,color:#0f172a;
    classDef gate fill:#eff6ff,stroke:#1d4ed8,stroke-width:2px,color:#1e3a8a;
    class S01,S02,S03,S04,S05,S06,S07,S08,S09,S10,S11,S12,S13 stage;
\`\`\`

---

## Cross-Stage Governance & Baseline Enforcement Sequence

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor PM as Project Manager
    actor Legal as Legal Counsel
    actor Exec as Executive / Management
    actor Site as Site Engineer / Contractor
    actor Cust as Homebuyer / Resident

    PM->>PM: Stage 1 Scouting & Feasibility (ROI / IRR Scorecard)
    PM->>Legal: Stage 2 Title Clearance & 30-Year Search
    Legal-->>PM: Title Clearance Certificate Issued
    PM->>Exec: Stage 3 Land Purchase & Registered Sale Deed
    Exec-->>PM: Purchase Approved & Registry Recorded
    PM->>PM: Stage 4 Master Layout, Zoning & RERA Approvals
    PM->>Site: Stage 5 Contractor Selection & Work Order Executed
    PM->>Exec: Stage 6 Baseline Formulation (BOM, Labour Gangs, Cashflow)
    Exec-->>PM: Baseline Freeze Lock Enforced (Zero Unbudgeted Scope)
    Site->>Site: Stage 7 Indents & FIFO Material GRN
    Site->>Site: Stage 8 Daily Progress Reports (DPR) & Labour Logs
    PM->>Site: Stage 9 Quality Inspections & Snag Remediation
    PM->>Exec: Stage 10 EVM Control (SPI >= 0.95, CPI >= 0.95)
    Site->>PM: Stage 11 RA Bill Submission (MB Measurement Book)
    PM->>Exec: Statutory Retention & TDS Deduction Clearance
    Exec-->>Site: Stage 11 Net Contractor Disbursement
    PM->>Cust: Stage 12 Possession Letter & Unit Key Handover
    Cust->>PM: Stage 13 Warranty Claims & Annual AMC Maintenance (DLP)
\`\`\`

---

## 13-Stage Comprehensive Reference Table

| Stage # | Stage Name | Primary URL Route | Mongoose Model | Key Deliverables & Approval Gate |
|:---|:---|:---|:---|:---|
| **01** | Land Acquisition & Feasibility | \`/pms/plots\` | \`Plot\`, \`Feasibility\` | Title scoring, GPS coordinates, financial IRR & ROI feasibility |
| **02** | Legal Verification | \`/pms/legal-cases\` | \`PmsLegalCase\` | 30-year search, encumbrance check, advocate clearance opinion |
| **03** | Land Purchase & Registry | \`/pms/land-purchases\` | \`LandPurchase\` | Sale deed, stamp duty payment, mutation record, Sub-Registrar seal |
| **04** | Project Planning & Sanctions | \`/pms/planning\` | \`ProjectPlanning\` | Master layout, road/drainage design, amenity plan, civil budget |
| **05** | Pre-Site Mobilization | \`/pms/pre-site\` | \`PreSiteStart\` | Contractor vetting, item rate card, work order, site water/power |
| **06** | Baseline Planning & Lock | \`/pms/baseline\` | \`BaselinePlanning\` | BOM material matrix, labor gangs, timeline milestones, baseline freeze |
| **07** | Procurement & FIFO Stock | \`/pms/procurement\` | \`ProcurementInventory\` | Purchase orders, GRN inspection, FIFO inventory issue, batch stock |
| **08** | Construction Execution Engine | \`/pms/construction\` | \`ConstructionExecution\` | Daily Progress Reports (DPR), labor muster roll, milestone tracking |
| **09** | Quality Control & Snag Lists | \`/pms/quality\` | \`QualityControl\` | Cube test results, MEP inspection, snag tracking, 100% de-snag clearance |
| **10** | Project Control & Variance | \`/pms/project-control\` | \`ProjectControl\` | Earned Value Management (EVM), Cost Variance (CV), Schedule Variance (SV) |
| **11** | Finance & RA Billing | \`/pms/finance\` | \`PmsFinance\` | Measurement Book (MB), contractor RA bills, retention money, GST/TDS |
| **12** | Handover & Possession | \`/pms/handover\` | \`PmsHandover\` | Completion certificate, deep cleaning, zero-snag buyer sign-off, key kit |
| **13** | After-Sales & DLP Warranty | \`/pms/after-sales\` | \`PmsAfterSales\` | 10-year defect liability, punch-list tickets, AMC schedules, NPS rating |

---

## Core System Architecture Principles

1. **Strict Stage Gating**: A project cannot transition to Stage \`N+1\` until Stage \`N\` has all sections marked \`completed\` and management sign-off is logged in the immutable \`statusHistory\` audit log.
2. **Double-Entry Financial Integrity**: No contractor invoice can be cleared in Stage 11 without verified Measurement Book entries from Stage 8 Construction and Stage 9 Quality approvals.
3. **FIFO Stock Accounting**: Materials issued to site contractors draw strictly from the oldest unexhausted Good Receipt Notes (GRN) to ensure precise landed cost valuation.
4. **Baseline Lock Governance**: Once Stage 06 Baseline is locked, any deviation requires formal Change Order Requests logged under Stage 10 Variance Control.
5. **Contextual Real-Time UI**: Every module features 5 high-impact KPI summary cards, interactive filter triggers, active ring highlights, and explicit entity pagination counts.
`;

fs.writeFileSync(path.join(targetDir, 'PMS_MASTER_FLOW_AND_ARCHITECTURE.md'), masterDoc, 'utf8');
console.log('Generated: PMS_MASTER_FLOW_AND_ARCHITECTURE.md');

// -------------------------------------------------------------
// 2. SUBMODULE SPECS (STAGES 1 TO 13)
// -------------------------------------------------------------
const submodules = [
  {
    stageNum: '01',
    fileName: 'STAGE_01_LAND_ACQUISITION.md',
    title: 'Stage 01: Land Acquisition & Feasibility Study',
    route: '/pms/plots',
    model: 'Plot, Feasibility',
    summary: 'Identifies raw land parcels, logs geospatial telemetry, records owner expectations, and conducts rigorous financial and architectural feasibility analysis.',
    diagram: `flowchart TD
    A["Raw Land Lead Scouted"] --> B["Geospatial Tagging & Survey Boundaries"]
    B --> C["Owner Valuation & Price Negotiation"]
    C --> D["Architectural Density & FSI Assessment"]
    D --> E["Financial Pro-Forma: ROI & Payback Run"]
    E --> F{"Feasibility Score >= 75%?"}
    F -- No --> G["Parcel Rejected / Shelved"]
    F -- Yes --> H["Executive Sanction for Legal Due Diligence"]
    H --> I["Advancement to Stage 02 Legal Verification"]`,
    kpis: [
      { name: 'Total Plots', desc: 'Total scouted parcels registered in database', filter: 'all' },
      { name: 'Under Visit / Analysis', desc: 'Parcels undergoing initial site topography inspection', filter: 'visitScheduled' },
      { name: 'Feasibility Complete', desc: 'Plots with calculated IRR and civil viability scores', filter: 'underAnalysis' },
      { name: 'Approved for Purchase', desc: 'Management cleared plots ready for legal audit', filter: 'approved' },
      { name: 'Total Scouted Acreage', desc: 'Cumulative land area scouted across regions', filter: 'acreage' }
    ],
    sections: [
      'Basic Plot Information (survey number, boundaries, location, landowner details)',
      'Site Visit & Soil Survey (topography, access roads, water table, electrical proximity)',
      'Zoning & Regulatory Screening (master plan category, green belt, setback limits)',
      'Financial Viability Study (FSI, estimated sale realization, expected IRR/ROI)',
      'Executive Approval Gate (investment committee sign-off to initiate legal clearance)'
    ],
    talkingPoints: [
      'Prevents capital lock-in by enforcing scientific feasibility scoring before any land token is paid.',
      'Stores geofenced plot boundaries and survey numbers to eliminate overlap disputes.',
      'Automatically generates Stage 02 Legal Verification records upon investment committee approval.'
    ]
  },
  {
    stageNum: '02',
    fileName: 'STAGE_02_LEGAL_VERIFICATION.md',
    title: 'Stage 02: Legal Verification & Title Due Diligence',
    route: '/pms/legal-cases',
    model: 'PmsLegalCase',
    summary: 'Conducts 30-year title trail searches, verifies encumbrance certificates, checks revenue court disputes, and secures written legal opinions from empaneled advocates.',
    diagram: `flowchart TD
    A["Plot Received from Stage 01"] --> B["30-Year Title Search in Sub-Registrar Office"]
    B --> C["Encumbrance Certificate (EC) Verification"]
    C --> D["Revenue Court & Civil Litigation Clearance"]
    D --> E["Public Notice Publication in State Press"]
    E --> F{"Any Claims or Title Defects?"}
    F -- Yes --> G["Issue Legal Defect Notice / Reject Title"]
    F -- No --> H["Advocate Issues Title Clearance Certificate"]
    H --> I["Advancement to Stage 03 Land Purchase"]`,
    kpis: [
      { name: 'Total Legal Cases', desc: 'All active legal audit records', filter: 'all' },
      { name: 'Under Search', desc: 'Cases undergoing Sub-Registrar records lookup', filter: 'underSearch' },
      { name: 'Public Notice Active', desc: 'Newspaper publication running 14-day claim window', filter: 'noticeActive' },
      { name: 'Title Clear', desc: 'Advocate certified parcels free from encumbrance', filter: 'titleClear' },
      { name: 'High Risk / Litigation', desc: 'Parcels flagged with active litigation or boundary issues', filter: 'litigationFlagged' }
    ],
    sections: [
      'Title Chain Audit (minimum 30 years unbroken sequence of title deeds)',
      'Encumbrance Verification (Form 15 & Form 16 check from registration authorities)',
      'Litigation & Revenue Check (District collector records, land acquisition notices)',
      'Public Notice Period (tracking statutory objection window in daily newspapers)',
      'Final Title Clearance Opinion (formal sign-off by legal counsel)'
    ],
    talkingPoints: [
      'Guarantees zero litigation risk before multi-crore land investments are disbursed.',
      'Tracks statutory 14-day notice periods with timestamped newspaper clipping uploads.',
      'Strict legal clearance certificate required before Stage 03 land purchase contracts can be generated.'
    ]
  },
  {
    stageNum: '03',
    fileName: 'STAGE_03_LAND_PURCHASE_REGISTRY.md',
    title: 'Stage 03: Land Purchase & Sub-Registrar Registry',
    route: '/pms/land-purchases',
    model: 'LandPurchase',
    summary: 'Governs sale agreements, stamp duty payments, token payments, official registration at the Sub-Registrar office, and land revenue mutation.',
    diagram: `flowchart TD
    A["Title Cleared Plot Received"] --> B["Agreement for Sale Drafting & Execution"]
    B --> C["Payment Milestone Disbursements (Token / Advance)"]
    C --> D["E-Stamping & Sub-Registrar Registration"]
    D --> E["Physical Possession & Boundary Demarcation"]
    E --> F["Revenue Department Mutation & Khata Transfer"]
    F --> G["Advancement to Stage 04 Project Planning"]`,
    kpis: [
      { name: 'Total Land Purchases', desc: 'Total purchase transactions recorded', filter: 'all' },
      { name: 'Agreement Phase', desc: 'Deals with executed agreement to sell', filter: 'agreementPhase' },
      { name: 'Registration Scheduled', desc: 'Awaiting appointment at Sub-Registrar office', filter: 'registrationScheduled' },
      { name: 'Registered & Mutated', desc: 'Fully registered with updated revenue records', filter: 'registered' },
      { name: 'Total Land Capital Deployed', desc: 'Cumulative capital invested in land acquisition', filter: 'capital' }
    ],
    sections: [
      'Agreement for Sale (clauses, consideration amount, scheduled milestones)',
      'Payment Milestones (token, earnest money, balance consideration, TDS u/s 194-IA)',
      'Registration Details (Sub-Registrar office, book number, volume, document number)',
      'Physical Possession & Demarcation (boundary pillar erection, fence handover)',
      'Revenue Mutation / Khata Transfer (tehsildar order, updated 7/12 or RTC extract)'
    ],
    talkingPoints: [
      'Provides complete capital tracking with automatic 1% TDS deduction safeguards.',
      'Eliminates title leakage by mandating post-registration mutation before project launch.',
      'Automatically spawns the master project record in Stage 04 upon completed mutation.'
    ]
  },
  {
    stageNum: '04',
    fileName: 'STAGE_04_PROJECT_PLANNING_APPROVALS.md',
    title: 'Stage 04: Project Planning & Statutory Sanctions',
    route: '/pms/planning',
    model: 'ProjectPlanning',
    summary: 'Orchestrates architectural master layouts, internal road/drainage design, amenity typologies, civil development cost estimates, and RERA/Govt sanctions.',
    diagram: `flowchart TD
    A["Registered Land Parcel"] --> B["Architectural Master Layout Formulation"]
    B --> C["Internal Road, Sewerage & Storm Drainage Engineering"]
    C --> D["Amenity Zoning (Clubhouse, Parks, Utilities)"]
    D --> E["Plot / Villa Typology Demarcation & FSI Allocation"]
    E --> F["Civil Infrastructure Development Budgeting"]
    F --> G["Town Planning & RERA Sanction Submissions"]
    G --> H{"Government Sanctions Approved?"}
    H -- Yes --> I["Advancement to Stage 05 Pre-Site Start"]`,
    kpis: [
      { name: 'Total Plans', desc: 'Total registered project planning & design master records', filter: 'all' },
      { name: 'In Planning', desc: 'Projects actively progressing through design stages', filter: 'inPlanning' },
      { name: 'Awaiting Sanction', desc: 'Completed designs pending management or municipal sanction', filter: 'managementApproval' },
      { name: 'Approved Plans', desc: 'Fully sanctioned plans cleared for contractor selection', filter: 'approved' },
      { name: 'Total Dev Budget', desc: 'Cumulative estimated civil infrastructure development budget', filter: 'hasBudget' }
    ],
    sections: [
      'Master Layout & Survey Boundary (architectural blueprints, green zones)',
      'Roads, Stormwater & Utility Networks (road width, grading, drain culverts)',
      'Amenity Planning (clubhouse, swimming pool, parks, STP, electrical substation)',
      'Plot / Villa Typology Breakdown (unit sizes, facing, classification)',
      'Development Budget & Approvals (itemized BOQ estimates, RERA clearance)'
    ],
    talkingPoints: [
      'Integrates architectural design directly with initial civil cost budgeting.',
      'Validates RERA compliance before permitting any on-site mobilization.',
      'Features clickable Total Dev Budget filter card to isolate high-outlay projects.'
    ]
  },
  {
    stageNum: '05',
    fileName: 'STAGE_05_PRE_SITE_START.md',
    title: 'Stage 05: Pre-Site Mobilization & Contractor Selection',
    route: '/pms/pre-site',
    model: 'PreSiteStart',
    summary: 'Manages contractor shortlisting, competitive unit rate negotiation, formal Work Order (WO) agreements, site boundary fencing, water, power, and site office mobilization.',
    diagram: `flowchart TD
    A["Sanctioned Planning Record"] --> B["Contractor Shortlisting & Bid Comparison"]
    B --> C["Item Rate Finalization & Negotiation"]
    C --> D["Formal Work Order (WO) Issuance & Stamping"]
    D --> E["Site Mobilization (Temporary Power, Water, Security Fencing)"]
    E --> F["Site Engineer & Supervisory Gang Deployment"]
    F --> G["Executive Pre-Site Sign-off"]
    G --> H["Advancement to Stage 06 Baseline Planning"]`,
    kpis: [
      { name: 'Total Workflows', desc: 'Total pre-site mobilization workflows registered', filter: 'all' },
      { name: 'In Procurement', desc: 'Active contractor bidding and rate negotiations', filter: 'inPreSite' },
      { name: 'Awaiting Sign-off', desc: 'Completed setups awaiting management approval', filter: 'managementApproval' },
      { name: 'Mobilized & Approved', desc: 'Sites fully mobilized with deployed engineering teams', filter: 'approved' },
      { name: 'Total Work Orders', desc: 'Cumulative value of executed contractor agreements', filter: 'hasWorkOrder' }
    ],
    sections: [
      'Contractor Selection (firm details, past performance, technical eligibility)',
      'Rate Finalization (unit rates for earthwork, concrete, steel, masonry)',
      'Work Order Agreement (scope of work, penalty clauses, defect liability term)',
      'Site Setup & Mobilization (temporary electricity, borewell, labour camp, store)',
      'Executive Mobilization Sign-off (site ready for baseline freeze)'
    ],
    talkingPoints: [
      'Enforces formal work orders and safety guidelines before contractors enter the site.',
      'Maintains transparent contractor rate history to optimize future project bidding.',
      'Includes clickable Total Work Orders KPI to track contractor commitments.'
    ]
  },
  {
    stageNum: '06',
    fileName: 'STAGE_06_BASELINE_PLANNING.md',
    title: 'Stage 06: Baseline Planning & Governance Lock',
    route: '/pms/baseline',
    model: 'BaselinePlanning',
    summary: 'Establishes the immutable baseline master plan: material Bill of Materials (BOM), gang manpower headcounts, milestone delivery timelines, month-by-month cashflow projections, and executive baseline freeze.',
    diagram: `flowchart TD
    A["Mobilized Project Site"] --> B["BOM Formulation: Cement, Steel, Aggregate, Piping"]
    B --> C["Labour Gang Headcount Scheduling (Masons, Barbenders, Helpers)"]
    C --> D["Milestone Timeline Schedule (Gantt, Critical Path)"]
    D --> E["Cashflow Forecasting & Peak Capital Drawdown"]
    E --> F["Executive Governance Review"]
    F --> G["Executive Baseline Lock Enforced (Freeze)"]
    G --> H["Advancement to Stage 07 Procurement & Execution"]`,
    kpis: [
      { name: 'Total Baselines', desc: 'Total registered project baseline master plans', filter: 'all' },
      { name: 'In Planning', desc: 'Formulating BOM, labor gangs, or cashflows', filter: 'inPlanning' },
      { name: 'Awaiting Lock', desc: 'Complete baselines awaiting executive freeze', filter: 'baselineReview' },
      { name: 'Frozen & Locked', desc: 'Baselines officially frozen for execution monitoring', filter: 'locked' },
      { name: 'Total Baseline Budget', desc: 'Cumulative baseline budget allocation across all projects', filter: 'hasBudget' }
    ],
    sections: [
      'Planned Material BOM (detailed line items, specifications, target rates)',
      'Planned Labour Headcounts (daily peak/average manpower by trade)',
      'Milestone Timeline Schedule (key completion dates, phase buffers)',
      'Planned Cashflow (monthly anticipated outlays vs revenue realizations)',
      'Executive Baseline Freeze (digital lock signature preventing unapproved alterations)'
    ],
    talkingPoints: [
      'Baseline Lock is the core benchmark against which all future cost & schedule variance is calculated.',
      'Locks both budget and timeline so cost overruns cannot be concealed in later stages.',
      'Clickable Total Baseline Budget card enables instant audit of target capital allocations.'
    ]
  },
  {
    stageNum: '07',
    fileName: 'STAGE_07_PROCUREMENT_INVENTORY.md',
    title: 'Stage 07: Procurement & FIFO Inventory Management',
    route: '/pms/procurement',
    model: 'ProcurementInventory',
    summary: 'Controls the site supply chain: vendor purchase orders (PO), Goods Receipt Notes (GRN) with QA inspection, store warehousing, and FIFO stock issue to contractors.',
    diagram: `flowchart TD
    A["Locked Baseline BOM"] --> B["Site Purchase Requisition (Indent)"]
    B --> C["Vendor Purchase Order (PO) Issuance"]
    C --> D["Material Arrival at Site Gate"]
    D --> E["Quality Inspection & Lab Test Sampling"]
    E --> F["Goods Receipt Note (GRN) Generation"]
    F --> G["FIFO Inventory Warehousing & Batch Stacking"]
    G --> H["Stock Issue to Sub-Contractors against Work Order"]
    H --> I["Advancement to Stage 08 Construction Execution"]`,
    kpis: [
      { name: 'Total Procurement Records', desc: 'All procurement tracking records', filter: 'all' },
      { name: 'Active Indents', desc: 'Material requisitions currently being processed', filter: 'activeIndents' },
      { name: 'PO Dispatched', desc: 'Orders placed with vendors awaiting shipment', filter: 'poDispatched' },
      { name: 'GRN Inwarded', desc: 'Materials received and accepted into store', filter: 'grnInwarded' },
      { name: 'Warehouse Stock Value', desc: 'Total book value of inventory currently in site store', filter: 'stockValue' }
    ],
    sections: [
      'Site Requisition / Indent (requested item, required date, site urgency)',
      'Purchase Order (vendor details, tax terms, delivery schedule, unit rates)',
      'Goods Receipt Note (GRN) (weighbridge slips, physical count, damage check)',
      'Stock Ledger & FIFO Valuation (batch costing, inventory exhaustion tracking)',
      'Contractor Material Issue (site requisition slip, accountable consumption)'
    ],
    talkingPoints: [
      'FIFO material tracking guarantees that project costs reflect true purchase price trends.',
      'Ensures no material is issued without an approved site indent tied to the baseline BOM.',
      'Prevents material theft and ghost inventory by linking GRN gate passes with physical stores.'
    ]
  },
  {
    stageNum: '08',
    fileName: 'STAGE_08_CONSTRUCTION_EXECUTION.md',
    title: 'Stage 08: Construction Execution Engine & DPR',
    route: '/pms/construction',
    model: 'ConstructionExecution',
    summary: 'Drives on-site field execution: Daily Progress Reports (DPR), daily labor muster rolls, equipment utilization, work package completion, and contractor performance logs.',
    diagram: `flowchart TD
    A["Materials & Site Mobilized"] --> B["Daily Work Packaging & Task Assignment"]
    B --> C["Labour Muster Roll Logging (Masons, Helpers, Operators)"]
    C --> D["Heavy Machinery & Equipment Hours Recording"]
    D --> E["Daily Progress Report (DPR) Submission"]
    E --> F["Site Photos & Weather Delay Logging"]
    F --> G["Milestone Measurement Verification"]
    G --> H["Advancement to Stage 09 Quality Control"]`,
    kpis: [
      { name: 'Active Sites', desc: 'Projects under active physical construction', filter: 'all' },
      { name: 'DPRs Logged Today', desc: 'Daily Progress Reports submitted in the current cycle', filter: 'hasDpr' },
      { name: 'On-Site Workforce', desc: 'Total labor headcounts deployed across all active sites', filter: 'laborHeadcount' },
      { name: 'Milestones Completed', desc: 'Civil milestones executed and awaiting quality check', filter: 'approved' },
      { name: 'Machinery Operating Hours', desc: 'Cumulative heavy equipment operational hours', filter: 'machinery' }
    ],
    sections: [
      'Daily Progress Report (DPR) (activities completed, cubic meters cast, linear meters paved)',
      'Labor Muster Roll (contractor gangs, skilled vs unskilled ratios, attendance)',
      'Plant & Machinery Log (concrete batching plant, transit mixers, JCB hours)',
      'Site Environmental & Safety Diary (weather conditions, toolbox talks, PPE audit)',
      'Supervisor Review & Work Package Sign-off (site engineer certification)'
    ],
    talkingPoints: [
      'Provides daily operational transparency directly from the construction front line.',
      'Eliminates billing fraud by corroborating contractor claims against daily muster rolls.',
      'Pagination displays exact "construction execution logs" for clear record auditing.'
    ]
  },
  {
    stageNum: '09',
    fileName: 'STAGE_09_QUALITY_CONTROL_SNAGS.md',
    title: 'Stage 09: Quality Control & Snag Remediation',
    route: '/pms/quality',
    model: 'QualityControl',
    summary: 'Enforces strict civil engineering quality standards: concrete cube crushing strength tests, MEP line tests, snag list generation, and 100% de-snag clearance certification.',
    diagram: `flowchart TD
    A["Executed Civil Work"] --> B["Concrete Compressive Strength Tests (7/14/28 Days)"]
    B --> C["MEP Pressure & Plumbing Leakage Checks"]
    C --> D["Snag List Generation with Photographic Evidence"]
    D --> E["Contractor Rectification & De-Snagging"]
    E --> F["Re-Inspection by Quality Auditor"]
    F --> G{"All Snags Cleared (Zero Open)?"}
    G -- No --> D
    G -- Yes --> H["Quality Clearance Certificate Issued"]
    H --> I["Advancement to Stage 10 Project Control & Stage 11 Finance"]`,
    kpis: [
      { name: 'Quality Audits', desc: 'Total quality control and snagging audit records', filter: 'all' },
      { name: 'Inspections in Progress', desc: 'Active field audits undergoing verification', filter: 'inProgress' },
      { name: 'Open Snags', desc: 'Identified defects currently under contractor remediation', filter: 'hasOpenSnags' },
      { name: 'Certified Zero-Snag', desc: 'Audits with 100% defects cleared and certified', filter: 'approved' },
      { name: 'Total Tests Cleared', desc: 'Cumulative lab tests passed (slump, cube, rebar)', filter: 'hasInspections' }
    ],
    sections: [
      'Civil Lab Testing (concrete cube compressive strength, slump test, silt content)',
      'MEP & Infrastructure QA (hydraulic pressure tests, electrical continuity, pipe slope)',
      'Snag List Register (snag classification, location, photographic evidence, responsible vendor)',
      'Contractor Rectification Log (before/after photos, sign-off timestamps)',
      'Final Quality Clearance Certificate (mandated prerequisite for contractor billing)'
    ],
    talkingPoints: [
      'Blocks contractor payment clearance until all high-severity snags are verified cleared.',
      'Prevents structural defects by automatically alerting if concrete 28-day strength drops below design M25/M30 grade.',
      'Features explicit "quality inspection audits" pagination nomenclature.'
    ]
  },
  {
    stageNum: '10',
    fileName: 'STAGE_10_PROJECT_CONTROL_VARIANCE.md',
    title: 'Stage 10: Project Control & Variance (EVM / SPI / CPI)',
    route: '/pms/project-control',
    model: 'ProjectControl',
    summary: 'Monitors project health via Earned Value Management (EVM): Planned Value (PV), Earned Value (EV), Actual Cost (AC), Cost Performance Index (CPI), and Schedule Performance Index (SPI).',
    diagram: `flowchart TD
    A["Baseline Schedule (PV) + Actual Field DPR (EV) + Accounts Ledger (AC)"] --> B["Compute Cost Variance: CV = EV - AC"]
    B --> C["Compute Schedule Variance: SV = EV - PV"]
    C --> D["Calculate Indices: CPI = EV / AC | SPI = EV / PV"]
    D --> E{"Is CPI < 0.90 or SPI < 0.90?"}
    E -- Yes --> F["Trigger Executive Variance Alert & Corrective Action Plan"]
    E -- No --> G["Project Health Green / Optimal"]
    F --> H["Management Review & Milestone Recovery Strategy"]
    G --> I["Advancement to Stage 11 Finance Settlement"]`,
    kpis: [
      { name: 'Tracked Projects', desc: 'Projects under active variance and EVM surveillance', filter: 'all' },
      { name: 'Within Budget & Time', desc: 'Projects operating with CPI >= 1.0 and SPI >= 1.0', filter: 'withinBudget' },
      { name: 'Cost Overrun Risk', desc: 'Projects where AC exceeds EV (CPI < 0.95)', filter: 'costOverrun' },
      { name: 'Schedule Delayed', desc: 'Projects tracking behind baseline timeline (SPI < 0.95)', filter: 'scheduleDelayed' },
      { name: 'Critical Variance Ledgers', desc: 'Projects requiring immediate executive recovery intervention', filter: 'hasVariance' }
    ],
    sections: [
      'Earned Value Metrics (Planned Value PV, Earned Value EV, Actual Cost AC)',
      'Performance Indices (Cost Performance Index CPI, Schedule Performance Index SPI)',
      'Estimate at Completion (EAC, VAC, forecasted project completion date)',
      'Milestone Variance Analysis (delays by work package and critical path impact)',
      'Executive Mitigation Strategy (contingency budget releases, gang headcount increases)'
    ],
    talkingPoints: [
      'Provides senior management an instant pulse check on project profitability and schedule health.',
      'Uses standard PMI-compliant Earned Value formulas (CPI = EV/AC, SPI = EV/PV).',
      'Contextual pagination explicitly states "project variance ledgers".'
    ]
  },
  {
    stageNum: '11',
    fileName: 'STAGE_11_FINANCE_RA_BILLING.md',
    title: 'Stage 11: Finance & Contractor RA Billing Engine',
    route: '/pms/finance',
    model: 'PmsFinance',
    summary: 'Governs contractor Running Account (RA) billing: Measurement Book (MB) verification, statutory TDS/GST deductions, retention money withholding, and executive disbursement sign-off.',
    diagram: `flowchart TD
    A["Verified DPR + Quality Clearance"] --> B["Joint Measurement Book (MB) Recording"]
    B --> C["Contractor Running Account (RA) Bill Submission"]
    C --> D["Quantity Surveyor & Finance Audit"]
    D --> E["Statutory Deductions (TDS u/s 194C, GST TDS, 5% Retention Money)"]
    E --> F["Executive & CFO Payment Approval"]
    F --> G["Disbursement Advice Issued to Bank"]
    G --> H["Retention Ledger Accounting"]
    H --> I["Advancement to Stage 12 Handover & Possession"]`,
    kpis: [
      { name: 'Tracked Ledgers', desc: 'Total project financial accounts under active governance', filter: 'all' },
      { name: 'Gross Disbursed', desc: 'Cumulative contractor payouts cleared and paid', filter: 'hasOutflow' },
      { name: 'Pending Clearances', desc: 'Approved RA bills pending treasury disbursement', filter: 'pendingClearance' },
      { name: 'Certified & Settled', desc: 'Projects with audited contractor bill closures', filter: 'approved' },
      { name: 'Contractor RA Billings', desc: 'Total running account bill value certified to date', filter: 'hasRaBills' }
    ],
    sections: [
      'Measurement Book (MB) Ledger (jointly measured items, quantity offsets)',
      'RA Bill Inward Register (bill number, invoice date, claiming contractor, claimed gross)',
      'Deductions & Withholding (5% security retention, 1% labour cess, 2% TDS, advance recovery)',
      'Net Payment Certification (approved payable amount, payment mode, UTR number)',
      'P&L Cost Ledger Summary (actual capital cost vs baseline budget allocations)'
    ],
    talkingPoints: [
      'Zero unverified payments: every rupee disbursed is matched against verified MB quantities.',
      'Automates retention money accounting (held for release after the defect liability period).',
      'Pagination displays exact "finance accounts" count.'
    ]
  },
  {
    stageNum: '12',
    fileName: 'STAGE_12_HANDOVER_POSSESSION.md',
    title: 'Stage 12: Handover & Customer Possession Management',
    route: '/pms/handover',
    model: 'PmsHandover',
    summary: 'Orchestrates the transition from construction to customer occupancy: municipal completion certificate, deep cleaning, pre-possession homebuyer walk-through, zero-snag sign-off, and handover of keys/welcome kit.',
    diagram: `flowchart TD
    A["Financially Settled Construction"] --> B["Municipal Completion Certificate (CC) / Occupancy Certificate (OC)"]
    B --> C["Final Architectural & MEP Audit"]
    C --> D["Professional Deep Cleaning & Sanitization"]
    D --> E["Customer Joint Walk-Through Inspection"]
    E --> F{"Any Minor Snags Identified?"}
    F -- Yes --> G["48-Hour Rapid Remediation Squad"]
    F -- No --> H["Customer Signs Zero-Snag Possession Certificate"]
    G --> H
    H --> I["Handover of Keys, Welcome Kit & Appliance Warranties"]
    I --> J["Advancement to Stage 13 After-Sales & DLP Management"]`,
    kpis: [
      { name: 'Total Registers', desc: 'Total property handover registers under management', filter: 'all' },
      { name: 'Possession Delivered', desc: 'Units officially handed over with keys and documentation', filter: 'possessionCompleted' },
      { name: 'Zero-Snag Verified', desc: 'Units certified defect-free by homeowner inspection', filter: 'zeroSnagVerified' },
      { name: 'Pending Snags Backlog', desc: 'Units undergoing minor cosmetic touch-up remediation', filter: 'hasPendingSnags' },
      { name: 'Final Inspections Cleared', desc: 'Units with structural and MEP safety clearances issued', filter: 'inspectionsCleared' }
    ],
    sections: [
      'Statutory Completion Status (Occupancy Certificate, fire safety NOC, electrical inspector clearance)',
      'Pre-Delivery Inspection (PDI) (cabinet alignment, sanitary fixtures, paint finish)',
      'Deep Cleaning Verification (chemical floor scrub, glass pane polishing, pest control)',
      'Customer Joint Handover Checklist (fixtures checklist, meter readings, key counts)',
      'Formal Possession Letter (signed acceptance letter, digital document archive)'
    ],
    talkingPoints: [
      'Guarantees exceptional customer experience through structured zero-snag walk-throughs.',
      'Stores customer-signed possession certificates with exact electrical/water meter readings.',
      'Contextual pagination states "handover registers".'
    ]
  },
  {
    stageNum: '13',
    fileName: 'STAGE_13_AFTER_SALES_WARRANTY.md',
    title: 'Stage 13: After-Sales Warranty & DLP Management',
    route: '/pms/after-sales',
    model: 'PmsAfterSales',
    summary: 'Governs the terminal project lifecycle: 10-year structural defect liability (DLP), 1-year MEP warranty claims, scheduled Annual Maintenance Contracts (AMC), resident support desk, and Net Promoter Score (NPS) tracking.',
    diagram: `flowchart TD
    A["Possession Delivered Unit"] --> B["10-Year Structural DLP & 1-Year MEP Warranty Activated"]
    B --> C["Quarterly Preventive AMC Servicing (Elevator, STP, DG Sets)"]
    C --> D["Resident Support Desk Ticket Raised"]
    D --> E["Rapid Response SLA: Site Facility Technician Dispatched"]
    E --> F["Defect Rectification & Homebuyer Sign-off"]
    F --> G["Annual Customer Satisfaction & NPS Survey (Score >= 4.0)"]
    G --> H["Retention Money Release Approval to Original Contractors"]
    H --> I["Terminal Project Lifecycle Archival"]`,
    kpis: [
      { name: 'Total Portfolios', desc: 'Projects under active warranty and lifetime facility support', filter: 'all' },
      { name: 'Active Warranty Claims', desc: 'Open resident punch-list and defect remediation tickets', filter: 'hasActiveClaims' },
      { name: 'AMC Visits Executed', desc: 'Completed preventive maintenance cycles for shared infrastructure', filter: 'amcCompleted' },
      { name: 'Support Queries Resolved', desc: 'Resident helpdesk tickets successfully resolved and closed', filter: 'supportResolved' },
      { name: 'Customer Satisfaction', desc: 'Top rated customer satisfaction score (>= 4.0 / 5.0)', filter: 'topRated' }
    ],
    sections: [
      'Warranty Coverage Matrix (structural 10 years, water proofing 5 years, MEP 1 year)',
      'Defect Liability Claims (ticket classification, SLA response time, assigned maintenance crew)',
      'AMC Schedule Engine (STP biological maintenance, lift annual contract, backup generator)',
      'Resident Helpdesk Portal (in-app resident query logging, satisfaction rating)',
      'Customer NPS & Lifecycle Closure (homeowner feedback, retention release sign-off)'
    ],
    talkingPoints: [
      'Protects brand reputation by ensuring swift resolution of post-handover customer issues.',
      'Governs final release of contractor retention money based on defect-free warranty periods.',
      'Features explicit "after-sales portfolios" pagination and top-rated customer satisfaction card.'
    ]
  }
];

// Generate each stage document
submodules.forEach(sm => {
  let content = `# ${sm.title}

## 1. Executive Summary & Business Objective
${sm.summary}

This stage constitutes **Stage ${sm.stageNum}** of the 13-stage PMS lifecycle. It enforces standard operating procedures, quantitative data validation, and approval checks to ensure complete governance before downstream project stages can proceed.

- **Primary Route**: \`${sm.route}\`
- **Mongoose Model**: \`${sm.model}\`

---

## 2. Stage Workflow & Decision Tree

\`\`\`mermaid
${sm.diagram}
\`\`\`

---

## 3. Top 5 KPI Header Cards & Filter Behaviors
Each card displays key live metrics, interactive hover tooltips \`(i)\`, active ring highlight styling, and triggers table filtering upon clicking.

| Card # | KPI Title | Data Source / Calculation | Filter State Trigger |
|:---|:---|:---|:---|
${sm.kpis.map((k, i) => `| **${i+1}** | **${k.name}** | ${k.desc} | \`${k.filter}\` |`).join('\n')}

---

## 4. Section-by-Section Workflow & Data Breakdown
The module contains 5 structured functional sections. Each section must be completed and marked verified to enable stage advancement.

${sm.sections.map((sec, idx) => `### Section ${idx + 1}: ${sec}
- **Objective**: Capture and validate all required operational data for ${sec.toLowerCase()}.
- **Data Attributes**: Validated schema fields, attachments, timestamps, and officer IDs.
- **Completion Check**: Requires 100% mandatory fields populated and verified.
`).join('\n')}

---

## 5. Stage Progression & Checklist Automation Rules
- **Automatic Gating**: When all 5 section checklists are marked \`done\`, the document status automatically updates to \`approved\`.
- **Audit History**: Every transition creates an immutable record in \`statusHistory\` with user ID, previous status, next status, and timestamp.
- **Downstream Advancement**: Approving this stage automatically spawns or unlocks the subsequent stage on the project's master stage rail.

---

## 6. Manager Presentation Talking Points
${sm.talkingPoints.map(tp => `- **${tp}**`).join('\n')}
`;

  fs.writeFileSync(path.join(targetDir, sm.fileName), content, 'utf8');
  console.log('Generated: ' + sm.fileName);
});

console.log('PMS Documentation generation complete! Total 14 files generated.');
