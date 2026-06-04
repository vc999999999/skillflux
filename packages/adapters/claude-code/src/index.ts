import { buildHarnessRequest, loadHarnessConfig } from "../../../core/src/index.ts";
import type { HarnessBuildOptions } from "../../../core/src/index.ts";

export function buildClaudeCodeHarnessRequest(request: Record<string, unknown>, options: Partial<HarnessBuildOptions> = {}) {
  return buildHarnessRequest(request, {
    client: "claude-code",
    sessionKey: options.sessionKey ?? "claude-code",
    config: options.config ?? loadHarnessConfig({}),
    pluginVersion: options.pluginVersion
  });
}
