const STORAGE_KEY = "mudflat-go-compact-state-v1";
const todayKey = () => new Date().toLocaleDateString("en-CA");
const emptySiteProgress = () => Array.from({ length: 6 }, () => ({ targetsViewed: false, gps: false, identified: false, complete: false }));
const initialState = {
  points: 300000,
  unlockedThrough: 1,
  siteProgress: emptySiteProgress(),
  collectedSpecies: [],
  cardProgress: {},
  daily: { date: todayKey(), supplyClaimed: false, viewedCard: false, identified: false },
  supply: { lastClaimDate: "", streak: 0, frameFragments: 0 },
  alarm: { enabled: false, time: "07:00", speciesId: "", lastTriggeredDate: "" },
  blindBoxCollection: {},
  blindBoxFragments: 0,
  blindBoxPity: {},
  blindBoxGuarantee: {}
};
const MOBILE_NET_MODEL_URL = "assets/models/mobilenet/model.json";
const BLIND_BOX_COSTS = { 1: 500, 10: 4000 };
const BIRD_MODEL_URL = "assets/models/bird-species/model.onnx";
const BIRD_CONFIG_URL = "assets/models/bird-species/config.json";
const BIRD_IMAGE_SIZE = 260;
const BIRD_MEAN = [.485, .456, .406];
const BIRD_STD = [.47853944, .4732864, .47434163];

const species = [
  { id: "kandelia", name: "秋茄", latin: "Kandelia obovata", rarity: "R", category: "plant", season: "全年", image: "assets/images/kandelia-obovata.jpg", found: true, description: "深圳红树林常见的先锋树种，能够在含盐、缺氧的潮间带扎根生长。", fact: "秋茄的种子会在母树上先萌发，成熟后像一支笔一样落入滩涂。" },
  { id: "fiddler", name: "弧边招潮蟹", latin: "Austruca arcuata", rarity: "SR", category: "benthic", season: "4-10月", image: "assets/images/fiddler-crab.jpg", found: true, description: "生活在潮间带泥滩的招潮蟹，雄蟹拥有一只特别醒目的大螯。", fact: "雄蟹挥动大螯的动作像在呼唤潮水，也用来求偶和守卫洞穴。" },
  { id: "spoonbill", name: "黑脸琵鹭", latin: "Platalea minor", rarity: "SSR", category: "bird", season: "11-3月", image: "assets/images/black-faced-spoonbill.jpg", found: "capture", description: "全球濒危的珍稀水鸟，因黑色面部和扁平如匙的长嘴而得名。", fact: "深圳湾是它们的重要越冬地，退潮后的浅水区最容易观察。" },
  { id: "egret", name: "白鹭", latin: "Egretta garzetta", rarity: "SR", category: "bird", season: "全年", image: "assets/images/little-egret.jpg", found: false, description: "体态轻盈的湿地鸟类，常在浅水和滩涂边缘缓慢寻找鱼虾。", fact: "观察时请保持距离，不追逐、不投喂，也不要进入觅食区域。" },
  { id: "mudskipper", name: "弹涂鱼", latin: "Boleophthalmus pectinirostris", rarity: "SR", category: "benthic", season: "4-10月", image: "assets/images/mudskipper.jpg", found: false, description: "能在泥滩上活动的两栖型鱼类，是健康潮间带生态系统的重要成员。", fact: "它能利用皮肤和口腔内壁辅助呼吸，因此可短时间离开水面。" },
  { id: "avicenna", name: "白骨壤", latin: "Avicennia marina", rarity: "R", category: "plant", season: "全年", image: "assets/images/avicenna-marina.jpg", found: false, description: "耐盐能力很强的红树植物，根系能帮助稳定海岸并提供栖息空间。", fact: "它的呼吸根会从泥滩中向上伸出，像一支支短小的铅笔。" },
  { id: "kingfisher", name: "普通翠鸟", latin: "Alcedo atthis", rarity: "SR", category: "bird", season: "全年", image: "assets/images/common-kingfisher.jpg", found: false, description: "常在水边停栖，以快速俯冲的方式捕捉小鱼。", fact: "鲜艳蓝色来自羽毛微观结构对光线的散射，而不是蓝色色素。" },
  { id: "snail", name: "红树拟蟹守螺", latin: "Cerithidea rhizophorarum", rarity: "R", category: "benthic", season: "全年", image: "assets/images/mangrove-snail.jpg", found: false, description: "常见于红树根部和泥滩表面，以藻类和有机碎屑为食。", fact: "退潮后观察红树根部，常能发现它们留下的细小移动痕迹。" },
  { id: "heron", name: "夜鹭", latin: "Nycticorax nycticorax", rarity: "SSR", category: "bird", season: "全年", image: "assets/images/night-heron.jpg", found: false, description: "黄昏和夜间更活跃的鹭科鸟类，白天常停在水边树丛中。", fact: "幼鸟有褐色纵纹，与成年鸟灰黑相间的羽色差别很大。" }
];

const birdSounds = {
  spoonbill: "assets/audio/birds/black-faced-spoonbill.mp3",
  egret: "assets/audio/birds/little-egret.mp3",
  kingfisher: "assets/audio/birds/common-kingfisher.mp3",
  heron: "assets/audio/birds/night-heron.mp3"
};

const blindBoxPool = [
  { id: "spoonbill", name: "琵小鹭", species: "黑脸琵鹭", rarity: "SSR", weight: 0.99, fragments: 60, image: "assets/images/blind-box/03-spoonbill-ssr.webp" },
  { id: "kingfisher", name: "翠小翠", species: "普通翠鸟", rarity: "SR", weight: 1.72, fragments: 35, image: "assets/images/blind-box/04-kingfisher-sr.webp" },
  { id: "avocet", name: "鹬小镜", species: "反嘴鹬", rarity: "SR", weight: 2.28, fragments: 35, image: "assets/images/blind-box/05-avocet-sr.webp" },
  { id: "mudskipper", name: "跳跳鱼", species: "弹涂鱼", rarity: "R", weight: 7.78, fragments: 20, image: "assets/images/blind-box/06-mudskipper-r.webp" },
  { id: "greenshank", name: "鹬小青", species: "青脚鹬", rarity: "R", weight: 6.67, fragments: 20, image: "assets/images/blind-box/07-greenshank-r.webp" },
  { id: "stilt", name: "鹬长腿", species: "黑翅长脚鹬", rarity: "R", weight: 5.55, fragments: 20, image: "assets/images/blind-box/08-stilt-r.webp" },
  { id: "fiddler", name: "蟹大钳", species: "弧边招潮蟹", rarity: "N", weight: 25.35, fragments: 10, image: "assets/images/blind-box/09-fiddler-crab-n.webp" },
  { id: "egret", name: "鹭小白", species: "白鹭", rarity: "N", weight: 21.13, fragments: 10, image: "assets/images/blind-box/10-egret-n.webp" },
  { id: "stint", name: "鹬小圆", species: "红颈滨鹬", rarity: "N", weight: 15.85, fragments: 10, image: "assets/images/blind-box/11-red-necked-stint-n.webp" },
  { id: "pond-heron", name: "鹭小红", species: "池鹭", rarity: "N", weight: 12.67, fragments: 10, image: "assets/images/blind-box/12-pond-heron-n.webp" },
  { id: "golden-spoonbill", name: "金琵小鹭", species: "黑脸琵鹭金色变体", rarity: "CHASE", weight: 0.01, fragments: 100, image: "assets/images/blind-box/13-golden-spoonbill-chase.webp" }
];

const blindBoxPools = [
  { id: "standard-atlas", title: "潮间万象", subtitle: "深圳湿地物种典藏 · 不限时开放", upIds: [], carryOver: false, copy: "潮来潮往，滩涂上的每一次相遇，都值得被记住。", items: blindBoxPool, accent: "#dff47b", heroBadge: "常驻典藏", heroSpecies: "全系列收录 · 不限时开放" },
  { id: "tide-watch", title: "潮有信", subtitle: "黑脸琵鹭、普通翠鸟获取概率提升", upIds: ["spoonbill", "kingfisher"], carryOver: true, copy: "白羽循潮而至，翠影掠水而行。", accent: "#8de5d1", heroBadge: "本期主推 · 黑脸琵鹭", heroSpecies: "黑脸琵鹭 · 普通翠鸟", items: blindBoxPool },
  { id: "mangrove-echo", title: "暮栖红林", subtitle: "池鹭、白鹭、金色琵鹭获取概率提升", upIds: ["pond-heron", "egret", "golden-spoonbill"], carryOver: true, copy: "潮声入林，白羽与暮色一同栖下。", accent: "#f2b56b", heroBadge: "本期主推 · 金色琵鹭", heroSpecies: "池鹭 · 白鹭 · 金色琵鹭", items: blindBoxPool }
];
let activeBlindBoxPool = "standard-atlas";
let blindBoxRevealIndex = 0;
let blindBoxCabinetPage = 0;
const BLIND_BOX_CABINET_PAGE_SIZE = 6;
const getBlindBoxPool = () => blindBoxPools.find(pool => pool.id === activeBlindBoxPool) || blindBoxPools[0];
const BLIND_BOX_CARRY_KEY = "shared-up";
const getBlindBoxStateKey = pool => pool.carryOver ? BLIND_BOX_CARRY_KEY : pool.id;

const sites = [
  { name: "福田红树林", short: "福田", feature: "黑脸琵鹭越冬栖息地", lat: 22.51187, lng: 114.04258, limited: "黑脸琵鹭限定", habitat: "潮间带 · 红树林", season: "候鸟季 11-3月", description: "从红树与浅水交界开始，辨认匙状长嘴、白色涉禽和泥滩上的微小生命。", targets: ["spoonbill", "egret", "kandelia", "fiddler", "snail"] },
  { name: "深圳湾公园", short: "深圳湾", feature: "城市滨海候鸟长廊", lat: 22.51897, lng: 113.97260, limited: "候鸟观察路线", habitat: "滨海浅水 · 草坡", season: "全年可观察", description: "沿城市海岸寻找停栖与觅食的水鸟，用距离和耐心换取更自然的观察。", targets: ["egret", "spoonbill", "heron", "kingfisher"] },
  { name: "西湾红树林", short: "西湾", feature: "红树林与海上日落", lat: 22.59626, lng: 113.83211, limited: "弹涂鱼限定", habitat: "泥滩 · 红树边缘", season: "退潮前后", description: "退潮后的开阔泥滩会留下洞穴和爬痕，适合观察弹涂鱼与底栖生物。", targets: ["mudskipper", "fiddler", "snail", "kandelia"] },
  { name: "海上田园", short: "田园", feature: "鱼塘红树林生态", lat: 22.72819, lng: 113.76665, limited: "亲子生态研学", habitat: "鱼塘 · 芦苇 · 红树", season: "全年可观察", description: "鱼塘、芦苇和红树林形成多层栖息地，留意水边静候的小型鸟类。", targets: ["kingfisher", "egret", "heron", "kandelia", "fiddler"] },
  { name: "坝光银叶树", short: "坝光", feature: "深圳古老红树群落", lat: 22.65986, lng: 114.54395, limited: "古树守护卡", habitat: "古红树群落", season: "全年可观察", description: "在成熟红树群落里观察叶片、呼吸根和潮水留下的生态分层。", targets: ["avicenna", "kandelia", "snail", "kingfisher"] },
  { name: "东涌湿地", short: "东涌", feature: "原始海岸与潮池", lat: 22.49256, lng: 114.59048, limited: "潮池生物限定", habitat: "河口 · 潮池 · 海岸", season: "低潮时段", description: "从河口走向潮池，寻找咸淡水交汇处的鸟类、螺类与两栖泥滩生物。", targets: ["mudskipper", "snail", "egret", "kingfisher", "avicenna"] }
];

const badges = [
  ["footprints", "初次启程", "完成首次湿地探索"],
  ["camera", "生态摄影师", "完成首次物种识别"],
  ["trees", "红树林守护者", "完成福田全部任务"],
  ["bird", "湾区观鸟人", "发现 5 种湿地鸟类"],
  ["sunset", "西湾追光者", "完成西湾打卡"],
  ["leaf", "田园生态家", "完成海上田园打卡"],
  ["tree-pine", "古树探秘者", "完成坝光打卡"],
  ["mountain", "荒野探险家", "完成东涌打卡"]
];

let state = readState();
let filter = "all";
let categoryFilter = "all";
let rarityFilter = "all";
let taskMode = "daily";
let activeSite = 0;
let toastTimer;
let alarmTimer;
let alarmStopTimer;
let scanTimers = [];
let cameraStream = null;
let cameraFacingMode = "environment";
let cameraRequestId = 0;
let modelPromise = null;
let birdModelPromise = null;
let recognitionResult = null;
let captureSource = null;
let interactiveMap = null;
let interactiveMapLayers = null;
let blindBoxDrawing = false;
let showroomInitialized = false;
let recognitionRuntimePromise = null;
let interactiveMapPromise = null;
let gameRuntimePromise = null;
let panoramaObserver = null;
let locationResult = null;
let lastUnlockedItem = null;
let shareObjectUrl = "";
let shareBlob = null;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const migrated = { ...initialState, ...saved };
    const hasLegacyCapture = Object.prototype.hasOwnProperty.call(saved, "captured");
    if (saved.captured || saved.aiIdentified) {
      migrated.siteProgress = emptySiteProgress();
      migrated.siteProgress[0].identified = true;
      migrated.collectedSpecies = [...new Set([...(saved.collectedSpecies || []), ...(saved.captured ? ["spoonbill"] : [])])];
    }
    if (!Array.isArray(migrated.siteProgress) || migrated.siteProgress.length !== sites.length) migrated.siteProgress = emptySiteProgress();
    migrated.siteProgress = migrated.siteProgress.map(item => ({ targetsViewed: false, gps: false, identified: false, complete: false, ...item }));
    if (!Array.isArray(migrated.collectedSpecies)) migrated.collectedSpecies = [];
    if (!migrated.blindBoxCollection || typeof migrated.blindBoxCollection !== "object" || Array.isArray(migrated.blindBoxCollection)) migrated.blindBoxCollection = {};
    if (!Number.isFinite(migrated.blindBoxFragments)) migrated.blindBoxFragments = 0;
    migrated.blindBoxPity = { ...(migrated.blindBoxPity || {}) };
    migrated.blindBoxGuarantee = { ...(migrated.blindBoxGuarantee || {}) };
    if (!migrated.cardProgress || typeof migrated.cardProgress !== "object") migrated.cardProgress = {};
    if (!migrated.daily || migrated.daily.date !== todayKey()) migrated.daily = { date: todayKey(), supplyClaimed: false, viewedCard: false, identified: false };
    migrated.supply = { ...initialState.supply, ...(migrated.supply || {}) };
    migrated.alarm = { ...initialState.alarm, ...(migrated.alarm || {}) };
    migrated.unlockedThrough = Math.max(1, Math.min(sites.length - 1, Number(migrated.unlockedThrough) || 1));
    delete migrated.aiIdentified;
    delete migrated.quizDone;
    delete migrated.captured;
    if (hasLegacyCapture || Object.prototype.hasOwnProperty.call(saved, "aiIdentified")) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  catch { return { ...initialState }; }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function siteComplete(index = activeSite) { return Boolean(state.siteProgress[index]?.complete); }
function found(item) { return item.found === true || state.collectedSpecies.includes(item.id); }
function foundCount() { return species.filter(found).length; }
function siteTaskCount(index = activeSite) {
  const progress = state.siteProgress[index];
  return Number(progress.targetsViewed) + Number(progress.gps) + Number(progress.identified);
}
function dailyTaskCount() { return Number(state.daily.viewedCard) + Number(state.daily.identified) + Number(state.daily.supplyClaimed); }
function completedSiteCount() { return state.siteProgress.filter(item => item.complete).length; }
function badgeCount() { return Math.min(badges.length, 2 + completedSiteCount()); }
function formatNumber(value) { return new Intl.NumberFormat("zh-CN").format(value); }
function icon(name) { return `<i data-lucide="${name}"></i>`; }
function icons() { if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } }); }
function loadScriptOnce(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return existing.dataset.loaded === "true" ? Promise.resolve() : new Promise((resolve, reject) => { existing.addEventListener("load", resolve, { once: true }); existing.addEventListener("error", reject, { once: true }); });
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.append(script);
  });
}
function loadStylesheetOnce(href) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", reject, { once: true });
    document.head.append(link);
  });
}
function ensureRecognitionRuntime() {
  if (!recognitionRuntimePromise) recognitionRuntimePromise = Promise.all([
    loadScriptOnce("assets/vendor/tf.min.js").then(() => loadScriptOnce("assets/vendor/mobilenet.min.js")),
    loadScriptOnce("assets/vendor/onnxruntime-web.min.js")
  ]).catch(error => { recognitionRuntimePromise = null; throw error; });
  return recognitionRuntimePromise;
}
function ensureGameRuntime() {
  if (!gameRuntimePromise) gameRuntimePromise = import("./game.js").then(() => import("./arena.js")).catch(error => { gameRuntimePromise = null; throw error; });
  return gameRuntimePromise;
}
function cardProgress(item) { return { xp: 0, observations: 0, ...(state.cardProgress[item.id] || {}) }; }
function cardLevel(item) {
  const progress = cardProgress(item);
  const thresholds = [0, 60, 140, 240, 380];
  const names = ["初遇", "认识", "观察", "记录", "守护"];
  let level = 1;
  thresholds.forEach((threshold, index) => { if (progress.xp >= threshold) level = index + 1; });
  const current = thresholds[level - 1];
  const next = thresholds[level] ?? thresholds[4];
  return { ...progress, level, name: names[level - 1], current, next, percent: level === 5 ? 100 : Math.round((progress.xp - current) / (next - current) * 100) };
}

function unlockedAlarmBirds() {
  return species.filter(item => item.category === "bird" && birdSounds[item.id] && found(item));
}

function nextAlarmDate(time, now = new Date()) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function renderBirdAlarm() {
  const birds = unlockedAlarmBirds();
  const select = document.getElementById("alarmBird");
  const selected = birds.some(item => item.id === state.alarm.speciesId) ? state.alarm.speciesId : birds[0]?.id || "";
  state.alarm.speciesId = selected;
  select.innerHTML = birds.length ? birds.map(item => `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${item.name} · ${item.latin}</option>`).join("") : `<option value="">暂无已解锁鸟类</option>`;
  select.disabled = !birds.length;
  document.getElementById("alarmTime").value = state.alarm.time;
  document.getElementById("previewAlarm").disabled = !birds.length;
  const toggle = document.getElementById("toggleAlarm");
  toggle.disabled = !birds.length;
  toggle.innerHTML = state.alarm.enabled ? `${icon("alarm-clock-off")} 停用闹钟` : `${icon("alarm-clock")} 启用闹钟`;
  document.getElementById("alarmBadge").textContent = state.alarm.enabled ? "已启用" : "未启用";
  document.getElementById("alarmBadge").classList.toggle("is-on", state.alarm.enabled);
  const item = species.find(entry => entry.id === selected);
  document.getElementById("alarmStatus").textContent = !birds.length
    ? "先在图鉴中解锁一种鸟类，才能使用对应鸟鸣。"
    : state.alarm.enabled
      ? `每天 ${state.alarm.time} · ${item.name} · 下一次 ${nextAlarmDate(state.alarm.time).toLocaleString("zh-CN", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
      : "闹钟设置只保存在当前浏览器。启用时会先播放一次鸟鸣试听。";
  icons();
}

function stopBirdSound() {
  const audio = document.getElementById("alarmAudio");
  clearTimeout(alarmStopTimer);
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
  document.getElementById("previewAlarm").hidden = false;
  document.getElementById("stopPreviewAlarm").hidden = true;
  document.getElementById("alarmRinging").hidden = true;
}

async function playBirdSound(speciesId, ringing = false) {
  const item = species.find(entry => entry.id === speciesId);
  if (!item || !birdSounds[speciesId]) return;
  stopBirdSound();
  const audio = document.getElementById("alarmAudio");
  audio.src = birdSounds[speciesId];
  audio.loop = ringing;
  audio.volume = .82;
  if (ringing) {
    document.getElementById("alarmRingingImage").src = item.image;
    document.getElementById("alarmRingingImage").alt = item.name;
    document.getElementById("alarmRingingSpecies").textContent = `${item.name} · ${state.alarm.time}`;
    document.getElementById("alarmRinging").hidden = false;
    icons();
  }
  try {
    await audio.play();
    document.getElementById("previewAlarm").hidden = !ringing;
    document.getElementById("stopPreviewAlarm").hidden = ringing;
    alarmStopTimer = setTimeout(stopBirdSound, ringing ? 60000 : 8000);
  } catch {
    if (ringing) document.getElementById("alarmRingingSpecies").textContent = `${item.name} · 点击“重播鸟鸣”允许声音`;
    else toast("浏览器暂未允许播放声音，请再点一次试听");
  }
}

function triggerBirdAlarm() {
  const item = unlockedAlarmBirds().find(entry => entry.id === state.alarm.speciesId);
  if (!state.alarm.enabled || !item) return;
  state.alarm.lastTriggeredDate = todayKey();
  saveState();
  playBirdSound(item.id, true);
  scheduleBirdAlarm();
}

function scheduleBirdAlarm() {
  clearTimeout(alarmTimer);
  if (!state.alarm.enabled || !state.alarm.speciesId) { renderBirdAlarm(); return; }
  const delay = nextAlarmDate(state.alarm.time).getTime() - Date.now();
  alarmTimer = setTimeout(triggerBirdAlarm, delay);
  renderBirdAlarm();
}

function navigate(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("is-active", view.dataset.view === name));
  document.body.classList.toggle("is-blind-box-active", name === "blind-box");
  document.querySelectorAll("[data-view-target]").forEach(button => {
    const activeView = button.closest(".bottom-nav") && ["blind-box", "bird-sanctuary"].includes(name) ? "collection" : name;
    button.classList.toggle("is-active", button.dataset.viewTarget === activeView);
  });
  if (name === "explore") ensureExploreRuntime();
  if (name === "bird-sanctuary") ensureGameRuntime();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateUI() {
  const tasks = siteTaskCount();
  const complete = siteComplete();
  document.querySelectorAll("[data-points]").forEach(node => node.textContent = formatNumber(state.points));
  document.querySelectorAll("[data-found]").forEach(node => node.textContent = foundCount());
  document.querySelectorAll("[data-badges]").forEach(node => node.textContent = badgeCount());
  document.getElementById("completedSites").textContent = completedSiteCount();
  document.getElementById("missionCount").textContent = `${tasks} / 3`;
  document.getElementById("missionBar").style.width = `${Math.round(tasks / 3 * 100)}%`;
  document.getElementById("missionTitle").textContent = complete ? `${sites[activeSite].short}观察完成` : `完成${sites[activeSite].short}的三项观察`;
  document.getElementById("missionHint").textContent = complete ? (activeSite < sites.length - 1 ? "下一段深圳湿地路线已点亮" : "六站湿地路线已经完成") : "查看目标、验证点位、完成一次有效识别";
  document.getElementById("taskRingValue").textContent = taskMode === "daily" ? dailyTaskCount() : tasks;
  document.getElementById("levelBar").style.width = `${Math.min(100, state.points / 2000 * 100)}%`;
  document.getElementById("pointsNeeded").textContent = Math.max(0, 2000 - state.points);
  document.getElementById("streakCount").textContent = state.supply.streak;
  renderMap();
  renderAtlas();
  renderTasks();
  renderBadges();
  renderBlindBoxCollection();
  renderBirdAlarm();
  icons();
}

function pickBlindBoxByWeight(items, getWeight = item => item.weight) {
  let roll = Math.random() * items.reduce((sum, item) => sum + getWeight(item), 0);
  for (const item of items) { roll -= getWeight(item); if (roll < 0) return item; }
  return items[items.length - 1];
}
function pickBlindBox() {
  const pool = getBlindBoxPool();
  const key = getBlindBoxStateKey(pool);
  const pity = Number(state.blindBoxPity[key]) || 0;
  const guaranteedUp = Boolean(state.blindBoxGuarantee[key]);
  const rareItems = pool.items.filter(item => ["SSR", "CHASE"].includes(item.rarity));
  const featuredRareItems = rareItems.filter(item => pool.upIds.includes(item.id));
  if (guaranteedUp && featuredRareItems.length && pity >= 9) return pickBlindBoxByWeight(featuredRareItems);
  if (pity >= 9) return pickBlindBoxByWeight(rareItems);
  const rarityBuckets = ["CHASE", "SSR", "SR", "R", "N"].map(rarity => ({ rarity, weight: blindBoxPool.filter(item => item.rarity === rarity).reduce((sum, item) => sum + item.weight, 0) }));
  const rarity = pickBlindBoxByWeight(rarityBuckets).rarity;
  if (guaranteedUp && ["SSR", "CHASE"].includes(rarity) && featuredRareItems.length) return pickBlindBoxByWeight(featuredRareItems);
  const candidates = pool.items.filter(item => item.rarity === rarity);
  return pickBlindBoxByWeight(candidates, item => item.weight * (pool.upIds.includes(item.id) ? 3 : 1));
}
function updateBlindBoxPoolMeta() {
  const pool = getBlindBoxPool();
  const key = getBlindBoxStateKey(pool);
  const pity = Number(state.blindBoxPity[key]) || 0;
  document.getElementById("blindBoxTitle").innerHTML = pool.title + `<br><em>${pool.id === "standard-atlas" ? "常驻典藏" : "限定典藏"}</em>`;
  document.getElementById("blindBoxKicker").textContent = pool.id === "standard-atlas" ? "深圳湿地典藏 · 第一辑" : "限定典藏 · 概率提升";
  document.getElementById("blindBoxSubtitle").textContent = pool.subtitle;
  document.getElementById("blindBoxCopy").textContent = pool.copy;
  document.getElementById("blindBoxPity").textContent = pity + " / 10";
  document.getElementById("blindBoxRules").textContent = state.blindBoxGuarantee[key] ? "下一次获得 SSR 或典藏款时，必为本期主推藏品。" : pool.carryOver ? "10 次开启内必得 SSR 或典藏款；两期限定典藏共享保底计数。" : "10 次开启内必得 SSR 或典藏款；本池独立计数。";
  const view = document.querySelector(".blind-box-view");
  view.dataset.pool = pool.id;
  view.style.setProperty("--pool-accent", pool.accent || "#dff47b");
  document.getElementById("blindBoxHeroBadge").textContent = pool.heroBadge || "本期主推";
  document.getElementById("blindBoxHeroQuote").textContent = pool.copy;
  document.getElementById("blindBoxHeroSpecies").textContent = pool.heroSpecies || pool.subtitle;
  document.querySelectorAll("[data-pool-id]").forEach(button => { const active = button.dataset.poolId === pool.id; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
}
function updateBlindBoxEconomyUI() {
  document.querySelectorAll("[data-points]").forEach(node => node.textContent = formatNumber(state.points));
  updateBlindBoxPoolMeta();
  renderBlindBoxCollection();
}
function selectBlindBoxPool(poolId) { if (!blindBoxPools.some(pool => pool.id === poolId)) return; activeBlindBoxPool = poolId; updateBlindBoxPoolMeta(); renderBlindBoxCollection(); }
function selectBlindBoxPanel(panelId) {
  const panel = document.querySelector(`[data-blind-box-panel-content="${panelId}"]`);
  if (!panel) return;
  document.querySelectorAll("[data-blind-box-panel-content]").forEach(item => {
    const active = item === panel;
    item.hidden = !active;
    item.classList.toggle("is-active", active);
  });
  document.querySelectorAll("[data-blind-box-panel-target]").forEach(button => {
    const active = button.dataset.blindBoxPanelTarget === panelId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.setAttribute("tabindex", active ? "0" : "-1");
  });
  if (panelId === "showroom") initializeShowroom();
}
function renderBlindBoxCollection() {
  const grid = document.getElementById("blindBoxGrid");
  if (!grid) return;
  const owned = blindBoxPool.filter(item => state.blindBoxCollection[item.id]).length;
  const pageCount = Math.ceil(blindBoxPool.length / BLIND_BOX_CABINET_PAGE_SIZE);
  blindBoxCabinetPage = Math.min(blindBoxCabinetPage, pageCount - 1);
  const start = blindBoxCabinetPage * BLIND_BOX_CABINET_PAGE_SIZE;
  document.getElementById("blindBoxOwned").textContent = owned;
  document.getElementById("blindBoxFragments").textContent = formatNumber(state.blindBoxFragments);
  document.getElementById("blindBoxCabinetPage").textContent = `${blindBoxCabinetPage + 1} / ${pageCount}`;
  document.getElementById("blindBoxCabinetPrev").disabled = blindBoxCabinetPage === 0;
  document.getElementById("blindBoxCabinetNext").disabled = blindBoxCabinetPage === pageCount - 1;
  grid.innerHTML = blindBoxPool.slice(start, start + BLIND_BOX_CABINET_PAGE_SIZE).map((item, pageIndex) => {
    const index = start + pageIndex;
    const unlocked = Boolean(state.blindBoxCollection[item.id]);
    return `<article class="blind-box-card rarity-${item.rarity.toLowerCase()} ${unlocked ? "is-unlocked" : "is-locked"}" style="--delay:${index * 35}ms">
      <div><span>${item.rarity === "CHASE" ? "典藏" : item.rarity}</span><img src="${item.image}" alt="${unlocked ? `${item.name} · ${item.species}` : "尚未收录的湿地藏品"}"></div>
      <small>编号 ${String(index + 1).padStart(2, "0")}</small><h3>${unlocked ? item.name : "尚未收录"}</h3><p>${unlocked ? item.species : `${item.weight}% 获取概率`}</p>
    </article>`;
  }).join("");
}

function buildBlindBoxConfetti(rarity) {
  const confetti = document.getElementById("blindBoxConfetti");
  confetti.innerHTML = Array.from({ length: rarity === "CHASE" ? 72 : 42 }, (_, index) => `<i style="--x:${(index * 47) % 100}%;--r:${(index * 83) % 360}deg;--d:${(index % 9) * 60}ms;--h:${index % 5}"></i>`).join("");
}

function renderBlindBoxResults(results) {
  const highest = results.find(result => result.item.rarity === "CHASE") || results.find(result => result.item.rarity === "SSR") || results[0];
  blindBoxRevealIndex = 0;
  document.getElementById("blindBoxRevealTitle").textContent = ["SSR", "CHASE"].includes(highest.item.rarity) ? "珍稀藏品现身" : "本次开启结果";
  document.getElementById("blindBoxResults").innerHTML = results.map(({ item, duplicate }, index) => '<article class="reveal-card rarity-' + item.rarity.toLowerCase() + ' ' + (index ? 'is-hidden' : 'is-revealed') + '" style="--delay:' + (index * 70) + 'ms" data-reveal-index="' + index + '"><div><span>' + (item.rarity === 'CHASE' ? '典藏' : item.rarity) + '</span><img src="' + item.image + '" alt="' + item.name + '"></div><small>' + (duplicate ? '重复 · +' + item.fragments + ' 碎片' : '首次获得') + '</small><h3>' + item.name + '</h3><p>' + item.species + '</p></article>').join("");
  buildBlindBoxConfetti(highest.item.rarity);
  document.getElementById("blindBoxReveal").dataset.rarity = highest.item.rarity.toLowerCase();
}
function revealBlindBoxCard(index = blindBoxRevealIndex + 1) { const cards = [...document.querySelectorAll("[data-reveal-index]")]; cards.forEach(card => { const shown = Number(card.dataset.revealIndex) <= index; card.classList.toggle("is-revealed", shown); card.classList.toggle("is-hidden", !shown); }); blindBoxRevealIndex = Math.min(index, cards.length - 1); }
function revealAllBlindBoxCards() { revealBlindBoxCard(Number.MAX_SAFE_INTEGER); }
function closeBlindBoxReveal() {
  clearInterval(blindBoxRevealTimer);
  document.getElementById("blindBoxReveal").hidden = true;
  document.body.style.overflow = "";
}

function drawBlindBoxes(count) {
  const cost = BLIND_BOX_COSTS[count]; const pool = getBlindBoxPool();
  if (blindBoxDrawing || !cost) return;
  if (state.points < cost) { toast('积分不足，还差 ' + formatNumber(cost - state.points)); return; }
  blindBoxDrawing = true; document.querySelectorAll('[data-draw-count]').forEach(button => button.disabled = true); document.getElementById('blindBoxStage').classList.add('is-drawing'); state.points -= cost;
  const results = Array.from({ length: count }, () => { const item = pickBlindBox(); const duplicate = Boolean(state.blindBoxCollection[item.id]); const duplicateFragments = item.fragments; const rare = ['SSR', 'CHASE'].includes(item.rarity); const key = getBlindBoxStateKey(pool); state.blindBoxCollection[item.id] = (Number(state.blindBoxCollection[item.id]) || 0) + 1; if (duplicate) state.blindBoxFragments += item.fragments; state.blindBoxPity[key] = rare ? 0 : (Number(state.blindBoxPity[key]) || 0) + 1; if (pool.carryOver && rare) state.blindBoxGuarantee[key] = !pool.upIds.includes(item.id); else if (!pool.carryOver && rare) state.blindBoxGuarantee[key] = false; return { item, duplicate, duplicateFragments }; });
  saveState(); updateBlindBoxEconomyUI();
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 1850;
  window.setTimeout(() => { renderBlindBoxResults(results); document.getElementById('blindBoxReveal').hidden = false; document.body.style.overflow = 'hidden'; blindBoxRevealTimer = window.setInterval(() => { if (blindBoxRevealIndex >= results.length - 1) { clearInterval(blindBoxRevealTimer); return; } revealBlindBoxCard(); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 700); document.getElementById('blindBoxStage').classList.remove('is-drawing'); document.querySelectorAll('[data-draw-count]').forEach(button => button.disabled = false); blindBoxDrawing = false; icons(); }, delay);
}
function selectShowroomModel(button) {
  const viewer = document.getElementById("blindBoxModelViewer");
  document.querySelectorAll("[data-model-src]").forEach(item => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
    item.setAttribute("tabindex", active ? "0" : "-1");
  });
  document.getElementById("blindBoxModelPanel").setAttribute("aria-labelledby", button.id);
  viewer.setAttribute("poster", button.dataset.modelPoster);
  viewer.setAttribute("alt", `${button.dataset.modelName}立体模型`);
  document.getElementById("showroomName").textContent = button.dataset.modelName;
  document.getElementById("showroomSpecies").textContent = button.dataset.modelSpecies;
  document.getElementById("showroomStatus").textContent = "正在载入立体模型…";
  document.getElementById("showroomLoader").style.setProperty("--progress", "0%");
  viewer.setAttribute("src", button.dataset.modelSrc);
}

async function initializeShowroom() {
  if (showroomInitialized) return;
  showroomInitialized = true;
  try {
    await import("./assets/vendor/model-viewer.min.js");
    await customElements.whenDefined("model-viewer");
    selectShowroomModel(document.querySelector("[data-model-src].is-active"));
  } catch (error) {
    showroomInitialized = false;
    document.getElementById("showroomStatus").textContent = "立体模型加载失败，请重试";
  }
}

function renderMap() {
  document.querySelectorAll(".map-node").forEach((node, index) => {
    const marker = node.querySelector("span");
    const locked = index > state.unlockedThrough;
    node.classList.toggle("is-locked", locked);
    node.classList.toggle("is-complete", siteComplete(index));
    node.classList.toggle("is-active", index === activeSite);
    marker.innerHTML = locked ? icon("lock") : siteComplete(index) ? icon("check") : String(index + 1).padStart(2, "0");
  });
  document.querySelectorAll("[data-route-segment]").forEach((segment, index) => segment.classList.toggle("is-open", index + 1 <= state.unlockedThrough));
  document.getElementById("siteStrip").innerHTML = sites.map((site, index) => `<button type="button" data-strip-site="${index}" ${index > state.unlockedThrough ? "disabled" : ""}><b>${String(index + 1).padStart(2,"0")} · ${site.name}</b><small>${index > state.unlockedThrough ? "尚未解锁" : site.feature}</small></button>`).join("");
  if (interactiveMap) renderInteractiveMap();
  updateMapFocus();
  icons();
}

function initializeInteractiveMap() {
  if (interactiveMap || !window.L) return;
  const container = document.getElementById("liveMap");
  interactiveMap = L.map(container, { zoomControl: false, attributionControl: false, minZoom: 9, maxZoom: 17, tap: true });
  L.control.zoom({ position: "bottomleft" }).addTo(interactiveMap);
  interactiveMapLayers = L.layerGroup().addTo(interactiveMap);
  interactiveMap.fitBounds(L.latLngBounds(sites.map(site => [site.lat, site.lng])), { padding: [34, 34] });
  container.closest(".route-map").classList.add("is-interactive");
}

function renderInteractiveMap() {
  if (!interactiveMap) return;
  interactiveMapLayers.clearLayers();
  sites.slice(1).forEach((site, index) => {
    const open = index + 1 <= state.unlockedThrough;
    L.polyline([[sites[index].lat, sites[index].lng], [site.lat, site.lng]], {
      color: open ? "#dff47b" : "#ffffff",
      weight: open ? 6 : 4,
      opacity: open ? .95 : .72,
      dashArray: open ? null : "8 10"
    }).addTo(interactiveMapLayers);
  });
  sites.forEach((site, index) => {
    const locked = index > state.unlockedThrough;
    const complete = siteComplete(index);
    const active = index === activeSite;
    const marker = L.marker([site.lat, site.lng], {
      icon: L.divIcon({
        className: "wetland-map-marker-wrap",
        html: `<span class="wetland-map-marker ${locked ? "is-locked" : ""} ${complete ? "is-complete" : ""} ${active ? "is-active" : ""}">${locked ? icon("lock") : complete ? icon("check") : String(index + 1).padStart(2, "0")}</span>`,
        iconSize: [46, 58],
        iconAnchor: [23, 29]
      }),
      keyboard: true,
      title: site.name
    }).addTo(interactiveMapLayers);
    marker.bindTooltip(site.name, { direction: "top", offset: [0, -22], className: "wetland-map-tooltip" });
    marker.on("click", () => selectSite(index));
  });
  requestAnimationFrame(() => interactiveMap.invalidateSize());
}

async function ensureInteractiveMap() {
  if (!interactiveMapPromise) interactiveMapPromise = Promise.all([
    loadStylesheetOnce("assets/vendor/leaflet.min.css"),
    loadScriptOnce("assets/vendor/leaflet.min.js")
  ]).then(() => { initializeInteractiveMap(); renderInteractiveMap(); }).catch(error => { interactiveMapPromise = null; throw error; });
  return interactiveMapPromise;
}

function preparePanorama() {
  const frame = document.getElementById("mangrovePanoramaFrame");
  if (!frame || frame.src !== "about:blank" || panoramaObserver) return;
  panoramaObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    frame.src = frame.dataset.src;
    panoramaObserver.disconnect();
    panoramaObserver = null;
  }, { rootMargin: "120px 0px" });
  panoramaObserver.observe(frame);
}

function ensureExploreRuntime() {
  ensureInteractiveMap().catch(() => {});
  preparePanorama();
}

function renderAtlas() {
  const visible = species.filter(item =>
    (filter === "all" || (filter === "found" ? found(item) : !found(item))) &&
    (categoryFilter === "all" || item.category === categoryFilter) &&
    (rarityFilter === "all" || item.rarity === rarityFilter)
  );
  document.getElementById("atlasGrid").innerHTML = visible.map(item => {
    const isFound = found(item);
    const level = cardLevel(item);
    return `<button class="species-card ${isFound ? "" : "is-locked"}" type="button" data-species="${item.id}">
      <img src="${item.image}" alt="${isFound ? item.name : "待发现物种剪影"}">
      <span class="rarity ${item.rarity.toLowerCase()}">${item.rarity}</span>
      ${isFound ? "" : `<span class="card-lock">${icon("lock")}</span>`}
      <span class="species-card-copy"><h2>${item.name}</h2><em>${isFound ? item.latin : `${item.season} · 等待发现`}</em><p>${isFound ? item.description : "前往对应湿地完成物种识别，点亮这张生态卡片。"}</p>${isFound ? `<span class="mini-level"><b>Lv.${level.level} · ${level.name}</b><i><em style="width:${level.percent}%"></em></i></span>` : ""}</span>
    </button>`;
  }).join("");
  document.querySelectorAll("[data-species]").forEach(card => card.addEventListener("click", () => {
    const item = species.find(entry => entry.id === card.dataset.species);
    if (found(item)) openSpecies(item);
    else toast("在点位目标中找到它，再完成一次物种识别记录");
  }));
  icons();
}

function renderTasks() {
  const progress = state.siteProgress[activeSite];
  const nextTarget = species.find(item => item.id === sites[activeSite].targets[0]);
  const tasks = taskMode === "daily" ? [
    { icon: "layers-3", title: "翻看一张卡背", note: "打开已发现卡片，阅读生态知识", done: state.daily.viewedCard, action: "atlas", reward: "+5" },
    { icon: "scan-line", title: "完成一次有效识别", note: "相机或相册均可，本地完成推理", done: state.daily.identified, action: "capture", reward: "+10" },
    { icon: "package-open", title: "领取今日生态补给", note: "连续第 7 天含稀有卡框碎片", done: state.daily.supplyClaimed, action: "supply", reward: "+20" }
  ] : [
    { icon: "panels-top-left", title: `查看${sites[activeSite].short}目标`, note: "先认识这里可能遇见的物种", done: progress.targetsViewed, action: "site", reward: "+10" },
    { icon: "map-pin-check", title: `抵达${sites[activeSite].name}`, note: progress.gps ? "浏览器定位已通过点位校验" : "需在点位附近授权 GPS 校验", done: progress.gps, action: "site", reward: "+20" },
    { icon: "camera", title: "完成一次有效物种识别", note: "识别结果需属于当前点位目标库", done: progress.identified, action: "capture", reward: "+40" }
  ];
  document.getElementById("taskList").innerHTML = tasks.map(task => `<article class="task-item ${task.done ? "is-done" : ""}"><span>${icon(task.done ? "check" : task.icon)}</span><div><b>${task.title}</b><small>${task.note}</small></div>${task.done ? `<em>${task.reward}</em>` : `<button type="button" data-task-action="${task.action}" aria-label="开始${task.title}">${icon("arrow-right")}</button>`}</article>`).join("");
  document.getElementById("taskRingValue").textContent = taskMode === "daily" ? dailyTaskCount() : siteTaskCount();
  document.getElementById("tasksSubtitle").textContent = taskMode === "daily" ? "三件小事，保持今天的湿地观察节奏。" : `完成${sites[activeSite].name}的三项观察，推进深圳湿地路线。`;
  document.getElementById("nextTargetImage").src = nextTarget.image;
  document.getElementById("nextTargetImage").alt = nextTarget.name;
  document.getElementById("nextTargetMeta").textContent = `${nextTarget.season} · ${nextTarget.rarity}`;
  document.getElementById("nextTargetTitle").textContent = `寻找${nextTarget.name}`;
  document.getElementById("nextTargetHint").textContent = nextTarget.fact;
  document.querySelectorAll("[data-task-action]").forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.taskAction;
    if (action === "capture") openSite();
    if (action === "atlas") navigate("collection");
    if (action === "supply") claimSupply();
    if (action === "site") openSite();
  }));
  renderSupply();
  icons();
}

function renderSupply() {
  const claimed = state.daily.supplyClaimed;
  const day = claimed ? Math.max(1, state.supply.streak) : state.supply.streak % 7 + 1;
  document.getElementById("supplyDays").innerHTML = Array.from({ length: 7 }, (_, index) => `<span class="${index < state.supply.streak ? "is-claimed" : index + 1 === day && !claimed ? "is-next" : ""}"><b>${index + 1}</b><small>${index === 6 ? "稀有" : "+20"}</small></span>`).join("");
  document.getElementById("supplyTitle").textContent = claimed ? `第 ${state.supply.streak} 天补给已领取` : `今日补给 · 第 ${day} 天`;
  document.getElementById("supplyHint").textContent = claimed ? `生态能量已入账${state.supply.frameFragments ? ` · 卡框碎片 ${state.supply.frameFragments}` : ""}` : day === 7 ? "今日包含稀有卡框碎片" : "生态能量 +20 · 连续第 7 天获得稀有奖励";
  const button = document.getElementById("claimSupply");
  button.disabled = claimed;
  button.textContent = claimed ? "今日已领取" : "领取补给";
}

function claimSupply() {
  if (state.daily.supplyClaimed) return;
  const previous = state.supply.lastClaimDate ? new Date(`${state.supply.lastClaimDate}T00:00:00`) : null;
  const today = new Date(`${todayKey()}T00:00:00`);
  const gap = previous ? Math.round((today - previous) / 86400000) : 1;
  state.supply.streak = gap === 1 ? state.supply.streak % 7 + 1 : 1;
  state.supply.lastClaimDate = todayKey();
  state.daily.supplyClaimed = true;
  state.points += 20;
  if (state.supply.streak === 7) state.supply.frameFragments += 1;
  saveState();
  updateUI();
  toast(state.supply.streak === 7 ? "第 7 日补给 · 生态能量 +20 · 稀有卡框碎片 +1" : `第 ${state.supply.streak} 日补给 · 生态能量 +20`);
}

function renderBadges() {
  document.getElementById("badgeGrid").innerHTML = badges.map((badge, index) => `<article class="badge ${index < 2 + completedSiteCount() ? "is-earned" : ""}"><span>${icon(badge[0])}</span><b>${badge[1]}</b><small>${badge[2]}</small></article>`).join("");
  icons();
}

function selectSite(index) {
  if (index > state.unlockedThrough) { toast(`${sites[index].name}尚未解锁，先完成前序点位`); return; }
  activeSite = index;
  renderMap();
  interactiveMap?.panTo([sites[index].lat, sites[index].lng]);
}

function updateMapFocus() {
  const site = sites[activeSite];
  const canEnter = activeSite <= state.unlockedThrough;
  document.getElementById("activeSiteName").textContent = site.name;
  document.getElementById("mapFocusName").textContent = site.name;
  document.getElementById("mapFocusMeta").textContent = `${site.lat.toFixed(5)}, ${site.lng.toFixed(5)} · ${site.limited}`;
  const enter = document.getElementById("enterSite");
  enter.textContent = canEnter ? `进入${site.name}` : "完成前序任务后解锁";
  enter.disabled = !canEnter;
}

function openSite() {
  if (activeSite > state.unlockedThrough) return;
  const site = sites[activeSite];
  state.siteProgress[activeSite].targetsViewed = true;
  saveState();
  document.getElementById("siteSequence").textContent = `${String(activeSite + 1).padStart(2, "0")} / ${String(sites.length).padStart(2, "0")}`;
  document.getElementById("siteTitle").textContent = site.name;
  document.getElementById("siteDescription").textContent = site.description;
  document.getElementById("siteSeason").textContent = site.season;
  document.getElementById("siteHabitat").textContent = site.habitat;
  renderSiteTargets();
  document.getElementById("siteView").hidden = false;
  document.body.style.overflow = "hidden";
  updateUI();
}

function closeSite() {
  document.getElementById("siteView").hidden = true;
  document.body.style.overflow = "";
}

function renderSiteTargets() {
  const site = sites[activeSite];
  const targets = site.targets.map(id => species.find(item => item.id === id));
  const foundTargets = targets.filter(found).length;
  document.getElementById("targetFoundCount").textContent = foundTargets;
  document.getElementById("targetTotalCount").textContent = targets.length;
  document.getElementById("targetRail").innerHTML = targets.map(item => `<button class="target-card" type="button" data-target="${item.id}"><img src="${item.image}" alt="${item.name}"><span class="rarity ${item.rarity.toLowerCase()}">${item.rarity}</span><div><small>${item.season} · ${sites[activeSite].short}</small><h3>${item.name}</h3><p>${item.latin}</p><em>${found(item) ? `${icon("check")} 已记录` : "等待观察"}</em></div></button>`).join("");
  const progress = state.siteProgress[activeSite];
  document.getElementById("siteTaskSummary").innerHTML = [
    ["targetsViewed", "目标", "先认识可能遇见的物种"],
    ["gps", "点位", "到达附近后完成 GPS 校验"],
    ["identified", "记录", "完成一次有效物种识别"]
  ].map(([key, title, note], index) => `<span class="${progress[key] ? "is-done" : ""}"><i>${progress[key] ? icon("check") : index + 1}</i><b>${title}</b><small>${note}</small></span>`).join("");
  document.querySelectorAll("[data-target]").forEach(card => card.addEventListener("click", () => {
    const item = species.find(entry => entry.id === card.dataset.target);
    if (found(item)) openSpecies(item);
    else toast(`${item.name} · ${item.season} · 留意参考照片中的关键轮廓`);
  }));
  icons();
}

function openCapture() {
  resetCapture();
  locationResult = null;
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
  document.getElementById("cameraStatus").textContent = "设备端物种辅助识别";
  document.getElementById("scanProgress").hidden = true;
  document.getElementById("locationReadout").classList.remove("is-complete", "is-warning");
  document.getElementById("locationReadout").innerHTML = `<span>${icon("map-pin")}</span><p><b>GPS 点位校验</b><small>拍照后请求定位</small></p><em>GPS</em>`;
  document.getElementById("sceneReadout").classList.remove("is-complete", "is-warning");
  document.getElementById("sceneReadout").innerHTML = `<span>${icon("trees")}</span><p><b>生态场景匹配</b><small>${sites[activeSite].short}目标库已就绪</small></p><em>ECO</em>`;
  document.getElementById("featureReadout").classList.remove("is-complete");
  document.getElementById("featureReadout").innerHTML = `<span>${icon("scan-search")}</span><p><b>物种特征</b><small>等待实时照片</small></p><em>识别</em>`;
  document.getElementById("collectButton").hidden = true;
  document.getElementById("identifyButton").hidden = false;
  setCaptureReady(false, "等待画面");
  icons();
}

function updateScanProgress(percent, label) {
  document.getElementById("scanProgress").hidden = false;
  document.getElementById("scanProgressBar").style.width = `${percent}%`;
  document.getElementById("scanStage").textContent = label;
  document.getElementById("scanPercent").textContent = `${percent}%`;
}

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const rad = value => value * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function verifyLocation() {
  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      resolve(result);
    };
    const fallbackTimer = setTimeout(() => finish({ status: "unavailable" }), 6000);
    if (!navigator.geolocation) { finish({ status: "unavailable" }); return; }
    navigator.geolocation.getCurrentPosition(position => {
      const site = sites[activeSite];
      const distance = Math.round(distanceInMeters(position.coords.latitude, position.coords.longitude, site.lat, site.lng));
      finish({ status: distance <= 3000 ? "verified" : "far", distance });
    }, error => finish({ status: error.code === 1 ? "denied" : "unavailable" }), { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 });
  });
}

function showLocationResult(result) {
  const readout = document.getElementById("locationReadout");
  readout.classList.toggle("is-complete", result.status === "verified");
  readout.classList.toggle("is-warning", result.status !== "verified");
  const messages = {
    verified: `位于${sites[activeSite].short}附近 · ${result.distance}m`,
    far: `距目标点约 ${(result.distance / 1000).toFixed(1)}km`,
    denied: "未授权定位 · 不计点位抵达",
    unavailable: "暂时无法定位 · 不计点位抵达"
  };
  readout.innerHTML = `<span>${icon(result.status === "verified" ? "check" : "map-pin-off")}</span><p><b>GPS 点位校验</b><small>${messages[result.status]}</small></p><em>GPS</em>`;
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
    document.getElementById("cameraStatus").textContent = cameraFacingMode === "environment" ? "后置相机 · 设备端识别" : "前置相机 · 设备端识别";
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
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .88));
  if (!blob) throw new Error("无法读取相机画面");
  if (image.dataset.captureUrl) URL.revokeObjectURL(image.dataset.captureUrl);
  image.dataset.captureUrl = URL.createObjectURL(blob);
  image.src = image.dataset.captureUrl;
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

async function loadBirdRecognitionModel() {
  if (!birdModelPromise) {
    birdModelPromise = (async () => {
      if (!window.ort) throw new Error("鸟类识别组件未加载");
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = new URL("assets/vendor/", document.baseURI).href;
      const [session, response] = await Promise.all([
        ort.InferenceSession.create(BIRD_MODEL_URL, { executionProviders: ["wasm"], graphOptimizationLevel: "all" }),
        fetch(BIRD_CONFIG_URL)
      ]);
      if (!response.ok) throw new Error("鸟类标签加载失败");
      const config = await response.json();
      return { session, labels: config.id2label };
    })().catch(error => {
      birdModelPromise = null;
      throw error;
    });
  }
  return birdModelPromise;
}

function birdInputTensor(input) {
  const canvas = document.createElement("canvas");
  canvas.width = BIRD_IMAGE_SIZE;
  canvas.height = BIRD_IMAGE_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  context.drawImage(input, 0, 0, BIRD_IMAGE_SIZE, BIRD_IMAGE_SIZE);
  const pixels = context.getImageData(0, 0, BIRD_IMAGE_SIZE, BIRD_IMAGE_SIZE).data;
  const planeSize = BIRD_IMAGE_SIZE * BIRD_IMAGE_SIZE;
  const values = new Float32Array(planeSize * 3);
  for (let index = 0; index < planeSize; index += 1) {
    const pixelIndex = index * 4;
    values[index] = (pixels[pixelIndex] / 255 - BIRD_MEAN[0]) / BIRD_STD[0];
    values[planeSize + index] = (pixels[pixelIndex + 1] / 255 - BIRD_MEAN[1]) / BIRD_STD[1];
    values[planeSize * 2 + index] = (pixels[pixelIndex + 2] / 255 - BIRD_MEAN[2]) / BIRD_STD[2];
  }
  return new ort.Tensor("float32", values, [1, 3, BIRD_IMAGE_SIZE, BIRD_IMAGE_SIZE]);
}

async function classifyBird(input, model) {
  const feeds = { [model.session.inputNames[0]]: birdInputTensor(input) };
  const output = await model.session.run(feeds);
  const logits = Array.from(output[model.session.outputNames[0]].data);
  const maxLogit = Math.max(...logits);
  const probabilities = logits.map(value => Math.exp(value - maxLogit));
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  return probabilities
    .map((value, index) => ({ className: model.labels[index], probability: value / total, model: "bird" }))
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 5);
}

function resolveRecognition(mobilePredictions, birdPredictions) {
  const mobileTop = mobilePredictions[0];
  const birdTop = birdPredictions[0];
  if (!mobileTop || !birdTop) return null;
  const mobileName = mobileTop.className.toLowerCase();
  const spoonbill = birdPredictions.find(item => item.className === "BLACK FACED SPOONBILL");
  if (mobileName === "spoonbill" && mobileTop.probability >= .45 && spoonbill?.probability >= .08) {
    return {
      speciesId: "spoonbill",
      title: "黑脸琵鹭（双模型辅助确认）",
      description: "通用模型识别到琵鹭，鸟类模型的前五候选包含黑脸琵鹭。请再结合黑色脸部、匙状长嘴和观察地点人工确认。",
      probability: mobileTop.probability,
      confidenceText: `通用 ${(mobileTop.probability * 100).toFixed(1)}% · 专用 ${(spoonbill.probability * 100).toFixed(1)}%`
    };
  }

  const birdIsReliable = birdTop.probability >= .35 && birdTop.probability - birdPredictions[1].probability >= .15;
  if (birdIsReliable && birdTop.className === "BLACK FACED SPOONBILL") {
    return { speciesId: "spoonbill", title: "黑脸琵鹭", description: "鸟类专用模型可靠命中黑脸琵鹭。请结合黑色脸部、匙状长嘴和观察地点进行人工复核。", probability: birdTop.probability };
  }
  if (birdIsReliable && birdTop.className === "SNOWY EGRET") {
    return { speciesId: "egret", title: "白鹭类（接近白鹭）", description: "模型识别到白色小型鹭类。训练标签为雪鹭，请结合黑腿、黄趾和深圳本地物种信息复核是否为白鹭。", probability: birdTop.probability };
  }
  if (birdIsReliable && birdTop.className.includes("KINGFISHER")) {
    return { title: "检测到翠鸟类", description: `最接近 ${birdTop.className}，但模型没有普通翠鸟的精确标签，需人工确认后再记录。`, probability: birdTop.probability, candidateOnly: true };
  }
  if (birdIsReliable && birdTop.className === "BLUE HERON") {
    return { speciesId: "heron", title: "夜鹭类（Blue Heron 近似标签）", description: "模型可靠识别到 Blue Heron 训练标签，并映射为当前图鉴的夜鹭类观察。请结合灰黑色背部、红眼和昼伏夜出习性人工复核。", probability: birdTop.probability };
  }
  if (birdIsReliable && (birdTop.className.includes("HERON") || birdTop.className.includes("EGRET"))) {
    return { title: "检测到鹭类", description: `最接近 ${birdTop.className}，但模型没有夜鹭的精确标签，不会自动收入夜鹭卡。`, probability: birdTop.probability, candidateOnly: true };
  }
  if (birdIsReliable) {
    return { title: "检测到鸟类", description: `鸟类模型最接近 ${birdTop.className}。该类别不在当前深圳湿地图鉴中，仅作为观察候选。`, probability: birdTop.probability, candidateOnly: true };
  }

  const nonBirdMappings = [
    { name: "fiddler crab", threshold: .55, speciesId: "fiddler", title: "招潮蟹", description: "模型识别到招潮蟹特征，雄蟹常有一只特别醒目的大螯。" },
    { name: "snail", threshold: .55, speciesId: "snail", title: "湿地螺类", description: "模型识别到螺类特征，具体种类仍需结合壳形和栖息环境判断。" }
  ];
  const mapping = nonBirdMappings.find(item => mobileName === item.name && mobileTop.probability >= item.threshold);
  return mapping ? { ...mapping, probability: mobileTop.probability } : null;
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

function displayBirdPredictionName(className) {
  if (className === "BLACK FACED SPOONBILL") return "黑脸琵鹭";
  if (className === "SNOWY EGRET") return "白色鹭类（雪鹭标签）";
  if (className === "BLUE HERON") return "夜鹭类候选 · BLUE HERON";
  if (className.includes("KINGFISHER")) return `翠鸟类 · ${className}`;
  if (className.includes("HERON") || className.includes("EGRET")) return `鹭类 · ${className}`;
  return `鸟类候选 · ${className}`;
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
  document.getElementById("cameraStatus").textContent = "正在设备端分析";
  try {
    await ensureRecognitionRuntime();
    updateScanProgress(8, "正在检查照片清晰度");
    let input = document.getElementById("captureImage");
    if (captureSource === "camera") input = await snapshotCamera();
    if (input.hidden || !input.naturalWidth) throw new Error("没有可识别的照片");
    updateScanProgress(22, "正在加载鸟类专用模型 · 新增约 28 MB");
    const [model, birdModel, location] = await Promise.all([loadRecognitionModel(), loadBirdRecognitionModel(), verifyLocation()]);
    locationResult = location;
    showLocationResult(location);
    updateScanProgress(48, "正在匹配通用与鸟类特征");
    const [mobilePredictions, birdPredictions] = await Promise.all([model.classify(input, 5), classifyBird(input, birdModel)]);
    updateScanProgress(88, "正在核对物种特征");
    const detectedResult = resolveRecognition(mobilePredictions, birdPredictions);
    const sceneMatch = detectedResult?.speciesId && sites[activeSite].targets.includes(detectedResult.speciesId);
    const sceneReadout = document.getElementById("sceneReadout");
    sceneReadout.classList.toggle("is-complete", Boolean(sceneMatch));
    sceneReadout.classList.toggle("is-warning", Boolean(detectedResult && !sceneMatch));
    sceneReadout.innerHTML = sceneMatch
      ? `<span>${icon("check")}</span><p><b>生态场景匹配</b><small>${detectedResult.title}属于${sites[activeSite].short}目标库</small></p><em>ECO</em>`
      : `<span>${icon("circle-alert")}</span><p><b>生态场景匹配</b><small>${detectedResult ? (detectedResult.candidateOnly ? "已有鸟类候选，等待人工确认" : "识别有效，但不属于当前点位目标") : "未达到可靠判定阈值"}</small></p><em>ECO</em>`;
    recognitionResult = sceneMatch ? detectedResult : null;
    updateScanProgress(100, recognitionResult ? "扫描完成 · 发现有效目标" : "扫描完成 · 暂未确认目标");
    const displayBirdPredictions = detectedResult?.candidateOnly || ["spoonbill", "egret", "heron"].includes(detectedResult?.speciesId);
    const displayPredictions = displayBirdPredictions ? birdPredictions : mobilePredictions;
    showRecognitionResult(displayPredictions, recognitionResult, detectedResult);
    readout.classList.toggle("is-complete", Boolean(detectedResult));
    readout.innerHTML = detectedResult
      ? `<span>${icon(recognitionResult ? "check" : "circle-alert")}</span><p><b>物种特征</b><small>${detectedResult.title} · ${(detectedResult.probability * 100).toFixed(1)}%</small></p><em>识别</em>`
      : `<span>${icon("circle-alert")}</span><p><b>物种特征</b><small>当前模型无法可靠确认</small></p><em>识别</em>`;
  } catch (error) {
    recognitionResult = null;
    showRecognitionError(error.message || "模型加载失败，请稍后重试");
    readout.innerHTML = `<span>${icon("triangle-alert")}</span><p><b>物种特征</b><small>识别失败，请重试</small></p><em>识别</em>`;
    updateScanProgress(100, "扫描未完成");
  } finally {
    document.getElementById("scanner").classList.remove("is-running");
    document.getElementById("cameraStatus").textContent = "识别完成 · 结果仅供辅助观察";
    icons();
  }
}

function showRecognitionResult(predictions, result, detectedResult = null) {
  document.getElementById("toast").classList.remove("is-visible");
  const panel = document.getElementById("captureResult");
  const collectButton = document.getElementById("collectButton");
  document.getElementById("predictionList").innerHTML = predictions.slice(0, 3).map(item => `<li><span>${item.model === "bird" ? displayBirdPredictionName(item.className) : displayPredictionName(item.className)}</span><b>${(item.probability * 100).toFixed(1)}%</b></li>`).join("");
  if (result) {
    const item = species.find(entry => entry.id === result.speciesId);
    const alreadyFound = found(item);
    document.getElementById("resultRarity").className = `rarity ${item.rarity.toLowerCase()}`;
    document.getElementById("resultRarity").textContent = `${item.rarity} · 模型支持类别`;
    document.getElementById("resultConfidence").textContent = result.confidenceText || `${(result.probability * 100).toFixed(1)}% 匹配`;
    document.getElementById("resultLatin").textContent = item.latin;
    document.getElementById("captureTitle").textContent = result.title;
    document.getElementById("resultDescription").textContent = result.description;
    collectButton.hidden = false;
    collectButton.disabled = false;
    collectButton.innerHTML = alreadyFound ? `${icon("sparkles")} 再次记录 · +20 XP` : `${icon("sparkles")} 收入图鉴 · +40`;
  } else if (detectedResult) {
    document.getElementById("resultRarity").className = "rarity";
    document.getElementById("resultRarity").textContent = "待人工确认";
    document.getElementById("resultConfidence").textContent = `${(detectedResult.probability * 100).toFixed(1)}% 鸟类候选`;
    document.getElementById("resultLatin").textContent = "Bird model candidate";
    document.getElementById("captureTitle").textContent = detectedResult.title;
    document.getElementById("resultDescription").textContent = detectedResult.description;
    collectButton.hidden = true;
  } else {
    document.getElementById("resultRarity").className = "rarity";
    document.getElementById("resultRarity").textContent = "未确认";
    document.getElementById("resultConfidence").textContent = "未达到湿地类别阈值";
    document.getElementById("resultLatin").textContent = "General model result";
    document.getElementById("captureTitle").textContent = "暂时无法确认物种";
    document.getElementById("resultDescription").textContent = "请靠近目标、保持画面清晰后重试。结果还必须属于当前点位目标库；未确认内容不会收入图鉴。";
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
  const firstDiscovery = !state.collectedSpecies.includes(item.id) && item.found !== true;
  const previous = cardProgress(item);
  state.cardProgress[item.id] = { xp: previous.xp + (firstDiscovery ? 40 : 20), observations: previous.observations + 1, lastSite: activeSite, lastObservedAt: new Date().toISOString() };
  state.collectedSpecies = [...new Set([...state.collectedSpecies, item.id])];
  state.siteProgress[activeSite].identified = true;
  if (locationResult?.status === "verified") state.siteProgress[activeSite].gps = true;
  state.daily.identified = true;
  state.points += firstDiscovery ? 40 : 10;
  const completedNow = siteTaskCount(activeSite) === 3 && !state.siteProgress[activeSite].complete;
  let routeAdvanced = false;
  if (completedNow) {
    state.siteProgress[activeSite].complete = true;
    state.points += 30;
    if (activeSite === state.unlockedThrough && activeSite < sites.length - 1) {
      state.unlockedThrough = activeSite + 1;
      routeAdvanced = true;
    }
  }
  saveState();
  updateUI();
  closeCapture();
  showUnlock(item, firstDiscovery, completedNow, routeAdvanced);
}

function showUnlock(item, firstDiscovery, completedNow, routeAdvanced) {
  lastUnlockedItem = item;
  const level = cardLevel(item);
  const overlay = document.getElementById("unlockOverlay");
  overlay.className = `unlock-overlay rarity-${item.rarity.toLowerCase()} ${completedNow ? "site-completed" : ""} ${routeAdvanced ? "route-unlocked" : ""}`;
  document.getElementById("unlockKicker").textContent = firstDiscovery ? (item.rarity === "SSR" ? "守护级发现 · GUARDIAN CLASS" : "NEW FIELD CARD") : "FIELD RECORD UPDATED";
  document.getElementById("unlockImage").src = item.image;
  document.getElementById("unlockImage").alt = item.name;
  document.getElementById("unlockRarity").className = `rarity ${item.rarity.toLowerCase()}`;
  document.getElementById("unlockRarity").textContent = item.rarity;
  document.getElementById("unlockSite").textContent = `${sites[activeSite].name} · ${new Date().toLocaleDateString("zh-CN")}`;
  document.getElementById("unlockTitle").textContent = item.name;
  document.getElementById("unlockLatin").textContent = item.latin;
  document.getElementById("unlockMessage").textContent = `${level.level === 5 ? "守护级" : level.name} · Lv.${level.level}`;
  document.getElementById("unlockLevelBar").style.width = `${level.percent}%`;
  document.getElementById("unlockLevelHint").textContent = routeAdvanced ? `${sites[activeSite].short}三项观察完成 · 下一段路线已点亮` : completedNow ? `${sites[activeSite].short}三项观察已经完成` : firstDiscovery ? "生态卡已经收入深圳湿地图鉴" : `第 ${level.observations} 次有效观察 · 卡片经验 +20`;
  document.getElementById("acceptUnlock").textContent = routeAdvanced ? "查看下一站" : "收下卡片";
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  icons();
}

function closeUnlock() {
  const overlay = document.getElementById("unlockOverlay");
  const goNext = overlay.classList.contains("route-unlocked") && activeSite < sites.length - 1;
  overlay.classList.remove("is-visible");
  setTimeout(() => { overlay.hidden = true; }, 350);
  document.body.style.overflow = "";
  if (goNext) {
    activeSite += 1;
    updateUI();
    openSite();
  }
}

function openSpecies(item) {
  const level = cardLevel(item);
  document.getElementById("speciesImage").src = item.image;
  document.getElementById("speciesImage").alt = item.name;
  document.getElementById("speciesRarity").className = `rarity ${item.rarity.toLowerCase()}`;
  document.getElementById("speciesRarity").textContent = item.rarity;
  document.getElementById("speciesLatin").textContent = item.latin;
  document.getElementById("speciesName").textContent = item.name;
  document.getElementById("speciesDescription").textContent = item.description;
  document.getElementById("speciesLevel").textContent = `Lv.${level.level} · ${level.name}`;
  document.getElementById("speciesXp").textContent = level.level === 5 ? `${level.xp} XP · 已达守护级` : `${level.xp} / ${level.next} XP`;
  document.getElementById("speciesLevelBar").style.width = `${level.percent}%`;
  document.getElementById("speciesFact").textContent = item.fact;
  document.getElementById("speciesShare").dataset.species = item.id;
  state.daily.viewedCard = true;
  saveState();
  renderTasks();
  document.getElementById("speciesModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSpecies() {
  document.getElementById("speciesModal").hidden = true;
  document.body.style.overflow = document.getElementById("siteView").hidden ? "" : "hidden";
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function drawCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const characters = [...text];
  let line = "";
  let row = 0;
  characters.forEach(character => {
    const test = line + character;
    if (context.measureText(test).width > maxWidth && line) {
      if (row < maxLines) context.fillText(line, x, y + row * lineHeight);
      line = character;
      row += 1;
    } else line = test;
  });
  if (row < maxLines) context.fillText(line, x, y + row * lineHeight);
}

async function generateShareCard(item) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  const image = await loadImage(item.image);
  const progress = cardProgress(item);
  const observedSite = sites[progress.lastSite] || sites[activeSite];
  const observedAt = progress.lastObservedAt ? new Date(progress.lastObservedAt) : new Date();
  context.fillStyle = "#f4f5ed";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawCover(context, image, 0, 0, 1080, 790);
  const shade = context.createLinearGradient(0, 430, 0, 800);
  shade.addColorStop(0, "rgba(4,35,29,0)");
  shade.addColorStop(1, "rgba(4,35,29,.82)");
  context.fillStyle = shade;
  context.fillRect(0, 420, 1080, 380);
  context.fillStyle = item.rarity === "SSR" ? "#f0c95a" : item.rarity === "SR" ? "#74e1ce" : "#dff47b";
  context.fillRect(70, 64, 162, 58);
  context.fillStyle = "#06352c";
  context.font = "700 30px sans-serif";
  context.textAlign = "center";
  context.fillText(item.rarity, 151, 103);
  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = "700 86px serif";
  context.fillText(item.name, 70, 665);
  context.font = "italic 30px sans-serif";
  context.fillStyle = "#d9e8e1";
  context.fillText(item.latin, 72, 720);
  context.fillStyle = "#073a31";
  context.font = "700 25px sans-serif";
  context.fillText("MUDFLAT GO! · 深圳湿地观察记录", 70, 880);
  context.font = "700 44px serif";
  context.fillText(observedSite.name, 70, 955);
  context.font = "400 27px sans-serif";
  context.fillStyle = "#557067";
  context.fillText(`${observedAt.toLocaleString("zh-CN", { dateStyle: "long", timeStyle: "short" })} · ${observedSite.habitat}`, 70, 1010);
  context.fillStyle = "#d8ded4";
  context.fillRect(70, 1065, 940, 2);
  context.font = "600 34px serif";
  context.fillStyle = "#173f36";
  wrapCanvasText(context, item.fact, 70, 1140, 900, 55, 3);
  context.fillStyle = "#073a31";
  context.fillRect(70, 1342, 940, 4);
  context.font = "600 24px sans-serif";
  context.fillStyle = "#557067";
  context.fillText("观察不是占有。保持距离，让真实生命继续生活。", 70, 1390);
  shareBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  if (shareObjectUrl) URL.revokeObjectURL(shareObjectUrl);
  shareObjectUrl = URL.createObjectURL(shareBlob);
  document.getElementById("sharePreview").src = shareObjectUrl;
  document.getElementById("shareModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function downloadShareCard() {
  if (!shareObjectUrl || !lastUnlockedItem) return;
  const link = document.createElement("a");
  link.href = shareObjectUrl;
  link.download = `Mudflat-Go-${lastUnlockedItem.name}-${todayKey()}.png`;
  link.click();
}

async function systemShareCard() {
  if (!shareBlob || !lastUnlockedItem) return;
  const file = new File([shareBlob], `Mudflat-Go-${lastUnlockedItem.name}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    const observedSite = sites[cardProgress(lastUnlockedItem).lastSite] || sites[activeSite];
    await navigator.share({ title: `我在${observedSite.name}发现了${lastUnlockedItem.name}`, files: [file] });
  } else downloadShareCard();
}

function closeShare() {
  document.getElementById("shareModal").hidden = true;
  const blockingViewOpen = !document.getElementById("unlockOverlay").hidden || !document.getElementById("speciesModal").hidden || !document.getElementById("siteView").hidden;
  document.body.style.overflow = blockingViewOpen ? "hidden" : "";
}

function toast(message) {
  const element = document.getElementById("toast");
  element.querySelector("span").textContent = message;
  element.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("is-visible"), 2800);
}

document.querySelectorAll("[data-view-target]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.viewTarget)));
document.querySelectorAll("[data-draw-count]").forEach(button => button.addEventListener("click", () => drawBlindBoxes(Number(button.dataset.drawCount))));
document.querySelectorAll("[data-pool-id]").forEach(button => button.addEventListener("click", () => selectBlindBoxPool(button.dataset.poolId)));
document.getElementById("blindBoxCabinetPrev").addEventListener("click", () => { blindBoxCabinetPage -= 1; renderBlindBoxCollection(); });
document.getElementById("blindBoxCabinetNext").addEventListener("click", () => { blindBoxCabinetPage += 1; renderBlindBoxCollection(); });
const blindBoxPanelTabs = [...document.querySelectorAll("[data-blind-box-panel-target]")];
blindBoxPanelTabs.forEach((button, index) => {
  button.addEventListener("click", () => selectBlindBoxPanel(button.dataset.blindBoxPanelTarget));
  button.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const targetIndex = event.key === "Home" ? 0 : event.key === "End" ? blindBoxPanelTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + blindBoxPanelTabs.length) % blindBoxPanelTabs.length;
    const target = blindBoxPanelTabs[targetIndex];
    target.focus();
    selectBlindBoxPanel(target.dataset.blindBoxPanelTarget);
  });
});
document.querySelector("[data-reveal-skip]")?.addEventListener("click", revealAllBlindBoxCards);
document.querySelectorAll("[data-model-src]").forEach(button => button.addEventListener("click", () => { initializeShowroom(); selectShowroomModel(button); }));
const showroomTabs = [...document.querySelectorAll("[data-model-src]")];
showroomTabs.forEach((button, index) => button.addEventListener("keydown", event => {
  let targetIndex = index;
  if (event.key === "ArrowRight") targetIndex = (index + 1) % showroomTabs.length;
  else if (event.key === "ArrowLeft") targetIndex = (index - 1 + showroomTabs.length) % showroomTabs.length;
  else if (event.key === "Home") targetIndex = 0;
  else if (event.key === "End") targetIndex = showroomTabs.length - 1;
  else return;
  event.preventDefault();
  const target = showroomTabs[targetIndex];
  target.focus();
  initializeShowroom();
  selectShowroomModel(target);
}));
const showroomObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  const schedule = window.requestIdleCallback || (callback => window.setTimeout(callback, 80));
  schedule(initializeShowroom, { timeout: 900 });
  showroomObserver.disconnect();
}, { rootMargin: "180px 0px" });
showroomObserver.observe(document.getElementById("blindBoxShowroom"));
const blindBoxModelViewer = document.getElementById("blindBoxModelViewer");
blindBoxModelViewer.addEventListener("progress", event => {
  const progress = `${Math.round(event.detail.totalProgress * 100)}%`;
  document.getElementById("showroomLoader").style.setProperty("--progress", progress);
  document.getElementById("showroomStatus").textContent = `载入模型 ${progress}`;
});
blindBoxModelViewer.addEventListener("load", () => {
  document.getElementById("showroomStatus").textContent = "拖动旋转 · 滚轮缩放";
  document.getElementById("showroomLoader").classList.add("is-loaded");
});
blindBoxModelViewer.addEventListener("error", () => { document.getElementById("showroomStatus").textContent = "模型加载失败，请刷新重试"; });
document.getElementById("toggleModelRotation").addEventListener("click", event => {
  const button = event.currentTarget;
  const active = !blindBoxModelViewer.hasAttribute("auto-rotate");
  blindBoxModelViewer.toggleAttribute("auto-rotate", active);
  button.classList.toggle("is-active", active);
});
document.getElementById("resetModelCamera").addEventListener("click", () => {
  blindBoxModelViewer.cameraOrbit = "auto auto auto";
  blindBoxModelViewer.fieldOfView = "auto";
  blindBoxModelViewer.jumpCameraToGoal?.();
});
document.getElementById("closeBlindBoxReveal").addEventListener("click", closeBlindBoxReveal);
document.getElementById("finishBlindBoxReveal").addEventListener("click", closeBlindBoxReveal);
document.querySelectorAll("[data-open-capture]").forEach(button => button.addEventListener("click", openCapture));
document.querySelectorAll("[data-open-site]").forEach(button => button.addEventListener("click", openSite));
document.querySelectorAll(".map-node").forEach(node => node.addEventListener("click", () => selectSite(Number(node.dataset.site))));
document.getElementById("siteStrip").addEventListener("click", event => { const button = event.target.closest("[data-strip-site]"); if (button) selectSite(Number(button.dataset.stripSite)); });
document.getElementById("enterSite").addEventListener("click", openSite);
document.getElementById("mapAction").addEventListener("click", () => {
  const site = sites[activeSite];
  const url = `https://uri.amap.com/marker?position=${site.lng},${site.lat}&name=${encodeURIComponent(site.name)}&coordinate=gaode&callnative=0`;
  window.open(url, "_blank", "noopener");
});
document.getElementById("closeSite").addEventListener("click", closeSite);
document.getElementById("startObservation").addEventListener("click", () => { closeSite(); openCapture(); });
document.getElementById("siteNavigation").addEventListener("click", () => document.getElementById("mapAction").click());
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
  document.getElementById("identifyButton").hidden = false;
  if (captureSource === "camera") startCamera();
  else setCaptureReady(true, "重新识别");
});
document.getElementById("closeSpecies").addEventListener("click", closeSpecies);
document.getElementById("acceptUnlock").addEventListener("click", closeUnlock);
document.getElementById("unlockShare").addEventListener("click", () => generateShareCard(lastUnlockedItem));
document.getElementById("speciesShare").addEventListener("click", event => {
  lastUnlockedItem = species.find(item => item.id === event.currentTarget.dataset.species);
  generateShareCard(lastUnlockedItem);
});
document.getElementById("closeShare").addEventListener("click", closeShare);
document.getElementById("downloadShare").addEventListener("click", downloadShareCard);
document.getElementById("systemShare").addEventListener("click", () => systemShareCard().catch(() => {}));
document.getElementById("claimSupply").addEventListener("click", claimSupply);
document.getElementById("alarmTime").addEventListener("change", event => {
  state.alarm.time = event.target.value || "07:00";
  saveState();
  scheduleBirdAlarm();
});
document.getElementById("alarmBird").addEventListener("change", event => {
  state.alarm.speciesId = event.target.value;
  saveState();
  scheduleBirdAlarm();
});
document.getElementById("previewAlarm").addEventListener("click", () => playBirdSound(state.alarm.speciesId));
document.getElementById("stopPreviewAlarm").addEventListener("click", stopBirdSound);
document.getElementById("alarmAudio").addEventListener("ended", stopBirdSound);
document.getElementById("toggleAlarm").addEventListener("click", async () => {
  if (state.alarm.enabled) {
    state.alarm.enabled = false;
    stopBirdSound();
    saveState();
    scheduleBirdAlarm();
    toast("鸟鸣闹钟已停用");
    return;
  }
  if (!state.alarm.speciesId) return;
  state.alarm.enabled = true;
  saveState();
  scheduleBirdAlarm();
  await playBirdSound(state.alarm.speciesId);
  toast("鸟鸣闹钟已启用；请保持页面运行");
});
document.getElementById("replayAlarm").addEventListener("click", () => playBirdSound(state.alarm.speciesId, true));
document.getElementById("stopAlarm").addEventListener("click", stopBirdSound);
document.getElementById("resetPanorama").addEventListener("click", () => {
  const frame = document.getElementById("mangrovePanoramaFrame");
  frame.src = "about:blank";
  requestAnimationFrame(() => { frame.src = frame.dataset.src; });
  toast("全景介绍已关闭");
});
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
    document.getElementById("cameraStatus").textContent = "相册照片 · 设备端识别";
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
document.getElementById("categoryFilter").addEventListener("change", event => { categoryFilter = event.target.value; renderAtlas(); });
document.getElementById("rarityFilter").addEventListener("change", event => { rarityFilter = event.target.value; renderAtlas(); });
document.querySelectorAll("[data-task-mode]").forEach(button => button.addEventListener("click", () => {
  taskMode = button.dataset.taskMode;
  document.querySelectorAll("[data-task-mode]").forEach(item => item.classList.toggle("is-active", item === button));
  updateUI();
}));
document.getElementById("posterButton").addEventListener("click", () => {
  const item = species.find(found);
  if (!item) { toast("先完成一次生态观察，再生成分享卡"); return; }
  lastUnlockedItem = item;
  generateShareCard(item);
});
document.getElementById("creditsButton").addEventListener("click", () => window.open("CREDITS.md", "_blank", "noopener"));
document.getElementById("resetButton").addEventListener("click", () => { stopBirdSound(); clearTimeout(alarmTimer); state = { ...initialState, siteProgress: emptySiteProgress(), collectedSpecies: [], cardProgress: {}, daily: { ...initialState.daily }, supply: { ...initialState.supply }, alarm: { ...initialState.alarm }, blindBoxCollection: {}, blindBoxFragments: 0, blindBoxPity: {}, blindBoxGuarantee: {} }; localStorage.removeItem(STORAGE_KEY); activeSite = 0; closeBlindBoxReveal(); updateUI(); toast("守护值已初始化，到账 300,000 积分"); });
document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => {
  if (event.target !== backdrop) return;
  if (backdrop.id === "speciesModal") closeSpecies();
  if (backdrop.id === "shareModal") closeShare();
}));
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCapture(); closeSite(); closeSpecies(); closeShare(); closeBlindBoxReveal(); } });
window.addEventListener("pagehide", stopCamera);
window.addEventListener("mudflat-state-changed", () => {
  state = readState();
  updateUI();
});

updateUI();
const launchParams = new URLSearchParams(window.location.search);
const launchPool = launchParams.get("pool");
if (launchPool) selectBlindBoxPool(launchPool); else updateBlindBoxPoolMeta();
const launchView = launchParams.get("view");
if (launchView && document.querySelector(`[data-view="${launchView}"]`)) navigate(launchView);
else {
  const idle = window.requestIdleCallback || (callback => window.setTimeout(callback, 1200));
  idle(() => ensureExploreRuntime(), { timeout: 1800 });
}
scheduleBirdAlarm();
icons();
