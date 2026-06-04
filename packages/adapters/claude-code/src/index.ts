import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import { markExplicitInvocation } from "../../shared/src/mark-invocation.ts";
import type { HarnessBuildOptions, TriggerMode } from "../../../core/src/index.ts";

export interface ClaudeCodeBuildOptions extends Partial<HarnessBuildOptions> {
  explicit?: boolean;
  trigger_mode?: TriggerMode;
}

export function buildClaudeCodeHarnessRequest(
  request: Record<string, unknown>,
  options: ClaudeCodeBuildOptions = {}
) {
  const markedRequest = markExplicitInvocation(request, options.explicit ?? true);
  return buildHarnessRequest(markedRequest, {
    client: "claude-code",
    sessionKey: options.sessionKey ?? "claude-code",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion,
    trigger_mode: options.trigger_mode
  });
}