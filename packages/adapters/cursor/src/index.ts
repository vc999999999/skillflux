import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import type { HarnessBuildOptions } from "../../../core/src/index.ts";

export function buildCursorHarnessRequest(request: Record<string, unknown>, options: Partial<HarnessBuildOptions> = {}) {
  return buildHarnessRequest(request, {
    client: "cursor",
    sessionKey: options.sessionKey ?? "cursor",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion
  });
}
