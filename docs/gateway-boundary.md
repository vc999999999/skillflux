# Gateway Boundary

The local plugin must not include:

- Hidden prompts.
- Full workflow step lists.
- Private scoring rules.
- Remote decision logic.
- Query rewrites designed to replace gateway injection.

The gateway must:

- Authenticate and bill the request.
- Match `workflow_type=harness` workflows.
- Bind `legal-writer` by profile, token, group, or header.
- Advance runtime state.
- Inject hidden step guidance.
- Strip `metadata.skillflux_harness` before upstream forwarding.

If local signals are missing or malformed, the gateway should treat them as
advisory and fall back to ordinary relay behavior.
