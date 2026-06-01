# 機構健康資料看板 — IA 架構文件

> v3.0 · 2026-05-24  
> 對應檔案：`index.html`（單頁應用，SPA）

---

## 1. 畫面清單

| ID | 畫面名稱 | HTML 元素 | `currentScreen` 值 |
|----|---------|-----------|-------------------|
| L  | 登入     | `#login-screen` | — |
| OV | 會員總覽 | `#member-overview` | `overview` |
| DT | 會員詳情 | `#member-detail` | `detail` |
| DB | 資料看板 | `#dashboard` | `dashboard` |
| PS | 姿態統計 | `#posture-screen` | `posture` |

---

## 2. 導航結構

### 2.1 底部導航（Bottom Nav，行動版顯示）

```
[ 👥 總覽 ]  [ 📊 資料 ]  [ 🏃 姿態 ]  [ ⚙️ 設定 ]
```

| 按鈕 | ID | 目標 | Active 條件 |
|------|-----|------|------------|
| 👥 總覽 | `bnav-overview` | `goScreen('overview')` | `overview` 或 `detail` |
| 📊 資料 | `bnav-data` | `goScreen('dashboard')` | `dashboard` |
| 🏃 姿態 | `bnav-posture` | `goScreen('posture')` | `posture` |
| ⚙️ 設定 | — | `openSidebar()` | 不 active |

> 設定按鈕開啟 Sidebar Drawer，不切換畫面，故無 active 狀態。

---

### 2.2 Sidebar Drawer（漢堡選單，左滑）

**導覽區**

| 項目 | ID | 目標 | Active 條件 |
|------|-----|------|------------|
| 🏠 會員總覽 | `snb-overview` | `goScreen('overview')` | `overview` 或 `detail` |
| 📅 日視圖 | `snb-day` | `goScreen('dashboard','day')` | `dashboard` + `day` |
| 📆 月視圖 | `snb-month` | `goScreen('dashboard','month')` | `dashboard` + `month` |
| 🔍 查詢日期 | — | `openSearch()` | — |
| 📝 醫護回報 | — | `openAnnotPanel()` | — |
| 🧘 動作姿態統計 | `snb-posture` | `goScreen('posture')` | `posture` |

**設定區**

| 項目 | 說明 |
|------|------|
| 🔤 調整字體 | `cycleFontSize()` |
| 自動更新間隔 | `<select>` 下拉，顯示倒計時 |

---

## 3. 畫面導航流程

### 3.1 主要流程

```
Login
  └─→ [登入成功] → OV（會員總覽）

OV（會員總覽）
  └─→ [點選會員卡] → DT（會員詳情）

DT（會員詳情）
  ├─→ [← 返回總覽] → OV
  ├─→ [📅 日視圖] → DB（day）
  ├─→ [📆 月視圖] → DB（month）
  └─→ [🧘 動作姿態統計] → PS

DB（資料看板）
  └─→ [← 返回總覽] → OV

PS（姿態統計）
  ├─→ [← 返回總覽] → OV
  └─→ [👤 查看詳情]（選定特定會員時顯示）→ DT
```

### 3.2 跨畫面快捷（Sidebar）

```
任何畫面
  ├─→ Sidebar → 🏠 會員總覽 → OV
  ├─→ Sidebar → 📅 日視圖 → DB（day）
  ├─→ Sidebar → 📆 月視圖 → DB（month）
  └─→ Sidebar → 🧘 動作姿態統計 → PS
```

---

## 4. 各畫面元件明細

### L — 登入畫面

- 帳號 / 密碼輸入
- 登入按鈕 → 驗證後進入 OV

---

### OV — 會員總覽

**Header**
- 標題：今日會員狀態
- 模式切換：今日會員 / 全部會員
- ⚖️ 比較模式按鈕
- 🔄 重新掃描按鈕

**掃描進度條**（載入中顯示）

**Member Grid**
- 每位會員一張卡片（今日異常指標以顏色標記）
- 點卡片 → 進入 DT

---

### DT — 會員詳情

**Header Row**
- ← 返回總覽
- 會員 ID + 副標題
- 🔄 同步資料
- 🔍 查詢
- 📥 匯出 CSV

**圖表卡片**
- 指標切換 tabs：❤️ 心跳 / 🩺 血壓 / 🌡 體溫 / 🫁 呼吸
- 時間範圍 tabs：今天 / 7 天 / 30 天 / 選日期
- 圖表本體（`#det-chart-body`）
  - 載入中：spinner + 📡 載入資料中…
  - 載入完成：SVG 折線圖

**數值摘要卡片**
- 心跳 avg/std/max/min
- 體溫 avg
- 血壓 avg
- 呼吸 avg

**快捷動作 4 格**
- 📅 日視圖 → DB(day)
- 📆 月視圖 → DB(month)
- 🧘 動作姿態統計 → PS
- 📋 匯出資料

**醫護回報紀錄**
- 顯示歷史 annotations
- ＋ 新增回報 → `openAnnotPanel()`

---

### DB — 資料看板

**Page Header**
- 標題：健康資料詳細紀錄
- 當前機構 / 會員 context label
- ← 返回總覽

**控制列**
- 視圖切換：📅 日視圖 / 📆 月視圖
- 日期導航：← 日期 → + 今天
- 🔍 查詢

**工具列**
- 資料筆數 badge
- 最後上傳時間
- 👤 篩選會員
- 🔄 重新整理

**趨勢面板**（日視圖下顯示）
- 心跳 + 呼吸趨勢 SVG

**資料表格**（分頁，6 小時 / 頁）

**Footer**：作者 / 版本 / GitHub

---

### PS — 姿態統計

**Header**
- 標題：🧘 動作姿態統計
- ← 返回總覽

**工具列**
- 👤 會員選擇（ALL / 個別）
- 📅 日期選擇
- 🔄 載入資料
- 📥 匯出數據
- 👤 查看詳情（僅選定特定會員時顯示）

**內容區** `#ps-content`
- 空狀態：請選擇條件後載入資料
- 載入後：姿態統計圖表 + 數據

---

## 5. 狀態變數對照

| 變數 | 值域 | 說明 |
|------|------|------|
| `currentScreen` | `overview` / `detail` / `dashboard` / `posture` | 當前畫面 |
| `currentView` | `day` / `month` | Dashboard 子視圖 |
| `detailMemberId` | string / null | 當前詳情會員 |
| `detailRange` | `today` / `7d` / `30d` / `custom` | 詳情時間範圍 |
| `currentTable` | `DC_data_base` 等 | 當前機構資料表 |
| `currentDate` | `YYYY-MM-DD` | 日視圖當前日期 |
| `overviewMode` | `today` / `all` | 總覽模式 |

---

## 6. 導航 Active 狀態規則

| `currentScreen` | Bottom Nav active | Sidebar active |
|-----------------|------------------|----------------|
| `overview` | 👥 總覽 | 🏠 會員總覽 |
| `detail` | 👥 總覽 | 🏠 會員總覽 |
| `dashboard` + `day` | 📊 資料 | 📅 日視圖 |
| `dashboard` + `month` | 📊 資料 | 📆 月視圖 |
| `posture` | 🏃 姿態 | 🧘 動作姿態統計 |

> Detail 畫面屬於「總覽」脈絡的子頁，因此 nav active 停在 👥 總覽，不另設獨立項。

---

## 7. 已完成的 IA 修正（本 session）

| # | 問題 | 修正 |
|---|------|------|
| 1 | 底部導航 4 項（日報/月報各佔一格）語意重複 | 合併為「📊 資料」，⚙️ 設定補上 |
| 2 | 進入 detail 畫面，nav 無位置感 | detail 時 nav active = 👥 總覽 |
| 3 | 姿態畫面無法直接跳到指定會員詳情 | 選定單一會員後顯示「👤 查看詳情」按鈕 |
| 4 | Sidebar active 未反映 detail 位置 | detail 時 sidebar active = 🏠 會員總覽 |
