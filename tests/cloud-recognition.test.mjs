import test from "node:test";
import assert from "node:assert/strict";
import worker, { parseModelResult } from "../worker.mjs";

test("cloud recognition accepts a known species JSON result", () => {
  assert.deepEqual(parseModelResult([{ label: "spoonbill", score: 0.86 }, { label: "pelican", score: 0.04 }]), {
    speciesId: "spoonbill",
    label: "黑脸琵鹭",
    latin: "Platalea minor",
    confidence: 0.86,
    reason: "云端分类器检测到琵鹭类轮廓，请结合黑脸与匙状长嘴人工复核。",
    predictions: [{ label: "spoonbill", score: 0.86 }, { label: "pelican", score: 0.04 }]
  });
});

test("cloud recognition rejects unknown ids and clamps confidence", () => {
  const result = parseModelResult([{ label: "laptop", score: 8 }]);
  assert.equal(result.speciesId, null);
  assert.equal(result.label, "无法确认");
  assert.equal(result.confidence, 0);
});

test("cloud recognition safely handles malformed model output", () => {
  const result = parseModelResult({ description: "This image is unclear." });
  assert.equal(result.speciesId, null);
  assert.equal(result.confidence, 0);
  assert.match(result.reason, /无法可靠确认/);
});

test("worker sends valid images to Workers AI and returns constrained JSON", async () => {
  const form = new FormData();
  form.append("image", new File([new Uint8Array([255, 216, 255, 217])], "bird.jpg", { type: "image/jpeg" }));
  let receivedInput;
  const response = await worker.fetch(new Request("https://mudflat.test/api/identify", {
    method: "POST",
    headers: { Origin: "https://mudflat.test" },
    body: form
  }), {
    AI: { run: async (model, input) => {
      assert.equal(model, "@cf/microsoft/resnet-50");
      receivedInput = input;
      return [{ label: "American egret, great white heron", score: .91 }];
    }}
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.speciesId, "egret");
  assert.deepEqual(receivedInput.image, [255, 216, 255, 217]);
});

test("worker rejects cross-origin and oversized recognition requests", async () => {
  const crossOrigin = await worker.fetch(new Request("https://mudflat.test/api/identify", {
    method: "POST",
    headers: { Origin: "https://example.com" },
    body: new FormData()
  }), {});
  assert.equal(crossOrigin.status, 403);

  const oversized = await worker.fetch(new Request("https://mudflat.test/api/identify", {
    method: "POST",
    headers: { Origin: "https://mudflat.test", "Content-Length": String(3 * 1024 * 1024) },
    body: new FormData()
  }), {});
  assert.equal(oversized.status, 413);
});

test("worker forwards non-API requests to static assets", async () => {
  const request = new Request("https://mudflat.test/index.html");
  const response = await worker.fetch(request, { ASSETS: { fetch: async value => new Response(new URL(value.url).pathname) } });
  assert.equal(await response.text(), "/index.html");
});
