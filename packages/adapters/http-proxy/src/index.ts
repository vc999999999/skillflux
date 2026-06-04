import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import { markExplicitInvocation } from "../../shared/src/mark-invocation.ts";
import type { HarnessBuildOptions, TriggerMode } from "../../../core/src/index.ts";

export interface HttpProxyBuildOptions extends Partial<HarnessBuildOptions> {
  explicit?: boolean;
  trigger_mode?: TriggerMode;
}

export function buildHttpProxyHarnessRequest(
  request: Record<string, unknown>,
  options: HttpProxyBuildOptions = {}
) {
  const markedRequest = markExplicitInvocation(request, options.explicit ?? true);
  return buildHarnessRequest(markedRequest, {
    client: "http-proxy",
    sessionKey: options.sessionKey ?? "http-proxy",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion,
    trigger_mode: options.trigger_mode
  });
}