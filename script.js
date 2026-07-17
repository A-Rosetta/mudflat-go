const STORAGE_KEY = "mudflat-go-compact-state-v1";
const initialState = { points: 1280, aiIdentified: false, collectedSpecies: [], quizDone: false };
const MOBILE_NET_MODEL_URL = "assets/models/mobilenet/model.json";

const species = [
  { id: "kandelia", name: "秋茄", latin: "Kandelia obovata", rarity: "R", image: "assets/images/kandelia-obovata.jpg", found: true, description: "深圳红树林常见的先锋树种，能够在含盐、缺氧的潮间带扎根生长。", fact: "秋茄的种子会在母树上先萌发，成熟后像一支笔一样落入滩涂。" },
  { id: "fiddler", name: "弧边招潮蟹", latin: "Austruca arcuata", rarity: "SR", image: "assets/images/fiddler-crab.jpg", found: true, description: "生活在潮间带泥滩的招潮蟹，雄蟹拥有一只特别醒目的大螯。", fact: "雄蟹挥动大螯的动作像在呼唤潮水，也用来求偶和守卫洞穴。" },
  { id: "spoonbill", name: "黑脸琵鹭", latin: "Platalea minor", rarity: "SSR", image: "assets/images/black-faced-spoonbill.jpg", found: "capture", description: "全球濒危的珍稀水鸟，因黑色面部和扁平如匙的长嘴而得名。", fact: "深圳湾是它们的重要越冬地，退潮后的浅水区最容易观察。" },
  { id: "egret", name: "白鹭", latin: "Egretta garzetta", rarity: "SR", image: "assets/images/little-egret.jpg", found: false, description: "体态轻盈的湿地鸟类，常在浅水和滩涂边缘缓慢寻找鱼虾。", fact: "观察时请保持距离，不追逐、不投喂，也不要进入觅食区域。" },
  { id: "mudskipper", name: "弹涂鱼", latin: "Boleophthalmus pectinirostris", rarity: "SR", image: "assets/images/mangrove-wetland.jpg", found: false, description: "能在泥滩上活动的两栖型鱼类，是健康潮间带生态系统的重要成员。", fact: "它能利用皮肤和口腔内壁辅助呼吸，因此可短时间离开水面。" },
  { id: "avicenna", name: "白骨壤", latin: "Avicennia marina", rarity: "R", image: "assets/images/shenzhen-mangrove.jpg", found: false, description: "耐盐能力很强的红树植物，根系能帮助稳定海岸并提供栖息空间。", fact: "它的呼吸根会从泥滩中向上伸出，像一支支短小的铅笔。" },
  { id: "kingfisher", name: "普通翠鸟", latin: "Alcedo atthis", rarity: "SR", image: "assets/images/mangrove-wetland.jpg", found: false, description: "常在水边停栖，以快速俯冲的方式捕捉小鱼。", fact: "鲜艳蓝色来自羽毛微观结构对光线的散射，而不是蓝色色素。" },
  { id: "snail", name: "红树拟蟹守螺", latin: "Cerithidea rhizophorarum", rarity: "R", image: "assets/images/kandelia-obovata.jpg", found: false, description: "常见于红树根部和泥滩表面，以藻类和有机碎屑为食。", fact: "退潮后观察红树根部，常能发现它们留下的细小移动痕迹。" },
  { id: "heron", name: "夜鹭", latin: "Nycticorax nycticorax", rarity: "SSR", image: "assets/images/little-egret.jpg", found: false, description: "黄昏和夜间更活跃的鹭科鸟类，白天常停在水边树丛中。", fact: "幼鸟有褐色纵纹，与成年鸟灰黑相间的羽色差别很大。" }
];

const sites = [
  { name: "福田红树林", short: "福田", feature: "黑脸琵鹭越冬栖息地", lat: 22.51187, lng: 114.04258, limited: "黑脸琵鹭限定" },
  { name: "深圳湾公园", short: "深圳湾", feature: "城市滨海候鸟长廊", lat: 22.51897, lng: 113.97260, limited: "候鸟观察路线" },
  { name: "西湾红树林", short: "西湾", feature: "红树林与海上日落", lat: 22.59626, lng: 113.83211, limited: "弹涂鱼限定" },
  { name: "海上田园", short: "田园", feature: "鱼塘红树林生态", lat: 22.72819, lng: 113.76665, limited: "亲子生态研学" },
  { name: "坝光银叶树", short: "坝光", feature: "深圳古老红树群落", lat: 22.65986, lng: 114.54395, limited: "银叶树守护卡" },
  { name: "东涌湿地", short: "东涌", feature: "原始海岸与潮池", lat: 22.49256, lng: 114.59048, limited: "潮池生物限定" }
];

const questions = [
  { text: "黑脸琵鹭怎样在浅水中寻找食物？", options: ["潜入水底追鱼", "左右摆动匙状长嘴扫食", "从树枝俯冲捕食"], correct: 1, note: "匙状长嘴能帮助它在浑水中感知并捕捉鱼虾。" },
  { text: "红树林对深圳海岸的重要作用是什么？", options: ["把海水变成淡水", "固定海岸并提供栖息地", "阻止所有潮水进入"], correct: 1, note: "密集根系能够消浪护岸，也形成丰富的潮间带家园。" },
  { text: "观察候鸟时，哪种做法更合适？", options: ["保持距离并降低音量", "投喂食物吸引鸟群", "靠近巢区拍摄"], correct: 0, note: "远距离、低干扰观察是对野生动物最基本的尊重。" }
];

const badges = [
  ["footprints", "初次启程", "完成首次湿地探索"],
  ["camera", "生态摄影师", "完成首次 AI 识物"],
  ["trees", "红树林守护者", "完成福田全部任务"],
  ["bird", "湾区观鸟人", "发现 5 种湿地鸟类"],
  ["sunset", "西湾追光者", "完成西湾打卡"],
  ["leaf", "田园生态家", "完成海上田园打卡"],
  ["tree-pine", "古树探秘者", "完成坝光打卡"],
  ["mountain", "荒野探险家", "完成东涌打卡"]
];

let state = readState();
let filter = "all";
let quizIndex = 0;
let activeSite = 0;
let toastTimer;
let scanTimers = [];
let cameraStream = null;
let cameraFacingMode = "environment";
let cameraRequestId = 0;
let modelPromise = null;
let recognitionResult = null;
let captureSource = null;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const migrated = { ...initialState, ...saved };
    const hasLegacyCapture = Object.prototype.hasOwnProperty.call(saved, "captured");
    if (saved.captured) {
      migrated.aiIdentified = true;
      migrated.collectedSpecies = [...new Set([...(saved.collectedSpecies || []), "spoonbill"])];
    }
    if (!Array.isArray(migrated.collectedSpecies)) migrated.collectedSpecies = [];
    delete migrated.captured;
    if (hasLegacyCapture) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  catch { return { ...initialState }; }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function siteComplete() { return state.aiIdentified && state.quizDone; }
function found(item) { return item.found === true || state.collectedSpecies.includes(item.id); }
function foundCount() { return species.filter(found).length; }
function taskCount() { return 1 + Number(state.aiIdentified) + Number(state.quizDone); }
function badgeCount() { return 2 + Number(siteComplete()); }
function formatNumber(value) { return new Intl.NumberFormat("zh-CN").format(value); }
function icon(name) { return `<i data-lucide="${name}"></i>`; }
function icons() { if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } }); }

function navigate(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("is-active", view.dataset.view === name));
  document.querySelectorAll("[data-view-target]").forEach(button => button.classList.toggle("is-active", button.dataset.viewTarget === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateUI() {
  const tasks = taskCount();
  const complete = siteComplete();
  document.querySelectorAll("[data-points]").forEach(node => node.textContent = formatNumber(state.points));
  document.querySelectorAll("[data-found]").forEach(node => node.textContent = foundCount());
  document.querySelectorAll("[data-badges]").forEach(node => node.textContent = badgeCount());
  document.getElementById("completedSites").textContent = complete ? "1" : "0";
  document.getElementById("missionCount").textContent = `${tasks} / 3`;
  document.getElementById("missionBar").style.width = `${Math.round(tasks / 3 * 100)}%`;
  document.getElementById("missionTitle").textContent = complete ? "深圳湾公园已解锁" : "解锁红树林守护者";
  document.getElementById("missionHint").textContent = complete ? "福田点位任务全部完成" : state.aiIdentified ? "还需完成湿地知识问答" : state.quizDone ? "还需完成一次 AI 识物" : "还需完成 AI 识物和湿地问答";
  document.getElementById("taskRingValue").textContent = tasks;
  document.getElementById("levelBar").style.width = `${Math.min(100, state.points / 2000 * 100)}%`;
  document.getElementById("pointsNeeded").textContent = Math.max(0, 2000 - state.points);
  renderMap();
  renderAtlas();
  renderTasks();
  renderBadges();
  icons();
}

function renderMap() {
  const unlocked = siteComplete() ? 2 : 1;
  document.querySelectorAll(".map-node").forEach((node, index) => {
    const marker = node.querySelector("span");
    node.classList.toggle("is-locked", index >= unlocked);
    node.classList.toggle("is-complete", index === 0 && siteComplete());
    node.classList.toggle("is-active", index === activeSite);
    marker.innerHTML = index >= unlocked ? icon("lock") : index === 0 && siteComplete() ? icon("check") : String(index + 1).padStart(2, "0");
  });
  document.getElementById("siteStrip").innerHTML = sites.map((site, index) => `<button type="button" data-strip-site="${index}" ${index >= unlocked ? "disabled" : ""}><b>${String(index + 1).padStart(2,"0")} · ${site.name}</b><small>${site.feature}</small></button>`).join("");
  updateMapFocus();
}

function renderAtlas() {
  const visible = species.filter(item => filter === "all" || (filter === "found" ? found(item) : !found(item)));
  document.getElementById("atlasGrid").innerHTML = visible.map(item => {
    const isFound = found(item);
    return `<button class="species-card ${isFound ? "" : "is-locked"}" type="button" data-species="${item.id}">
      <img src="${item.image}" alt="${isFound ? item.name : "待发现物种剪影"}">
      <span class="rarity ${item.rarity.toLowerCase()}">${item.rarity}</span>
      ${isFound ? "" : `<span class="card-lock">${icon("lock")}</span>`}
      <span class="species-card-copy"><h2>${isFound ? item.name : "等待发现"}</h2><em>${isFound ? item.latin : "Field observation required"}</em><p>${isFound ? item.description : "前往对应湿地完成 AI 识别，点亮这张生态卡片。"}</p></span>
    </button>`;
  }).join("");
  document.querySelectorAll("[data-species]").forEach(card => card.addEventListener("click", () => {
    const item = species.find(entry => entry.id === card.dataset.species);
    if (found(item)) openSpecies(item);
    else if (item.id === "spoonbill") openCapture();
    else toast("继续探索对应湿地，完成 AI 识别即可点亮");
  }));
  icons();
}

function renderTasks() {
  const tasks = [
    { icon: "map-pin-check", title: "抵达福田红树林", note: "GPS 定位验证完成", done: true, reward: "+20" },
    { icon: "camera", title: "完成一次 AI 识物", note: "相机或相册识别湿地物种", done: state.aiIdentified, action: "capture", reward: "+40" },
    { icon: "circle-help", title: "湿地知识问答", note: "答对 3 道生态问题", done: state.quizDone, action: "quiz", reward: "+30" }
  ];
  document.getElementById("taskList").innerHTML = tasks.map(task => `<article class="task-item ${task.done ? "is-done" : ""}"><span>${icon(task.done ? "check" : task.icon)}</span><div><b>${task.title}</b><small>${task.note}</small></div>${task.done ? `<em>${task.reward}</em>` : `<button type="button" data-task-action="${task.action}" aria-label="开始${task.title}">${icon("arrow-right")}</button>`}</article>`).join("");
  document.querySelectorAll("[data-task-action]").forEach(button => button.addEventListener("click", () => button.dataset.taskAction === "capture" ? openCapture() : openQuiz()));
  icons();
}

function renderBadges() {
  document.getElementById("badgeGrid").innerHTML = badges.map((badge, index) => `<article class="badge ${index < 2 || (index === 2 && siteComplete()) ? "is-earned" : ""}"><span>${icon(badge[0])}</span><b>${badge[1]}</b><small>${badge[2]}</small></article>`).join("");
  icons();
}

function selectSite(index) {
  activeSite = index;
  renderMap();
  if (index > 0 && !(index === 1 && siteComplete())) toast(`${sites[index].name}尚未解锁，先完成前序点位`);
}

function updateMapFocus() {
  const site = sites[activeSite];
  const canEnter = activeSite === 0 || (activeSite === 1 && siteComplete());
  document.getElementById("activeSiteName").textContent = site.name;
  document.getElementById("mapFocusName").textContent = site.name;
  document.getElementById("mapFocusMeta").textContent = `${site.lat.toFixed(5)}, ${site.lng.toFixed(5)} · ${site.limited}`;
  const enter = document.getElementById("enterSite");
  enter.textContent = canEnter ? `进入${site.name}` : "完成前序任务后解锁";
  enter.disabled = !canEnter;
}

function openCapture() {
  resetCapture();
  document.getElementById("captureView").hidden = false;
  document.body.style.overflow = "hidden";
  startCamera();
}

function closeCapture() {
  scanTimers.forEach(clearTimeout);
  scanTimers = [];
  stopCamera();
  document.getElementById("captureView").hidden = true;
  document.body.style.overflow = "";
}

function resetCapture() {
  scanTimers.forEach(clearTimeout);
  scanTimers = [];
  recognitionResult = null;
  document.getElementById("scanner").classList.remove("is-running");
  document.getElementById("captureResult").hidden = true;
  document.getElementById("cameraStatus").textContent = "浏览器端 AI 生态识别";
  document.getElementById("featureReadout").classList.remove("is-complete");
  document.getElementById("featureReadout").innerHTML = `<span>${icon("scan-search")}</span><p><b>物种特征</b><small>等待实时照片</small></p><em>AI</em>`;
  document.getElementById("collectButton").hidden = true;
  document.getElementById("identifyButton").hidden = false;
  setCaptureReady(false, "等待画面");
  icons();
}

function setCaptureReady(ready, label) {
  const button = document.getElementById("identifyButton");
  button.disabled = !ready;
  button.querySelector("small").textContent = label;
}

function stopCamera() {
  cameraRequestId += 1;
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
  const video = document.getElementById("cameraVideo");
  video.srcObject = null;
}

async function startCamera() {
  const empty = document.getElementById("cameraEmpty");
  const video = document.getElementById("cameraVideo");
  const image = document.getElementById("captureImage");
  const reopen = document.getElementById("reopenCamera");
  if (!navigator.mediaDevices?.getUserMedia) {
    empty.hidden = false;
    empty.querySelector("h2").textContent = "当前浏览器不支持相机";
    empty.querySelector("p").textContent = "请使用相册选择照片，或换用最新版 Chrome、Safari、Edge。";
    reopen.hidden = true;
    return;
  }
  stopCamera();
  const requestId = cameraRequestId;
  empty.hidden = false;
  empty.querySelector("h2").textContent = "正在请求相机权限";
  empty.querySelector("p").textContent = "请选择允许。画面只在当前设备中处理。";
  image.hidden = true;
  video.hidden = true;
  setCaptureReady(false, "等待相机");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: cameraFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    if (requestId !== cameraRequestId) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    cameraStream = stream;
    video.srcObject = cameraStream;
    await video.play();
    captureSource = "camera";
    empty.hidden = true;
    video.hidden = false;
    reopen.hidden = true;
    const devices = await navigator.mediaDevices.enumerateDevices();
    document.getElementById("switchCamera").hidden = devices.filter(device => device.kind === "videoinput").length < 2;
    document.getElementById("cameraStatus").textContent = cameraFacingMode === "environment" ? "后置相机 · 本地 AI" : "前置相机 · 本地 AI";
    document.getElementById("featureReadout").querySelector("small").textContent = "相机就绪，拍照后识别";
    setCaptureReady(true, "拍照并识别");
  } catch (error) {
    if (requestId !== cameraRequestId) return;
    stopCamera();
    empty.hidden = false;
    empty.querySelector("h2").textContent = error.name === "NotAllowedError" ? "没有获得相机权限" : "相机暂时无法打开";
    empty.querySelector("p").textContent = error.name === "NotAllowedError" ? "可在浏览器地址栏重新允许相机，或直接从相册选择照片。" : "请确认摄像头未被其他应用占用，或从相册选择照片。";
    reopen.hidden = false;
    document.getElementById("switchCamera").hidden = true;
    document.getElementById("cameraStatus").textContent = "相机不可用 · 可使用相册";
  }
  icons();
}

async function snapshotCamera() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("captureCanvas");
  const image = document.getElementById("captureImage");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  image.src = canvas.toDataURL("image/jpeg", .92);
  await image.decode();
  image.hidden = false;
  video.hidden = true;
  stopCamera();
  document.getElementById("switchCamera").hidden = true;
  document.getElementById("reopenCamera").hidden = false;
  return image;
}

async function loadRecognitionModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      if (!window.tf || !window.mobilenet) throw new Error("识别组件未加载");
      await tf.ready();
      return mobilenet.load({ version: 2, alpha: .5, modelUrl: MOBILE_NET_MODEL_URL, inputRange: [-1, 1] });
    })().catch(error => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

function resolveWetlandPrediction(predictions) {
  const top = predictions[0];
  if (!top) return null;
  const name = top.className.toLowerCase();
  const mappings = [
    { match: value => value === "spoonbill", threshold: .45, speciesId: "spoonbill", title: "琵鹭类（疑似黑脸琵鹭）", description: "模型确认画面属于琵鹭类。请结合黑色脸部、匙状长嘴和深圳湾观察地点进一步人工确认。" },
    { match: value => value.includes("egret") || value.includes("heron"), threshold: .35, speciesId: "egret", title: "鹭类（接近白鹭）", description: "模型识别到鹭科鸟类特征。请继续观察羽色、腿色和嘴部形态。" },
    { match: value => value === "fiddler crab", threshold: .55, speciesId: "fiddler", title: "招潮蟹", description: "模型识别到招潮蟹特征，雄蟹常有一只特别醒目的大螯。" },
    { match: value => value === "snail", threshold: .55, speciesId: "snail", title: "湿地螺类", description: "模型识别到螺类特征，具体种类仍需结合壳形和栖息环境判断。" }
  ];
  const mapping = mappings.find(item => item.match(name) && top.probability >= item.threshold);
  if (!mapping) return null;
  return { ...mapping, probability: top.probability, rawClass: top.className };
}

const predictionLabels = [
  ["spoonbill", "琵鹭类"], ["egret", "白鹭类"], ["heron", "鹭类"], ["fiddler crab", "招潮蟹"],
  ["snail", "螺类"], ["crab", "蟹类"], ["lakeside", "湖岸场景"], ["seashore", "海岸场景"], ["valley", "山谷场景"]
];

function displayPredictionName(className) {
  const lower = className.toLowerCase();
  const label = predictionLabels.find(([key]) => lower.includes(key));
  return label ? label[1] : className.split(",")[0];
}

async function identify() {
  const button = document.getElementById("identifyButton");
  if (button.disabled) return;
  button.hidden = true;
  document.getElementById("captureResult").hidden = true;
  document.getElementById("scanner").classList.add("is-running");
  const readout = document.getElementById("featureReadout");
  readout.classList.remove("is-complete");
  readout.querySelector("small").textContent = "正在加载模型并分析画面";
  document.getElementById("cameraStatus").textContent = "本地 AI 分析中";
  try {
    let input = document.getElementById("captureImage");
    if (captureSource === "camera") input = await snapshotCamera();
    if (input.hidden || !input.naturalWidth) throw new Error("没有可识别的照片");
    const model = await loadRecognitionModel();
    const predictions = await model.classify(input, 5);
    recognitionResult = resolveWetlandPrediction(predictions);
    showRecognitionResult(predictions, recognitionResult);
    readout.classList.toggle("is-complete", Boolean(recognitionResult));
    readout.innerHTML = recognitionResult
      ? `<span>${icon("check")}</span><p><b>物种特征</b><small>${recognitionResult.title} · ${(recognitionResult.probability * 100).toFixed(1)}%</small></p><em>AI</em>`
      : `<span>${icon("circle-alert")}</span><p><b>物种特征</b><small>当前模型无法可靠确认</small></p><em>AI</em>`;
  } catch (error) {
    recognitionResult = null;
    showRecognitionError(error.message || "模型加载失败，请稍后重试");
    readout.innerHTML = `<span>${icon("triangle-alert")}</span><p><b>物种特征</b><small>识别失败，请重试</small></p><em>AI</em>`;
  } finally {
    document.getElementById("scanner").classList.remove("is-running");
    document.getElementById("cameraStatus").textContent = "识别完成 · 结果仅供辅助观察";
    icons();
  }
}

function showRecognitionResult(predictions, result) {
  document.getElementById("toast").classList.remove("is-visible");
  const panel = document.getElementById("captureResult");
  const collectButton = document.getElementById("collectButton");
  document.getElementById("predictionList").innerHTML = predictions.slice(0, 3).map(item => `<li><span>${displayPredictionName(item.className)}</span><b>${(item.probability * 100).toFixed(1)}%</b></li>`).join("");
  if (result) {
    const item = species.find(entry => entry.id === result.speciesId);
    const alreadyFound = found(item);
    document.getElementById("resultRarity").className = `rarity ${item.rarity.toLowerCase()}`;
    document.getElementById("resultRarity").textContent = `${item.rarity} · 模型支持类别`;
    document.getElementById("resultConfidence").textContent = `${(result.probability * 100).toFixed(1)}% 匹配`;
    document.getElementById("resultLatin").textContent = item.latin;
    document.getElementById("captureTitle").textContent = result.title;
    document.getElementById("resultDescription").textContent = result.description;
    collectButton.hidden = false;
    collectButton.disabled = alreadyFound && state.aiIdentified;
    collectButton.innerHTML = alreadyFound && state.aiIdentified ? `${icon("check")} 已记录` : `${icon("sparkles")} ${alreadyFound ? "确认识别" : "收入图鉴"} · +40`;
  } else {
    document.getElementById("resultRarity").className = "rarity";
    document.getElementById("resultRarity").textContent = "未确认";
    document.getElementById("resultConfidence").textContent = "未达到湿地类别阈值";
    document.getElementById("resultLatin").textContent = "General model result";
    document.getElementById("captureTitle").textContent = "暂时无法确认物种";
    document.getElementById("resultDescription").textContent = "请靠近目标、保持画面清晰后重试。当前通用模型不支持秋茄等具体红树植物，未确认结果不会收入图鉴。";
    collectButton.hidden = true;
  }
  panel.hidden = false;
}

function showRecognitionError(message) {
  document.getElementById("toast").classList.remove("is-visible");
  document.getElementById("resultRarity").className = "rarity";
  document.getElementById("resultRarity").textContent = "模型不可用";
  document.getElementById("resultConfidence").textContent = "未产生识别结果";
  document.getElementById("resultLatin").textContent = "Local inference error";
  document.getElementById("captureTitle").textContent = "识别没有完成";
  document.getElementById("resultDescription").textContent = message;
  document.getElementById("predictionList").innerHTML = "";
  document.getElementById("collectButton").hidden = true;
  document.getElementById("captureResult").hidden = false;
}

function collect() {
  if (!recognitionResult) return;
  const item = species.find(entry => entry.id === recognitionResult.speciesId);
  const firstTask = !state.aiIdentified;
  state.aiIdentified = true;
  state.collectedSpecies = [...new Set([...state.collectedSpecies, item.id])];
  if (firstTask) state.points += 40;
  saveState();
  updateUI();
  toast(`${item.name}已记录${firstTask ? " · 守护值 +40" : ""}`);
  closeCapture();
}

function openQuiz() {
  if (state.quizDone) { toast("今日湿地问答已经完成"); return; }
  quizIndex = 0;
  renderQuiz();
  document.getElementById("quizModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeQuiz() { document.getElementById("quizModal").hidden = true; document.body.style.overflow = ""; }

function renderQuiz() {
  const item = questions[quizIndex];
  document.getElementById("quizStep").textContent = `湿地问答 · ${quizIndex + 1} / ${questions.length}`;
  document.getElementById("quizQuestion").textContent = item.text;
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("quizOptions").innerHTML = item.options.map((option, index) => `<button type="button" data-answer="${index}">${option}</button>`).join("");
  document.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answer), button)));
}

function answerQuiz(answer, button) {
  const item = questions[quizIndex];
  if (answer !== item.correct) { button.classList.add("is-wrong"); document.getElementById("quizFeedback").textContent = "再想一想：留意物种特征和无干扰观察原则。"; return; }
  button.classList.add("is-correct");
  document.querySelectorAll("[data-answer]").forEach(option => option.disabled = true);
  document.getElementById("quizFeedback").textContent = item.note;
  setTimeout(() => {
    if (quizIndex < questions.length - 1) { quizIndex += 1; renderQuiz(); return; }
    state.quizDone = true;
    state.points += 30;
    saveState();
    updateUI();
    closeQuiz();
    toast("问答完成 · 深圳湾公园已解锁 · 守护值 +30");
  }, 700);
}

function openSpecies(item) {
  document.getElementById("speciesImage").src = item.image;
  document.getElementById("speciesImage").alt = item.name;
  document.getElementById("speciesRarity").className = `rarity ${item.rarity.toLowerCase()}`;
  document.getElementById("speciesRarity").textContent = item.rarity;
  document.getElementById("speciesLatin").textContent = item.latin;
  document.getElementById("speciesName").textContent = item.name;
  document.getElementById("speciesDescription").textContent = item.description;
  document.getElementById("speciesFact").textContent = item.fact;
  document.getElementById("speciesModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSpecies() { document.getElementById("speciesModal").hidden = true; document.body.style.overflow = ""; }

function toast(message) {
  const element = document.getElementById("toast");
  element.querySelector("span").textContent = message;
  element.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("is-visible"), 2800);
}

document.querySelectorAll("[data-view-target]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.viewTarget)));
document.querySelectorAll("[data-open-capture]").forEach(button => button.addEventListener("click", openCapture));
document.querySelectorAll(".map-node").forEach(node => node.addEventListener("click", () => selectSite(Number(node.dataset.site))));
document.getElementById("siteStrip").addEventListener("click", event => { const button = event.target.closest("[data-strip-site]"); if (button) selectSite(Number(button.dataset.stripSite)); });
document.getElementById("enterSite").addEventListener("click", () => activeSite === 0 ? openCapture() : toast(`${sites[activeSite].name}已解锁，正式版将接入线下导航`));
document.getElementById("mapAction").addEventListener("click", () => {
  const site = sites[activeSite];
  const url = `https://uri.amap.com/marker?position=${site.lng},${site.lat}&name=${encodeURIComponent(site.name)}&coordinate=gaode&callnative=0`;
  window.open(url, "_blank", "noopener");
});
document.getElementById("closeCapture").addEventListener("click", closeCapture);
document.getElementById("startCamera").addEventListener("click", startCamera);
document.getElementById("reopenCamera").addEventListener("click", startCamera);
document.getElementById("switchCamera").addEventListener("click", async () => {
  cameraFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
  await startCamera();
});
document.getElementById("identifyButton").addEventListener("click", identify);
document.getElementById("collectButton").addEventListener("click", collect);
document.getElementById("retryCapture").addEventListener("click", () => {
  recognitionResult = null;
  document.getElementById("captureResult").hidden = true;
  if (captureSource === "camera") startCamera();
  else setCaptureReady(true, "重新识别");
});
document.getElementById("closeQuiz").addEventListener("click", closeQuiz);
document.getElementById("closeSpecies").addEventListener("click", closeSpecies);
document.getElementById("photoInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  stopCamera();
  captureSource = "image";
  recognitionResult = null;
  const image = document.getElementById("captureImage");
  if (image.dataset.localUrl) URL.revokeObjectURL(image.dataset.localUrl);
  image.dataset.localUrl = URL.createObjectURL(file);
  const activateImage = () => {
    image.hidden = false;
    document.getElementById("cameraVideo").hidden = true;
    document.getElementById("cameraEmpty").hidden = true;
    document.getElementById("switchCamera").hidden = true;
    document.getElementById("reopenCamera").hidden = false;
    document.getElementById("captureResult").hidden = true;
    document.getElementById("cameraStatus").textContent = "相册照片 · 本地 AI";
    document.getElementById("featureReadout").querySelector("small").textContent = "照片就绪，可以开始识别";
    setCaptureReady(true, "识别这张照片");
    toast("照片只在当前浏览器本地处理，不会上传");
  };
  image.onload = activateImage;
  image.onerror = () => toast("无法读取这张照片，请换一张图片");
  image.src = image.dataset.localUrl;
  image.decode().then(activateImage).catch(() => {});
});
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(item => item.classList.toggle("is-active", item === button));
  renderAtlas();
}));
document.getElementById("posterButton").addEventListener("click", () => toast("成就海报入口已准备，正式版将接入微信分享"));
document.getElementById("creditsButton").addEventListener("click", () => window.open("CREDITS.md", "_blank", "noopener"));
document.getElementById("resetButton").addEventListener("click", () => { state = { ...initialState, collectedSpecies: [] }; localStorage.removeItem(STORAGE_KEY); updateUI(); toast("演示进度已重置"); });
document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.id === "quizModal" ? closeQuiz() : closeSpecies(); }));
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCapture(); closeQuiz(); closeSpecies(); } });
window.addEventListener("pagehide", stopCamera);

updateUI();
icons();
