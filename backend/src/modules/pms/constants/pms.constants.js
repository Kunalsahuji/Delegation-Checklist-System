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

module.exports = {
  LIFECYCLE_STAGES,
  BASELINE_LOCK_ORDER,
  PMS_PROJECT_STATUS,
  AREA_UNITS,
};
