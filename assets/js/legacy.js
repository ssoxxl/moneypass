'use strict';
const legacyAliases = {
  'guide-unemployment-benefit-self-resignation':'guide-unemployment-benefit',
  'guide-health-insurance-ceiling-refund':'guide-health-refund',
  'guide-youth-rent-subsidy-2026':'guide-youth-rent',
  'guide-national-pension-tips':'guide-retirement-planning'
};
const requestedId = new URLSearchParams(location.search).get('id');
const legacyId = legacyAliases[requestedId] || requestedId;
const legacyGuide = MONEYPASS_DATA.guides.find(g => g.id === legacyId);
if (legacyGuide) location.replace(`guides/${encodeURIComponent(legacyGuide.id)}.html`);
