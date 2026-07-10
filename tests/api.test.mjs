import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../server/dist/app.js";

test("health endpoint reports a healthy API", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/api/v1/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().status, "ok");
  await app.close();
});

test("unknown endpoints return a normalized error", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/missing" });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error, "Not Found");
  await app.close();
});
