# Mudflat Go! 滩涂大冒险

深圳湿地生态文旅打卡平台前端交互原型。项目使用原生 HTML、CSS 和 JavaScript，可直接部署到 Cloudflare Workers 或 Cloudflare Pages。

当前版本采用精简的探索主线：首页聚焦深圳六大湿地路线，保留 AI + GPS 模拟识别、九宫格生态图鉴、任务积分、点位解锁和浏览器本地进度。

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
