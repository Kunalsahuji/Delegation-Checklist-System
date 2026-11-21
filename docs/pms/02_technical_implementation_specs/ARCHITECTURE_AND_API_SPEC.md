# PMS Technical Architecture & REST API Specification

## 1. Technical Architecture Overview
The TaskFlow PMS engine is built on a modern modular architecture:
- **Backend**: Node.js, Express.js, Mongoose ODM, MongoDB Atlas (`tangdi-uat`).
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Security**: JWT role-based access control, dotenv environment variable isolation, soft-deletion (`deletedAt: null`).

---

## 2. Universal API Standards
- **Base Route**: `/api/pms/*`
- **Standard Response Envelope**:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```
- **Axios Client Unwrapping**: Handled uniformly in `frontend/src/api/axiosClient.js`.

---

## 3. Endpoints Matrix by Submodule

| Submodule | Base Endpoint | Controller File | Primary Service File |
|:---|:---|:---|:---|
| Stage 01 Plots | `/api/pms/plots` | `plot.controller.js` | `plot.service.js` |
| Stage 02 Legal | `/api/pms/legal-cases` | `pmsLegalCase.controller.js` | `pmsLegalCase.service.js` |
| Stage 03 Land Purchase | `/api/pms/land-purchases` | `landPurchase.controller.js` | `landPurchase.service.js` |
| Stage 04 Planning | `/api/pms/planning` | `projectPlanning.controller.js` | `projectPlanning.service.js` |
| Stage 05 Pre-Site | `/api/pms/pre-site` | `preSiteStart.controller.js` | `preSiteStart.service.js` |
| Stage 06 Baseline | `/api/pms/baseline` | `baselinePlanning.controller.js` | `baselinePlanning.service.js` |
| Stage 07 Procurement | `/api/pms/procurement` | `procurementInventory.controller.js` | `procurementInventory.service.js` |
| Stage 08 Construction | `/api/pms/construction` | `constructionExecution.controller.js` | `constructionExecution.service.js` |
| Stage 09 Quality | `/api/pms/quality` | `qualityControl.controller.js` | `qualityControl.service.js` |
| Stage 10 Project Control | `/api/pms/project-control` | `projectControl.controller.js` | `projectControl.service.js` |
| Stage 11 Finance | `/api/pms/finance` | `pmsFinance.controller.js` | `pmsFinance.service.js` |
| Stage 12 Handover | `/api/pms/handover` | `pmsHandover.controller.js` | `pmsHandover.service.js` |
| Stage 13 After-Sales | `/api/pms/after-sales` | `pmsAfterSales.controller.js` | `pmsAfterSales.service.js` |
