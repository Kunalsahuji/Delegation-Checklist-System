# Section 11: Real Estate Projects & Inventory

## 1. Overview
Projects form the foundational product catalog of the real estate CRM. Every enquiry, lead, and site visit is anchored to a specific development project. This module manages projects, inventory items (villas, plots, apartments), base pricing, and GPS geo-fencing coordinates.

---

## 2. Core Functional Requirements
- **Project Master Profile**:
  - Project Name, Code, Location/Address, City.
  - Development Status (*Under Construction, Ready to Move, Upcoming*).
  - Master Geo-Coordinates: Latitude, Longitude, and Geo-fence radius (in meters) for site visit verification.
- **Unit & Inventory Management**:
  - Unit/Villa Number, Type (*3 BHK Villa, 4 BHK Villa, Commercial Plot*).
  - Super Built-up Area, Carpet Area, Plot Size (in Sq. Yards / Gaj).
  - Base Price, Premium Location Charges (PLC), Current Status (*Available, Blocked, Sold*).
- **Brochure & Collateral Storage**:
  - Links and attachments for master plans, floor plans, and price sheets for rapid salesperson sharing.

---

## 3. Data & API Contracts
- `GET /api/v1/crm/projects` — List active projects with unit availability summary.
- `POST /api/v1/crm/projects` — Create project with geo-coordinates and details.
- `GET /api/v1/crm/projects/:id/units` — List units with status and pricing.
- `PATCH /api/v1/crm/projects/:id/units/:unitId` — Update unit availability status.

---

## 4. UI/UX Elements
- Visual project cards with unit inventory availability chips (*e.g., "14 Available · 6 Sold"*).
- Interactive Google Maps / OpenStreetMap pin picker for setting project GPS coordinates.
