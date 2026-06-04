const ADAPTER_INVOCATION_FLAG = "skillflux_explicit_invocation";

/**
 * Mark a request as explicitly invoked by the user.
 *
 * When the user triggers the plugin through a slash command or platform
 * command mechanism, the adapter calls this function to flag the request.
 * The core pipeline uses `isExplicitInvocation()` to detect this flag
 * and skip the manual-mode gate.
 *
 * The original request is deep-cloned to avoid mutating shared objects.
 */
export function markExplicitInvocation<TRequest extends Record<string, unknown>>(
  request: TRequest,
  isExplicit: boolean
): TRequest {
  if (!isExplicit) return request;
  const cloned = structuredClone(request) as Record<string, unknown>;
  cloned[ADAPTER_INVOCATION_FLAG] = true;
  return cloned as TRequest;
}