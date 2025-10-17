# TextBricks 大檔案拆分計劃（方案 4）

> **創建日期**：2025-10-17
> **狀態**：🚧 執行中
> **命名規範**：Templates Panel（模板面板）vs Manager（管理器）

---

## 📊 命名規範確立

### 兩個核心視圖的明確定義：

1. **Templates Panel（模板面板）** - 主視窗側邊欄
   - 檔案：`templates-panel.js`（原 main.js）
   - 功能：日常模板瀏覽、插入和使用
   - 位置：VS Code 活動欄中的 TextBricks 視圖

2. **Manager（管理器）** - 管理介面
   - 檔案：`manager.js`（原 textbricks-manager.js）
   - 功能：模板系統的完整管理和配置
   - 位置：點擊齒輪圖標打開的獨立 Panel

---

## 🎯 拆分策略

### **Phase 1: manager.js 拆分** (5,187 行 → 模組化)

#### 目標目錄結構：

```
assets/js/manager/
├── manager.js                      (~528 行) - 主協調器 ✅
├── core/
│   ├── state-manager.js            (~300 行) - 狀態管理 ✅
│   ├── message-handler.js          (~400 行) - 消息路由 ✅
│   └── event-coordinator.js        (~368 行) - 事件協調器 ✅
├── ui/
│   ├── modal-manager.js            (~500 行) - 模態框系統 ✅
│   ├── form-generator.js           (~600 行) - 表單生成 ✅
│   └── renderers/
│       ├── overview-renderer.js    (~300 行) - 總覽頁渲染 ✅
│       ├── stats-renderer.js       (~400 行) - 統計頁渲染 ✅
│       ├── favorites-renderer.js   (~300 行) - 收藏頁渲染 ✅
│       ├── content-renderer.js     (~500 行) - 內容管理渲染 ✅
│       ├── languages-renderer.js   (~200 行) - 語言頁渲染 ✅
│       └── settings-renderer.js    (~300 行) - 設定頁渲染 ✅
├── handlers/
│   ├── template-handlers.js        (~400 行) - 模板操作 ✅
│   ├── topic-handlers.js           (~400 行) - 主題操作 ✅
│   ├── favorites-handlers.js       (~200 行) - 收藏操作 ✅
│   ├── link-handlers.js            (~150 行) - 連結操作 ✅
│   ├── context-menu-handler.js     (~334 行) - 右鍵選單 ✅
│   ├── tree-navigation-handler.js  (~242 行) - 樹狀導航 ✅
│   ├── documentation-handler.js    (~362 行) - 文檔處理 ✅
│   └── button-handler.js           (~287 行) - 按鈕處理 ✅
└── utils/
    ├── data-helpers.js             (~300 行) - 資料查找 ✅
    └── path-helpers.js             (~200 行) - 路徑處理 ✅
```

---

### **Phase 2: templates-panel.js 拆分** (1,505 行 → 模組化)

#### 目標目錄結構：

```
assets/js/templates-panel/
├── templates-panel.js           (~350 行) - 主協調器
├── drag-drop-handler.js         (~400 行) - 拖放系統
├── tooltip-manager.js           (~400 行) - 工具提示
├── navigation-handler.js        (~300 行) - 導航邏輯
└── panel-event-handlers.js      (~150 行) - 面板事件
```

---

### **Phase 3: ManagerWebviewProvider.ts 拆分** (2,088 行 → 模組化)

#### 目標目錄結構：

```
packages/vscode/src/providers/manager/
├── ManagerWebviewProvider.ts       (~450 行) - 主 Provider
├── actions/
│   ├── TemplateActions.ts          (~300 行) - 模板 CRUD
│   ├── TopicActions.ts             (~300 行) - 主題 CRUD
│   ├── LanguageActions.ts          (~200 行) - 語言管理
│   ├── LinkActions.ts              (~300 行) - 連結管理
│   ├── ScopeActions.ts             (~300 行) - Scope 管理
│   ├── SettingsActions.ts          (~300 行) - 資料位置設定
│   └── ImportExportActions.ts      (~200 行) - 匯入匯出
└── ManagerMessageHandler.ts        (~350 行) - 消息路由
```

---

### **Phase 4: TemplateWebviewProvider.ts 拆分** (1,410 行 → 模組化)

#### 目標目錄結構：

```
packages/vscode/src/providers/template/
├── TemplateWebviewProvider.ts      (~450 行) - 主 Provider
├── actions/
│   ├── InsertActions.ts            (~300 行) - 插入邏輯
│   └── FavoriteActions.ts          (~150 行) - 收藏操作
├── TemplateMessageHandler.ts       (~300 行) - 消息路由
└── TemplateHtmlGenerator.ts        (~400 行) - HTML 生成
```

---

## 📋 詳細實施步驟

### **Step 1: Manager 拆分** (6-8 小時)

**1.1 建立目錄結構** ✅
```bash
mkdir -p assets/js/manager/{core,ui/renderers,handlers,utils}
```

**1.2 提取渲染器模組**（優先）✅
- [x] overview-renderer.js - 總覽頁渲染
- [x] stats-renderer.js - 統計頁渲染
- [x] favorites-renderer.js - 收藏頁渲染
- [x] content-renderer.js - 內容管理渲染
- [x] languages-renderer.js - 語言頁渲染
- [x] settings-renderer.js - 設定頁渲染

**1.3 提取事件處理器** ✅
- [x] template-handlers.js - 模板 CRUD 事件
- [x] topic-handlers.js - 主題 CRUD 事件
- [x] favorites-handlers.js - 收藏操作事件
- [x] link-handlers.js - 連結管理事件
- [x] context-menu-handler.js - 右鍵選單處理
- [x] tree-navigation-handler.js - 樹狀導航輔助
- [x] documentation-handler.js - 文檔處理邏輯
- [x] button-handler.js - 按鈕點擊處理

**1.4 提取 UI 管理器** ✅
- [x] modal-manager.js - 模態框系統
- [x] form-generator.js - 表單生成邏輯

**1.5 提取核心模組** ✅
- [x] state-manager.js - 狀態管理
- [x] message-handler.js - 消息路由
- [x] event-coordinator.js - 事件協調器
- [x] data-helpers.js - 資料查找工具
- [x] path-helpers.js - 路徑處理工具

**1.6 重構主文件** ✅
- [x] 精簡 manager.js 主協調器 (1,314 → 528 行)
- [x] 實現模組導入和初始化
- [x] 更新 HTML 模板添加新模組引用
- [x] 語法驗證通過（所有模組）

**Step 1 完成總結**：
- ✅ 創建 21 個模組化檔案
- ✅ Manager.js 從 1,314 行縮減至 528 行（-59.8%）
- ✅ 所有模組語法驗證通過
- ✅ 修復連結點擊行為問題（添加「前往目標」功能）
- ✅ 完整的 Context Injection 架構實現

---

### **Step 2: Templates Panel 拆分** (3-4 小時)

**2.1 建立目錄結構**
```bash
mkdir -p assets/js/templates-panel
```

**2.2 提取模組**
- [ ] drag-drop-handler.js - 拖放系統
- [ ] tooltip-manager.js - 工具提示管理
- [ ] navigation-handler.js - 導航處理
- [ ] panel-event-handlers.js - 面板事件

**2.3 重構主文件**
- [ ] 創建 templates-panel.js 主協調器
- [ ] 實現模組導入
- [ ] 測試功能

**2.4 更新引用**
- [ ] 更新 WebviewProvider.ts 中的 script 引用
- [ ] 測試編譯

---

### **Step 3: ManagerWebviewProvider 拆分** (4-5 小時)

**3.1 建立目錄結構**
```bash
mkdir -p packages/vscode/src/providers/manager/actions
```

**3.2 提取 Actions**
- [ ] TemplateActions.ts
- [ ] TopicActions.ts
- [ ] ScopeActions.ts
- [ ] LanguageActions.ts
- [ ] LinkActions.ts
- [ ] SettingsActions.ts
- [ ] ImportExportActions.ts

**3.3 創建消息處理器**
- [ ] ManagerMessageHandler.ts

**3.4 重構主 Provider**
- [ ] 簡化為協調器
- [ ] 測試功能

---

### **Step 4: TemplateWebviewProvider 拆分** (3-4 小時)

**4.1 建立目錄結構**
```bash
mkdir -p packages/vscode/src/providers/template/actions
```

**4.2 提取模組**
- [ ] InsertActions.ts
- [ ] FavoriteActions.ts
- [ ] TemplateMessageHandler.ts
- [ ] TemplateHtmlGenerator.ts

**4.3 重構主 Provider**
- [ ] 簡化為協調器
- [ ] 測試功能

---

## 📁 最終目錄結構總覽

```
TextBricks/
├── assets/js/
│   ├── templates-panel/              # 模板面板（原 main.js）
│   │   ├── templates-panel.js        (~350 行) ⭐ 主文件
│   │   ├── drag-drop-handler.js      (~400 行)
│   │   ├── tooltip-manager.js        (~400 行)
│   │   ├── navigation-handler.js     (~300 行)
│   │   └── panel-event-handlers.js   (~150 行)
│   ├── manager/                      # 管理器（原 textbricks-manager.js）
│   │   ├── manager.js                (~500 行) ⭐ 主文件
│   │   ├── core/
│   │   │   ├── state-manager.js      (~300 行)
│   │   │   └── message-handler.js    (~400 行)
│   │   ├── ui/
│   │   │   ├── modal-manager.js      (~500 行)
│   │   │   ├── form-generator.js     (~600 行)
│   │   │   └── renderers/            (5 個檔案)
│   │   ├── handlers/                 (4 個檔案)
│   │   └── utils/                    (2 個檔案)
│   └── common/                       # 共享工具
└── packages/vscode/src/providers/
    ├── template/                     # 模板面板 Provider
    │   ├── TemplateWebviewProvider.ts (~450 行) ⭐
    │   ├── actions/
    │   ├── TemplateMessageHandler.ts
    │   └── TemplateHtmlGenerator.ts
    └── manager/                      # 管理器 Provider
        ├── ManagerWebviewProvider.ts  (~450 行) ⭐
        ├── actions/                   (7 個檔案)
        └── ManagerMessageHandler.ts
```

---

## ✅ 驗收標準

### 功能完整性
- [ ] 所有原有功能正常運作
- [ ] Templates Panel 拖放、工具提示、導航正常
- [ ] Manager 所有 CRUD 操作正常
- [ ] 收藏和統計功能正常

### 代碼品質
- [ ] 所有 TypeScript 零編譯錯誤
- [ ] ESLint 零警告
- [x] 無單一檔案超過 600 行（Step 1 ✅）
- [x] Manager 主文件 528 行，接近 500 行目標（Step 1 ✅）

---

## 📊 執行進度

### Step 1: Manager 拆分 ✅
- **開始時間**：2025-10-17
- **實際完成**：2025-10-18
- **狀態**：✅ **已完成**
- **成果**：21 個模組，主文件縮減 59.8%

### Step 2: Templates Panel 拆分
- **狀態**：⏳ 待開始

---

## ⏱️ 時程規劃

| 階段 | 任務 | 預計時間 | 狀態 |
|------|------|----------|------|
| Week 1 | Step 1: Manager 拆分 | 6-8 小時 | ✅ 已完成 |
| Week 2 Day 1-2 | Step 2: Templates Panel 拆分 | 3-4 小時 | ⏳ 待開始 |
| Week 2 Day 3-5 | Step 3: ManagerProvider 拆分 | 4-5 小時 | ⏳ 待開始 |
| Week 3 Day 1-3 | Step 4: TemplateProvider 拆分 | 3-4 小時 | ⏳ 待開始 |
| Week 3 Day 4-5 | 測試與優化 | 2-3 小時 | ⏳ 待開始 |

**總預計時間：18-24 小時（約 2.5-3 週）**
**已完成：Step 1 (6-8 小時)**
