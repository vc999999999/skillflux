import type { HarnessConfig, RawHarnessConfig } from "../types/index.ts";

export const DEFAULT_HARNESS_CONFIG: HarnessConfig = {
  enabled: true,
  profile: "legal-writer",
  industry: "legal",
  enhance_mode: "standard",
  gateway_base_url: "https://your-skillflux-gateway.example.com",
  session: {
    strategy: "agent-task",
    ttl_seconds: 1800
  },
  checks: {
    enabled: true,
    max_runtime_ms: 800
  }
};

export function loadHarnessConfig(raw: RawHarnessConfig = {}): HarnessConfig {
  const profile = raw.profile ?? raw.default_profile ?? DEFAULT_HARNESS_CONFIG.profile;

  return {
    ...DEFAULT_HARNESS_CONFIG,
    enabled: raw.enabled ?? DEFAULT_HARNESS_CONFIG.enabled,
    profile,
    industry: raw.industry ?? DEFAULT_HARNESS_CONFIG.industry,
    enhance_mode: raw.enhance_mode ?? DEFAULT_HARNESS_CONFIG.enhance_mode,
    gateway_base_url: raw.gateway_base_url ?? DEFAULT_HARNESS_CONFIG.gateway_base_url,
    session: {
      ...DEFAULT_HARNESS_CONFIG.session,
      ...raw.session
    },
    checks: {
      ...DEFAULT_HARNESS_CONFIG.checks,
      ...raw.checks
    }
  };
}
