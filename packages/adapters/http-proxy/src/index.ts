import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import type { HarnessBuildOptions } from "../../../core/src/index.ts";

export function buildHttpProxyHarnessRequest(request: Record<string, unknown>, options: Partial<HarnessBuildOptions> = {}) {
  return buildHarnessRequest(request, {
    client: "http-proxy",
    sessionKey: options.sessionKey ?? "http-proxy",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion
  });
}
