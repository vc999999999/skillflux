import assert from "node:assert/strict";
import { test } from "node:test";

import { loadHarnessConfig } from "../../packages/core/src/index.ts";

test("defaults to legal-writer MVP configuration", () => {
  const config = loadHarnessConfig({});

  assert.equal(config.enabled, true);
  assert.equal(config.trigger_mode, "manual");
  assert.equal(config.profile, "legal-writer");
  assert.equal(config.industry, "legal");
  assert.equal(config.enhance_mode, "standard");
  assert.equal(config.session.ttl_seconds, 1800);
  assert.equal(config.checks.max_runtime_ms, 800);
});

test("normalizes legacy default_profile to profile", () => {
  const config = loadHarnessConfig({ default_profile: "legacy-profile" });

  assert.equal(config.profile, "legacy-profile");
});

test("trigger_mode defaults to manual", () => {
  const config = loadHarnessConfig({});
  assert.equal(config.trigger_mode, "manual");
});

test("trigger_mode can be set to auto", () => {
  const config = loadHarnessConfig({ trigger_mode: "auto" });
  assert.equal(config.trigger_mode, "auto");
});

test("trigger_mode can be explicitly set to manual", () => {
  const config = loadHarnessConfig({ trigger_mode: "manual" });
  assert.equal(config.trigger_mode, "manual");
});
