# SkillFlux Plugin

Local multi-agent harness for SkillFlux. By default it is manual-only: ordinary
model requests are passed through unchanged, with no SkillFlux headers,
metadata, local checks, or skill routing. When the user explicitly invokes
SkillFlux, the plugin adds harness signals and forwards them to the SkillFlux
gateway. Workflow selection, hidden prompts, step routing, billing, logging, and
metadata cleanup remain remote gateway responsibilities.

## MVP

- Profile: `legal-writer`
- Industry: `legal`
- Request shapes: OpenAI Chat Completions, OpenAI Responses, Claude Messages
- Local output: headers plus `metadata.skillflux_harness`
- Local checks: public legal document signals only
- Default trigger mode: manual; use `/legal-writer`, `/skillflux`, or an adapter
  invocation marker to run SkillFlux

## Commands

```bash
npm test
node --experimental-strip-types packages/cli/src/bin.ts detect --input examples/openai-chat.request.json
node --experimental-strip-types packages/cli/src/bin.ts debug --input examples/openai-chat.request.json
node --experimental-strip-types packages/cli/src/bin.ts session current
```

## Boundary

The local plugin does not store hidden workflow steps, hidden prompts, scoring
rules, or final remote decision logic. It only sends structured hints such as
`profile`, `industry_hint`, `task_hint`, `artifact_type`, and `local_checks`.
