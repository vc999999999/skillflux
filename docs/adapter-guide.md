# Adapter Guide

Each adapter should be thin:

1. Capture the host model request.
2. Mark the request as explicitly invoked (when triggered by user action).
3. Call `buildHarnessRequest`.
4. Forward the returned request and headers to SkillFlux.
5. Surface diagnostics only in debug mode.

Adapters should not classify workflow steps or add hidden prompts. Use the
client values below:

- Codex: `codex`
- Claude Code: `claude-code`
- Cursor: `cursor`
- OpenCode: `opencode`
- Generic proxy: `http-proxy`

For unsupported request shapes, keep the original request and forward without
harness metadata.

## Trigger Mode

Adapters must respect `trigger_mode` from config:

- **`manual` mode** (default): Adapters should mark requests as explicitly
  invoked when the platform's invocation mechanism provides that signal (slash
  command, platform command). Use `markExplicitInvocation(request, true)` from
  the shared adapter utility before calling `buildHarnessRequest`. Requests
  without this marker will be passed through untouched by the core pipeline.

- **`auto` mode** (legacy): Adapters process all requests through the harness
  pipeline regardless of invocation markers. This mode requires always-on
  interception (e.g., Cursor `entry` field, OpenCode top-level `buildHarnessRequest`
  export).

## Explicit Invocation

The core pipeline detects explicit invocation via `isExplicitInvocation()`,
which checks two sources:

1. **Metadata flag**: `skillflux_explicit_invocation: true` set by
   `markExplicitInvocation()` in the adapter layer.
2. **Slash commands**: `/legal-writer`, `/skillflux`, `/skillflux-plugin`
   appearing in the user's message text.

When writing a new adapter, always call `markExplicitInvocation(request, true)`
when the user explicitly invoked the plugin through the platform's command
mechanism.
