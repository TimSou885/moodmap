# Neon 註冊流程

依下列步驟註冊 Neon 並取得 MoodMap 所需的 Postgres 連線字串。

---

## 1. 開啟註冊頁

- 直接開啟：**[https://console.neon.tech/signup](https://console.neon.tech/signup)**

---

## 2. 選擇註冊方式

任選一種登入／註冊：

| 方式 | 說明 |
|------|------|
| **GitHub** | 用 GitHub 帳號一鍵登入，適合開發者 |
| **Google** | 用 Google 帳號登入 |
| **Email** | 輸入 Email，Neon 會寄驗證信，點擊連結完成註冊 |

不需信用卡，免費方案即可開始。

---

## 3. 建立專案（Onboarding）

登入後會引導你建立第一個 **Project**：

1. **Project name**：可填 `moodmap` 或任意名稱。
2. **Region**：選離你或目標用戶較近的區域（例如 `Asia Pacific (Singapore)` 或 `US East`）。
3. **Postgres version**：維持預設（通常為 16）。
4. 點 **Create project**。

建立完成後會自動有一個 **production** 分支，以及預設資料庫 **neondb**。

---

## 4. 取得連線字串

1. 在 Neon 左側選你的 **Project**，進入 **Dashboard**（專案首頁）。
2. 點擊畫面上的 **「Connect」** 按鈕（通常在右上或卡片上）。
3. 會彈出 **「Connect to your database」** 視窗：
   - 選擇 **Branch**（預設 `main` 或 `production`）、**Database**（預設 `neondb`）、**Role**。
   - **預設給你的就是 Pooled 連線**（網址裡主機名會帶 `-pooler`，例如 `ep-xxx-pooler.region.aws.neon.tech`）。
   - 若視窗裡有 **「Connection pooling」** 開關，請保持 **開啟**（預設即為開啟）。
4. 在視窗中複製顯示的 **Connection string**，格式類似：
   ```text
   postgresql://使用者:密碼@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
   注意主機名有 **`-pooler`** 即為 Pooled 連線。
5. 將此字串設為本專案的 `DATABASE_URL`（可寫入 `.env`，勿提交到 Git）。

**若畫面上沒有「Pooled」或「Connection pooling」字樣**：  
只要在專案首頁（Dashboard）找 **「Connect」** 按鈕，點進去彈出視窗裡顯示的那一串就是連線字串；若網址裡主機名有 **`-pooler`**，就已是 Pooled 連線，可直接使用。

---

## 5. 啟用 PostGIS（MoodMap 必做）

Neon 預設沒有 PostGIS，需手動啟用：

1. 在 Neon Console 左側點 **SQL Editor**。
2. 確認上方已選 **production** 分支與 **neondb** 資料庫。
3. 在編輯器輸入並執行：
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
4. 執行成功後即可跑本專案的遷移。

---

## 6. 在本機跑資料庫遷移

在專案目錄執行（請替換為你的 Neon 連線字串）：

```bash
# 方式一：直接帶變數
DATABASE_URL="postgresql://使用者:密碼@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" npm run db:migrate

# 方式二：先寫入 .env 再執行
# 在 .env 設定 DATABASE_URL=postgresql://...
npm run db:migrate
```

遷移成功後，MoodMap 所需的表（users、moods、reactions、mood_tags、moderation_queue、reports）都會建立完成。

---

## 免費方案重點

- **不需綁卡**即可使用。
- 免費額度約：0.5 GB 儲存、一定 CU 時數，對 Phase 0 / 小流量通常足夠。
- 詳見：[Neon 定價](https://neon.tech/pricing)

---

## 下一步

- 將 `DATABASE_URL` 設到 **Railway**（或 Render）的環境變數，完成 B+C 後端部署。
- 完整步驟見 [deployment-b-plus-c.md](deployment-b-plus-c.md)。
