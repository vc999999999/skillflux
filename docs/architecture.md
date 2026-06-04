# Architecture

SkillFlux Plugin is a local harness that sits between host agents and the
SkillFlux gateway.

```text
host agent
  -> host adapter
  -> core request detection
  -> trigger mode gate (manual: only explicit invocations)
  -> legal-writer public checks
  -> headers + metadata.skillflux_harness
  -> SkillFlux gateway
  -> remote harness workflow
  -> upstream model
```

The plugin owns local facts only: client name, profile, session id, request
shape, and public check results. The gateway owns hidden workflow selection,
step routing, hidden prompt injection, logging, billing, and cleanup before the
upstream provider receives the request.

## Trigger Modes

- **`manual`** (default): The harness only processes requests that carry an
  explicit invocation marker — either a slash command (`/legal-writer`,
  `/skillflux`) in the user text, or a `skillflux_explicit_invocation` metadata
  flag set by the adapter. All other requests pass through untouched. This
  prevents the plugin from intercepting every model request automatically.

- **`auto`** (legacy): The harness processes every request that reaches the
  adapter, regardless of invocation markers.

## Packages

- `packages/core`: shared request detection, config, session, signals, metadata, trigger mode.
- `packages/cli`: `skillflux-harness` debug and local diagnostics.
- `packages/industries/legal`: public `legal-writer` checks.
