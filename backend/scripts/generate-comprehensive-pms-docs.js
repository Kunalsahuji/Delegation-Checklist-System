/**
 * PMS Comprehensive Documentation Generator
 * Generates structured, highly descriptive business explanation docs
 * separated cleanly from developer implementation specs.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../docs');

// Helper to write file safely
function writeFile(subPath, content) {
  const full = path.join(root, subPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trim() + '\n', 'utf8');
  console.log('Created:', subPath);
}

// -------------------------------------------------------------
// 1. ROOT & PMS INDEX READMES
// -------------------------------------------------------------
writeFile('README.md', `# TaskFlow ERP — Enterprise Documentation Hub

Welcome to the TaskFlow ERP Documentation Repository. This documentation is organized into clear, dedicated functional tiers to separate **Business Flow & Manager Explanations** from **Technical Developer Specifications**.

---

## Modular Directory Layout

\`\`\`
docs/
├── pms/                                  # Project Management System (13-Stage Real Estate Lifecycle)
│   ├── 01_business_flow_and_understanding/  # FOR MANAGERS & BUSINESS AUDIT (Workflows, Explanations, Diagrams)
│   │   ├── PMS_MASTER_EXECUTIVE_SUMMARY.md # Master 13-Stage Overview & End-to-End Governance
│   │   └── stages_explained/               # Dedicated explanatory guides for each stage (01 to 13)
│   └── 02_technical_implementation_specs/ # FOR DEVELOPERS & ARCHITECTS (APIs, Schemas, Codebase Details)
│       ├── ARCHITECTURE_AND_API_SPEC.md
│       ├── DATABASE_SCHEMAS_AND_MODELS.md
│       └── phase_development_history/     # Granular phase build notes and logs
│
└── crm/                                  # Customer Relationship Management (Upcoming)
    ├── 01_business_flow_and_understanding/  # Lead funnels, buyer booking, broker payouts, sales analytics
    └── 02_technical_implementation_specs/ # CRM endpoints, schemas, webhook listeners
\`\`\`

---

## Quick Navigation for Team & Manager Presentations
- **For Management Presentations**: Review [\`docs/pms/01_business_flow_and_understanding/\`](pms/01_business_flow_and_understanding/PMS_MASTER_EXECUTIVE_SUMMARY.md) for non-technical, high-impact business walk-throughs with visual diagrams and talking points.
- **For Engineering & API Integration**: Review [\`docs/pms/02_technical_implementation_specs/\`](pms/02_technical_implementation_specs/ARCHITECTURE_AND_API_SPEC.md) for endpoints, request bodies, Mongoose schemas, and automated validation gates.
`);

writeFile('pms/README.md', `# Project Management System (PMS) — Documentation Directory

This folder contains all documentation for the **13-Stage PMS Real Estate Engine**.

To prevent confusion between **business understanding** and **developer implementation**, documents are split into two distinct directories:

---

## 1. Business Flow & Understanding (For Managers & Team Alignment)
📂 [\`01_business_flow_and_understanding/\`](01_business_flow_and_understanding/PMS_MASTER_EXECUTIVE_SUMMARY.md)
- **Target Audience**: Project Managers, Directors, Investors, Leads, Business Analysts.
- **What it Contains**:
  - Full descriptions of why each stage exists in the real estate industry.
  - Plain English step-by-step operational workflows.
  - Easy-to-understand visual diagrams (Mermaid flowcharts).
  - Essential real estate terminology explained simply (FSI, Title Chain, BOQ, BOM, Muster Roll, Cube Tests, SPI/CPI, RA Bills, DLP).
  - 60-Second "Elevator Pitch" presentation scripts for your manager.

---

## 2. Technical Implementation Specs (For Developers & Engineers)
📂 [\`02_technical_implementation_specs/\`](02_technical_implementation_specs/ARCHITECTURE_AND_API_SPEC.md)
- **Target Audience**: Full-Stack Developers, DevOps Engineers, QA Testers.
- **What it Contains**:
  - RESTful API endpoints, query params, response envelopes.
  - MongoDB models, field definitions, indexing, and cascade rules.
  - Automated checklist transitions and state machine engines.
  - Phase-by-phase implementation histories and migration logs.
`);

// -------------------------------------------------------------
// 2. MASTER BUSINESS SUMMARY
// -------------------------------------------------------------
writeFile('pms/01_business_flow_and_understanding/PMS_MASTER_EXECUTIVE_SUMMARY.md', `# PMS Master Architecture — End-to-End Business Flow & Governance

## 1. What is the TaskFlow PMS Engine?
The **TaskFlow Project Management System (PMS)** is an enterprise governance platform purpose-built for real estate and civil infrastructure development. It controls a project's entire lifespan across **13 mandatory stages**—from scouting raw agricultural land, through legal verification, municipal sanctions, civil construction, contractor billing, unit possession, and 10-year defect liability warranty.

---

## 2. Why Real Estate Projects Need This System
Traditional real estate projects suffer from four critical failure points:
1. **Title Risk & Land Disputes**: Buying land with hidden mortgages or court cases leads to frozen projects and court litigation.
2. **Budget Slippage & Hidden Costs**: Contractors claim inflated quantities because site measurements are not matched against baseline estimates.
3. **Ghost Materials & Theft**: Cement and steel delivered to sites disappear without automated FIFO inventory reconciliation.
4. **Customer Distrust & Snags**: Delivering homes with plumbing leaks or paint defects destroys reputation and delays final customer collections.

**TaskFlow PMS eliminates these risks** by enforcing a **single-direction governance rail**: no stage can be bypassed, no contractor can be paid without verified field measurements, and all changes require executive baseline change orders.

---

## 3. High-Level 13-Stage Lifecycle Diagram

\`\`\`mermaid
flowchart TD
    S01["Stage 01: Land Acquisition & Feasibility"] --> S02["Stage 02: Legal Verification & Title Search"]
    S02 --> S03["Stage 03: Land Purchase & Sub-Registrar Registry"]
    S03 --> S04["Stage 04: Project Planning & Statutory Sanctions"]
    S04 --> S05["Stage 05: Pre-Site Mobilization & Contractor Selection"]
    S05 --> S06["Stage 06: Baseline Planning & Governance Lock (Freeze)"]
    S06 --> S07["Stage 07: Procurement & FIFO Inventory Control"]
    S07 --> S08["Stage 08: Construction Execution Engine & Daily DPR"]
    S08 --> S09["Stage 09: Quality Control & 100% Snag Resolution"]
    S09 --> S10["Stage 10: Project Control & Variance (EVM / SPI / CPI)"]
    S10 --> S11["Stage 11: Finance & Contractor RA Billing Engine"]
    S11 --> S12["Stage 12: Handover, Possession & Key Delivery"]
    S12 --> S13["Stage 13: After-Sales Warranty & DLP Management"]

    classDef stage fill:#f8fafc,stroke:#2563eb,stroke-width:2px,color:#0f172a;
    class S01,S02,S03,S04,S05,S06,S07,S08,S09,S10,S11,S12,S13 stage;
\`\`\`

---

## 4. Cross-Stage Data Governance Sequence

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor PM as Project Manager
    actor Legal as Legal Counsel
    actor Exec as Investment Committee / CFO
    actor Site as Site Engineer & Contractor
    actor Cust as Homebuyer / Resident

    PM->>PM: Stage 1 Scouting & Financial IRR Viability
    PM->>Legal: Stage 2 Title Due Diligence (30-Year Search)
    Legal-->>PM: Title Clearance Certificate Issued
    PM->>Exec: Stage 3 Sale Deed & Sub-Registrar Registry
    Exec-->>PM: Purchase Cleared & Mutation Completed
    PM->>PM: Stage 4 Master Layout & RERA Sanction Submissions
    PM->>Site: Stage 5 Work Order Issuance & Site Setup
    PM->>Exec: Stage 6 Baseline BOM, Manpower & Budget Formulated
    Exec-->>PM: Executive Baseline Freeze Lock Enforced
    Site->>Site: Stage 7 PO Issuance & FIFO Material GRN
    Site->>Site: Stage 8 Daily Progress Reports (DPR) & Muster Rolls
    PM->>Site: Stage 9 Quality Testing (Cube Tests) & Snag Lists
    PM->>Exec: Stage 10 EVM Performance Audit (SPI >= 0.95, CPI >= 0.95)
    Site->>PM: Stage 11 Measurement Book (MB) Entry & RA Bill Claim
    PM->>Exec: Audited Net Payout (Less 5% Retention & TDS)
    Exec-->>Site: Stage 11 Contractor Disbursement
    PM->>Cust: Stage 12 Zero-Snag Inspection & Keys Handed Over
    Cust->>PM: Stage 13 Warranty Tickets & Annual AMC Maintenance
\`\`\`

---

## 5. Overview of All 13 Submodules

| Stage # | Stage Name | Real-World Business Function | Key Deliverable |
|:---|:---|:---|:---|
| **01** | Land Acquisition & Feasibility | Land scouting, GPS coordinates, financial pro-forma ROI/IRR analysis | Investment Committee Feasibility Scorecard |
| **02** | Legal Verification | 30-year Sub-Registrar search, encumbrance check, public notice | Advocate Title Clearance Certificate |
| **03** | Land Purchase & Registry | Agreement for sale, stamp duty, Sub-Registrar deed, revenue mutation | Registered Sale Deed & Updated Khata/RTC |
| **04** | Project Planning & Sanctions | Master layout blue-prints, road networks, amenity plans, RERA approvals | Approved Master Layout & Civil Budget |
| **05** | Pre-Site Mobilization | Contractor vetting, unit rate cards, work orders, temporary site utilities | Signed Work Order & Mobilized Site Office |
| **06** | Baseline Planning & Lock | Material BOM, labor gangs, critical path schedule, cashflow projection | Executive Baseline Lock (Target Budget Freeze) |
| **07** | Procurement & FIFO Stock | Vendor POs, gate pass GRNs, warehouse stacking, contractor stock issue | FIFO Landed Cost Stock Ledger |
| **08** | Construction Execution Engine | Daily Progress Reports (DPR), labor muster rolls, equipment tracking | Certified Milestone Progress Logs |
| **09** | Quality Control & Snags | Concrete cube crushing strength, MEP pressure tests, snag rectification | Zero-Snag Quality Clearance Certificate |
| **10** | Project Control & Variance | Earned Value Management (EVM), Cost Variance (CV), Schedule Variance (SV) | Executive EVM Dashboard (CPI / SPI) |
| **11** | Finance & RA Billing | Measurement Book (MB), contractor Running Account bills, TDS/Retention | Net Audited Contractor Disbursement Advice |
| **12** | Handover & Possession | Municipal Occupancy Certificate (OC), deep cleaning, key delivery | Signed Customer Possession Certificate |
| **13** | After-Sales & DLP Warranty | 10-year structural defect liability, 1-year MEP warranty, quarterly AMC | Homebuyer NPS Score & Retention Release |

---

## 6. How to Explain This to Your Manager in 2 Minutes
> *"Sir, we have implemented an end-to-end, single-direction real estate governance engine that covers all 13 stages of project development. It guarantees financial discipline because contractors cannot be paid until work is recorded in daily progress reports and quality-tested for zero snags. Materials are tracked via FIFO batches so inventory cannot leak. Most importantly, projects are locked against an executive baseline at Stage 6, ensuring that any cost overrun or schedule delay is immediately detected in Stage 10 Variance Control with PMI-standard CPI and SPI indices. Every stage has structured checklists, approval gates, and interactive KPI dashboards with live project data."*
`);

// -------------------------------------------------------------
// 3. DETAILED SUBMODULE EXPLANATION GUIDES (STAGES 1 TO 13)
// -------------------------------------------------------------
const stageDetails = [
  {
    num: '01',
    fileName: '01_STAGE_LAND_ACQUISITION_EXPLAINED.md',
    title: 'Stage 01: Land Acquisition & Feasibility Study',
    route: '/pms/plots',
    plainEnglish: 'Stage 01 is where a real estate project is born. The acquisition team scouts raw land parcels, records their exact satellite GPS coordinates, interviews the landowners on price expectations, and performs detailed financial and architectural feasibility calculations to decide if the plot is profitable.',
    problemSolved: 'Real estate developers often lose crores by giving non-refundable tokens on land parcels that later turn out to have zoning restrictions (green belts, flood zones) or poor financial returns. Stage 01 forces a quantitative feasibility scorecard before any money leaves the company bank account.',
    terms: [
      { term: 'FSI (Floor Space Index)', def: 'The ratio of allowable built-up construction area relative to the total plot area (e.g. FSI of 2.0 on 10,000 sq ft allows 20,000 sq ft of built construction).' },
      { term: 'IRR (Internal Rate of Return)', def: 'The annualized rate of expected earnings generated by the real estate project over its development horizon.' },
      { term: 'Survey Number', def: 'The unique identification code assigned to a piece of land by the State Revenue Department for tax and boundary mapping.' },
      { term: 'Setback Limits', def: 'Mandatory minimum distances that must be kept clear between physical building walls and the external plot boundary for fire access and road widening.' }
    ],
    stepByStep: [
      'Scouting & Geospatial Tagging: Field surveyors locate land parcels and pin GPS boundary polygons into the system.',
      'Landowner Expectations & Valuation: The acquisition team documents owner asking price, payment structure expectations, and joint-development proposals.',
      'Topography & Soil Assessment: Soil bearing capacity, water table depth, electrical grid proximity, and access road width are recorded.',
      'Architectural Layout Potential: Architects test potential plot typologies, roads, and green spaces against municipal zoning master plans.',
      'Financial Viability Simulation: Projected revenue from plot/villa sales is balanced against land purchase and development costs to calculate ROI and payback period.',
      'Investment Committee Gate: The project requires a minimum feasibility score (>= 75%) to clear Stage 01 and unlock Stage 02 Legal Verification.'
    ],
    diagram: `flowchart TD
    A["Raw Land Lead Scouted by Field Team"] --> B["Geospatial Tagging & GPS Polygon Boundary Log"]
    B --> C["Landowner Terms & Price Negotiation"]
    C --> D["Architectural Density & Municipal FSI Assessment"]
    D --> E["Financial Pro-Forma Modeling (IRR, Payback & Net Margin)"]
    E --> F{"Does Feasibility Score Meet 75% Threshold?"}
    F -- No --> G["Parcel Rejected & Archived in Scouting Bank"]
    F -- Yes --> H["Investment Committee Sanctions Legal Due Diligence"]
    H --> I["Automatic Advancement to Stage 02 Legal Verification"]`,
    roles: [
      { role: 'Land Acquisition Lead', duty: 'Discovers land parcels and leads price negotiations.' },
      { role: 'Chartered Surveyor', duty: 'Performs physical boundary and contour measurements.' },
      { role: 'Chief Financial Analyst', duty: 'Calculates project IRR, cashflows, and capital expenditure needs.' },
      { role: 'Investment Committee', duty: 'Reviews financial feasibility scorecard and authorizes advancing to Stage 02.' }
    ],
    kpis: [
      { name: 'Total Plots', desc: 'Total scouted parcels registered in database', filter: 'all' },
      { name: 'Under Visit / Analysis', desc: 'Parcels currently undergoing site topography and soil checks', filter: 'visitScheduled' },
      { name: 'Feasibility Complete', desc: 'Plots with calculated IRR and civil viability scores', filter: 'underAnalysis' },
      { name: 'Approved for Purchase', desc: 'Management-approved plots cleared for legal audit', filter: 'approved' },
      { name: 'Total Scouted Acreage', desc: 'Cumulative land area scouted across regions', filter: 'acreage' }
    ],
    pitch: 'Stage 01 protects our capital. We scout land scientifically, calculate projected returns upfront, and ensure that only financially viable plots with verified access roads advance to legal due diligence.'
  },
  {
    num: '02',
    fileName: '02_STAGE_LEGAL_VERIFICATION_EXPLAINED.md',
    title: 'Stage 02: Legal Verification & Title Due Diligence',
    route: '/pms/legal-cases',
    plainEnglish: 'Stage 02 performs a deep legal audit on the scouted land parcel. Empaneled advocates inspect 30 to 50 years of historical sale deeds, check for bank mortgages, search revenue court records for family disputes, and publish a public notice in daily newspapers to flush out any hidden claims.',
    problemSolved: 'Land disputes can freeze a real estate development for 15+ years in civil courts. Developers who skip thorough title searches risk finding out that the seller did not own 100% of the land or that an undisclosed bank mortgage exists. Stage 02 makes title clearance a non-negotiable prerequisite.',
    terms: [
      { term: 'Title Search (30-Year Search)', def: 'Examining the chain of custody of all registered deeds over the last 30+ years to confirm undisputed ownership.' },
      { term: 'Encumbrance Certificate (EC)', def: 'A government-issued certificate (Form 15/16) confirming whether the property has registered mortgages, liens, or legal liabilities.' },
      { term: 'Public Notice', def: 'A formal legal advertisement published in state and local newspapers giving 14 days for any third-party claimants to submit written objections.' },
      { term: 'Title Clearance Certificate (TCC)', def: 'A signed, legally binding certificate issued by a senior High Court/District advocate declaring the title marketable and free from encumbrances.' }
    ],
    stepByStep: [
      'Sub-Registrar Archives Inspection: Advocates inspect volume books and registration records dating back at least 30 years.',
      'Encumbrance Verification: Form 15 is downloaded and audited to confirm no banks or lenders hold charges on the land.',
      'Revenue & Civil Court Audit: District collector and civil court records are screened for pending land acquisition or inheritance disputes.',
      'Statutory Public Notice: Formal notices are published in English and vernacular daily newspapers with a mandatory 14-day objection window.',
      'Objection Audit: If no valid objections are lodged within 14 days, the advocate issues a formal Title Clearance Certificate.',
      'Stage Gate Approval: Stage 03 Land Purchase is strictly locked until the Title Clearance Certificate is digitally uploaded and approved.'
    ],
    diagram: `flowchart TD
    A["Feasible Plot Received from Stage 01"] --> B["Sub-Registrar Office 30-Year Title Trail Inspection"]
    B --> C["Encumbrance Certificate (EC Form 15) Audit"]
    C --> D["Revenue Court & Civil Litigation Docket Search"]
    D --> E["Public Notice Publication in State & Local Press"]
    E --> F["Mandatory 14-Day Statutory Objection Window"]
    F --> G{"Any Valid Legal Objections or Claims?"}
    G -- Yes --> H["Issue Title Defect Memo & Reject or Remedy"]
    G -- No --> I["Empaneled Advocate Issues Title Clearance Certificate"]
    I --> J["Automatic Advancement to Stage 03 Land Purchase"]`,
    roles: [
      { role: 'Empaneled Legal Advocate', duty: 'Conducts title search and drafts legal opinions.' },
      { role: 'Revenue Document Liaison', duty: 'Extracts historical 7/12, RTC, mutation, and index entries.' },
      { role: 'Head of Legal & Compliance', duty: 'Reviews advocate opinion and authorizes legal sanction.' }
    ],
    kpis: [
      { name: 'Total Legal Cases', desc: 'All active legal audit records', filter: 'all' },
      { name: 'Under Search', desc: 'Cases undergoing Sub-Registrar records lookup', filter: 'underSearch' },
      { name: 'Public Notice Active', desc: 'Newspaper publication running 14-day claim window', filter: 'noticeActive' },
      { name: 'Title Clear', desc: 'Advocate certified parcels free from encumbrance', filter: 'titleClear' },
      { name: 'Litigation / High Risk', desc: 'Parcels flagged with active litigation or boundary issues', filter: 'litigationFlagged' }
    ],
    pitch: 'Stage 02 guarantees zero legal risk. We conduct an exhaustive 30-year title search, publish newspaper public notices, and mandate an advocate Title Clearance Certificate before paying the seller.'
  },
  {
    num: '03',
    fileName: '03_STAGE_LAND_PURCHASE_REGISTRY_EXPLAINED.md',
    title: 'Stage 03: Land Purchase & Sub-Registrar Registry',
    route: '/pms/land-purchases',
    plainEnglish: 'Stage 03 executes the formal purchase transaction: executing the registered Agreement for Sale, scheduling payment milestones, paying government stamp duty, executing the Sale Deed before the Sub-Registrar, taking physical possession, and mutating land revenue records into company name.',
    problemSolved: 'Informal land deals often result in seller disputes, delayed stamp duty penalties, or failure to update government revenue records (Mutation/Khata). If mutation is delayed, the previous owner can illegally attempt to resell the land. Stage 03 governs every rupee and seals revenue mutation.',
    terms: [
      { term: 'Agreement for Sale', def: 'A legally binding contract detailing consideration terms, payment dates, and obligations prior to registration.' },
      { term: 'Stamp Duty & Registration Fee', def: 'State government taxes paid to legally validate property ownership transfer (typically 5% to 8% of property market value).' },
      { term: 'Sub-Registrar Office (SRO)', def: 'The state government authority responsible for officially recording property deeds and biometric seller/buyer consent.' },
      { term: 'Revenue Mutation (Khata / 7-12 Transfer)', def: 'Updating the local revenue registry to officially reflect the company as the lawful tax-paying owner.' }
    ],
    stepByStep: [
      'Agreement for Sale Drafting: Legal contracts are drawn with milestones, default penalties, and boundary schedules.',
      'Milestone Payment Releases: Token, earnest money, and registration balances are disbursed with mandatory 1% TDS deduction under section 194-IA.',
      'E-Stamping & Fee Payment: Government challans for stamp duty and registration fees are generated and verified.',
      'Sub-Registrar Registration: Buyer and seller appear before the Sub-Registrar for biometric authentication, photograph, and deed registration.',
      'Physical Demarcation: Company boundary pillars and fencing are erected immediately upon registration.',
      'Tehsildar Mutation: Revenue records (Khata / RTC / 7-12 extract) are updated into company name, unlocking Stage 04 Project Planning.'
    ],
    diagram: `flowchart TD
    A["Title Cleared Parcel from Stage 02"] --> B["Agreement for Sale Execution & Token Disbursement"]
    B --> C["Payment Milestone Tracking & 1% TDS Deduction"]
    C --> D["E-Stamping & Sub-Registrar Appointment Booking"]
    D --> E["Biometric Registration & Registered Sale Deed Issued"]
    E --> F["Immediate Physical Possession & Boundary Fencing"]
    F --> G["Revenue Department Mutation (Khata / RTC Transfer)"]
    G --> H["Automatic Advancement to Stage 04 Project Planning"]`,
    roles: [
      { role: 'Finance / Treasury Officer', duty: 'Coordinates bank drafts, RTGS transfers, and TDS payments.' },
      { role: 'Registration Liaison', duty: 'Manages appointments, e-challans, and biometric appointments at SRO.' },
      { role: 'Survey Boundary Engineer', duty: 'Installs physical boundary pillars and boundary fences.' }
    ],
    kpis: [
      { name: 'Total Land Purchases', desc: 'Total purchase transactions recorded', filter: 'all' },
      { name: 'Agreement Phase', desc: 'Deals with executed agreement to sell awaiting registration', filter: 'agreementPhase' },
      { name: 'Registration Scheduled', desc: 'Awaiting appointment at Sub-Registrar office', filter: 'registrationScheduled' },
      { name: 'Registered & Mutated', desc: 'Fully registered with updated revenue records', filter: 'registered' },
      { name: 'Total Land Capital Deployed', desc: 'Cumulative capital invested in land acquisition', filter: 'capital' }
    ],
    pitch: 'Stage 03 manages our land capital deployment. We ensure every sale deed is biometrically registered, tax deductions are verified, and government revenue mutation is completed so our title is indisputable.'
  },
  {
    num: '04',
    fileName: '04_STAGE_PROJECT_PLANNING_APPROVALS_EXPLAINED.md',
    title: 'Stage 04: Project Planning & Statutory Sanctions',
    route: '/pms/planning',
    plainEnglish: 'Stage 04 transforms raw mutated land into an engineered master plan. Architects and civil engineers design the road layout, stormwater drainage, amenity spaces (clubhouse, parks, utility yards), plot/villa typology zoning, and compile the preliminary civil development budget while submitting files for RERA and town planning sanctions.',
    problemSolved: 'Starting site work without coordinated layouts leads to redesigns, wasted excavation, non-compliant road widths, and regulatory fines under RERA. Stage 04 creates the blueprint master plan and links it directly to development budgeting.',
    terms: [
      { term: 'Master Layout Plan', def: 'The comprehensive site blueprint showing internal roads, plots, public open spaces, and utility reservations.' },
      { term: 'RERA (Real Estate Regulatory Authority)', def: 'The statutory body that protects buyers and requires developers to register project layouts, timelines, and budgets before marketing.' },
      { term: 'BOQ (Bill of Quantities)', def: 'An itemized schedule of civil works detailing estimated quantities (cubic meters of concrete, metric tons of steel, linear meters of piping).' },
      { term: 'Statutory Sanction', def: 'Formal legal approvals granted by local municipal bodies, town planning authorities, fire safety, and pollution control boards.' }
    ],
    stepByStep: [
      'Topographical Master Layout: Architects design road geometry, drainage slopes, and plot divisions conforming to local building bye-laws.',
      'Utility & Infrastructure Design: Engineers calculate storm water runoff, sewage treatment plant (STP) capacity, and electrical transformer locations.',
      'Amenity & Typology Allocation: Plots and villas are categorized by size (e.g., 30x40, 40x60), orientation, and park proximity.',
      'Development Budgeting: Civil engineers compute initial BOQ cost estimates for earthwork, asphalt roads, curbs, and streetlighting.',
      'Statutory & RERA Submissions: Sanction dossiers are submitted to the municipal authority and the State RERA authority.',
      'Management Approval Gate: Once layouts are sanctioned and preliminary budgets are approved, the project unlocks Stage 05 Pre-Site Start.'
    ],
    diagram: `flowchart TD
    A["Mutated Land Parcel from Stage 03"] --> B["Architectural Master Layout & Road Geometry"]
    B --> C["Stormwater Drainage, Sewerage & Electrical Network Engineering"]
    C --> D["Plot / Villa Typology Zoning & Open Space Allocation"]
    D --> E["Preliminary Civil Development Budget Formulation (BOQ)"]
    E --> F["Town Planning Sanction & RERA Dossier Filing"]
    F --> G{"Are Statutory Approvals & Sanctions Cleared?"}
    G -- Yes --> H["Management Sanction Sign-off"]
    H --> I["Automatic Advancement to Stage 05 Pre-Site Mobilization"]`,
    roles: [
      { role: 'Chief Architect / Urban Planner', duty: 'Designs layout and road connectivity.' },
      { role: 'Infrastructure Civil Engineer', duty: 'Calculates drainage slopes, utility networks, and BOQ.' },
      { role: 'Liaison & Sanctions Officer', duty: 'Coordinates municipal and RERA approvals.' }
    ],
    kpis: [
      { name: 'Total Plans', desc: 'Total registered project planning & design master records', filter: 'all' },
      { name: 'In Planning', desc: 'Projects actively progressing through design stages', filter: 'inPlanning' },
      { name: 'Awaiting Sanction', desc: 'Completed designs pending municipal or management sanction', filter: 'managementApproval' },
      { name: 'Approved Plans', desc: 'Fully sanctioned plans cleared for contractor selection', filter: 'approved' },
      { name: 'Total Dev Budget', desc: 'Cumulative estimated civil infrastructure development budget', filter: 'hasBudget' }
    ],
    pitch: 'Stage 04 establishes our engineering and regulatory foundation. We create fully sanctioned layouts and preliminary development budgets to eliminate design revisions and ensure 100% RERA compliance.'
  },
  {
    num: '05',
    fileName: '05_STAGE_PRE_SITE_MOBILIZATION_EXPLAINED.md',
    title: 'Stage 05: Pre-Site Mobilization & Contractor Selection',
    route: '/pms/pre-site',
    plainEnglish: 'Stage 05 prepares the physical site for ground-breaking. It shortlists qualified civil contractors, negotiates itemized unit rates (concrete casting, excavation, masonry), executes formal Work Orders, and sets up temporary site electricity, borewell water, security fencing, and the engineer site office.',
    problemSolved: 'Allowing contractors onto a project without signed contracts, fixed unit rates, or site utilities results in contractor abandonment, rate disputes, safety hazards, and immediate project stalls. Stage 05 ensures complete contractual and logistical readiness.',
    terms: [
      { term: 'Work Order (WO)', def: 'A legally binding contract between the developer and contractor defining project scope, item rates, milestone schedules, and penalty clauses.' },
      { term: 'Item Rate Card', def: 'The agreed fixed unit price for each unit of construction work (e.g. ₹4,500 per cubic meter of RCC concrete, ₹120 per cubic meter of soil excavation).' },
      { term: 'Site Mobilization', def: 'Erecting perimeter security fences, connecting water/power utilities, setting up material godowns, and deploying supervisory staff.' },
      { term: 'Defect Liability Period (Contractor)', def: 'A contractual clause requiring the contractor to repair workmanship defects free of charge for 12 months after completion.' }
    ],
    stepByStep: [
      'Contractor Prequalification: Contractor track records, past projects, machinery fleet, and financial health are audited.',
      'Competitive Rate Negotiation: Bids are benchmarked across item categories to establish the lowest competitive rate card.',
      'Formal Work Order Execution: Contracts are digitally stamped with milestones, retention terms, and penalty stipulations.',
      'Temporary Site Utilities: Borewells, temporary 3-phase power, high-security store godowns, and worker amenities are established.',
      'Deployment of Site Engineering Gangs: Project site engineers, safety officers, and quality leads take charge of physical site access.',
      'Pre-Site Sign-off: Management verifies physical readiness, unlocking Stage 06 Baseline Planning.'
    ],
    diagram: `flowchart TD
    A["Sanctioned Master Plan from Stage 04"] --> B["Contractor Shortlisting & Technical Bid Auditing"]
    B --> C["Competitive Item Rate Finalization & Negotiation"]
    C --> D["Formal Work Order (WO) Issuance & Contract Stamping"]
    D --> E["Site Mobilization: Perimeter Fencing, Water & Electricity Setup"]
    E --> F["Site Engineer Deployment & Godown Warehouse Readiness"]
    F --> G["Executive Mobilization Sign-off"]
    G --> H["Automatic Advancement to Stage 06 Baseline Planning"]`,
    roles: [
      { role: 'Procurement & Contracts Lead', duty: 'Negotiates rate cards and executes contractor Work Orders.' },
      { role: 'Site In-Charge Engineer', duty: 'Supervises temporary site utility setup and warehouse fencing.' },
      { role: 'Safety Officer', duty: 'Establishes safety signage, PPE compliance, and worker welfare facilities.' }
    ],
    kpis: [
      { name: 'Total Workflows', desc: 'Total pre-site mobilization workflows registered', filter: 'all' },
      { name: 'In Procurement', desc: 'Active contractor bidding and rate negotiations', filter: 'inPreSite' },
      { name: 'Awaiting Sign-off', desc: 'Completed setups awaiting management approval', filter: 'managementApproval' },
      { name: 'Mobilized & Approved', desc: 'Sites fully mobilized with deployed engineering teams', filter: 'approved' },
      { name: 'Total Work Orders', desc: 'Cumulative value of executed contractor agreements', filter: 'hasWorkOrder' }
    ],
    pitch: 'Stage 05 eliminates contractor ambiguity. We lock competitive unit rate cards, execute formal work orders, and prepare on-site utilities before construction commences.'
  },
  {
    num: '06',
    fileName: '06_STAGE_BASELINE_PLANNING_EXPLAINED.md',
    title: 'Stage 06: Baseline Planning & Governance Lock',
    route: '/pms/baseline',
    model: 'BaselinePlanning',
    plainEnglish: 'Stage 06 is the project commitment gate. Here, project engineers lock down the target Bill of Materials (BOM), planned labor gang headcounts, critical milestone timelines, and monthly cashflow requirements. Once reviewed, executive leadership enforces an immutable Baseline Lock (Freeze) that prevents unapproved budget alterations.',
    problemSolved: 'Without an immutable baseline, budgets continuously inflate and project managers shift deadlines backward to hide delays. Stage 06 freezes the original scope, schedule, and budget so that all future cost and schedule variances can be audited scientifically.',
    terms: [
      { term: 'BOM (Bill of Materials)', def: 'The master inventory schedule specifying the exact quantity and grade of cement, TMT steel, aggregate, pipes, and bricks required for the entire project.' },
      { term: 'Labour Gang', def: 'A specialized construction team consisting of a head mason, bar benders, carpenters, and helpers operating together.' },
      { term: 'Baseline Freeze / Lock', def: 'A digital governance freeze that locks the project scope, budget, and timeline. No user can alter these numbers without a formal change order.' },
      { term: 'Cashflow Pro-Forma', def: 'A month-by-month financial projection mapping capital outflows (procurement & labour) against anticipated customer collections.' }
    ],
    stepByStep: [
      'Material BOM Matrix: Engineers detail expected consumption across each major material grade with target purchase unit rates.',
      'Labour Gang Scheduling: Headcounts for daily peak, average, and specialized manpower are mapped per work package.',
      'Milestone Timeline Scheduling: Key civil milestones (earthwork, drainage, paving, landscaping) are plotted with critical path logic.',
      'Cashflow Modeling: Monthly capital expenditure drawdowns are finalized to secure treasury financing.',
      'Executive Baseline Governance Review: Senior leadership audits the planned margin, schedule duration, and contingency reserves.',
      'Enforcing Baseline Lock: The baseline is digitally frozen. Once locked, the project unlocks Stage 07 Procurement and Stage 08 Construction.'
    ],
    diagram: `flowchart TD
    A["Mobilized Site from Stage 05"] --> B["Detailed Material BOM Formulation (Steel, Cement, Aggregate)"]
    B --> C["Labour Gang Headcount Scheduling (Masons, Barbenders, Helpers)"]
    C --> D["Critical Path Milestone Schedule & Timeline Gantt Formulation"]
    D --> E["Month-by-Month Capital Cashflow Forecasting"]
    E --> F["Executive Leadership Governance Audit"]
    F --> G["Baseline Lock (Freeze) Enforced by Leadership"]
    G --> H["Automatic Advancement to Stage 07 Procurement & Stage 08 Execution"]`,
    roles: [
      { role: 'Project Director', duty: 'Formulates baseline milestones and BOM targets.' },
      { role: 'Chief Financial Officer (CFO)', duty: 'Audits cashflow drawdowns and capital allocation.' },
      { role: 'Executive Managing Director', duty: 'Enforces the formal digital Baseline Lock signature.' }
    ],
    kpis: [
      { name: 'Total Baselines', desc: 'Total registered project baseline master plans', filter: 'all' },
      { name: 'In Planning', desc: 'Formulating BOM, labor gangs, or cashflows', filter: 'inPlanning' },
      { name: 'Awaiting Lock', desc: 'Complete baselines awaiting executive freeze', filter: 'baselineReview' },
      { name: 'Frozen & Locked', desc: 'Baselines officially frozen for execution monitoring', filter: 'locked' },
      { name: 'Total Baseline Budget', desc: 'Cumulative baseline budget allocation across all projects', filter: 'hasBudget' }
    ],
    pitch: 'Stage 06 provides our project benchmark. We freeze the BOM, labor headcount, schedule, and budget so leadership has an unalterable standard to measure actual field execution against.'
  },
  {
    num: '07',
    fileName: '07_STAGE_PROCUREMENT_INVENTORY_EXPLAINED.md',
    title: 'Stage 07: Procurement & FIFO Inventory Management',
    route: '/pms/procurement',
    plainEnglish: 'Stage 07 manages the construction supply chain. Site engineers raise material purchase indents against the approved baseline BOM, procurement issues purchase orders to verified vendors, incoming trucks are inspected at the gate with Goods Receipt Notes (GRN), materials are warehoused, and inventory is issued to sub-contractors on a First-In-First-Out (FIFO) basis.',
    problemSolved: 'Material costs account for 60% of civil construction. Sites frequently suffer from double-ordering, delivery of substandard materials, ghost shipments, and material theft. Stage 07 tracks every bag of cement and ton of steel from vendor invoice to contractor consumption.',
    terms: [
      { term: 'Indent / Purchase Requisition', def: 'A formal internal request raised by a site engineer stating the item, quantity, and required delivery date.' },
      { term: 'Purchase Order (PO)', def: 'The commercial contract dispatched to an approved vendor specifying item specs, delivery timeline, tax terms, and payment milestones.' },
      { term: 'Goods Receipt Note (GRN)', def: 'The official document generated at the site gate after physical weighment, quality testing, and bill verification.' },
      { term: 'FIFO (First-In, First-Out)', def: 'An inventory accounting method where materials received earliest are issued first, ensuring accurate landed cost tracking and preventing material degradation.' }
    ],
    stepByStep: [
      'Indent Validation: Site engineers submit material indents, which the system automatically checks against remaining baseline BOM allowances.',
      'Vendor PO Issuance: Commercial purchase orders are dispatched to approved vendors with delivery deadlines.',
      'Gate Inward & Inspection: Trucks arrive at site gate; security checks weighbridge slips, delivery challans, and physical counts.',
      'Quality Lab Sampling: Lab technicians draw concrete and steel samples before authorizing unloading into warehouses.',
      'GRN Creation & FIFO Stacking: Official GRNs are generated and batch codes are assigned to inventory stacks.',
      'Stock Issue to Contractors: Material is issued only against formal contractor requisitions linked to their active work order.'
    ],
    diagram: `flowchart TD
    A["Locked Baseline BOM from Stage 06"] --> B["Site Purchase Indent Raised (Checked vs BOM Allowance)"]
    B --> C["Vendor Purchase Order (PO) Issuance & Delivery Scheduling"]
    C --> D["Material Arrival at Site Gate & Weighbridge Slips"]
    D --> E["Quality Inspection & Lab Sample Extraction"]
    E --> F["Goods Receipt Note (GRN) Generation & Warehouse Stacking"]
    F --> G["FIFO Inventory Ledger Accounting & Landed Cost Valuation"]
    G --> H["Controlled Stock Issue to Sub-Contractors"]
    H --> I["Automatic Advancement to Stage 08 Construction Execution"]`,
    roles: [
      { role: 'Site Storekeeper', duty: 'Inspects incoming deliveries, verifies challans, and issues stock.' },
      { role: 'Purchase Manager', duty: 'Negotiates vendor pricing and tracks PO delivery schedules.' },
      { role: 'Quality Control Technician', duty: 'Draws field samples of cement, steel, and sand.' }
    ],
    kpis: [
      { name: 'Total Procurement Records', desc: 'All procurement tracking records', filter: 'all' },
      { name: 'Active Indents', desc: 'Material requisitions currently being processed', filter: 'activeIndents' },
      { name: 'PO Dispatched', desc: 'Orders placed with vendors awaiting shipment', filter: 'poDispatched' },
      { name: 'GRN Inwarded', desc: 'Materials received and accepted into store', filter: 'grnInwarded' },
      { name: 'Warehouse Stock Value', desc: 'Total book value of inventory currently in site store', filter: 'stockValue' }
    ],
    pitch: 'Stage 07 controls our largest expense. We validate every purchase against the baseline BOM, verify physical deliveries at the gate with GRNs, and enforce FIFO inventory accounting.'
  },
  {
    num: '08',
    fileName: '08_STAGE_CONSTRUCTION_EXECUTION_EXPLAINED.md',
    title: 'Stage 08: Construction Execution Engine & Daily Progress (DPR)',
    route: '/pms/construction',
    plainEnglish: 'Stage 08 is the heartbeat of on-site construction. Site supervisors submit Daily Progress Reports (DPR) detailing exact work completed that day, log labor muster rolls (skilled masons, helpers, machine operators), track heavy machinery operating hours (JCB, transit mixers), and capture timestamped progress photos.',
    problemSolved: 'Construction projects fail silently because office management is blind to what happens on site every day. Contractors exaggerate work progress while hiding labor shortages and weather delays. Stage 08 captures objective daily field data that feeds directly into quality control and contractor billing.',
    terms: [
      { term: 'Daily Progress Report (DPR)', def: 'The official daily log capturing physical quantities completed (e.g. 85 cubic meters of concrete poured, 120 meters of drain pipe laid).' },
      { term: 'Muster Roll', def: 'The daily attendance register recording total labor headcounts by trade and contractor gang deployed on site.' },
      { term: 'Heavy Machinery Log', def: 'Tracking operating vs idle engine hours for leased or company-owned construction equipment.' },
      { term: 'Milestone Verification', def: 'Independent physical inspection confirming that a defined civil package (e.g. Sub-grade road compaction) is 100% complete.' }
    ],
    stepByStep: [
      'Daily Work Package Briefing: Site engineers assign daily production targets to contractor gangs during morning toolbox talks.',
      'Labour Attendance Logging: Muster roll headcounts are captured and categorized (masons, carpenters, barbenders, helpers).',
      'Machinery Usage Tracking: Engine start/stop hours and diesel consumption are recorded for excavators, rollers, and mixers.',
      'Field Quantity Measurement: At the end of each shift, actual physical output is measured and logged into the daily DPR.',
      'Site Diary & Photo Capture: Weather interruptions, government inspections, and photographic evidence are uploaded.',
      'Site Engineer Sign-off: The verified DPR updates the master project execution ledger, feeding Stage 09 Quality and Stage 11 Finance.'
    ],
    diagram: `flowchart TD
    A["Materials & Site Mobilized from Stage 07"] --> B["Morning Task Allocation & Worker Safety Toolbox Talk"]
    B --> C["Daily Labour Muster Roll Attendance Recording"]
    C --> D["Heavy Machinery & Equipment Engine Hours Logged"]
    D --> E["Daily Physical Output Measurement (Cubic / Linear Meters)"]
    E --> F["Daily Progress Report (DPR) Submission with Photos"]
    F --> G["Civil Milestone Work Package Verification"]
    G --> H["Automatic Advancement to Stage 09 Quality Control"]`,
    roles: [
      { role: 'Site Engineer', duty: 'Measures daily field outputs and submits the DPR.' },
      { role: 'Timekeeper / Muster Officer', duty: 'Counts labor attendance and verifies contractor gang sizes.' },
      { role: 'Equipment Supervisor', duty: 'Monitors fuel usage and operating hours of heavy plant machinery.' }
    ],
    kpis: [
      { name: 'Active Sites', desc: 'Projects under active physical construction', filter: 'all' },
      { name: 'DPRs Logged Today', desc: 'Daily Progress Reports submitted in the current cycle', filter: 'hasDpr' },
      { name: 'On-Site Workforce', desc: 'Total labor headcounts deployed across all active sites', filter: 'laborHeadcount' },
      { name: 'Milestones Completed', desc: 'Civil milestones executed and awaiting quality check', filter: 'approved' },
      { name: 'Machinery Operating Hours', desc: 'Cumulative heavy equipment operational hours', filter: 'machinery' }
    ],
    pitch: 'Stage 08 provides total operational visibility. We log daily progress reports, verify labor attendance, and record machine utilization so leadership knows the exact status of physical construction every single day.'
  },
  {
    num: '09',
    fileName: '09_STAGE_QUALITY_CONTROL_SNAGS_EXPLAINED.md',
    title: 'Stage 09: Quality Control & Snag Remediation',
    route: '/pms/quality',
    plainEnglish: 'Stage 09 enforces engineering excellence and safety. Quality auditors conduct mandatory civil laboratory tests (concrete cube compressive strength, steel tensile tests, slump tests), perform pressure tests on water and drainage lines, create photographic snag lists for contractor defects, and verify 100% de-snagging before clearance.',
    problemSolved: 'Poor quality construction leads to structural cracks, water seepage, failed municipal inspections, and angry homebuyers. In traditional setups, contractors hide defective work under plaster or paint. Stage 09 blocks contractor payment until every snag is remediated and lab tests pass.',
    terms: [
      { term: 'Concrete Cube Test', def: 'Crushing concrete test cubes at 7, 14, and 28 days to scientifically prove that concrete achieves its designed compressive strength (e.g. M25 / M30 grade).' },
      { term: 'Slump Test', def: 'A standard on-site test measuring the workability and water-cement consistency of fresh concrete before pouring.' },
      { term: 'Snag List', def: 'A photographic punch-list identifying defective workmanship (hollow tiles, plaster cracks, misaligned pipes, paint blemishes).' },
      { term: 'De-Snagging', def: 'The physical rectification of identified snags by the contractor, followed by mandatory re-inspection by quality auditors.' }
    ],
    stepByStep: [
      'Lab Sample Testing: Quality teams test concrete crushing strength at 7, 14, and 28-day curing intervals; test results are logged.',
      'MEP Integrity Inspections: Water supply lines are subjected to hydraulic pressure holding tests; drainage pipes are tested for slope and leaks.',
      'Field Snag List Logging: Inspectors photograph defects, assign severity ratings (Critical, High, Medium, Minor), and tag responsible contractors.',
      'Contractor Rectification: Contractors receive automated defect notices and must fix the snags within established SLA windows.',
      'Re-Inspection & Verification: Quality auditors re-inspect rectified areas, upload comparison photos, and close tickets.',
      'Quality Clearance Certificate: Once zero open snags remain and all lab tests pass, the audit certificate is issued, unlocking Stage 11 Finance.'
    ],
    diagram: `flowchart TD
    A["Executed Civil Works from Stage 08"] --> B["Concrete Compressive Cube Crushing Tests (7/14/28 Days)"]
    B --> C["MEP Hydraulic Pressure & Electrical Continuity Tests"]
    C --> D["Field Snag List Formulation with Photographic Evidence"]
    D --> E["Contractor Defect Remediation & Rectification"]
    E --> F["Re-Inspection by Independent Quality Auditor"]
    F --> G{"Are All Defects Rectified (Zero Open Snags)?"}
    G -- No --> D
    G -- Yes --> H["Issuance of Quality Clearance Certificate"]
    H --> I["Unlocks Stage 10 Project Control & Stage 11 Finance Billing"]`,
    roles: [
      { role: 'Quality Assurance (QA) Manager', duty: 'Audits lab test certificates and signs off quality certificates.' },
      { role: 'Quality Control Inspector', duty: 'Walks sites, photographs defects, and maintains snag registers.' },
      { role: 'Materials Testing Lab Tech', duty: 'Performs compression machine tests on concrete and slump tests.' }
    ],
    kpis: [
      { name: 'Quality Audits', desc: 'Total quality control and snagging audit records', filter: 'all' },
      { name: 'Inspections in Progress', desc: 'Active field audits undergoing verification', filter: 'inProgress' },
      { name: 'Open Snags', desc: 'Identified defects currently under contractor remediation', filter: 'hasOpenSnags' },
      { name: 'Certified Zero-Snag', desc: 'Audits with 100% defects cleared and certified', filter: 'approved' },
      { name: 'Total Tests Cleared', desc: 'Cumulative lab tests passed (slump, cube, rebar)', filter: 'hasInspections' }
    ],
    pitch: 'Stage 09 protects our structural integrity and brand. We enforce concrete lab testing, photograph every snag, and mandate zero open defects before any contractor invoice can be cleared.'
  },
  {
    num: '10',
    fileName: '10_STAGE_PROJECT_CONTROL_VARIANCE_EXPLAINED.md',
    title: 'Stage 10: Project Control & Variance (EVM / SPI / CPI)',
    route: '/pms/project-control',
    plainEnglish: 'Stage 10 is the executive intelligence engine of PMS. It calculates PMI-standard Earned Value Management (EVM) metrics by comparing the baseline budget against actual field progress and financial disbursements. It generates Cost Variance (CV), Schedule Variance (SV), Cost Performance Index (CPI), and Schedule Performance Index (SPI) to provide instant early warnings of budget overruns or project delays.',
    problemSolved: 'In typical projects, executives only discover that a project is over budget or 6 months behind schedule when the bank funds run out. Stage 10 calculates performance indices in real time, alerting leadership months before small variances become financial disasters.',
    terms: [
      { term: 'Planned Value (PV)', def: 'The budgeted cost of work scheduled to be completed by today according to the baseline.' },
      { term: 'Earned Value (EV)', def: 'The budgeted cost of work actually completed on the ground today based on verified DPRs.' },
      { term: 'Actual Cost (AC)', def: 'The actual money spent and disbursed to contractors and vendors to date.' },
      { term: 'Cost Performance Index (CPI)', def: 'A measure of financial efficiency (CPI = EV / AC). A CPI of 1.0 is on budget; < 1.0 means cost overrun.' },
      { term: 'Schedule Performance Index (SPI)', def: 'A measure of timeline efficiency (SPI = EV / PV). An SPI of 1.0 is on schedule; < 1.0 means project delay.' }
    ],
    stepByStep: [
      'Data Consolidation: The system combines Stage 06 Baseline (PV), Stage 08 DPR Progress (EV), and Stage 11 Finance (AC).',
      'Variance Computation: The engine calculates Cost Variance (CV = EV - AC) and Schedule Variance (SV = EV - PV).',
      'Index Scoring: CPI and SPI ratios are calculated to benchmark efficiency against global construction standards.',
      'Forecast at Completion (EAC): The engine projects the final anticipated project cost and completion date based on current run rates.',
      'Critical Variance Alerting: If CPI or SPI drops below 0.95 (5% adverse variance), the project is flagged for executive intervention.',
      'Corrective Action Formulation: Project managers submit remediation plans (e.g. adding labour gangs or value-engineering materials) to restore project health.'
    ],
    diagram: `flowchart TD
    A["Baseline Schedule (PV) + Field Progress (EV) + Accounts Ledger (AC)"] --> B["Compute Cost Variance: CV = EV - AC"]
    B --> C["Compute Schedule Variance: SV = EV - PV"]
    C --> D["Calculate Global Efficiency Indices: CPI = EV/AC | SPI = EV/PV"]
    D --> E{"Are Indices in Safe Zone? (CPI >= 0.95 & SPI >= 0.95)"}
    E -- No --> F["Trigger Executive Variance Alert & Corrective Recovery Plan"]
    E -- Yes --> G["Project Health Green & On Target"]
    F --> H["Management Reallocation of Resources / Headcounts"]
    G --> I["Unlocks Stage 11 Final Financial Clearances"]`,
    roles: [
      { role: 'Project Controls Specialist', duty: 'Audits EVM formulas, critical paths, and schedule buffers.' },
      { role: 'Chief Planning Officer', duty: 'Reviews variance trends across all regional projects.' },
      { role: 'Executive Managing Director', duty: 'Intervenes when projects breach critical variance thresholds.' }
    ],
    kpis: [
      { name: 'Tracked Projects', desc: 'Projects under active variance and EVM surveillance', filter: 'all' },
      { name: 'Within Budget & Time', desc: 'Projects operating with CPI >= 1.0 and SPI >= 1.0', filter: 'withinBudget' },
      { name: 'Cost Overrun Risk', desc: 'Projects where AC exceeds EV (CPI < 0.95)', filter: 'costOverrun' },
      { name: 'Schedule Delayed', desc: 'Projects tracking behind baseline timeline (SPI < 0.95)', filter: 'scheduleDelayed' },
      { name: 'Critical Variance Ledgers', desc: 'Projects requiring immediate executive recovery intervention', filter: 'hasVariance' }
    ],
    pitch: 'Stage 10 is our management radar. Using Earned Value Management, it tells leadership exactly whether we are making money or losing money, and whether we are ahead of or behind schedule, with PMI-standard CPI and SPI indices.'
  },
  {
    num: '11',
    fileName: '11_STAGE_FINANCE_RA_BILLING_EXPLAINED.md',
    title: 'Stage 11: Finance & Contractor RA Billing Engine',
    route: '/pms/finance',
    plainEnglish: 'Stage 11 manages the project treasury and contractor bill settlement. It converts field measurements recorded in the Measurement Book (MB) into contractor Running Account (RA) bills, applies mandatory statutory deductions (TDS, GST TDS, labor cess), withholds 5% contractor retention money, and routes audited net payouts for executive approval before bank disbursement.',
    problemSolved: 'Overpaying contractors or paying for unexecuted work is the primary cause of developer bankruptcy. In unmanaged projects, contractors submit inflated invoices that accounts teams blindly pay. Stage 11 requires double-entry proof: zero money is paid unless matched to verified Measurement Books and zero-snag quality certificates.',
    terms: [
      { term: 'Measurement Book (MB)', def: 'The official legal engineering ledger where joint field measurements of executed work are recorded by the developer engineer and contractor representative.' },
      { term: 'Running Account (RA) Bill', def: 'Periodic interim invoices submitted by a contractor claiming payment for progress achieved during a billing cycle (e.g. RA Bill 01, RA Bill 02).' },
      { term: 'Retention Money (Security Deposit)', def: 'A mandatory 5% deduction withheld from every contractor bill, held by the developer for 12 months as security against post-handover defects.' },
      { term: 'Statutory Deductions', def: 'Government-mandated tax withholdings including 1% to 2% TDS under Section 194C, 2% GST TDS, and 1% Building & Other Construction Workers (BOCW) Cess.' }
    ],
    stepByStep: [
      'Joint Field Measurement: Developer quantity surveyors and contractor engineers measure physical works and sign the Measurement Book.',
      'RA Bill Inwarding: The contractor submits their RA invoice detailing claimed quantities against agreed work order unit rates.',
      'Quantity & Quality Reconciliation: The finance engine validates claimed quantities against the MB ledger and Stage 09 Quality Clearance.',
      'Automated Deductions: The system automatically withholds 5% retention money, recovers material advances, and calculates TDS and GST withholdings.',
      'CFO & Executive Payment Sanction: The net payable invoice is audited and approved by the finance controller.',
      'Bank Disbursement & Retention Ledger: Bank RTGS advice is generated, payment UTR is logged, and retention amounts are credited to the security ledger.'
    ],
    diagram: `flowchart TD
    A["Verified DPR (Stage 08) + Quality Clearance (Stage 09)"] --> B["Joint Field Measurement Book (MB) Recording"]
    B --> C["Contractor Running Account (RA) Bill Inward Submission"]
    C --> D["Quantity Surveyor & Finance Audit (Checked vs MB Ledger)"]
    D --> E["Statutory & Security Deductions (5% Retention, 2% TDS, GST)"]
    E --> F["CFO & Executive Payment Approval"]
    F --> G["Bank RTGS Payment Advice Issued & UTR Recorded"]
    G --> H["Retention Money Ledger Accounting"]
    H --> I["Automatic Advancement to Stage 12 Handover & Possession"]`,
    roles: [
      { role: 'Quantity Surveyor (QS)', duty: 'Measures physical site work and certifies the Measurement Book.' },
      { role: 'Billing & Finance Accountant', duty: 'Audits tax deductions, invoice compliance, and advances.' },
      { role: 'Chief Financial Officer (CFO)', duty: 'Authorizes final treasury release and bank payment advice.' }
    ],
    kpis: [
      { name: 'Tracked Ledgers', desc: 'Total project financial accounts under active governance', filter: 'all' },
      { name: 'Gross Disbursed', desc: 'Cumulative contractor payouts cleared and paid', filter: 'hasOutflow' },
      { name: 'Pending Clearances', desc: 'Approved RA bills pending treasury disbursement', filter: 'pendingClearance' },
      { name: 'Certified & Settled', desc: 'Projects with audited contractor bill closures', filter: 'approved' },
      { name: 'Contractor RA Billings', desc: 'Total running account bill value certified to date', filter: 'hasRaBills' }
    ],
    pitch: 'Stage 11 is our financial fortress. Not a single rupee is paid to contractors without joint measurement book entries, quality clearances, statutory tax deductions, and a 5% safety retention hold.'
  },
  {
    num: '12',
    fileName: '12_STAGE_HANDOVER_POSSESSION_EXPLAINED.md',
    title: 'Stage 12: Handover & Customer Possession Management',
    route: '/pms/handover',
    plainEnglish: 'Stage 12 orchestrates the grand finale of construction: transitioning completed properties to excited homebuyers. It verifies statutory municipal Occupancy Certificates (OC), conducts professional deep cleaning, facilitates a joint walk-through inspection with the buyer, achieves zero-snag customer sign-off, and delivers keys with a branded welcome kit and possession documentation.',
    problemSolved: 'Handing over dirty, poorly finished units with leaky faucets or cosmetic scratches causes furious customer disputes, withheld final payments, and viral social media complaints. Stage 12 enforces a rigorous pre-delivery inspection (PDI) and customer joint walk-through to ensure every home is delivered in pristine condition.',
    terms: [
      { term: 'Occupancy Certificate (OC)', def: 'The municipal government certificate declaring that the building was constructed in full compliance with sanctioned plans and is safe for human habitation.' },
      { term: 'Pre-Delivery Inspection (PDI)', def: 'An internal exhaustive inspection of every door, window, electrical outlet, and plumbing fixture before inviting the customer.' },
      { term: 'Deep Cleaning Certification', def: 'Professional scrubbing of floors, polishing of glass panes, sanitization of bathrooms, and pest control treatment.' },
      { term: 'Possession Letter & Welcome Kit', def: 'The formal legal document transferring physical custody, accompanied by unit keys, appliance warranty cards, and resident club manuals.' }
    ],
    stepByStep: [
      'Statutory Clearance Verification: Confirming municipal Occupancy Certificate, fire safety NOC, and electrical inspector approvals.',
      'Internal Pre-Delivery Inspection (PDI): Developer engineers audit finishes, paint sheen, tile leveling, and MEP functions.',
      'Professional Deep Cleaning: Specialized cleaning teams polish glass, scrub tiles, and sanitize the premises.',
      'Joint Customer Walk-Through: The buyer and customer relations executive walk the home together with a digital checklist.',
      'Immediate Touch-Up Rectification: Any minor cosmetic concerns raised by the buyer are resolved within 48 hours by rapid-response teams.',
      'Key Handover & Document Execution: The buyer signs the Zero-Snag Possession Certificate and receives keys, welcome gifts, and utility meter readings.'
    ],
    diagram: `flowchart TD
    A["Financially Settled Construction from Stage 11"] --> B["Municipal Occupancy Certificate (OC) Verification"]
    B --> C["Internal Pre-Delivery Inspection (PDI) Audit"]
    C --> D["Professional Deep Cleaning & Chemical Sanitization"]
    D --> E["Joint Homebuyer Walk-Through Inspection"]
    E --> F{"Any Customer Snags Identified?"}
    F -- Yes --> G["48-Hour Rapid Remediation Squad Action"]
    F -- No --> H["Customer Signs Zero-Snag Possession Certificate"]
    G --> H
    H --> I["Delivery of Unit Keys, Welcome Kit & Appliance Warranties"]
    I --> J["Automatic Advancement to Stage 13 After-Sales & DLP Management"]`,
    roles: [
      { role: 'Customer Relations Manager (CRM)', duty: 'Welcomes homebuyers and facilitates joint possession walk-throughs.' },
      { role: 'Handover Quality Lead', duty: 'Performs pre-delivery inspection and oversees deep cleaning.' },
      { role: 'Facility Caretaker', duty: 'Records final electricity and water meter readings and delivers key sets.' }
    ],
    kpis: [
      { name: 'Total Registers', desc: 'Total property handover registers under management', filter: 'all' },
      { name: 'Possession Delivered', desc: 'Units officially handed over with keys and documentation', filter: 'possessionCompleted' },
      { name: 'Zero-Snag Verified', desc: 'Units certified defect-free by homeowner inspection', filter: 'zeroSnagVerified' },
      { name: 'Pending Snags Backlog', desc: 'Units undergoing minor cosmetic touch-up remediation', filter: 'hasPendingSnags' },
      { name: 'Final Inspections Cleared', desc: 'Units with structural and MEP safety clearances issued', filter: 'inspectionsCleared' }
    ],
    pitch: 'Stage 12 guarantees delight at move-in. We deep clean every unit, conduct a joint walk-through with the customer, eliminate 100% of snags, and document flawless possession transfer.'
  },
  {
    num: '13',
    fileName: '13_STAGE_AFTER_SALES_DLP_EXPLAINED.md',
    title: 'Stage 13: After-Sales Warranty & DLP Management',
    route: '/pms/after-sales',
    plainEnglish: 'Stage 13 manages the long-term post-handover lifecycle. It governs the 10-year structural defect liability (DLP), 1-year MEP warranty claims, quarterly preventive Annual Maintenance Contracts (AMC) for community infrastructure (elevators, STP, generators), resident support desk tickets, and customer Net Promoter Score (NPS) tracking.',
    problemSolved: 'Developers often abandon communities after handing over keys. When lifts malfunction, STPs fail, or water pumps break, residents turn hostile, leading to RERA consumer court lawsuits and severe brand damage. Stage 13 provides structured maintenance and uses contractor retention money to enforce repairs.',
    terms: [
      { term: 'Defect Liability Period (DLP)', def: 'The statutory post-handover period (typically 5 to 10 years for structural, 1 year for MEP) during which the developer must fix construction defects without cost to the buyer.' },
      { term: 'Annual Maintenance Contract (AMC)', def: 'Contractual preventive maintenance agreements with specialist vendors for shared community machinery (elevators, backup generators, water treatment).' },
      { term: 'Punch-List / Warranty Ticket', def: 'A service request raised by a resident for post-occupancy defects (e.g. plumbing leak, lock malfunction).' },
      { term: 'Retention Release Audit', def: 'The final accounting sign-off releasing the 5% contractor retention money only after the contractor fulfills all DLP repair obligations.' }
    ],
    stepByStep: [
      'Warranty Activation: Upon possession, the unit warranty policies (10-year structural, 1-year MEP) are activated in the resident portal.',
      'Preventive AMC Scheduling: The system generates automated quarterly service calendars for community infrastructure (STP, generators, lifts).',
      'Resident Helpdesk Tickets: Residents log complaints via the portal with photos; tickets are auto-assigned to on-site technicians with SLA timers.',
      'Defect Remediation: Facility technicians or original sub-contractors execute repairs, followed by digital resident sign-off.',
      'Customer Satisfaction & NPS: Annual satisfaction surveys evaluate resident sentiment (targeting scores >= 4.0 out of 5.0).',
      'Contractor Retention Money Release: At the end of the defect liability term, contractor retention money is released only if all warranty claims were resolved.'
    ],
    diagram: `flowchart TD
    A["Possession Handed Over Unit from Stage 12"] --> B["10-Year Structural DLP & 1-Year MEP Warranty Activation"]
    B --> C["Automated AMC Maintenance Engine (Elevators, STP, DG Sets)"]
    C --> D["Resident Support Desk Ticket Logged via Portal"]
    D --> E["Rapid Response SLA Dispatch of Facility Maintenance Crew"]
    E --> F["Defect Remediation & Resident Digital Sign-Off"]
    F --> G["Customer NPS & Satisfaction Survey (Target >= 4.0 Stars)"]
    G --> H{"Were All Defect Claims Satisfactorily Resolved?"}
    H -- Yes --> I["CFO Authorization for Contractor Retention Money Release"]
    H -- No --> J["Retain Money & Engage Alternate Repair Squad"]
    I --> K["Terminal Project Lifecycle Completion & Archival"]`,
    roles: [
      { role: 'Facility Maintenance Lead', duty: 'Dispatches technicians and ensures SLA ticket resolution.' },
      { role: 'AMC Operations Coordinator', duty: 'Schedules servicing for elevators, transformers, and STPs.' },
      { role: 'Customer Experience Officer', duty: 'Tracks homeowner satisfaction scores and NPS feedback.' }
    ],
    kpis: [
      { name: 'Total Portfolios', desc: 'Projects under active warranty and lifetime facility support', filter: 'all' },
      { name: 'Active Warranty Claims', desc: 'Open resident punch-list and defect remediation tickets', filter: 'hasActiveClaims' },
      { name: 'AMC Visits Executed', desc: 'Completed preventive maintenance cycles for shared infrastructure', filter: 'amcCompleted' },
      { name: 'Support Queries Resolved', desc: 'Resident helpdesk tickets successfully resolved and closed', filter: 'supportResolved' },
      { name: 'Customer Satisfaction', desc: 'Top rated customer satisfaction score (>= 4.0 / 5.0)', filter: 'topRated' }
    ],
    pitch: 'Stage 13 builds our brand for life. We honor 10-year structural defect warranties, run preventive AMC maintenance on common infrastructure, and resolve resident tickets swiftly while holding contractor retention money as security.'
  }
];

stageDetails.forEach(s => {
  const content = `# ${s.title}

## 1. What is this Stage in Plain English?
${s.plainEnglish}

- **Primary System Route**: \`${s.route}\`
- **Module Classification**: Stage ${s.num} of 13 in the TaskFlow PMS Governance Rail

---

## 2. Why Real Estate Developers Need This Stage (The Problem It Solves)
${s.problemSolved}

---

## 3. Core Terminology Explained Simply
To help you explain this stage comfortably to your manager or non-technical team members, here are the essential industry terms used in this stage:

${s.terms.map(t => `- **${t.term}**: ${t.def}`).join('\n\n')}

---

## 4. Step-by-Step Business Process Walkthrough
This stage runs according to the following chronological business sequence:

${s.stepByStep.map((st, i) => `### Step ${i + 1}: ${st.split(':')[0]}
${st.split(':')[1] || st}`).join('\n\n')}

---

## 5. Visual Process Workflow Diagram

\`\`\`mermaid
${s.diagram}
\`\`\`

---

## 6. Key People & Roles Involved

| Role | Operational Responsibility |
|:---|:---|
${s.roles.map(r => `| **${r.role}** | ${r.duty} |`).join('\n')}

---

## 7. Dashboard KPI Summary Cards Explained
The top header of the module features 5 high-impact metrics cards. Clicking any card automatically filters the records table below:

| Card # | Metric Title | What It Measures | Filter Key Trigger |
|:---|:---|:---|:---|
${s.kpis.map((k, i) => `| **${i + 1}** | **${k.name}** | ${k.desc} | \`${k.filter}\` |`).join('\n')}

---

## 8. Stage Gate & Checklist Automation Criteria
To ensure complete governance, this stage cannot be marked complete until the following rules are satisfied:
1. **100% Mandatory Fields Completed**: All section forms must be populated and verified.
2. **Document Attachments Uploaded**: Key verification documents and photos must be uploaded.
3. **Authorized Officer Sign-off**: Digital verification stamps are saved in the immutable \`statusHistory\` log.
4. **Automatic Project Rail Advancement**: Once approved, the master project state automatically advances to the next stage on the project header rail.

---

## 9. 60-Second Presentation Pitch for Your Manager
> *"**${s.pitch}**"*
`;

  writeFile(`pms/01_business_flow_and_understanding/stages_explained/${s.fileName}`, content);
});

// -------------------------------------------------------------
// 4. DEVELOPER & TECHNICAL IMPLEMENTATION SPECS
// -------------------------------------------------------------
writeFile('pms/02_technical_implementation_specs/README.md', `# PMS Technical Implementation & Architecture Specifications

This folder contains technical developer documentation, API endpoint catalogs, database model definitions, and phase-by-phase implementation histories.

---

## Technical Documents Index
1. **[ARCHITECTURE_AND_API_SPEC.md](ARCHITECTURE_AND_API_SPEC.md)**: End-to-end RESTful API endpoints, request/response formats, query filters, and controller structures.
2. **[DATABASE_SCHEMAS_AND_MODELS.md](DATABASE_SCHEMAS_AND_MODELS.md)**: Complete Mongoose schema models, data types, indexes, and relationship references across all 13 stages.
3. **[phase_development_history/](phase_development_history/)**: Granular technical implementation notes from each phase of system development.
`);

writeFile('pms/02_technical_implementation_specs/ARCHITECTURE_AND_API_SPEC.md', `# PMS Technical Architecture & REST API Specification

## 1. Technical Architecture Overview
The TaskFlow PMS engine is built on a modern modular architecture:
- **Backend**: Node.js, Express.js, Mongoose ODM, MongoDB Atlas (\`tangdi-uat\`).
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Security**: JWT role-based access control, dotenv environment variable isolation, soft-deletion (\`deletedAt: null\`).

---

## 2. Universal API Standards
- **Base Route**: \`/api/pms/*\`
- **Standard Response Envelope**:
\`\`\`json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
\`\`\`
- **Axios Client Unwrapping**: Handled uniformly in \`frontend/src/api/axiosClient.js\`.

---

## 3. Endpoints Matrix by Submodule

| Submodule | Base Endpoint | Controller File | Primary Service File |
|:---|:---|:---|:---|
| Stage 01 Plots | \`/api/pms/plots\` | \`plot.controller.js\` | \`plot.service.js\` |
| Stage 02 Legal | \`/api/pms/legal-cases\` | \`pmsLegalCase.controller.js\` | \`pmsLegalCase.service.js\` |
| Stage 03 Land Purchase | \`/api/pms/land-purchases\` | \`landPurchase.controller.js\` | \`landPurchase.service.js\` |
| Stage 04 Planning | \`/api/pms/planning\` | \`projectPlanning.controller.js\` | \`projectPlanning.service.js\` |
| Stage 05 Pre-Site | \`/api/pms/pre-site\` | \`preSiteStart.controller.js\` | \`preSiteStart.service.js\` |
| Stage 06 Baseline | \`/api/pms/baseline\` | \`baselinePlanning.controller.js\` | \`baselinePlanning.service.js\` |
| Stage 07 Procurement | \`/api/pms/procurement\` | \`procurementInventory.controller.js\` | \`procurementInventory.service.js\` |
| Stage 08 Construction | \`/api/pms/construction\` | \`constructionExecution.controller.js\` | \`constructionExecution.service.js\` |
| Stage 09 Quality | \`/api/pms/quality\` | \`qualityControl.controller.js\` | \`qualityControl.service.js\` |
| Stage 10 Project Control | \`/api/pms/project-control\` | \`projectControl.controller.js\` | \`projectControl.service.js\` |
| Stage 11 Finance | \`/api/pms/finance\` | \`pmsFinance.controller.js\` | \`pmsFinance.service.js\` |
| Stage 12 Handover | \`/api/pms/handover\` | \`pmsHandover.controller.js\` | \`pmsHandover.service.js\` |
| Stage 13 After-Sales | \`/api/pms/after-sales\` | \`pmsAfterSales.controller.js\` | \`pmsAfterSales.service.js\` |
`);

writeFile('pms/02_technical_implementation_specs/DATABASE_SCHEMAS_AND_MODELS.md', `# PMS Database Schemas & Data Model Reference

## 1. Database Overview
- **Database Engine**: MongoDB Atlas (\`tangdi-uat\`)
- **Object Data Modeling (ODM)**: Mongoose v8.x
- **Cross-Collection Reference**: All documents reference the parent \`pmsprojects\` collection via ObjectId \`project\`.

---

## 2. MongoDB Collections & Models

| Stage # | Mongoose Model | MongoDB Collection | Key Schema Attributes |
|:---|:---|:---|:---|
| 01 | \`Plot\` | \`plots\` | \`surveyNumber\`, \`area\`, \`boundaries\`, \`feasibility\` |
| 02 | \`PmsLegalCase\` | \`pmslegalcases\` | \`search30Years\`, \`encumbranceCheck\`, \`publicNotice\` |
| 03 | \`LandPurchase\` | \`landpurchases\` | \`totalCost\`, \`registrationDate\`, \`mutationStatus\` |
| 04 | \`ProjectPlanning\` | \`projectplannings\` | \`masterLayout\`, \`roadPlanning\`, \`budget\` |
| 05 | \`PreSiteStart\` | \`presitestarts\` | \`contractorSelection\`, \`workOrder\`, \`siteSetup\` |
| 06 | \`BaselinePlanning\` | \`baselineplannings\` | \`plannedMaterial\`, \`plannedLabour\`, \`baselineLock\` |
| 07 | \`ProcurementInventory\` | \`procurementinventories\`| \`purchaseOrders\`, \`grnList\`, \`stockBatches\` |
| 08 | \`ConstructionExecution\`| \`constructionexecutions\`| \`dprRecords\`, \`labourMuster\`, \`machineryUsage\` |
| 09 | \`QualityControl\` | \`qualitycontrols\` | \`cubeTests\`, \`mepInspections\`, \`snagList\` |
| 10 | \`ProjectControl\` | \`projectcontrols\` | \`earnedValue\`, \`indices (CPI/SPI)\`, \`forecasts\` |
| 11 | \`PmsFinance\` | \`pmsfinances\` | \`measurementBook\`, \`contractorBills\`, \`retention\` |
| 12 | \`PmsHandover\` | \`pmshandovers\` | \`occupancyCertificate\`, \`pdiInspection\`, \`keys\` |
| 13 | \`PmsAfterSales\` | \`pmsaftersales\` | \`warrantyClaims\`, \`amcSchedule\`, \`customerSatisfaction\` |
`);

// -------------------------------------------------------------
// 5. CRM MODULE SCAFFOLDING
// -------------------------------------------------------------
writeFile('crm/01_business_flow_and_understanding/README.md', `# Customer Relationship Management (CRM) — Business Flow & Concepts

*(Scaffolding prepared for the upcoming CRM module requirements)*

## Scope & Upcoming Features
1. **Lead Sourcing & Funnel Management**: Digital ads, channel partner (broker) referrals, walk-in visitors.
2. **Site Visit Scheduling & Follow-Ups**: Telecaller logs, site driver assignments, customer interest rating.
3. **Booking & Cost Sheets**: Unit reservation, installment schedules, tax calculations, payment gateways.
4. **Channel Partner (Broker) Payouts**: Commission slabs, invoicing, lead protection windows.
5. **Customer Portal**: Online payment receipts, live construction photo updates, loan sanction tracking.
`);

writeFile('crm/02_technical_implementation_specs/README.md', `# CRM Technical Implementation Specifications

*(Scaffolding prepared for the upcoming CRM module implementation)*

## Upcoming Technical Specifications
- **API Endpoints**: \`/api/crm/leads\`, \`/api/crm/bookings\`, \`/api/crm/brokers\`, \`/api/crm/payments\`
- **Database Models**: \`CrmLead\`, \`CrmBooking\`, \`CrmBroker\`, \`CrmCostSheet\`
- **Integrations**: WhatsApp Business API, SMS Gateways, Razorpay/Stripe, MagicBricks/99acres webhooks.
`);

// -------------------------------------------------------------
// 6. MOVE LEGACY PHASE DOCS INTO TECHNICAL HISTORY
// -------------------------------------------------------------
const legacyFiles = [
  '01_EXECUTIVE_DASHBOARD_STAGE_RAIL.md',
  '02_LAND_ACQUISITION_FEASIBILITY.md',
  '03_LEGAL_VERIFICATION.md',
  '04_LAND_PURCHASE_REGISTRY.md',
  '05_GOVT_APPROVALS_PLANNING.md',
  '06_PRE_SITE_CONTRACTORS.md',
  '07_BASELINE_PLANNING.md',
  '08_CONSTRUCTION_DPR.md',
  '09_QUALITY_CONTROL_SNAGS.md',
  '10_CONTRACTOR_BILLING_MB.md',
  '11_HANDOVER_MANAGEMENT.md',
  'PMS_FLOW_EXPLAINER.md',
  'PMS_MASTER_PLAN.md'
];

legacyFiles.forEach(f => {
  const oldPath = path.join(root, 'pms', f);
  const newPath = path.join(root, 'pms/02_technical_implementation_specs/phase_development_history', f);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log('Moved legacy file:', f);
  }
});

// Remove any loose files created in the previous run that were directly under pms/
const prevStageFiles = [
  'PMS_MASTER_FLOW_AND_ARCHITECTURE.md',
  'STAGE_01_LAND_ACQUISITION.md',
  'STAGE_02_LEGAL_VERIFICATION.md',
  'STAGE_03_LAND_PURCHASE_REGISTRY.md',
  'STAGE_04_PROJECT_PLANNING_APPROVALS.md',
  'STAGE_05_PRE_SITE_START.md',
  'STAGE_06_BASELINE_PLANNING.md',
  'STAGE_07_PROCUREMENT_INVENTORY.md',
  'STAGE_08_CONSTRUCTION_EXECUTION.md',
  'STAGE_09_QUALITY_CONTROL_SNAGS.md',
  'STAGE_10_PROJECT_CONTROL_VARIANCE.md',
  'STAGE_11_FINANCE_RA_BILLING.md',
  'STAGE_12_HANDOVER_POSSESSION.md',
  'STAGE_13_AFTER_SALES_WARRANTY.md'
];

prevStageFiles.forEach(f => {
  const p = path.join(root, 'pms', f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Cleaned up direct root file:', f);
  }
});

console.log('Comprehensive documentation restructuring complete!');
