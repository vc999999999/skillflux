import { extractUserText } from "./detect.ts";

const INVOCATION_PATTERNS = [
  /\/legal-writer\b/i,
  /\/skillflux\b/i,
  /\/skillflux-plugin\b/i,
];

const ADAPTER_INVOCATION_FLAG = "skillflux_explicit_invocation";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Detect whether a request carries an explicit invocation marker.
 *
 * Two detection methods:
 * 1. Metadata flag: adapters set `skillflux_explicit_invocation: true` when
 *    the user invoked the plugin through a slash command or platform command.
 * 2. Slash command in user text: the user literally typed `/legal-writer`
 *    (or `/skillflux`, `/skillflux-plugin`) in their message.
 */
export function isExplicitInvocation(request: unknown): boolean {
  // Method 1: Check for invocation metadata flag set by adapters
  if (isObject(request)) {
    if (request[ADAPTER_INVOCATION_FLAG] === true) {
      return true;
    }
    const metadata = request.metadata;
    if (isObject(metadata) && metadata[ADAPTER_INVOCATION_FLAG] === true) {
      return true;
    }
  }

  // Method 2: Check user text for slash command patterns
  const userText = extractUserText(request);
  return INVOCATION_PATTERNS.some(pattern => pattern.test(userText));
}