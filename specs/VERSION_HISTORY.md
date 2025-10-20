# Changelog

All notable changes to the TextBricks extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-10-20

**UI 改進版本**: Templates Panel 介面佈局優化

### 🎨 UI/UX 改進

#### Templates Panel 標題區域重構
- **調整介面階層結構**: 優化資訊組織的視覺流程
  - 標題列維持在最上方 (TextBricks logo + 展開/收合按鈕)
  - 使用說明移至標題下方 ("點擊複製 • 拖曳插入")
  - 導航麵包屑移至最下方 (← → local)
- **CSS 佈局調整**:
  - `.header-top` 改為 `flex-direction: column` 實現垂直排列
  - `.subtitle` 移除居中對齊，改為靠左對齊
  - 間距調整以達到更好的視覺平衡

### 🐛 Bug 修復

#### 初始化流程優化
- **移除阻塞訊息框**: `DataPathService.autoInitialize()` 中的 `showInformationMessage()` 會中斷初始化流程
  - 改由 `extension.ts` 根據 `wasJustMigrated()` 狀態決定是否顯示訊息
  - 確保首次安裝時模板能立即載入，無需重啟 VSCode
- **清理診斷日誌**: 移除 `DataPathService` 中過多的 "===" 診斷日誌
  - 保留關鍵資訊日誌 (如遷移完成訊息)
  - 改善日誌可讀性
- **增強錯誤處理**: `extension.ts` 中為 `autoInitialize()` 和 `wasJustMigrated()` 增加 try-catch

### 📝 文件更新
- 更新 README.md 版本資訊和變更說明
- 更新所有 package.json 版本號至 0.3.1

**變更檔案**:
- `packages/vscode/src/providers/templates-panel/TemplatesPanelProvider.ts`: HTML 結構調整
- `assets/css/templates-panel/templates-panel.css`: CSS 佈局更新
- `packages/core/src/services/DataPathService.ts`: 移除阻塞訊息和診斷日誌
- `packages/vscode/src/extension.ts`: 增強錯誤處理

## [0.3.0] - 2025-10-19

**重大版本發布**: 完整的 C 語言模板系統、Usage 統計重構、Provider 模組化拆分、UI 增強

> 🎉 這是 TextBricks 的一個里程碑版本，包含完整的架構重構和 C 語言模板系統

### 📚 C 語言完整模板系統 (2025-10-19)

**目標達成**: 建立完整的 C 語言學習與開發模板系統，涵蓋從初學者到進階的所有主題

#### 系統規模
- ✅ **總計 223 個 JSON 檔案** (包含 topic.json)
- ✅ **約 192 個模板** (包含雙版本系統)
- ✅ **11 個主題層級** (00-beginner 到 10-advanced)
- ✅ **多層級主題階層** (支援子主題結構)
- ✅ **達成率 103.7%** (原計畫目標 215-415 個項目)

#### 雙版本模板系統
每個核心概念提供兩種版本：
- **Placeholder 版本**: 使用 `{{變數}}` 佔位符，適合學習和模板化
  - 例：`addition.json` → `int {{結果變數}} = {{變數1}} + {{變數2}};`
- **Example 版本**: 實際可用的範例代碼，可直接複製使用
  - 例：`addition-example.json` → `int sum = num1 + num2;`

#### 主題結構與模板分佈
- **00-beginner/** (16 個檔案)
  - 15 個精選連結指向基礎必學模板
  - 為初學者規劃的學習路徑

- **01-basics/** (57 個檔案)
  - 5 個子主題：first-program, variables, operators, input-output, comments
  - operators 細分為：arithmetic, comparison, logical
  - 算術運算子完整分離 (+, -, *, /, % 各雙版本)

- **02-control-flow/** (24 個檔案)
  - 條件判斷：if, switch (含 fall-through, 計算器範例)
  - 迴圈：for, while, do-while

- **03-functions/** (17 個檔案)
  - 函式定義、參數、返回值、遞迴等

- **04-arrays/** (15 個檔案)
  - 陣列宣告、初始化、遍歷、多維陣列

- **05-strings/** (15 個檔案)
  - 字串操作、常用函式、格式化

- **06-pointers/** (13 個檔案)
  - 指標基礎、指標運算、指標與陣列

- **07-structures/** (13 個檔案)
  - 結構體定義、巢狀結構、結構體陣列

- **08-files/** (13 個檔案)
  - 檔案讀寫、二進位檔案、檔案操作

- **09-memory/** (9 個檔案)
  - 動態記憶體分配、malloc/free、記憶體管理

- **10-advanced/** (31 個檔案)
  - 預處理器：define 常數/巨集、ifdef、include-guard (8 個模板)
  - 位元運算：AND, OR, XOR, NOT, 左移, 右移 (12 個模板，各雙版本)
  - 進階主題：static, extern, typedef, enum, 命令列參數 (10 個模板)

#### 技術特色
- ✅ 完整的 topic.json 文檔 (包含 title, description, documentation)
- ✅ 階層式主題組織 (支援無限層級嵌套)
- ✅ 精細的運算子分類 (算術、比較、邏輯各自獨立)
- ✅ 雙版本模板設計 (學習模板 + 實用範例)
- ✅ 初學者友善的導航系統 (00-beginner 精選連結)

#### 覆蓋範圍
- ✅ C 語言基礎語法 (變數、運算子、輸入輸出、註解)
- ✅ 完整控制流程 (條件判斷、所有類型迴圈)
- ✅ 函式與模組化編程
- ✅ 陣列與字串處理
- ✅ 指標與記憶體管理
- ✅ 結構體與複合資料類型
- ✅ 檔案 I/O 操作
- ✅ 進階主題 (預處理器、位元運算、儲存類別)

**位置**: `/Users/timcsy/Library/Application Support/TextBricks/scopes/local/c/`

### 🔄 Usage 統計系統重構 (2025-10-19)

**破壞性變更**: 移除舊格式支援，統一使用 UsageEntry 格式

#### 新格式定義
- **舊格式** (已移除): `"usage": { "path": 12 }`
- **新格式** (唯一支援): `"usage": { "path": { "count": 12, "lastUsedAt": "2025-10-19T..." } }`

#### 核心變更
- **Scope.ts**: 將 `Record<string, number>` 改為 `Record<string, UsageEntry>`
- **ScopeManager**:
  - `updateUsage()`: 使用新格式 `{ count, lastUsedAt }`
  - `getUsageCount()`: 簡化為 `entry?.count || 0`
  - `getLastUsedAt()`: 新增方法獲取最後使用時間
- **前端代碼**: 移除所有 `typeof entry === 'number'` 檢查
- **DataPathService.syncToDevData**: 確保正確處理新格式
- **TEMPLATE_GUIDE.md**: 文檔化新的 UsageEntry 格式

#### 統一 ScopeManager 讀取
將所有 usage 相關的讀取操作從模板 metadata 遷移到 ScopeManager：
- **TextBricksEngine.recordTemplateUsage()**: 只更新 scope.json，不再修改模板檔案
- **SearchService**: 從 ScopeManager 讀取使用次數和最後使用時間
- **SearchManager**: 添加 ScopeManager 依賴注入，統一讀取邏輯
- **RecommendationService**: 準備遷移推薦邏輯到 ScopeManager
- **TemplateRepository.getMostUsed()**: 標記為 @deprecated

#### 影響
- 模板檔案不再包含 usage 和 lastUsedAt 欄位
- 所有使用統計集中在 scope.json 管理
- 提升效能 (不需要更新每個模板檔案)
- 簡化代碼 (移除格式兼容邏輯)

### 🎨 Templates Panel UI 增強 (2025-10-19)

**新增功能**: 麵包屑導航、展開/收合控制、智能預設收合

#### 麵包屑導航改進
- 最後項目添加文檔圖示按鈕 (📖)
- 點擊可查看當前主題的詳細說明文件
- 按鈕樣式與主題一致，hover 效果流暢

#### 展開/收合控制
- 標題列右上角添加「全部展開」和「全部收合」按鈕
- 文字形式按鈕，清晰易用
- `navigation-handler.js`:
  - 新增 `expandAllTopics()` 方法
  - 新增 `collapseAllTopics()` 方法
  - `handleCollapseControlClick()` 處理事件

#### 智能預設收合邏輯
- **當前主題的剩餘模板區域**: 展開且無高度限制
  - 使用 `data-current-topic-path` 屬性識別
  - 添加 `.current-topic-remaining` 類別
  - CSS: `max-height: none` 移除高度限制
- **其他主題區域**: 收合且有高度限制
  - 保持原有的高度限制
  - 預設收合狀態

#### 技術實現
- **NavigationRenderer.ts**:
  - `generateBreadcrumbHtml()`: 添加文檔按鈕 (lines 68-74)
  - `generateCollapseControlsHtml()`: 新增方法生成控制按鈕
- **templates-panel.js**:
  - 簡化 `getCurrentTopicPath()` 使用 data 屬性
  - `collapseAllTopicsOnInit()`: 實現智能收合邏輯 (lines 224-266)
- **templates-panel.css**:
  - 麵包屑文檔按鈕樣式 (lines 504-520)
  - 收合控制按鈕樣式 (lines 156-192)
  - `.current-topic-remaining` 樣式 (lines 588-590)

#### Bug 修正
- **TopicRenderer**: 修正子主題文檔圖示不顯示 (lines 206-207)
- **RecommendationRenderer**: 修正推薦區域不顯示問題

### 🐛 Manager Panel Bug Fixes (2025-10-19)

**修復內容**: 修復 Manager Panel 中複製、創建、刪除功能的多個關鍵問題

- **複製功能修復**
  - 修正複製模板/主題後保存時「找不到指定的模板」錯誤
  - 問題：`event-coordinator.js` 和 `manager.js` 使用 `if (editingItem)` 判斷模式
  - 解決：改為 `if (editingItem && editingItem.name)` 正確區分編輯/創建模式
  - 影響檔案：
    - `assets/js/manager-panel/core/event-coordinator.js`
    - `assets/js/manager-panel/manager.js`

- **表單欄位編輯修復**
  - 修正複製項目時名稱欄位仍為唯讀的問題
  - 修正複製模板時主題路徑未預填的問題
  - 解決：表單生成器檢查 `name` 屬性存在性，同時支援 `topicPath` 和 `topic` 屬性
  - 影響檔案：`assets/js/manager-panel/ui/form-generator.js`

- **主題創建數據轉換**
  - 修正創建主題時「Cannot read properties of undefined (reading 'icon')」錯誤
  - 問題：前端傳送扁平結構（`color`, `icon`），後端期望巢狀 `display` 物件
  - 解決：在 `TopicActions.createTopic()` 中轉換數據格式
  - 影響檔案：`packages/vscode/src/providers/manager-panel/actions/TopicActions.ts`

- **文檔類型處理**
  - 修正「documentation.trim is not a function」錯誤
  - 問題：程式假設 `documentation` 是字串，但可能是物件
  - 解決：新增 `hasDocumentation()` 輔助方法處理字串和物件兩種格式
  - 影響檔案：
    - `packages/vscode/src/providers/templates-panel/renderers/CardRenderer.ts`
    - `packages/vscode/src/providers/templates-panel/renderers/TopicRenderer.ts`

- **刪除確認統一**
  - 統一主題、模板、連結的右鍵刪除行為
  - 所有刪除操作使用一致的 modal 確認對話框
  - 刪除後自動清空詳情面板並刷新顯示

### 🏗️ Core Architecture Overhaul (2025-09-30)

**完成階段**: Phase 1-6 全部完成

- **Phase 1: TopicManager 整合** - 消除 ~246 行重複的主題載入邏輯
  - 刪除 `loadTopicsRecursively`, `loadTemplatesFromTopic`, `loadCardsFromTopic` 等重複方法
  - 實現 `buildFromManagers` 統一從 TopicManager 載入資料
  - TextBricksEngine: 1,203 → 1,189 行 (-14 行)

- **Phase 2: TemplateRepository 提取** - 模板 CRUD 獨立為專屬 Repository
  - 新增 `packages/core/src/repositories/TemplateRepository.ts` (370 行)
  - 完整的 CRUD 操作、查詢方法、檔案系統操作
  - 簡化 Engine 的 `createTemplate`, `updateTemplate`, `deleteTemplate` 方法 (從 119 行 → 17 行)
  - TextBricksEngine: 1,189 → 1,046 行 (-143 行)

- **Phase 3: RecommendationService 提取** - 推薦演算法獨立化
  - 新增 `packages/core/src/services/RecommendationService.ts` (107 行)
  - 可配置的推薦參數（usageWeight, recencyWeight, recentDays, monthlyDecay）
  - Engine 推薦方法從 22 行簡化到 3 行

- **Phase 4: Topic 模型統一** - 合併重複的 Topic 型別定義
  - 統一使用 `TopicConfig` 作為主要模型
  - 保留 `Topic` 作為向後兼容的類型別名
  - 修正 6 處類型不匹配問題

- **Phase 5: DataPathService 單例化** - 確保全局狀態一致
  - 實現 singleton pattern 與 `getInstance()` 方法
  - 更新 6 處創建點使用 `getInstance(platform)`

- **Phase 6: 清理與整合** - 移除空目錄與整合服務
  - 刪除 4 個空目錄 (data/, migration/, hierarchical/, storage/)
  - 確認所有新架構組件正確整合

**成果統計**:
- TextBricksEngine: 1,203 → 1,027 行 (-14.6%)
- 新增服務: TemplateRepository (370), RecommendationService (107)
- 消除重複邏輯: ~500 行
- 架構改進: 單一職責、依賴注入、統一模型、清晰層次

### 🎨 UI Layer Refactoring (2025-09-30 ~ 2025-10-01)

**完成階段**: UI Phase 1-5 全部完成

- **UI Phase 1: 共享工具函數庫** (+338 行)
  - 新增 `assets/js/common/utils.js` 包含 20+ 工具函數
  - HTML 處理 (`escapeHtml`, `renderMarkdown`)
  - 日期時間 (`formatDate`, `formatRelativeTime`)
  - 數據處理 (`safeJsonParse`, `deepClone`, `debounce`, `throttle`)
  - 字符串處理 (`truncate`, `toKebabCase`, `toCamelCase`)
  - 消除 main.js 和 textbricks-manager.js 的重複函數

- **UI Phase 2: CSS 組件系統** (+479 行)
  - 新增 `assets/css/common/variables.css` (81 行) - 設計令牌系統
  - 新增 `assets/css/common/components.css` (398 行) - 可重用 UI 組件
  - 統一的 CSS 變數系統 (tb-* 前綴)
  - 8 大設計系統：顏色、間距、字體、圓角、陰影、動畫
  - 組件庫：卡片、按鈕、Modal、標籤、載入動畫

- **UI Phase 3: Card 模板系統** (+223 行)
  - 新增 `assets/js/common/card-templates.js`
  - 統一的卡片 HTML 生成邏輯
  - 支援 template, topic, link 三種卡片類型
  - 動作按鈕系統 (preview, copy, insert, edit, delete, favorite)

- **UI Phase 4: 事件系統統一** (+180 行)
  - 新增 `assets/js/common/event-delegator.js`
  - 統一的事件委託系統
  - 自動管理 document 事件監聽器
  - 性能優化：單一監聽器 + closest() 選擇器匹配

- **UI Phase 5: 模板分離基礎設施** (+70 行，部分完成)
  - 新增 `packages/vscode/src/utils/TemplateLoader.ts`
  - 新增 HTML 模板文件 (webview.html, manager.html)
  - 模板緩存機制和變量替換系統
  - 未完成：Providers 遷移（待後續優化）

**UI 成果統計**:
- 新增共享代碼: utils.js (338), CSS (479), card-templates.js (223), event-delegator.js (180)
- 新增基礎設施: TemplateLoader (70), HTML 模板 (2 文件)
- 消除重複的工具函數和 CSS
- 統一 UI 風格和事件處理模式

### 🔨 Provider 模組化拆分（全部完成）(2025-10-17 ~ 2025-10-19)

完整的 4 步驟模組化拆分，大幅提升代碼可維護性和組織性

#### Step 1: Manager.js 模組化拆分
- 將 manager.js (5,753 行) 拆分為 21 個模組
- 主文件縮減 59.8% 到 ~2,300 行
- 清晰的模組邊界和職責劃分
- 模組類別：core, ui, services, utils

#### Step 2: Templates Panel 模組化拆分
- 拆分為 12 個功能模組
- 改善前端 JavaScript 代碼組織
- 模組化事件處理和 UI 渲染邏輯

#### Step 3: ManagerPanelProvider 拆分
- **縮減**: 2,088 行 → 1,226 行 (縮減 41.3%)
- **8 個 Action 模組**:
  - ScopeActions.ts - Scope 管理
  - TopicActions.ts - 主題 CRUD
  - TemplateActions.ts - 模板 CRUD
  - LinkActions.ts - 連結管理
  - LanguageActions.ts - 語言設定
  - SettingsActions.ts - 設定管理
  - ImportExportActions.ts - 匯入/匯出功能
  - ManagerMessageHandler.ts - 訊息路由
- **位置**: `packages/vscode/src/providers/manager-panel/`

#### Step 4: TemplatesPanelProvider 拆分
- **縮減**: 1,410 行 → 434 行 (縮減 69.2%)
- **4 個 Action 模組**:
  - NavigationActions.ts - 導航邏輯
  - RecommendationActions.ts - 推薦系統
  - FavoriteActions.ts - 收藏功能
  - InsertActions.ts - 插入模板
- **4 個 Renderer 模組**:
  - NavigationRenderer.ts - 麵包屑和導航 UI
  - TopicRenderer.ts - 主題卡片渲染
  - CardRenderer.ts - 模板卡片渲染
  - RecommendationRenderer.ts - 推薦區域渲染
- **訊息處理**: TemplateMessageHandler.ts
- **位置**: `packages/vscode/src/providers/templates-panel/`

#### 成果總結
- **總縮減**: ~3,500 行 → ~1,660 行 (縮減 52.6%)
- **模組總數**: 21 個 (8 個 actions + 4 個 renderers + 9 個前端模組)
- **架構改進**: 單一職責原則、清晰的關注點分離、易於測試和維護

### 🎨 CSS Reorganization (2025-10-18)

- **CSS 結構重組** - 採用 `-panel` 命名慣例
  - 重組為 `templates-panel/`, `manager-panel/`, `documentation-panel/`
  - 修復 documentation handler 整合問題
  - 改善樣式表結構

### 🧹 Code Quality Improvements (2025-10-03 ~ 2025-10-09)

- **統一推薦系統** - 整合不同的推薦實現
- **console.log 替換** - 使用適當的 logging 機制
- **移除 any 類型** - 增強類型安全

### 📝 Documentation Updates

- **REFACTORING.md** - 完成所有 11 個 phases 的執行紀錄
- **QUICK_REFERENCE.md** - 資訊搬遷至 CHANGELOG 和 AGENTS.md 後刪除
- **FILE_SPLITTING_PLAN.md** - 標記 Step 1-2 完成
- **CODE_REVIEW_LOG.md** - 持續更新代碼審查紀錄

---

## [0.2.5] - 2025-09-26

### ✨ New Features
- **Browsing History Navigation**: Added browser-like back/forward navigation based on actual browsing history
  - Smart history management that automatically clears forward history when navigating to new pages
  - Dynamic button states (enabled/disabled) based on history availability
  - Intelligent tooltips showing target page titles
  - Loading animations and visual feedback for navigation actions
- **Clickable Breadcrumb Navigation**: Enhanced breadcrumb navigation with clickable path elements
  - Click on any breadcrumb segment to navigate directly to that level
  - Uses displayName from managed topics for better readability
  - Integrated with browsing history system
- **Centralized Language Management**: Introduced scope.json for unified language and topic configuration
  - Centralized language definitions with id, name, displayName, tagName, description, fileExtensions, icon, and color
  - Template cards now display short tagNames (C, PY, JS) instead of full language names
  - Added language property to all template files for future language conversion features
- **Hierarchical Topic System Foundation**: Implemented topic.json structure for v0.3.0 architecture
  - Individual topic.json files with id, name, displayName, description, documentation
  - Subtopic hierarchy support with configurable templates/links folder structure
  - Display configuration with icon, color, order, collapsed state, and navigation visibility
  - Cross-topic link system for topic navigation (e.g., basic → advanced topics)
- **Enhanced Template Preview System**: Fixed template card preview functionality
  - Resolved missing language properties causing preview failures
  - Updated JavaScript selectors to handle both .template-title and .card-title formats
  - Added comprehensive null checks and fallback logic for robust preview display

### 🎨 UI/UX Improvements
- **Unified Scrollable Containers**: Standardized all topic areas to use 3.5 card height scrollable containers
  - Consistent scrolling experience across recommended templates and topic areas
  - Improved scrollbar styling integrated with VSCode theme
  - Better space utilization with fixed container heights
- **Navigation Controls Layout**: Enhanced breadcrumb navigation area with integrated history buttons
  - Flexible layout accommodating both breadcrumbs and navigation controls
  - Professional button styling with hover and active states
  - Responsive design maintaining usability across different sidebar widths

### 🔧 Technical Improvements
- **History Management System**: Implemented robust browsing history tracking in WebviewProvider
  - `_browsingHistory` array storing complete navigation path
  - `_historyIndex` for precise history position tracking
  - Prevents duplicate entries and manages history state transitions
- **Enhanced Navigation Logic**:
  - `_handleBackNavigation()` and `_handleForwardNavigation()` for history-based navigation
  - `_getPageTitle()` method for intelligent page title resolution
  - Integration with existing topic navigation system
- **Improved Event Handling**: Updated JavaScript navigation event handlers
  - `handlePageNavigationClick()` for history navigation messages
  - Visual feedback with loading states and opacity changes
  - Better separation of concerns between different navigation types
- **Topic System Architecture**: Established foundation for hierarchical topic management
  - Scope configuration system with `_loadScopeConfig()` and `_getLanguageTagName()` methods
  - Topic.json file structure supporting nested subtopics and configurable folders
  - Link system implementation for cross-topic references and navigation
  - Display configuration management for topic presentation and behavior

### 🎯 Developer Experience
- **Comprehensive Logging**: Added detailed console logging for navigation state tracking
- **Type Safety**: Enhanced TypeScript interfaces for navigation state management
- **Maintainable Code**: Clear separation between UI, business logic, and state management

## [0.2.5] - 2025-09-19

### 🎨 UI/UX Improvements
- **Template Card Display**: Fixed template cards being cut off in the middle due to CSS overflow issues
- **Responsive Layout**: Optimized grid breakpoints for VSCode sidebar - adjusted multi-column layout thresholds (400px → 500px, 600px → 800px)
- **Template Card Sizing**: Increased minimum height (55px → 70px) and improved padding for better content visibility
- **Scrolling Behavior**: Removed restrictive overflow constraints and max-height limitations for smoother scrolling
- **Description Text**: Enhanced text wrapping and removed forced truncation for better readability
- **Visual Hierarchy**: Improved template description color contrast (lighter text for better visual separation)

### 🔧 Technical Fixes
- **CSS Syntax**: Fixed malformed CSS rules causing display issues
- **Container Layout**: Improved flexbox layout for better space utilization
- **Grid Overflow**: Changed templates grid from `overflow: hidden` to `overflow: visible` for complete content display
- **Card Dimensions**: Added proper box-sizing and width constraints for consistent rendering

### 🎯 User Experience
- **Content Accessibility**: All template content now fully visible without unexpected cutoffs
- **Better Readability**: Improved text contrast and spacing for easier template browsing
- **Responsive Design**: Optimized layout specifically for VSCode sidebar width constraints
- **Consistent Rendering**: Fixed cross-platform display inconsistencies

## [0.2.4] - 2025-09-15

### 🧹 Major Refactoring & Code Cleanup
- **System-wide Cleanup**: Removed unnecessary components including ContextAnalysisService, over-designed interfaces, and duplicate TemplateProvider
- **Modular Manager Architecture**: Created platform-independent managers: ImportExportManager, SearchManager, ValidationManager
- **Unified Command Service**: Consolidated all command handling into CommandService with integrated validation and search capabilities
- **Code Simplification**: Removed 200+ lines of unimplemented TODO methods and over-engineered features

### 🏗️ Architecture Improvements
- **Platform Abstraction**: Extracted platform-independent business logic from VSCode layer to Core layer
- **Manager Pattern**: New modular managers for import/export, search/filtering, and data validation
- **Responsibility Separation**: Clear separation between UI (VSCode), business logic (Core), and data models (Shared)
- **Future-Ready**: Prepared architecture for hierarchical topics where languages become root nodes

### ✨ Topic System Enhancement (Previous Update)
- **Topic System Refactoring**: Replaced rigid level-based categorization (level1-4) with flexible topic-based system
- **Customizable Topics**: Users can now define custom topic names like "基礎概念", "網頁開發", "演算法" etc.
- **Semantic Topic Names**: Updated from `level1-4` to free-form topic names: "基礎", "控制", "函數", "進階"
- **UI Simplification**: Removed level badges for cleaner interface focused on content
- **TextBricks Manager Enhancement**: Topic input system with text field instead of numeric level restrictions

### 🔧 Technical Enhancements
- **Type Safety**: Complete TypeScript interfaces for all new managers with proper exports
- **Error Handling**: Comprehensive validation and error handling in CommandService
- **Search Capabilities**: Enhanced search with filtering, sorting, and suggestion features
- **Import/Export**: Robust template import/export with validation and error reporting
- **Data Model Update**: Removed `TemplateCategory` entirely, using `Template.topic` string for complete flexibility
- **Forward Compatibility**: Automatic migration from old level-based data to new topic system

### 📦 Removed Components
- **ContextAnalysisService**: Eliminated 200+ lines of unimplemented context analysis methods
- **Over-designed Interfaces**: Removed ProgrammingContext, ContextualRecommendation, UserProfile, LearningContext
- **Duplicate Code**: Removed TemplateProvider that duplicated WebviewProvider functionality
- **Empty Methods**: Cleaned up unused compatibility methods in TextBricksEngine

### 🎯 Development Benefits
- **Cleaner Codebase**: More maintainable and focused codebase without unused complexity
- **Modular Design**: Easy to test, extend, and maintain individual components
- **Platform Independence**: Core business logic can be reused across different platforms
- **Hierarchical Ready**: Architecture prepared for upcoming language-as-root-node topic hierarchy
- **Greater Flexibility**: Educators can create course-specific topics, developers can organize by project needs
- **Better Scalability**: Support for unlimited custom topics instead of fixed 4 levels

## [0.2.3] - 2025-09-05

### 🐛 Critical Bug Fixes
- **Template Text Selection Insertion**: Completely resolved indentation issues when selecting and inserting partial template content
- **Target Indentation Handling**: Fixed cursor position indentation not being properly considered during code insertion
- **Relative Indentation Logic**: Corrected FormattingEngine to properly combine target indentation with relative indentation levels
- **Edge Cases**: Properly handle closing braces and same-level lines alignment

### 🔧 Technical Improvements
- **FormattingEngine Optimization**: Enhanced `formatCodeSnippetWithTemplate` method with improved logic
- **Indentation Calculation**: Fixed formula to use `targetIndentation + indentUnit.repeat(indentLevels)` instead of just relative indentation
- **User Experience**: Template selection and insertion now works flawlessly with correct indentation preservation
- **Debugging Enhancement**: Added comprehensive logging and error handling for formatting operations

### 📦 Package Updates
- **Version Synchronization**: Updated all packages (@textbricks/shared, @textbricks/core, @textbricks/vscode) to v0.2.3
- **Dependencies**: Synchronized inter-package dependencies to maintain consistency
- **Build System**: Successful VSIX generation (textbricks-0.2.3.vsix, 497.36KB)

### 🎯 Impact
- **Complete Resolution**: Template text selection insertion indentation problem fully solved
- **User Satisfaction**: No more frustrating indentation issues when working with selected template content
- **Code Quality**: Enhanced formatting engine stability and reliability

## [0.2.2] - 2025-09-05

### 🔧 Fixed
- **Template Loading**: Removed hardcoded `info.name === 'Visual Studio Code'` detection that caused failures across different VS Code environments
- **Dynamic Imports**: Replaced synchronous require() with dynamic imports for better compatibility
- **Template Path Resolution**: Added multiple fallback paths for VSIX package template loading
- **Deprecated APIs**: Fixed deprecated `substr()` calls, replaced with `substring()`

### 🏗️ Architecture Improvements  
- **Capability-Based Detection**: Replaced brittle string comparisons with platform capability detection
- **VSIX Path Structure**: Enhanced template loading to support packaged extension paths
- **Robust Fallbacks**: Multiple template location attempts for different deployment scenarios

### 🛠️ Build & Release
- **VSIX Output Structure**: Configured generation to `dist/plugins/vscode/` with versioning support
- **Version Management**: Added `current` → `v0.2.2` symbolic links for release management
- **Cleanup**: Removed unnecessary `jest.config.js` after monorepo migration

## [0.2.1] - 2025-09-05

### 🔧 Fixed
- **TextBricks Manager Layout**: Fixed broken layout caused by incorrect asset paths
- **Resource Loading**: Corrected CSS and JS file loading paths from `media/` to `assets/`
- **Documentation Provider**: Fixed asset path references for proper styling
- **Build System**: Ensured all asset files are correctly copied to build output

### 🛠️ Improved
- **Asset Management**: Unified all media resources under `assets/` directory structure
- **Development Experience**: Removed path confusion between media and assets folders

## [0.2.0] - 2025-09-05

### 🏗️ Major Architecture Overhaul - Multi-Platform Foundation

#### ✨ Added
- **Monorepo Structure**: Complete migration to npm workspaces with `packages/core`, `packages/shared`, `packages/vscode`
- **Unified Build System**: Centralized dist/ directory structure supporting multiple platform plugins
- **Platform-Agnostic Core**: TextBricksEngine with full abstraction from VS Code APIs
- **Standard Asset Organization**: Unified assets/ structure following project conventions
- **Enhanced Build Scripts**: Dedicated VS Code build, package, and archive workflows
- **Multi-Platform Ready**: Foundation prepared for Vim, Sublime Text, and other editor plugins

#### 🔧 Changed
- **File Structure**: Reorganized from flat structure to modular monorepo architecture
- **Asset Management**: Moved icons/ and media/ into standardized assets/ directory
- **Build Targets**: Updated TypeScript compilation to target dist/plugins/vscode/current/
- **Documentation**: Consolidated project documentation with comprehensive guides

#### 🛠️ Improved  
- **Type Safety**: Enhanced TypeScript interfaces and platform abstractions
- **Code Organization**: Clear separation between core logic and platform adapters
- **Build Performance**: Optimized compilation and asset copying workflows
- **Version Management**: Automated VSIX archiving and version control

#### 🗂️ Infrastructure
- **Gitignore**: Complete dist/ directory exclusion to prevent large file tracking
- **Package Scripts**: New build:vscode, package:vscode, archive:vscode commands
- **Asset Pipeline**: Automated copying of CSS, JS, and icon resources
- **Documentation**: Updated AGENTS.md, CLAUDE.md, and project guides

## [0.1.8] - 2024-12-XX

### 🏗️ Architecture Refactor - Multi-Platform Support

#### Added
- **Platform Abstraction Layer**: Complete separation of core logic from VS Code APIs
- **Multi-Platform Architecture**: Extensible design for Vim, NeoVim, Chrome, Obsidian, Zed support
- **Core Services**: Platform-agnostic TextBricksEngine, DocumentationService, SearchService, CodeOperationService
- **Adapter Pattern**: VSCode-specific adapters (VSCodeEditor, VSCodeUI, VSCodeStorage, VSCodePlatform)
- **Type-Safe Interfaces**: Comprehensive TypeScript interfaces for all platform integrations

#### Changed
- **Unified Template Engine**: Refactored TemplateEngine → TextBricksEngine with platform abstraction
- **Modular Design**: Clear separation of concerns with layered architecture
- **Code Organization**: Better file structure with dedicated core/ and adapters/ directories

#### Technical Improvements
- **Zero Breaking Changes**: Backward compatibility maintained for existing VS Code functionality
- **Improved Maintainability**: Centralized business logic, reduced code duplication
- **Enhanced Testability**: Core services can be tested independently of platform APIs
- **Future-Proof**: Easy extension to new editor platforms

## [0.1.7] - 2025-01-XX

### 🧠 Smart Indentation System - Major Overhaul

#### Added
- **Unified Indentation System**: Complete rewrite with single `formatCodeSnippetUnified` method handling all insertion scenarios
- **Same-Level Detection**: Intelligent recognition when code lines are at identical indentation levels
- **Smart Cursor Analysis**: Empty line detection prevents unnecessary indentation when inserting at line start (column 0)
- **Template-Assisted Recovery**: Automatic recovery of lost indentation information using original template context
- **Comprehensive Test Suite**: Full test coverage for all indentation scenarios and edge cases

#### Changed
- **Consistent Insertion Behavior**: Tooltip and documentation insertions now use identical logic, eliminating inconsistencies
- **Provider Unification**: Both `WebviewProvider` and `DocumentationProvider` use the same formatting method
- **Improved Algorithm**: Enhanced same-level detection with better handling of mixed indentation scenarios

#### Fixed
- **Indentation Inconsistency**: Fixed bug where tooltip insertions and documentation insertions behaved differently
- **Empty Line Handling**: Fixed excessive indentation when inserting code at the start of empty lines
- **Selection Recovery**: Fixed issue where selected text from documentation lost proper indentation context

#### Technical Improvements
- **Code Duplication Elimination**: Unified codebase with single source of truth for indentation logic
- **Backward Compatibility**: Maintained existing `formatCodeSnippetWithTemplate` method for compatibility
- **Architecture Simplification**: Cleaner provider structure with shared formatting infrastructure

### 🔧 Other Improvements

#### Added
- **GitHub Codespaces Optimization**: Enhanced experience for GitHub Codespaces environment
- **Enhanced Test Coverage**: Comprehensive testing for edge cases and boundary conditions

#### Changed  
- **Code Quality**: Streamlined codebase with improved maintainability
- **Performance**: Optimized formatting algorithms and reduced redundant processing

## [0.1.6] - 2024-XX-XX

### Added
- **Interactive Code Blocks**: Documentation code blocks with insert and copy buttons
- **Smart Selection Support**: Select specific portions of code in documentation to insert/copy only that part
- **Enhanced User Experience**: Improved tooltip interactions and visual feedback

## [0.1.5] - 2024-XX-XX

### Added
- **Smart Indentation System**: Initial intelligent copy-paste with automatic indentation adjustment
- **Context-Aware Formatting**: Preserves relative indentation relationships between code lines
- **Multi-Line Template Support**: Proper handling of complex templates with nested indentation
- **Tooltip Text Selection**: Smart indentation for selected text copied from template previews
- **Seamless Integration**: Automatic operation with all copy operations without additional setup
- **Enhanced Copy Experience**: Template copying adapts to cursor position and maintains code structure

## [0.1.4] - 2024-XX-XX

### Added
- **Documentation System**: Rich Markdown documentation for templates with examples and explanations
- **TextBricks Manager Integration**: Edit and preview documentation with modal preview window
- **Side Panel Display**: Documentation opens in editor side panel with syntax highlighting
- **Smart Content Detection**: Automatically distinguish between file paths, URLs, and Markdown content
- **UI Integration**: Documentation buttons in hover tooltips (📖 icon) for clean interface
- **Standard Format**: Consistent documentation structure with overview, examples, and key concepts
- **Multiple Doc Types**: Support for embedded Markdown, local files (.md), and external URLs

### Fixed
- **TextBricks Manager**: Resolved loading issues and documentation content processing

## [0.1.3] - 2024-XX-XX

### Added
- **Smart Recommendation System**: AI-powered template suggestions based on usage patterns
- **Usage Tracking**: Automatic tracking of template frequency and timing
- **Visual Indicators**: Recommended templates marked with golden star icons (⭐)
- **Dynamic UI**: Smooth animations and visual feedback for better user experience
- **Golden Theme**: Unified design for recommendation sections

## [0.1.2] - 2024-XX-XX

### Added
- **Multi-Language Support**: Added Python and JavaScript templates alongside C
- **TextBricks Manager**: Comprehensive template management interface with CRUD operations
- **JSON Batch Import**: Quick bulk template addition feature with validation
- **Import/Export**: Full template collection backup and sharing capabilities
- **Enhanced Validation**: Real-time validation for template data integrity
- **Language Selector**: Easy switching between programming languages
- **Extensible Architecture**: Built for future expansion and customization

### Changed
- **Improved UI**: Compact header design and optimized space utilization
- **Updated Repository**: Correct GitHub repository links and metadata

## [0.1.1] - 2024-XX-XX

### Added
- Initial multi-language release with template management features

## [0.1.0] - 2024-XX-XX

### Added
- Initial release of TextBricks
- Basic C language templates
- VSCode sidebar integration
- Template insertion functionality