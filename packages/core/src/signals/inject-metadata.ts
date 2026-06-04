import type { SkillFluxHarnessMetadata } from "../types/index.ts";

export function injectHarnessMetadata<TRequest>(request: TRequest, signals: SkillFluxHarnessMetadata): TRequest {
  if (!isObject(request)) {
    return request;
  }
  const cloned = structuredClone(request) as Record<string, unknown>;
  const metadata = isObject(cloned.metadata) ? { ...cloned.metadata } : {};
  metadata.skillflux_harness = signals;
  cloned.metadata = metadata;
  return cloned as TRequest;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
