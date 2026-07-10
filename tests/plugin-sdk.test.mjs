import test from "node:test";
import assert from "node:assert/strict";
import { validatePluginManifest } from "../server/dist/plugins/sdk.js";

test("plugin SDK accepts a compatible, permission-declared manifest", () => {
  const manifest = validatePluginManifest({ apiVersion: "1.0", key: "public-example", name: "Public Example", version: "1.0.0", description: "Test connector", author: "DomainHunter", capabilities: ["connector"], dependencies: {}, permissions: ["network:public"], configuration: {} });
  assert.equal(manifest.key, "public-example");
});

test("plugin SDK rejects incompatible manifests before installation", () => {
  assert.throws(() => validatePluginManifest({ apiVersion: "2.0" }), /Invalid|manifest/i);
});
