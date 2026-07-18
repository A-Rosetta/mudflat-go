import test from "node:test";
import assert from "node:assert/strict";
import worker, { imageDataUri, parseModelResult } from "../worker.mjs";

test("cloud recognition accepts a known species JSON result", () => {
  assert.deepEqual(parseModelResult({ answer: '{"speciesId":"spoonbill","confidence":0.86,"reason":"黑脸和匙状长嘴清晰"}' }), {
    speciesId: "spoonbill",
    label: "黑脸琵鹭",
    latin: "Platalea minor",
    confidence: 0.86,
    reason: "黑脸和匙状长嘴清晰"
  });
});

test("cloud recognition rejects unknown ids and clamps confidence", () => {
  const result = parseModelResult({ description: '```json\n{"speciesId":"laptop","confidence":8,"reason":"普通物品"}\n```' });
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

test("worker encodes uploaded bytes as a model data URI", () => {
  assert.equal(imageDataUri({ type: "image/jpeg" }, new Uint8Array([255, 216, 255, 217])), "data:image/jpeg;base64,/9j/2Q==");
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
      assert.equal(model, "@cf/mistralai/mistral-small-3.1-24b-instruct");
      receivedInput = input;
      return { answer: '{"speciesId":"egret","confidence":0.91,"reason":"白色鹭鸟与黑腿清晰"}' };
    }}
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.speciesId, "egret");
  assert.equal(receivedInput.messages[0].content[1].image_url.url, "data:image/jpeg;base64,/9j/2Q==");
  assert.match(receivedInput.messages[0].content[0].text, /unknown=无法可靠确认/);
  assert.match(receivedInput.messages[0].content[0].text, /尖嘴白鸟绝不能选 spoonbill/);
  assert.deepEqual(receivedInput.guided_json.required, ["speciesId", "confidence", "reason"]);
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
