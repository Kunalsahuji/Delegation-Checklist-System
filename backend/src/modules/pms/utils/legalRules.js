const {
  LEGAL_ADVERSE_ITEM_STATUS,
  RISK_SEVERITIES,
} = require('../constants/pms.constants');

const RISK_RANK = { '': 0, low: 1, medium: 2, high: 3 };
const isAdverse = (status) => LEGAL_ADVERSE_ITEM_STATUS.includes(status);
const hasText = (s) => !!String(s || '').trim();

/**
 * Check if a document item in documentVerification is satisfied.
 * Single answer model: 'yes' is satisfied, 'no' is satisfied only if remarks (reason) provided.
 */
const documentItemSatisfied = (item = {}) => {
  if (item.answer === 'yes') return true;
  if (item.answer === 'no') return hasText(item.remarks);
  return false;
};

const documentItemMissing = (item = {}) => {
  if (item.answer === 'yes') return [];
  if (item.answer === 'no') return hasText(item.remarks) ? [] : ['a written reason'];
  return ['an answer (Yes or No)'];
};

/**
 * Validate blockers preventing a section from being marked as completed.
 */
const sectionBlockers = (section, key, context = {}) => {
  const blockers = [];
  if (!section) return blockers;
  const items = section.items || [];

  if (key === 'documentVerification') {
    items
      .filter((i) => !documentItemSatisfied(i))
      .forEach((i) => {
        if (i.answer === 'no') {
          blockers.push(`${i.label}: marked not available — a reason is required`);
        } else {
          blockers.push(`${i.label}: not answered yet — choose Yes or No`);
        }
      });
    return blockers;
  }

  const pending = items.filter((i) => i.status === 'pending');
  if (pending.length) {
    blockers.push(`${pending.length} item(s) unverified: ${pending.map((i) => i.label).join(', ')}`);
  }

  items
    .filter((i) => isAdverse(i.status) && !hasText(i.remarks))
    .forEach((i) => blockers.push(`${i.label} is marked ${i.status} — remarks are required`));

  items
    .filter((i) => i.status === 'na' && !hasText(i.remarks))
    .forEach((i) => blockers.push(`${i.label} is marked not applicable — a reason is required`));

  if (key === 'encumbranceCheck' && !section.riskLevel) {
    blockers.push('Risk level not set');
  }

  if (key === 'legalOpinion') {
    if (!hasText(section.advocateName)) blockers.push('Legal advocate name missing');
    if (!hasText(section.opinion)) blockers.push('Opinion text missing');
    if (!section.recommendation) blockers.push('Recommendation not selected');
    if (!section.riskCategory) blockers.push('Risk category not selected');
    if (!hasText(section.signature)) blockers.push('Digital signature missing');

    const encumbranceRisk = context.encumbranceRisk || '';
    if (
      section.riskCategory &&
      encumbranceRisk &&
      RISK_RANK[section.riskCategory] < RISK_RANK[encumbranceRisk] &&
      !hasText(section.remarks)
    ) {
      blockers.push(
        `Risk category (${section.riskCategory}) is lower than the Encumbrance risk level (${encumbranceRisk}) — record justification in remarks`
      );
    }
  }

  return blockers;
};

/**
 * Derived risk calculation roll-up across all 4 sections.
 */
const computeRisk = (legalCase) => {
  const reasons = [];
  let score = 0;

  const adverseTitle = (legalCase.titleVerification?.items || []).filter((i) => isAdverse(i.status));
  const adverseEnc = (legalCase.encumbranceCheck?.items || []).filter((i) => isAdverse(i.status));

  adverseTitle.forEach((i) => {
    score += 10;
    reasons.push(`Title: ${i.label} rejected`);
  });
  adverseEnc.forEach((i) => {
    score += 15;
    reasons.push(`Encumbrance: ${i.label} issue found`);
  });

  const encRisk = legalCase.encumbranceCheck?.riskLevel || '';
  if (encRisk === 'high') {
    score += 30;
    reasons.push('Encumbrance risk level is high');
  } else if (encRisk === 'medium') {
    score += 15;
  }

  const opinionRisk = legalCase.legalOpinion?.riskCategory || '';
  if (opinionRisk === 'high') {
    score += 25;
    reasons.push('Legal opinion risk category is high');
  } else if (opinionRisk === 'medium') {
    score += 12;
  }

  const rec = legalCase.legalOpinion?.recommendation || '';
  if (rec === 'doNotProceed') {
    score += 40;
    reasons.push('Advocate recommended: do not proceed');
  } else if (rec === 'proceedWithConditions') {
    score += 15;
    reasons.push('Advocate recommended: proceed with conditions');
  }

  score = Math.min(100, score);
  const forcedHigh = encRisk === 'high' || opinionRisk === 'high' || rec === 'doNotProceed';
  const level = forcedHigh || score >= 60 ? 'high' : score >= 25 ? 'medium' : 'low';

  return {
    level: RISK_SEVERITIES.includes(level) ? level : 'low',
    score,
    adverseCount: adverseTitle.length + adverseEnc.length,
    reasons,
    computedAt: new Date(),
  };
};

/**
 * Gate check for PM decision
 */
const approvalReadiness = (legalCase) => {
  const blockers = [];
  const warnings = [];

  const sections = ['titleVerification', 'encumbranceCheck', 'documentVerification', 'legalOpinion'];
  sections.forEach((sec) => {
    if (legalCase[sec]?.status !== 'completed') {
      blockers.push(`Section "${sec}" must be completed first`);
    }
  });

  const risk = legalCase.risk || computeRisk(legalCase);
  const requiresJustification =
    risk.adverseCount > 0 || risk.level === 'high' || legalCase.legalOpinion?.recommendation === 'doNotProceed';

  if (requiresJustification) {
    warnings.push(
      `This case has ${risk.adverseCount} adverse finding(s) with ${risk.level.toUpperCase()} risk. Written justification is mandatory.`
    );
  }

  return {
    canDecide: blockers.length === 0,
    blockers,
    warnings,
    requiresJustification,
    risk,
  };
};

module.exports = {
  isAdverse,
  hasText,
  documentItemSatisfied,
  documentItemMissing,
  sectionBlockers,
  computeRisk,
  approvalReadiness,
};
