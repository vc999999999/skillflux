import { runLegalWriterCheck } from "../checks/run-local-check.ts";
import { extractUserText } from "../request/detect.ts";
import type { HarnessConfig, SkillFluxClient, SkillFluxHarnessMetadata } from "../types/index.ts";
import { buildContentCompletenessCheck, classifyHarnessIntent } from "./classify-intent.ts";

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
  const intent = classifyHarnessIntent(userText, config);
  const legalChecks = config.checks.enabled
    ? runLegalWriterCheck(userText)
    : runLegalWriterCheck("");
  const contentCompleteness = config.checks.enabled
    ? buildContentCompletenessCheck(userText, intent, legalChecks)
    : {
        status: "incomplete" as const,
        score: 0,
        missing: ["checks_disabled"],
        present: []
      };
  const localChecks = {
    ...legalChecks,
    content_completeness: contentCompleteness,
    industry_evidence: intent.evidence
  };

  return {
    session_id: sessionId,
    profile: intent.profile,
    client,
    plugin_version: pluginVersion,
    enhance_mode: config.enhance_mode,
    workflow_hint: intent.workflow_hint,
    industry_hint: intent.industry,
    task_hint: intent.task_hint,
    request_type: "final_answer",
    artifact_type: intent.artifact_type,
    step_hint: intent.step_hint,
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
    "x-sf-workflow": signals.workflow_hint,
    "x-sf-signals-version": SIGNALS_VERSION
  };
}
