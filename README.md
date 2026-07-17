# Mudflat Go! 滩涂大冒险

深圳湿地生态文旅打卡平台前端交互原型。项目使用原生 HTML、CSS 和 JavaScript，可直接部署到 Cloudflare Workers 或 Cloudflare Pages。

当前版本采用精简的探索主线：首页聚焦深圳六大湿地路线，保留 AI + GPS 模拟识别、九宫格生态图鉴、任务积分、点位解锁和浏览器本地进度。

## 探索闭环

- 六个深圳湿地点位按关卡连接，前两个默认开放，完成当前路线末端点位的三项观察后依次解锁后续路线。
- 进入点位先查看 4-5 张目标卡，再开始相机观察；点位任务由目标预览、真实 GPS 校验和有效 AI 识别组成。
- 有效识别会触发按 R、SR、SSR 区分的卡片解锁反馈；重复识别转化为单卡经验，卡片从 Lv.1 初遇成长至 Lv.5 守护。
- 图鉴支持收集状态、类别和稀有度筛选。每日任务固定为三项，并提供本地保存的七日生态补给。
- 已发现卡片可在浏览器生成 1080×1440 PNG 分享图，支持系统文件分享或直接下载。

## 浏览器端相机与识别

- 使用 `getUserMedia` 打开设备摄像头，优先选择后置镜头，支持切换镜头和相册照片。
- 识别完全在浏览器本地执行，照片和相机帧不会上传。
- 使用本地 TensorFlow.js + MobileNet V2 0.5 模型，当前可辅助识别琵鹭类、鹭类、招潮蟹和螺类。
- 通用模型不能可靠区分具体红树植物，也不能单独证明琵鹭一定是黑脸琵鹭；未达到阈值时会明确返回未确认，不能收集或获得积分。
- 相机和定位要求 HTTPS 或 `localhost` 安全上下文。Cloudflare Workers 部署地址满足 HTTPS 要求；拒绝定位时仍可识别和收集，但不会伪造点位抵达任务。
- 后续可使用 Teachable Machine 训练深圳湿地专用分类模型，替换通用 MobileNet 识别层。

## 本地预览

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173/`。

## Cloudflare Pages

- Framework preset: `None`
- Build command: 留空
- Build output directory: `/`
- Production branch: `main`

Cloudflare Workers 静态资产部署可直接使用仓库根目录作为资产目录，不需要构建命令。

图片来源与授权信息见 [CREDITS.md](CREDITS.md)。
