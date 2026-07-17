const STORAGE_KEY = "mudflat-go-demo-state-v1";

const defaultState = {
  points: 1280,
  capturedSpoonbill: false,
  quizCompleted: false,
};

const species = [
  {
    id: "kandelia",
    name: "秋茄",
    latin: "Kandelia obovata",
    rarity: "R",
    image: "assets/images/kandelia-obovata.jpg",
    found: true,
    description: "深圳红树林常见的先锋树种，能够在含盐、缺氧的潮间带扎根生长。",
    fact: "秋茄的种子会在母树上先萌发，成熟后像一支笔一样落入滩涂。",
  },
  {
    id: "fiddler-crab",
    name: "弧边招潮蟹",
    latin: "Austruca arcuata",
    rarity: "SR",
    image: "assets/images/fiddler-crab.jpg",
    found: true,
    description: "生活在潮间带泥滩的招潮蟹，雄蟹拥有一只特别醒目的大螯。",
    fact: "雄蟹挥动大螯的动作像在呼唤潮水，也用来求偶和守卫洞穴。",
  },
  {
    id: "spoonbill",
    name: "黑脸琵鹭",
    latin: "Platalea minor",
    rarity: "SSR",
    image: "assets/images/black-faced-spoonbill.jpg",
    found: "captured",
    description: "全球濒危的珍稀水鸟，因黑色面部和扁平如匙的长嘴而得名。",
    fact: "深圳湾是黑脸琵鹭的重要越冬地，退潮时最容易看到它们在浅水中觅食。",
  },
  {
    id: "egret",
    name: "白鹭",
    latin: "Egretta garzetta",
    rarity: "SR",
    image: "assets/images/little-egret.jpg",
    found: false,
    description: "体态轻盈的湿地鸟类，常在浅水和滩涂边缘缓慢寻找鱼虾。",
    fact: "观察白鹭时请保持距离，不追逐、不投喂，也不要进入它们的觅食区域。",
  },
  {
    id: "mudskipper",
    name: "弹涂鱼",
    latin: "Boleophthalmus pectinirostris",
    rarity: "SR",
    image: "assets/images/mangrove-wetland.jpg",
    found: false,
    description: "能在泥滩上活动的两栖型鱼类，是健康潮间带生态系统的重要成员。",
    fact: "弹涂鱼可以利用皮肤和口腔内壁辅助呼吸，因此能短时间离开水面。",
  },
  {
    id: "avicenna",
    name: "白骨壤",
    latin: "Avicennia marina",
    rarity: "R",
    image: "assets/images/shenzhen-mangrove.jpg",
    found: false,
    description: "耐盐能力很强的红树植物，根系能帮助稳定海岸并为小动物提供栖息空间。",
    fact: "白骨壤的呼吸根会从泥滩中向上伸出，像一支支短小的铅笔。",
  },
  {
    id: "kingfisher",
    name: "普通翠鸟",
    latin: "Alcedo atthis",
    rarity: "SR",
    image: "assets/images/mangrove-wetland.jpg",
    found: false,
    description: "常在水边停栖，以快速俯冲的方式捕捉小鱼。",
    fact: "它们鲜艳的蓝色并非来自蓝色色素，而是羽毛微观结构对光线的散射。",
  },
  {
    id: "mangrove-snail",
    name: "红树拟蟹守螺",
    latin: "Cerithidea rhizophorarum",
    rarity: "R",
    image: "assets/images/kandelia-obovata.jpg",
    found: false,
    description: "常见于红树林根部和泥滩表面的腹足类动物，以藻类和有机碎屑为食。",
    fact: "退潮后观察红树根部，常能发现它们缓慢移动留下的细小痕迹。",
  },
  {
    id: "night-heron",
    name: "夜鹭",
    latin: "Nycticorax nycticorax",
    rarity: "SSR",
    image: "assets/images/little-egret.jpg",
    found: false,
    description: "黄昏和夜间更活跃的鹭科鸟类，白天常安静停在水边树丛中。",
    fact: "幼年夜鹭有褐色纵纹，与成年鸟灰黑相间的羽色差别很大。",
  },
];

const sites = [
  { name: "福田红树林", badge: "红树林守护者", condition: "默认解锁", image: "assets/images/shenzhen-mangrove.jpg", feature: "黑脸琵鹭越冬栖息地" },
  { name: "深圳湾公园", badge: "湾区观鸟人", condition: "完成 1 个打卡", image: "assets/images/black-faced-spoonbill.jpg", feature: "城市滨海候鸟长廊" },
  { name: "西湾红树林", badge: "西湾追光者", condition: "完成 2 个打卡", image: "assets/images/mangrove-wetland.jpg", feature: "百亩红树林与海上日落" },
  { name: "海上田园", badge: "田园生态家", condition: "完成 3 个打卡", image: "assets/images/mangrove-wetland.jpg", feature: "鱼塘红树林与生态养殖" },
  { name: "坝光银叶树", badge: "古树探秘者", condition: "完成 4 个打卡", image: "assets/images/kandelia-obovata.jpg", feature: "深圳最古老红树群落" },
  { name: "东涌湿地", badge: "荒野探险家", condition: "完成 5 个打卡", image: "assets/images/shenzhen-mangrove.jpg", feature: "原始海岸与少人秘境" },
];

const quizQuestions = [
  {
    question: "黑脸琵鹭用什么方式在浅水中寻找食物？",
    options: ["潜入水底追逐鱼群", "左右摆动匙状长嘴扫食", "站在树枝上俯冲捕食"],
    correct: 1,
    note: "答对了！匙状长嘴能帮助它在浑水中感知并捕捉鱼虾。",
  },
  {
    question: "红树林对深圳海岸最重要的生态作用之一是什么？",
    options: ["让海水变成淡水", "固定海岸并为生物提供栖息地", "阻止所有潮水进入"],
    correct: 1,
    note: "答对了！密集根系能够消浪护岸，也形成了丰富的潮间带家园。",
  },
  {
    question: "在湿地观察候鸟时，下面哪种做法更合适？",
    options: ["保持距离并降低音量", "投喂食物吸引鸟群", "进入滩涂靠近巢区"],
    correct: 0,
    note: "答对了！远距离、低干扰观察是对野生动物最基本的尊重。",
  },
];

let state = loadState();
let activeFilter = "all";
let quizIndex = 0;
let mapScale = 1;
let recognitionTimers = [];
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function icon(name, size = 16) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } });
  }
}

function isFound(item) {
  return item.found === true || (item.found === "captured" && state.capturedSpoonbill);
}

function getFoundCount() {
  return species.filter(isFound).length;
}

function isSiteComplete() {
  return state.capturedSpoonbill && state.quizCompleted;
}

function getBadgeCount() {
  return 2 + (isSiteComplete() ? 1 : 0);
}

function formatNumber(number) {
  return new Intl.NumberFormat("zh-CN").format(number);
}

function navigate(viewName) {
  document.querySelectorAll(".app-view").forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
  });
  document.querySelectorAll(".mobile-nav button").forEach((button) => {
    if (button.dataset.viewTarget) {
      button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
    }
  });
  document.getElementById("profileMenu").hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCollection() {
  const grid = document.getElementById("collectionGrid");
  const visibleSpecies = species.filter((item) => {
    if (activeFilter === "found") return isFound(item);
    if (activeFilter === "locked") return !isFound(item);
    return true;
  });

  grid.innerHTML = visibleSpecies.map((item) => {
    const found = isFound(item);
    const rarityClass = `rarity-${item.rarity.toLowerCase()}`;
    return `
      <button class="collection-card ${found ? "is-found" : "is-locked"}" type="button" data-collection-id="${item.id}">
        <img src="${item.image}" alt="${found ? item.name : "尚未发现物种的剪影"}">
        ${found ? "" : `<span class="card-lock">${icon("lock")}</span>`}
        <span class="collection-card-copy">
          <span class="rarity ${rarityClass}">${item.rarity}</span>
          <h3>${found ? item.name : "等待发现"}</h3>
          <small>${found ? item.latin : "Complete field observation"}</small>
          <p>${found ? item.description : `线索：${item.name.length > 5 ? item.name.slice(0, 2) + "…" : item.name} · 前往湿地完成 AI 识别`}</p>
        </span>
      </button>`;
  }).join("");

  document.querySelectorAll("[data-collection-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const item = species.find((entry) => entry.id === card.dataset.collectionId);
      if (isFound(item)) openSpecies(item);
      else if (item.id === "spoonbill") openCapture();
      else showToast("继续探索对应湿地，完成 AI 识别即可点亮图鉴");
    });
  });
  refreshIcons();
}

function renderSites() {
  const list = document.getElementById("siteList");
  const unlockedCount = isSiteComplete() ? 2 : 1;
  list.innerHTML = sites.map((site, index) => `
    <button class="site-list-item ${index >= unlockedCount ? "is-locked" : ""} ${index === 0 ? "is-selected" : ""}" type="button" data-site-list-index="${index}">
      <span>${String(index + 1).padStart(2, "0")} ${index >= unlockedCount ? icon("lock", 11) : ""}</span>
      <strong>${site.name}</strong>
      <small>${site.feature}<br>${index >= unlockedCount ? site.condition : (index === 0 ? "当前探索点" : "下一站已解锁")}</small>
    </button>`).join("");

  document.querySelectorAll("[data-site-list-index]").forEach((button) => {
    button.addEventListener("click", () => selectSite(Number(button.dataset.siteListIndex)));
  });

  document.querySelectorAll("[data-site-index]").forEach((point, index) => {
    const unlocked = index < unlockedCount;
    point.classList.toggle("is-locked", !unlocked);
    point.classList.toggle("is-current", index === 0 && !isSiteComplete());
    point.classList.toggle("is-complete", index === 0 && isSiteComplete());
    const marker = point.querySelector("span");
    const status = point.querySelector("small");
    marker.innerHTML = unlocked ? (index === 0 && isSiteComplete() ? icon("check", 15) : String(index + 1).padStart(2, "0")) : icon("lock", 15);
    status.textContent = !unlocked ? sites[index].condition : (index === 0 && isSiteComplete() ? "已完成" : index === 0 ? "当前" : "已解锁");
  });
  refreshIcons();
}

function selectSite(index) {
  const unlockedCount = isSiteComplete() ? 2 : 1;
  const site = sites[index];
  document.querySelectorAll(".site-list-item").forEach((item, itemIndex) => item.classList.toggle("is-selected", itemIndex === index));

  const available = index < unlockedCount;
  const detail = document.getElementById("siteDetail");
  detail.innerHTML = `
    <img src="${site.image}" alt="${site.name}">
    <div class="site-detail-content">
      <span class="status-badge dark"><span class="pulse-dot"></span> ${available ? (index === 0 ? "当前可探索" : "下一站已解锁") : "尚未解锁"}</span>
      <p class="section-label">点位 ${String(index + 1).padStart(2, "0")} / 06</p>
      <h2>${site.name}</h2>
      <p>${site.feature}。完成点位任务可获得「${site.badge}」徽章。</p>
      <div class="site-facts">
        <span>${icon("bird")}<strong>${index === 0 ? "253" : "--"}</strong><small>生态记录</small></span>
        <span>${icon("footprints")}<strong>${index === 0 ? "1.8km" : "待开放"}</strong><small>推荐路线</small></span>
        <span>${icon("clock-3")}<strong>${index === 0 ? "2h" : "--"}</strong><small>观察窗口</small></span>
      </div>
      <div class="site-targets"><span>点位特色</span><div><b>${site.feature}</b><b>${site.badge}</b></div></div>
      <button class="button ${available ? "button-primary" : "button-outline"} full-width" type="button" ${available ? "data-site-action" : "disabled"}>${icon(available ? "navigation" : "lock")} ${available ? (index === 0 ? "开始探索" : "查看下一站") : site.condition}</button>
    </div>`;
  const action = detail.querySelector("[data-site-action]");
  if (action) {
    action.addEventListener("click", () => index === 0 ? openCapture() : showToast("深圳湾公园已解锁，线下导航功能等待地图 SDK 接入"));
  }
  refreshIcons();
}

function updateStateUI() {
  const missionCount = 1 + Number(state.capturedSpoonbill) + Number(state.quizCompleted);
  const completedSite = isSiteComplete();
  const foundCount = getFoundCount();
  const badgeCount = getBadgeCount();

  document.querySelectorAll("[data-points]").forEach((node) => { node.textContent = formatNumber(state.points); });
  document.querySelectorAll("[data-found-count]").forEach((node) => { node.textContent = foundCount; });
  document.querySelectorAll("[data-badge-count]").forEach((node) => { node.textContent = badgeCount; });
  document.getElementById("missionCompleted").textContent = missionCount;
  document.getElementById("missionProgress").style.width = `${Math.round(missionCount / 3 * 100)}%`;
  document.getElementById("siteStat").textContent = completedSite ? "1" : "0";
  document.getElementById("mapProgressText").textContent = `${completedSite ? 1 : 0} / 6`;
  document.getElementById("levelProgress").style.width = `${Math.min(100, state.points / 2000 * 100)}%`;
  document.getElementById("pointsNeeded").textContent = Math.max(0, 2000 - state.points);

  const captureMission = document.getElementById("captureMission");
  captureMission.classList.toggle("is-done", state.capturedSpoonbill);
  captureMission.querySelector(".mission-icon").innerHTML = state.capturedSpoonbill ? icon("check") : icon("camera");

  const quizMission = document.querySelector(".mission-list li:nth-child(3)");
  quizMission.classList.toggle("is-done", state.quizCompleted);
  quizMission.querySelector(".mission-icon").innerHTML = state.quizCompleted ? icon("check") : icon("circle-help");

  const quizButton = document.getElementById("quizButton");
  quizButton.innerHTML = state.quizCompleted ? `${icon("check")} 今日问答已完成` : `开始今日问答 ${icon("arrow-right")}`;
  quizButton.disabled = state.quizCompleted;

  const guardianBadge = document.getElementById("guardianBadge");
  guardianBadge.classList.toggle("is-earned", completedSite);

  const homeSpoonbillTile = document.getElementById("homeSpoonbillTile");
  if (state.capturedSpoonbill) {
    homeSpoonbillTile.classList.remove("locked-species");
    homeSpoonbillTile.removeAttribute("data-open-capture");
    homeSpoonbillTile.dataset.species = "spoonbill";
    homeSpoonbillTile.querySelector("img").classList.remove("locked-image");
    const mark = homeSpoonbillTile.querySelector(".lock-mark");
    if (mark) mark.remove();
    homeSpoonbillTile.querySelector(".species-copy").innerHTML = "<strong>黑脸琵鹭</strong><small>Platalea minor</small>";
  } else {
    homeSpoonbillTile.classList.add("locked-species");
    homeSpoonbillTile.setAttribute("data-open-capture", "");
    delete homeSpoonbillTile.dataset.species;
    homeSpoonbillTile.querySelector("img").classList.add("locked-image");
    if (!homeSpoonbillTile.querySelector(".lock-mark")) {
      homeSpoonbillTile.querySelector(".species-copy").insertAdjacentHTML("beforebegin", `<span class="lock-mark">${icon("scan-line")}</span>`);
    }
    homeSpoonbillTile.querySelector(".species-copy").innerHTML = "<strong>等待发现</strong><small>附近有珍稀鸟类踪迹</small>";
  }

  renderCollection();
  renderSites();
  refreshIcons();
}

function openCapture() {
  resetRecognition();
  document.getElementById("captureModal").hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("[data-close-capture]").focus();
}

function closeCapture() {
  recognitionTimers.forEach(clearTimeout);
  recognitionTimers = [];
  document.getElementById("captureModal").hidden = true;
  document.body.style.overflow = "";
}

function resetRecognition() {
  recognitionTimers.forEach(clearTimeout);
  recognitionTimers = [];
  document.getElementById("recognitionIdle").hidden = false;
  document.getElementById("recognitionLoading").hidden = true;
  document.getElementById("recognitionResult").hidden = true;
  document.getElementById("cameraStage").classList.remove("is-scanning");
  document.getElementById("cameraHelp").textContent = "将物种置于取景框中央";
  document.getElementById("featureStep").classList.remove("is-done");
  document.getElementById("locationStep").classList.remove("is-done");
  const collectButton = document.getElementById("collectButton");
  collectButton.disabled = state.capturedSpoonbill;
  collectButton.innerHTML = state.capturedSpoonbill ? `${icon("check")} 已收入图鉴` : `${icon("sparkles")} 收入图鉴 · +40 守护值`;
  refreshIcons();
}

function runRecognition() {
  document.getElementById("recognitionIdle").hidden = true;
  document.getElementById("recognitionLoading").hidden = false;
  document.getElementById("cameraStage").classList.add("is-scanning");
  document.getElementById("cameraHelp").textContent = "AI 正在扫描物种特征";

  recognitionTimers.push(setTimeout(() => {
    document.getElementById("featureStep").classList.add("is-done");
    document.getElementById("featureStep").innerHTML = `${icon("check")} 喙部与羽色特征匹配`;
    document.getElementById("locationStep").innerHTML = `${icon("loader-circle")} GPS 保护区校验`;
    refreshIcons();
  }, 750));

  recognitionTimers.push(setTimeout(() => {
    document.getElementById("locationStep").classList.add("is-done");
    document.getElementById("locationStep").innerHTML = `${icon("check")} 福田红树林位置有效`;
    refreshIcons();
  }, 1450));

  recognitionTimers.push(setTimeout(() => {
    document.getElementById("recognitionLoading").hidden = true;
    document.getElementById("recognitionResult").hidden = false;
    document.getElementById("cameraStage").classList.remove("is-scanning");
    document.getElementById("cameraHelp").textContent = "识别成功 · 黑脸琵鹭";
  }, 2200));
}

function collectSpoonbill() {
  if (state.capturedSpoonbill) return;
  state.capturedSpoonbill = true;
  state.points += 40;
  saveState();
  updateStateUI();
  document.getElementById("collectButton").disabled = true;
  document.getElementById("collectButton").innerHTML = `${icon("check")} 已收入图鉴`;
  refreshIcons();
  showToast("SSR 黑脸琵鹭已收入图鉴，守护值 +40");
  setTimeout(closeCapture, 650);
}

function openQuiz() {
  if (state.quizCompleted) {
    showToast("今日湿地问答已经完成");
    return;
  }
  quizIndex = 0;
  renderQuiz();
  document.getElementById("quizModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeQuiz() {
  document.getElementById("quizModal").hidden = true;
  document.body.style.overflow = "";
}

function renderQuiz() {
  const question = quizQuestions[quizIndex];
  document.querySelector("#quizModal .section-label").textContent = `福田红树林 · ${quizIndex + 1} / ${quizQuestions.length}`;
  const content = document.querySelector(".quiz-content");
  content.querySelector("p").textContent = question.question;
  const options = content.querySelector(".quiz-options");
  options.innerHTML = question.options.map((option, index) => `<button type="button" data-answer-index="${index}">${option}</button>`).join("");
  document.getElementById("quizFeedback").textContent = "";
  options.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answerIndex), button)));
}

function answerQuiz(answerIndex, button) {
  const question = quizQuestions[quizIndex];
  if (answerIndex !== question.correct) {
    button.classList.add("is-wrong");
    document.getElementById("quizFeedback").textContent = "再想一想：留意物种特征和无干扰观察原则。";
    return;
  }
  button.classList.add("is-correct");
  document.querySelectorAll(".quiz-options button").forEach((option) => { option.disabled = true; });
  document.getElementById("quizFeedback").textContent = question.note;

  setTimeout(() => {
    if (quizIndex < quizQuestions.length - 1) {
      quizIndex += 1;
      renderQuiz();
      return;
    }
    state.quizCompleted = true;
    state.points += 30;
    saveState();
    updateStateUI();
    closeQuiz();
    showToast("今日问答完成，深圳湾公园已解锁，守护值 +30");
  }, 850);
}

function openSpecies(item) {
  const modal = document.getElementById("speciesModal");
  document.getElementById("speciesModalImage").src = item.image;
  document.getElementById("speciesModalImage").alt = item.name;
  const rarity = document.getElementById("speciesModalRarity");
  rarity.textContent = item.rarity;
  rarity.className = `rarity rarity-${item.rarity.toLowerCase()}`;
  document.getElementById("speciesModalLatin").textContent = item.latin;
  document.getElementById("speciesTitle").textContent = item.name;
  document.getElementById("speciesModalDescription").textContent = item.description;
  document.getElementById("speciesModalFact").textContent = item.fact;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSpecies() {
  document.getElementById("speciesModal").hidden = true;
  document.body.style.overflow = "";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.querySelector("span").textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function showCredits() {
  document.getElementById("profileMenu").hidden = true;
  showToast("图片来自 Wikimedia Commons，作者与 CC 授权信息已记录在项目说明中");
}

function attachEvents() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.viewTarget));
  });

  document.querySelectorAll("[data-open-capture]").forEach((button) => button.addEventListener("click", () => {
    const item = species.find((entry) => entry.id === button.dataset.species);
    if (item && isFound(item)) openSpecies(item);
    else openCapture();
  }));
  document.querySelectorAll("[data-close-capture]").forEach((button) => button.addEventListener("click", closeCapture));
  document.querySelectorAll("[data-close-quiz]").forEach((button) => button.addEventListener("click", closeQuiz));
  document.querySelectorAll("[data-close-species]").forEach((button) => button.addEventListener("click", closeSpecies));

  document.getElementById("identifyButton").addEventListener("click", runRecognition);
  document.getElementById("collectButton").addEventListener("click", collectSpoonbill);
  document.getElementById("quizButton").addEventListener("click", openQuiz);

  document.getElementById("photoInput").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const preview = document.getElementById("capturePreview");
    const previousUrl = preview.dataset.localUrl;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    preview.src = previewUrl;
    preview.dataset.localUrl = previewUrl;
    document.getElementById("cameraHelp").textContent = "照片仅在当前浏览器本地预览";
    showToast("照片已载入，不会上传到网络");
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderCollection();
    });
  });

  document.querySelectorAll("[data-species]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = species.find((entry) => entry.id === button.dataset.species);
      if (item && isFound(item)) openSpecies(item);
    });
  });

  document.querySelectorAll("[data-site-index]").forEach((point) => {
    point.addEventListener("click", () => selectSite(Number(point.dataset.siteIndex)));
  });

  document.getElementById("zoomIn").addEventListener("click", () => {
    mapScale = Math.min(1.3, mapScale + .1);
    document.getElementById("routeMap").style.transform = `scale(${mapScale})`;
  });
  document.getElementById("zoomOut").addEventListener("click", () => {
    mapScale = Math.max(.9, mapScale - .1);
    document.getElementById("routeMap").style.transform = `scale(${mapScale})`;
  });

  document.getElementById("profileButton").addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = document.getElementById("profileMenu");
    menu.hidden = !menu.hidden;
  });
  document.querySelector("[data-open-menu]").addEventListener("click", () => {
    const menu = document.getElementById("profileMenu");
    menu.hidden = !menu.hidden;
  });
  document.getElementById("resetDemo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState };
    updateStateUI();
    document.getElementById("profileMenu").hidden = true;
    showToast("演示进度已重置");
  });
  document.getElementById("creditsButton").addEventListener("click", showCredits);
  document.getElementById("sharePoster").addEventListener("click", () => showToast("成就海报预览已准备，正式版将接入微信分享"));

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target !== backdrop) return;
      if (backdrop.id === "captureModal") closeCapture();
      if (backdrop.id === "quizModal") closeQuiz();
      if (backdrop.id === "speciesModal") closeSpecies();
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#profileMenu") && !event.target.closest("#profileButton") && !event.target.closest("[data-open-menu]")) {
      document.getElementById("profileMenu").hidden = true;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeCapture();
    closeQuiz();
    closeSpecies();
    document.getElementById("profileMenu").hidden = true;
  });
}

renderCollection();
renderSites();
attachEvents();
updateStateUI();
refreshIcons();
