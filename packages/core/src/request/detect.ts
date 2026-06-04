import type { SupportedRequestShape } from "../types/index.ts";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function detectRequestShape(request: unknown): SupportedRequestShape {
  if (!isObject(request)) {
    return "unknown";
  }
  if ("input" in request || "previous_response_id" in request || "instructions" in request) {
    return "responses";
  }
  if ("max_tokens" in request && Array.isArray(request.messages)) {
    return "claude";
  }
  if (Array.isArray(request.messages)) {
    return "chat";
  }
  return "unknown";
}

export function extractUserText(request: unknown): string {
  if (!isObject(request)) {
    return "";
  }
  if (typeof request.input === "string") {
    return request.input;
  }
  if (Array.isArray(request.input)) {
    return collectText(request.input).join("\n");
  }
  if (Array.isArray(request.messages)) {
    const userParts = request.messages
      .filter((message) => isObject(message) && message.role === "user")
      .flatMap((message) => collectText(message.content));
    return userParts.at(-1) ?? userParts.join("\n");
  }
  return collectText(request).join("\n");
}

function collectText(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectText);
  }
  if (!isObject(value)) {
    return [];
  }
  const fields = ["text", "content", "input_text", "query", "prompt", "instruction", "task"];
  return fields.flatMap((field) => collectText(value[field]));
}
