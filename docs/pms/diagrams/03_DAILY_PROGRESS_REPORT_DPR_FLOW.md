# Diagram 03: Daily Progress Report (DPR) 90-Second Fast Submission Flow

This diagram illustrates the mobile-first operational workflow executed daily by Site Engineers to submit Daily Progress Reports in under 90 seconds.

```mermaid
sequenceDiagram
    autonumber
    actor SiteEng as Site Engineer (Mobile App)
    participant UI as PMS DPR Mobile Interface
    participant Local as LocalStorage Cache
    participant Server as PMS Backend Service
    participant Exec as Executive Dashboard

    Note over SiteEng,UI: 4:30 PM: Daily Reporting Window Opens

    SiteEng->>UI: Opens /pms/dpr/new on mobile
    UI->>Local: Restore saved offline draft (if any)
    UI-->>SiteEng: Displays Quick 4-Step Form

    rect rgb(240, 249, 255)
    Note over SiteEng,UI: Step 1: Manpower Headcount (~20 seconds)
    SiteEng->>UI: Increment Masons (24), Helpers (48), Operators (4)
    UI->>UI: Auto-sums Total Workforce: 76 workers
    end

    rect rgb(245, 243, 255)
    Note over SiteEng,UI: Step 2: Material Consumed (~25 seconds)
    SiteEng->>UI: Select Cement (180 bags), Steel (1.4 MT)
    UI->>UI: Validates against daily consumption variance rules
    end

    rect rgb(236, 253, 245)
    Note over SiteEng,UI: Step 3: Work Activities (~20 seconds)
    SiteEng->>UI: Ticks 'Boundary wall brickwork' & 'Road gravel compaction'
    end

    rect rgb(254, 242, 242)
    Note over SiteEng,UI: Step 4: Geo-Camera Photos (~20 seconds)
    SiteEng->>UI: Captures 2 Site Photos via Device Camera
    UI->>UI: Client-side GPS & Timestamp Stamping + Image Compression (&lt;300KB)
    end

    SiteEng->>UI: Taps [Submit Today's DPR]
    UI->>Server: POST /api/v1/pms/dpr
    Server-->>UI: 201 Created (DPR-2026-11-18-004)
    UI->>Local: Clear draft cache
    UI-->>SiteEng: Haptic Vibration + Green Success Toast

    Server->>Exec: Live Webhook / Socket update
    Note over Exec: Executive Dashboard DPR Compliance KPI updates to 100%
```
