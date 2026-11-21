# Langdi CRM — Business Flow & Lifecycle Explainer

> **Purpose of this document:**  
> Use this document whenever your Project Manager, Tech Lead, or client asks: *"How does our CRM work, what is the customer journey, and why do we have these specific stages?"*  
> It is written in simple, non-technical, professional language.

---

## 1. Quick Executive Summary (In 30 Seconds)

Our CRM manages the entire real estate sales cycle from the moment a potential buyer expresses interest to the day they book a property.

It operates on a **4-Step Funnel**:
1. **Intake (Enquiry)**: Capturing leads from ads, walk-ins, phone calls, brokers, or Excel sheets.
2. **Screening (Qualification)**: Tele-sales team calls the client, verifies their budget & requirement, and determines if they are a real buyer.
3. **Pipeline (Active Lead)**: A qualified buyer moves through defined sales milestones (Calls → Site Visit → Negotiation).
4. **Outcome (Won / Lost / Dropped)**: Deal closes as a property booking (Won), drops out with a reason (Lost/Dropped), or converts into a Channel Partner (Broker).

---

## 2. Visual Customer Journey Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: INBOUND INTAKE                          │
│   Meta Ads / Phone Call / Walk-in / Broker Reference / Bulk Upload     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 2: ENQUIRY RECORD                          │
│   - Contact details (Phone duplicate check prevents double-entries)    │
│   - Budget range (Min - Max) & Preferred Project                       │
│   - Temperature: Hot / Warm / Cold                                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    STEP 3: QUALIFICATION SCREENING                     │
│               (Tele-Sales / Screening Executive calls client)           │
├───────────────────────┬────────────────────────┬───────────────────────┤
│    NOT QUALIFIED      │        ON HOLD         │       QUALIFIED       │
│  Budget too low or    │ Needs follow-up later; │ Meets requirements;   │
│  wrong requirement    │ reminder scheduled     │ ready for site sales  │
└───────────────────────┴────────────────────────┴───────────┬───────────┘
                                                             │
                                                             ▼ (Converted to Lead)
┌────────────────────────────────────────────────────────────────────────┐
│                     STEP 4: ACTIVE SALES PIPELINE                      │
│                                                                        │
│   Stage 1: Discovery / Initial Pitch                                   │
│            ▼                                                           │
│   Stage 2: Call for Site Visit Confirmation                            │
│            ▼                                                           │
│   Stage 3: Visit Confirmed (Assigned to Site Visit Sales Executive)    │
│            ▼                                                           │
│   Stage 4: Site Visit Conducted (Verified via GPS Geo-fencing & Notes) │
│            ▼                                                           │
│   Stage 5: Feedback & Post-Visit Discussion                            │
│            ▼                                                           │
│   Stage 6: Price Negotiation & Token Advance                           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 5: DEAL RESOLUTION                         │
├───────────────────────┬────────────────────────┬───────────────────────┤
│       WON DEAL        │      LOST / DROPPED    │    CONVERT TO AGENT   │
│ Unit/Villa Booked;    │ Client bought else-    │ Client is interested  │
│ revenue & yards sold  │ where / budget issue;  │ in working as an      │
│ logged; broker credit │ reason mandatory       │ external broker       │
└───────────────────────┴────────────────────────┴───────────────────────┘
```

---

## 3. Detailed Stage-by-Stage Breakdown

### Phase 1: Intake & Duplicate Shield
- **Why it matters:** In real estate, the same client frequently clicks 2 different Facebook ads or calls twice.
- **How our system handles it:** 
  - Every phone number is checked in real-time.
  - If a number already belongs to an active lead or existing broker, the system alerts the user and links them to the existing history instead of creating spam duplicate records.

### Phase 2: Tele-Sales Qualification
- Not every lead is ready to visit a luxury project site.
- Tele-sales asks standard questions: *What is your budget? Are you looking for immediate possession or investment? When are you available for a site visit?*
- Outcomes:
  - **Qualified:** The client is genuinely interested and has the purchasing power. Promoted into the pipeline.
  - **On Hold / Follow-up:** Client asked to call back next week or next month. System schedules an alert on the Calendar.
  - **Rejected / Not Qualified:** Wrong number, student looking for rent, or budget below minimum threshold.

### Phase 3: The Structured Sales Pipeline (The "Stages")
- Why do we have strict stages? Because high-ticket property sales fail when salespeople forget follow-ups or skip steps.
- **Stage Progression Rules:**
  - **Role-Gated Actions:** A tele-caller cannot mark a site visit as "Done". Only the assigned Field Sales Executive can confirm physical visits.
  - **No Skipping:** Deals must advance stage by stage.
  - **Undo Button:** If someone clicks a button accidentally, an authorized user can click "Undo Stage" to revert back cleanly.
  - **Audit Trail:** Every stage move records *who* did it, *when*, what *notes/feedback* were submitted, and any attached files.

### Phase 4: Site Visit Verification (Geo-Fencing)
- Real estate management faces a major blind spot: *Did the salesperson actually show the client the villas on site, or are they just claiming they did?*
- **The Solution:**
  - When the sales person logs a Site Visit Report from their mobile/tablet, the system checks their GPS coordinates against the Project's Geo-Fence location to confirm on-site presence.
  - They log the specific villas viewed, client reaction, and likelihood to buy.

### Phase 5: Closing & Channel Partner (Broker) Credit
- When a client pays the booking token:
  - Deal is marked **WON**.
  - Final sold price and land area (in square yards / gaj) are stored.
  - If the client came through an external broker (channel partner), the broker is credited their commission and total yards tally.
- If the deal fails:
  - Marked **LOST / DROPPED** with mandatory categorized reasons (e.g. *Location not liked, Family postponed decision, Price too high*).
  - Can be reopened later if the client returns.

---

## 4. Why This Architecture Delivers High Value

1. **Zero Lead Leakage:** Every enquiry has an assigned owner and a scheduled next action date.
2. **Accountability:** Managers can see at a glance: *Who made calls today? Who conducted site visits? Where are deals getting stuck?*
3. **Clean Separation:** Tele-sales does what they do best (filtering & scheduling); Field sales does what they do best (closing deals on site).
4. **Data-Driven Insights:** The dashboard shows exact conversion rates: *Out of 100 Facebook leads, how many qualified? How many visited? How many bought?*
