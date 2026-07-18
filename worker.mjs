const MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SPECIES = {
  kandelia: { label: "秋茄", latin: "Kandelia obovata" },
  fiddler: { label: "弧边招潮蟹", latin: "Austruca arcuata" },
  spoonbill: { label: "黑脸琵鹭", latin: "Platalea minor" },
  egret: { label: "白鹭", latin: "Egretta garzetta" },
  mudskipper: { label: "弹涂鱼", latin: "Boleophthalmus pectinirostris" },
  avicenna: { label: "白骨壤", latin: "Avicennia marina" },
  kingfisher: { label: "普通翠鸟", latin: "Alcedo atthis" },
  snail: { label: "红树拟蟹守螺", latin: "Cerithidea rhizophorarum" },
  heron: { label: "夜鹭", latin: "Nycticorax nycticorax" }
};

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});

function modelText(output) {
  if (typeof output === "string") return output;
  return output?.description || output?.response || output?.result || "";
}

function parseModelResult(output) {
  const text = modelText(output).trim();
  const match = text.match(/\{[\s\S]*?\}/);
  let parsed = {};
  if (match) {
    try { parsed = JSON.parse(match[0]); }
    catch { parsed = {}; }
  }

  const speciesId = Object.hasOwn(SPECIES, parsed.speciesId) ? parsed.speciesId : null;
  const confidence = speciesId ? Math.max(0, Math.min(1, Number(parsed.confidence) || 0)) : 0;
  const reason = typeof parsed.reason === "string" && parsed.reason.trim()
    ? parsed.reason.trim().slice(0, 180)
    : speciesId ? "云端视觉模型发现了与该物种相符的形态特征，请结合地点人工复核。" : "画面中的物种特征不足，暂时无法可靠确认。";

  return {
    speciesId,
    label: speciesId ? SPECIES[speciesId].label : "无法确认",
    latin: speciesId ? SPECIES[speciesId].latin : "Unknown observation",
    confidence,
    reason
  };
}

async function identify(request, env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin_not_allowed" }, 403);
  const contentLength = Number(request.headers.get("Content-Length")) || 0;
  if (contentLength > MAX_IMAGE_BYTES + 64 * 1024) return json({ error: "image_too_large" }, 413);

  let form;
  try { form = await request.formData(); }
  catch { return json({ error: "invalid_form" }, 400); }
  const image = form.get("image");
  if (!(image instanceof File) || !IMAGE_TYPES.has(image.type)) return json({ error: "invalid_image" }, 400);
  if (!image.size || image.size > MAX_IMAGE_BYTES) return json({ error: "image_too_large" }, 413);
  if (!env.AI) return json({ error: "recognition_unavailable" }, 503);

  const prompt = `你是谨慎的深圳湿地物种识别助手。只分析照片，不根据文件名猜测。
只能从以下 speciesId 中选择一个：
kandelia=秋茄；fiddler=弧边招潮蟹；spoonbill=黑脸琵鹭；egret=白鹭；mudskipper=弹涂鱼；avicenna=白骨壤；kingfisher=普通翠鸟；snail=红树拟蟹守螺；heron=夜鹭；unknown=无法可靠确认。
只有关键形态清楚且与具体物种相符时才能选择物种；普通物品、其他动物、其他鸟类、模糊或遮挡照片必须选择 unknown。不要把所有白色水鸟都判断为黑脸琵鹭。
只返回一行合法 JSON，不要 Markdown：{"speciesId":"unknown","confidence":0.0,"reason":"不超过60字的中文视觉依据"}`;

  try {
    const output = await env.AI.run(MODEL, {
      image: Array.from(new Uint8Array(await image.arrayBuffer())),
      prompt,
      max_tokens: 180
    });
    return json({ result: parseModelResult(output), provider: "cloudflare-workers-ai" });
  } catch (error) {
    console.error("Workers AI recognition failed", error?.message || error);
    return json({ error: "recognition_unavailable" }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/identify") return identify(request, env);
    return env.ASSETS.fetch(request);
  }
};

export { parseModelResult };
