# PMS Database Schemas & Data Model Reference

## 1. Database Overview
- **Database Engine**: MongoDB Atlas (`tangdi-uat`)
- **Object Data Modeling (ODM)**: Mongoose v8.x
- **Cross-Collection Reference**: All documents reference the parent `pmsprojects` collection via ObjectId `project`.

---

## 2. MongoDB Collections & Models

| Stage # | Mongoose Model | MongoDB Collection | Key Schema Attributes |
|:---|:---|:---|:---|
| 01 | `Plot` | `plots` | `surveyNumber`, `area`, `boundaries`, `feasibility` |
| 02 | `PmsLegalCase` | `pmslegalcases` | `search30Years`, `encumbranceCheck`, `publicNotice` |
| 03 | `LandPurchase` | `landpurchases` | `totalCost`, `registrationDate`, `mutationStatus` |
| 04 | `ProjectPlanning` | `projectplannings` | `masterLayout`, `roadPlanning`, `budget` |
| 05 | `PreSiteStart` | `presitestarts` | `contractorSelection`, `workOrder`, `siteSetup` |
| 06 | `BaselinePlanning` | `baselineplannings` | `plannedMaterial`, `plannedLabour`, `baselineLock` |
| 07 | `ProcurementInventory` | `procurementinventories`| `purchaseOrders`, `grnList`, `stockBatches` |
| 08 | `ConstructionExecution`| `constructionexecutions`| `dprRecords`, `labourMuster`, `machineryUsage` |
| 09 | `QualityControl` | `qualitycontrols` | `cubeTests`, `mepInspections`, `snagList` |
| 10 | `ProjectControl` | `projectcontrols` | `earnedValue`, `indices (CPI/SPI)`, `forecasts` |
| 11 | `PmsFinance` | `pmsfinances` | `measurementBook`, `contractorBills`, `retention` |
| 12 | `PmsHandover` | `pmshandovers` | `occupancyCertificate`, `pdiInspection`, `keys` |
| 13 | `PmsAfterSales` | `pmsaftersales` | `warrantyClaims`, `amcSchedule`, `customerSatisfaction` |
