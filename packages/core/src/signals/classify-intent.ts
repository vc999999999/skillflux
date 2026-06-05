import type {
  ContentCompletenessCheck,
  HarnessConfig,
  HarnessIntent,
  LegalWriterChecks
} from "../types/index.ts";

type RouteDefinition = {
  industry: string;
  profile: string;
  workflow_hint: string;
  task_hint: string;
  artifact_type: string;
  step_hint: string;
  patterns: RegExp[];
  required: Array<[string, RegExp]>;
};

const ROUTES: RouteDefinition[] = [
  {
    industry: "legal",
    profile: "legal-writer",
    workflow_hint: "legal-writer-harness",
    task_hint: "legal_writing",
    artifact_type: "legal_document",
    step_hint: "draft_or_review",
    patterns: [
      /\b(contract|agreement|nda|demand letter|complaint|memo|brief|legal|law|statute|regulation)\b/i,
      /\b(breach|damages|plaintiff|defendant|clause|terms|liability)\b/i,
      /(合同|协议|律师函|起诉状|法律|法规|条款|违约|赔偿|原告|被告)/
    ],
    required: [
      ["document_type", /\b(contract|agreement|nda|demand letter|complaint|memo|brief)\b|合同|协议|律师函|起诉状|备忘录/i],
      ["party_names", /\b(llc|inc\.?|corp\.?|ltd\.?|company|plaintiff|defendant|party|parties)\b|公司|甲方|乙方|原告|被告/i],
      ["claims_or_terms", /\b(claim|breach|damages|payment|unpaid|terms?|clauses?|obligation)\b|违约|赔偿|付款|条款|请求/i],
      ["legal_basis", /\b(delaware|california|new york|ucc|usc|cfr|statute|regulation|law)\b|法律|法规|条例|民法典/i]
    ]
  },
  {
    industry: "ecommerce",
    profile: "ecommerce-listing-basic",
    workflow_hint: "ecommerce-listing-harness",
    task_hint: "listing_optimization",
    artifact_type: "product_listing",
    step_hint: "listing_quality_review",
    patterns: [
      /\b(amazon|shopify|listing|sku|product title|bullet points?|conversion|marketplace|asin)\b/i,
      /\b(product|price|inventory|category|keywords?|seller|store)\b/i,
      /(商品|电商|标题|卖点|关键词|类目|店铺|转化率)/
    ],
    required: [
      ["product_subject", /\b(product|sku|asin|item|商品|产品)\b/i],
      ["channel", /\b(amazon|shopify|marketplace|store|店铺|平台)\b/i],
      ["listing_fields", /\b(title|bullet points?|description|keywords?|标题|卖点|描述|关键词)\b/i],
      ["target_customer", /\b(customer|audience|buyer|persona|target|用户|买家|人群)\b/i]
    ]
  },
  {
    industry: "finance",
    profile: "finance-report-review",
    workflow_hint: "finance-report-harness",
    task_hint: "financial_review",
    artifact_type: "financial_report",
    step_hint: "assumption_and_variance_review",
    patterns: [
      /\b(revenue|forecast|ebitda|cash flow|balance sheet|p&l|profit|margin|variance|yoy|q[1-4])\b/i,
      /\b(financial|finance|budget|currency|assumption|valuation)\b/i,
      /(财务|收入|利润|现金流|预算|预测|同比|环比|估值)/
    ],
    required: [
      ["metric", /\b(revenue|profit|margin|cash flow|ebitda|income|收入|利润|现金流)\b/i],
      ["period", /\b(q[1-4]|fy|year|month|quarter|年度|季度|月份)\b/i],
      ["assumptions", /\b(assumption|forecast|variance|yoy|currency|假设|预测|同比|币种)\b/i]
    ]
  },
  {
    industry: "medical",
    profile: "medical-safety-review",
    workflow_hint: "medical-safety-harness",
    task_hint: "medical_information_review",
    artifact_type: "medical_guidance",
    step_hint: "safety_and_scope_review",
    patterns: [
      /\b(patient|diagnosis|symptom|treatment|clinical|drug|dose|therapy|medical|doctor)\b/i,
      /(患者|诊断|症状|治疗|药物|剂量|临床|医疗|医生)/
    ],
    required: [
      ["patient_context", /\b(patient|age|sex|history|患者|年龄|病史)\b/i],
      ["clinical_question", /\b(symptom|diagnosis|treatment|drug|症状|诊断|治疗|药物)\b/i],
      ["safety_boundary", /\b(emergency|doctor|clinician|urgent|急诊|医生|就医)\b/i]
    ]
  },
  {
    industry: "education",
    profile: "education-tutor",
    workflow_hint: "education-tutor-harness",
    task_hint: "learning_support",
    artifact_type: "lesson_or_feedback",
    step_hint: "teaching_plan_review",
    patterns: [
      /\b(student|lesson|curriculum|homework|quiz|teach|rubric|learning|classroom)\b/i,
      /(学生|课程|作业|测验|教学|评分|课堂|学习)/
    ],
    required: [
      ["learner_level", /\b(grade|level|beginner|advanced|学生|年级|水平)\b/i],
      ["learning_goal", /\b(goal|objective|teach|learn|目标|教学|学习)\b/i],
      ["assessment_or_activity", /\b(homework|quiz|rubric|exercise|作业|测验|练习|评分)\b/i]
    ]
  }
];

const GENERAL_ROUTE: RouteDefinition = {
  industry: "general",
  profile: "general-assistant",
  workflow_hint: "general-assistant-harness",
  task_hint: "general_assistance",
  artifact_type: "general_answer",
  step_hint: "respond",
  patterns: [],
  required: [["user_request", /\S/]]
};

const PROFILE_ROUTES = new Map<string, RouteDefinition>(
  [...ROUTES, GENERAL_ROUTE].map(route => [route.profile, route])
);

export function classifyHarnessIntent(text: string, config: HarnessConfig): HarnessIntent {
  const configuredProfile = normalize(config.profile);
  const configuredIndustry = normalize(config.industry);
  if (configuredProfile && configuredProfile !== "auto") {
    return intentFromRoute(PROFILE_ROUTES.get(configuredProfile) ?? {
      ...GENERAL_ROUTE,
      profile: configuredProfile,
      workflow_hint: `${configuredProfile}-harness`
    }, text);
  }

  const allowedIndustry = configuredIndustry && configuredIndustry !== "auto" ? configuredIndustry : "";
  const candidates = allowedIndustry
    ? ROUTES.filter(route => route.industry === allowedIndustry)
    : ROUTES;
  let bestRoute: RouteDefinition | undefined;
  let bestScore = 0;
  for (const route of candidates) {
    const score = route.patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestRoute = route;
    }
  }
  return intentFromRoute(bestScore > 0 && bestRoute ? bestRoute : GENERAL_ROUTE, text);
}

export function buildContentCompletenessCheck(
  text: string,
  intent: HarnessIntent,
  legalChecks: LegalWriterChecks
): ContentCompletenessCheck {
  if (intent.industry === "legal") {
    const present: string[] = [];
    const missing: string[] = [];
    addCompleteness("document_type", legalChecks.document_type !== "unknown", present, missing);
    addCompleteness("party_names", legalChecks.has_party_names, present, missing);
    addCompleteness("claims_or_terms", legalChecks.has_claims_or_terms, present, missing);
    addCompleteness("legal_basis", legalChecks.has_legal_basis, present, missing);
    return summarizeCompleteness(present, missing);
  }

  const route = [...ROUTES, GENERAL_ROUTE].find(item => item.profile === intent.profile) ?? GENERAL_ROUTE;
  const present: string[] = [];
  const missing: string[] = [];
  for (const [name, pattern] of route.required) {
    addCompleteness(name, pattern.test(text), present, missing);
  }
  return summarizeCompleteness(present, missing);
}

function intentFromRoute(route: RouteDefinition, text: string): HarnessIntent {
  const evidence = route.patterns
    .filter(pattern => pattern.test(text))
    .slice(0, 3)
    .map(pattern => pattern.source);
  return {
    industry: route.industry,
    profile: route.profile,
    workflow_hint: route.workflow_hint,
    task_hint: route.task_hint,
    artifact_type: route.artifact_type,
    step_hint: route.step_hint,
    evidence
  };
}

function summarizeCompleteness(present: string[], missing: string[]): ContentCompletenessCheck {
  const total = present.length + missing.length;
  const score = total === 0 ? 0 : Number((present.length / total).toFixed(2));
  return {
    status: missing.length === 0 ? "complete" : "incomplete",
    score,
    missing,
    present
  };
}

function addCompleteness(name: string, ok: boolean, present: string[], missing: string[]): void {
  if (ok) {
    present.push(name);
  } else {
    missing.push(name);
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
