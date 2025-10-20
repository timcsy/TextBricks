# Changelog

All notable changes to the TextBricks extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **📖 完整版本歷史**: 詳細的版本變更記錄請參閱 [specs/VERSION_HISTORY.md](./specs/VERSION_HISTORY.md)

---

## [0.3.3] - 2025-10-21

### 🐛 Bug Fixes
- **版本更新提示邏輯修正**
  - 修正版本記錄更新時機，避免重新載入後對話框消失
  - 只在使用者明確選擇後才更新版本記錄
  - 使用者關閉對話框時不更新版本，下次啟動時仍會提示

### 🔧 Improvements
- **備份路徑優化**
  - 備份位置從 `scopes/local.backup-{timestamp}` 改為 `.backup/local-{timestamp}`
  - 所有備份集中在 `.backup/` 目錄，更易於管理
  - 改用複製後刪除的方式，確保備份過程更安全

---

## [0.3.2] - 2025-10-21

### ✨ New Features
- **版本更新資料同步機制**
  - 首次安裝時自動初始化模板資料
  - 版本更新時詢問使用者是否更新模板資料
  - 支援備份現有資料（自動清理舊備份，預設保留 3 個）

### ⚙️ Configuration
- 新增設定選項 `textbricks.maxDataBackups` - 設定保留的備份數量上限（預設：3，範圍：0-10）

### 🐛 Bug Fixes
- 移除不必要的 "currentDataPath is undefined" 警告訊息
- 改善首次安裝流程，確保資料正確初始化

### 🔧 Internal
- 新增 `DataPathService.backupAndReplace()` 方法
- 新增版本追蹤機制（使用 globalState）
- 改進資料初始化邏輯，支援三種情境（首次安裝、版本更新、正常啟動）

---

## [0.3.1] - 2025-10-20

### 🎨 UI Layout Improvements
- 重組 Templates Panel header，改善視覺層次
- 優化資訊流動和導航結構

### 🐛 Bug Fixes
- 修復初始化流程 - 模板現在會在首次安裝時立即載入
- 改善啟動可靠性

---

## [Unreleased] - 0.3.0 Development

### 🏗️ Core Architecture Overhaul (2025-09-30)
- **核心架構重構完成** - Phase 1-6 全部完成
  - 整合 TopicManager、提取 TemplateRepository、RecommendationService
  - TextBricksEngine: 1,203 → 1,027 行 (-14.6%)
  - 統一 Topic 模型、DataPathService 單例化

### 🎨 UI Layer Refactoring (2025-09-30 ~ 2025-10-01)
- **UI 層重構完成** - UI Phase 1-5 全部完成
  - 共享工具函數庫 (utils.js, 338 行)
  - CSS 組件系統 (variables.css + components.css, 479 行)
  - 卡片模板系統、事件委託系統

### 🔨 Manager/Templates Panel Modularization (2025-10-17 ~ 2025-10-18)
- **Manager.js 模組化** - 拆分為 21 個模組 (5,753 → ~2,300 行)
- **Templates Panel 模組化** - 拆分為 12 個功能模組
- **CSS 重組** - 採用 panel-specific 結構

### 🧹 Code Quality Improvements (2025-10-03 ~ 2025-10-09)
- 統一推薦系統管理
- console.log → platform logging
- 移除 any 類型，增強類型安全

### 📝 Documentation Updates (2025-10-18)
- 文檔重組：創建 specs/ 歷史記錄檔案
- AGENTS.md 精簡並增強（加入 SDD/TDD 開發模式）
- TEMPLATE_GUIDE.md 搬移到 docs/

---

## [0.2.5] - 2025-09-19

### 🎨 UI/UX Improvements
- 修復模板卡片被切斷問題
- 優化響應式佈局，調整多欄佈局閾值
- 增加模板卡片最小高度，改善內容可見性
- 改善滾動行為和文字對比度

### 🔧 Technical Fixes
- 修復 CSS 語法錯誤
- 改善 flexbox 佈局和空間利用

---

## [0.2.4] - 2025-09-15

### 🧹 Major Refactoring & Code Cleanup
- 移除不必要組件（ContextAnalysisService、過度設計介面等）
- 創建模組化管理器（ImportExportManager, SearchManager, ValidationManager）
- 統一 CommandService，移除 200+ 行未實現功能

### 🏗️ Architecture Improvements
- 平台抽象層：分離業務邏輯到 Core 層
- 為階層主題系統（語言作為根節點）做準備

### ✨ Topic System Enhancement
- 從固定層級 (level1-4) 改為彈性主題系統
- 自訂主題名稱：如「基礎概念」、「網頁開發」、「演算法」
- UI 簡化：移除層級徽章

---

## [0.2.3] - 2025-09-05

### 🐛 Critical Bug Fixes
- **完全解決模板文字選取插入的縮排問題**
- 修正 FormattingEngine 目標縮排處理邏輯
- 正確處理邊界條件和同層級行對齊

### 📦 Package Updates
- 所有包版本同步至 0.2.3
- VSIX 生成成功 (textbricks-0.2.3.vsix, 497.36KB)

---

## [0.2.2] - 2025-09-05

### 🔧 Fixed
- 移除硬編碼 VS Code 檢測邏輯
- 使用動態 import 改善相容性
- 增強模板路徑解析機制

### 🏗️ Architecture Improvements
- 能力導向檢測取代字串比對
- VSIX 路徑結構增強

---

## [0.2.1] - 2025-09-05

### 🔧 Fixed
- TextBricks Manager 版面問題修復
- 資源載入路徑統一（media/ → assets/）
- Documentation Provider 資源引用修復

---

## [0.2.0] - 2025-09-05

### 🏗️ Major Architecture Overhaul
- **Monorepo 結構**：npm workspaces 支援
- **平台無關核心**：TextBricksEngine 完全抽象
- **統一建置系統**：dist/ 目錄結構支援多平台
- **多平台準備**：為 Vim, Sublime Text 等編輯器奠定基礎

---

## [0.1.8] - 2024-12-XX

### 🏗️ Architecture Refactor
- **平台抽象層**：核心邏輯與 VS Code API 完全分離
- **多平台架構**：可擴展設計支援 Vim, NeoVim, Chrome 等
- **適配器模式**：VSCode 特定適配器

---

## [0.1.7] - 2025-01-XX

### 🧠 Smart Indentation System Overhaul
- **統一縮排系統**：單一方法處理所有插入情境
- **智慧游標分析**：空行偵測和同層級識別
- **模板輔助復原**：使用原始模板上下文

---

## [0.1.6] - 2024-XX-XX
- 互動式程式碼區塊
- 智慧選取支援

## [0.1.5] - 2024-XX-XX
- 智慧縮排系統初版
- 上下文感知格式化

## [0.1.4] - 2024-XX-XX
- 文檔系統
- Markdown 支援

## [0.1.3] - 2024-XX-XX
- 智慧推薦系統
- 使用追蹤

## [0.1.2] - 2024-XX-XX
- 多語言支援（C, Python, JavaScript）
- TextBricks Manager
- JSON 批次匯入

## [0.1.1] - 2024-XX-XX
- 初始多語言版本

## [0.1.0] - 2024-XX-XX
- TextBricks 初始發布
- 基礎 C 語言模板

---

**製作團隊**: TextBricks 開發組
**最後更新**: 2025-10-18
