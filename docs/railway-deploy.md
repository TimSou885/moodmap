# 部署 MoodMap API 到 Railway

依下列步驟把後端部署到 Railway，之後可再掛 Cloudflare（見 [deployment-b-plus-c.md](deployment-b-plus-c.md)）。

---

## 前置準備

- [x] 程式已推到 **GitHub**（若還沒有：`git init` → 建 repo → `git remote add origin ...` → `git push -u origin main`）
- [x] 已有 **Neon** 連線字串（Pooled，含 `-pooler`）
- [x] （建議）已有 **Upstash Redis** 的 URL，否則需補建

---

## 一、登入 Railway

1. 開啟 **[railway.app](https://railway.app)**，點 **Login**。
2. 選擇 **Login with GitHub**，授權 Railway 存取你的 GitHub。

---

## 二、建立專案並從 GitHub 部署

1. 在 Railway 首頁點 **「New Project」**。
2. 選 **「Deploy from GitHub repo」**（或 **Configure GitHub App** 若首次需先連結 GitHub）。
3. 若被要求連結 GitHub：
   - 選 **Only select repositories**，勾選你的 MoodMap  repo（例如 `你的帳號/moodmap`），或選 **All repositories**。
   - 完成授權。
4. 回到 **New Project**，在列表中找到 **moodmap**（或你的 repo 名稱），點選。
5. 選 **「Deploy Now」** 或 **「Add variables first」**（建議先加變數再部署，見下一步）。

Railway 會建立一個 **Service**，並開始用專案裡的 **Dockerfile** 建置（若沒有 Dockerfile 會用 Nixpacks）。

---

## 三、設定環境變數（Variables）

1. 在專案裡點進剛建立的 **Service**（一個方塊）。
2. 點上方 **「Variables」** 分頁。
3. 點 **「+ New Variable」** 或 **「RAW Editor」**，加入下列變數：

| 變數名稱 | 值 | 必填 |
|----------|-----|------|
| `NODE_ENV` | `production` | 建議 |
| `DATABASE_URL` | Neon 的 Pooled 連線字串（整串貼上） | 必填 |
| `REDIS_URL` | Upstash Redis URL（如 `rediss://default:xxx@xxx.upstash.io:6379`） | 必填 * |
| `JWT_SECRET` | 至少 32 字元的隨機字串（可 [生成](https://www.random.org/strings/) 或 `openssl rand -hex 32`） | 必填 |
| `MOOD_RATE_LIMIT_PER_HOUR` | `3` | 選填 |
| `MOOD_EXPIRY_HOURS` | `24` | 選填 |

\* 若尚未建 Upstash，可先到 [upstash.com](https://upstash.com) 建立一個 Redis 資料庫，複製 **Redis URL** 貼到 `REDIS_URL`。

**注意**：`PORT` 不需手動設，Railway 會自動注入。

4. 儲存後，到 **「Deployments」** 分頁點 **「Redeploy」**（補上變數後一定要手動觸發一次重新部署，新的變數才會在執行時生效）。

**若出現 Invalid environment configuration**：  
若日誌出現 `Env diagnostic (keys only): { relevantKeys: [], hasDATABASE_URL: false, hasJWT_SECRET: false }`，代表**目前這個正在跑的 Service 沒有收到任何 DATABASE/JWT 變數**。請依序做：

1. 在 **同一個會噴這段錯誤的 Service** 裡，點 **Variables**（不是專案總覽的 Variables）。
2. 點 **+ New Variable**，新增兩筆（名稱一字不差）：  
   - 名稱 `DATABASE_URL`，值貼上 Neon 的 Pooled 連線字串。  
   - 名稱 `JWT_SECRET`，值貼上至少 32 字元的密鑰。
3. 儲存後，到 **Deployments** → 對最新部署點 **Redeploy**（或 ⋮ → Redeploy），等新部署跑完再測。

---

## 四、取得對外網址

1. 在該 Service 的 **「Settings」** 分頁，找到 **「Networking」** 或 **「Public Networking」**。
2. 點 **「Generate Domain」**（或 **Add a domain**），Railway 會產生一個網址，例如：
   ```text
   https://moodmap-production-xxxx.up.railway.app
   ```
3. 複製此網址，用來呼叫 API。

---

## 五、驗證部署

在瀏覽器或 PowerShell 測試（把網址換成你的 Railway 網址）：

1. **心情標籤**（免登入）  
   ```text
   https://你的Railway網址/v1/mood-tags
   ```
2. **關懷資源**  
   ```text
   https://你的Railway網址/v1/care-resources?lat=22.2&lng=113.55
   ```
3. **匿名註冊**（PowerShell）  
   ```powershell
   Invoke-RestMethod -Uri "https://你的Railway網址/v1/auth/anonymous" -Method POST -ContentType "application/json" -Body '{"device_fingerprint":"test-railway-1"}'
   ```
   應回傳 `data.token` 與 `data.user`。

4. **發文**（用上一步的 token，或執行 `.\scripts\test-post-mood.ps1` 時把裡面的 URL 改成 Railway 網址）。

若以上都正常，部署即完成。

---

## 六、之後：改網址、掛 Cloudflare

- **自訂網域**：在 Railway 同一個 Service 的 **Settings → Networking** 裡可 **Add custom domain**（例如 `api.moodmap.app`），依畫面指示到 DNS 加 CNAME 指到 Railway 給的 hostname。
- **前面掛 Cloudflare**：到 Cloudflare 加一筆 CNAME（名稱如 `api`，目標為 Railway 網址），Proxy 設為 **Proxied（橙色雲）**。詳見 [deployment-b-plus-c.md § 四、Cloudflare](deployment-b-plus-c.md#四cloudflarec代理--dns)。

---

## 常見問題

**建置失敗（Build failed）**  
- 確認專案根目錄有 `Dockerfile` 和 `package.json`，且 `npm run build` 在本機可成功。
- 到 **Deployments** 點進失敗的那次部署，看 **Build Logs** 錯誤訊息。

**啟動後馬上重啟或 503**  
- 多數是環境變數漏設：檢查 `DATABASE_URL`、`JWT_SECRET`、`REDIS_URL` 是否都有設且正確。
- 到 **Deployments** 點進該次部署，看 **Deploy Logs** 是否有連線或啟動錯誤。

**UNAUTHORIZED / 請先登入**  
- 請求需帶 `Authorization: Bearer <token>`，且 token 來自 `POST /v1/auth/anonymous` 回傳的 `data.token`。

**資料庫連線錯誤**  
- 確認 `DATABASE_URL` 是 Neon 的 **Pooled** 連線字串（主機名含 `-pooler`），且 Neon 已開 PostGIS（見 [neon-signup-flow.md](neon-signup-flow.md)）。
