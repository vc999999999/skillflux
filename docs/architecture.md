# Architecture

SkillFlux Plugin is a local harness that sits between host agents and the
SkillFlux gateway.

```text
host agent
  -> host adapter
  -> core request detection
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

## Packages

- `packages/core`: shared request detection, config, session, signals, metadata.
- `packages/cli`: `skillflux-harness` debug and local diagnostics.
- `packages/adapters`: thin host-specific wrappers around core.
- `packages/industries/legal`: public `legal-writer` checks.
