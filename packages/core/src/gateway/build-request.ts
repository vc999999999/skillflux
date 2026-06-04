import { loadHarnessConfig } from "../config/load-config.ts";
import { detectRequestShape } from "../request/detect.ts";
import { buildHarnessHeaders, buildHarnessSignals } from "../signals/build-signals.ts";
import { injectHarnessMetadata } from "../signals/inject-metadata.ts";
import { currentSession } from "../session/session-store.ts";
import type { HarnessBuildOptions, HarnessBuildResult } from "../types/index.ts";

export async function buildHarnessRequest<TRequest extends Record<string, unknown>>(
  request: TRequest,
  options: HarnessBuildOptions
): Promise<HarnessBuildResult<TRequest>> {
  const config = options.config ?? loadHarnessConfig();
  const requestShape = detectRequestShape(request);
  const diagnostics: string[] = [];

  if (!config.enabled) {
    return {
      request,
      headers: {},
      requestShape,
      degraded: true,
      diagnostics: ["harness disabled"]
    };
  }

  if (requestShape === "unknown") {
    return {
      request,
      headers: {},
      requestShape,
      degraded: true,
      diagnostics: ["unsupported request shape"]
    };
  }

  const sessionId = currentSession(options.sessionKey ?? "default", config.session.ttl_seconds);
  const signals = buildHarnessSignals(request, sessionId, options.client, config, options.pluginVersion);

  return {
    request: injectHarnessMetadata(request, signals),
    headers: buildHarnessHeaders(signals),
    signals,
    requestShape,
    degraded: false,
    diagnostics
  };
}
