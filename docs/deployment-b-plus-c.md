# 部署：B + C（免費/低價託管 + Cloudflare 代理）

本文件說明如何以 **B（Neon + Upstash + Railway）** 託管後端，並以 **C（Cloudflare）** 掛在前方做 DNS、代理與 DDoS 防護。

---

## 架構概覽

```
用戶 → Cloudflare (DNS + Proxy + DDoS) → Railway (Node API)
                                          ↓
                                    Neon (Postgres+PostGIS)
                                    Upstash (Redis)
```

- **Cloudflare**：免費方案，負責網域、SSL、代理、防護。
- **Railway**：免費額度約 $5/月，跑 Node 後端（或改用 Render 免費方案）。
- **Neon**：免費方案 Postgres（含 PostGIS）。
- **Upstash**：免費方案 Redis。

---

## 一、Neon（Postgres + PostGIS）

**詳細圖文步驟**：見 [Neon 註冊流程](neon-signup-flow.md)。

簡述：

1. 前往 **[https://console.neon.tech/signup](https://console.neon.tech/signup)**，用 **GitHub / Google / Email** 註冊（免信用卡）。
2. 登入後建立一個 **Project**（名稱如 `moodmap`，選 Region），會自動有 **production** 分支與 **neondb** 資料庫。
3. 在專案 **Dashboard** 點 **「Connect」**，在彈出的 **「Connect to your database」** 視窗裡複製連線字串（預設即為 Pooled，主機名含 `-pooler`；若有「Connection pooling」開關請保持開啟）。例如：
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Neon 預設不帶 PostGIS。到 **SQL Editor** 執行：
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
4. 在本機執行遷移（使用 Neon 的連線字串）：
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
   或把 `DATABASE_URL` 寫進 `.env` 再執行 `npm run db:migrate`。

**注意**：Neon 免費方案有儲存與計算用量限制，Alpha 階段通常足夠。

---

## 二、Upstash（Redis）

1. 前往 [upstash.com](https://upstash.com) 註冊，建立 **Redis** 資料庫（選免費方案）。
2. 在 Console 取得 **REST URL** 或 **Redis URL**。  
   本專案使用 `ioredis`，請用 **Redis URL**（格式如 `rediss://default:xxx@xxx.upstash.io:6379`）。
3. 將此 URL 設為環境變數 `REDIS_URL`。

**注意**：Upstash 免費額度有請求數上限，Phase 0 快取用量低，一般不會超。

---

## 三、Railway（Node 後端）

**逐步說明**：詳見 [railway-deploy.md](railway-deploy.md)。

1. 前往 [railway.app](https://railway.app) 註冊，用 GitHub 登入。
2. **New Project** → **Deploy from GitHub repo**，選擇本專案 repo。
3. 若專案沒有 `Dockerfile`，Railway 會用 Nixpacks 建置；若有 `Dockerfile`，會用 Docker 建置。建議使用專案內 `Dockerfile`（見下方）。
4. 在 Railway 專案中設定 **Variables**：
   | 變數 | 說明 |
   |------|------|
   | `NODE_ENV` | `production` |
   | `PORT` | Railway 會自動注入，可不設 |
   | `DATABASE_URL` | Neon 的 Pooled connection 字串 |
   | `REDIS_URL` | Upstash Redis URL |
   | `JWT_SECRET` | 至少 32 字元隨機字串（勿與本機相同） |
   | `MOOD_RATE_LIMIT_PER_HOUR` | 選填，預設 3 |
   | `MOOD_EXPIRY_HOURS` | 選填，預設 24 |
5. 部署完成後，Railway 會給一個網址，例如 `https://moodmap-production-xxx.up.railway.app`。先記下此網址，下一步給 Cloudflare 用。

**替代**：若改用 **Render**，步驟類似：Connect repo → Web Service → 建置指令 `npm install && npm run build`，啟動指令 `npm start`，並在 Environment 設定同上變數。

---

## 四、Cloudflare（C：代理 + DNS）

1. 前往 [dash.cloudflare.com](https://dash.cloudflare.com)，新增一個 **網站**（若還沒有網域，可先跳過此步，直接用 Railway 網址對外）。
2. 若你有網域（例如 `moodmap.app`）：
   - 在 Cloudflare 加入該網域，依指示將 NS 指到 Cloudflare。
   - 在 **DNS** 新增一筆 **A** 或 **CNAME**：
     - 類型：**CNAME**
     - 名稱：`api`（則 API 網址為 `https://api.moodmap.app`）或 `@`（根網域）
     - 目標：Railway 給的 hostname，例如 `moodmap-production-xxx.up.railway.app`
     - **Proxy status**：設為 **Proxied**（橙色雲），流量才會經 Cloudflare。
   - 儲存後，SSL 會由 Cloudflare 自動處理（Full 或 Full strict 皆可，因 Railway 多為 HTTPS）。
3. 若暫時沒有網域：可直接使用 Railway 的 HTTPS 網址，不經過 Cloudflare；之後有網域再在 Cloudflare 加 DNS 並改為 Proxied。

**建議**：在 Cloudflare **Security** 可開啟「Under Attack Mode」以外的適當防護等級，並在 **Rules** 視需要設定 WAF 或 rate limit。

---

## 五、本專案已配合 B+C 的改動

- **Neon**：`src/db/index.ts` 在偵測到 `neon.tech` 或 `NODE_ENV=production` 時會啟用 SSL 連線。
- **Cloudflare**：`src/app.ts` 會讀取 `CF-Connecting-IP` / `X-Forwarded-For` 作為請求的 `request.ip`，方便日後紀錄或限流。
- **環境變數**：`.env.example` 已註明 Neon / Upstash 的範例格式；生產環境請在 Railway（或 Render）後台設定，勿提交至版控。

---

## 六、部署後檢查

1. **健康檢查**：  
   `GET https://你的API網址/v1/mood-tags`  
   應回傳 200 與心情標籤列表（無需 token）。
2. **關懷資源**：  
   `GET https://你的API網址/v1/care-resources?lat=22.2&lng=113.55`  
   應回傳澳門熱線。
3. **匿名註冊**：  
   `POST https://你的API網址/v1/auth/anonymous`  
   body: `{"device_fingerprint":"test-device"}`  
   應回傳 201 與 `token`、`user`。
4. **發文**：  
   使用上一步的 token，`POST /v1/moods`（content, mood_tag, latitude, longitude, precision_level）應回傳 201。

若以上皆正常，即完成 B+C 部署。
