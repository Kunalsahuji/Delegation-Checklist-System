# Section 13: CRM Reports & Exports

## 1. Overview
The Reports module equips executive leadership and sales managers with detailed analytical registers. It tracks pipeline velocity, salesperson productivity, lead source ROI, and lost deal forensics, with full CSV/Excel export support.

---

## 2. Core Functional Requirements
- **Key Standard Reports**:
  1. **Conversion Funnel Report**: Stage-by-stage drop-off and conversion speed.
  2. **Salesperson Productivity Report**: Calls made, visits conducted, deals won, total revenue per executive.
  3. **Lead Source ROI Report**: Cost-per-lead vs. revenue-per-lead across Meta Ads, Walk-ins, and Brokers.
  4. **Lost & Dropped Analysis**: Categorized breakdown of why prospects walked away.
  5. **Site Visit Summary**: Scheduled vs. conducted vs. missed visits per project.
- **Export Capabilities**:
  - One-click CSV export with filtered datasets.
  - Formatted print/PDF report summary for executive meetings.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/reports/conversion-funnel` — Detailed funnel ratios.
- `GET /api/v1/crm/reports/salesperson-performance` — Performance metrics table.
- `GET /api/v1/crm/reports/source-analysis` — Source breakdown data.
- `GET /api/v1/crm/reports/export-csv?type=...` — Streams downloadable CSV file.

---

## 4. UI/UX Elements
- Clean tabulated reports with sortable columns.
- Dedicated date range and department/assignee filters.
- Top action bar with "Export CSV" and "Reset Filters".
