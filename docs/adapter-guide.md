# Adapter Guide

Each adapter should be thin:

1. Capture the host model request.
2. Call `buildHarnessRequest`.
3. Forward the returned request and headers to SkillFlux.
4. Surface diagnostics only in debug mode.

Adapters should not classify workflow steps or add hidden prompts. Use the
client values below:

- Codex: `codex`
- Claude Code: `claude-code`
- Cursor: `cursor`
- OpenCode: `opencode`
- Generic proxy: `http-proxy`

For unsupported request shapes, keep the original request and forward without
harness metadata.
