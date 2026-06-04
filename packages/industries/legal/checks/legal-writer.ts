import type { LegalWriterChecks } from "../../../core/src/types/index.ts";

const DOCUMENT_TYPES: Array<[string, RegExp]> = [
  ["complaint", /\b(complaint|petition|起诉状|诉状)\b/i],
  ["demand_letter", /\b(demand letter|催告函|律师函|demand)\b/i],
  ["contract", /\b(contract|agreement|nda|msa|合同|协议|保密协议)\b/i],
  ["memo", /\b(memo|memorandum|法律备忘录|备忘录)\b/i],
  ["brief", /\b(brief|motion|答辩状|上诉状|代理词)\b/i],
  ["privacy_policy", /\b(privacy policy|隐私政策)\b/i],
  ["terms_of_service", /\b(terms of service|服务条款|用户协议)\b/i]
];

export function runLegalWriterCheck(text: string): LegalWriterChecks {
  const source = text.trim();
  const lower = source.toLowerCase();
  const documentType = DOCUMENT_TYPES.find(([, pattern]) => pattern.test(source))?.[0] ?? "unknown";
  const hasPartyNames = /\b(llc|inc\.?|corp\.?|ltd\.?|company|plaintiff|defendant|party|parties)\b/i.test(source) ||
    /[\u4e00-\u9fa5]{2,}(公司|集团|律所|法院|甲方|乙方|原告|被告)/.test(source);
  const hasClaimsOrTerms = /\b(claim|against|breach|damages|payment|unpaid|invoices?|terms?|clauses?|relief|obligation|违约|赔偿|付款|条款|请求|诉求)\b/i.test(source);
  const hasLegalBasis = /\b(delaware|california|new york|ucc|usc|cfr|statute|regulation|law|法律|法规|条例|合同法|民法典)\b/i.test(source);
  const riskLevel = resolveRiskLevel(lower, hasClaimsOrTerms, hasLegalBasis);

  return {
    document_type: documentType,
    has_party_names: hasPartyNames,
    has_claims_or_terms: hasClaimsOrTerms,
    has_legal_basis: hasLegalBasis,
    risk_level: riskLevel
  };
}

function resolveRiskLevel(text: string, hasClaimsOrTerms: boolean, hasLegalBasis: boolean): LegalWriterChecks["risk_level"] {
  if (/\b(urgent|injunction|criminal|sanction|termination|fraud|紧急|刑事|欺诈|解除|禁令)\b/i.test(text)) {
    return "high";
  }
  if (hasClaimsOrTerms && !hasLegalBasis) {
    return "medium";
  }
  if (hasClaimsOrTerms || hasLegalBasis) {
    return "low";
  }
  return "unknown";
}
