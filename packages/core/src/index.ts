export { loadHarnessConfig, DEFAULT_HARNESS_CONFIG } from "./config/load-config.ts";
export { detectRequestShape, extractUserText } from "./request/detect.ts";
export { currentSession, resetSession } from "./session/session-store.ts";
export { runLegalWriterCheck } from "./checks/run-local-check.ts";
export { buildHarnessSignals, buildHarnessHeaders, PLUGIN_VERSION, SIGNALS_VERSION } from "./signals/build-signals.ts";
export { injectHarnessMetadata } from "./signals/inject-metadata.ts";
export { buildHarnessRequest } from "./gateway/build-request.ts";
export { forwardToSkillFlux } from "./gateway/forward-to-skillflux.ts";
export type {
  HarnessBuildOptions,
  HarnessBuildResult,
  HarnessConfig,
  LegalWriterChecks,
  RawHarnessConfig,
  SkillFluxHarnessMetadata,
  SupportedRequestShape
} from "./types/index.ts";
