# TextBricks - AI Agents 參考文件

> 🤖 **給 AI 助手的上下文文件**
> 此文件包含當前項目狀態、架構資訊和開發指南，供 Claude Code 等 AI 助手參考。

## 📖 文檔導航

### 核心文檔
- **[PLAN.md](./PLAN.md)** - 📋 未來規劃和待辦事項
- **[specs/PRD.md](./specs/PRD.md)** - 🎯 產品需求文檔
  - 三形態理論（序列-結構-圖譜）
  - 產品定位和核心功能
  - 未來路線圖（v0.4 Blockly、v0.5 Node Flow）

### 開發指南
- **[docs/TEMPLATE_GUIDE.md](./docs/TEMPLATE_GUIDE.md)** - 模板撰寫指南
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code 入口指南

### 歷史記錄
- **[specs/VERSION_HISTORY.md](./specs/VERSION_HISTORY.md)** - ⭐ 完整版本變更歷史
- **[specs/REFACTORING_HISTORY.md](./specs/REFACTORING_HISTORY.md)** - v0.3.0 重構記錄
- **[specs/CODE_REVIEW_HISTORY.md](./specs/CODE_REVIEW_HISTORY.md)** - 代碼審查記錄
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
- **最新發布**: v0.3.0 (2025-10-19)
- **狀態**:
  - ✅ C 語言完整模板系統（223 檔案，192 模板）
  - ✅ Provider 模組化拆分完成（縮減 52.6%）
  - ✅ Usage 統計系統重構
  - ✅ Templates Panel UI 增強
- **下一版本**: v0.4.0 (規劃 Blockly 整合)

---

## 🎯 開發模式與原則

### Spec-Driven Development (SDD)

**原則**: 規格優先，代碼跟隨

**流程**:
1. **需求分析** → 更新 `PLAN.md` 和 `specs/PRD.md`
2. **架構設計** → 在本文件記錄架構決策
3. **介面定義** → 先定義 TypeScript 介面和類型
4. **實作開發** → 根據規格實作功能
5. **文檔同步** → 更新 `specs/VERSION_HISTORY.md`

**關鍵文件**:
- `PLAN.md` - 未來規劃和待辦事項
- `specs/PRD.md` - 產品需求和功能規格
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
- [ ] 更新 `PLAN.md` 添加任務
- [ ] 更新 `specs/PRD.md` 功能規格（如需要）
- [ ] 定義 TypeScript 介面
- [ ] 撰寫單元測試
- [ ] 實作核心邏輯
- [ ] 整合測試通過
- [ ] 更新 `specs/VERSION_HISTORY.md`
- [ ] 從 `PLAN.md` 移除已完成任務

**Bug 修復**:
- [ ] 重現問題（撰寫失敗測試）
- [ ] 修復問題
- [ ] 確保測試通過
- [ ] 檢查回歸測試
- [ ] 更新 `specs/VERSION_HISTORY.md`

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
│   │   │   ├── managers/    # TopicManager, ScopeManager, SearchManager
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
├── data/local/             # 開發模板數據（納入 git）
│   ├── scope.json          # Scope 配置範例
│   └── {language}/         # 各語言模板（如 c/, python/, javascript/）
└── specs/                  # 規格文檔
    ├── PRD.md             # 產品需求
    ├── VERSION_HISTORY.md # 版本歷史
    ├── REFACTORING_HISTORY.md
    └── CODE_REVIEW_HISTORY.md
```

### 核心服務

1. **TextBricksEngine** - 統一模板引擎 (~1,027 行)
   - 核心入口點，整合所有服務
   - 模板載入、搜尋、推薦

2. **TopicManager** - 階層式主題管理
   - topic.json 解析和管理
   - 階層導航支援

3. **ScopeManager** - Scope 和統計管理
   - scope.json 配置管理
   - **Usage 統計** (新格式: `UsageEntry { count, lastUsedAt }`)
   - 收藏管理

4. **TemplateRepository** - 模板 CRUD (~370 行)
   - 模板檔案操作
   - 批次處理

5. **RecommendationService** - 推薦演算法 (~107 行)
   - 基於使用頻率推薦
   - 可配置參數

6. **DataPathService** - 平台無關資料路徑（單例）
   - 跨平台路徑管理
   - 開發數據同步

7. **FormattingEngine** - 智慧縮排系統 (~272 行)
   - 自動縮排調整
   - 游標位置感知

### 資料模型

**核心原則**: Path-Based 識別，使用檔案系統路徑作為唯一識別

- **Template**: `{topicPath}/templates/{name}`
- **Topic**: `topic.json` 階層結構
- **Scope**: `scope.json` 集中管理
  - `favorites: string[]` - 收藏項目路徑
  - `usage: Record<string, UsageEntry>` - 使用統計（新格式）
  - `languages: Language[]` - 支援的語言
- **UsageEntry**: `{ count: number, lastUsedAt: string }` - 使用統計項目

**重要變更（v0.3.0）**:
- ✅ Usage 統計從模板 metadata 遷移到 scope.json
- ✅ 統一使用 `UsageEntry` 格式，移除舊的 `number` 格式
- ✅ 所有 usage 讀取統一從 ScopeManager

---

## 🚀 核心功能現狀

### VS Code 版本功能 (v0.3.0)

#### 核心功能
- ✅ **多語言支援** - C, Python, JavaScript 切換
- ✅ **階層式主題系統** - topic.json 支援無限層級
- ✅ **智慧操作** - 點擊插入、拖曳插入、工具提示預覽
- ✅ **智慧縮排** - FormattingEngine 自動調整至游標位置
- ✅ **文檔系統** - Markdown 支援、互動式程式碼區塊

#### 進階功能
- ✅ **模板管理** - CRUD 操作、匯入匯出、批次處理
- ✅ **智慧推薦** - 基於使用頻率和最後使用時間
- ✅ **收藏系統** - 模板、主題、連結的完整收藏功能
- ✅ **標籤式界面** - 推薦/最愛雙標籤切換
- ✅ **瀏覽歷史導航** - 前進/後退導航系統
- ✅ **麵包屑導航** - 階層路徑導航 + 文檔按鈕
- ✅ **展開/收合控制** - 全部展開/收合 + 智能預設收合

#### 使用統計系統（新）
- ✅ **集中式管理** - 所有統計在 scope.json
- ✅ **時間追蹤** - 記錄最後使用時間
- ✅ **效能優化** - 不再更新每個模板檔案
- ✅ **搜尋整合** - 支援按使用次數和時間搜尋

#### 技術特性
- ✅ **TypeScript** - 完整類型安全
- ✅ **Webview UI** - 響應式設計
- ✅ **JSON 資料** - scope.json + topic.json 結構化儲存
- ✅ **Path-based** - 使用路徑識別，移除 ID 冗餘
- ✅ **測試框架** - Jest 單元測試
- ✅ **模組化架構** - 前端拆分為 33 個模組

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
- `packages/core/src/managers/ScopeManager.ts` - Scope 和使用統計
- `packages/core/src/managers/TopicManager.ts` - 主題管理
- `packages/core/src/repositories/TemplateRepository.ts` - 模板 CRUD

**VS Code 整合**:
- `packages/vscode/src/extension.ts` - 擴展入口
- `packages/vscode/src/providers/templates-panel/` - Templates Panel
- `packages/vscode/src/providers/manager-panel/` - Manager Panel
- `packages/vscode/src/adapters/vscode/` - VS Code 適配器

**前端 UI**:
- `assets/js/common/utils.js` - 共享工具函數
- `assets/js/templates-panel/` - Templates Panel 模組（12 個）
- `assets/js/manager-panel/` - Manager Panel 模組（21 個）
- `assets/css/common/` - 設計系統（variables, components）

**資料模型**:
- `packages/shared/src/models/Scope.ts` - Scope 和 UsageEntry 定義
- `packages/shared/src/models/Template.ts` - Template 模型
- `packages/shared/src/models/Topic.ts` - Topic 模型

**開發數據**:
- `data/local/` - 本地開發用數據（不進 git）
- 運行時數據位置：`~/Library/Application Support/TextBricks/scopes/local/`

### Monorepo 工作流程

**開發循環**:
```bash
# 1. 安裝依賴
npm install

# 2. 開發（監視模式）
npm run watch

# 3. 測試
npm test

# 4. 建置
npm run build

# 5. 打包 VS Code 擴展
npm run package:vscode
```

**包依賴關係**:
```
vscode (VS Code 擴展)
  ↓
core (平台無關核心)
  ↓
shared (共享類型)
```

### 常用指令

```bash
# 開發
npm run build              # 建置所有包
npm run watch              # 監視模式
npm run clean              # 清理建置檔案

# 測試
npm test                   # 執行測試
npm run test:coverage      # 測試覆蓋率
npm run test:watch         # 測試監視模式

# VS Code 擴展
npm run package:vscode     # 打包擴展
npm run link:local         # 本地包連結

# 代碼品質
npm run lint               # ESLint 檢查
```

---

## 📝 程式碼規範

### TypeScript 規範

- ✅ 啟用 strict mode
- ✅ 避免使用 `any`，使用明確類型
- ✅ 使用介面定義公開 API
- ✅ 優先使用組合而非繼承

### 命名規範

- **檔案**: PascalCase.ts (類別), camelCase.ts (功能模組)
- **類別**: PascalCase
- **介面**: PascalCase (不使用 I 前綴)
- **函式**: camelCase
- **常數**: UPPER_SNAKE_CASE
- **私有成員**: 使用 `private` 關鍵字

### 註解規範

```typescript
/**
 * 功能說明（一句話概述）
 *
 * 詳細說明（如需要）
 *
 * @param paramName - 參數說明
 * @returns 返回值說明
 * @throws 異常說明（如需要）
 */
```

### 平台無關原則

**核心包**（`core`, `shared`）:
- ❌ 不得引用 vscode API
- ❌ 不得引用 Node.js 特定 API
- ✅ 通過 IPlatform 介面抽象平台功能
- ✅ 使用依賴注入

**VS Code 包**（`vscode`）:
- ✅ 實作 IPlatform 介面
- ✅ 使用 Adapter 模式連接 VS Code API
- ✅ 所有平台特定代碼放在 `adapters/vscode/`

---

## 🔍 除錯指南

### VS Code 擴展除錯

1. 在 VS Code 中打開項目
2. 按 F5 啟動除錯
3. 新視窗會載入擴展
4. 設置中斷點進行除錯

### 查看 Webview 除錯

1. 開啟 Templates Panel 或 Manager
2. 右鍵點擊 Webview → "Open Webview Developer Tools"
3. 使用 Console 查看 JavaScript 錯誤
4. 使用 Network 查看資源載入

### 查看日誌

```typescript
// 使用 platform.logInfo/logWarning/logError
this.platform.logInfo('Message', 'SourceClass');
this.platform.logError(error, 'SourceClass.methodName');
```

日誌位置：VS Code Output → TextBricks

---

## 🎓 AI 助手工作原則

### 工作流程

1. **接到任務** → 先檢查 `PLAN.md` 確認是否已規劃
2. **閱讀相關文檔** → 查看 `specs/VERSION_HISTORY.md` 了解當前狀態
3. **實作功能** → 遵循開發檢查清單
4. **完成後更新文檔**:
   - 更新 `specs/VERSION_HISTORY.md` 記錄變更
   - 從 `PLAN.md` 移除已完成項目
   - 保持 `AGENTS.md` 反映最新狀態

### 文檔維護原則

- **AGENTS.md** (本文件) - 保持簡潔，只記錄當前狀態
- **PLAN.md** - 未來規劃和待辦事項
- **specs/VERSION_HISTORY.md** - 已完成工作的完整記錄
- **specs/PRD.md** - 產品需求和長期願景

### 重要提醒

- ✅ 修改前先閱讀 `specs/VERSION_HISTORY.md` 了解變更歷史
- ✅ 完成後立即更新 `specs/VERSION_HISTORY.md`
- ✅ 保持 `PLAN.md` 為最新的待辦事項
- ✅ 遵循 Spec-Driven 和 Test-Driven 開發流程
- ✅ 代碼提交使用清晰的 commit message

---

## 📞 相關連結

- **GitHub**: https://github.com/timcsy/TextBricks
- **VS Code Marketplace**: (待發布)
- **文檔**: 查看 `docs/` 和 `specs/` 目錄

---

*最後更新: 2025-10-19*
