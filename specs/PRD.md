# TextBricks - 產品需求文件 (PRD)

> **版本**: 2.0
> **更新日期**: 2025-10-18
> **狀態**: v0.3.0 開發中

---

## 📋 產品願景

### 核心定位

**TextBricks** 是一個**多形態程式與規格表達平台**，旨在突破傳統純文字編程的限制，讓程式碼和規格可以在不同的表現形式之間自由轉換。

在規格驅動的未來，規格的地位將如同今日的程式碼。TextBricks 不僅是程式碼模板工具，更是一個從抽象到具體、從意圖到實現的**多層次表達與轉換系統**。

### 長期願景

1. **程式知識的維基百科** - 開放的程式設計知識與模式平台
2. **多形態程式編輯器** - 支援序列、結構、圖譜三種表現形式
3. **AI 意圖理解基礎設施** - 收集社群使用習慣，為 AI 理解人類編程意圖鋪路
4. **降低程式學習門檻** - 讓更多人能夠以適合自己的方式理解和創建程式

---

## 🧩 核心概念：三形態理論

TextBricks 基於**「序列-結構-圖譜」三形態理論**，認為程式/規格有三種本質性的表現形式：

### 多形態知識單元

每個模板都是一個**完整的多形態知識單元**，包含三種形態的檔案：
- `sequence.*` - 序列形態（文字程式碼）
- `structure.*` - 結構形態（積木表示）
- `topology.*` - 圖譜形態（節點流程）

**核心設計原則**：三種形態存放在同一個目錄下，不拆散，確保知識單元的完整性。

### 1. 序列（Sequence）- 文字模板

**語法層面**：「這段程式怎麼寫」

- **形式**：傳統的文字程式碼
- **關注點**：語法規則、縮排結構、程式碼風格
- **優勢**：精確、可編輯、適合有經驗者
- **劣勢**：學習曲線陡峭、語法複雜、容易出錯

**當前狀態**: ✅ **已實現** (v0.2.5-v0.3.0)

### 2. 結構（Structure）- 積木程式

**意圖層面**：「這段程式想做什麼」

- **形式**：Blockly 積木、樹狀結構
- **關注點**：程式意圖、邏輯組成、模組關係
- **優勢**：視覺化、易理解、語法無誤
- **劣勢**：表達能力受限、複雜程式難以呈現

**當前狀態**: 🚧 **規劃中** (v0.4.0 目標)

### 3. 圖譜（Topology）- 節點流程

**拓撲關係層面**：「各部分如何連接與互動」

- **形式**：Node Flow 節點編輯器、資料流圖
- **關注點**：模組連接、資料流動、系統架構
- **優勢**：全局視角、關係清晰、適合架構設計
- **劣勢**：細節隱藏、不適合細粒度編輯

**當前狀態**: 🚧 **規劃中** (v0.5.0 目標)

---

## 🌍 跨語言層級支援

### 統一的語言觀

**核心洞察**：不論是自然語言、程式語言、還是硬體描述語言，本質上都是**語言** (Language)。

TextBricks 的願景是成為**跨語言層級的多形態知識平台**，支援從最抽象的自然語言規格，到最具體的物理電路設計。

### 完整的抽象層級

```
抽象層級 ↕️ 轉換工具 →

🔸 Natural Language (自然語言)
   例如：spec.md, requirements.txt
   轉換：Coding Agent (Claude, Copilot)
      ↓
🔸 High-Level Programming (高階程式語言)
   例如：Python, JavaScript, Java, C
   轉換：Interpreter / Compiler
      ↓
🔸 Low-Level Programming (低階程式語言)
   例如：Assembly (x86, ARM)
   轉換：Assembler
      ↓
🔸 Machine Language (機器語言)
   例如：x86 bytecode, ARM instructions
   執行：CPU
      ↓
🔸 Hardware Description (硬體描述語言)
   例如：Verilog, VHDL
   綜合：Synthesis Tools
      ↓
🔸 Physical Circuit (實體電路)
   例如：Netlist, PCB Layout
   製造：Fabrication Process
```

### 每個層級都有三種形態

**關鍵發現**：不論在哪個抽象層級，都可以用三種形態表達。

#### 自然語言的三形態
- **Sequence**: `spec.md` (Markdown 文字)
- **Structure**: 結構化規格 (JSON/XML)
- **Topology**: 需求關聯圖

#### 程式語言的三形態
- **Sequence**: `.py`, `.js`, `.c` (文字程式碼)
- **Structure**: Blockly 積木
- **Topology**: 呼叫圖、資料流圖

#### 硬體描述語言的三形態
- **Sequence**: `.v`, `.vhd` (HDL 文字碼)
- **Structure**: 邏輯閘積木
- **Topology**: 電路圖、時序圖

#### 機器語言的三形態
- **Sequence**: binary/hex code (位元組序列)
- **Structure**: 指令區塊
- **Topology**: 執行流水線圖

### TextBricks 在各層級的角色

每個語言層級都可以有 TextBricks 模板：

- **自然語言模板**: API 規格模板、使用者故事模板、演算法描述模板
- **高階語言模板**: for-loop、class、function、框架特定模板 (FastAPI, React)
- **組合語言模板**: 函數序幕/結語、系統呼叫模式
- **HDL 模板**: 計數器、狀態機、記憶體控制器
- **電路模板**: 常見電路模式、佈線模式

### 當前實現範圍

**v0.3.x 階段**：
- ✅ 支援高階程式語言（C, Python, JavaScript）
- ✅ 序列形態（文字程式碼）完整實現

**未來路線圖**：
- 🚧 v0.4.0: 結構形態（Blockly 積木）
- 🚧 v0.5.0: 圖譜形態（Node Flow）
- 🚧 v0.6.0: 自然語言（規格模板）
- 🚧 未來: Assembly、HDL、Machine Code 等其他語言層級

---

## 🔄 形態轉換機制

### 結構化過程（Structuring）

**文字 → 積木**：分析程式意圖，轉換成結構化表示

```
輸入文字 → 語法分析 → 意圖識別 → 積木表示
```

- **可控區**：有註解或意圖明確的部分，可自動轉換
- **不可控區**：多種可能性或無法理解的部分，需要詢問使用者或 Agent
- **挑戰**：相對困難，需要理解語義

### 序列化過程（Serialization）

**積木 → 文字**：將結構化表示生成符合語法的程式碼

```
積木表示 → 模組引用 → 抽象層級選擇 → 程式碼生成
```

- **智慧引用**：根據當前抽象層級自動選擇合適的表達方式
- **模組重用**：引用現有模組而非重新生成
- **優勢**：相對容易，規則明確

### 圖譜化過程（Topologization）

**結構/序列 → 圖譜**：視覺化模組間的連接關係和資料流

```
程式碼/積木 → 依賴分析 → 關係提取 → 網絡可視化
```

- **可視範圍**：可控制顯示的範圍和縮放層級
- **動態調整**：根據需求切換視角（函數級、模組級、系統級）

### 轉換原則

1. **情境驅動選擇**：根據不同任務選擇最適合的表現形式
2. **可轉換優先**：儘可能實現雙向轉換
3. **不可轉換時詢問**：遇到無法自動轉換的情況，詢問更高層級的存在（Agent、人類）
4. **保留意圖**：轉換過程中保留原始意圖和語義

---

## 🎯 當前實現：序列階段 (v0.2.5-v0.3.0)

### 產品定位

**混合定位**：既服務初學者學習需求，也提供專業開發者效率工具

- ✅ 初學者可以瀏覽結構化的學習路徑
- ✅ 進階使用者可以快速插入和管理自訂模板
- ✅ 教師可以建立課程 Scope 分享給學生

### 核心功能

#### 1. 階層式主題系統

**路徑基礎組織** - 支援跨語言層級的靈活內容組織

```
scopes/
└── local/
    ├── scope.json          # Scope 配置
    │
    └── templates/          # 按語言層級組織的知識單元
        ├── _registry/      # Template Registry
        │
        ├── natural/        # 自然語言層級
        │   └── english/
        │       └── specs/
        │           └── rest-api-endpoint/
        │               ├── meta.json
        │               ├── sequence.md
        │               ├── structure.json
        │               └── topology.json
        │
        ├── high-level/     # 高階程式語言
        │   ├── python/
        │   │   └── basics/
        │   │       └── hello-world/    # 多形態知識單元 ⭐
        │   │           ├── meta.json
        │   │           ├── sequence.py
        │   │           ├── structure.xml
        │   │           ├── topology.json
        │   │           └── README.md
        │   ├── c/
        │   └── javascript/
        │
        ├── low-level/      # 低階程式語言（Assembly）
        ├── machine/        # 機器語言
        ├── hdl/            # 硬體描述語言
        └── physical/       # 物理電路
```

**特色**：
- 🌍 **語言層級組織**：支援自然語言、高階語言、組合語言、HDL 等所有語言層級
- 📦 **知識單元完整性**：每個模板包含完整的三種形態（sequence, structure, topology）
- 🗂️ **統一路徑結構**：`templates/{language-level}/{language}/{topic}/{template-name}/`
- 🔍 **Registry 索引**：集中式的模板註冊和查詢系統
- 📁 **階層組織**：支援主題的無限嵌套
- 🎨 **自訂顯示**：圖標、顏色、排序、摺疊狀態

**設計理由**：
- 統一的架構支援從規格到硬體的所有抽象層級
- 為未來的跨語言層級轉換提供基礎
- 清晰的組織方式便於管理和擴展

#### 2. Scope 系統

**信任度與來源管理** - 區分不同來源的內容可信度

- **local scope**：使用者絕對信任的本地內容
- **其他 scope**：可以設定信任度和採納策略
- **使用場景**：
  - ✅ 個人 vs 團隊分離
  - ✅ 不同情境切換（工作、學習、專案）
  - ✅ 課程/教學管理（教師建立 scope，學生匯入）
  - 🚧 未來：專案綁定配置、雲端同步

**未來方向**：
- 🔄 **同步機制**：跨裝置同步個人配置
- 🌐 **社群分享**：Scope 分享和訂閱
- 📊 **信任度評級**：根據來源、使用者評價等計算信任度

#### 3. 三個 UI Panel

**功能職責分離 + 側邊欄空間優化**

1. **Templates Panel**（側邊欄）
   - **用途**：日常高頻使用 - 快速瀏覽和插入模板
   - **特色**：推薦/收藏雙標籤、麵包屑導航、搜尋功能
   - **設計理由**：初學者只需此面板即可開始使用

2. **Manager Panel**（完整面板）
   - **用途**：低頻管理 - 完整的 CRUD 操作
   - **特色**：樹狀導航、詳細編輯表單、批次匯入
   - **設計理由**：複雜操作需要完整空間，避免側邊欄過於複雜

3. **Documentation Panel**（完整面板）
   - **用途**：學習和參考 - 查看模板和主題說明文件
   - **特色**：Markdown 渲染、互動式程式碼區塊（可複製/插入）
   - **設計理由**：閱讀文件需要專注空間，與編輯分離

#### 4. 智慧縮排系統

**結構化文字插入** - FormattingEngine 的核心價值

**為什麼不用 VS Code Snippet？**
- ✅ **初學者友善**：不需要學習 Tab Stop、Placeholder 語法
- ✅ **跨平台一致**：未來支援 Vim/Web 時保證一致體驗
- ✅ **結構感知**：縮排反映程式結構，符合 TextBricks 理念
- ✅ **文檔支援**：Documentation Panel 的程式碼插入也需要智慧縮排

**工作原理**：
```typescript
// 檢測游標位置縮排
targetIndent = getCurrentIndentation();

// 分析程式碼相對結構
relativeStructure = analyzeIndentation(code);

// 保持相對結構，調整至目標縮排
formattedCode = adjustIndentation(code, relativeStructure, targetIndent);
```

#### 5. 推薦系統

**個人化學習路徑** - 基於使用習慣的智慧推薦

**當前因素**：
- 📊 使用頻率（10x 權重）
- ⏰ 最近使用（50x 權重，7 天內 1.2x 加成）
- ⭐ 收藏狀態

**未來方向**：
- 🧠 **上下文感知**：根據當前檔案類型和程式碼內容推薦
- 🌐 **社群熱門度**：結合社群使用數據推薦熱門模板
- 📈 **學習進度**：根據使用者學習階段推薦下一步內容

**長期目標**：收集社群使用習慣，為 AI 理解人類編程意圖和價值判斷提供數據基礎

#### 6. 收藏系統

**統一的路徑基礎收藏** - 不限類型的靈活收藏

- ✅ **Template 收藏**：常用程式碼片段
- ✅ **Topic 收藏**：重要學習主題
- ✅ **Link 收藏**：參考連結
- **設計理由**：路徑基礎設計可以收藏任何階層節點，適合學習路徑書籤

#### 7. Documentation 系統

**互動式學習文件** - 不只是閱讀，更是操作

**為什麼自己實現 Markdown 解析？**
- ✅ **互動式學習**：文件中的程式碼可以直接複製/插入到編輯器
- ✅ **輕量級**：避免引入大型 Markdown 庫
- ✅ **客製化控制**：特殊的程式碼區塊處理和按鈕行為
- ✅ **未來擴展**：計劃支援互動式練習、測驗等特殊語法

**特色功能**：
- Markdown 渲染（標題、粗體、斜體、程式碼、連結）
- 程式碼區塊語法高亮（highlight.js）
- 每個程式碼區塊附帶「複製」和「插入」按鈕
- 模板元資料顯示（語言、主題、描述）

---

## 🏗️ 技術架構

### Monorepo 結構

```
TextBricks/
├── packages/
│   ├── core/           # 平台無關核心邏輯
│   ├── shared/         # 共享類型和模型
│   └── vscode/         # VS Code 平台適配器
├── data/local/         # 預設模板數據
└── assets/             # Webview UI 資源
```

### 核心服務

#### TextBricksEngine
**統一模板引擎** - 協調所有核心服務

- 依賴注入架構
- 服務生命週期管理
- 統一的操作介面

#### FormattingEngine
**智慧縮排系統** - 結構感知的程式碼格式化

- `formatTemplate()` - 模板格式化
- `formatCodeSnippet()` - 程式碼片段格式化（可選模板輔助）
- 支援 tabs/spaces 檢測
- 保持相對縮排結構

#### TopicManager
**階層主題管理** - 建立和維護主題樹

- 從檔案系統載入 topic.json
- 建立 TopicHierarchy 樹狀結構
- 路徑基礎識別（`"c/basic/templates/hello-world"`）
- 主題 CRUD 操作

#### ScopeManager
**來源與信任管理** - 管理不同 Scope 的配置

- 載入可用 Scope
- 切換當前 Scope
- 管理收藏和使用統計（per-scope）
- 匯入/匯出 Scope

#### DataPathService
**平台無關儲存** - 跨平台的資料路徑管理

- 單例模式（`DataPathService.getInstance()`）
- 系統標準目錄（macOS: `~/Library/Application Support/TextBricks/`）
- 自訂資料位置支援
- 資料遷移功能

#### DisplayNameService & PathTransformService
**抽象層轉換** - 內部路徑與顯示名稱的轉換

- 統一的顯示名稱獲取
- 路徑與顯示格式互轉
- 為未來多形態轉換奠定基礎

### 平台適配器層

**VS Code Adapters** - 封裝 VS Code 特定 API

- `VSCodePlatform` - 平台介面實現
- `VSCodeEditor` - 編輯器抽象
- `VSCodeUI` - 用戶界面抽象
- `VSCodeStorage` - 儲存抽象
- `VSCodeClipboard` - 剪貼簿抽象

**設計理由**：為未來的 Vim/Neovim、Web 版本等多平台支援做準備

### 資料模型

#### TopicConfig
**主題配置** - topic.json 的 TypeScript 類型

```typescript
interface TopicConfig {
  type: 'topic';
  name: string;          // 唯一名稱
  title: string;         // 顯示標題
  description?: string;
  documentation?: string; // Markdown 文件
  subtopics?: string[];  // 子主題名稱陣列
  display?: {
    icon?: string;
    color?: string;
    order?: number;
    collapsed?: boolean;
    showInNavigation?: boolean;
  };
}
```

#### ScopeConfig
**Scope 配置** - scope.json 的結構

```typescript
interface ScopeConfig {
  id: string;
  name: string;
  description?: string;
  languages: Language[];      // 語言定義
  favorites: string[];        // 收藏的路徑陣列
  usage: Record<string, UsageData>; // 使用統計
  settings: Record<string, any>;
  metadata: {
    created?: string;
    updated?: string;
    author?: string;
  };
}
```

#### Template (Knowledge Unit)
**多形態知識單元** - 包含三種形態的完整模板

```typescript
interface Template {
  type: 'template';
  name: string;
  title: string;
  description?: string;

  // 語言層級和語言
  languageLevel: 'natural' | 'high-level' | 'low-level' | 'machine' | 'hdl' | 'physical';
  language: string;           // python, c, javascript, verilog, etc.

  // 三種形態檔案
  forms: {
    sequence: {
      main: string;           // sequence.py, sequence.c, sequence.md, etc.
      additional?: string[];  // 額外檔案 (e.g., sequence.h)
    };
    structure?: {
      workspace: string;      // structure.xml (Blockly)
      format: 'blockly' | 'json';
    };
    topology?: {
      graphs: string[];       // topology.json
      types: string[];        // call-graph, data-flow, etc.
    };
  };

  // 元資料
  documentation?: string;
  tags?: string[];
  dependencies?: string[];
}
```

---

## 🚀 未來路線圖

### v0.4.0：結構階段 - Blockly 積木程式

**目標**：實現序列 ↔ 結構雙向轉換

#### 核心功能

1. **Blockly 編輯器整合**
   - 嵌入 Blockly 編輯器到 Webview
   - 自訂 Block 定義（對應模板）
   - 積木拖放和組合

2. **結構化過程（文字 → 積木）**
   - 語法分析器（per-language）
   - AST 轉 Blockly XML
   - 意圖識別和映射
   - **可控區檢測**：根據註解判斷意圖明確性
   - **不可控區處理**：詢問使用者或 Agent

3. **序列化過程（積木 → 文字）**
   - Blockly XML 轉 AST
   - 程式碼生成器（per-language）
   - **智慧模組引用**：引用現有模板而非重新生成
   - **抽象層級選擇**：根據上下文選擇合適的表達粒度

4. **Block 模板系統**
   - 模板 ↔ Block 的映射定義
   - Block 模板庫（可複用的積木定義）
   - 自訂 Block 創建介面

#### 技術挑戰

- **多語言支援**：每種語言需要獨立的語法分析和生成器
- **意圖識別**：如何準確識別程式碼意圖
- **可逆性**：確保文字 → 積木 → 文字的過程不損失資訊
- **不可控區處理**：設計詢問機制和使用者介入流程

#### UI 設計

- 新增 Block Editor Panel
- Templates Panel 和 Block Editor 可切換
- 雙向同步：修改文字即時更新積木，反之亦然

### v0.5.0：圖譜階段 - Node Flow 工作流

**目標**：實現結構 ↔ 圖譜轉換，完成三形態閉環

#### 核心功能

1. **Node Flow 編輯器**
   - 節點流程編輯器（類似 n8n、Node-RED）
   - 節點定義：函數、模組、資料流
   - 連線和資料流動

2. **圖譜化過程（結構/序列 → 圖譜）**
   - 依賴分析（import/require）
   - 函數呼叫關係提取
   - 資料流分析
   - 網絡可視化

3. **可視範圍控制**
   - 函數級視圖：顯示函數內部邏輯
   - 模組級視圖：顯示模組間關係
   - 系統級視圖：顯示整體架構
   - 動態縮放和過濾

4. **流程 → 程式碼生成**
   - 節點流程轉換為程式碼
   - 保持資料流邏輯
   - 支援不同程式設計範式（事件驅動、函數式）

#### 技術挑戰

- **複雜度管理**：大型程式的圖譜可能過於複雜
- **佈局演算法**：自動佈局節點和連線
- **抽象層級**：如何在不同層級間平滑切換
- **路徑系統延伸**：需要設計節點的識別系統（目前未定）

### v0.6.0：規格支援

**目標**：擴展到程式規格和需求文件

#### 核心功能

- 規格模板系統
- 規格 ↔ 程式碼的追溯
- 規格驅動開發工作流
- 需求變更影響分析

**設計理由**：在規格驅動的未來，規格和程式碼都是結構化內容，可以用相同的三形態理論處理

### v1.0：社群與 AI

**目標**：建立社群生態和 AI 意圖理解基礎設施

#### 核心功能

1. **社群分享平台**
   - Scope/模板市集
   - 評分和評論系統
   - **信任度評級**：根據來源、評價、使用數計算
   - 訂閱和更新機制

2. **使用習慣數據收集**
   - 匿名化使用統計
   - 社群熱門趨勢
   - **價值判斷數據**：使用次數、信任關係、採納率
   - **意圖模式**：常見的編程意圖和模式

3. **AI 整合**
   - AI 輔助的意圖識別（結構化過程）
   - AI 生成模板和積木
   - 基於社群數據的智慧推薦
   - **為 LLM 提供人類編程意圖的訓練數據**

4. **雲端同步**
   - 跨裝置同步個人配置
   - Scope 雲端備份
   - 多人協作編輯

**長期意義**：TextBricks 收集的使用習慣和價值判斷數據，將成為 AI 理解人類編程意圖的重要基礎，幫助 AI 更好地理解「人類為什麼這樣寫程式」。

---

## 🎨 設計原則

### 1. 情境驅動選擇

**不同任務選擇最適合的形態**

- 快速原型 → 積木編輯
- 細節調整 → 文字編輯
- 架構設計 → 圖譜視圖
- 學習理解 → 在三者間切換

### 2. 可轉換優先，不可轉換時詢問

**儘可能實現自動轉換，遇到無法處理時尋求協助**

- 有註解或意圖明確 → 自動轉換
- 多種可能性或語義模糊 → 詢問使用者
- 完全無法理解 → 提交給 Agent 或人類專家

### 3. 語言作為測試案例

**不限定支援語言，語言只是內容的一種組織方式**

- C、Python、JavaScript 只是當前的測試案例
- 主題系統設計為語言無關
- 可以添加演算法、設計模式、專案模板等非語言特定內容
- 未來由社群貢獻者和教師主導語言套件的增加

### 4. Scope = 信任度 + 來源管理

**Scope 不只是命名空間，更是信任和來源的管理機制**

- local scope：絕對信任的個人內容
- 其他 scope：可設定信任度，選擇性採納
- 未來支援社群 scope 的訂閱和評級

### 5. 保留意圖和結構

**任何轉換都應該保留原始意圖和結構資訊**

- 縮排 = 結構
- 註解 = 意圖
- 命名 = 語義
- 轉換過程不損失這些關鍵資訊

### 6. 開放和可擴展

**平台無關、模組化、社群驅動**

- 核心邏輯獨立於平台
- 插件式語言支援
- 開放的模板和 Scope 格式
- 社群貢獻友善

---

## 💎 產品價值

### 對初學者

- ✅ **降低學習門檻**：從積木開始，逐步過渡到文字
- ✅ **視覺化理解**：圖譜幫助理解程式結構和流程
- ✅ **結構化學習路徑**：主題階層提供清晰的學習地圖
- ✅ **互動式文件**：Documentation Panel 提供即時操作體驗

### 對開發者

- ✅ **提升效率**：快速插入常用程式碼模板
- ✅ **多視角理解**：在文字、結構、圖譜間切換以理解複雜程式碼
- ✅ **自訂管理**：靈活的主題和 Scope 系統
- ✅ **跨專案複用**：Scope 機制支援模板在不同專案間共享

### 對教師

- ✅ **課程管理**：建立課程 Scope 分享給學生
- ✅ **教學內容**：提供結構化的學習材料和範例
- ✅ **學習追蹤**：未來可透過使用統計了解學生進度

### 對社群

- ✅ **知識共享**：建立開放的程式設計知識庫
- ✅ **最佳實踐**：收集和分享社群的程式模式
- ✅ **協作創建**：共同建設模板和文件生態

### 對 AI 和未來

- ✅ **意圖數據**：收集人類編程意圖和價值判斷
- ✅ **轉換範例**：提供序列-結構-圖譜轉換的實例數據
- ✅ **規格驅動**：為規格驅動開發的未來做準備
- ✅ **人機協作**：建立人類和 AI 共同理解程式的橋樑

---

## 🎯 成功指標

### 短期指標 (v0.3.0)

- **使用者數量**：VS Code Marketplace 安裝數
- **活躍度**：DAU/MAU 比例
- **模板使用**：平均每日插入次數
- **使用者反饋**：評價分數、GitHub Issues 品質

### 中期指標 (v0.4-v0.5)

- **形態轉換成功率**：文字 ↔ 積木 ↔ 圖譜的轉換準確度
- **多形態使用比例**：使用者在不同形態間切換的頻率
- **Scope 分享數**：社群建立和分享的 Scope 數量
- **教學採用率**：教師和教育機構的使用情況

### 長期指標 (v1.0+)

- **社群生態規模**：模板庫大小、貢獻者數量
- **跨平台使用率**：Vim、Web 等平台的使用分佈
- **AI 整合效果**：AI 輔助功能的使用滿意度
- **資料價值**：收集的意圖數據對 AI 訓練的貢獻度

---

## 📅 開發時程

### 2025 Q4（當前）

- ✅ v0.2.5 已發布
- 🚧 v0.3.0 階層式主題系統重構（進行中）
  - ✅ topic.json 格式和載入
  - ✅ TopicManager 階層建立
  - 🚧 UI 整合和樹狀導航優化

### 2026 Q1-Q2

- 🎯 v0.4.0 Blockly 積木程式
  - Blockly 編輯器整合
  - 文字 ↔ 積木雙向轉換
  - Block 模板系統

### 2026 Q3-Q4

- 🎯 v0.5.0 Node Flow 圖譜
  - Node Flow 編輯器
  - 圖譜可視化
  - 三形態完整互轉

### 2027

- 🎯 v0.6.0 規格支援
- 🎯 Vim/Neovim 平台支援
- 🎯 Web 版本

### 2027+

- 🎯 v1.0 社群與 AI
  - 社群分享平台
  - 使用習慣數據收集
  - AI 整合和智慧推薦

---

## 🔗 相關文檔

- **[AGENTS.md](../AGENTS.md)** - AI 助手參考文件（完整的技術狀態和架構資訊）
- **[CHANGELOG.md](../CHANGELOG.md)** - 版本變更記錄
- **[REFACTORING.md](../REFACTORING.md)** - v0.3.0 重構詳細記錄
- **[TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md)** - 模板撰寫指南

---

**製作團隊**：TextBricks 開發組
**聯絡方式**：[GitHub Issues](https://github.com/timcsy/TextBricks/issues)
**版本歷史**：
- v2.0 (2025-10-18)：完全重寫，反映三形態理論和長期願景
- v1.0 (2025-09-04)：初始版本

> **TextBricks** - 從序列到結構到圖譜，從具體到抽象，從程式到規格，建構未來的程式表達方式。
