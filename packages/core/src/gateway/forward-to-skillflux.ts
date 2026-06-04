import { buildHarnessRequest } from "./build-request.ts";
import type { HarnessBuildOptions } from "../types/index.ts";

export async function forwardToSkillFlux<TRequest extends Record<string, unknown>>(
  request: TRequest,
  options: HarnessBuildOptions & { gatewayBaseUrl?: string; apiKey?: string; path?: string }
): Promise<Response> {
  const built = await buildHarnessRequest(request, options);
  const gatewayBaseUrl = options.gatewayBaseUrl ?? options.config?.gateway_base_url;
  if (!gatewayBaseUrl) {
    throw new Error("gateway base URL is required");
  }

  return fetch(new URL(options.path ?? "/v1/chat/completions", gatewayBaseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
      ...built.headers
    },
    body: JSON.stringify(built.request)
  });
}
