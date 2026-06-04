import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import type { HarnessBuildOptions } from "../../../core/src/index.ts";

export function buildCodexHarnessRequest(request: Record<string, unknown>, options: Partial<HarnessBuildOptions> = {}) {
  return buildHarnessRequest(request, {
    client: "codex",
    sessionKey: options.sessionKey ?? "codex",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion
  });
}
