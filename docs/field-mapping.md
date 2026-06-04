# Field Mapping

## Headers Sent by Plugin

```http
x-sf-session-id: sess_xxx
x-sf-profile: legal-writer
x-sf-client: codex|claude-code
x-sf-plugin-version: skillflux-plugin/0.1.0
x-sf-enhance-mode: standard
x-sf-signals-version: 1
```

`x-sf-signals-version` is retained as a plugin protocol version. The current
gateway code does not read it as a workflow matching signal.

## Metadata Sent by Plugin

The plugin appends `metadata.skillflux_harness` while preserving existing
metadata fields.

```json
{
  "skillflux_harness": {
    "profile": "legal-writer",
    "industry_hint": "legal",
    "task_hint": "legal_writing",
    "request_type": "final_answer",
    "artifact_type": "legal_document",
    "local_checks": {}
  }
}
```

Gateway `request_type` means API type (`chat`, `claude`, `responses`).
Harness metadata `request_type` maps to gateway `harness_request_type` and
describes the business stage.

## Gateway Matching

Use a harness workflow with:

```json
{
  "workflow_type": "harness",
  "industry": "legal",
  "profile": "legal-writer",
  "bindings": [{ "type": "profile", "value": "legal-writer" }]
}
```

Useful trigger signals include `harness_profile`, `harness_task_hint`,
`harness_artifact_type`, and `harness_signal` paths such as
`local_checks.has_legal_basis`.
