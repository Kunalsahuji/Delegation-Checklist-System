# PMS Architecture & Operational Flow Diagrams

This directory contains visual architecture, state machine, and data-flow diagrams for the **Project Management System (PMS)** in TaskFlow ERP.

---

## Diagram Index

| File | Diagram Type | Core Workflow Visualized |
| :--- | :--- | :--- |
| **[01_END_TO_END_LIFECYCLE_FLOW.md](./01_END_TO_END_LIFECYCLE_FLOW.md)** | Flowchart & Enterprise Map | The complete 20-step journey from raw land scouting $\rightarrow$ legal due diligence $\rightarrow$ baseline freezing $\rightarrow$ civil construction execution $\rightarrow$ customer handover $\rightarrow$ CRM link. |
| **[02_LAND_ACQUISITION_LEGAL_GATEWAY.md](./02_LAND_ACQUISITION_LEGAL_GATEWAY.md)** | Decision Flowchart | Plot intake $\rightarrow$ financial feasibility calculation ($\ge 25\%$ ROI) $\rightarrow$ "Approved Plot Package" $\rightarrow$ 4-stage legal check (Title, EC, Revenue, Opinion). |
| **[03_DAILY_PROGRESS_REPORT_DPR_FLOW.md](./03_DAILY_PROGRESS_REPORT_DPR_FLOW.md)** | Sequence Diagram | Mobile-first 90-second submission flow by Site Engineers logging labor headcount, materials consumed, activities done, and GPS camera photos. |
| **[04_CONTRACTOR_MEASUREMENT_BILLING_FLOW.md](./04_CONTRACTOR_MEASUREMENT_BILLING_FLOW.md)** | Process Flowchart | Field Measurement Book (MB) tape measurement $\rightarrow$ BOQ limit validation $\rightarrow$ automated deductions (Retention 5%, Advance 10%, TDS 2%, GST 18%) $\rightarrow$ dual engineer/PM approval $\rightarrow$ payout. |
| **[05_QUALITY_SNAG_RESOLUTION_FLOW.md](./05_QUALITY_SNAG_RESOLUTION_FLOW.md)** | State Diagram & Actor Matrix | 5-stage defect lifecycle: `OPEN` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_RECTIFICATION` $\rightarrow$ `RECTIFIED` $\rightarrow$ `VERIFIED` $\rightarrow$ `CLOSED` with mandatory photo proof. |
