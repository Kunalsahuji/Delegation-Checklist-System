# TaskFlow ERP — Enterprise Documentation Hub

Welcome to the TaskFlow ERP Documentation Repository. This documentation is organized into clear, dedicated functional tiers to separate **Business Flow & Manager Explanations** from **Technical Developer Specifications**.

---

## Modular Directory Layout

```
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
```

---

## Quick Navigation for Team & Manager Presentations
- **For Management Presentations**: Review [`docs/pms/01_business_flow_and_understanding/`](pms/01_business_flow_and_understanding/PMS_MASTER_EXECUTIVE_SUMMARY.md) for non-technical, high-impact business walk-throughs with visual diagrams and talking points.
- **For Engineering & API Integration**: Review [`docs/pms/02_technical_implementation_specs/`](pms/02_technical_implementation_specs/ARCHITECTURE_AND_API_SPEC.md) for endpoints, request bodies, Mongoose schemas, and automated validation gates.
