import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import { markExplicitInvocation } from "../../shared/src/mark-invocation.ts";
import type { HarnessBuildOptions, TriggerMode } from "../../../core/src/index.ts";

export interface OpenCodeBuildOptions extends Partial<HarnessBuildOptions> {
  explicit?: boolean;
  trigger_mode?: TriggerMode;
}

export function buildOpenCodeHarnessRequest(
  request: Record<string, unknown>,
  options: OpenCodeBuildOptions = {}
) {
  const markedRequest = markExplicitInvocation(request, options.explicit ?? true);
  return buildHarnessRequest(markedRequest, {
    client: "opencode",
    sessionKey: options.sessionKey ?? "opencode",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion,
    trigger_mode: options.trigger_mode
  });
}