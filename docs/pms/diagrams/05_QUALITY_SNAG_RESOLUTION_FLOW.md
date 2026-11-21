# Diagram 05: Quality Inspection & Closed-Loop Snag Lifecycle

This diagram demonstrates how construction defects are captured on site, assigned to trade contractors, rectified with mandatory photo evidence, re-inspected, and closed.

```mermaid
stateDiagram-v2
    [*] --> OPEN: Defect Detected on Site<br/>(Photo + Location + Severity)
    
    OPEN --> ASSIGNED: Assign to Trade Contractor<br/>(Sets Rectification Due Date)
    
    ASSIGNED --> IN_RECTIFICATION: Contractor Begins Work<br/>(Material & Labor Allocated)
    
    IN_RECTIFICATION --> RECTIFIED: Contractor Submits Proof<br/>(Compulsory Rectified Photo)
    
    RECTIFIED --> VERIFICATION: Quality Inspector On-Site Inspection
    
    VERIFICATION --> ASSIGNED: REJECTED (Defect Still Present / Tolerance Exceeded)
    
    VERIFICATION --> CLOSED: APPROVED (Meets Engineering Quality Standard)
    
    CLOSED --> [*]: Archiving & Unblocking Contractor Billing
```

---

## Detailed Step-by-Step Actor Matrix

```
┌─────────────────┬───────────────────┬─────────────────────┬──────────────────┐
│ STAGE           │ ACTOR             │ REQUIRED INPUT      │ SUCCESS OUTCOME  │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────┤
│ 1. Raise Snag   │ Quality Engineer  │ • GPS location      │ Snag Ticket SNG- │
│                 │                   │ • Severity category │ 089 generated    │
│                 │                   │ • Defect photograph │                  │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────┤
│ 2. Assign Trade │ Project Manager   │ • Select Contractor │ Auto-alert sent  │
│                 │                   │ • Due Date deadline │ to contractor    │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────┤
│ 3. Rectify Work │ Contractor Mason  │ • Repairs defect    │ Ready for check  │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────┤
│ 4. Submit Proof │ Contractor / Lead │ • Rectified photo   │ Status: RECTIFIED│
├─────────────────┼───────────────────┼─────────────────────┼──────────────────┤
│ 5. Physical Sign│ Quality Engineer  │ • Re-measure check  │ Status: CLOSED   │
│    Off          │                   │ • Sign-off remark   │ Milestone unlocked│
└─────────────────┴───────────────────┴─────────────────────┴──────────────────┘
```
