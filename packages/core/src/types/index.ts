export type SupportedRequestShape = "chat" | "claude" | "responses" | "unknown";

export type SkillFluxClient =
  | "codex"
  | "claude-code"
  | "cursor"
  | "opencode"
  | "http-proxy"
  | string;

export interface HarnessConfig {
  enabled: boolean;
  profile: string;
  industry: "legal" | string;
  enhance_mode: "standard" | "off" | string;
  gateway_base_url: string;
  session: {
    strategy: "agent-task" | string;
    ttl_seconds: number;
  };
  checks: {
    enabled: boolean;
    max_runtime_ms: number;
  };
}

export interface RawHarnessConfig {
  enabled?: boolean;
  profile?: string;
  default_profile?: string;
  industry?: string;
  enhance_mode?: string;
  gateway_base_url?: string;
  session?: Partial<HarnessConfig["session"]>;
  checks?: Partial<HarnessConfig["checks"]>;
}

export interface LegalWriterChecks {
  document_type: string;
  has_party_names: boolean;
  has_claims_or_terms: boolean;
  has_legal_basis: boolean;
  risk_level: "unknown" | "low" | "medium" | "high";
}

export interface SkillFluxHarnessMetadata {
  session_id: string;
  profile: string;
  client: string;
  plugin_version: string;
  enhance_mode: string;
  industry_hint: string;
  task_hint: "legal_writing" | string;
  request_type: "final_answer" | string;
  artifact_type: "legal_document" | string;
  step_hint: "draft_or_review" | string;
  local_checks: LegalWriterChecks;
}

export interface HarnessBuildOptions {
  client: SkillFluxClient;
  sessionKey?: string;
  config?: HarnessConfig;
  pluginVersion?: string;
}

export interface HarnessBuildResult<TRequest = Record<string, unknown>> {
  request: TRequest;
  headers: Record<string, string>;
  signals?: SkillFluxHarnessMetadata;
  requestShape: SupportedRequestShape;
  degraded: boolean;
  diagnostics: string[];
}
