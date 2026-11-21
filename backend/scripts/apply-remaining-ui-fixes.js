const fs = require('fs');
const path = require('path');

const pmsPagesDir = path.resolve(__dirname, '../../frontend/src/modules/pms/pages');

// 1. PmsLegalCaseListPage.jsx
let legal = fs.readFileSync(path.join(pmsPagesDir, 'PmsLegalCaseListPage.jsx'), 'utf8');

// Header badge clean
legal = legal.replace(/Stage 0?2\s*•\s*/g, '');

// Clean status
const oldLegalStatusRegex = /<span\s*className=\{`inline-flex items-center gap-1 px-2\.5 py-0\.5 rounded-full text-\[11px\] font-semibold capitalize \$\{[^}]+\}`\}>[\s\S]*?<\/span>/;
const newLegalStatus = `<span className="text-xs font-semibold whitespace-nowrap text-slate-700">
                        {item.status === 'titleVerification'
                          ? 'Title Verification'
                          : item.status === 'encumbranceCheck'
                          ? 'Encumbrance Check'
                          : item.status === 'documentVerification'
                          ? 'Document Completeness'
                          : item.status === 'legalOpinion'
                          ? 'Legal Opinion'
                          : item.status === 'approvalPending'
                          ? 'Approval Pending'
                          : item.status === 'approved'
                          ? 'Title Clear'
                          : item.status === 'rejected'
                          ? 'Title Defective'
                          : item.status}
                      </span>`;
legal = legal.replace(oldLegalStatusRegex, newLegalStatus);

// Clean action button
legal = legal.replace(
  /className="inline-flex items-center gap-1\.5 px-3 py-1\.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"/g,
  'className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"'
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsLegalCaseListPage.jsx'), legal, 'utf8');
console.log('Updated PmsLegalCaseListPage.jsx');


// 2. PmsLandPurchaseListPage.jsx
let purchase = fs.readFileSync(path.join(pmsPagesDir, 'PmsLandPurchaseListPage.jsx'), 'utf8');

// Header badge clean
purchase = purchase.replace(/Stage 0?3\s*•\s*/g, '');

// Clean status (no numbers, no pill bg/border)
const oldPurchaseStatusRegex = /<span\s*className=\{`inline-flex items-center gap-1 px-2\.5 py-0\.5 rounded-full text-\[11px\] font-semibold capitalize \$\{[^}]+\}`\}>[\s\S]*?<\/span>/;
const newPurchaseStatus = `<span className="text-xs font-semibold whitespace-nowrap text-slate-700">
                        {item.status === 'negotiation'
                          ? 'Negotiation'
                          : item.status === 'priceApproval'
                          ? 'Price Sanction'
                          : item.status === 'tokenPayment'
                          ? 'Token Advance'
                          : item.status === 'saleAgreement'
                          ? 'Sale Agreement'
                          : item.status === 'registration'
                          ? 'Registration'
                          : item.status === 'mutation'
                          ? 'Mutation Record'
                          : item.status === 'completed'
                          ? 'Completed'
                          : item.status}
                      </span>`;
purchase = purchase.replace(oldPurchaseStatusRegex, newPurchaseStatus);

// Clean action button
purchase = purchase.replace(
  /className="inline-flex items-center gap-1\.5 px-3 py-1\.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-2xs"/g,
  'className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"'
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsLandPurchaseListPage.jsx'), purchase, 'utf8');
console.log('Updated PmsLandPurchaseListPage.jsx');


// 3. PmsHandoverListPage.jsx
let handover = fs.readFileSync(path.join(pmsPagesDir, 'PmsHandoverListPage.jsx'), 'utf8');

// Header badge clean
handover = handover.replace(/Stage 12\s*/g, '');

// Clean code
handover = handover.replace(
  '<span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">\n                          {item.code}\n                        </span>',
  '<div className="font-bold text-slate-900">{item.code}</div>'
);

// Clean status
handover = handover.replace(
  /<span className=\{`px-2\.5 py-1 rounded-full text-\[10px\] font-bold border \$\{[^}]+\}`\}>[\s\S]*?<\/span>/g,
  '<span className="text-xs font-semibold whitespace-nowrap text-slate-700">{cfg.label}</span>'
);

// Clean action button
handover = handover.replace(
  /className="inline-flex items-center gap-1\.5 px-3 py-1\.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-semibold shadow-xs transition"/g,
  'className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"'
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsHandoverListPage.jsx'), handover, 'utf8');
console.log('Updated PmsHandoverListPage.jsx');


// 4. PmsAfterSalesListPage.jsx
let aftersales = fs.readFileSync(path.join(pmsPagesDir, 'PmsAfterSalesListPage.jsx'), 'utf8');

// Header badge clean
aftersales = aftersales.replace(/Stage 13 \(Terminal Lifecycle\)/g, 'After-Sales & DLP Warranty');

// Clean code
aftersales = aftersales.replace(
  '<span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">\n                          {item.code}\n                        </span>',
  '<div className="font-bold text-slate-900">{item.code}</div>'
);

// Clean status
aftersales = aftersales.replace(
  /<span className=\{`px-2\.5 py-1 rounded-full text-\[10px\] font-bold border \$\{[^}]+\}`\}>[\s\S]*?<\/span>/g,
  '<span className="text-xs font-semibold whitespace-nowrap text-slate-700">{cfg.label}</span>'
);

// Clean action button
aftersales = aftersales.replace(
  /className="inline-flex items-center gap-1\.5 px-3 py-1\.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-xs font-semibold shadow-xs transition"/g,
  'className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"'
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsAfterSalesListPage.jsx'), aftersales, 'utf8');
console.log('Updated PmsAfterSalesListPage.jsx');
