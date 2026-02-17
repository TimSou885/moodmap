# MoodMap — 階段交付與驗收總覽

> 本文件為 MoodMap 產品開發的階段總覽索引。  
> 每個階段皆有獨立的驗收標準文件，包含功能驗收、安全驗收、效能驗收、業務驗收與 Go/No-Go 決策機制。  
> **測試地區**：澳門與香港（關懷資源、種子用戶、密度與 DAU 目標均以兩地為準，見 [test-regions-macao-hongkong.md](test-regions-macao-hongkong.md)）。

---

## 全局安全規則

**所有階段共同遵守：**
- 每個版本上線前必須通過安全測試套件（有害內容攔截率 > 99%、誤攔率 < 5%、關懷資源推送正確性 100%）
- 未通過安全測試不得上線
- 安全防護功能自 Phase 0 即完整上線，後續每階段只增不減

---

## 階段總覽

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
Alpha       Beta        正式上線     成長         擴展         平台化
V0.1        V0.5        V1.0        V1.5        V2.0        V3.0
M1-3        M4-5        M6-7        M8-10       M11-14      M15+
50 人       500 人      DAU 5K      DAU 10K     MAU 300K    MAU 1M
```

| 階段 | 版本 | 時程 | 核心目標 | 用戶規模 | 文件 |
|------|------|------|---------|---------|------|
| Phase 0 | V0.1 Alpha | Month 1–3 | 核心體驗 + **完整安全防護** | 50 人內測 | [phase-0-alpha.md](phase-0-alpha.md) |
| Phase 1 | V0.5 Beta | Month 4–5 | 聚合引擎 + 即時推送 + 環境情緒層 | 500 人種子 | [phase-1-beta.md](phase-1-beta.md) |
| Phase 2 | V1.0 | Month 6–7 | 正式上架 + 留存機制 + Freemium | DAU 5,000 | [phase-2-launch.md](phase-2-launch.md) |
| Phase 3 | V1.5 | Month 8–10 | 病毒傳播(分享卡片) + 虛擬道具 | DAU 10,000 | [phase-3-growth.md](phase-3-growth.md) |
| Phase 4 | V2.0 | Month 11–14 | 多城市 + 品牌合作 + 匿名對話 + 多語言 | MAU 300,000 | [phase-4-expansion.md](phase-4-expansion.md) |
| Phase 5 | V3.0 | Month 15+ | B2B API + 國際市場 + AI 預測 + SOC 2 | MAU 1,000,000 | [phase-5-platform.md](phase-5-platform.md) |

---

## 安全審計時程表

| 審計編號 | 階段 | 類型 | 時程 |
|---------|------|------|------|
| #1 | Phase 1 (V0.5) | 外部心理健康專家審閱 | Month 5 |
| #2 | Phase 2 (V1.0) | 上線前全面安全測試 | Month 6 |
| #3 | Phase 3 (V1.5) | 季度安全審查 + 機制效能 | Month 10 |
| #4 | Phase 4 (V2.0) | 季度審查 + 外部年度審計 | Month 14 |
| #5 | Phase 5 (V3.0) | 半年度審查 + SOC 2 預審 | Month 16+ |

---

## 功能交付時程表

### P0 — 核心功能 (Phase 0 完成)
- [x] F-001 GPS 定位心情發文
- [x] F-002 心情氣泡瀏覽
- [x] F-003-L1 罐頭回應 / 表情回應
- [x] F-013 安全防護系統（四層審核 + 三級響應 + 攔截 + 瀏覽者保護）
- [x] F-014 關懷資源中心

### P0 — 聚合體驗 (Phase 1 完成)
- [ ] F-004 心情氣象區塊
- [ ] 聚合引擎 V1
- [ ] WebSocket 即時更新
- [ ] 環境情緒層

### P1 — 完整體驗 (Phase 2 完成)
- [ ] F-003-L2 匿名短回覆
- [ ] F-005 個人心情歷程
- [ ] F-006 心情通知
- [ ] F-007 匿名暱稱系統
- [ ] F-008 心情篩選器
- [ ] F-016 情緒日記連續紀錄
- [ ] F-017 情緒共鳴推薦
- [ ] Freemium 付費系統

### P1 — 成長功能 (Phase 3 完成)
- [ ] F-015 心情天氣分享卡片
- [ ] F-009 個人情緒趨勢報告
- [ ] 聚合引擎 V2
- [ ] 虛擬道具系統
- [ ] 「送溫暖」虛擬禮物
- [ ] 邀請機制

### P2 — 擴展功能 (Phase 4 完成)
- [ ] F-010 城市心情報告
- [ ] F-011 心情串聯（匿名對話）
- [ ] F-012 品牌情緒打卡站
- [ ] Pro 方案
- [ ] 多語言支援（日/英）

### P3 — 平台功能 (Phase 5 完成)
- [ ] B2B 數據 API
- [ ] 開發者生態
- [ ] 國際市場（東京/香港）
- [ ] AI 情緒趨勢預測

---

## 關鍵指標追蹤

| 指標 | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|------|---------|---------|---------|---------|---------|---------|
| 用戶規模 | 50 | 500 | DAU 5K | DAU 10K | MAU 300K | MAU 1M |
| 安全攔截率 | > 99% | > 99% | > 99% | > 99% | > 99% | > 99% |
| NLP recall | > 95% | > 95% | > 97% | > 98% | > 98% | > 98% |
| 紅色警戒 SLA | 30min | 30min | 30min | 30min | 30min | 30min |
| D7 留存 | 觀察 | 觀察 | > 30% | > 35% | > 35% | > 35% |
| D30 留存 | — | — | 觀察 | > 15% | > 20% | > 20% |
| 付費率 | — | — | 觀察 | > 3% | > 5% | > 7% |
| 總 MRR | — | — | 觀察 | NT$135K | NT$2.45M | NT$14.8M |

---

## 階段之間的進入條件

```
Phase 0 → Phase 1：
  必要：所有安全驗收通過 + 核心功能驗收通過
  
Phase 1 → Phase 2：
  必要：安全審計 #1 無高風險項 + 功能驗收通過 + 地圖密度達標

Phase 2 → Phase 3：
  必要：安全審計 #2 通過 + App Store 上架 + V1.0 穩定運行 ≥ 4 週

Phase 3 → Phase 4：
  必要：安全審計 #3 通過 + D7 留存 > 30% + 分享卡片功能上線

Phase 4 → Phase 5：
  必要：安全年度審計通過 + 澳門＋香港 DAU 穩定 > 8,000 + MAU > 200,000

所有階段共同：安全測試套件必須 100% 通過，否則不得進入下一階段
```

---

## 文件結構

```
docs/
├── 00-phase-index.md               ← 本文件（階段總覽索引）
├── test-regions-macao-hongkong.md  # 測試地區：澳門與香港（關懷資源、合規、密度）
├── phase-0-alpha.md                # Phase 0: Alpha 內測 (V0.1, M1-3)
├── phase-1-beta.md                 # Phase 1: Beta 公測 (V0.5, M4-5)
├── phase-2-launch.md               # Phase 2: 正式上線 (V1.0, M6-7)
├── phase-3-growth.md              # Phase 3: 成長版本 (V1.5, M8-10)
├── phase-4-expansion.md            # Phase 4: 擴展版本 (V2.0, M11-14)
└── phase-5-platform.md             # Phase 5: 平台化 (V3.0, M15+)
```

> 參照完整產品計劃書：[moodmap_plan.mb](../moodmap_plan.mb)
