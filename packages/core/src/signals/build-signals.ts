import { runLegalWriterCheck } from "../checks/run-local-check.ts";
import { extractUserText } from "../request/detect.ts";
import type { HarnessConfig, SkillFluxClient, SkillFluxHarnessMetadata } from "../types/index.ts";

export const PLUGIN_VERSION = "skillflux-plugin/0.1.0";
export const SIGNALS_VERSION = "1";

export function buildHarnessSignals(
  request: unknown,
  sessionId: string,
  client: SkillFluxClient,
  config: HarnessConfig,
  pluginVersion = PLUGIN_VERSION
): SkillFluxHarnessMetadata {
  const userText = extractUserText(request);
  const localChecks = config.checks.enabled
    ? runLegalWriterCheck(userText)
    : runLegalWriterCheck("");

  return {
    session_id: sessionId,
    profile: config.profile,
    client,
    plugin_version: pluginVersion,
    enhance_mode: config.enhance_mode,
    industry_hint: config.industry,
    task_hint: "legal_writing",
    request_type: "final_answer",
    artifact_type: "legal_document",
    step_hint: "draft_or_review",
    local_checks: localChecks
  };
}

export function buildHarnessHeaders(signals: SkillFluxHarnessMetadata): Record<string, string> {
  return {
    "x-sf-session-id": signals.session_id,
    "x-sf-profile": signals.profile,
    "x-sf-client": signals.client,
    "x-sf-plugin-version": signals.plugin_version,
    "x-sf-enhance-mode": signals.enhance_mode,
    "x-sf-signals-version": SIGNALS_VERSION
  };
}
