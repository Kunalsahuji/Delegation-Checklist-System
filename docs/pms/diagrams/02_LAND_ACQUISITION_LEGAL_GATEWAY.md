# Diagram 02: Land Acquisition to Legal Verification Gateway

This diagram illustrates how raw land scouting flows into the financial feasibility engine, packages into an **Approved Plot Package**, and gets vetted through the unbreakable **4-Stage Legal Verification Gate**.

```mermaid
flowchart TD
    %% Classes
    classDef intake fill:#F0FDF4,stroke:#16A34A,stroke-width:2px,color:#166534;
    classDef calc fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E40AF;
    classDef legal fill:#FFFBEB,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef reject fill:#FEF2F2,stroke:#DC2626,stroke-width:2px,color:#991B1B;

    subgraph INTAKE ["1. Candidate Plot Intake"]
        I1["Scout Candidate Plot<br/>- Khasra No, Village, Total Bighas<br/>- Landowner Asking Rate per Bigha"]:::intake
        I2["Field Survey & GPS Tagging<br/>- Topography, Approach Road Width<br/>- Boundary Coordinates Map"]:::intake
        I1 --> I2
    end

    subgraph FEASIBILITY ["2. Financial Feasibility Analysis"]
        F1["Input Financial Constants<br/>- Development Cost / sq.yd<br/>- Govt Conversion & CLU Estimate<br/>- Target Saleable Rate / sq.yd"]:::calc
        F2{"Feasibility Check<br/>1. Approach Road &ge; 40ft?<br/>2. Projected ROI &ge; 25%?"}:::calc
        I2 --> F1 --> F2
    end

    F2 -- "NO (Fails Criteria)" --> R1["REJECT PLOT<br/>Archived with Justification"]:::reject
    F2 -- "YES (Passed)" --> P1["Generate Approved Plot Package<br/>(GET /pms/plots/:id/package)"]:::intake

    subgraph LEGAL_GATE ["3. 4-Stage Legal Verification Engine"]
        L0["Handoff to Legal Engine<br/>(POST /pms/legal-cases/from-plot)"]:::legal
        P1 --> L0

        L1["Stage 1: 30-Year Title Search<br/>- Unbroken Chain of Title<br/>- HUF / Legal Heir Rights"]:::legal
        L2["Stage 2: Encumbrance Check<br/>- Sub-Registrar Form 15/16<br/>- Bank Liens & Mortgages"]:::legal
        L3["Stage 3: Revenue Records<br/>- Jamabandi / Fard Ledger<br/>- Mutation & Tenancy Check"]:::legal
        L4["Stage 4: Advocate Written Opinion<br/>- Panel Advocate Formal Sign-off"]:::legal

        L0 --> L1 --> L2 --> L3 --> L4
    end

    L4 --> D1{"Advocate Opinion Type"}:::legal

    D1 -- "Defective / Disputed Title" --> R2["HALT PURCHASE<br/>Deal Cancelled to Protect Capital"]:::reject
    D1 -- "Conditional" --> C1["Rectification Required<br/>(Indemnity Bond / Release Deed)"]:::legal
    C1 --> L4
    D1 -- "Clean & Marketable" --> G1["PM / Director Approval Gate<br/>(GREENLIGHT LAND PURCHASE)"]:::intake
```
