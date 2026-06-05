const ADAPTER_INVOCATION_FLAG = "skillflux_explicit_invocation";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function markExplicitInvocation<TRequest extends Record<string, unknown>>(
  request: TRequest,
  invoked = true
): TRequest {
  const mutableRequest = request as Record<string, unknown>;
  if (isObject(mutableRequest["metadata"])) {
    mutableRequest["metadata"][ADAPTER_INVOCATION_FLAG] = invoked;
    return request;
  }

  mutableRequest["metadata"] = {
    [ADAPTER_INVOCATION_FLAG]: invoked
  };
  return request;
}
