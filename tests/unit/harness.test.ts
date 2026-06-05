import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildHarnessRequest,
  detectRequestShape,
  classifyHarnessIntent,
  isExplicitInvocation,
  loadHarnessConfig,
  markExplicitInvocation,
  resetSession,
  runLegalWriterCheck
} from "../../packages/core/src/index.ts";

test("detects supported model request shapes", () => {
  assert.equal(detectRequestShape({ model: "gpt-4.1", messages: [] }), "chat");
  assert.equal(detectRequestShape({ model: "claude-sonnet-4", max_tokens: 1024, messages: [] }), "claude");
  assert.equal(detectRequestShape({ model: "gpt-4.1", input: "draft this", previous_response_id: "resp_1" }), "responses");
});

test("injects legal-writer headers and preserves existing metadata", async () => {
  resetSession("test-agent");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    metadata: { keep: "visible" },
    messages: [{ role: "user", content: "/legal-writer Draft a demand letter for unpaid invoices." }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "test-agent",
    trigger_mode: "manual",
    config: loadHarnessConfig({})
  });

  assert.equal(result.headers["x-sf-profile"], "legal-writer");
  assert.equal(result.headers["x-sf-client"], "codex");
  assert.equal(result.headers["x-sf-enhance-mode"], "standard");
  assert.equal(result.headers["x-sf-signals-version"], "1");
  assert.match(result.headers["x-sf-session-id"], /^sess_/);
  const metadata = result.request.metadata as Record<string, any>;
  assert.deepEqual(metadata.keep, "visible");
  assert.equal(metadata.skillflux_harness.profile, "legal-writer");
  assert.equal(metadata.skillflux_harness.industry_hint, "legal");
  assert.equal(metadata.skillflux_harness.task_hint, "legal_writing");
  assert.equal(metadata.skillflux_harness.request_type, "final_answer");
  assert.equal(metadata.skillflux_harness.artifact_type, "legal_document");
});

test("reuses a session id for the same agent task", async () => {
  resetSession("stable-task");
  const config = loadHarnessConfig({});
  const first = await buildHarnessRequest({ model: "gpt-4.1", messages: [{ role: "user", content: "/legal-writer test" }] }, { client: "codex", sessionKey: "stable-task", trigger_mode: "manual", config });
  const second = await buildHarnessRequest({ model: "gpt-4.1", messages: [{ role: "user", content: "/legal-writer test" }] }, { client: "codex", sessionKey: "stable-task", trigger_mode: "manual", config });

  assert.equal(second.headers["x-sf-session-id"], first.headers["x-sf-session-id"]);
});

test("legal-writer local check returns public JSON signals only", () => {
  const checks = runLegalWriterCheck("Please draft a complaint against BuildRight LLC under Delaware law.");

  assert.equal(checks.document_type, "complaint");
  assert.equal(checks.has_claims_or_terms, true);
  assert.equal(checks.has_legal_basis, true);
  assert.equal(JSON.stringify(checks).includes("prompt"), false);
  assert.equal(JSON.stringify(checks).includes("workflow"), false);
});

test("legal-writer local check detects invoice demand terms", () => {
  const checks = runLegalWriterCheck("Draft a demand letter to BuildRight LLC for unpaid invoices under Delaware law.");

  assert.equal(checks.document_type, "demand_letter");
  assert.equal(checks.has_party_names, true);
  assert.equal(checks.has_claims_or_terms, true);
  assert.equal(checks.has_legal_basis, true);
});

test("degrades to original request when harness is disabled", async () => {
  resetSession("disabled-task");
  const request: Record<string, unknown> = { model: "gpt-4.1", metadata: { keep: "visible" }, messages: [] };
  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "disabled-task",
    config: loadHarnessConfig({ enabled: false })
  });

  assert.deepEqual(result.request, request);
  assert.deepEqual(result.headers, {});
  assert.equal(result.degraded, true);
});

// --- Manual trigger mode tests ---

test("manual mode: degrades request without explicit invocation", async () => {
  resetSession("manual-no-invocation");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    messages: [{ role: "user", content: "Draft a demand letter for unpaid invoices." }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "manual-no-invocation",
    trigger_mode: "manual",
    config: loadHarnessConfig({})
  });

  assert.deepEqual(result.request, request);
  assert.deepEqual(result.headers, {});
  assert.equal(result.degraded, true);
  assert.equal(result.trigger_mode, "manual");
  assert.ok(result.diagnostics.includes("manual trigger mode: no explicit invocation detected"));
});

test("default config leaves plain requests untouched without skillflux traces", async () => {
  resetSession("default-no-invocation");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    metadata: { keep: "visible" },
    messages: [{ role: "user", content: "Draft a demand letter for unpaid invoices." }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "default-no-invocation",
    config: loadHarnessConfig({})
  });

  assert.deepEqual(result.request, request);
  assert.deepEqual(result.headers, {});
  assert.equal(result.signals, undefined);
  assert.equal(result.degraded, true);
  assert.equal(result.trigger_mode, "manual");
  assert.equal(JSON.stringify(result.request).includes("skillflux"), false);
});

test("manual mode: processes request with /legal-writer slash command", async () => {
  resetSession("manual-with-slash");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    messages: [{ role: "user", content: "/legal-writer draft a demand letter" }]
  };

  const result = await buildHarnessRequest(request, {
    client: "claude-code",
    sessionKey: "manual-with-slash",
    trigger_mode: "manual",
    config: loadHarnessConfig({})
  });

  assert.equal(result.degraded, false);
  assert.equal(result.trigger_mode, "manual");
  assert.equal(result.headers["x-sf-profile"], "legal-writer");
});

test("markExplicitInvocation preserves metadata and enables manual processing", async () => {
  resetSession("manual-with-helper");
  const request = markExplicitInvocation({
    model: "gpt-4.1",
    metadata: { keep: "visible" },
    messages: [{ role: "user", content: "draft a demand letter" }]
  });

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "manual-with-helper",
    config: loadHarnessConfig({})
  });

  assert.equal(result.degraded, false);
  assert.equal(result.headers["x-sf-profile"], "legal-writer");
  const metadata = result.request.metadata as Record<string, any>;
  assert.equal(metadata.keep, "visible");
  assert.equal(metadata.skillflux_explicit_invocation, true);
  assert.equal(metadata.skillflux_harness.profile, "legal-writer");
});

test("manual mode: processes request with skillflux_explicit_invocation flag", async () => {
  resetSession("manual-with-flag");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    skillflux_explicit_invocation: true,
    messages: [{ role: "user", content: "draft a demand letter" }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "manual-with-flag",
    trigger_mode: "manual",
    config: loadHarnessConfig({})
  });

  assert.equal(result.degraded, false);
  assert.equal(result.trigger_mode, "manual");
  assert.equal(result.headers["x-sf-profile"], "legal-writer");
});

test("manual mode: processes request with metadata.skillflux_explicit_invocation flag", async () => {
  resetSession("manual-with-metadata-flag");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    metadata: { skillflux_explicit_invocation: true },
    messages: [{ role: "user", content: "draft a demand letter" }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "manual-with-metadata-flag",
    trigger_mode: "manual",
    config: loadHarnessConfig({})
  });

  assert.equal(result.degraded, false);
  assert.equal(result.trigger_mode, "manual");
});

test("auto mode: processes request without invocation markers (legacy behavior)", async () => {
  resetSession("auto-no-marker");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    messages: [{ role: "user", content: "Draft a demand letter for unpaid invoices." }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "auto-no-marker",
    trigger_mode: "auto",
    config: loadHarnessConfig({})
  });

  assert.equal(result.degraded, false);
  assert.equal(result.trigger_mode, "auto");
  assert.equal(result.headers["x-sf-profile"], "legal-writer");
});

test("auto-routes ecommerce listing tasks to the ecommerce harness workflow", async () => {
  resetSession("auto-ecommerce");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: "Optimize this Amazon listing title and bullet points for a portable blender."
      }
    ]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "auto-ecommerce",
    trigger_mode: "auto",
    config: loadHarnessConfig({ profile: "auto", industry: "auto" })
  });

  assert.equal(result.degraded, false);
  assert.equal(result.headers["x-sf-profile"], "ecommerce-listing-basic");
  assert.equal(result.headers["x-sf-workflow"], "ecommerce-listing-harness");
  assert.equal(result.signals?.industry_hint, "ecommerce");
  assert.equal(result.signals?.task_hint, "listing_optimization");
  assert.equal(result.signals?.artifact_type, "product_listing");
  assert.equal(result.signals?.workflow_hint, "ecommerce-listing-harness");
  assert.equal(result.signals?.local_checks.content_completeness.status, "incomplete");
  assert.ok(result.signals?.local_checks.content_completeness.missing.includes("target_customer"));
});

test("auto-routes finance review tasks to the finance harness workflow", async () => {
  resetSession("auto-finance");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    input: "Review this Q4 revenue forecast and flag missing assumptions, currency, and year-over-year variance."
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "auto-finance",
    trigger_mode: "auto",
    config: loadHarnessConfig({ profile: "auto", industry: "auto" })
  });

  assert.equal(result.degraded, false);
  assert.equal(result.headers["x-sf-profile"], "finance-report-review");
  assert.equal(result.headers["x-sf-workflow"], "finance-report-harness");
  assert.equal(result.signals?.industry_hint, "finance");
  assert.equal(result.signals?.task_hint, "financial_review");
  assert.equal(result.signals?.artifact_type, "financial_report");
});

test("legal-writer signals include workflow hint and content completeness", async () => {
  resetSession("legal-completeness");
  const request: Record<string, unknown> = {
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: "/legal-writer Draft a demand letter to BuildRight LLC for unpaid invoices."
      }
    ]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "legal-completeness",
    trigger_mode: "manual",
    config: loadHarnessConfig({ profile: "auto", industry: "auto" })
  });

  assert.equal(result.degraded, false);
  assert.equal(result.headers["x-sf-profile"], "legal-writer");
  assert.equal(result.headers["x-sf-workflow"], "legal-writer-harness");
  assert.equal(result.signals?.workflow_hint, "legal-writer-harness");
  assert.equal(result.signals?.local_checks.content_completeness.status, "incomplete");
  assert.ok(result.signals?.local_checks.content_completeness.missing.includes("legal_basis"));
});

test("classifyHarnessIntent returns general for unsupported prompts", () => {
  const intent = classifyHarnessIntent("Tell me a bedtime story about stars.", loadHarnessConfig({ profile: "auto", industry: "auto" }));

  assert.equal(intent.industry, "general");
  assert.equal(intent.profile, "general-assistant");
  assert.equal(intent.workflow_hint, "general-assistant-harness");
  assert.equal(intent.task_hint, "general_assistance");
});

// --- isExplicitInvocation detection tests ---

test("isExplicitInvocation detects /legal-writer in user text", () => {
  const request = { messages: [{ role: "user", content: "/legal-writer draft a complaint" }] };
  assert.equal(isExplicitInvocation(request), true);
});

test("isExplicitInvocation detects /skillflux in user text", () => {
  const request = { messages: [{ role: "user", content: "/skillflux check this contract" }] };
  assert.equal(isExplicitInvocation(request), true);
});

test("isExplicitInvocation detects /skillflux-plugin in user text", () => {
  const request = { messages: [{ role: "user", content: "/skillflux-plugin review memo" }] };
  assert.equal(isExplicitInvocation(request), true);
});

test("isExplicitInvocation returns false for plain legal text without slash commands", () => {
  const request = { messages: [{ role: "user", content: "Draft a demand letter for unpaid invoices" }] };
  assert.equal(isExplicitInvocation(request), false);
});

test("isExplicitInvocation detects skillflux_explicit_invocation top-level flag", () => {
  const request = { model: "gpt-4.1", skillflux_explicit_invocation: true, messages: [] };
  assert.equal(isExplicitInvocation(request), true);
});

test("isExplicitInvocation detects skillflux_explicit_invocation in metadata", () => {
  const request = { model: "gpt-4.1", metadata: { skillflux_explicit_invocation: true }, messages: [] };
  assert.equal(isExplicitInvocation(request), true);
});

test("isExplicitInvocation returns false for request without any invocation marker", () => {
  const request = { model: "gpt-4.1", messages: [] };
  assert.equal(isExplicitInvocation(request), false);
});
