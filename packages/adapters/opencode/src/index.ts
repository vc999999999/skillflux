import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import type { HarnessBuildOptions } from "../../../core/src/index.ts";

export function buildOpenCodeHarnessRequest(request: Record<string, unknown>, options: Partial<HarnessBuildOptions> = {}) {
  return buildHarnessRequest(request, {
    client: "opencode",
    sessionKey: options.sessionKey ?? "opencode",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion
  });
}
