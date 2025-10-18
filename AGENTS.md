# TextBricks - AI Agents 參考文件

> 🤖 **給 AI 助手的上下文文件**
> 此文件包含當前項目狀態、架構資訊和開發指南，供 Claude Code 等 AI 助手參考。

## 📖 文檔導航

### 產品規格
- **[specs/PRD.md](./specs/PRD.md)** - 🎯 產品需求文檔（必讀）
  - 三形態理論（序列-結構-圖譜）
  - 產品定位和核心功能
  - 混合定位：學習+效率
  - 未來路線圖（v0.4 Blockly、v0.5 Node Flow、v1.0 社群+AI）

### 開發指南
- **[docs/TEMPLATE_GUIDE.md](./docs/TEMPLATE_GUIDE.md)** - 模板撰寫指南
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code 入口指南（指向本文件）

### 歷史記錄
- **[specs/REFACTORING_HISTORY.md](./specs/REFACTORING_HISTORY.md)** - v0.3.0 重構完整記錄
- **[specs/CODE_REVIEW_HISTORY.md](./specs/CODE_REVIEW_HISTORY.md)** - 代碼審查改進記錄
- **[specs/VERSION_HISTORY.md](./specs/VERSION_HISTORY.md)** - 完整版本變更歷史
- **[CHANGELOG.md](./CHANGELOG.md)** - 版本變更摘要

---

## 📋 產品概述

**TextBricks** - 多形態程式表達平台，專為程式設計學習和效率工具設計。

### 核心定位
- 🎯 **混合定位** - 學習工具 + 效率工具
- 🌐 **多平台支援** - VS Code (當前) → Vim/Web (規劃中)
- 🧩 **三形態理論** - 序列（模板）→ 結構（Blockly）→ 圖譜（Node Flow）
- 📚 **Scope 系統** - 信任/來源管理，非僅命名空間

### 當前版本
- **已發布**: v0.2.5
- **開發中**: v0.3.0
- **狀態**: 核心架構重構完成，進行檔案拆分優化

---

## 🎯 開發模式與原則

### Spec-Driven Development (SDD)

**原則**: 規格優先，代碼跟隨

**流程**:
1. **需求分析** → 更新/創建 `specs/PRD.md` 中的功能規格
2. **架構設計** → 在本文件記錄架構決策
3. **介面定義** → 先定義 TypeScript 介面和類型
4. **實作開發** → 根據規格實作功能
5. **文檔同步** → 更新相關文檔

**關鍵文件**:
- `specs/PRD.md` - 產品需求和功能規格（三形態理論、路線圖）
- `packages/shared/src/models/` - 數據模型定義
- `packages/core/src/interfaces/` - 平台介面定義

### Test-Driven Development (TDD)

**原則**: 測試先行，確保品質

**流程**:
1. **撰寫測試** → 先寫失敗的測試案例
2. **實作功能** → 實作最小可行代碼使測試通過
3. **重構優化** → 在測試保護下重構代碼
4. **持續驗證** → 確保所有測試持續通過

**測試結構**:
```
packages/
├── core/
│   ├── src/
│   └── __tests__/          # 核心邏輯測試
├── shared/
│   └── __tests__/          # 模型驗證測試
└── vscode/
    └── src/__tests__/      # VS Code 整合測試
```

**測試指令**:
```bash
npm test                    # 執行所有測試
npm test -- --coverage      # 生成覆蓋率報告
npm test -- --watch         # 監視模式
```

### 開發檢查清單

**新功能開發**:
- [ ] 更新 `specs/PRD.md` 功能規格
- [ ] 定義 TypeScript 介面
- [ ] 撰寫單元測試
- [ ] 實作核心邏輯
- [ ] 整合測試通過
- [ ] 更新 AGENTS.md 和 CHANGELOG.md

**Bug 修復**:
- [ ] 重現問題（撰寫失敗測試）
- [ ] 修復問題
- [ ] 確保測試通過
- [ ] 檢查回歸測試

**重構**:
- [ ] 確保測試覆蓋率足夠
- [ ] 小步重構
- [ ] 每步驗證測試通過
- [ ] 更新相關文檔

---

## 🏗️ 架構狀態

### Monorepo 結構

當前架構：平台無關核心 + 適配器模式

```
TextBricks/
├── packages/
│   ├── shared/              # 共享類型和模型
│   │   └── src/models/      # Template, Topic, Scope, Language
│   ├── core/                # 平台無關核心
│   │   ├── src/
│   │   │   ├── core/        # TextBricksEngine, SearchService, DocumentationService
│   │   │   ├── managers/    # TopicManager, ScopeManager
│   │   │   ├── repositories/ # TemplateRepository
│   │   │   ├── services/    # RecommendationService, DataPathService
│   │   │   └── interfaces/  # IPlatform, IEditor, IUI, IStorage
│   │   └── __tests__/
│   └── vscode/              # VS Code 適配器
│       ├── src/
│       │   ├── adapters/vscode/  # VSCodePlatform, VSCodeEditor, VSCodeUI
│       │   ├── providers/   # WebviewProvider, ManagerProvider, DocumentationProvider
│       │   └── services/    # CommandService
│       └── __tests__/
├── assets/                  # 前端資源（單一權威來源）
│   ├── icons/              # 擴展圖示
│   ├── css/
│   │   ├── common/         # variables.css, components.css
│   │   ├── templates-panel/
│   │   ├── manager-panel/
│   │   └── documentation-panel/
│   └── js/
│       ├── common/         # utils.js, card-templates.js, event-delegator.js
│       ├── templates-panel/  # 12 個模組
│       └── manager-panel/    # 21 個模組
└── data/local/             # 本地資料
    └── scope.json          # Scope 配置
```

### 核心服務

1. **TextBricksEngine** - 統一模板引擎 (~1,027 行)
2. **TopicManager** - 階層式主題管理
3. **ScopeManager** - Scope 和信任管理
4. **TemplateRepository** - 模板 CRUD (~370 行)
5. **RecommendationService** - 推薦演算法 (~107 行)
6. **DataPathService** - 平台無關資料路徑（單例）
7. **FormattingEngine** - 智慧縮排系統 (~272 行)

### 資料模型

- **Path-Based 識別** - 使用檔案系統路徑作為唯一識別
- **Template** - `{topicPath}/templates/{name}`
- **Topic** - `topic.json` 階層結構
- **Scope** - `scope.json` 集中管理 favorites 和 usage
- **ExtendedTemplate** - 包含 topicPath 等運行時屬性

---

## 📊 當前版本狀態 (v0.3.0)

**開發週期**: 2025-09-30 ~ 2025-11-30（預計）

### ✅ 已完成項目

**核心架構重構** (2025-09-30):
- ✅ Phase 1-6: 整合 TopicManager、提取 TemplateRepository、RecommendationService
- ✅ 統一 Topic 模型、DataPathService 單例化
- ✅ TextBricksEngine: 1,203 → 1,027 行 (-14.6%)

**UI 層重構** (2025-09-30 ~ 2025-10-01):
- ✅ UI Phase 1-5: 共享工具 (utils.js)、CSS 組件系統、卡片模板、事件系統
- ✅ 新增共享代碼：~1,290 行

**檔案拆分** (2025-10-17 ~ 2025-10-18):
- ✅ Step 1: Manager.js 拆分為 21 個模組 (5,753 → ~2,300 行)
- ✅ Step 2: Templates Panel 拆分為 12 個模組

**代碼品質** (2025-10-03 ~ 2025-10-09):
- ✅ 統一推薦系統管理
- ✅ console.log 替換為 platform logging
- ✅ 移除 any 類型，增強類型安全

### 🎯 待完成項目

**檔案拆分**:
- [ ] Step 3: ManagerWebviewProvider 拆分 (2,088 行 → 模組化)
- [ ] Step 4: TemplateWebviewProvider 拆分 (1,410 行 → 模組化)

**階層式主題系統** (v0.3.0 核心):
- [ ] topic.json 完整實現
- [ ] 階層導航和麵包屑
- [ ] 平台無關儲存（系統標準目錄）

詳細執行記錄請參考 [specs/REFACTORING_HISTORY.md](./specs/REFACTORING_HISTORY.md)

---

## 🚀 核心功能現狀

### VS Code 版本功能 (v0.2.5)

#### 核心功能
- ✅ **多語言支援** - C, Python, JavaScript 切換
- ✅ **彈性主題系統** - 自訂主題名稱（非固定層級）
- ✅ **智慧操作** - 點擊插入、拖曳插入、工具提示預覽
- ✅ **智慧縮排** - FormattingEngine 自動調整至游標位置
- ✅ **文檔系統** - Markdown 支援、互動式程式碼區塊

#### 進階功能
- ✅ **模板管理** - CRUD 操作、匯入匯出、批次處理
- ✅ **智慧推薦** - RecommendationService 基於使用頻率
- ✅ **收藏系統** - 模板、主題、連結的完整收藏功能
- ✅ **標籤式界面** - 推薦/最愛雙標籤切換
- ✅ **瀏覽歷史導航** - 前進/後退導航系統
- ✅ **麵包屑導航** - 階層路徑導航

#### 技術特性
- ✅ **TypeScript** - 完整類型安全
- ✅ **Webview UI** - 響應式設計
- ✅ **JSON 資料** - scope.json + topic.json 結構化儲存
- ✅ **Path-based** - 使用路徑識別，移除 ID 冗餘
- ✅ **測試框架** - Jest 單元測試

---

## 🛠️ 開發指南

### 技術棧

- **語言**: TypeScript 5.x (strict mode)
- **建置**: npm workspaces, TypeScript Project References
- **測試**: Jest
- **打包**: VS Code Extension API
- **前端**: Vanilla JS + CSS (無框架)

### 關鍵檔案位置

**核心邏輯**:
- `packages/core/src/core/TextBricksEngine.ts` - 主引擎
- `packages/core/src/managers/` - TopicManager, ScopeManager
- `packages/core/src/repositories/TemplateRepository.ts` - 模板 CRUD

**VS Code 整合**:
- `packages/vscode/src/extension.ts` - 擴展入口
- `packages/vscode/src/providers/` - Webview Providers
- `packages/vscode/src/adapters/vscode/` - VS Code 適配器

**前端 UI**:
- `assets/js/common/utils.js` - 共享工具函數
- `assets/js/templates-panel/` - Templates Panel 模組
- `assets/js/manager-panel/` - Manager Panel 模組
- `assets/css/common/` - 設計系統（variables, components）

**資料**:
- `data/local/scope.json` - Scope 配置
- `data/local/{language}/topic.json` - 主題配置
- `data/local/{language}/{topic}/templates/*.json` - 模板檔案

### Monorepo 工作流程

**開發循環**:
```bash
# 1. 安裝依賴
npm install

# 2. 本地包連結（開發時）
npm run link:local

# 3. 開發（監視模式）
npm run watch

# 4. 測試
npm test

# 5. 建置
npm run build

# 6. 打包 VS Code 擴展
npm run package:vscode
```

**包依賴關係**:
```
@textbricks/shared  ←  @textbricks/core  ←  @textbricks/vscode
     (模型)              (核心邏輯)            (VS Code 適配)
```

### 資產管理

**單一來源原則** - 根目錄 `assets/` 為權威來源

**建置流程**:
```
開發階段  → 直接使用根目錄 assets/
建置階段  → 自動複製到 packages/vscode/dist/
發布階段  → 從根目錄打包到 VSIX
```

**建置指令**:
```bash
npm run copy-data  # 複製資產到 dist/
npm run build      # TypeScript + 資產複製
```

---

## 🧠 AI Agents 工作原則

### 🎯 核心原則

1. **規格驅動** (SDD)
   - 先更新 `specs/PRD.md` 定義需求
   - 再定義 TypeScript 介面
   - 最後實作功能

2. **測試驅動** (TDD)
   - 先寫測試案例
   - 再實作功能
   - 確保測試通過

3. **穩定優先**
   - VS Code 版本已穩定，避免破壞性變更
   - 保持 API 和用戶體驗的一致性

4. **文檔同步**
   - 重要變更必須更新 AGENTS.md
   - 功能變更必須更新 PRD.md
   - 版本發布必須更新 CHANGELOG.md

5. **增量改進**
   - 專注於漸進式改進而非重大變更
   - 小步重構，每步驗證測試通過

6. **架構完整**
   - 多平台架構已就緒，新功能應遵循此設計
   - 平台無關邏輯放在 `packages/core/`
   - 平台特定實作放在 `packages/vscode/`

### 📋 常見任務指南

**新功能開發**:
1. 更新 `specs/PRD.md` 功能規格
2. 在 `packages/shared/src/models/` 定義資料模型
3. 在 `packages/core/src/interfaces/` 定義平台介面
4. 撰寫測試案例
5. 實作核心邏輯（`packages/core/`）
6. 實作 VS Code 適配（`packages/vscode/`）
7. 更新 AGENTS.md 和 CHANGELOG.md

**Bug 修復**:
1. 重現問題（撰寫失敗測試）
2. 檢查接口實現和類型安全
3. 修復問題
4. 確保測試通過
5. 檢查回歸測試

**重構**:
1. 參考 `specs/REFACTORING_HISTORY.md` 已完成項目
2. 確保測試覆蓋率足夠
3. 小步重構，避免過早優化
4. 每步驗證測試通過
5. 更新文檔

**測試新想法**:
1. 在 VS Code 版本驗證功能
2. 確保核心邏輯平台無關
3. 考慮未來多平台擴展

**Monorepo 工作**:
1. 理解包依賴：shared ← core ← vscode
2. 使用 `npm link` 管理本地包連結
3. 修改 shared/core 後需重新建置

### 🚀 當前狀態提醒

**v0.3.0 開發中** (2025-09-30 ~ 2025-11-30):
- ✅ 核心架構重構完成
- ✅ UI 層重構完成
- ✅ Manager/Templates Panel 拆分完成 (Step 1-2)
- 🚧 Provider 拆分待完成 (Step 3-4)
- 🎯 階層式主題系統待實作

**暫停新功能開發**:
- 專注於完成 v0.3.0 重構和檔案拆分
- 新功能開發等重構完成後再進行
- 享受重構帶來的架構清晰度

**下一步優先級**:
1. 完成 Provider 拆分 (Step 3-4)
2. 實作階層式主題系統
3. 測試和文檔完善
4. v0.3.0 正式發布

---

## 🔄 最近重要變更

> 詳細歷史請參考 [specs/VERSION_HISTORY.md](./specs/VERSION_HISTORY.md)

### 2025-10-18 - 文檔重組
- 📁 創建 `specs/REFACTORING_HISTORY.md` - 重構完整記錄
- 📁 創建 `specs/CODE_REVIEW_HISTORY.md` - 代碼審查記錄
- 📁 創建 `specs/VERSION_HISTORY.md` - 完整版本歷史
- 📁 搬移 `TEMPLATE_GUIDE.md` 到 `docs/`
- ✨ 新增 SDD/TDD 開發模式說明
- ✨ 新增文檔導航章節

### 2025-10-17~18 - 檔案拆分 (Step 1-2)
- ✅ Manager.js: 5,753 → ~2,300 行 (21 個模組)
- ✅ Templates Panel: 拆分為 12 個功能模組
- ✅ CSS 重組: panel-specific 結構

### 2025-10-03~09 - 代碼品質改進
- ✅ 統一推薦系統管理
- ✅ console.log → platform logging
- ✅ any 類型移除，類型安全提升

### 2025-09-30 - v0.3.0 重構 (Phase 1-6 + UI Phase 1-5)
- ✅ 核心架構重構完成
- ✅ UI 層共享組件系統建立
- ✅ TextBricksEngine: 1,203 → 1,027 行

---

**文件狀態**：🟢 最新
**最後更新**：2025-10-18
**當前版本**：v0.3.0 開發中
**專案狀態**：🚧 重構優化階段
