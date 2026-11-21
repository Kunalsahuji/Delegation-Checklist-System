# TaskFlow ERP — CRM Implementation Master Plan

## 1. Project Philosophy & Guiding Principles
1. **Lightweight & High Performance**: Implement cleanly without unnecessary bloat. Keep schemas focused and UI responsive.
2. **100% Fully Functional**: Every button, modal, status transition, filter, and action must actually execute and persist to the database. No dummy stubs.
3. **Role-Aware Security**: Team view for Admins/Directors vs. personal "My Data" view for individual sales representatives.
4. **Consistency**: Use the established TaskFlow ERP design system (Tailwind CSS, Lucide icons, responsive drawer modals, uniform KPI strips, toast alerts).

---

## 2. System Architecture & Entity Relationships

```
                     ┌──────────────────┐
                     │    User / Role   │
                     └─────────┬────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
   │    Project     │ │ Broker / Agent │ │ Meta Ad Source │
   └────────┬───────┘ └────────┬───────┘ └────────┬───────┘
            │                  │                  │
            └─────────┬────────┴──────────────────┘
                      ▼
             ┌─────────────────┐
             │     Enquiry     │◄────── (Raw inquiries from Web/Ads/Phone)
             └────────┬────────┘
                      │
                      │ (Qualified & Promoted)
                      ▼
             ┌─────────────────┐
             │      Lead       │
             └────────┬────────┘
                      │
     ┌────────────────┼────────────────┬────────────────┐
     ▼                ▼                ▼                ▼
┌───────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│LeadStage  │  │ Site Visit  │  │ Follow-up / │  │  Activity /  │
│History    │  │   Report    │  │  Reminder   │  │   Comments   │
└───────────┘  └─────────────┘  └─────────────┘  └──────────────┘
```

---

## 3. Phased Implementation Roadmap

| Phase | Section / Module | Scope & Deliverables | Est. Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation & Projects** | Project catalog, unit/villa inventory, geo-coordinates, base CRM routes & navigation | Planned |
| **Phase 2** | **Enquiries & Intake** | Inbound enquiries, filters, duplicate check, qualification workflow (Qualify / Reject / Hold) | Planned |
| **Phase 3** | **Lead Pipeline & Stages** | Lead conversion, stage progression engine, move/undo stage, comments & deal closure (Won/Lost/Dropped) | Planned |
| **Phase 4** | **Lead Assignment & Operations** | Bulk & single lead distribution, tele-sales/sales assignment, assignment history | Planned |
| **Phase 5** | **Field Visits & Reports** | Site visit scheduling, GPS geo-fence validation, client visit feedback report | Planned |
| **Phase 6** | **Follow-ups & Reminders** | Daily follow-up worklist, overdue alerts, quick reschedule & remark logging | Planned |
| **Phase 7** | **Special Follow-ups** | VIP/High-value client follow-up queue, escalated attention list | Planned |
| **Phase 8** | **Unified CRM Calendar** | Operational agenda view aggregating visits, calls, and follow-up deadlines | Planned |
| **Phase 9** | **Brokers & Channel Partners** | Broker registry, tier levels (Silver/Gold/Platinum), referral tracking & yard commission tally | Planned |
| **Phase 10**| **Meta Leads Integration** | Webhook intake & automated parsing for Facebook / Instagram Lead Ads | Planned |
| **Phase 11**| **Bulk Messaging** | Template-based WhatsApp/SMS campaign sender with recipient selection & dispatch logs | Planned |
| **Phase 12**| **CRM Dashboard & Analytics**| Pipeline conversion funnel, source breakdown, team performance KPIs, "My Data" toggle | Planned |

---

## 4. Section Specification Index

1. [01_DASHBOARD.md](./01_DASHBOARD.md) — Funnel analytics, team KPIs, source distribution.
2. [02_ENQUIRIES.md](./02_ENQUIRIES.md) — Intake, duplicate phone shield, screening & qualification.
3. [03_LEAD_ASSIGNMENT.md](./03_LEAD_ASSIGNMENT.md) — Smart distribution, reassignment, audit logs.
4. [04_LEADS.md](./04_LEADS.md) — Pipeline stages, stage transitions, undo, won/lost/dropped.
5. [05_VISIT.md](./05_VISIT.md) — Field visit scheduling, GPS geo-verification, visit reports.
6. [06_FOLLOWUPS.md](./06_FOLLOWUPS.md) — Due-today follow-ups, snooze/reschedule, activity history.
7. [07_SPECIAL_FOLLOWUPS.md](./07_SPECIAL_FOLLOWUPS.md) — High-touch / VIP lead management.
8. [08_CALENDAR.md](./08_CALENDAR.md) — Unified interactive calendar for calls and visits.
9. [09_BULK_MESSAGE.md](./09_BULK_MESSAGE.md) — WhatsApp & SMS message broadcasts.
10. [10_META_LEADS.md](./10_META_LEADS.md) — Meta Ads intake and mapping.
11. [11_PROJECTS.md](./11_PROJECTS.md) — Projects, villas/plots, pricing & GPS boundaries.
12. [12_BROKERS_NETWORK.md](./12_BROKERS_NETWORK.md) — Channel partners, tiers, commissions.
13. [13_REPORTS.md](./13_REPORTS.md) — Conversion reports, executive scorecard, CSV exports.
