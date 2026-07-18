const MODEL = "@cf/microsoft/resnet-50";
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
  heron: { label: "夜鹭", latin: "Nycticorax nycticorax" },
  dunlin: { label: "黑腹滨鹬", latin: "Calidris alpina" },
  redshank: { label: "红脚鹬", latin: "Tringa totanus" },
  turnstone: { label: "翻石鹬", latin: "Arenaria interpres" }
};

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});

const CLASS_MAPPINGS = [
  { terms: ["spoonbill"], speciesId: "spoonbill", reason: "云端分类器检测到琵鹭类轮廓，请结合黑脸与匙状长嘴人工复核。" },
  { terms: ["american egret", "little blue heron", "egret"], speciesId: "egret", reason: "云端分类器检测到白鹭类轮廓，请结合尖直黑嘴、黑腿与黄趾人工复核。" },
  { terms: ["night heron"], speciesId: "heron", reason: "云端分类器检测到夜鹭类轮廓，请结合红眼、黑冠与灰色背部人工复核。" },
  { terms: ["kingfisher"], speciesId: "kingfisher", reason: "云端分类器检测到翠鸟类轮廓，请结合蓝绿色背部与长直嘴人工复核。" },
  { terms: ["fiddler crab"], speciesId: "fiddler", reason: "云端分类器检测到招潮蟹特征，请结合雄蟹不对称大螯人工复核。" },
  { terms: ["snail"], speciesId: "snail", reason: "云端分类器检测到螺类特征，具体种类仍需结合壳形和栖息环境判断。" },
  { terms: ["red-backed sandpiper"], speciesId: "dunlin", reason: "云端分类器检测到黑腹滨鹬特征，请结合微向下弯的黑嘴与腹部羽色人工复核。" },
  { terms: ["redshank"], speciesId: "redshank", reason: "云端分类器检测到红脚鹬特征，请结合橙红色双腿与基部红色的长嘴人工复核。" },
  { terms: ["ruddy turnstone"], speciesId: "turnstone", reason: "云端分类器检测到翻石鹬特征，请结合短楔形嘴、橙色腿与斑驳背羽人工复核。" }
];

function parseModelResult(output) {
  const predictions = Array.isArray(output) ? output
    .map(item => ({ label: String(item?.label || ""), score: Math.max(0, Math.min(1, Number(item?.score) || 0)) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5) : [];
  const matched = predictions
    .map(prediction => ({ prediction, mapping: CLASS_MAPPINGS.find(entry => entry.terms.some(term => prediction.label.toLowerCase().includes(term))) }))
    .find(entry => entry.mapping && entry.prediction.score >= .12);
  const speciesId = matched?.mapping.speciesId || null;
  const confidence = matched?.prediction.score || 0;
  const reason = matched?.mapping.reason || "云端分类器未发现足够明确的湿地图鉴物种特征，暂时无法可靠确认。";

  return {
    speciesId,
    label: speciesId ? SPECIES[speciesId].label : "无法确认",
    latin: speciesId ? SPECIES[speciesId].latin : "Unknown observation",
    confidence,
    reason,
    predictions
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

  try {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const output = await env.AI.run(MODEL, { image: Array.from(bytes) });
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
