import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildHarnessRequest,
  detectRequestShape,
  loadHarnessConfig,
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
    messages: [{ role: "user", content: "Draft a demand letter for unpaid invoices." }]
  };

  const result = await buildHarnessRequest(request, {
    client: "codex",
    sessionKey: "test-agent",
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
  const first = await buildHarnessRequest({ model: "gpt-4.1", messages: [] }, { client: "cursor", sessionKey: "stable-task", config });
  const second = await buildHarnessRequest({ model: "gpt-4.1", messages: [] }, { client: "cursor", sessionKey: "stable-task", config });

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
    client: "http-proxy",
    sessionKey: "disabled-task",
    config: loadHarnessConfig({ enabled: false })
  });

  assert.deepEqual(result.request, request);
  assert.deepEqual(result.headers, {});
  assert.equal(result.degraded, true);
});
