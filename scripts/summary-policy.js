export function isOpenAiSummaryCandidate(item = {}, minRiskScore = 80) {
  return item.source_type === "COMPANY_IR"
    || item.category === "BCG_GROUP_WATCH"
    || item.priority === "CRITICAL"
    || item.priority === "HIGH"
    || Number(item.risk_score || 0) >= minRiskScore;
}
