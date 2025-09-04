# TextBricks - AI Agents 參考文件

> 🤖 **給 AI 助手的上下文文件**  
> 此文件包含完整的項目狀態、架構資訊和發展規劃，供 Claude Code 等 AI 助手參考。
> 
> **使用方式**：
> - 📖 **會話開始時** - 請先閱讀此文件了解項目全貌
> - 📝 **重要變更時** - 請更新相關章節並記錄變更日誌

## 📋 產品概述

**TextBricks** - 多平台程式碼模板工具，專為程式設計初學者設計，支援 C、Python、JavaScript 三種語言的結構化學習。

### 核心價值
- 🎯 **降低學習門檻** - 提供結構化學習路徑
- 🌐 **多平台支援** - 統一體驗，跨平台使用
- 🚀 **智慧輔助** - 上下文感知推薦和自動格式化
- 📚 **豐富文檔** - 互動式說明和範例

## 🏗️ 架構狀態

### ✅ 已完成 - Phase 1: 多平台架構重構

**當前架構**：平台無關核心 + 適配器模式

```
📁 TextBricks 架構
├── 🧠 Core Services (平台無關)
│   ├── TextBricksEngine - 統一模板引擎
│   ├── DocumentationService - 文檔處理
│   ├── SearchService - 搜尋邏輯
│   └── CodeOperationService - 程式碼操作
├── 🔌 Platform Adapters
│   ├── VSCodePlatform - VS Code 適配器
│   ├── VSCodeEditor - 編輯器抽象
│   ├── VSCodeUI - 用戶界面抽象
│   └── VSCodeStorage - 存儲抽象
└── 📝 Interfaces - 平台接口定義
```

**重構成果**：
- ✅ 核心邏輯與 VS Code API 完全分離
- ✅ 類型安全的平台接口定義
- ✅ 零破壞性變更，向後兼容
- ✅ 為多平台擴展奠定基礎

## 🚀 功能現狀

### VS Code 版本功能 (v0.2.0)

#### 核心功能
- ✅ **多語言支援** - C, Python, JavaScript 切換
- ✅ **四層級模板** - 基礎語法 → 控制結構 → 函數資料 → 進階應用
- ✅ **智慧操作** - 點擊插入、拖曳插入、工具提示預覽
- ✅ **智慧縮排** - 自動調整至游標位置，保持相對結構
- ✅ **文檔系統** - Markdown 支援、互動式程式碼區塊

#### 進階功能
- ✅ **模板管理** - CRUD 操作、匯入匯出、批次處理
- ✅ **智慧推薦** - 基於使用頻率的個人化推薦
- ✅ **上下文感知** - 預留擴展架構

#### 技術特性
- ✅ **TypeScript** - 完整類型安全
- ✅ **Webview UI** - 響應式設計
- ✅ **JSON 資料** - 結構化模板儲存
- ✅ **測試覆蓋** - 單元測試框架

## 🎯 發展規劃

### Phase 2: 多平台擴展 (優先)

#### 🔧 Priority 1: Vim/NeoVim 插件
**目標**：輕量、高效的命令行整合

**技術方案**：Neovim + Lua

**核心特性**：
- 🎮 **浮動窗口** - 模板選擇器界面
- ⌨️ **命令整合** - `:TextBrick python hello-world`
- 🔍 **快速搜尋** - 即時過濾和自動完成
- ⚡ **高性能** - 毫秒級響應

**開發階段**：
- [ ] **Phase 2.1** (2-3週) - 基礎架構和 Lua 專案
- [ ] **Phase 2.2** (2-3週) - 核心功能和 UI 實作
- [ ] **Phase 2.3** (1-2週) - 生態整合和客製化

#### 📱 Phase 2.4: 其他平台 (後續)
- **Chrome 擴展** - 線上編程環境整合
- **Obsidian 插件** - 筆記和學習整合  
- **Zed 擴展** - 現代編輯器支援

### Phase 3: 功能增強 (可選)

#### 🎯 智慧化升級
- [ ] **完整上下文感知** - 項目類型檢測、框架識別
- [ ] **機器學習推薦** - 個人化學習路徑
- [ ] **學習追蹤** - 進度統計、技能評估

#### 🌐 生態擴展
- [ ] **更多語言** - Java, Go, Rust, Swift
- [ ] **本地化** - 英文、日文界面
- [ ] **社群功能** - 模板分享、評分系統

## 📊 當前優先級

### ⚡ 立即執行
1. **Vim 插件開發** - 最高投資回報比
2. **文檔完善** - 提升用戶體驗

### 🔄 中期目標  
1. **Chrome 擴展** - 覆蓋線上學習場景
2. **智慧推薦完善** - 提升學習效率

### 🌟 長期願景
1. **多平台生態** - 統一的跨平台學習工具
2. **AI 輔助** - 智慧程式碼生成和學習建議

## 🚧 技術債務

### 已解決
- ✅ VS Code 緊耦合問題 - 已重構為平台無關架構
- ✅ 重複代碼問題 - 統一核心服務層
- ✅ 類型安全問題 - 完整 TypeScript 接口

### 待處理
- [ ] 測試覆蓋率提升
- [ ] 效能優化 (大量模板場景)
- [ ] 錯誤處理完善

## 📈 成功指標

### VS Code 版本
- **安裝數量** - 目前基準線建立
- **使用頻率** - DAU/MAU 追蹤
- **模板使用** - 操作統計分析
- **用戶反饋** - 評價和 GitHub Issues

### 多平台目標
- **Vim 用戶接受度** - 社群反應
- **跨平台使用率** - 平台分佈統計
- **生態影響力** - 社群貢獻和討論

## 📅 時間規劃

### 2025 Q1 (當前)
- ✅ VS Code 架構重構完成
- 🎯 Vim 插件 MVP 開發

### 2025 Q2
- 🔧 Vim 插件完善和發布
- 📊 用戶反饋收集和分析

### 2025 Q3
- 🌐 Chrome 擴展開發
- 🤖 智慧推薦系統完善

### 2025 Q4
- 🎯 多平台整合優化
- 📈 社群生態建設

## 🔄 AI Agents 變更日誌

> 📝 **重要**：AI 助手在進行重大變更時，請更新此部分以便後續追蹤

### 2025-09-05 - v0.2.0 多編輯器平台轉型完成
- **執行者**：Claude Code
- **變更**：
  - ✅ **專案轉型**：TextBricks-VSCode → textbricks-extensions 多編輯器平台
  - ✅ **統一建置系統**：完整 dist/ 目錄結構支援多平台外掛
  - ✅ **文檔全面更新**：多編輯器支援說明，VS Code/Vim/Sublime Text 規劃
  - ✅ **版本發佈**：v0.1.8 → v0.2.0 重大版本更新
  - ✅ **VSIX 生成**：textbricks-0.2.0.vsix (528KB) 成功建置
- **技術成果**：
  - 🏗️ **統一建置**：dist/plugins/vscode/current/ 結構，準備多平台外掛
  - 📦 **版本管理**：自動 VSIX 歸檔，current/archive 分離
  - 🌐 **多平台就緒**：為 Vim, Sublime Text 等編輯器預留架構
  - 📄 **完整文檔**：README.md, CHANGELOG.md, GitHub URLs 全面更新
- **狀態**：v0.2.0 發佈就緒，多編輯器平台基礎完成
- **下一步**：發佈到 VS Code Marketplace，開始 Vim 外掛開發

### 2025-09-04 - Monorepo 架構重構完成
- **執行者**：Claude Code
- **變更**：
  - ✅ 完成 Phase 2 多平台架構擴展
    - ✅ Phase 2.1: 建立 monorepo 結構 - npm workspaces 支援
    - ✅ Phase 2.2: 分離 packages - @textbricks/core, @textbricks/shared, @textbricks/vscode
    - ✅ Phase 2.3: 更新建置流程 - 修復跨包依賴和導入路徑
  - ✅ 核心服務完全模組化：TextBricksEngine, DocumentationService, SearchService, CodeOperationService
  - ✅ 共享模型獨立包：Template 等模型分離至 @textbricks/shared
  - ✅ VS Code 適配器包：完整的 VS Code 特定實現
- **技術成果**：
  - 🏗️ **Monorepo 結構**：三個獨立包，清晰依賴關係
  - 📦 **包管理**：npm workspaces 支援，統一依賴管理
  - 🔗 **跨包引用**：@textbricks/* 命名空間，TypeScript 項目引用
  - ✅ **編譯驗證**：@textbricks/shared 和 @textbricks/core 編譯成功
- **狀態**：Monorepo 架構完成，為多平台擴展做好準備
- **下一步**：修復測試架構適配，準備 Vim 插件開發

### 2025-01-04 - 文檔整合和架構重構完成
- **執行者**：Claude Code
- **變更**：
  - ✅ 完成多平台架構重構 (Phase 1)
  - ✅ 整合分散文檔為統一 AGENTS.md
  - ✅ 清理冗餘代碼和除錯日誌
  - ✅ VS Code 功能驗證通過
- **狀態**：架構重構完成，VS Code 版本穩定運行
- **下一步**：準備 Vim 插件開發 (Phase 2.1)

### 變更記錄模板
```
### YYYY-MM-DD - 變更摘要
- **執行者**：[AI 助手名稱]
- **變更**：
  - [具體變更項目]
- **影響**：[對項目的影響]
- **狀態**：[當前狀態]
- **注意事項**：[後續 AI 助手需要注意的事項]
```

---

## 🧠 AI Agents 重要提醒

### 🎯 工作原則
1. **穩定優先** - VS Code 版本已穩定，避免破壞性變更
2. **架構完整** - 多平台架構已就緒，新功能應遵循此設計
3. **向後兼容** - 保持 API 和用戶體驗的一致性
4. **文檔同步** - 重要變更必須更新此文件
5. **增量改進** - 專注於漸進式改進而非重大變更
6. **穩定性優先** - 考慮穩定性和向後兼容性

### 📋 常見任務指南
- **新功能開發** → 遵循 `packages/core/` 和 `packages/vscode/` 分離原則
- **Bug 修復** → 優先檢查接口實現和類型安全
- **重構建議** → 參考 Phase 2/3 規劃，避免過早優化
- **測試新想法** → 使用 VS Code 版本驗證，確保功能完整
- **Monorepo 工作** → 理解包依賴關係：shared ← core ← vscode

### 🔧 技術棧提醒
- **TypeScript** 嚴格模式，完整類型定義
- **Monorepo 結構** 三個包：`@textbricks/shared`, `@textbricks/core`, `@textbricks/vscode`
- **平台抽象** 通過 `packages/core/src/interfaces/` 定義
- **核心邏輯** 在 `packages/core/src/core/` 中保持平台無關
- **VS Code 特定** 實現在 `packages/vscode/src/adapters/vscode/`
- **共享模型** 在 `packages/shared/src/models/` 定義

### 🗂️ 關鍵檔案參考
- **AGENTS.md** - 🤖 AI 助手主要參考文件 - 完整項目狀態、架構、規劃和變更日誌
- **CHANGELOG.md** - 版本歷史和變更記錄
- **packages/core/** - 平台無關的業務邏輯
- **packages/vscode/** - VS Code 平台特定實現  
- **packages/shared/** - 共享模型和類型定義
- **tsconfig.json** - Monorepo 根配置與專案引用

### 🎯 當前狀態提醒 (v0.2.0 多編輯器平台完成)
- ✅ **多編輯器平台**：專案成功轉型為支援多編輯器的擴展平台
- ✅ **統一建置系統**：dist/plugins/ 結構支援 VS Code, Vim, Sublime Text 等
- ✅ **Monorepo 架構**：完整的多包結構已實現並穩定運行
- ✅ **平台抽象層**：核心邏輯與 VS Code API 完全分離
- ✅ **TypeScript 編譯**：所有包編譯成功，類型安全
- ✅ **版本發佈**：v0.2.0 VSIX (528KB) 已成功生成
- ✅ **文檔更新**：完整的多編輯器說明和使用指南

### 🚀 繼續工作時的重點
1. **v0.2.0 多編輯器平台**已完成，專案成功轉型
2. **統一建置系統**就緒，支援多平台外掛開發
3. **VS Code 擴展**功能正常，VSIX 已生成準備發佈
4. 專注於**Vim 外掛開發**或**Marketplace 發佈**
5. 優先考慮**穩定性**和**多平台一致性**
6. **Monorepo 架構**成熟，支援快速多平台擴展

---

**文件狀態**：🟢 最新  
**最後更新**：2025-09-05  
**當前版本**：v0.2.0 (Multi-Editor Platform)  
**專案狀態**：✅ 多編輯器平台基礎完成，統一建置系統就緒  
**發佈狀態**：🚀 v0.2.0 VSIX 已生成，準備發佈到 VS Code Marketplace  
**下一步**：📦 發佈到 Marketplace 或 🔧 開始 Vim 外掛開發