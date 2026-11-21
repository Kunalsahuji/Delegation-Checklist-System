# Diagram 04: Contractor Measurement Book (MB) & RA Billing Lifecycle

This diagram demonstrates how physical site measurements translate into verified Running Account (RA) bills, pass through statutory and retention deduction calculations, and get disbursed.

```mermaid
flowchart TD
    %% Classes
    classDef mb fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E40AF;
    classDef calc fill:#FFFBEB,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef sign fill:#F0FDF4,stroke:#16A34A,stroke-width:2px,color:#166534;
    classDef pay fill:#FDF2F8,stroke:#DB2777,stroke-width:2px,color:#9D174D;

    subgraph FIELD ["1. Field Measurement Book (MB) Entry"]
        M1["Joint Physical Tape Measurement<br/>(Length &times; Breadth &times; Depth)"]:::mb
        M2["MB Digital Record Created<br/>(Linked to Work Order Item Unit Rates)"]:::mb
        M1 --> M2
    end

    subgraph BOQ_CHECK ["2. BOQ Ceiling Validation"]
        B1{"Cumulative Qty &le; BOQ Limit?"}:::calc
        M2 --> B1
        B1 -- "NO (Over-Quantity)" --> V1["Flagged as Quantity Variance<br/>Requires Change Request (CR)"]:::calc
        B1 -- "YES (Within Limit)" --> R1["Generate Running Account (RA) Bill"]:::calc
    end

    subgraph DEDUCTIONS ["3. Automated Deductions Engine"]
        D1["Calculate Gross Work Done (GVWD)"]:::calc
        D2["Deduct: Retention Money (5%)<br/>(Held in escrow for 12 months DLP)"]:::calc
        D3["Deduct: Advance Recovery (10%)"]:::calc
        D4["Deduct: TDS (2% under Sec 194C)"]:::calc
        D5["Add: GST (18%)"]:::calc
        R1 --> D1 --> D2 --> D3 --> D4 --> D5
    end

    subgraph DUAL_APPROVAL ["4. Dual-Sign-Off Governance"]
        S1["Site Engineer Digital Certification<br/>(Verifies work executed per specifications)"]:::sign
        S2["Project Manager Technical Review<br/>(Checks snag list status & milestone dates)"]:::sign
        D5 --> S1 --> S2
    end

    subgraph PAYOUT ["5. Accounts Disbursement"]
        P1["Accounts Verification & Payment Advice"]:::pay
        P2["RTGS / NEFT Disbursement<br/>(Payment Reference Logged in Ledger)"]:::pay
        S2 --> P1 --> P2
    end
```
