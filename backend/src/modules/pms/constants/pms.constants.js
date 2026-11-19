// PMS Domain Constants — 13 Lifecycle Stages & Project Enums
// Derived from Langdi-ERP architectural specifications

const LIFECYCLE_STAGES = [
  {
    order: 1,
    key: 'landAcquisition',
    name: 'Land Acquisition',
    shortName: 'S1 • Land Acq.',
    checklist: ['Plot Search', 'Site Visit', 'Market Analysis', 'Feasibility Check'],
    docs: ['Plot Details', 'Feasibility Report'],
  },
  {
    order: 2,
    key: 'legalVerification',
    name: 'Legal Verification',
    shortName: 'S2 • Legal Verif.',
    checklist: ['Title Verification', 'Encumbrance Check', 'Legal Opinion', 'Documents Verified'],
    docs: ['Title Deed', 'Encumbrance Certificate', 'Legal Opinion'],
  },
  {
    order: 3,
    key: 'landPurchase',
    name: 'Land Purchase & Registry',
    shortName: 'S3 • Purchase & Reg.',
    checklist: ['Agreement', 'Payment Schedule', 'Registry', 'Mutation'],
    docs: ['Sale Agreement', 'Registry Document', 'Mutation Record'],
  },
  {
    order: 4,
    key: 'planningApprovals',
    name: 'Project Planning & Approvals',
    shortName: 'S4 • Planning & NOC',
    checklist: [
      'Survey & Layout',
      'Roads & Amenities',
      'Estimated Budget',
      'Management Approval',
      'Government Approval & NOC',
    ],
    docs: [
      'Survey Report',
      'Master Layout',
      'Approved Budget',
      'Management Approval',
      'Government Approval / NOC',
    ],
  },
  {
    order: 5,
    key: 'preSiteStart',
    name: 'Pre-Site Start',
    shortName: 'S5 • Pre-Site Start',
    checklist: ['Contractor Selection', 'Rate Finalization', 'WO / Agreement', 'Site Setup'],
    docs: ['Work Order', 'Contractor Agreement'],
  },
  {
    order: 6,
    key: 'baselinePlanning',
    name: 'Baseline Planning',
    shortName: 'S6 • Baseline Lock',
    checklist: ['Planned Material', 'Planned Labour', 'Planned Timeline', 'Planned Budget'],
    docs: ['Baseline Plan'],
    locksBaseline: true,
  },
  {
    order: 7,
    key: 'procurementInventory',
    name: 'Procurement & Inventory',
    shortName: 'S7 • Procurement',
    checklist: ['Vendor Selection', 'Purchase Order', 'Material Receive', 'Stock Entry (FIFO)'],
    docs: ['Purchase Orders', 'GRN'],
  },
  {
    order: 8,
    key: 'construction',
    name: 'Construction Execution',
    shortName: 'S8 • Construction',
    checklist: ['Daily Progress (DPR)', 'Labour & Material Use', 'Quality Check', 'Site Photos'],
    docs: ['DPR Log', 'Site Photos'],
  },
  {
    order: 9,
    key: 'qualityControl',
    name: 'Quality Control',
    shortName: 'S9 • Quality / Snags',
    checklist: ['Stage Inspection', 'Engineer Approval', 'Snag List', 'Rectification'],
    docs: ['Inspection Reports', 'Snag Register'],
  },
  {
    order: 10,
    key: 'projectControl',
    name: 'Project Control',
    shortName: 'S10 • Variance & Ctrl',
    checklist: ['Material Variance', 'Labour Variance', 'Time Variance', 'Cost Variance'],
    docs: ['Variance Report'],
  },
  {
    order: 11,
    key: 'finance',
    name: 'Finance Management',
    shortName: 'S11 • Finance & Cost',
    checklist: ['Budget vs Actual', 'Vendor Payments', 'Contractor Payments', 'Cost & Profit'],
    docs: ['P&L Statement', 'Payment Register'],
  },
  {
    order: 12,
    key: 'handover',
    name: 'Handover Management',
    shortName: 'S12 • Handover',
    checklist: ['Final Inspection', 'Snag Closure', 'Deep Cleaning', 'Customer Handover'],
    docs: ['Handover Checklist', 'Handover Certificate'],
  },
  {
    order: 13,
    key: 'afterSales',
    name: 'After Sales Service',
    shortName: 'S13 • After Sales',
    checklist: ['Warranty Claims', 'AMC / Service Visits', 'Customer Support', 'Feedback'],
    docs: ['Warranty Register', 'Service Log'],
  },
];

const BASELINE_LOCK_ORDER = 6;

const PMS_PROJECT_STATUS = ['planning', 'active', 'onHold', 'completed', 'cancelled'];

const AREA_UNITS = ['sqft', 'sqyd', 'sqm', 'acre', 'bigha'];

const PLOT_STATUS = [
  'identified',
  'visitScheduled',
  'visited',
  'underAnalysis',
  'feasibilityDone',
  'approved',
  'rejected',
];

const PLOT_SOURCES = ['broker', 'direct', 'agent', 'online', 'other'];

const ZONING_TYPES = ['residential', 'commercial', 'agricultural', 'mixed', 'industrial'];

const SITE_VISIT_STATUS = ['scheduled', 'submitted', 'completed', 'cancelled'];

const OBSERVATION_RATINGS = ['good', 'average', 'poor', 'na'];

const VISIT_RECOMMENDATIONS = ['proceed', 'hold', 'drop'];

const MARKET_ANALYSIS_STATUS = ['draft', 'completed'];

const DEMAND_LEVELS = ['high', 'medium', 'low'];

const FEASIBILITY_STATUS = ['draft', 'submitted', 'approved', 'rejected'];

const FEASIBILITY_VERDICTS = ['pending', 'feasible', 'feasibleWithConditions', 'notFeasible'];

const RISK_SEVERITIES = ['low', 'medium', 'high'];

const POSITIVE_VERDICTS = ['feasible', 'feasibleWithConditions'];

// ---- Legal Verification (Module 02 / Stage 2) ----
const LEGAL_CASE_STATUS = [
  'titleVerification',
  'encumbranceCheck',
  'documentVerification',
  'legalOpinion',
  'approvalPending',
  'approved',
  'rejected',
  'clarificationNeeded',
  'onHold',
];

const LEGAL_SECTION_KEYS = [
  'titleVerification',
  'encumbranceCheck',
  'documentVerification',
  'legalOpinion',
];

const LEGAL_SECTION_STATUS = ['pending', 'inProgress', 'completed'];

const LEGAL_ITEM_STATUS = ['pending', 'verified', 'rejected', 'na'];

const ENCUMBRANCE_ITEM_STATUS = ['pending', 'clear', 'issueFound', 'na'];

const LEGAL_ADVERSE_ITEM_STATUS = ['rejected', 'issueFound'];

const LEGAL_RECOMMENDATIONS = ['proceed', 'proceedWithConditions', 'doNotProceed'];

const LEGAL_DECISIONS = ['approved', 'rejected', 'clarificationNeeded', 'onHold'];

const TITLE_VERIFICATION_ITEMS = [
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'saleDeed', label: 'Sale Deed' },
  { key: 'motherDeed', label: 'Mother Deed' },
  { key: 'surveyNumber', label: 'Survey Number' },
  { key: 'mutation', label: 'Mutation' },
  { key: 'khata', label: 'Khata' },
  { key: 'revenueRecord', label: 'Revenue Record' },
  { key: 'taxReceipt', label: 'Tax Receipt' },
  { key: 'ownershipChain', label: 'Ownership Chain' },
];

const ENCUMBRANCE_ITEMS = [
  { key: 'mortgage', label: 'Mortgage' },
  { key: 'loan', label: 'Loan' },
  { key: 'courtCases', label: 'Court Cases' },
  { key: 'govtAcquisition', label: 'Government Acquisition' },
  { key: 'legalDisputes', label: 'Legal Disputes' },
  { key: 'pendingLitigation', label: 'Pending Litigation' },
  { key: 'encumbranceCertificate', label: 'Encumbrance Certificate' },
];

const LEGAL_DOCUMENT_ITEMS = [
  { key: 'saleDeed', label: 'Sale Deed' },
  { key: 'motherDeed', label: 'Mother Deed' },
  { key: 'jamabandi', label: 'Jamabandi' },
  { key: 'khasra', label: 'Khasra' },
  { key: 'khata', label: 'Khata' },
  { key: 'mutation', label: 'Mutation' },
  { key: 'taxReceipt', label: 'Tax Receipt' },
  { key: 'noc', label: 'NOC' },
  { key: 'aadhaar', label: 'Aadhaar' },
  { key: 'pan', label: 'PAN' },
  { key: 'powerOfAttorney', label: 'Power of Attorney' },
  { key: 'courtOrder', label: 'Court Order' },
  { key: 'otherDocuments', label: 'Other Documents' },
];

// ---- Land Purchase & Registry (Module 03 / Stage 3) ----
const LAND_PURCHASE_STATUS = [
  'negotiation',
  'priceApproval',
  'tokenPayment',
  'saleAgreement',
  'registry',
  'mutation',
  'completed',
  'cancelled',
];

const LAND_PURCHASE_SECTION_KEYS = [
  'negotiation',
  'priceApproval',
  'tokenPayment',
  'saleAgreement',
  'registry',
  'mutation',
];

const LAND_PURCHASE_SECTION_STATUS = ['pending', 'inProgress', 'completed'];

const LAND_PURCHASE_DECISIONS = ['approved', 'rejected'];

const PAYMENT_MODES = ['bankTransfer', 'cheque', 'cash', 'upi', 'dd'];

module.exports = {
  LIFECYCLE_STAGES,
  BASELINE_LOCK_ORDER,
  PMS_PROJECT_STATUS,
  AREA_UNITS,
  PLOT_STATUS,
  PLOT_SOURCES,
  ZONING_TYPES,
  SITE_VISIT_STATUS,
  OBSERVATION_RATINGS,
  VISIT_RECOMMENDATIONS,
  MARKET_ANALYSIS_STATUS,
  DEMAND_LEVELS,
  FEASIBILITY_STATUS,
  FEASIBILITY_VERDICTS,
  RISK_SEVERITIES,
  POSITIVE_VERDICTS,
  LEGAL_CASE_STATUS,
  LEGAL_SECTION_KEYS,
  LEGAL_SECTION_STATUS,
  LEGAL_ITEM_STATUS,
  ENCUMBRANCE_ITEM_STATUS,
  LEGAL_ADVERSE_ITEM_STATUS,
  LEGAL_RECOMMENDATIONS,
  LEGAL_DECISIONS,
  TITLE_VERIFICATION_ITEMS,
  ENCUMBRANCE_ITEMS,
  LEGAL_DOCUMENT_ITEMS,
  LAND_PURCHASE_STATUS,
  LAND_PURCHASE_SECTION_KEYS,
  LAND_PURCHASE_SECTION_STATUS,
  LAND_PURCHASE_DECISIONS,
  PAYMENT_MODES,
};
