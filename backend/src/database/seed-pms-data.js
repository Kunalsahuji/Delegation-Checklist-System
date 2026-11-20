const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./connect');
const User = require('../modules/auth/models/user.model');
const PmsProject = require('../modules/pms/models/pmsProject.model');
const Plot = require('../modules/pms/models/plot.model');
const Feasibility = require('../modules/pms/models/feasibility.model');
const LegalCase = require('../modules/pms/models/legalCase.model');
const LandPurchase = require('../modules/pms/models/landPurchase.model');
const ProjectPlanning = require('../modules/pms/models/projectPlanning.model');
const PreSiteStart = require('../modules/pms/models/preSiteStart.model');
const BaselinePlanning = require('../modules/pms/models/baselinePlanning.model');
const ProcurementInventory = require('../modules/pms/models/procurementInventory.model');
const ConstructionExecution = require('../modules/pms/models/constructionExecution.model');
const QualityControl = require('../modules/pms/models/qualityControl.model');
const ProjectControl = require('../modules/pms/models/projectControl.model');
const PmsFinance = require('../modules/pms/models/pmsFinance.model');
const PmsHandover = require('../modules/pms/models/pmsHandover.model');
const PmsAfterSales = require('../modules/pms/models/pmsAfterSales.model');
const pmsFinanceService = require('../modules/pms/services/pmsFinance.service');
const pmsHandoverService = require('../modules/pms/services/pmsHandover.service');
const pmsAfterSalesService = require('../modules/pms/services/pmsAfterSales.service');

async function seedPMSShowcaseData() {
  console.log('--- Starting PMS Live Showcase Data Seeding ---');
  await connectDB();

  const admin = await User.findOne({ role: 'Administrator' });
  const pm = await User.findOne({ role: 'Manager' }) || admin;
  const adminId = admin?._id || pm?._id;
  const pmId = pm?._id || adminId;

  // Retrieve projects
  const prjEfe = await PmsProject.findOne({ code: 'PRJ-EFE', deletedAt: null });
  const prjRpe = await PmsProject.findOne({ code: 'PRJ-RPE', deletedAt: null });
  const prjAgv = await PmsProject.findOne({ code: 'PRJ-AGV', deletedAt: null });

  if (!prjEfe || !prjRpe || !prjAgv) {
    console.error('Error: Could not locate baseline projects PRJ-EFE, PRJ-RPE, or PRJ-AGV.');
    await disconnectDB();
    return;
  }

  console.log('✓ Found baseline projects:', prjEfe.code, prjRpe.code, prjAgv.code);

  // -------------------------------------------------------------
  // 1. STAGE 11: FINANCE MANAGEMENT & CONTRACTOR RA BILLING
  // -------------------------------------------------------------
  console.log('\n--- Seeding Stage 11: Finance & RA Billing ---');
  await PmsFinance.deleteMany({ project: { $in: [prjEfe._id, prjRpe._id, prjAgv._id] } });

  // 1.1 PRJ-EFE (Certified & Settled)
  const finEfe = await PmsFinance.create({
    code: 'FIN-000001',
    project: prjEfe._id,
    status: 'approved',
    budgetVsActual: {
      budgetedRevenue: 75000000,
      actualRevenueCollected: 72500000,
      budgetedExpenditure: 42000000,
      actualExpenditure: 39800000,
      grossMarginPercent: 45.1,
      status: 'completed',
      remarks: 'Project collection efficiency at 96.6% with 45.1% gross margin',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    vendorPayments: {
      invoices: [
        {
          invoiceNumber: 'INV-ULT-019',
          poNumber: 'PO-EFE-CEM-01',
          vendorName: 'UltraTech Cement Distributors Ltd',
          invoiceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          grossAmount: 3850000,
          gstAmount: 693000,
          tdsAmount: 77000,
          retentionAmount: 0,
          netPayable: 4466000,
          paymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          paymentMode: 'bankTransfer',
          paymentRef: 'NEFT-HDFC-991203',
          status: 'Paid',
        },
        {
          invoiceNumber: 'INV-TATA-042',
          poNumber: 'PO-EFE-STL-02',
          vendorName: 'Tata Steel Rebar Corp Agencies',
          invoiceDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          grossAmount: 6200000,
          gstAmount: 1116000,
          tdsAmount: 124000,
          retentionAmount: 0,
          netPayable: 7192000,
          paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          paymentMode: 'bankTransfer',
          paymentRef: 'RTGS-ICICI-881230',
          status: 'Paid',
        },
      ],
      totalVendorInvoiced: 11658000,
      totalVendorPaid: 11658000,
      pendingVendorClearance: 0,
      status: 'completed',
      remarks: 'All primary structural materials settled in full',
      completedBy: pmId,
      completedAt: new Date(),
    },
    contractorPayments: {
      raBills: [
        {
          billNumber: 'RA-EFE-01',
          contractorName: 'Apex Civil Infra & RCC Contractors',
          trade: 'RCC Substructure & Raft',
          workOrderRef: 'WO-EFE-001',
          billPeriod: 'Foundation to Ground Plinth',
          certifiedWorkValue: 8500000,
          previousBilled: 0,
          currentBilled: 8500000,
          retentionDeduction: 425000,
          advanceRecovery: 850000,
          netCertifiedPayable: 7225000,
          paidAmount: 7225000,
          paymentStatus: 'Settled',
          engineerCertifier: 'Er. Sandeep Rathore',
        },
        {
          billNumber: 'RA-EFE-02',
          contractorName: 'Apex Civil Infra & RCC Contractors',
          trade: 'RCC Superstructure & Roof Slabs',
          workOrderRef: 'WO-EFE-001',
          billPeriod: '1st Floor to 5th Floor Slab',
          certifiedWorkValue: 12400000,
          previousBilled: 8500000,
          currentBilled: 12400000,
          retentionDeduction: 620000,
          advanceRecovery: 1240000,
          netCertifiedPayable: 10540000,
          paidAmount: 10540000,
          paymentStatus: 'Settled',
          engineerCertifier: 'Er. Sandeep Rathore',
        },
      ],
      totalRaCertified: 20900000,
      totalRaPaid: 17765000,
      pendingRaClearance: 0,
      status: 'completed',
      remarks: 'All contractor milestones cleared and retention verified',
      completedBy: pmId,
      completedAt: new Date(),
    },
    costAndProfit: {
      landCost: 15000000,
      developmentCost: 6500000,
      approvalsCost: 1200000,
      procurementCost: 11658000,
      labourCost: 8500000,
      overheadsAndMisc: 1500000,
      totalCostOfProject: 44358000,
      projectedRevenue: 75000000,
      netProjectProfit: 30642000,
      profitMarginPercent: 40.9,
      status: 'completed',
      remarks: 'P&L audited with 40.9% net project profit return',
      completedBy: pmId,
      completedAt: new Date(),
    },
    totalDisbursements: 29423000,
    pendingDisbursements: 0,
    totalRaCertifiedAmount: 20900000,
    isApproved: true,
    approvedBy: adminId,
    approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    createdBy: pmId,
  });
  console.log('✓ Seeded Finance for PRJ-EFE:', finEfe.code);

  // 1.2 PRJ-RPE (Active Accounting & RA Bills in Progress)
  const finRpe = await PmsFinance.create({
    code: 'FIN-000002',
    project: prjRpe._id,
    status: 'activeAccounting',
    budgetVsActual: {
      budgetedRevenue: 92000000,
      actualRevenueCollected: 58000000,
      budgetedExpenditure: 54000000,
      actualExpenditure: 32500000,
      grossMarginPercent: 44.0,
      status: 'inProgress',
      remarks: 'Revenue milestone collections ongoing for Tower A & B',
      completedBy: null,
    },
    vendorPayments: {
      invoices: [
        {
          invoiceNumber: 'INV-RPE-CEM-01',
          poNumber: 'PO-RPE-01',
          vendorName: 'Ambuja Cements Commercial Division',
          invoiceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          grossAmount: 2400000,
          gstAmount: 432000,
          tdsAmount: 48000,
          retentionAmount: 0,
          netPayable: 2784000,
          paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          paymentMode: 'bankTransfer',
          paymentRef: 'NEFT-SBI-440192',
          status: 'Paid',
        },
        {
          invoiceNumber: 'INV-RPE-STL-02',
          poNumber: 'PO-RPE-02',
          vendorName: 'Kamdhenu TMT Rebars Ltd',
          invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          grossAmount: 3900000,
          gstAmount: 702000,
          tdsAmount: 78000,
          retentionAmount: 0,
          netPayable: 4524000,
          status: 'Pending',
        },
      ],
      totalVendorInvoiced: 7308000,
      totalVendorPaid: 2784000,
      pendingVendorClearance: 4524000,
      status: 'inProgress',
      remarks: 'Steel rebar batch invoice queued for Friday treasury release',
    },
    contractorPayments: {
      raBills: [
        {
          billNumber: 'RA-RPE-01',
          contractorName: 'Shivalik Infra Structural Builders',
          trade: 'Civil & Basements',
          workOrderRef: 'WO-RPE-001',
          billPeriod: 'Double Basement Excavation & Retaining Walls',
          certifiedWorkValue: 6800000,
          previousBilled: 0,
          currentBilled: 6800000,
          retentionDeduction: 340000,
          advanceRecovery: 680000,
          netCertifiedPayable: 5780000,
          paidAmount: 5780000,
          paymentStatus: 'Paid',
          engineerCertifier: 'Er. Sandeep Rathore',
        },
        {
          billNumber: 'RA-RPE-02',
          contractorName: 'Shivalik Infra Structural Builders',
          trade: 'Podium & Tower Columns',
          workOrderRef: 'WO-RPE-001',
          billPeriod: 'Podium Level to 2nd Floor',
          certifiedWorkValue: 7400000,
          previousBilled: 6800000,
          currentBilled: 7400000,
          retentionDeduction: 370000,
          advanceRecovery: 740000,
          netCertifiedPayable: 6290000,
          paidAmount: 0,
          paymentStatus: 'Approved',
          engineerCertifier: 'Er. Sandeep Rathore',
        },
      ],
      totalRaCertified: 14200000,
      totalRaPaid: 5780000,
      pendingRaClearance: 6290000,
      status: 'inProgress',
      remarks: 'RA-02 approved by Lead Engineer; clearance scheduled',
    },
    costAndProfit: {
      landCost: 22000000,
      developmentCost: 8000000,
      approvalsCost: 1500000,
      procurementCost: 7308000,
      labourCost: 6800000,
      overheadsAndMisc: 1800000,
      totalCostOfProject: 47408000,
      projectedRevenue: 92000000,
      netProjectProfit: 44592000,
      profitMarginPercent: 48.5,
      status: 'inProgress',
      remarks: 'Projections healthy with 48.5% margin target',
    },
    totalDisbursements: 8564000,
    pendingDisbursements: 10814000,
    totalRaCertifiedAmount: 14200000,
    isApproved: false,
    createdBy: pmId,
  });
  console.log('✓ Seeded Finance for PRJ-RPE:', finRpe.code);

  // 1.3 PRJ-AGV (Active Accounting)
  const finAgv = await PmsFinance.create({
    code: 'FIN-000003',
    project: prjAgv._id,
    status: 'billingInProgress',
    budgetVsActual: {
      budgetedRevenue: 60000000,
      actualRevenueCollected: 38000000,
      budgetedExpenditure: 36000000,
      actualExpenditure: 22000000,
      grossMarginPercent: 42.1,
      status: 'inProgress',
      remarks: 'Civil stage payments in progress',
    },
    vendorPayments: {
      invoices: [
        {
          invoiceNumber: 'INV-AGV-01',
          poNumber: 'PO-AGV-01',
          vendorName: 'Birla White & UltraTech Cement Agencies',
          invoiceDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          grossAmount: 1950000,
          gstAmount: 351000,
          tdsAmount: 39000,
          retentionAmount: 0,
          netPayable: 2262000,
          paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          paymentMode: 'bankTransfer',
          paymentRef: 'NEFT-PNB-129034',
          status: 'Paid',
        },
      ],
      totalVendorInvoiced: 2262000,
      totalVendorPaid: 2262000,
      pendingVendorClearance: 0,
      status: 'completed',
    },
    contractorPayments: {
      raBills: [
        {
          billNumber: 'RA-AGV-01',
          contractorName: 'Rajdhani Civil & Infrastructure Pvt Ltd',
          trade: 'Civil Structure',
          workOrderRef: 'WO-AGV-01',
          billPeriod: 'Substructure & Foundation',
          certifiedWorkValue: 4500000,
          previousBilled: 0,
          currentBilled: 4500000,
          retentionDeduction: 225000,
          advanceRecovery: 450000,
          netCertifiedPayable: 3825000,
          paidAmount: 3825000,
          paymentStatus: 'Paid',
          engineerCertifier: 'Er. Sandeep Rathore',
        },
      ],
      totalRaCertified: 4500000,
      totalRaPaid: 3825000,
      pendingRaClearance: 0,
      status: 'completed',
    },
    costAndProfit: {
      landCost: 14000000,
      developmentCost: 5500000,
      approvalsCost: 950000,
      procurementCost: 2262000,
      labourCost: 4500000,
      overheadsAndMisc: 900000,
      totalCostOfProject: 28112000,
      projectedRevenue: 60000000,
      netProjectProfit: 31888000,
      profitMarginPercent: 53.1,
      status: 'inProgress',
    },
    totalDisbursements: 6087000,
    pendingDisbursements: 0,
    totalRaCertifiedAmount: 4500000,
    isApproved: false,
    createdBy: pmId,
  });
  console.log('✓ Seeded Finance for PRJ-AGV:', finAgv.code);

  // Sync Stage 11 in project models
  await pmsFinanceService.syncStage11(prjEfe._id, true);
  await pmsFinanceService.syncStage11(prjRpe._id, false);
  await pmsFinanceService.syncStage11(prjAgv._id, false);

  // -------------------------------------------------------------
  // 2. STAGE 12: HANDOVER & POSSESSION MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n--- Seeding Stage 12: Handover & Possession ---');
  await PmsHandover.deleteMany({ project: { $in: [prjEfe._id, prjAgv._id] } });

  // 2.1 PRJ-EFE (Certified & Possession Completed)
  const hndEfe = await PmsHandover.create({
    code: 'HND-000001',
    project: prjEfe._id,
    status: 'approved',
    finalInspection: {
      inspectorName: 'Er. Sandeep Rathore',
      inspectionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      structuralIntegrityApproved: true,
      mepServicesCertified: true,
      finishingApproved: true,
      allInspectionsCleared: true,
      status: 'completed',
      remarks: 'Structural, MEP, and architectural finishing inspected and approved 100%',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
    snagClosure: {
      totalSnagsIdentified: 12,
      snagsRectified: 12,
      pendingSnags: 0,
      zeroSnagCertificateIssued: true,
      deSnaggingEngineer: 'Er. Rajesh Kumar',
      status: 'completed',
      remarks: 'Zero open snags remain. Official Zero-Snag certificate sealed.',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    },
    deepCleaning: {
      areasCleaned: [
        { area: 'Living & Dining Floor Deep Scrubbing', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Kitchen Countertop & Cabinet Degreasing', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Bathroom Tiles, Fixtures & Acid Cleaning', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Windows & Glass Glazing Spotless Polishing', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Balcony & Terrace Pressure Wash', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Electrical Fittings & Switchboard Wipe-down', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Door Frames & Hardware Polish', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Common Corridor & Entrance Lobby Detailing', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
      ],
      deepCleaningContractor: 'Sparkle Facilities & Services',
      signOffDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      allAreasCleaned: true,
      status: 'completed',
      remarks: 'Complete deep cleaning and sanitized detailing verified',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    },
    customerHandover: {
      customerName: 'Mr. Arvind Gupta & Family',
      unitNumber: 'Villa 101 (Executive Enclave)',
      possessionLetterIssued: true,
      keysHandedOver: true,
      meterReadings: {
        electricity: '00155.0 kWh',
        water: '00062.5 L',
      },
      welcomeKitHanded: true,
      handoverDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      satisfactionRating: 5,
      status: 'completed',
      remarks: 'Official possession ceremony completed; keys & welcome pack handed to allottee',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    possessionCompleted: true,
    zeroSnagVerified: true,
    pendingSnagsCount: 0,
    inspectionsCleared: true,
    isApproved: true,
    approvedBy: adminId,
    approvedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    createdBy: pmId,
  });
  console.log('✓ Seeded Handover for PRJ-EFE:', hndEfe.code);

  // 2.2 PRJ-AGV (Pre-Handover In Progress)
  const hndAgv = await PmsHandover.create({
    code: 'HND-000002',
    project: prjAgv._id,
    status: 'deSnaggingInProgress',
    finalInspection: {
      inspectorName: 'Er. Sandeep Rathore',
      inspectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      structuralIntegrityApproved: true,
      mepServicesCertified: true,
      finishingApproved: false,
      allInspectionsCleared: false,
      status: 'inProgress',
      remarks: 'Structural and MEP verified; finishing touch-ups pending',
    },
    snagClosure: {
      totalSnagsIdentified: 15,
      snagsRectified: 12,
      pendingSnags: 3,
      zeroSnagCertificateIssued: false,
      deSnaggingEngineer: 'Er. Rajesh Kumar',
      status: 'inProgress',
      remarks: '3 minor paint and silicon touch-up snags in progress',
    },
    deepCleaning: {
      areasCleaned: [
        { area: 'Living & Dining Floor Deep Scrubbing', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Kitchen Countertop & Cabinet Degreasing', status: 'completed', cleanedAt: new Date(), inspectedBy: 'Supervisor' },
        { area: 'Bathroom Tiles, Fixtures & Acid Cleaning', status: 'inProgress', cleanedAt: null, inspectedBy: 'Supervisor' },
        { area: 'Windows & Glass Glazing Spotless Polishing', status: 'pending', cleanedAt: null, inspectedBy: 'Supervisor' },
      ],
      deepCleaningContractor: 'Sparkle Facilities & Services',
      allAreasCleaned: false,
      status: 'inProgress',
      remarks: 'Deep cleaning underway in Phase 1 units',
    },
    customerHandover: {
      customerName: 'Mr. Rajesh & Seema Verma',
      unitNumber: 'Flat 402, Block A',
      possessionLetterIssued: false,
      keysHandedOver: false,
      meterReadings: {
        electricity: '00088.0 kWh',
        water: '00030.0 L',
      },
      welcomeKitHanded: false,
      satisfactionRating: 5,
      status: 'pending',
    },
    possessionCompleted: false,
    zeroSnagVerified: false,
    pendingSnagsCount: 3,
    inspectionsCleared: false,
    isApproved: false,
    createdBy: pmId,
  });
  console.log('✓ Seeded Handover for PRJ-AGV:', hndAgv.code);

  // Sync Stage 12 in project models
  await pmsHandoverService.syncStage12(prjEfe._id, true);
  await pmsHandoverService.syncStage12(prjAgv._id, false);

  // -------------------------------------------------------------
  // 3. STAGE 13: AFTER SALES, WARRANTY & DLP MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n--- Seeding Stage 13: After Sales & DLP ---');
  await PmsAfterSales.deleteMany({ project: { $in: [prjEfe._id, prjAgv._id] } });

  // 3.1 PRJ-EFE (Certified, DLP Matured & 100% Completed Project Lifecycle)
  const aslEfe = await PmsAfterSales.create({
    code: 'ASL-000001',
    project: prjEfe._id,
    status: 'approved',
    warrantyClaims: {
      claims: [
        {
          claimNumber: 'CLM-EFE-01',
          customerName: 'Mr. Arvind Gupta',
          unitNumber: 'Villa 101',
          issueDescription: 'Master bathroom shower diverter pressure calibration',
          trade: 'Plumbing',
          severity: 'Low',
          status: 'Rectified',
          reportedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          resolvedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          assignedTechnician: 'DLP Rapid Response Team',
          resolutionCost: 650,
        },
        {
          claimNumber: 'CLM-EFE-02',
          customerName: 'Mr. Arvind Gupta',
          unitNumber: 'Villa 101',
          issueDescription: 'Balcony deck spotlight seal silicone touch-up',
          trade: 'Electrical',
          severity: 'Low',
          status: 'Closed',
          reportedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          resolvedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          assignedTechnician: 'DLP Electrician',
          resolutionCost: 400,
        },
      ],
      totalClaims: 2,
      activeClaims: 0,
      resolvedClaims: 2,
      status: 'completed',
      remarks: 'All warranty calls resolved within 48-hour SLA window',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    amcVisits: {
      visits: [
        {
          visitCode: 'AMC-EFE-Q1',
          visitType: 'Quarterly Preventive Maintenance',
          scheduledDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          completedDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
          vendorName: 'BlueStar MEP Facilities & HVAC',
          technicianName: 'Sanjay Verma (Lead Tech)',
          findings: 'Filter deep-clean and refrigerant pressure verified optimal',
          status: 'Completed',
        },
        {
          visitCode: 'AMC-EFE-LFT',
          visitType: 'Lift & Elevator Audit',
          scheduledDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          vendorName: 'Otis Elevator India Pvt Ltd',
          technicianName: 'Otis Certified Inspector',
          findings: 'Overspeed governor, sensors and safety brakes 100% compliant',
          status: 'Completed',
        },
      ],
      totalVisits: 2,
      completedVisits: 2,
      pendingVisits: 0,
      status: 'completed',
      remarks: 'All quarterly preventive inspections successfully executed',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    customerSupport: {
      tickets: [
        {
          ticketNumber: 'TKT-EFE-101',
          customerName: 'Mr. Arvind Gupta',
          contactNumber: '+91 98260 11223',
          category: 'Amenities & Club Access',
          priority: 'Medium',
          status: 'Resolved',
          subject: 'Clubhouse swimming pool and gym biometric enrollment',
          resolutionNotes: 'Resident profile and biometric RFID tokens activated in clubhouse database',
          openedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          closedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      ],
      totalTickets: 1,
      openTickets: 0,
      resolvedTickets: 1,
      status: 'completed',
      remarks: 'Helpdesk requests closed satisfactorily',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    feedback: {
      reviews: [
        {
          reviewId: 'REV-EFE-001',
          customerName: 'Mr. Arvind Gupta & Family',
          unitNumber: 'Villa 101',
          overallRating: 5,
          qualityRating: 5,
          serviceSpeedRating: 5,
          comments: 'Superb craftsmanship and very attentive DLP after-sales support. Living here has exceeded our expectations!',
          npsScore: 10,
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
      averageRating: 5.0,
      totalFeedbackCount: 1,
      npsScore: 10,
      status: 'completed',
      remarks: 'Homeowner NPS score at 10/10 with 5-star rating',
      completedBy: pmId,
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    totalClaimsCount: 2,
    activeClaimsCount: 0,
    completedVisitsCount: 2,
    resolvedTicketsCount: 1,
    averageSatisfactionScore: 5.0,
    isApproved: true,
    approvedBy: adminId,
    approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: pmId,
  });
  console.log('✓ Seeded After-Sales for PRJ-EFE:', aslEfe.code);

  // 3.2 PRJ-AGV (Warranty Active with live claim)
  const aslAgv = await PmsAfterSales.create({
    code: 'ASL-000002',
    project: prjAgv._id,
    status: 'warrantyActive',
    warrantyClaims: {
      claims: [
        {
          claimNumber: 'CLM-AGV-01',
          customerName: 'Mr. Rajesh Verma',
          unitNumber: 'Flat 402',
          issueDescription: 'Kitchen under-sink RO water supply line valve dripping',
          trade: 'Plumbing',
          severity: 'Medium',
          status: 'WorkAssigned',
          reportedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          assignedTechnician: 'DLP Rapid Response Team',
          resolutionCost: 500,
        },
      ],
      totalClaims: 1,
      activeClaims: 1,
      resolvedClaims: 0,
      status: 'inProgress',
      remarks: 'Plumbing technician dispatched for valve replacement',
    },
    amcVisits: {
      visits: [
        {
          visitCode: 'AMC-AGV-01',
          visitType: 'Lift & Elevator Audit',
          scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          vendorName: 'Schindler Elevators India Ltd',
          technicianName: 'Field Inspector',
          findings: 'Scheduled quarterly preventive inspection',
          status: 'Scheduled',
        },
      ],
      totalVisits: 1,
      completedVisits: 0,
      pendingVisits: 1,
      status: 'inProgress',
    },
    customerSupport: {
      tickets: [
        {
          ticketNumber: 'TKT-AGV-01',
          customerName: 'Mr. Rajesh Verma',
          contactNumber: '+91 99280 44112',
          category: 'Facility Maintenance',
          priority: 'Medium',
          status: 'InProgress',
          subject: 'EV charging slot allocation query in basement 1',
          resolutionNotes: 'Site engineer checking dedicated electrical feed meter connection',
          openedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      totalTickets: 1,
      openTickets: 1,
      resolvedTickets: 0,
      status: 'inProgress',
    },
    feedback: {
      reviews: [
        {
          reviewId: 'REV-AGV-01',
          customerName: 'Mr. Rajesh Verma',
          unitNumber: 'Flat 402',
          overallRating: 4,
          qualityRating: 4,
          serviceSpeedRating: 4,
          comments: 'Smooth handover process and quick orientation to society amenities.',
          npsScore: 9,
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      averageRating: 4.0,
      totalFeedbackCount: 1,
      npsScore: 9,
      status: 'inProgress',
    },
    totalClaimsCount: 1,
    activeClaimsCount: 1,
    completedVisitsCount: 0,
    resolvedTicketsCount: 0,
    averageSatisfactionScore: 4.0,
    isApproved: false,
    createdBy: pmId,
  });
  console.log('✓ Seeded After-Sales for PRJ-AGV:', aslAgv.code);

  // Sync Stage 13 in project models
  await pmsAfterSalesService.syncStage13(prjEfe._id, true);
  await pmsAfterSalesService.syncStage13(prjAgv._id, false);

  // Re-verify PRJ-EFE status & stageOrder
  const finalEfe = await PmsProject.findById(prjEfe._id);
  console.log('\n======================================================');
  console.log('SHOWCASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('Project Catalog Flagship:', {
    code: finalEfe.code,
    name: finalEfe.name,
    stageOrder: finalEfe.stageOrder,
    status: finalEfe.status,
    stagesCount: finalEfe.stages?.length,
  });
  console.log('======================================================');

  await disconnectDB();
}

seedPMSShowcaseData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
