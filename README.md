# MoodMap — 心情地圖

Phase 0 (Alpha) 後端 API：匿名註冊、GPS 心情發文、附近氣泡瀏覽、罐頭回應、安全審核（Layer 1）、關懷資源（澳門/香港）。

---

## 快速開始

### 1. 環境需求

- Node.js >= 20
- Docker 與 Docker Compose（本地 Postgres + Redis）
- 或已安裝 PostgreSQL（含 PostGIS）與 Redis

### 2. 啟動資料庫與 Redis

若已安裝 Docker：

```bash
docker compose up -d
```

若未使用 Docker，請自行安裝 **PostgreSQL 16（含 PostGIS 擴展）** 與 **Redis 7**，並在 `.env` 設定 `DATABASE_URL` 與 `REDIS_URL`。

### 3. 環境變數

```bash
cp .env.example .env
# 編輯 .env，至少設定 JWT_SECRET（至少 32 字元）
```

### 4. 安裝依賴與執行遷移

```bash
npm install
npm run db:migrate
```

### 5. 啟動 API

```bash
npm run dev
```

API 預設為 `http://localhost:3000`。

---

## API 端點 (v1)

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | /v1/auth/anonymous | 匿名註冊（body: `device_fingerprint`），回傳 JWT |
| GET | /v1/mood-tags | 取得心情標籤列表（無需認證） |
| GET | /v1/care-resources?lat=&lng= | 依經緯度取得澳門/香港心理援助熱線（無需認證） |
| POST | /v1/moods | 發文（需 Bearer Token；body: content, mood_tag, latitude, longitude, precision_level） |
| GET | /v1/moods/nearby?lat=&lng=&radius=&limit= | 取得附近心情文 |
| GET | /v1/moods/:id | 取得單則心情文 |
| POST | /v1/moods/:id/reactions | 新增回應（body: reaction_type：hug/cheer/feel_you/together/hang_in 或 ❤️🫂💪😢🌈☀️） |
| GET | /v1/moods/:id/reactions | 取得該則心情的回應統計 |

認證：`Authorization: Bearer <token>`

---

## Phase 0 驗收檢查

- [ ] **A01** 匿名註冊：POST /v1/auth/anonymous 回傳 token 與 user
- [ ] **A02** 發文：POST /v1/moods 成功後地圖可取得該則（GET nearby）
- [ ] **A03** 心情標籤：GET /v1/mood-tags 回傳 12 種標籤
- [ ] **A04** 附近氣泡：GET /v1/moods/nearby 回傳 2km 內氣泡（含 lat/lng）
- [ ] **A05** 罐頭回應：POST /v1/moods/:id/reactions 成功，GET 該則 reaction_count +1
- [ ] **A06** 每人每則限一次：同一 user 對同一 mood 再 POST reaction 回 4004
- [ ] **A07** 發文限速：同一 user 1 小時內第 4 則 POST /moods 回 429
- [ ] **S12/S13** 關懷資源：GET /v1/care-resources?lat=22.2&lng=113.55 回傳澳門熱線；lat=22.3&lng=114.2 回傳香港熱線
- [ ] **S08** 硬性攔截：發文內容含明確違規關鍵字時回 4001 與 care_resources: true

詳細驗收見 [docs/phase-0-alpha.md](docs/phase-0-alpha.md)。

---

## 部署：B + C（免費託管 + Cloudflare）

若要以 **最低成本** 上線（Neon + Upstash + Railway + Cloudflare），請依下列文件操作：

**[docs/deployment-b-plus-c.md](docs/deployment-b-plus-c.md)** — 含 Neon / Upstash / Railway / Cloudflare 設定步驟與檢查清單。

- **B**：後端與 DB/Redis 用免費方案（Neon Postgres、Upstash Redis、Railway 或 Render 跑 Node）。
- **C**：網域掛在 Cloudflare，開啟 Proxy（橙色雲），取得 DDoS 防護與 SSL，無需改程式。

本專案已支援 Neon（SSL 連線）與 Cloudflare 代理（真實 IP 從 `CF-Connecting-IP` 讀取）。

---

## 專案結構

```
moodmap/
├── docs/                 # 階段與產品文件
│   └── deployment-b-plus-c.md   # B+C 部署步驟
├── migrations/           # SQL 遷移
├── src/
│   ├── config.ts
│   ├── care-resources.ts # F-014 澳門/香港熱線
│   ├── moderation/       # Layer 1 關鍵字審核
│   ├── db/
│   ├── services/
│   ├── routes/
│   ├── app.ts
│   └── index.ts
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 測試地區

澳門與香港。關懷資源依 GPS 回傳當地熱線，見 [docs/test-regions-macao-hongkong.md](docs/test-regions-macao-hongkong.md)。
