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

// ---- Project Planning & Approvals (Module 04 / Stage 4) ----
const PROJECT_TYPES = ['plotting', 'villa', 'apartment', 'commercial'];

const PROJECT_PLANNING_STATUS = [
  'survey',
  'masterLayout',
  'roadPlanning',
  'amenities',
  'plotVillaPlanning',
  'budget',
  'managementApproval',
  'pendingGovernmentApproval',
  'approved',
  'rejected',
  'cancelled',
];

const PLANNING_SECTION_KEYS = [
  'survey',
  'masterLayout',
  'roadPlanning',
  'amenities',
  'plotVillaPlanning',
  'budget',
];

const PLANNING_SECTION_STATUS = ['pending', 'inProgress', 'completed', 'notApplicable'];

const PLANNING_DECISIONS = ['approved', 'rejected'];

const ROAD_CATEGORIES = ['main', 'internal', 'approach'];
const ROAD_SURFACES = ['bt', 'cc', 'wbm', 'paver', 'kutcha'];
const FACING_DIRECTIONS = [
  'east',
  'west',
  'north',
  'south',
  'northEast',
  'northWest',
  'southEast',
  'southWest',
];
const UNIT_KINDS = ['plot', 'villa', 'apartment', 'shop'];

const PLANNING_AMENITY_ITEMS = [
  { key: 'garden', label: 'Garden / Central Park' },
  { key: 'clubhouse', label: 'Clubhouse & Community Hall' },
  { key: 'swimmingPool', label: 'Swimming Pool' },
  { key: 'parking', label: 'Visitors Parking Bay' },
  { key: 'temple', label: 'Temple & Meditation Area' },
  { key: 'securityCabin', label: 'Gated Security Cabin' },
];

// Stage 5: Pre-Site Start & Contractor Selection Constants
const PRE_SITE_STATUS = [
  'contractorSelection',
  'rateFinalization',
  'workOrder',
  'siteSetup',
  'managementApproval',
  'approved',
  'cancelled',
];

const PRE_SITE_SECTION_KEYS = [
  'contractorSelection',
  'rateFinalization',
  'workOrder',
  'siteSetup',
];

const CONTRACTOR_TRADES = [
  'civil',
  'infrastructure',
  'earthwork',
  'electrical',
  'plumbing',
  'general',
  'mep',
  'landscaping',
];

const CONTRACT_TYPES = [
  'itemRate',
  'lumpSum',
  'percentageRate',
  'turnkey',
  'costPlus',
];

const DEFAULT_RATE_ITEMS = [
  { itemDescription: 'Earthwork Excavation in all types of soil', unit: 'cum', tenderRate: 180, agreedRate: 165 },
  { itemDescription: 'Plain Cement Concrete (PCC 1:4:8)', unit: 'cum', tenderRate: 4800, agreedRate: 4600 },
  { itemDescription: 'Reinforced Cement Concrete (RCC M25)', unit: 'cum', tenderRate: 6800, agreedRate: 6500 },
  { itemDescription: 'TMT Reinforcement bar cutting & placing', unit: 'kg', tenderRate: 78, agreedRate: 74 },
  { itemDescription: 'Brickwork / AAC Block masonry in CM 1:6', unit: 'cum', tenderRate: 4200, agreedRate: 4000 },
  { itemDescription: 'Internal / External Cement Plastering', unit: 'sqm', tenderRate: 190, agreedRate: 175 },
];

// Stage 6: Baseline Planning & Baseline Lock Constants
const BASELINE_STATUS = [
  'plannedMaterial',
  'plannedLabour',
  'plannedTimeline',
  'plannedCashflow',
  'baselineReview',
  'locked',
  'cancelled',
];

const BASELINE_SECTION_KEYS = [
  'plannedMaterial',
  'plannedLabour',
  'plannedTimeline',
  'plannedCashflow',
];

const DEFAULT_MATERIALS = [
  { name: 'OPC 53 Grade Cement', category: 'cement', unit: 'Bags', plannedQuantity: 12000, unitRate: 380, remarks: 'Ultratech / Ambuja 53 Grade' },
  { name: 'Fe 550D TMT Reinforcement Steel', category: 'steel', unit: 'MT', plannedQuantity: 140, unitRate: 62000, remarks: 'Tata Tiscon / Jindal Panther' },
  { name: 'Coarse River Sand / M-Sand', category: 'sand', unit: 'MT', plannedQuantity: 1800, unitRate: 1400, remarks: 'Washed zone-II sand' },
  { name: '10mm & 20mm Crushed Aggregate', category: 'aggregate', unit: 'MT', plannedQuantity: 2400, unitRate: 950, remarks: 'Blue metal basalt aggregate' },
  { name: 'AAC Lightweight Blocks (600x200x150mm)', category: 'blocks', unit: 'Nos', plannedQuantity: 45000, unitRate: 65, remarks: 'Grade 1 compressive strength' },
  { name: 'Ready Mix Concrete (RMC M25)', category: 'rmc', unit: 'cum', plannedQuantity: 850, unitRate: 4600, remarks: 'Transit mixer supply on site' },
];

const DEFAULT_LABOUR_TRADES = [
  { trade: 'Mason (Head Mason & Skilled)', headcount: 8, ratePerDay: 900, plannedManDays: 1440, remarks: 'Brickwork & plastering gang' },
  { trade: 'Barbender (Steel Fixer)', headcount: 6, ratePerDay: 850, plannedManDays: 900, remarks: 'Rebar cutting, bending & binding' },
  { trade: 'Carpenter (Shuttering & Formwork)', headcount: 6, ratePerDay: 850, plannedManDays: 960, remarks: 'Plywood & props staging' },
  { trade: 'Heavy Machinery Operator', headcount: 3, ratePerDay: 1100, plannedManDays: 450, remarks: 'JCB, excavator & roller operators' },
  { trade: 'General Helper / Unskilled Labour', headcount: 20, ratePerDay: 550, plannedManDays: 3600, remarks: 'Material handling & concrete curing' },
];

const DEFAULT_TIMELINE_MILESTONES = [
  { name: '1. Site Mobilization & Earthwork Excavation', durationDays: 45, weightagePercent: 10, remarks: 'Boundary clearing, levelling & basement/foundation dig' },
  { name: '2. Substructure & Plinth Level RCC', durationDays: 60, weightagePercent: 20, remarks: 'Footings, grade slab, tie beams & plinth filling' },
  { name: '3. Superstructure RCC Framing', durationDays: 90, weightagePercent: 30, remarks: 'Columns, shear walls, beams & floor slabs' },
  { name: '4. Block Masonry & Internal/External Plaster', durationDays: 60, weightagePercent: 15, remarks: 'Partition walls, lintels & 2-coat plaster' },
  { name: '5. MEP, Concealed Electrical & Plumbing', durationDays: 45, weightagePercent: 10, remarks: 'Conduits, wiring, water supply & drainage lines' },
  { name: '6. Architectural Finishing & Landscaping', durationDays: 45, weightagePercent: 10, remarks: 'Tiles, exterior texture painting, doors & roads' },
  { name: '7. Final Inspection, Snagging & Commissioning', durationDays: 15, weightagePercent: 5, remarks: 'QA signoff, deep cleaning & owner handover' },
];

// Stage 7: Procurement & Inventory Constants
const PROCUREMENT_STATUS = [
  'vendorSelection',
  'purchaseOrder',
  'materialReceive',
  'stockEntry',
  'managementApproval',
  'approved',
  'cancelled',
];

const PROCUREMENT_SECTION_KEYS = [
  'vendorSelection',
  'purchaseOrder',
  'materialReceive',
  'stockEntry',
];

const MATERIAL_CATEGORIES = [
  'cement',
  'steel',
  'sand',
  'aggregate',
  'blocks',
  'rmc',
  'electrical',
  'plumbing',
  'paint',
  'tiles',
  'general',
];

const DEFAULT_VENDORS = [
  { name: 'Ultratech Cement Distributors Ltd', category: 'cement', contactPerson: 'Suresh Agarwal', phone: '+91 98290 55441', gstNumber: '08AAACU1234F1Z1', rating: 4.8 },
  { name: 'Kamdhenu & Tata Steel Agencies', category: 'steel', contactPerson: 'Deepak Sharma', phone: '+91 94140 22331', gstNumber: '08AAACK5678G1Z2', rating: 4.9 },
  { name: 'Jaipur Mining & Sand Suppliers', category: 'sand', contactPerson: 'Kailash Meena', phone: '+91 98280 99881', gstNumber: '08AAACJ9012H1Z3', rating: 4.5 },
  { name: 'Apex Crushed Blue Metal Basalt', category: 'aggregate', contactPerson: 'Er. Rohit Saini', phone: '+91 97850 11223', gstNumber: '08AAACA3456J1Z4', rating: 4.7 },
  { name: 'Prism RMC Ready Mix Concrete', category: 'rmc', contactPerson: 'Manish Verma', phone: '+91 99280 66778', gstNumber: '08AAACP7890K1Z5', rating: 4.8 },
];

const CONSTRUCTION_STATUS = [
  'siteMobilized',
  'inProgress',
  'reviewPending',
  'approved',
  'rejected',
];

const CONSTRUCTION_SECTION_KEYS = [
  'dailyProgress',
  'labourTracking',
  'materialConsumption',
  'qualitySitePhotos',
];

const WEATHER_CONDITIONS = ['Sunny', 'Clear', 'Cloudy', 'Rainy', 'Windy', 'Extreme Heat'];

const SHIFTS = ['Day Shift', 'Night Shift', 'Overtime'];

const CONSTRUCTION_TRADES = [
  'Civil & Masonry',
  'Shuttering & Formwork',
  'Bar Bending & Steel',
  'Concreting & Pouring',
  'Plumbing & Drainage',
  'Electrical Conduit & Wiring',
  'Plastering & Rendering',
  'Painting & Finishing',
  'General Unskilled Labour',
];

const QUALITY_CHECK_STATUS = ['Passed', 'Conditional Pass', 'Rectification Required', 'Rejected'];

const PHOTO_CATEGORIES = [
  'Foundation & Excavation',
  'RCC Structural Work',
  'Brickwork & Masonry',
  'Finishing & MEP',
  'Safety & Equipment',
  'Snag & Rectification',
];

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
  PROJECT_TYPES,
  PROJECT_PLANNING_STATUS,
  PLANNING_SECTION_KEYS,
  PLANNING_SECTION_STATUS,
  PLANNING_DECISIONS,
  ROAD_CATEGORIES,
  ROAD_SURFACES,
  FACING_DIRECTIONS,
  UNIT_KINDS,
  PLANNING_AMENITY_ITEMS,
  PRE_SITE_STATUS,
  PRE_SITE_SECTION_KEYS,
  CONTRACTOR_TRADES,
  CONTRACT_TYPES,
  DEFAULT_RATE_ITEMS,
  BASELINE_STATUS,
  BASELINE_SECTION_KEYS,
  DEFAULT_MATERIALS,
  DEFAULT_LABOUR_TRADES,
  DEFAULT_TIMELINE_MILESTONES,
  PROCUREMENT_STATUS,
  PROCUREMENT_SECTION_KEYS,
  MATERIAL_CATEGORIES,
  DEFAULT_VENDORS,
  CONSTRUCTION_STATUS,
  CONSTRUCTION_SECTION_KEYS,
  WEATHER_CONDITIONS,
  SHIFTS,
  CONSTRUCTION_TRADES,
  QUALITY_CHECK_STATUS,
  PHOTO_CATEGORIES,
};
