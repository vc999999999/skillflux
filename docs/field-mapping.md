# Field Mapping

## Headers Sent by Plugin

```http
x-sf-session-id: sess_xxx
x-sf-profile: legal-writer
x-sf-client: codex|claude-code
x-sf-plugin-version: skillflux-plugin/0.1.0
x-sf-enhance-mode: standard
x-sf-workflow: legal-writer-harness
x-sf-signals-version: 1
```

`x-sf-signals-version` is retained as a plugin protocol version. The current
gateway code does not read it as a workflow matching signal.
`x-sf-workflow` is the explicit harness workflow hint and maps to
`harness_workflow` on the gateway.

## Metadata Sent by Plugin

The plugin appends `metadata.skillflux_harness` while preserving existing
metadata fields.

```json
{
  "skillflux_harness": {
    "profile": "legal-writer",
    "workflow_hint": "legal-writer-harness",
    "industry_hint": "legal",
    "task_hint": "legal_writing",
    "request_type": "final_answer",
    "artifact_type": "legal_document",
    "local_checks": {
      "content_completeness": {
        "status": "incomplete",
        "score": 0.75,
        "missing": ["legal_basis"],
        "present": ["document_type", "party_names", "claims_or_terms"]
      }
    }
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
  "bindings": [
    { "type": "profile", "value": "legal-writer" },
    { "type": "workflow", "value": "legal-writer-harness" }
  ]
}
```

Useful trigger signals include `harness_profile`, `harness_task_hint`,
`harness_workflow`, `harness_artifact_type`, `harness_completeness_status`,
`harness_completeness_score`, and `harness_signal` paths such as
`local_checks.has_legal_basis` or
`local_checks.content_completeness.missing.#(=="legal_basis")`.

When `profile` and `industry` are configured as `auto`, the local harness uses
lightweight rules to classify the latest user text into one of:

- `legal` -> `legal-writer` / `legal-writer-harness`
- `ecommerce` -> `ecommerce-listing-basic` / `ecommerce-listing-harness`
- `finance` -> `finance-report-review` / `finance-report-harness`
- `medical` -> `medical-safety-review` / `medical-safety-harness`
- `education` -> `education-tutor` / `education-tutor-harness`
- `general` -> `general-assistant` / `general-assistant-harness`
