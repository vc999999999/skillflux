import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import { markExplicitInvocation } from "../../shared/src/mark-invocation.ts";
import type { HarnessBuildOptions, TriggerMode } from "../../../core/src/index.ts";

export interface CodexBuildOptions extends Partial<HarnessBuildOptions> {
  explicit?: boolean;
  trigger_mode?: TriggerMode;
}

export function buildCodexHarnessRequest(
  request: Record<string, unknown>,
  options: CodexBuildOptions = {}
) {
  const markedRequest = markExplicitInvocation(request, options.explicit ?? true);
  return buildHarnessRequest(markedRequest, {
    client: "codex",
    sessionKey: options.sessionKey ?? "codex",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion,
    trigger_mode: options.trigger_mode
  });
}