import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import { markExplicitInvocation } from "../../shared/src/mark-invocation.ts";
import type { HarnessBuildOptions, TriggerMode } from "../../../core/src/index.ts";

export interface CursorBuildOptions extends Partial<HarnessBuildOptions> {
  explicit?: boolean;
  trigger_mode?: TriggerMode;
}

export function buildCursorHarnessRequest(
  request: Record<string, unknown>,
  options: CursorBuildOptions = {}
) {
  const markedRequest = markExplicitInvocation(request, options.explicit ?? true);
  return buildHarnessRequest(markedRequest, {
    client: "cursor",
    sessionKey: options.sessionKey ?? "cursor",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion,
    trigger_mode: options.trigger_mode
  });
}