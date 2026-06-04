import assert from "node:assert/strict";
import { test } from "node:test";

import { loadHarnessConfig } from "../../packages/core/src/index.ts";

test("defaults to legal-writer MVP configuration", () => {
  const config = loadHarnessConfig({});

  assert.equal(config.enabled, true);
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
