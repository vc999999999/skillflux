import { loadHarnessConfig } from "../config/load-config.ts";
import { detectRequestShape } from "../request/detect.ts";
import { isExplicitInvocation } from "../request/detect-invocation.ts";
import { buildHarnessHeaders, buildHarnessSignals } from "../signals/build-signals.ts";
import { injectHarnessMetadata } from "../signals/inject-metadata.ts";
import { currentSession } from "../session/session-store.ts";
import type { HarnessBuildOptions, HarnessBuildResult, TriggerMode } from "../types/index.ts";

export async function buildHarnessRequest<TRequest extends Record<string, unknown>>(
  request: TRequest,
  options: HarnessBuildOptions
): Promise<HarnessBuildResult<TRequest>> {
  const config = options.config ?? loadHarnessConfig();
  const triggerMode: TriggerMode = options.trigger_mode ?? config.trigger_mode;
  const requestShape = detectRequestShape(request);
  const diagnostics: string[] = [];

  if (!config.enabled) {
    return {
      request,
      headers: {},
      requestShape,
      trigger_mode: triggerMode,
      degraded: true,
      diagnostics: ["harness disabled"]
    };
  }

  if (requestShape === "unknown") {
    return {
      request,
      headers: {},
      requestShape,
      trigger_mode: triggerMode,
      degraded: true,
      diagnostics: ["unsupported request shape"]
    };
  }

  // Manual mode gate: only process requests with explicit invocation markers
  if (triggerMode === "manual" && !isExplicitInvocation(request)) {
    return {
      request,
      headers: {},
      requestShape,
      trigger_mode: triggerMode,
      degraded: true,
      diagnostics: ["manual trigger mode: no explicit invocation detected"]
    };
  }

  const sessionId = currentSession(options.sessionKey ?? "default", config.session.ttl_seconds);
  const signals = buildHarnessSignals(request, sessionId, options.client, config, options.pluginVersion);

  return {
    request: injectHarnessMetadata(request, signals),
    headers: buildHarnessHeaders(signals),
    signals,
    requestShape,
    trigger_mode: triggerMode,
    degraded: false,
    diagnostics
  };
}