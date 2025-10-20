# TextBricks 多形態架構設計文檔

> **版本**: 3.0
> **狀態**: 設計階段
> **作者**: timcsy, Claude
> **日期**: 2025-10-20
> **更新**: 2025-10-20 - 重大更新：語言層級架構、多形態知識單元、元資料系統、領域插件、自然語言支援、底層硬體支援
> **相關文檔**: [PRD.md](./PRD.md), [VERSION_HISTORY.md](./VERSION_HISTORY.md)

---

## 📖 目錄

### 第一部分：核心理論

1. [願景與動機](#願景與動機)
2. [語言層級架構](#語言層級架構) 🆕 v3.0
3. [核心概念：三形態理論](#核心概念三形態理論)
4. [四級積木系統](#四級積木系統)
5. [資訊損失與轉換](#資訊損失與轉換)

### 第二部分：多形態知識單元

6. [多形態知識單元](#多形態知識單元) 🆕 v3.0
7. [元資料與註解管理系統](#元資料與註解管理系統) 🆕 v3.0
8. [領域插件系統](#領域插件系統) 🆕 v3.0

### 第三部分：語言層級實現

9. [自然語言模板系統](#自然語言模板系統) 🆕 v3.0
10. [高階程式語言實現](#高階程式語言實現)
    - [積木系統設計](#積木系統設計)
    - [積木展開摺疊機制](#積木展開摺疊機制)
11. [底層與硬體開發支援](#底層與硬體開發支援) 🆕 v3.0

### 第四部分：系統設計

12. [檔案架構設計](#檔案架構設計)
13. [圖譜系統設計](#圖譜系統設計)
14. [轉換系統設計](#轉換系統設計)
15. [Transformation Assistant](#transformation-assistant)
16. [對應關係管理系統](#對應關係管理系統)
17. [Template Registry](#template-registry)
18. [跨語言支援](#跨語言支援)

### 第五部分：實施與展望

19. [實施路線圖](#實施路線圖)
20. [開放問題](#開放問題)
21. [附錄](#附錄)

---

## 願景與動機

### 為什麼需要多形態系統？

TextBricks 的核心願景是成為**多形態程式與規格表達平台**，突破傳統純文字編程的限制。不同的人在不同情境下，需要用不同的方式理解和操作程式：

- **初學者** 需要視覺化的積木來理解程式結構
- **專業開發者** 需要高效的文字編輯器來撰寫程式碼
- **架構師** 需要圖譜視圖來理解系統整體架構
- **AI 系統** 需要結構化資料來理解程式意圖

單一形態無法滿足所有需求，因此需要**多形態表達與自由轉換**。

### 三形態理論

根據 [PRD.md](./PRD.md) 中的三形態理論，程式有三種本質性的表現形式：

```
┌─────────────┐
│   文字      │  語法層面：這段程式怎麼寫
│ (Sequence)  │  優勢：精確、可編輯
└──────┬──────┘  劣勢：學習曲線陡峭
       │
       ↕ 結構化 / 序列化
       │
┌──────┴──────┐
│   積木      │  意圖層面：這段程式想做什麼
│ (Structure) │  優勢：視覺化、易理解
└──────┬──────┘  劣勢：表達能力受限
       │
       ↕ 圖譜化 / 結構化
       │
┌──────┴──────┐
│   圖譜      │  拓撲層面：各部分如何連接與互動
│ (Topology)  │  優勢：全局視角、關係清晰
└─────────────┘  劣勢：細節隱藏
```

**重要發現**：任意兩種形態之間都應該能夠**直接轉換**，不一定需要經過第三者。

### 自編碼與收斂

多形態轉換類似於機器學習中的**自編碼器 (Autoencoder)**：

```
原始程式 → [編碼] → 壓縮表示 → [解碼] → 重建程式
```

通過多次形態轉換，程式會：
1. **損失非本質資訊** - 格式、命名風格等
2. **保留核心意圖** - 邏輯結構、算法本質
3. **收斂到穩定狀態** - 局部或全局穩定

**應用**：
- 程式碼標準化
- 意圖提取
- AI 訓練資料
- 跨語言轉換

---

## 版本歷史

### v3.0 (2025-10-20) - 重大架構升級 🚀

**核心理念變革**：
- 從「程式碼模板工具」升級為「跨語言層級知識平台」
- 統一語言觀：Natural Language、Programming、Assembly、Machine Code、HDL、Physical 都是「語言」
- 三形態理論適用於所有語言層級

**新增章節** (6個主要章節):

1. **語言層級架構** (~200 行)
   - 6 個抽象層級定義
   - 編譯器統一視角（Coding Agent = Compiler）
   - 垂直整合場景

2. **多形態知識單元** (~310 行)
   - 四級積木系統（L0/L1/L2/L3）
   - 資訊損失的雙重性（可還原 vs. 不可還原）
   - 完整的知識單元定義（包含元資料、註解、插件）

3. **元資料與註解管理系統** (~470 行)
   - B+C+D 多層次註解架構
   - AI 輔助同步機制（C+D: User decides + AI assists）
   - 錨點系統與衝突解決

4. **領域插件系統** (~450 行)
   - Core + Plugin 架構
   - HDL Plugin、Python Plugin、Assembly Plugin 完整範例
   - 插件生命週期管理

5. **自然語言模板系統** (~700 行)
   - Spec Template 格式
   - SpecKit 深度整合
   - 概念管理系統（Phase 2 類型化概念）
   - Spec-Driven 工作流

6. **底層與硬體開發支援** (~530 行)
   - Assembly 模板（x86-64, ARM, RISC-V）
   - HDL 模板（Verilog, VHDL, SystemVerilog）
   - Machine Code 可視化
   - 插件系統深化

**更新章節** (3個核心章節):

1. **三形態理論** (~270 行更新)
   - 強調 B+C 本質（不同視角 + 不同抽象層級）
   - 跨語言層級適用性表格
   - 資訊損失與補償策略
   - 生物學類比深化

2. **Template Registry** (~200 行新增)
   - RegistryEntry 支援 languageLevel 和 granularity
   - 插件整合功能（RegistryPluginManager）
   - 語言層級/粒度/插件查詢
   - 插件更新傳播機制

3. **實施路線圖** (~350 行新增)
   - v0.6.0: 自然語言模板系統（3-4 月）
   - v0.6.x: 知識圖譜、AI 規格生成、多語言規格
   - v0.7.0: 底層與硬體開發支援（3-4 月）
   - v0.7.x: 性能分析、優化建議、除錯支援
   - v1.0: 統一多語言平台 + 社群與 AI（6-12 月）

**新增附錄**:

- **附錄 C: 與 SpecKit 整合** (~440 行)
  - SpecKit 簡介與局限性分析
  - TextBricks 補充價值
  - /specify 和 /implement 階段整合
  - 雙向同步機制
  - 目錄結構整合
  - 技術實現細節
  - 未來展望（Phase 1-3）

**擴充開放問題** (11個 v3.0 新問題):

24. 自然語言 L3 概念粒度
25. 概念類型系統的複雜度
26. 概念圖譜的實作技術選擇
27. Spec ↔ Code 對應的準確度閾值
28. Assembly/HDL 的 Blockly 表示
29. Machine Code 的可編輯性
30. 插件的安全性與沙箱
31. 跨語言層級轉換的可行性
32. 元資料的多語言支援
33. 插件更新的向後兼容性
34. Coding Agent 偏好與模板推薦

**統計數據**:
- 新增內容：~2,860 行
- 總文檔長度：~9,500 行（相比 v2.0 ~6,500 行）
- 新增章節：6 個
- 更新章節：3 個
- 新增開放問題：11 個
- 新增附錄：1 個

**設計決策記錄**:
- 透過深入討論確立 11 個關鍵設計決策（B+C, D, B+C+D, C+D, 等）
- 所有決策都基於使用者需求和系統設計原則
- 保持模組化和可擴展性

**向後兼容性**:
- v2.0 的所有核心概念保留
- 四級積木系統、轉換引擎、對應關係系統等無變更
- 僅增加功能，不破壞現有設計

---

### v2.0 (之前版本)

**核心特性**:
- 三形態理論（Sequence/Structure/Topology）
- 四級積木系統（L0/L1/L2/L3）
- 積木展開摺疊機制
- 轉換引擎與對應關係管理
- Template Registry 基礎架構
- Transformation Assistant
- 圖譜系統設計（4種圖譜類型）
- 跨語言支援（C, Python, JavaScript）

**文檔長度**: ~6,500 行

---

## 語言層級架構

### 統一的語言觀

**v3.0 核心洞察**：不論是自然語言、程式語言、還是硬體描述語言，本質上都是**語言** (Language)。

TextBricks 從「程式碼模板系統」演進為**跨語言層級的多形態知識平台**，支援從最抽象的自然語言規格，到最具體的物理電路設計。

###完整的抽象層級

```
抽象層級 ↕️ 編譯/轉換 →

🔸 Natural Language (自然語言)
   例如：spec.md, requirements.txt
   編譯器：Coding Agent (Claude, Copilot)
      ↓
🔸 High-Level Programming (高階程式語言)
   例如：Python, JavaScript, Java
   編譯器：Interpreter / JIT Compiler
      ↓
🔸 Low-Level Programming (低階程式語言)
   例如：C, Assembly
   編譯器：gcc, nasm, llvm
      ↓
🔸 Machine Language (機器語言)
   例如：x86 bytecode, ARM instructions
   執行器：CPU
      ↓
🔸 Hardware Description (硬體描述語言)
   例如：Verilog, VHDL, Chisel
   綜合工具：Vivado, Quartus
      ↓
🔸 Physical Circuit (實體電路)
   例如：Netlist, PCB Layout, IC Layout
   製造：Fabrication Process
```

### 每個層級都有三種形態

**關鍵發現**：不論在哪個抽象層級，都可以用三種形態表達：

#### Natural Language 的三形態

```typescript
{
  Sequence:  "spec.md (Markdown 文字)",
  Structure: "structured-spec.json (結構化規格)",
  Topology:  "requirement-graph (需求關聯圖)"
}
```

#### Programming Language 的三形態

```typescript
{
  Sequence:  ".py, .js, .c (文字程式碼)",
  Structure: ".blocks.xml (Blockly 積木)",
  Topology:  ".graph.json (呼叫圖、資料流圖)"
}
```

#### Hardware Description Language 的三形態

```typescript
{
  Sequence:  ".v, .vhd (HDL 文字碼)",
  Structure: "logic-blocks.xml (邏輯閘積木)",
  Topology:  ".cir (電路圖、timing diagram)"
}
```

#### Machine Language 的三形態

```typescript
{
  Sequence:  "binary/hex code (位元組序列)",
  Structure: "instruction-blocks (指令區塊)",
  Topology:  "pipeline-diagram (執行流水線圖)"
}
```

### 編譯器的統一抽象

從這個視角看，所有「編譯器」都在做同一件事：**將高抽象層級的語言轉換為低抽象層級的語言**。

| 編譯器類型 | 輸入語言 | 輸出語言 | 範例工具 |
|-----------|---------|---------|---------|
| **AI Agent** | Natural Language | Programming Language | Claude Code, Copilot |
| **Interpreter** | High-Level Code | Bytecode/Machine Code | Python, Node.js |
| **Compiler** | High-Level Code | Assembly/Machine Code | gcc, clang, rustc |
| **Assembler** | Assembly | Machine Code | nasm, gas |
| **Synthesis Tool** | HDL | Gate-Level Netlist | Vivado, Quartus |
| **Place & Route** | Netlist | Physical Layout | CAD Tools |

**統一理解**：
- **Coding Agent = 自然語言的編譯器**
- **gcc = 高階語言的編譯器**
- **Vivado = HDL 的編譯器**
- **Fab Process = 電路的編譯器**

### TextBricks 在各層級的角色

```
每個語言層級都可以有 TextBricks 模板：

Natural Language Templates
├── API Endpoint Spec Template
├── Algorithm Description Template
├── User Story Template
└── ... (插入到 spec.md)

Programming Language Templates
├── for-loop, class, function
├── FastAPI Route Handler
├── React Component
└── ... (插入到 .py, .js)

Assembly Templates
├── Function Prologue/Epilogue
├── System Call Wrapper
├── SIMD Loop Optimization
└── ... (插入到 .asm)

HDL Templates
├── Synchronous FIFO
├── AXI4 Slave Interface
├── Clock Domain Crossing
└── ... (插入到 .v, .vhd)

Physical Circuit Templates
├── Arduino Shield Layout
├── Standard Cell Library
└── ... (插入到 .kicad)
```

### 垂直整合開發場景

**場景：嵌入式系統開發**

```
1. Natural Language (需求規格)
   - 使用 TextBricks: "嵌入式控制器需求規格模板"
   - 插入到：requirements.md
   ↓ Coding Agent

2. C/C++ Code (高階實作)
   - 使用 TextBricks: "GPIO 控制函式", "Timer 中斷處理"
   - 插入到：main.c, gpio.c
   ↓ ARM-GCC

3. ARM Assembly (低階優化)
   - 使用 TextBricks: "中斷向量表", "啟動程式碼"
   - 插入到：startup.S
   ↓ Assembler

4. Machine Code (執行檔)
   - 燒錄到：MCU Flash
```

**場景：ASIC/FPGA 設計**

```
1. Natural Language (功能規格)
   - 使用 TextBricks: "數位訊號處理器規格模板"
   ↓ SystemVerilog Generator

2. HDL Code (硬體描述)
   - 使用 TextBricks: "FIR 濾波器", "FFT 運算核心"
   - 插入到：dsp.v
   ↓ Vivado Synthesis

3. Gate-Level Netlist (邏輯閘網表)
   ↓ Place & Route

4. Physical Layout (實體佈局)
   ↓ Fabrication

5. Silicon Chip (晶片)
```

### 為什麼這個架構重要？

1. **統一的理論框架**
   - 所有語言層級使用相同的三形態理論
   - 模板系統、轉換引擎、Registry 可以共用

2. **完整的開發覆蓋**
   - 從需求到實現的完整路徑
   - 支援軟體、韌體、硬體開發

3. **垂直整合能力**
   - 在一個專案中跨越多個抽象層級
   - 追蹤從 spec 到 silicon 的完整映射

4. **AI 友好**
   - 為 AI 理解「意圖 → 實現」提供完整訓練資料
   - 跨層級轉換的知識累積

5. **教育價值**
   - 幫助學習者理解不同抽象層級的關聯
   - 從高階到低階的漸進式學習路徑

---

## 核心概念：三形態理論

> **v3.0 核心洞察**：三形態是一種**通用表示法**，適用於所有語言層級（Natural Language、Programming、Assembly、HDL、Machine Code）。它不只是「不同格式」，而是「不同視角」與「不同抽象層級」的結合 (B+C)。

### 理論本質

#### 形態的雙重性 (B+C)

三形態具有兩種互補性質：

**B. 不同視角 (Different Perspectives)**
- **Sequence**: 線性執行視角 — 強調「時間順序」與「操作流程」
- **Structure**: 組成結構視角 — 強調「層次關係」與「模組化」
- **Topology**: 關係網絡視角 — 強調「依賴關係」與「系統架構」

三者都在描述同一個知識單元，但從不同角度切入。

**C. 不同抽象層級 (Different Abstraction Levels)**
- Sequence → Structure：向上抽象，保留結構，捨棄細節
- Structure → Topology：再向上抽象，保留關係，捨棄實作

**關鍵**: 三形態之間**不是完全可逆的**，因為存在**資訊損失** (Information Loss)。

#### 跨語言層級適用性

三形態理論適用於所有語言層級：

| 語言層級 | Sequence | Structure | Topology |
|---------|----------|-----------|----------|
| **Natural Language** | 線性文字規格 (.md) | 概念積木 (Blockly) | 概念圖 (Concept Map) |
| **High-Level Programming** | 程式碼文字 (.py) | 語句積木 (Blockly) | 呼叫圖 (Call Graph) |
| **Low-Level Programming** | 組合語言 (.asm) | 指令積木 (Blockly) | 暫存器流程圖 |
| **Machine Language** | 機器碼列表 (hex) | 指令格式圖 | 管線圖 (Pipeline) |
| **Hardware Description** | HDL 碼 (.v) | 模組積木 (Blockly) | RTL 圖 (Schematic) |
| **Physical Circuit** | 網表 (Netlist) | 元件積木 (Circuit) | 佈線圖 (Layout) |

**統一視角**: 不論在哪個層級，都可以用 Sequence/Structure/Topology 三種形態來表示和轉換知識。

---

### 形態定義（以 High-Level Programming 為例）

#### 1. 文字形態 (Sequence Form)

**定義**：線性文字程式碼，強調時間順序和執行流程

**特徵**：
- 按行組織
- 遵循語法規則
- 編輯器友善
- 版本控制友善
- **視角**: 時間軸視角（程式如何一步步執行）

**檔案格式**：`.c`, `.py`, `.js`, `.md` 等

**範例**：
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

#### 2. 積木形態 (Structure Form)

**定義**：階層化結構表示，強調組成關係和模組化

**特徵**：
- 樹狀結構
- 語法無誤（by design）
- 拖放操作
- 階層式組合
- **視角**: 組成視角（程式由哪些部分構成）

**檔案格式**：`.json` (block definition), `.xml` (workspace)

**範例**：
```blockly
[Hello World 程式]
  輸出訊息: [Hello, World!]

展開後：
[include] <stdio.h>
[main function]
  [printf] "Hello, World!\n"
  [return] 0
```

**設計決策**: 採用 Blockly 是因為：
- 初學者友善（語法無誤保證）
- 可視化層次結構
- 支援自定義積木（可擴展到所有語言層級）

#### 3. 圖譜形態 (Topology Form)

**定義**：關係網絡表示，強調依賴關係和系統架構

**特徵**：
- 節點和邊
- 多層級視圖
- 互動式探索
- 依賴關係清晰
- **視角**: 關係視角（程式元素如何互動）

**檔案格式**：`.json` (graph), `.dot` (Graphviz)

**範例**：
```
[nodes]
- stdio.h (library)
- main() (function)
- printf() (function)

[edges]
- main → printf (calls)
- main → stdio.h (depends)
```

**設計決策**: 參考 Ryven 和 Grapycal 的節點編輯器設計。

### 轉換矩陣

三種形態之間共有 **6 種轉換**：

```
         文字(Seq)   積木(Str)   圖譜(Top)
文字(Seq)    ✓          ↔          ↔
積木(Str)    ↔          ✓          ↔
圖譜(Top)    ↔          ↔          ✓
```

| 轉換 | 名稱 | 難度 | 準確度 | 主要用途 | 資訊損失 |
|------|------|------|--------|----------|----------|
| Seq → Str | 結構化 (Structuring) | 困難 | 中等 | 視覺化理解 | 格式、註解位置 |
| Str → Seq | 序列化 (Serialization) | 簡單 | 高 | 程式碼生成 | 積木的 UI 排列 |
| Seq → Top | 圖譜化 (Topologization) | 中等 | 高 | 架構分析 | 實作細節、順序 |
| Top → Seq | 序列化 (Sequentialization) | 中等 | 中等 | 程式碼重構 | 順序不唯一 |
| Str → Top | 圖譜化 (Topologization) | 簡單 | 高 | 依賴視覺化 | 階層深度 |
| Top → Str | 結構化 (Structuralization) | 中等 | 中等 | 逆向工程 | 結構細節 |

**轉換的非對稱性**：
- Seq → Str → Seq: 格式化標準化
- Seq → Top → Seq: 程式碼重構
- Str → Top → Str: 結構優化

**關鍵洞察**: 轉換不是「翻譯」，而是「視角切換」+ 「抽象層級改變」。每次轉換都伴隨資訊損失，但這是**必然且必要的**。

---

### 資訊損失與補償

> **v3.0 核心更新**：資訊損失具有雙重性 (D)，需要元資料系統補償不可還原的部分。

#### 資訊損失的雙重性 (D)

**Type 1: 可還原資訊 (Restorable Information)**

這類資訊雖然在轉換中「消失」，但可透過啟發式方法或 AI 輔助還原：

```typescript
// 範例 1: 語義明確的命名
int userCount;  // Seq
  ↓ [Seq → Str]
[變數宣告] 類型: int, 名稱: userCount  // Str
  ↓ [Str → Seq, AI 輔助]
int userCount;  // ✅ 意義可推斷：「使用者計數」

// 範例 2: 結構性資訊
積木的樹狀結構 → 可還原為程式碼的縮排結構

// 範例 3: 型別資訊
Topology 中的節點型別 → 可還原為 Structure 的積木類型
```

**還原方法**：
- **命名啟發**: 良好的命名本身就攜帶語義
- **結構對應**: 樹狀結構 ↔ 縮排結構
- **型別推斷**: 從關係推斷型別
- **AI 輔助**: 使用 LLM 理解意圖

**Type 2: 不可還原資訊 (Non-restorable Information)**

這類資訊一旦遺失，就**無法從形態本身還原**，必須依賴**元資料 (Metadata)** 補償：

```typescript
// 範例 1: 設計理由 (Design Rationale)
// 為什麼用二分搜尋而不是線性搜尋？
if (arr.length > 1000) {
    binarySearch(arr, target);  // ❌ 無法從程式碼得知「為什麼 > 1000」
} else {
    linearSearch(arr, target);
}

// 需要元資料：
metadata: {
  designRationale: "當陣列長度超過 1000 時，二分搜尋的 O(log n) 優勢才明顯"
}

// 範例 2: 商業邏輯 (Business Logic)
if (age >= 18) {  // ❌ 無法得知「為什麼是 18」
    allowAccess();
}

// 需要元資料：
metadata: {
  businessRule: "法定成年年齡為 18 歲（依據當地法律）"
}

// 範例 3: 權衡取捨 (Trade-offs)
cache.set(key, value, { ttl: 3600 });  // ❌ 無法得知「為什麼是 1 小時」

// 需要元資料：
metadata: {
  tradeoffs: "TTL 設為 1 小時：平衡記憶體使用與資料新鮮度"
}
```

**補償策略**：
- **元資料系統**: 獨立的 `.meta.json` 檔案 + 嵌入式註解
- **註解錨點**: 錨定到特定程式碼位置
- **AI 輔助同步**: 元資料在三形態間智能同步
- **文檔連結**: 連結到完整的設計文檔

#### 生物學類比與哲學

**DNA → 蛋白質 → 細胞組織**

| 生物層級 | 對應形態 | 資訊特性 |
|---------|----------|----------|
| DNA 序列 (ATCG) | Sequence | 完整資訊，線性表示 |
| 蛋白質四級結構 | Structure | 摺疊後的三維結構，損失序列細節 |
| 細胞組織系統 | Topology | 功能網絡，損失分子細節 |

**關鍵洞察**：
1. **資訊損失是必然的** - DNA 轉譯成蛋白質時，會損失非編碼區資訊
2. **資訊損失是必要的** - 如果保留所有細節，系統將無法處理複雜性
3. **抽象化 = 有選擇性的遺忘** - 保留「功能核心」，捨棄「非本質資訊」

**TextBricks 的設計哲學**：
- **接受資訊損失** - 不追求 100% 可逆
- **保留核心功能** - 確保程式邏輯不損失
- **元資料補償** - 對於不可還原的部分，用元資料系統補償
- **AI 輔助還原** - 對於可還原的部分，用 AI 輔助重建

#### 收斂機制

```
原始程式（包含所有細節）
   ↓ [Seq → Str]
積木表示 (損失：格式、註解位置) ← 可還原
   ↓ [Str → Top]
圖譜表示 (損失：實作細節、順序) ← 部分可還原
   ↓ [Top → Str]
重建積木 (保留：核心邏輯、依賴關係)
   ↓ [Str → Seq]
重建程式 (標準化、簡化) ← 元資料補償不可還原部分
```

**收斂特性**：
- **多次轉換後趨於穩定** - 類似能量最小化
- **保留本質特徵** - 核心邏輯和依賴關係
- **標準化副作用** - 程式碼風格統一
- **元資料持久化** - 不可還原的資訊需要元資料系統保存

**實際應用**：
- **程式碼標準化**: 透過 Seq → Str → Seq 統一風格
- **架構重構**: 透過 Seq → Top → Seq 優化結構
- **知識萃取**: 透過多次轉換提取核心概念

---

## 四級積木系統

### 設計動機

在語言層級架構中，我們發現不論哪個抽象層級，程式都有**不同的粒度**。四級積木系統定義了從最細到最粗的四個粒度層次。

### 四層粒度系統

```
L0 (系統級) ┐
            ├─ 展開/摺疊 ─┐
L1 (模板級) ┤            ├  彈性切換
            ├─ 展開/摺疊 ─┤
L2 (語句級) ┤            │
            ├─ 展開/摺疊 ─┘
L3 (表達式級) ┘
```

#### L0 - 系統級 (System Level)

**定義**：多個模組或模板組成的完整系統

**特徵**：
- 模組間協同
- 系統級功能
- 介面定義
- 主要透過圖譜視覺化

**範例**：
- **程式語言**：多模組的完整應用程式
- **自然語言**：完整的 Spec 文件
- **HDL**：完整的 SoC (System-on-Chip)

#### L1 - 模板級 (Template Level)

**定義**：一個完整的程式或功能單元

**特徵**：
- 可展開成 L2 積木組合
- 有特定的完整功能
- 可獨立使用或作為 L0 的組成部分

**範例**：
- **程式語言**：完整的函式、類別
- **自然語言**：單一 Feature Spec、章節
- **HDL**：完整的模組 (Module)
- **Assembly**：完整的函式或子程式

#### L2 - 語句級 (Statement Level)

**定義**：單一語句或控制結構

**特徵**：
- 可自由組合
- 有完整語義
- 是積木編輯的主要粒度
- 最適合視覺化操作

**範例**：
- **程式語言**：for loop, if statement, function call
- **自然語言**：Requirement statement、段落
- **HDL**：always block, assign statement
- **Assembly**：指令序列 (如 loop prologue)

#### L3 - 表達式級 (Expression Level)

**定義**：最基本的操作元素

**特徵**：
- 最細粒度
- 可組合成 L2
- 通常是原子操作

**範例**：
- **程式語言**：運算符 (+, -, *), 函式呼叫, 變數存取
- **自然語言**：概念片段 ("使用者", "JWT token", "過期時間")
- **HDL**：邏輯閘 (AND, OR), 賦值
- **Assembly**：單一指令 (MOV, ADD, JMP)
- **Machine Code**：單一位元組碼

### 跨語言層級的四級對應

| 層級 | 自然語言 | 程式語言 | Assembly | HDL | Machine Code |
|------|---------|---------|----------|-----|--------------|
| **L0** | 完整文件 | 多模組系統 | 完整程式 | SoC 系統 | 完整執行檔 |
| **L1** | Feature Spec | 函式/類別 | 子程式 | Module | 函式區塊 |
| **L2** | 段落 | for/if/while | 指令序列 | always/assign | 指令區塊 |
| **L3** | 概念片段 | +/-/* | MOV/ADD | AND/OR | 單一位元組 |

### 普遍規律

**關鍵發現**：四級積木系統是一個**普遍規律**，適用於所有語言層級。

雖然不同語言的具體表現不同，但抽象的層次關係是一致的：
- **L0**: 完整系統
- **L1**: 獨立功能單元
- **L2**: 可組合的語句/區塊
- **L3**: 基本操作元素

這種一致性使得：
1. 轉換引擎可以統一設計
2. 展開/摺疊機制可以共用
3. 使用者可以用相同的心智模型理解不同語言
4. AI 可以學習通用的抽象模式

---

## 資訊損失與轉換

### 資訊損失的本質

**v3.0 深化理解**：資訊損失有兩種性質：

#### 1. 可還原的資訊

**特徵**：可以從上下文或語義推斷回來

**範例**：
- **語義明確的命名**：`userCount` → 可推斷是「使用者計數」
- **結構性資訊**：積木的樹狀結構 → 可還原為程式碼
- **型別資訊**：靜態型別語言中，型別可從宣告還原

**處理方式**：
- 系統可以自動還原
- 或提供智能建議讓使用者確認

#### 2. 不可還原的資訊

**特徵**：隱藏的意圖、設計決策、背景知識

**範例**：
- **設計理由**：「為什麼用二分搜尋而不是線性搜尋？」
- **商業邏輯**：「為什麼這個條件是 > 10 而不是 >= 10？」
- **特殊考量**：「這個 edge case 是為了處理什麼情況？」
- **效能權衡**：「為什麼選擇這個演算法？」

**處理方式**：
- 必須透過註解/元資料補充
- 需要人類或 AI 的理解和解釋
- 這正是**元資料系統**的價值所在

### 損失的層次分析

```
Sequence (最具體) ─────────┐
  ↓ 損失：格式、命名風格   │ 可還原區域
Structure (較抽象) ────────┤ (良好命名、清晰結構)
  ↓ 損失：實作細節         │
Topology (最抽象) ─────────┘
  ↓ 損失：設計意圖 ←──── 不可還原區域
                          (需要元資料補充)
```

### 轉換的方向性

#### 向上抽象（Sequence → Structure → Topology）

**過程**：精煉、提取本質
**損失**：細節、實作方式
**保留**：核心邏輯、關係結構

**類比**：類似於機器學習的 Encoder
- 壓縮資訊
- 提取特徵
- 損失是**必要的抽象**

#### 向下具體化（Topology → Structure → Sequence）

**過程**：補充資訊、做決策
**需要**：設計選擇、實作細節
**挑戰**：有多種可能的具體化方式

**類比**：類似於機器學習的 Decoder
- 重建細節
- 填補資訊
- 需要**額外知識**（這就是 Transformation Assistant 的作用）

### 收斂與穩定性

經過多次形態轉換後：

```
原始程式 (風格各異)
  ↓ Seq → Str → Top → Str → Seq
標準化程式 (收斂到穩定形式)
```

**收斂特性**：
- **保留本質**：核心邏輯不變
- **損失非本質**：格式、風格統一化
- **趨於穩定**：多次轉換後不再變化
- **能量最小化**：類似物理系統找到穩定態

**應用**：
- 程式碼標準化
- 重構建議
- 意圖提取
- AI 訓練資料生成

---

## 多形態知識單元

### 模板的重新定義

**v3.0 核心概念**：TextBricks 的模板不只是「程式碼片段」，而是**多形態知識單元** (Multi-Form Knowledge Unit)。

### 完整的知識包

一個完整的 TextBricks 模板包含：

```typescript
interface MultiFormKnowledgeUnit {
  // 1. 基本資訊
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;

  // 2. 語言層級
  languageLevel: {
    type: "natural" | "high-level" | "low-level" | "machine" | "hdl" | "physical";
    specific?: string;  // "english", "python", "x86-asm", "verilog"
  };

  // 3. 粒度層級
  granularity: "L0" | "L1" | "L2" | "L3";

  // 4. 三種形態
  forms: {
    sequence: {
      content: string;              // 文字內容
      language: string;              // 語言（markdown, python, verilog）
      format: string;                // 檔案格式（.md, .py, .v）
    };

    structure: {
      blocks: BlockDefinition[];     // 積木定義
      workspace?: string;            // Blockly workspace XML
      schema?: any;                  // 結構化 schema
    };

    topology: {
      nodes: Node[];                 // 節點
      edges: Edge[];                 // 邊
      layout?: LayoutConfig;         // 布局配置
      graphType: "call" | "data-flow" | "dependency" | "control-flow";
    };
  };

  // 5. 元資料（核心！）
  metadata: {
    // 5.1 設計知識
    designRationale?: string;        // 為什麼這樣設計
    tradeoffs?: string[];            // 權衡考量
    alternatives?: Alternative[];    // 其他選擇

    // 5.2 使用情境
    useCases?: string[];             // 適用場景
    antiPatterns?: string[];         // 反模式（何時不該用）

    // 5.3 依賴與關聯
    dependencies?: Dependency[];     // 依賴的其他模板
    relatedTemplates?: string[];     // 相關模板

    // 5.4 品質指標
    verified: boolean;               // 是否已驗證
    rating: number;                  // 評分
    usageCount: number;              // 使用次數

    // 5.5 教學資訊
    difficulty: "beginner" | "intermediate" | "advanced";
    learningPath?: string[];         // 前置模板
    exercises?: Exercise[];          // 練習題
  };

  // 6. 註解系統（多層次）
  annotations: {
    // 6.1 階層結構（對應程式碼結構）
    hierarchical: AnnotationTree;

    // 6.2 多粒度索引（快速查詢）
    byLevel: {
      function?: Map<string, Annotation>;
      statement?: Map<number, Annotation>;  // line number
      block?: Map<string, Annotation>;
    };

    // 6.3 錨點系統（彈性指向）
    anchored: AnchoredAnnotation[];
  };

  // 7. 領域插件（可選）
  plugins?: {
    hdl?: HDLMetadata;               // HDL 特定資訊
    python?: PythonMetadata;         // Python 特定資訊
    assembly?: AssemblyMetadata;     // Assembly 特定資訊
    // ... 可擴展
  };

  // 8. 變數與參數化（從 v2.0 保留）
  variables?: Variable[];            // 可填充的變數

  // 9. 轉換規則（新增）
  transformRules?: {
    toOtherLanguages?: LanguageMapping[];  // 跨語言轉換
    toOtherGranularities?: GranularityMapping[];  // 跨粒度轉換
  };
}
```

### 知識的多個維度

一個模板可以從多個維度被檢索和使用：

#### 維度 1: 語言層級
- 「給我所有 Python 的模板」
- 「給我所有自然語言的 Spec 模板」
- 「給我所有 Verilog HDL 的模板」

#### 維度 2: 粒度層級
- 「給我所有 L2 (語句級) 的模板」
- 「給我可以組合成 L1 的 L2 模板」

#### 維度 3: 形態
- 「給我這個模板的 Sequence 形式」
- 「轉換到 Topology 視圖」

#### 維度 4: 功能分類
- 「給我所有迴圈相關的模板」
- 「給我所有 API 端點的規格模板」

#### 維度 5: 使用情境
- 「初學者適用的模板」
- 「效能優化的模板」

#### 維度 6: 品質指標
- 「最多人使用的模板」
- 「最高評分的模板」

### 為什麼是「知識單元」？

傳統的程式碼片段只有「How」（怎麼寫），而知識單元還包含：

1. **Why** - 為什麼這樣設計？設計理由在元資料中
2. **When** - 何時使用？使用情境和反模式
3. **What** - 做什麼？三種形態表達同一意圖
4. **Where** - 在哪個層級？語言層級和粒度層級
5. **Who** - 適合誰？難度和學習路徑
6. **Which** - 還有什麼選擇？替代方案和權衡

### 社群貢獻的演進

基於多形態知識單元，社群可以貢獻：

**Phase 1: 基礎模板** (當前)
- 貢獻 Sequence form 的程式碼片段

**Phase 2: 多形態模板** (v0.4-v0.5)
- 貢獻完整的 Sequence + Structure + Topology
- 系統輔助生成其他形態

**Phase 3: 知識豐富化** (v0.6-v1.0)
- 貢獻元資料：設計理由、使用情境、權衡分析
- 貢獻轉換規則：如何從這個模板轉到其他語言/粒度
- 累積成知識圖譜

**Phase 4: AI 訓練資料** (v1.0+)
- 所有的模板 + 元資料成為 AI 訓練資料
- AI 學習「從意圖到實現」的映射
- 提升 Coding Agent 的品質

### 範例：完整的知識單元

```typescript
// 範例：Binary Search Algorithm Template
{
  id: "algorithm-binary-search-c",
  name: "Binary Search Algorithm",
  languageLevel: { type: "high-level", specific: "C" },
  granularity: "L1",  // 完整函式

  forms: {
    sequence: {
      content: `int binarySearch(int arr[], int n, int target) {
    int left = 0, right = n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      language: "c",
      format: ".c"
    },

    structure: {
      blocks: [
        { type: "function", name: "binarySearch", ... },
        { type: "while-loop", condition: "left <= right", ... },
        // ...
      ]
    },

    topology: {
      nodes: [
        { id: "init", type: "init", label: "left=0, right=n-1" },
        { id: "check", type: "condition", label: "left <= right" },
        { id: "mid", type: "compute", label: "mid = left + (right-left)/2" },
        { id: "compare", type: "condition", label: "arr[mid] vs target" },
        // ...
      ],
      edges: [
        { from: "init", to: "check" },
        { from: "check", to: "mid", condition: "true" },
        { from: "mid", to: "compare" },
        // ...
      ],
      graphType: "control-flow"
    }
  },

  metadata: {
    designRationale: "使用二分搜尋而非線性搜尋，因為在已排序陣列中，二分搜尋的時間複雜度為 O(log n)，遠優於線性搜尋的 O(n)。",

    tradeoffs: [
      "需要陣列已排序（前提條件）",
      "不適合頻繁插入/刪除的場景（會破壞排序）",
      "相比線性搜尋，實作稍複雜"
    ],

    alternatives: [
      {
        name: "Linear Search",
        when: "資料未排序、資料量小（< 100）",
        tradeoff: "簡單但慢"
      },
      {
        name: "Hash Table",
        when: "需要 O(1) 查詢、允許額外空間",
        tradeoff: "空間換時間"
      }
    ],

    useCases: [
      "在大量已排序資料中查找",
      "資料庫索引查詢",
      "字典查詢"
    ],

    antiPatterns: [
      "資料未排序時使用（會得到錯誤結果）",
      "資料量極小時（< 10），不如線性搜尋"
    ],

    difficulty: "intermediate",
    learningPath: ["array-basics", "while-loop", "recursion-basics"]
  },

  annotations: {
    hierarchical: {
      function: {
        comment: "實作二分搜尋演算法",
        children: {
          whileLoop: {
            comment: "持續二分直到找到或確定不存在",
            children: {
              midCalculation: {
                comment: "使用 left + (right-left)/2 避免整數溢位",
                line: 5
              }
            }
          }
        }
      }
    },

    byLevel: {
      function: { "binarySearch": { type: "design-rationale", ... } },
      statement: { 5: { type: "optimization", ... } }
    },

    anchored: [
      {
        anchor: { type: "statement", line: 5 },
        type: "optimization",
        content: "避免 (left + right) / 2 可能的整數溢位"
      }
    ]
  },

  transformRules: {
    toOtherLanguages: [
      { target: "python", difficulty: "easy" },
      { target: "javascript", difficulty: "easy" }
    ],
    toOtherGranularities: [
      { target: "L2", method: "extract while loop as separate block" }
    ]
  }
}
```

---

## 元資料與註解管理系統

### 設計動機

在「資訊損失與轉換」中，我們發現有些資訊（設計意圖、權衡考量）是**不可從程式碼還原的**。這些資訊需要透過**元資料和註解**來保存。

### 註解的雙重性質

基於我們的討論，註解同時具有兩種性質：

#### 1. 獨立的元資料 (Meta.json)

**特徵**：
- 與程式碼分離存儲
- 結構化、可查詢
- 跨形態共享

**用途**：
- 設計理由、權衡分析
- 使用情境、反模式
- 品質指標、學習路徑

#### 2. 嵌入在各形態中

**特徵**：
- 與程式碼緊密結合
- 形態特定的表現方式

**範例**：
```typescript
{
  Sequence: "// 這是註解",
  Structure: { description: "這是積木說明" },
  Topology: { nodeLabel: "這是節點標籤" }
}
```

### 元資料的多層次結構

結合我們討論的 B + C + D 方案：

```typescript
/**
 * 元資料系統架構
 */
interface MetadataSystem {
  // 1. 階層結構 (B) - 反映程式碼結構
  hierarchical: {
    function?: {
      name: string;
      metadata: Annotation;
      children: {
        statement?: Map<number, Annotation>;
        block?: Map<string, Annotation>;
      };
    };
  };

  // 2. 多粒度索引 (C) - 快速查詢
  indices: {
    byFunction: Map<string, Annotation>;
    byStatement: Map<number, Annotation>;
    byBlock: Map<string, Annotation>;
    byType: Map<AnnotationType, Annotation[]>;
  };

  // 3. 錨點系統 (D) - 彈性指向
  anchors: AnchoredAnnotation[];
}

/**
 * 錨點註解
 */
interface AnchoredAnnotation {
  id: string;
  anchor: Anchor;
  type: AnnotationType;
  content: string;
  author?: string;
  timestamp?: Date;
}

/**
 * 錨點定義
 */
type Anchor =
  | { type: "function"; name: string }
  | { type: "statement"; line: number }
  | { type: "block"; id: string }
  | { type: "range"; from: number; to: number }
  | { type: "selection"; start: Position; end: Position };

/**
 * 註解類型
 */
type AnnotationType =
  | "design-rationale"    // 設計理由
  | "optimization"        // 優化說明
  | "tradeoff"           // 權衡分析
  | "todo"               // 待辦事項
  | "warning"            // 警告
  | "algorithm"          // 演算法說明
  | "complexity"         // 複雜度分析
  | "example";           // 使用範例
```

### 跨形態同步機制

基於我們討論的 C + D 方案：**AI 輔助的使用者決策**

#### 同步流程

```typescript
/**
 * 註解同步服務
 */
class AnnotationSyncService {
  /**
   * 當使用者在某個形態修改註解時
   */
  async onAnnotationChanged(
    form: "sequence" | "structure" | "topology",
    annotation: Annotation,
    context: ChangeContext
  ): Promise<void> {
    // 1. AI 分析變更
    const analysis = await this.aiAnalyze(annotation, context);

    // 2. 提示使用者
    const userDecision = await this.promptUser({
      oldValue: context.oldValue,
      newValue: annotation.content,
      aiSuggestion: analysis.suggestion,
      affectedForms: ["sequence", "structure", "topology"],
      syncOptions: this.generateSyncOptions(analysis)
    });

    // 3. 根據使用者決定同步
    if (userDecision.syncAll) {
      await this.syncToAllForms(annotation);
    } else if (userDecision.selective) {
      await this.syncToForms(annotation, userDecision.selectedForms);
    } else if (userDecision.merge) {
      await this.intelligentMerge(annotation, userDecision.mergeStrategy);
    }

    // 4. 更新元資料
    await this.updateMetadata(annotation);
  }

  /**
   * AI 分析變更性質
   */
  private async aiAnalyze(
    annotation: Annotation,
    context: ChangeContext
  ): Promise<ChangeAnalysis> {
    const oldContent = context.oldValue;
    const newContent = annotation.content;

    // 判斷變更類型
    const changeType = this.detectChangeType(oldContent, newContent);

    return {
      changeType,  // "supplement" | "replacement" | "refinement"
      confidence: this.calculateConfidence(oldContent, newContent),
      suggestion: this.generateSuggestion(changeType),
      affectedScopes: this.analyzeAffectedScopes(annotation)
    };
  }

  /**
   * 變更類型偵測
   */
  private detectChangeType(old: string, new_: string): ChangeType {
    // 如果新內容包含舊內容，可能是補充
    if (new_.includes(old)) {
      return "supplement";
    }

    // 如果有共同關鍵詞，可能是精煉
    const oldKeywords = this.extractKeywords(old);
    const newKeywords = this.extractKeywords(new_);
    const overlap = this.calculateOverlap(oldKeywords, newKeywords);

    if (overlap > 0.5) {
      return "refinement";
    }

    // 否則是替換
    return "replacement";
  }

  /**
   * 提示使用者
   */
  private async promptUser(options: SyncPromptOptions): Promise<SyncDecision> {
    // 顯示對話框
    return await vscode.window.showQuickPick([
      {
        label: "全部同步",
        description: `將變更同步到 ${options.affectedForms.join(", ")}`,
        value: { syncAll: true }
      },
      {
        label: "選擇性同步",
        description: "讓我選擇要同步到哪些形態",
        value: { selective: true }
      },
      {
        label: "智能合併",
        description: AI 建議：${options.aiSuggestion}`,
        value: { merge: true, mergeStrategy: "ai-guided" }
      },
      {
        label: "不同步",
        description: "只更新當前形態",
        value: { noSync: true }
      }
    ]);
  }
}
```

### 註解的持久化

#### 檔案結構

```
template/
├── code.py                  # Sequence form
├── blocks.xml              # Structure form
├── graph.json              # Topology form
└── _metadata/              # 元資料目錄
    ├── annotations.json    # 註解資料
    ├── design.md          # 設計文檔
    └── history.json       # 變更歷史
```

#### annotations.json 格式

```json
{
  "version": "3.0",
  "templateId": "algorithm-binary-search-c",

  "hierarchical": {
    "function": {
      "name": "binarySearch",
      "type": "design-rationale",
      "content": "使用二分搜尋因為...",
      "children": {
        "statement-5": {
          "type": "optimization",
          "content": "避免整數溢位"
        }
      }
    }
  },

  "indices": {
    "byType": {
      "design-rationale": ["func-001"],
      "optimization": ["stmt-005"]
    }
  },

  "anchors": [
    {
      "id": "anno-001",
      "anchor": { "type": "statement", "line": 5 },
      "type": "optimization",
      "content": "使用 left + (right-left)/2 避免溢位",
      "author": "user@example.com",
      "timestamp": "2025-10-20T10:30:00Z"
    }
  ],

  "syncStatus": {
    "lastSync": "2025-10-20T10:30:00Z",
    "conflicts": []
  }
}
```

### 衝突解決

當不同形態的註解發生衝突時：

```typescript
/**
 * 衝突解決器
 */
class ConflictResolver {
  /**
   * 偵測衝突
   */
  async detectConflicts(
    template: MultiFormKnowledgeUnit
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // 比較 Sequence 和 Structure 的註解
    const seqAnnotations = this.extractAnnotations(template.forms.sequence);
    const strAnnotations = this.extractAnnotations(template.forms.structure);

    for (const [location, seqAnno] of seqAnnotations) {
      const strAnno = strAnnotations.get(location);

      if (strAnno && seqAnno.content !== strAnno.content) {
        conflicts.push({
          location,
          forms: ["sequence", "structure"],
          values: [seqAnno.content, strAnno.content],
          timestamp: [seqAnno.timestamp, strAnno.timestamp]
        });
      }
    }

    return conflicts;
  }

  /**
   * 解決衝突
   */
  async resolveConflict(conflict: Conflict): Promise<Resolution> {
    // 1. 時間戳優先策略
    if (this.isTimestampClear(conflict)) {
      return { strategy: "use-latest", value: this.getLatest(conflict) };
    }

    // 2. AI 輔助合併
    const merged = await this.aiMerge(conflict.values);

    // 3. 讓使用者決定
    return await this.askUser({
      conflict,
      aiSuggestion: merged,
      options: ["use-sequence", "use-structure", "use-ai-merged", "manual-edit"]
    });
  }
}
```

### 版本控制

元資料也需要版本控制：

```typescript
/**
 * 元資料版本控制
 */
interface MetadataVersion {
  version: string;           // "1.0.0"
  timestamp: Date;
  author: string;
  changes: Change[];

  snapshot: {
    annotations: Annotation[];
    metadata: TemplateMetadata;
  };
}

/**
 * 變更記錄
 */
interface Change {
  type: "add" | "modify" | "delete";
  target: "annotation" | "metadata";
  path: string;              // JSON path
  before?: any;
  after?: any;
  reason?: string;
}
```

### 查詢與檢索

```typescript
/**
 * 元資料查詢服務
 */
class MetadataQueryService {
  /**
   * 查詢所有設計理由
   */
  async findDesignRationales(
    templateId: string
  ): Promise<Annotation[]> {
    const metadata = await this.loadMetadata(templateId);
    return metadata.indices.byType.get("design-rationale") || [];
  }

  /**
   * 查詢特定行的註解
   */
  async findAnnotationAtLine(
    templateId: string,
    line: number
  ): Promise<Annotation | null> {
    const metadata = await this.loadMetadata(templateId);
    return metadata.indices.byStatement.get(line) || null;
  }

  /**
   * 全文搜尋註解
   */
  async searchAnnotations(
    query: string,
    filters?: AnnotationFilter
  ): Promise<SearchResult[]> {
    // 實作全文搜尋
  }
}
```

### UI 整合

#### 1. Sequence Form 中的註解

```typescript
// VS Code 裝飾器顯示註解
const decorationType = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: "💡 設計理由",
    color: "#888",
    margin: "0 0 0 1em"
  }
});

// Hover 顯示完整註解
vscode.languages.registerHoverProvider("python", {
  provideHover(document, position) {
    const annotation = getAnnotationAtPosition(position);
    if (annotation) {
      return new vscode.Hover(annotation.content);
    }
  }
});
```

#### 2. Structure Form 中的註解

```xml
<!-- Blockly 積木的 tooltip -->
<block type="for_loop">
  <field name="VAR">i</field>
  <comment>使用 for 迴圈遍歷所有元素</comment>
</block>
```

#### 3. Topology Form 中的註解

```json
{
  "node": {
    "id": "node-001",
    "label": "binarySearch",
    "annotation": {
      "type": "design-rationale",
      "content": "核心搜尋邏輯"
    }
  }
}
```

---

## 領域插件系統

### 設計動機

雖然四級積木系統是**普遍規律**，但不同語言層級有其**特殊性**：

- **HDL** 需要時序分析、資源估算
- **Assembly** 需要暫存器分配、指令週期
- **Python** 需要效能分析、依賴管理

**領域插件系統**允許在統一核心上擴展領域特定功能。

### 核心 + 插件架構

```typescript
/**
 * 核心模板介面（所有語言共通）
 */
interface CoreTemplate {
  // 基本資訊
  id: string;
  name: string;
  languageLevel: LanguageLevel;
  granularity: Granularity;

  // 三種形態
  forms: {
    sequence: SequenceForm;
    structure: StructureForm;
    topology: TopologyForm;
  };

  // 元資料
  metadata: CoreMetadata;
  annotations: AnnotationSystem;

  // 插件掛載點
  plugins?: PluginRegistry;
}

/**
 * 插件註冊表
 */
interface PluginRegistry {
  [pluginName: string]: PluginInstance;
}

/**
 * 插件介面
 */
interface TemplatePlugin {
  name: string;
  version: string;
  supportedLanguages: string[];

  // 生命週期鉤子
  onLoad?(template: CoreTemplate): void;
  onSave?(template: CoreTemplate): void;
  onTransform?(from: FormType, to: FormType): void;

  // 提供額外資料
  provideMetadata?(): any;
  provideValidation?(): ValidationRule[];
  provideTools?(): Tool[];
}
```

### HDL 插件範例

```typescript
/**
 * HDL (Hardware Description Language) 插件
 */
class HDLPlugin implements TemplatePlugin {
  name = "hdl-plugin";
  version = "1.0.0";
  supportedLanguages = ["verilog", "vhdl", "systemverilog"];

  /**
   * 提供 HDL 特定元資料
   */
  provideMetadata() {
    return {
      // 時序資訊
      timing: {
        clockDomains: string[];
        criticalPaths: Path[];
        setupTime: number;
        holdTime: number;
      };

      // 綜合性 (Synthesizability)
      synthesis: {
        synthesizable: boolean;
        targetDevice: string;          // "FPGA" | "ASIC"
        warnings: Warning[];
      };

      // 資源估算
      resources: {
        estimatedLUTs: number;
        estimatedFFs: number;          // Flip-Flops
        estimatedBRAM: number;         // Block RAM
        estimatedDSP: number;          // DSP blocks
      };

      // 驗證資訊
      verification: {
        testbenchAvailable: boolean;
        coveragePercent: number;
        simulationTime: number;
      };
    };
  }

  /**
   * 提供 HDL 特定驗證規則
   */
  provideValidation(): ValidationRule[] {
    return [
      {
        name: "clock-domain-crossing",
        check: (template) => this.checkCDC(template),
        severity: "error"
      },
      {
        name: "combinational-loop",
        check: (template) => this.checkCombLoop(template),
        severity: "error"
      },
      {
        name: "latch-inference",
        check: (template) => this.checkLatch(template),
        severity: "warning"
      }
    ];
  }

  /**
   * 提供 HDL 特定工具
   */
  provideTools(): Tool[] {
    return [
      {
        name: "Timing Analysis",
        icon: "clock",
        execute: (template) => this.runTimingAnalysis(template)
      },
      {
        name: "Resource Estimation",
        icon: "chip",
        execute: (template) => this.estimateResources(template)
      },
      {
        name: "Waveform Viewer",
        icon: "waveform",
        execute: (template) => this.openWaveform(template)
      }
    ];
  }

  /**
   * 時序分析
   */
  private async runTimingAnalysis(template: CoreTemplate): Promise<TimingReport> {
    const verilogCode = template.forms.sequence.content;

    // 呼叫 Vivado 或 Quartus 進行時序分析
    const report = await this.synthesisTools.analyzeTiming(verilogCode);

    return {
      maxFrequency: report.fmax,
      criticalPath: report.criticalPath,
      setupViolations: report.setupViolations,
      holdViolations: report.holdViolations
    };
  }

  /**
   * 資源估算
   */
  private async estimateResources(template: CoreTemplate): Promise<ResourceEstimate> {
    const blocks = template.forms.structure.blocks;

    let luts = 0, ffs = 0, bram = 0, dsp = 0;

    for (const block of blocks) {
      switch (block.type) {
        case "register":
          ffs += block.width || 1;
          break;
        case "adder":
          luts += (block.width || 1) * 2;
          break;
        case "multiplier":
          dsp += 1;
          break;
        case "fifo":
          bram += Math.ceil(block.depth / 512);
          break;
      }
    }

    return { luts, ffs, bram, dsp };
  }
}
```

### Python 插件範例

```typescript
/**
 * Python 語言插件
 */
class PythonPlugin implements TemplatePlugin {
  name = "python-plugin";
  version = "1.0.0";
  supportedLanguages = ["python"];

  provideMetadata() {
    return {
      // 效能分析
      performance: {
        timeComplexity: string;        // "O(n log n)"
        spaceComplexity: string;       // "O(n)"
        benchmarkResults?: BenchmarkData;
      };

      // 依賴管理
      dependencies: {
        stdlib: string[];              // ["os", "sys"]
        external: Package[];           // [{name: "numpy", version: "^1.20"}]
        optional: Package[];
      };

      // 型別提示
      typing: {
        fullyTyped: boolean;
        mypyScore: number;             // 0-100
        typeHints: TypeHint[];
      };

      // 程式碼品質
      quality: {
        pylintScore: number;           // 0-10
        complexityScore: number;       // Cyclomatic complexity
        maintainabilityIndex: number;  // 0-100
      };
    };
  }

  provideTools(): Tool[] {
    return [
      {
        name: "Run Profiler",
        icon: "speedometer",
        execute: (template) => this.profileCode(template)
      },
      {
        name: "Type Check",
        icon: "check-type",
        execute: (template) => this.runMypy(template)
      },
      {
        name: "Lint Code",
        icon: "lint",
        execute: (template) => this.runPylint(template)
      }
    ];
  }
}
```

### Assembly 插件範例

```typescript
/**
 * Assembly 語言插件
 */
class AssemblyPlugin implements TemplatePlugin {
  name = "assembly-plugin";
  version = "1.0.0";
  supportedLanguages = ["x86-asm", "arm-asm", "riscv-asm"];

  provideMetadata() {
    return {
      // 架構資訊
      architecture: {
        isa: string;                   // "x86-64", "ARMv8", "RISC-V"
        extensions: string[];          // ["SSE", "AVX", "NEON"]
      };

      // 暫存器使用
      registers: {
        used: string[];                // ["rax", "rbx", "rcx"]
        spilled: number;               // 溢出到記憶體的暫存器數
        callConvention: string;        // "System V AMD64 ABI"
      };

      // 效能資訊
      performance: {
        instructionCount: number;
        cycleEstimate: number;
        cacheEfficiency: number;       // 0-1
        branchPrediction: {
          predictable: boolean;
          mispredictRate: number;
        };
      };

      // 優化資訊
      optimization: {
        level: string;                 // "-O0", "-O2", "-O3"
        techniques: string[];          // ["loop-unrolling", "SIMD"]
        potentialImprovements: Suggestion[];
      };
    };
  }

  provideTools(): Tool[] {
    return [
      {
        name: "Disassemble",
        execute: (template) => this.disassemble(template)
      },
      {
        name: "Analyze Performance",
        execute: (template) => this.analyzePerformance(template)
      },
      {
        name: "Suggest Optimizations",
        execute: (template) => this.suggestOptimizations(template)
      }
    ];
  }
}
```

### 插件載入機制

```typescript
/**
 * 插件管理器
 */
class PluginManager {
  private plugins: Map<string, TemplatePlugin> = new Map();

  /**
   * 註冊插件
   */
  register(plugin: TemplatePlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * 根據語言載入合適的插件
   */
  loadPluginsForTemplate(template: CoreTemplate): PluginInstance[] {
    const language = template.languageLevel.specific;
    const loaded: PluginInstance[] = [];

    for (const [name, plugin] of this.plugins) {
      if (plugin.supportedLanguages.includes(language)) {
        const instance = this.instantiatePlugin(plugin, template);
        loaded.push(instance);
      }
    }

    return loaded;
  }

  /**
   * 實例化插件
   */
  private instantiatePlugin(
    plugin: TemplatePlugin,
    template: CoreTemplate
  ): PluginInstance {
    const instance = {
      plugin,
      metadata: plugin.provideMetadata?.(),
      validation: plugin.provideValidation?.() || [],
      tools: plugin.provideTools?.() || []
    };

    // 呼叫生命週期鉤子
    plugin.onLoad?.(template);

    return instance;
  }
}
```

### 使用範例

```typescript
// 建立一個 Verilog 模板
const verilogTemplate: CoreTemplate = {
  id: "verilog-counter",
  languageLevel: { type: "hdl", specific: "verilog" },
  granularity: "L1",

  forms: { /* ... */ },
  metadata: { /* ... */ },
  annotations: { /* ... */ },

  // 載入 HDL 插件
  plugins: {
    "hdl-plugin": hdlPlugin
  }
};

// 使用插件提供的功能
const hdlMetadata = verilogTemplate.plugins["hdl-plugin"].metadata;
console.log(`估計使用 ${hdlMetadata.resources.estimatedLUTs} LUTs`);

// 執行時序分析
const timingReport = await hdlPlugin.provideTools()
  .find(t => t.name === "Timing Analysis")
  .execute(verilogTemplate);
```

### 插件生態系統

```
核心系統
├── Core Template Interface
├── Plugin Manager
└── Plugin Registry

官方插件
├── HDL Plugin (Verilog, VHDL)
├── Python Plugin
├── JavaScript Plugin
├── Assembly Plugin (x86, ARM, RISC-V)
└── C/C++ Plugin

社群插件
├── Rust Plugin
├── Go Plugin
├── Quantum Circuit Plugin
└── ... (可無限擴展)
```

---

## 自然語言模板系統

### 設計動機

**核心洞察**：在 AI 時代，規格（Spec）的地位將如同今日的程式碼。

就像我們現在編輯 `.py` 檔案寫程式，未來我們將編輯 `.md` 檔案寫規格，然後由 Coding Agent「編譯」成程式碼。

**TextBricks 的角色**：提供**規格模板**，就像現在提供程式碼模板一樣。

### 自然語言的四級積木

根據我們討論的結果，自然語言也有四個粒度層級：

| 層級 | 定義 | 範例 |
|------|------|------|
| **L0** | 完整文件 | 整份 API 規格文檔 |
| **L1** | 章節/Feature Spec | 單一功能規格 |
| **L2** | 段落/Requirement | "使用者登入後，系統發放 JWT token" |
| **L3** | 概念片段 | "使用者", "JWT token", "過期時間24小時" |

### L3 概念片段的可組合性

基於我們討論的 C + D 方案：**概念片段** + **分層演進**

#### Phase 1: 文字變數（v0.4）

```typescript
// 簡單的文字替換
{
  template: "## {{endpoint_name}}\n**Method**: {{method}}",
  variables: [
    { name: "endpoint_name", type: "text" },
    { name: "method", type: "text" }
  ]
}
```

#### Phase 2: 類型化概念（v0.5）

```typescript
// 有語義的概念
{
  template: "## {{endpoint_name}}\n**Method**: {{method}}",
  concepts: [
    {
      name: "endpoint_name",
      type: "concept:api-endpoint",
      validation: (value) => /^[a-z-]+$/.test(value)
    },
    {
      name: "method",
      type: "concept:http-method",
      options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET"
    }
  ]
}
```

#### Phase 3: 知識圖譜（v1.0）

```typescript
// 豐富的概念網絡
{
  concepts: [
    {
      id: "auth_mechanism",
      type: "concept:authentication",
      knowledgeBase: {
        "JWT": {
          description: "JSON Web Token - 無狀態認證",
          relatedConcepts: ["token-expiry", "refresh-token", "secret-key"],
          implications: [
            "需要配置 SECRET_KEY",
            "建議設定 token 過期時間",
            "考慮實作 refresh token 機制"
          ],
          tradeoffs: {
            pros: ["無狀態", "可擴展", "跨域支援"],
            cons: ["無法即時撤銷", "payload 大小限制"]
          },
          codeTemplates: [
            "fastapi-jwt-auth",
            "express-jwt-middleware"
          ]
        },
        "OAuth2": {
          description: "開放授權協議",
          relatedConcepts: ["authorization-server", "access-token", "scope"],
          implications: [
            "需要整合第三方 OAuth Provider",
            "需要處理回調 URL",
            "需要管理 client_id 和 client_secret"
          ],
          tradeoffs: {
            pros: ["業界標準", "委託認證", "精細權限控制"],
            cons: ["實作複雜", "依賴第三方服務"]
          },
          codeTemplates: [
            "fastapi-oauth2-flow",
            "nextauth-oauth-provider"
          ]
        }
      }
    }
  ]
}
```

### Spec Template 範例庫

#### 1. REST API Endpoint Spec

```typescript
const restApiEndpointSpec: SpecTemplate = {
  id: "spec-rest-api-endpoint",
  name: "REST API Endpoint Specification",
  languageLevel: { type: "natural", specific: "english" },
  granularity: "L1",

  forms: {
    sequence: {
      content: `## {{endpoint_name}}

### Overview
{{description}}

### Endpoint Details
- **Method**: {{method}}
- **Path**: \`{{path}}\`
- **Authentication**: {{auth_required}}

### Request

{{#if has_request_body}}
**Body Parameters**:
{{#each request_params}}
- \`{{name}}\`: {{type}} - {{description}}
{{/each}}
{{/if}}

{{#if has_query_params}}
**Query Parameters**:
{{#each query_params}}
- \`{{name}}\`: {{type}} - {{description}}
{{/each}}
{{/if}}

### Response

**Success Response ({{success_code}})**:
\`\`\`json
{{success_example}}
\`\`\`

**Error Responses**:
{{#each error_responses}}
- **{{code}}**: {{description}}
{{/each}}

### Business Logic
{{business_logic}}

### Implementation Notes
{{implementation_notes}}
`,
      language: "markdown",
      format: ".md"
    },

    structure: {
      schema: {
        type: "api-endpoint",
        fields: [
          { name: "endpoint_name", required: true },
          { name: "method", required: true, enum: ["GET", "POST", "PUT", "DELETE"] },
          { name: "path", required: true },
          { name: "auth_required", required: true, enum: ["Required", "Optional", "None"] },
          { name: "request_params", type: "array" },
          { name: "response", type: "object" }
        ]
      }
    },

    topology: {
      // API 端點之間的關係圖
      nodes: [
        { id: "endpoint", type: "api-endpoint", label: "{{endpoint_name}}" },
        { id: "auth", type: "dependency", label: "{{auth_mechanism}}" },
        { id: "database", type: "dependency", label: "Database" }
      ],
      edges: [
        { from: "endpoint", to: "auth", label: "requires" },
        { from: "endpoint", to: "database", label: "queries" }
      ]
    }
  },

  metadata: {
    designRationale: "RESTful API 設計的標準規格格式",
    useCases: ["API 開發", "前後端協作", "API 文檔生成"],
    difficulty: "beginner"
  },

  // 與 Code Templates 的關聯
  suggestedCodeTemplates: [
    "fastapi-route-handler",
    "pydantic-request-model",
    "pydantic-response-model"
  ],

  // 變數定義（Phase 2: 類型化概念）
  concepts: [
    {
      name: "endpoint_name",
      type: "concept:api-endpoint-name",
      description: "API 端點名稱（如：使用者登入）",
      validation: { pattern: "^[\\u4e00-\\u9fa5a-zA-Z ]+$" }
    },
    {
      name: "method",
      type: "concept:http-method",
      description: "HTTP 方法",
      options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET"
    },
    {
      name: "auth_required",
      type: "concept:auth-requirement",
      options: ["Required", "Optional", "None"],
      default: "Required",
      implications: {
        "Required": "需要實作認證中間件",
        "Optional": "需要處理有/無認證兩種情況",
        "None": "公開端點，注意安全風險"
      }
    }
  ]
};
```

#### 2. Algorithm Description Spec

```typescript
const algorithmSpec: SpecTemplate = {
  id: "spec-algorithm-description",
  name: "Algorithm Specification",
  languageLevel: { type: "natural", specific: "english" },
  granularity: "L1",

  forms: {
    sequence: {
      content: `## Algorithm: {{algorithm_name}}

### Purpose
{{purpose}}

### Input
{{input_description}}

### Output
{{output_description}}

### Algorithm Steps
{{#each steps}}
{{add @index 1}}. {{this}}
{{/each}}

### Time Complexity
- **Best Case**: {{time_best}}
- **Average Case**: {{time_avg}}
- **Worst Case**: {{time_worst}}

### Space Complexity
{{space_complexity}}

### Example
**Input**: {{example_input}}
**Output**: {{example_output}}
**Explanation**: {{example_explanation}}

### Implementation Constraints
{{constraints}}

### Edge Cases
{{#each edge_cases}}
- {{this}}
{{/each}}
`,
      language: "markdown",
      format: ".md"
    },

    structure: {
      schema: {
        type: "algorithm",
        fields: [
          { name: "algorithm_name", required: true },
          { name: "purpose", required: true },
          { name: "steps", type: "array", required: true },
          { name: "complexity", type: "object" }
        ]
      }
    },

    topology: {
      // 演算法流程圖
      nodes: [
        { id: "input", type: "input", label: "Input: {{input_description}}" },
        { id: "process", type: "process", label: "{{algorithm_name}}" },
        { id: "output", type: "output", label: "Output: {{output_description}}" }
      ]
    }
  },

  suggestedCodeTemplates: [
    "algorithm-function-skeleton",
    "time-complexity-test",
    "edge-case-tests"
  ]
};
```

#### 3. Data Model Spec

```typescript
const dataModelSpec: SpecTemplate = {
  id: "spec-data-model",
  name: "Data Model Specification",
  languageLevel: { type: "natural", specific: "english" },
  granularity: "L1",

  forms: {
    sequence: {
      content: `## Data Model: {{model_name}}

### Purpose
{{purpose}}

### Fields

| Field Name | Type | Required | Default | Description |
|------------|------|----------|---------|-------------|
{{#each fields}}
| {{name}} | {{type}} | {{required}} | {{default}} | {{description}} |
{{/each}}

### Relationships
{{#each relationships}}
- **{{type}}** with {{target}}: {{description}}
{{/each}}

### Constraints
{{#each constraints}}
- {{this}}
{{/each}}

### Indexes
{{#each indexes}}
- {{this}}
{{/each}}

### Example Data
\`\`\`json
{{example_json}}
\`\`\`

### Migration Notes
{{migration_notes}}
`,
      language: "markdown",
      format: ".md"
    },

    structure: {
      schema: {
        type: "data-model",
        fields: [
          { name: "model_name", required: true },
          { name: "fields", type: "array", required: true },
          { name: "relationships", type: "array" }
        ]
      }
    },

    topology: {
      // 資料模型關係圖 (ERD)
      nodes: [
        { id: "model", type: "entity", label: "{{model_name}}" },
        // 關聯的其他模型會動態生成
      ],
      edges: [
        // 關係會根據 relationships 動態生成
      ]
    }
  },

  suggestedCodeTemplates: [
    "sqlalchemy-model",
    "pydantic-schema",
    "database-migration",
    "prisma-schema"
  ]
};
```

### 與 SpecKit 的整合

#### SpecKit 工作流程

```
1. /speckit.constitution    → 專案治理原則
2. /speckit.specify         → 功能規格
3. /speckit.plan           → 技術計畫
4. /speckit.tasks          → 任務分解
5. implement               → Coding Agent 實作
```

#### TextBricks 在 SpecKit 中的角色

```typescript
/**
 * TextBricks + SpecKit 整合
 */
class SpecKitIntegration {
  /**
   * 在 /specify 階段提供模板建議
   */
  async suggestSpecTemplates(context: SpecContext): Promise<SpecTemplate[]> {
    const userIntent = await this.analyzeUserIntent(context);

    // 根據意圖推薦模板
    if (userIntent.includes("API")) {
      return [
        this.getTemplate("spec-rest-api-endpoint"),
        this.getTemplate("spec-graphql-schema"),
        this.getTemplate("spec-websocket-event")
      ];
    }

    if (userIntent.includes("algorithm")) {
      return [
        this.getTemplate("spec-algorithm-description"),
        this.getTemplate("spec-data-structure")
      ];
    }

    if (userIntent.includes("database") || userIntent.includes("model")) {
      return [
        this.getTemplate("spec-data-model"),
        this.getTemplate("spec-database-schema")
      ];
    }

    return [];
  }

  /**
   * 從 spec.md 提取概念，建議相關的 Code Templates
   */
  async suggestCodeTemplates(specPath: string): Promise<CodeTemplate[]> {
    const spec = await this.loadSpec(specPath);
    const concepts = await this.extractConcepts(spec);

    const suggestions: CodeTemplate[] = [];

    for (const concept of concepts) {
      // 如果 spec 提到 "JWT authentication"
      if (concept.type === "authentication" && concept.value === "JWT") {
        suggestions.push(
          this.getCodeTemplate("fastapi-jwt-auth"),
          this.getCodeTemplate("jwt-middleware")
        );
      }

      // 如果 spec 提到特定的資料模型
      if (concept.type === "data-model") {
        suggestions.push(
          this.getCodeTemplate("sqlalchemy-model"),
          this.getCodeTemplate("pydantic-schema")
        );
      }
    }

    return suggestions;
  }

  /**
   * 將 Spec Template 插入到 .speckit/specs/xxx/spec.md
   */
  async insertSpecTemplate(
    templateId: string,
    targetFile: string
  ): Promise<void> {
    const template = await this.getTemplate(templateId);

    // 1. 提示使用者填寫變數/概念
    const values = await this.promptUserForConcepts(template.concepts);

    // 2. 渲染模板
    const rendered = await this.renderTemplate(template.forms.sequence.content, values);

    // 3. 插入到 spec.md
    const currentContent = await fs.readFile(targetFile, "utf-8");
    const insertPosition = this.findInsertPosition(currentContent);
    const newContent = this.insertAtPosition(currentContent, rendered, insertPosition);

    await fs.writeFile(targetFile, newContent);

    // 4. 如果有建議的 Code Templates，在 tasks.md 中標註
    if (template.suggestedCodeTemplates) {
      await this.annotateTasksWithCodeTemplates(
        targetFile.replace("spec.md", "tasks.md"),
        template.suggestedCodeTemplates
      );
    }
  }
}
```

### Spec Template Panel (UI)

```typescript
/**
 * Spec Template Panel - VS Code WebView
 */
class SpecTemplatePanelProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.html = this.getHtmlContent();

    // 處理使用者選擇模板
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "insertTemplate") {
        const template = await this.getTemplate(message.templateId);
        await this.insertTemplate(template);
      }
    });
  }

  private getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Spec Templates</title>
      </head>
      <body>
        <h2>自然語言模板</h2>

        <div class="category">
          <h3>API 規格</h3>
          <div class="template-card" data-id="spec-rest-api-endpoint">
            <h4>REST API Endpoint</h4>
            <p>完整的 API 端點規格</p>
          </div>
          <div class="template-card" data-id="spec-graphql-schema">
            <h4>GraphQL Schema</h4>
            <p>GraphQL 查詢/變更定義</p>
          </div>
        </div>

        <div class="category">
          <h3>演算法規格</h3>
          <div class="template-card" data-id="spec-algorithm-description">
            <h4>Algorithm Description</h4>
            <p>演算法需求與複雜度分析</p>
          </div>
        </div>

        <div class="category">
          <h3>資料模型規格</h3>
          <div class="template-card" data-id="spec-data-model">
            <h4>Data Model</h4>
            <p>資料庫模型定義</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
```

### 完整的開發流程（Spec-Driven）

```
1. 使用者啟動專案
   ↓
2. 執行 /speckit.constitution
   - TextBricks 提供 "Constitution Template"
   ↓
3. 執行 /speckit.specify
   - TextBricks 提供 "API Endpoint Spec Template"
   - 使用者填寫：
     * endpoint_name: "使用者登入"
     * method: "POST"
     * auth_required: "None"（因為是登入端點）
   - 生成 spec.md
   ↓
4. Coding Agent 執行 /speckit.plan
   - 讀取 spec.md
   - 生成 plan.md
   ↓
5. Coding Agent 執行 /speckit.tasks
   - 生成 tasks.md
   - TextBricks 自動標註建議的 Code Templates:
     * Task 1: "實作 POST /auth/login"
       建議模板: [fastapi-route-handler, pydantic-request-model]
   ↓
6. Coding Agent implement
   - 讀取 tasks.md
   - 看到 TextBricks 的建議
   - 選擇使用 fastapi-route-handler 模板
   - 生成程式碼
   ↓
7. 完成！
```

### 雙向同步：Spec ↔ Code

```typescript
/**
 * Spec-Code 雙向同步
 */
class SpecCodeSync {
  /**
   * Spec 變更時，提示更新 Code
   */
  async onSpecChanged(specPath: string, changes: Change[]): Promise<void> {
    // 1. 分析變更
    const affectedCode = await this.findAffectedCode(specPath, changes);

    // 2. 提示使用者
    if (affectedCode.length > 0) {
      const choice = await vscode.window.showInformationMessage(
        `Spec 已變更，發現 ${affectedCode.length} 個相關程式碼檔案`,
        "用 Coding Agent 更新",
        "手動審查",
        "忽略"
      );

      if (choice === "用 Coding Agent 更新") {
        await this.regenerateCode(specPath, affectedCode);
      }
    }
  }

  /**
   * Code 變更時，提示更新 Spec
   */
  async onCodeChanged(codePath: string, changes: Change[]): Promise<void> {
    const relatedSpec = await this.findRelatedSpec(codePath);

    if (relatedSpec) {
      const choice = await vscode.window.showInformationMessage(
        `程式碼已變更，是否更新對應的 Spec？`,
        "是",
        "否"
      );

      if (choice === "是") {
        await this.updateSpec(relatedSpec, codePath, changes);
      }
    }
  }
}
```

### 社群貢獻：Spec Templates

```
Community Spec Templates
├── API Specifications/
│   ├── REST API Endpoint
│   ├── GraphQL Schema
│   ├── gRPC Service
│   ├── WebSocket Event
│   └── Webhook Definition
├── Data Models/
│   ├── Relational Database Schema
│   ├── NoSQL Document Schema
│   ├── Graph Database Schema
│   └── Time-Series Data Model
├── Algorithms/
│   ├── Sorting Algorithm
│   ├── Search Algorithm
│   ├── Graph Algorithm
│   └── Dynamic Programming
├── Architecture/
│   ├── Microservice Architecture
│   ├── Event-Driven Architecture
│   ├── Layered Architecture
│   └── Hexagonal Architecture
└── User Stories/
    ├── User Authentication
    ├── CRUD Operations
    ├── File Upload
    └── Real-time Notifications
```

---

## 底層與硬體開發支援

### 設計動機

TextBricks 不僅支援高階程式語言，也支援**底層開發**：

- **Assembly** - 系統程式、效能優化
- **Machine Code** - 逆向工程、安全研究
- **HDL** - FPGA/ASIC 設計
- **Physical Circuit** - PCB 設計、嵌入式硬體

### Assembly 模板系統

#### Assembly 的四級積木

| 層級 | 定義 | x86-64 範例 | ARM 範例 |
|------|------|-------------|----------|
| **L0** | 完整程式 | 整個 .asm 檔案 | 整個 .s 檔案 |
| **L1** | 函式/子程式 | `function_name:` ... `ret` | `label:` ... `bx lr` |
| **L2** | 指令序列 | Loop prologue, Stack frame | Function call sequence |
| **L3** | 單一指令 | `mov rax, rbx` | `mov r0, r1` |

#### Assembly 模板範例

```typescript
// L1: Function Prologue/Epilogue
const x86FunctionPrologue: AssemblyTemplate = {
  id: "asm-x86-function-prologue",
  name: "x86-64 Function Prologue",
  languageLevel: { type: "low-level", specific: "x86-asm" },
  granularity: "L2",

  forms: {
    sequence: {
      content: `; Function prologue - {{function_name}}
push    rbp
mov     rbp, rsp
sub     rsp, {{stack_size}}    ; Allocate stack space
`,
      language: "asm",
      format: ".asm"
    },

    structure: {
      blocks: [
        { type: "push", operand: "rbp", description: "Save old base pointer" },
        { type: "mov", operands: ["rbp", "rsp"], description: "Set new base pointer" },
        { type: "sub", operands: ["rsp", "{{stack_size}}"], description: "Allocate stack" }
      ]
    },

    topology: {
      nodes: [
        { id: "save-bp", type: "instruction", label: "push rbp" },
        { id: "set-bp", type: "instruction", label: "mov rbp, rsp" },
        { id: "alloc-stack", type: "instruction", label: "sub rsp, N" }
      ],
      edges: [
        { from: "save-bp", to: "set-bp" },
        { from: "set-bp", to: "alloc-stack" }
      ]
    }
  },

  metadata: {
    designRationale: "標準的函式進入序列，符合 System V AMD64 ABI",
    useCases: ["函式定義", "堆疊框架設置"],
    difficulty: "intermediate"
  },

  // Assembly 特定元資料 (Plugin)
  plugins: {
    "assembly-plugin": {
      architecture: {
        isa: "x86-64",
        convention: "System V AMD64 ABI"
      },
      registers: {
        used: ["rbp", "rsp"],
        preserved: ["rbp"]
      },
      performance: {
        instructionCount: 3,
        cycleEstimate: 3
      }
    }
  },

  variables: [
    {
      name: "function_name",
      type: "text",
      description: "函式名稱"
    },
    {
      name: "stack_size",
      type: "number",
      description: "堆疊大小（需為 16 的倍數）",
      validation: (value) => value % 16 === 0
    }
  ]
};

// L2: Loop Template
const x86LoopTemplate: AssemblyTemplate = {
  id: "asm-x86-loop",
  name: "x86-64 Loop Pattern",
  languageLevel: { type: "low-level", specific: "x86-asm" },
  granularity: "L2",

  forms: {
    sequence: {
      content: `; Loop - {{loop_name}}
    mov     {{counter}}, {{iterations}}
.{{loop_label}}:
    ; Loop body
    {{loop_body}}

    dec     {{counter}}
    jnz     .{{loop_label}}
`,
      language: "asm",
      format: ".asm"
    }
  },

  metadata: {
    designRationale: "使用 dec + jnz 組合，效率高於 cmp + jne",
    alternatives: [
      {
        name: "cmp + jne pattern",
        code: "cmp {{counter}}, 0; jne .loop",
        tradeoff: "較直觀但多一條指令"
      }
    ]
  },

  plugins: {
    "assembly-plugin": {
      optimization: {
        level: "-O2",
        techniques: ["dec-jnz fusion"],
        cyclesSaved: 1
      }
    }
  }
};
```

### HDL (Hardware Description Language) 模板系統

#### HDL 的四級積木

| 層級 | 定義 | Verilog 範例 |
|------|------|--------------|
| **L0** | 完整系統 (SoC) | 多個 module 組成的系統 |
| **L1** | Module | `module counter(...)` |
| **L2** | Always Block / Assign | `always @(posedge clk)` |
| **L3** | 邏輯閘 / 賦值 | `a & b`, `assign out = in` |

#### HDL 模板範例

```typescript
// L1: Synchronous Counter
const verilogCounterModule: HDLTemplate = {
  id: "hdl-verilog-counter",
  name: "Synchronous Counter",
  languageLevel: { type: "hdl", specific: "verilog" },
  granularity: "L1",

  forms: {
    sequence: {
      content: `module {{module_name}} #(
    parameter WIDTH = {{width}}
)(
    input  wire clk,
    input  wire reset,
    output reg [WIDTH-1:0] count
);

    always @(posedge clk or posedge reset) begin
        if (reset)
            count <= {WIDTH{1'b0}};
        else
            count <= count + 1'b1;
    end

endmodule
`,
      language: "verilog",
      format: ".v"
    },

    structure: {
      blocks: [
        {
          type: "module",
          name: "{{module_name}}",
          ports: [
            { name: "clk", direction: "input", type: "wire" },
            { name: "reset", direction: "input", type: "wire" },
            { name: "count", direction: "output", type: "reg", width: "{{width}}" }
          ],
          body: [
            {
              type: "always-block",
              sensitivity: ["posedge clk", "posedge reset"],
              body: "sequential-logic"
            }
          ]
        }
      ]
    },

    topology: {
      // 電路圖
      nodes: [
        { id: "clk", type: "input", label: "clk" },
        { id: "reset", type: "input", label: "reset" },
        { id: "counter_reg", type: "register", label: "count[{{width}}-1:0]", width: "{{width}}" },
        { id: "adder", type: "logic", label: "+1" },
        { id: "mux", type: "logic", label: "MUX" },
        { id: "count_out", type: "output", label: "count" }
      ],
      edges: [
        { from: "clk", to: "counter_reg", port: "clk" },
        { from: "reset", to: "mux", port: "sel" },
        { from: "counter_reg", to: "adder", port: "a" },
        { from: "adder", to: "mux", port: "in1" },
        { from: "mux", to: "counter_reg", port: "d" },
        { from: "counter_reg", to: "count_out" }
      ],
      graphType: "circuit-diagram"
    }
  },

  metadata: {
    designRationale: "同步計數器，使用異步 reset",
    useCases: ["計時器", "序列生成", "狀態機"],
    difficulty: "beginner"
  },

  // HDL 特定元資料
  plugins: {
    "hdl-plugin": {
      timing: {
        clockDomains: ["clk"],
        resetStyle: "asynchronous"
      },
      synthesis: {
        synthesizable: true,
        targetDevice: "FPGA"
      },
      resources: {
        estimatedFFs: "{{width}}",
        estimatedLUTs: "{{width}} * 2",  // 加法器 + MUX
        estimatedBRAM: 0,
        estimatedDSP: 0
      },
      verification: {
        testbenchAvailable: true,
        testbenchTemplate: "hdl-testbench-counter"
      }
    }
  },

  variables: [
    {
      name: "module_name",
      type: "text",
      default: "counter",
      description: "模組名稱"
    },
    {
      name: "width",
      type: "number",
      default: 8,
      description: "計數器位元寬度",
      validation: (value) => value > 0 && value <= 64
    }
  ]
};

// L2: FIFO Module
const verilogFIFO: HDLTemplate = {
  id: "hdl-verilog-fifo",
  name: "Synchronous FIFO",
  languageLevel: { type: "hdl", specific: "verilog" },
  granularity: "L1",

  forms: {
    sequence: {
      content: `module {{module_name}} #(
    parameter DATA_WIDTH = {{data_width}},
    parameter DEPTH = {{depth}}
)(
    input  wire clk,
    input  wire reset,

    // Write interface
    input  wire                    wr_en,
    input  wire [DATA_WIDTH-1:0]   wr_data,
    output wire                    full,

    // Read interface
    input  wire                    rd_en,
    output reg  [DATA_WIDTH-1:0]   rd_data,
    output wire                    empty
);

    localparam ADDR_WIDTH = $clog2(DEPTH);

    reg [DATA_WIDTH-1:0] mem [0:DEPTH-1];
    reg [ADDR_WIDTH:0] wr_ptr, rd_ptr;

    assign full = (wr_ptr[ADDR_WIDTH] != rd_ptr[ADDR_WIDTH]) &&
                  (wr_ptr[ADDR_WIDTH-1:0] == rd_ptr[ADDR_WIDTH-1:0]);
    assign empty = (wr_ptr == rd_ptr);

    // Write logic
    always @(posedge clk) begin
        if (reset) begin
            wr_ptr <= 0;
        end else if (wr_en && !full) begin
            mem[wr_ptr[ADDR_WIDTH-1:0]] <= wr_data;
            wr_ptr <= wr_ptr + 1;
        end
    end

    // Read logic
    always @(posedge clk) begin
        if (reset) begin
            rd_ptr <= 0;
            rd_data <= 0;
        end else if (rd_en && !empty) begin
            rd_data <= mem[rd_ptr[ADDR_WIDTH-1:0]];
            rd_ptr <= rd_ptr + 1;
        end
    end

endmodule
`,
      language: "verilog",
      format: ".v"
    }
  },

  metadata: {
    designRationale: "同步 FIFO，使用 Gray code pointer 避免 CDC 問題",
    useCases: ["資料緩衝", "時脈域轉換", "流量控制"],
    difficulty: "intermediate",
    alternatives: [
      {
        name: "Asynchronous FIFO",
        when: "需要跨時脈域",
        tradeoff: "更複雜但支援異步讀寫"
      }
    ]
  },

  plugins: {
    "hdl-plugin": {
      resources: {
        estimatedFFs: "{{data_width}} * {{depth}} + 控制邏輯",
        estimatedBRAM: Math.ceil("{{depth}}" / 512)  // 如果 depth 大，會使用 BRAM
      },
      timing: {
        criticalPath: "mem 讀取路徑"
      }
    }
  }
};
```

### Machine Code 模板

```typescript
// Machine Code Patterns
const x86InstructionPattern: MachineCodeTemplate = {
  id: "machine-x86-mov-pattern",
  name: "x86-64 MOV Instruction Encoding",
  languageLevel: { type: "machine", specific: "x86-64" },
  granularity: "L3",

  forms: {
    sequence: {
      content: "48 89 C3",  // mov rbx, rax (hex)
      language: "hex",
      format: ".bin"
    },

    structure: {
      encoding: {
        REX: "48",       // REX.W prefix (64-bit operand)
        opcode: "89",    // MOV r/m64, r64
        ModRM: "C3"      // MOD=11 (register), REG=000 (rax), R/M=011 (rbx)
      }
    },

    topology: {
      // 指令解碼流水線
      nodes: [
        { id: "fetch", label: "Fetch: 48 89 C3" },
        { id: "decode", label: "Decode: MOV rbx, rax" },
        { id: "execute", label: "Execute: rbx ← rax" }
      ]
    }
  },

  metadata: {
    designRationale: "64-bit 暫存器間資料移動",
    useCases: ["逆向工程", "二進制分析", "效能優化"]
  },

  plugins: {
    "machine-plugin": {
      architecture: "x86-64",
      cycles: 1,
      latency: 1,
      throughput: 0.25  // 每個週期可執行 4 條
    }
  }
};
```

### 底層開發的特殊需求

#### 1. 精確性要求

底層開發需要**位元級精確**：

```typescript
// 不能有模糊的抽象
// ✗ 錯誤：抽象的「迴圈」
template: "loop {{times}} times"

// ✓ 正確：精確的指令序列
template: `mov ecx, {{times}}
.loop:
    {{body}}
    dec ecx
    jnz .loop`
```

#### 2. 資源限制

硬體資源是**有限且昂貴的**：

```typescript
// HDL 模板需要標註資源使用
plugins: {
  "hdl-plugin": {
    resources: {
      LUTs: 100,           // ← 使用者需要知道
      FFs: 50,
      BRAM: 2,
      maxFrequency: "200 MHz"
    }
  }
}
```

#### 3. 時序保證

硬體必須滿足**時序約束**：

```typescript
// 時序模板
const timingConstraint: HDLTemplate = {
  metadata: {
    timing: {
      setupTime: "2ns",
      holdTime: "1ns",
      clockToQ: "1.5ns"
    }
  }
};
```

### 底層開發工具整合

```typescript
/**
 * 底層開發工具鏈整合
 */
class LowLevelToolchain {
  /**
   * Assembly 模板 → 組譯 → 驗證
   */
  async assembleAndVerify(template: AssemblyTemplate): Promise<void> {
    // 1. 渲染模板
    const asmCode = await this.renderTemplate(template);

    // 2. 組譯
    const objFile = await this.assemble(asmCode, "nasm");

    // 3. 反組譯驗證
    const disassembled = await this.disassemble(objFile);

    // 4. 比對
    if (!this.verify(asmCode, disassembled)) {
      throw new Error("組譯結果與預期不符");
    }
  }

  /**
   * HDL 模板 → 綜合 → 時序分析
   */
  async synthesizeAndAnalyze(template: HDLTemplate): Promise<SynthesisReport> {
    // 1. 渲染模板
    const verilogCode = await this.renderTemplate(template);

    // 2. 綜合
    const netlist = await this.synthesize(verilogCode, "vivado");

    // 3. 時序分析
    const timingReport = await this.analyzeTiming(netlist);

    // 4. 資源使用報告
    const resourceReport = await this.analyzeResources(netlist);

    return { timing: timingReport, resources: resourceReport };
  }
}
```

---

## 檔案架構設計

> **v3.0 重大更新**：檔案架構反映多語言層級、多形態知識單元、插件系統的設計

### 整體結構

> **v3.0 核心原則**：每個模板都是完整的**多形態知識單元**，三種形態（Sequence/Structure/Topology）存放在同一個目錄下，不拆散

```
scopes/
└── local/                          # Local scope（可信來源）
    ├── scope.json                  # Scope 配置
    │
    ├── templates/                  # v3.0: 知識單元目錄（按語言層級組織）
    │   │
    │   ├── _registry/              # v3.0: Template Registry（集中管理）
    │   │   ├── registry.db         # SQLite 資料庫
    │   │   ├── index.json          # 快速查詢索引
    │   │   ├── plugins/            # 插件資料
    │   │   │   ├── hdl-plugin/
    │   │   │   ├── python-plugin/
    │   │   │   └── assembly-plugin/
    │   │   └── cache/              # 快取目錄
    │   │       ├── by-language-level/
    │   │       ├── by-granularity/
    │   │       └── by-plugin/
    │   │
    │   ├── natural/                # v3.0: 自然語言層級
    │   │   ├── english/
    │   │   │   ├── topic.json
    │   │   │   └── specs/
    │   │   │       └── rest-api-endpoint/   # ⭐ 完整知識單元
    │   │   │           ├── meta.json        # 知識單元元資料
    │   │   │           ├── sequence.md      # Sequence Form (Spec)
    │   │   │           ├── structure.json   # Structure Form (概念積木)
    │   │   │           ├── topology.json    # Topology Form (概念圖)
    │   │   │           ├── concepts.json    # 提取的概念
    │   │   │           ├── annotations/     # 註解系統
    │   │   │           │   ├── hierarchical.json
    │   │   │           │   ├── indices.json
    │   │   │           │   └── anchors.json
    │   │   │           ├── README.md
    │   │   │           └── examples/
    │   │   │               └── user-endpoint.md
    │   │   └── chinese/
    │   │       └── ...
    │   │
    │   ├── high-level/             # 高階程式語言層級
    │   │   ├── c/
    │   │   │   ├── topic.json
    │   │   │   └── basics/
    │   │   │       └── hello-world/         # ⭐ 完整知識單元
    │   │   │           ├── meta.json        # 知識單元元資料
    │   │   │           ├── sequence.c       # Sequence Form (程式碼)
    │   │   │           ├── sequence.h       # 額外檔案（可選）
    │   │   │           ├── structure.xml    # Structure Form (Blockly)
    │   │   │           ├── topology.json    # Topology Form (Call Graph)
    │   │   │           ├── annotations/     # 註解系統
    │   │   │           │   ├── hierarchical.json
    │   │   │           │   ├── indices.json
    │   │   │           │   └── anchors.json
    │   │   │           ├── README.md
    │   │   │           ├── examples/
    │   │   │           │   ├── basic.c
    │   │   │           │   └── advanced.c
    │   │   │           ├── tests/
    │   │   │           │   └── test.c
    │   │   │           └── i18n/
    │   │   │               ├── README.zh-TW.md
    │   │   │               └── README.en.md
    │   │   │
    │   │   ├── python/
    │   │   │   └── ...
    │   │   └── javascript/
    │   │       └── ...
    │   │
    │   ├── low-level/              # v3.0: 低階語言層級（Assembly）
    │   │   ├── x86-64/
    │   │   │   ├── topic.json
    │   │   │   └── basics/
    │   │   │       └── function-prologue/   # ⭐ 完整知識單元
    │   │   │           ├── meta.json
    │   │   │           │   # plugins: ["assembly-plugin"]
    │   │   │           ├── sequence.asm     # Sequence Form (組合語言)
    │   │   │           ├── structure.xml    # Structure Form (指令積木)
    │   │   │           ├── topology.json    # Topology Form (暫存器流程圖)
    │   │   │           ├── annotations/
    │   │   │           └── README.md
    │   │   ├── arm/
    │   │   └── riscv/
    │   │
    │   ├── machine/                # v3.0: 機器語言層級
    │   │   └── x86-64/
    │   │       └── instructions/
    │   │           └── mov-instruction/     # ⭐ 完整知識單元
    │   │               ├── meta.json
    │   │               ├── sequence.hex     # Sequence Form (指令編碼)
    │   │               ├── structure.json   # Structure Form (指令格式圖)
    │   │               ├── topology.json    # Topology Form (管線圖)
    │   │               └── README.md
    │   │
    │   ├── hdl/                    # v3.0: 硬體描述語言層級
    │   │   ├── verilog/
    │   │   │   ├── topic.json
    │   │   │   └── basics/
    │   │   │       └── counter-module/      # ⭐ 完整知識單元
    │   │   │           ├── meta.json
    │   │   │           │   # plugins: ["hdl-plugin"]
    │   │   │           ├── sequence.v       # Sequence Form (Verilog)
    │   │   │           ├── structure.xml    # Structure Form (模組積木)
    │   │   │           ├── topology.json    # Topology Form (RTL 圖)
    │   │   │           ├── annotations/
    │   │   │           ├── testbench.v      # 測試平台
    │   │   │           └── README.md
    │   │   ├── vhdl/
    │   │   └── systemverilog/
    │   │
    │   └── physical/               # v3.0: 實體電路層級
    │       └── netlists/
    │           └── counter-netlist/         # ⭐ 完整知識單元
    │               ├── meta.json
    │               ├── sequence.json        # Sequence Form (網表)
    │               ├── structure.json       # Structure Form (元件積木)
    │               ├── topology.json        # Topology Form (佈線圖)
    │               └── README.md
    │
    ├── plugins/                    # v3.0: 插件系統
    │   ├── hdl-plugin/
    │   │   ├── plugin.json         # 插件配置
    │   │   ├── index.js            # 插件入口
    │   │   └── lib/                # 插件邏輯
    │   ├── python-plugin/
    │   └── assembly-plugin/
    │
    └── transformations/            # 轉換規則與映射
        ├── registry.json           # 轉換註冊表
        ├── mappings/               # 跨知識單元對應
        │   ├── spec-code/          # Spec ↔ Code
        │   ├── code-assembly/      # Code ↔ Assembly
        │   └── hdl-netlist/        # HDL ↔ Netlist
        │
        └── rules/                  # 轉換規則
            ├── natural-to-high-level/
            ├── high-to-low-level/
            ├── low-to-machine/
            └── high-to-hdl/
```

**v3.0 核心設計原則**：

1. **知識單元完整性** - 每個模板目錄包含所有三種形態，不拆散
2. **統一命名規範** - sequence.*, structure.*, topology.* 清晰識別
3. **語言層級組織** - 頂層按語言層級分類（natural, high-level, low-level, machine, hdl, physical）
4. **插件獨立管理** - 插件系統獨立於模板，透過 meta.json 關聯
5. **Registry 集中索引** - 提供快速查詢，但不改變實體檔案結構

### 知識單元檔案結構範例

#### 範例 1: Natural Language (Spec Template)

```
templates/natural/english/specs/rest-api-endpoint/
├── meta.json          # 知識單元元資料
├── sequence.md        # Sequence Form (Spec 文字)
├── structure.json     # Structure Form (概念積木)
├── topology.json      # Topology Form (概念圖)
├── concepts.json      # 提取的概念
├── annotations/       # 註解系統
│   ├── hierarchical.json
│   ├── indices.json
│   └── anchors.json
├── README.md
└── examples/
    └── user-endpoint.md
```

#### 範例 2: High-Level Programming (C)

```
templates/high-level/c/basics/hello-world/
├── meta.json          # 知識單元元資料
├── sequence.c         # Sequence Form (程式碼)
├── sequence.h         # 額外檔案（可選）
├── structure.xml      # Structure Form (Blockly)
├── topology.json      # Topology Form (Call Graph/Data Flow)
├── annotations/       # 註解系統
│   ├── hierarchical.json
│   ├── indices.json
│   └── anchors.json
├── README.md
├── examples/
│   ├── basic.c
│   └── advanced.c
├── tests/
│   └── test.c
└── i18n/
    ├── README.zh-TW.md
    └── README.en.md
```

#### 範例 3: HDL (Verilog)

```
templates/hdl/verilog/basics/counter-module/
├── meta.json          # 知識單元元資料 (plugins: ["hdl-plugin"])
├── sequence.v         # Sequence Form (Verilog)
├── structure.xml      # Structure Form (模組積木)
├── topology.json      # Topology Form (RTL 圖)
├── annotations/       # 註解系統
│   └── ...
├── testbench.v        # 測試平台
└── README.md
```

---

### meta.json 格式

> **v3.0 完整更新**：反映多形態知識單元結構

```json
{
  "version": "3.0",
  "type": "multi-form-knowledge-unit",

  // 1. 基本資訊
  "id": "high-level-c-hello-world",
  "name": "01-hello-world",
  "title": "Hello World",
  "description": "最基本的 C 程式結構範本，展示三形態知識單元",
  "tags": ["beginner", "basic", "io"],

  // 2. v3.0: 語言層級
  "languageLevel": {
    "type": "high-level",
    "specific": "c"
  },

  // 3. v3.0: 粒度層級
  "granularity": "L1",

  // 4. 三種形態
  "forms": {
    "sequence": {
      "main": "sequence.c",
      "additional": ["sequence.h"],
      "language": "c"
    },
    "structure": {
      "workspace": "structure.xml",
      "format": "blockly"
    },
    "topology": {
      "graphs": ["topology.json"],
      "types": ["call-graph", "data-flow"]
    }
  },

  // 5. v3.0: 元資料（核心！）
  "metadata": {
    "designRationale": "使用 stdio.h 的 printf 是 C 語言最標準的輸出方式",
    "tradeoffs": {
      "pros": ["標準庫支援", "跨平台", "簡單易用"],
      "cons": ["需要連結標準庫", "格式化開銷"]
    },
    "alternatives": ["write() 系統呼叫", "puts()"],
    "useCases": ["初學者教學", "快速原型", "除錯輸出"],
    "antiPatterns": ["在嵌入式環境過度使用 printf"],
    "dependencies": ["stdio.h"],
    "relatedTemplates": ["02-basic-structure", "printf-formatted"],
    "verified": true,
    "rating": 4.8,
    "usageCount": 1250,
    "difficulty": "beginner",
    "learningPath": ["c-syntax", "io-operations"],
    "exercises": ["修改輸出訊息", "加入變數輸出", "格式化輸出"]
  },

  // 6. v3.0: 註解系統（多層次）
  "annotations": {
    "hierarchical": "annotations/hierarchical.json",
    "byLevel": {
      "function": "annotations/indices.json#functions",
      "statement": "annotations/indices.json#statements",
      "block": "annotations/indices.json#blocks"
    },
    "anchored": "annotations/anchors.json"
  },

  // 7. v3.0: 領域插件（可選）
  "plugins": [],

  // 8. 變數與參數化
  "variables": [
    {
      "name": "message",
      "type": "string",
      "default": "Hello, World!",
      "description": "要顯示的訊息",
      "location": "sequence.c:4"
    }
  ],

  // 9. 檔案清單
  "files": {
    "source": ["sequence.c", "sequence.h"],
    "examples": ["examples/basic.c", "examples/advanced.c"],
    "tests": ["tests/test.c"],
    "docs": ["README.md", "i18n/README.zh-TW.md"]
  },

  // 10. 作者與版本
  "author": "timcsy",
  "contributors": ["claude"],
  "created": "2025-10-19",
  "modified": "2025-10-20",
  "templateVersion": "1.2.0",

  // 11. v3.0: 轉換規則（可選）
  "transformRules": {
    "toLanguages": {
      "python": {
        "template": "high-level-python-hello-world",
        "confidence": 0.95
      },
      "javascript": {
        "template": "high-level-js-hello-world",
        "confidence": 0.92
      }
    },
    "toGranularities": {
      "L2": {
        "components": ["printf-statement", "return-statement"],
        "note": "可分解為語句級模板"
      }
    }
  }
}
```

**v3.0 新增欄位說明**：

- **languageLevel**: 語言層級（natural, high-level, low-level, machine, hdl, physical）
- **granularity**: 粒度層級（L0, L1, L2, L3）
- **forms**: 三種形態的完整定義
- **metadata**: 豐富的元資料（設計理由、權衡、用例、反模式等）
- **annotations**: 多層次註解系統
- **plugins**: 插件列表（如 HDL Plugin, Python Plugin）
- **transformRules**: 跨語言/跨粒度轉換規則

**v2.0 → v3.0 遷移**：
- `language` → `languageLevel.specific`
- `type: "template"` → `type: "multi-form-knowledge-unit"`
- `crossReferences` → `metadata.relatedTemplates` + `forms`

### Structure Form (積木形態) 檔案格式

> **v3.0 說明**：Structure Form 存放在每個知識單元目錄內的 `structure.xml` 或 `structure.json`

#### Blockly Workspace (structure.xml)

用於高階程式語言、Assembly、HDL 等：

```xml
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="main_function" id="main" x="50" y="50">
    <statement name="BODY">
      <block type="print" id="print1">
        <value name="TEXT">
          <block type="text">
            <field name="TEXT">Hello, World!</field>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>
```

#### JSON Structure (structure.json)

用於自然語言（概念積木）、Machine Code（指令格式圖）等：

```json
{
  "type": "concept-blocks",
  "version": "3.0",
  "languageLevel": "natural",

  "blocks": [
    {
      "id": "endpoint-concept",
      "type": "rest-api-endpoint",
      "children": [
        {
          "id": "method-concept",
          "type": "http-method",
          "value": "POST"
        },
        {
          "id": "path-concept",
          "type": "api-path",
          "value": "/api/users"
        },
        {
          "id": "request-concept",
          "type": "request-model",
          "fields": ["name", "email", "password"]
        }
      ]
    }
  ]
}
```

---

### Topology Form (圖譜形態) 檔案格式

> **v3.0 說明**：Topology Form 存放在每個知識單元目錄內的 `topology.json`

#### Graph Definition (topology.json)

```json
{
  "id": "hello-world-call-graph",
  "version": "3.0",
  "type": "call-graph",
  "languageLevel": {
    "type": "high-level",
    "specific": "c"
  },

  "nodes": [
    {
      "id": "stdio",
      "type": "library",
      "label": "stdio.h",
      "metadata": {
        "standard": "C99",
        "category": "io"
      }
    },
    {
      "id": "main",
      "type": "function",
      "label": "main()",
      "metadata": {
        "returnType": "int",
        "parameters": []
      }
    },
    {
      "id": "printf",
      "type": "function",
      "label": "printf()",
      "metadata": {
        "library": "stdio",
        "variadic": true
      }
    }
  ],

  "edges": [
    {
      "from": "main",
      "to": "stdio",
      "type": "depends",
      "label": "#include"
    },
    {
      "from": "main",
      "to": "printf",
      "type": "calls",
      "label": "invokes",
      "metadata": {
        "arguments": ["\"Hello, World!\\n\""]
      }
    }
  ],

  "metadata": {
    "entryPoint": "main",
    "complexity": "simple",
    "layers": 2
  },

  "layout": {
    "algorithm": "hierarchical",
    "direction": "top-to-bottom"
  }
}
```

**支援的圖譜類型**（依語言層級）：

| 語言層級 | Topology 類型 |
|---------|---------------|
| Natural Language | 概念圖 (Concept Map) |
| High-Level Programming | Call Graph, Data Flow, Control Flow, Dependency Graph |
| Low-Level (Assembly) | 暫存器流程圖 (Register Flow) |
| Machine Code | 管線圖 (Pipeline Diagram) |
| HDL | RTL 圖 (RTL Schematic) |
| Physical | 佈線圖 (Layout/Routing) |

---

### transformations/ (轉換規則) 詳細結構

```
transformations/
├── registry.json                   # 轉換註冊表
│
├── sequence-to-structure/          # 文字 → 積木
│   ├── c/
│   │   └── patterns/
│   │       ├── hello-world.json
│   │       ├── for-loop.json
│   │       └── function-def.json
│   ├── python/
│   └── javascript/
│
├── sequence-to-topology/           # 文字 → 圖譜
│   ├── c/
│   │   └── analyzers/
│   │       ├── call-graph.js
│   │       ├── data-flow.js
│   │       └── control-flow.js
│   └── python/
│
├── structure-to-sequence/          # 積木 → 文字
│   └── (由 block generators 處理)
│
├── structure-to-topology/          # 積木 → 圖譜
│   └── rules/
│       └── block-dependencies.json
│
├── topology-to-sequence/           # 圖譜 → 文字
│   └── strategies/
│       ├── topological-sort.json
│       ├── inline-expansion.json
│       └── modular-decomposition.json
│
└── topology-to-structure/          # 圖譜 → 積木
    └── rules/
        └── node-to-block.json
```

#### registry.json 格式

```json
{
  "version": "1.0",
  "forms": ["sequence", "structure", "topology"],

  "transformations": {
    "sequence-to-structure": {
      "strategy": "pattern-matching",
      "difficulty": "hard",
      "accuracy": "medium",
      "lossiness": "lossy",
      "lossTypes": ["formatting", "comments", "style"]
    },
    "sequence-to-topology": {
      "strategy": "static-analysis",
      "difficulty": "medium",
      "accuracy": "high",
      "lossiness": "lossy",
      "lossTypes": ["implementation-details"]
    },
    "structure-to-sequence": {
      "strategy": "code-generation",
      "difficulty": "easy",
      "accuracy": "high",
      "lossiness": "lossless"
    },
    "structure-to-topology": {
      "strategy": "block-dependency-analysis",
      "difficulty": "easy",
      "accuracy": "high",
      "lossiness": "lossless"
    },
    "topology-to-sequence": {
      "strategy": "graph-traversal",
      "difficulty": "medium",
      "accuracy": "medium",
      "lossiness": "lossy",
      "lossTypes": ["fine-grained-logic"]
    },
    "topology-to-structure": {
      "strategy": "node-expansion",
      "difficulty": "medium",
      "accuracy": "medium",
      "lossiness": "lossy",
      "lossTypes": ["expression-details"]
    }
  },

  "pathways": {
    "c-to-python": {
      "recommended": "via-structure",
      "paths": {
        "via-structure": {
          "steps": ["seq→str", "str→seq"],
          "accuracy": 0.85,
          "speed": "fast"
        },
        "via-topology": {
          "steps": ["seq→top", "top→seq"],
          "accuracy": 0.70,
          "speed": "medium"
        },
        "via-both": {
          "steps": ["seq→str", "str→top", "top→str", "str→seq"],
          "accuracy": 0.80,
          "speed": "slow",
          "note": "經過多次轉換，趨於收斂"
        }
      }
    }
  },

  "lossWarnings": {
    "sequence-to-structure": [
      {
        "feature": "comments",
        "severity": "info",
        "message": "註解將會遺失，但可在文檔中保留"
      },
      {
        "feature": "macro-preprocessing",
        "severity": "warning",
        "message": "巨集預處理指令可能無法完整轉換"
      }
    ],
    "topology-to-sequence": [
      {
        "feature": "fine-grained-expressions",
        "severity": "warning",
        "message": "詳細的表達式邏輯可能需要手動補充"
      }
    ]
  }
}
```

---

## 積木系統設計

### 積木分類

#### 1. 通用積木 (Universal Blocks)

**定義**：跨語言的抽象概念積木

**特徵**：
- 語言無關
- 高層級抽象
- 可生成多種語言

**範例類別**：
- 控制流：for, while, if-else
- 數據結構：variable, array, list
- I/O：print, input, read-file

#### 2. 語言特定積木 (Language-Specific Blocks)

**定義**：特定語言獨有的特性

**特徵**：
- 語言專屬
- 無法跨語言
- 體現語言特色

**範例**：
- C: 指標、手動記憶體管理
- Python: 列表推導、裝飾器
- JavaScript: Promise、async/await

### 積木粒度

**四層粒度系統**：

```
L0 (系統級) ┐
            ├─ 展開/摺疊 ─┐
L1 (模板級) ┤             │
            ├─ 展開/摺疊 ─┤  彈性切換
L2 (語句級) ┤             │
            ├─ 展開/摺疊 ─┘
L3 (表達式級) ┘
```

#### L0 - 系統級 (System Level) ✨ 新增

- **定義**：多個 L1 模板組成的完整系統
- **特徵**：模組間協同、系統級功能、介面定義
- **適用**：專案級視覺化、系統架構設計
- **範例**：學生管理系統、電商平台、遊戲引擎
- **視覺化**：主要透過圖譜形態呈現（Topology）

#### L1 - 模板級 (Template Level)

- **定義**：一個完整的程式或模式
- **特徵**：可展開成 L2 積木組合、有特定功能
- **適用**：初學者使用、快速開發
- **範例**：Hello World 程式、泡沫排序、二元搜尋

#### L2 - 語句級 (Statement Level)

- **定義**：單一語句或控制結構
- **特徵**：可自由組合、有完整功能、是積木編輯的主要粒度
- **適用**：組合邏輯、自訂流程
- **範例**：for 迴圈、if 語句、printf、函式呼叫

#### L3 - 表達式級 (Expression Level)

- **定義**：運算符和基本元素
- **特徵**：最細粒度、可組合成 L2
- **適用**：精確控制、複雜表達式
- **範例**：+、*、==、變數引用、字面量

### 通用積木定義範例

> **v3.0 說明**：以下 block.json 範例是用來說明積木的**內部定義格式**，描述積木的語義、參數、Blockly 配置等。在 v3.0 架構中，這些資訊會整合到知識單元的 `structure.xml` 或 `structure.json` 中，作為 Structure Form 的一部分。

**for-loop/block.json** (概念範例):
```json
{
  "id": "universal_for_loop",
  "type": "universal",
  "category": "control",
  "version": "1.0.0",

  "abstract": {
    "concept": "迴圈：重複執行程式碼區塊",
    "intent": "遍歷一個範圍或集合",
    "semantics": "for (iterator from start to end) { body }",
    "parameters": {
      "iterator": {
        "type": "variable",
        "description": "迭代變數名稱",
        "required": true
      },
      "start": {
        "type": "expression",
        "description": "起始值",
        "required": true
      },
      "end": {
        "type": "expression",
        "description": "結束值",
        "required": true
      },
      "step": {
        "type": "expression",
        "description": "步進值",
        "default": 1
      },
      "body": {
        "type": "statements",
        "description": "迴圈主體",
        "required": true
      }
    }
  },

  "blockly": {
    "type": "universal_for_loop",
    "message0": "for %1 from %2 to %3 %4 do %5",
    "args0": [
      {
        "type": "field_variable",
        "name": "ITERATOR",
        "variable": "i"
      },
      {
        "type": "input_value",
        "name": "START",
        "check": "Number"
      },
      {
        "type": "input_value",
        "name": "END",
        "check": "Number"
      },
      {"type": "input_dummy"},
      {
        "type": "input_statement",
        "name": "BODY"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "通用的 for 迴圈積木，可生成多種語言",
    "helpUrl": ""
  },

  "supportedLanguages": ["c", "python", "javascript", "java"],

  "generators": {
    "c": "for-loop-c.js",
    "python": "for-loop-python.js",
    "javascript": "for-loop-javascript.js"
  },

  "metadata": {
    "tags": ["control", "loop", "iteration"],
    "difficulty": "beginner",
    "author": "textbricks",
    "created": "2025-10-20"
  }
}
```

**generators/c.js**:
```javascript
/**
 * C code generator for universal for-loop
 */
Blockly.C['universal_for_loop'] = function(block) {
  const iterator = block.getFieldValue('ITERATOR');
  const start = Blockly.C.valueToCode(
    block, 'START', Blockly.C.ORDER_ATOMIC
  );
  const end = Blockly.C.valueToCode(
    block, 'END', Blockly.C.ORDER_ATOMIC
  );
  const body = Blockly.C.statementToCode(block, 'BODY');

  const code = `for(int ${iterator} = ${start}; ${iterator} <= ${end}; ${iterator}++) {\n${body}}\n`;

  return code;
};
```

**generators/python.js**:
```javascript
/**
 * Python code generator for universal for-loop
 */
Blockly.Python['universal_for_loop'] = function(block) {
  const iterator = block.getFieldValue('ITERATOR');
  const start = Blockly.Python.valueToCode(
    block, 'START', Blockly.Python.ORDER_ATOMIC
  );
  const end = Blockly.Python.valueToCode(
    block, 'END', Blockly.Python.ORDER_ATOMIC
  );
  const body = Blockly.Python.statementToCode(block, 'BODY');

  const code = `for ${iterator} in range(${start}, ${end} + 1):\n${body}`;

  return code;
};
```

### 語言特定積木定義範例

> **v3.0 說明**：以下 block.json 範例展示語言特定積木的定義格式。在 v3.0 架構中，這些定義會存放在對應語言知識單元的 `structure.xml` 或 `structure.json` 中。

**c/pointers/pointer-declaration/block.json** (概念範例):
```json
{
  "id": "c_pointer_declaration",
  "type": "language-specific",
  "language": "c",
  "category": "pointers",
  "version": "1.0.0",

  "blockly": {
    "type": "c_pointer_declaration",
    "message0": "宣告指標 %1 指向 %2",
    "args0": [
      {
        "type": "field_variable",
        "name": "PTR",
        "variable": "ptr"
      },
      {
        "type": "field_variable",
        "name": "VAR",
        "variable": "x"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230,
    "tooltip": "宣告一個指向變數的指標",
    "helpUrl": ""
  },

  "generators": {
    "c": "pointer-declaration-c.js"
  },

  "crossLanguageMapping": {
    "python": null,
    "javascript": null,
    "note": "指標是 C 語言特有概念，無法直接映射到其他語言。Python/JS 可以考慮用引用或物件來近似。"
  },

  "metadata": {
    "tags": ["pointer", "memory", "advanced"],
    "difficulty": "advanced",
    "warning": "此積木無法轉換到其他語言"
  }
}
```

---

## 積木展開摺疊機制

### 概述

積木的展開（Expand）和摺疊（Collapse）機制允許使用者在不同粒度層級之間自由切換。這個機制是 TextBricks 多形態系統的核心特性之一，讓使用者能夠根據需求在「高階抽象」與「細節實作」之間靈活調整視角。

### 四級轉換關係

```
展開方向 → ：增加細節、降低抽象
摺疊方向 ← ：減少細節、提高抽象

           展開                展開               展開
L0 ←――――――――→ L1 ←――――――――→ L2 ←――――――――→ L3
(系統級)      (模板級)      (語句級)      (表達式級)
    ↕             ↕             ↕             ↕
   圖譜         圖譜         文字          文字
  (系統圖)    (呼叫圖)    (函式程式碼)  (表達式程式碼)
```

### L0 ↔ L1 展開摺疊

#### L0 → L1 展開

**定義**：將系統級積木展開成多個模板級積木的組合

**使用場景**：
- 系統架構設計完成後，需要實作各個模組
- 從圖譜視圖切換到積木編輯器

**機制**：
```typescript
class L0Expander {
  expandL0ToL1(l0System: L0Block): L1Block[] {
    // 讀取系統定義
    const systemDef = l0System.getSystemDefinition();

    // 提取各個模組
    const modules = systemDef.modules;

    // 為每個模組創建 L1 積木
    const l1Blocks = modules.map(module => {
      return this.createL1BlockFromModule(module);
    });

    return l1Blocks;
  }
}
```

**範例**：
```
L0: [學生管理系統]
  ↓ 展開
L1:
  - [模組] input_module
  - [模組] storage_module
  - [模組] search_module
  - [主程式] main
```

#### L1 → L0 摺疊

**定義**：將多個相關的 L1 積木摺疊成一個系統級積木

**使用場景**：
- 完成多個模組的實作後，整合成系統
- 從積木編輯器切換到系統架構視圖

**觸發條件**：
- 使用者手動選擇多個 L1 積木並執行「摺疊成系統」
- 系統檢測到模組間有明確的介面關係

**機制**：
```typescript
class L1Folder {
  collapseL1ToL0(l1Blocks: L1Block[], systemName: string): L0Block {
    // 驗證模組間的介面一致性
    const isValid = this.validateModuleInterfaces(l1Blocks);
    if (!isValid) {
      throw new Error("模組介面不一致，無法摺疊成系統");
    }

    // 分析模組間的依賴關係
    const dependencies = this.analyzeDependencies(l1Blocks);

    // 創建系統定義
    const systemDef = {
      name: systemName,
      modules: l1Blocks.map(b => b.toModuleDefinition()),
      dependencies: dependencies
    };

    // 創建 L0 積木
    return new L0Block(systemDef);
  }
}
```

### L1 ↔ L2 展開摺疊

#### L1 → L2 展開

**定義**：將模板級積木展開成語句級積木組合

**使用場景**：
- 初學者選擇預定義模板後，想要修改細節
- 理解模板的內部結構

**機制**：
```typescript
class L1Expander {
  expandL1ToL2(l1Block: L1Block): L2Block[] {
    // 讀取 L1 的 workspace.xml
    const workspace = l1Block.loadWorkspace();

    // 解析成 L2 積木陣列
    const l2Blocks = this.parseWorkspaceToL2(workspace);

    // 在編輯器中顯示
    this.renderInEditor(l2Blocks);

    return l2Blocks;
  }
}
```

**範例**：
```blockly
L1: [Hello World 程式]
  ↓ 展開
L2:
  [include] <stdio.h>
  [main function]
    [printf] "Hello, World!\n"
    [return] 0
```

#### L2 → L1 摺疊

**定義**：將語句級積木組合摺疊成模板級積木

**使用場景**：
- 使用者組合出有用的積木組合，想要儲存為可重用的模板
- 簡化視圖，隱藏細節

**摺疊分數系統**：
```typescript
interface FoldingScore {
  l2_to_l1: {
    syntaxCorrectness: number;    // 語法正確性 (0-1)
    semanticClarity: number;       // 語義清晰度 (0-1)
    algorithmRecognition: number;  // 能否識別為已知演算法 (0-1)
    codeCompactness: number;       // 程式碼緊湊度 (0-1)
  };
  total: number;  // 加權總分
}

class L2Folder {
  calculateFoldingScore(l2Blocks: L2Block[]): FoldingScore {
    const score = {
      l2_to_l1: {
        syntaxCorrectness: this.checkSyntax(l2Blocks),
        semanticClarity: this.checkSemanticClarity(l2Blocks),
        algorithmRecognition: this.matchKnownAlgorithms(l2Blocks),
        codeCompactness: this.calculateCompactness(l2Blocks)
      },
      total: 0
    };

    // 加權計算總分
    score.total =
      score.l2_to_l1.syntaxCorrectness * 0.3 +
      score.l2_to_l1.semanticClarity * 0.2 +
      score.l2_to_l1.algorithmRecognition * 0.3 +
      score.l2_to_l1.codeCompactness * 0.2;

    return score;
  }

  suggestFolding(l2Blocks: L2Block[]): FoldingSuggestion | null {
    const score = this.calculateFoldingScore(l2Blocks);

    if (score.total > 0.8) {
      return {
        confidence: "high",
        message: "這個積木組合很適合摺疊成模板！",
        suggestedName: this.generateTemplateName(l2Blocks),
        score: score
      };
    } else if (score.total > 0.5) {
      return {
        confidence: "medium",
        message: "可以摺疊，但建議檢查語義清晰度",
        suggestedName: this.generateTemplateName(l2Blocks),
        score: score
      };
    } else {
      return null;  // 不建議摺疊
    }
  }
}
```

### L2 ↔ L3 展開摺疊

#### L2 → L3 展開

**定義**：將語句級積木展開成表達式級積木

**使用場景**：
- 需要精確控制表達式的計算順序
- 教學：展示表達式的內部結構

**範例**：
```blockly
L2: [for] i from 0 to n-1
  ↓ 展開
L3:
  [for statement]
    iterator: [variable] i
    start: [literal] 0
    end: [subtraction]
      left: [variable] n
      right: [literal] 1
    body: [statements]
```

#### L3 → L2 摺疊

**定義**：將表達式級積木組合摺疊成語句級積木

**自動摺疊**：當 L3 積木組合符合常見的語句模式時，系統自動建議摺疊

**機制**：
```typescript
class L3Folder {
  detectStatementPatterns(l3Blocks: L3Block[]): L2Pattern | null {
    // 檢測 for 迴圈模式
    if (this.matchForLoopPattern(l3Blocks)) {
      return {
        type: "for-loop",
        confidence: 0.95,
        message: "檢測到 for 迴圈模式"
      };
    }

    // 檢測 if 語句模式
    if (this.matchIfStatementPattern(l3Blocks)) {
      return {
        type: "if-statement",
        confidence: 0.90,
        message: "檢測到 if 語句模式"
      };
    }

    return null;
  }
}
```

### Structure Form 版本控制

#### 版本管理策略

**問題**：L1 積木展開後，使用者可能修改 L2 組合。如何管理這些修改？

**解決方案**：版本控制系統

```
templates/high-level/c/basics/hello-world/
  ├── meta.json
  ├── sequence.c
  ├── structure.xml          # 原始版本 (v1)
  ├── structure-v2.xml       # 使用者修改版本
  ├── structure-v3.xml       # 進一步修改
  ├── topology.json
  └── versions/
      ├── metadata.json      # 版本資訊
      └── diffs/             # 版本差異
          ├── v1-to-v2.diff
          └── v2-to-v3.diff
```

#### versions/metadata.json 格式

```json
{
  "currentVersion": "v3",
  "versions": [
    {
      "version": "v1",
      "file": "../structure.xml",
      "created": "2025-10-20T10:00:00Z",
      "author": "system",
      "description": "原始模板",
      "readonly": true
    },
    {
      "version": "v2",
      "file": "../structure-v2.xml",
      "created": "2025-10-20T11:30:00Z",
      "author": "user",
      "description": "加入錯誤處理",
      "changes": "新增 if 語句檢查 null"
    },
    {
      "version": "v3",
      "file": "../structure-v3.xml",
      "created": "2025-10-20T14:20:00Z",
      "author": "user",
      "description": "優化迴圈效能",
      "changes": "改用 while 迴圈"
    }
  ],
  "branches": []
}
```

#### 版本操作

**創建新版本**：
```typescript
class WorkspaceVersionManager {
  createVersion(
    l2Blocks: L2Block[],
    description: string
  ): Version {
    const currentVersion = this.getCurrentVersion();
    const newVersionNumber = this.incrementVersion(currentVersion);

    // 生成 diff
    const diff = this.generateDiff(currentVersion, l2Blocks);

    // 儲存新版本
    const newVersion = {
      version: newVersionNumber,
      file: `workspace-${newVersionNumber}.xml`,
      created: new Date().toISOString(),
      author: this.currentUser,
      description: description,
      changes: diff.summary
    };

    this.saveVersion(newVersion, l2Blocks);
    return newVersion;
  }
}
```

**版本比較**：
```typescript
class VersionComparator {
  compare(v1: Version, v2: Version): VersionDiff {
    const blocks1 = this.loadBlocks(v1);
    const blocks2 = this.loadBlocks(v2);

    return {
      added: this.findAddedBlocks(blocks1, blocks2),
      removed: this.findRemovedBlocks(blocks1, blocks2),
      modified: this.findModifiedBlocks(blocks1, blocks2),
      summary: this.generateSummary(...)
    };
  }
}
```

### 使用者互動設計

#### 展開操作

**觸發方式**：
1. 右鍵選單：右鍵點擊積木 → 「展開到下一層級」
2. 雙擊：雙擊積木自動展開
3. 工具列按鈕：選中積木後點擊「展開」按鈕
4. 快捷鍵：`Ctrl + E`（Expand）

**展開動畫**：
```
[L1 積木]
  ↓ 淡出
  ↓ 同時，周圍出現 L2 積木
  ↓ L2 積木淡入
[L2 積木們]
```

#### 摺疊操作

**觸發方式**：
1. 選擇多個積木後，右鍵 → 「摺疊成模板」
2. 工具列按鈕：選中後點擊「摺疊」按鈕
3. 快捷鍵：`Ctrl + F`（Fold）

**摺疊確認對話框**：
```
┌─────────────────────────────────────┐
│ 摺疊成模板                          │
├─────────────────────────────────────┤
│ 摺疊分數: 85/100 (高)               │
│                                     │
│ ✓ 語法正確性: 95%                   │
│ ✓ 語義清晰度: 80%                   │
│ ✓ 演算法識別: 90% (快速排序)       │
│ ✓ 程式碼緊湊度: 75%                 │
│                                     │
│ 模板名稱: [____________]            │
│ 建議名稱: quick-sort                │
│                                     │
│ 儲存位置:                           │
│  ○ 儲存為新 L1 模板                │
│  ○ 更新現有模板                    │
│  ○ 僅臨時摺疊（不儲存）            │
│                                     │
│ [確認摺疊] [取消]                   │
└─────────────────────────────────────┘
```

### 語法驗證機制

**設計決策**：阻止操作（Blockly 風格）

**實現**：
```typescript
class SyntaxValidator {
  validateConnection(
    sourceBlock: Block,
    targetSocket: Socket
  ): ValidationResult {
    // 檢查類型相容性
    if (!this.areTypesCompatible(sourceBlock.type, targetSocket.acceptedTypes)) {
      return {
        valid: false,
        reason: "類型不相容",
        severity: "error"
      };
    }

    // 檢查語法規則
    if (!this.checkSyntaxRules(sourceBlock, targetSocket)) {
      return {
        valid: false,
        reason: "違反語法規則",
        severity: "error"
      };
    }

    return { valid: true };
  }

  // 物理阻止：插槽不相容時無法拖放
  allowDrop(sourceBlock: Block, targetSocket: Socket): boolean {
    const validation = this.validateConnection(sourceBlock, targetSocket);
    return validation.valid;
  }
}
```

**視覺回饋**：
- 相容的插槽：高亮顯示、綠色邊框
- 不相容的插槽：灰色、不可拖入
- 嘗試拖入不相容積木：紅色閃爍、震動動畫

### 待討論問題

#### 1. L0 積木的視覺呈現

**問題**：L0 應該像一個「超級大積木」還是「積木的容器」？

**選項**：
- A. 單一大積木，內部顯示模組名稱
- B. 容器式，可以在內部拖放 L1 積木
- C. 分標籤頁，每個 L1 一個標籤

**影響**：UI 設計、使用者體驗

#### 2. 展開後的視圖管理

**問題**：展開是「替換」原積木還是「在旁邊打開新視圖」？

**選項**：
- A. 替換：原 L1 消失，顯示 L2 們
- B. 並排：左邊 L1，右邊展開的 L2 們
- C. 疊加：L2 覆蓋在 L1 上，可切換

**權衡**：空間利用 vs 上下文保持

#### 3. 多層級同時展開

**問題**：L0 → L1 → L2 同時展開，如何不讓畫面太混亂？

**可能方案**：
- 階段式展開：先展開 L0 → L1，使用者確認後再展開 L1 → L2
- 樹狀視圖：用樹狀結構顯示層級
- 麵包屑導航：顯示當前在哪一層

---

## 圖譜系統設計

### 圖譜類型

#### 1. 呼叫圖 (Call Graph)

**用途**：顯示函式之間的呼叫關係

**節點類型**：
- 函式 (function)
- 方法 (method)

**邊類型**：
- 呼叫 (calls)
- 被呼叫 (called-by)

#### 2. 數據流圖 (Data Flow Graph)

**用途**：追蹤數據在程式中的流動

**節點類型**：
- 變數 (variable)
- 常數 (constant)
- 運算 (operation)

**邊類型**：
- 數據流 (data-flow)
- 賦值 (assignment)

#### 3. 依賴圖 (Dependency Graph)

**用途**：顯示模組、檔案之間的依賴關係

**節點類型**：
- 模組 (module)
- 檔案 (file)
- 函式庫 (library)

**邊類型**：
- 依賴 (depends-on)
- 包含 (includes)
- 匯入 (imports)

#### 4. 控制流圖 (Control Flow Graph)

**用途**：顯示程式執行的可能路徑

**節點類型**：
- 基本塊 (basic-block)
- 分支點 (branch)
- 合流點 (merge)

**邊類型**：
- 順序 (sequential)
- 條件 (conditional)
- 迴圈 (loop)

### 圖譜存儲格式

#### nodes.json
```json
{
  "nodes": [
    {
      "id": "node_001",
      "type": "function",
      "label": "main",
      "properties": {
        "returnType": "int",
        "parameters": [],
        "visibility": "public"
      },
      "metadata": {
        "file": "main.c",
        "line": 5,
        "column": 1
      }
    },
    {
      "id": "node_002",
      "type": "function",
      "label": "printf",
      "properties": {
        "library": "stdio.h",
        "variadic": true
      },
      "metadata": {
        "external": true
      }
    }
  ]
}
```

#### edges.json
```json
{
  "edges": [
    {
      "id": "edge_001",
      "from": "node_001",
      "to": "node_002",
      "type": "calls",
      "label": "invokes",
      "properties": {
        "arguments": ["\"Hello, World!\\n\""],
        "callSite": "line 7"
      }
    }
  ]
}
```

### 互動模式設計

不同類型的圖譜需要不同的互動模式，這是基於圖譜的用途和特性決定的。

#### 互動模式表

| 圖譜類型 | 互動模式 | 可調整布局 | 可編輯結構 | 理由 |
|---------|---------|-----------|-----------|------|
| **Call Graph** | 唯讀 + 可調整布局 | ✅ | ❌ | 呼叫關係由程式碼決定，不應直接編輯，但可以調整視覺化幫助理解 |
| **Data Flow** | 唯讀 + 可調整布局 | ✅ | ❌ | 數據流向由程式邏輯決定，調整布局幫助追蹤數據流動 |
| **Dependency Graph** | 可編輯結構 | ✅ | ✅ | 模組依賴可以重構（如移除不必要的 import），編輯會同步到程式碼 |
| **Control Flow** | 唯讀 | ✅ | ❌ | 控制流由程式碼決定，太細節不適合直接編輯 |

#### 互動功能詳細說明

**唯讀模式（Read-Only）**：
- ✅ 可以縮放（Zoom In/Out）
- ✅ 可以平移（Pan）
- ✅ 可以點擊節點查看詳細資訊
- ✅ 可以摺疊/展開節點
- ❌ 不能新增/刪除節點
- ❌ 不能新增/刪除連線

**可調整布局（Layout Adjustable）**：
- ✅ 可以拖曳節點調整位置
- ✅ 調整會儲存到 `visualizations/layout.json`
- ✅ 下次開啟時恢復使用者的布局
- ❌ 不改變程式結構

**可編輯結構（Structure Editable）**：
- ✅ 可以新增/刪除連線（如 Dependency Graph 中的依賴關係）
- ✅ 編輯動作會**同步修改程式碼**
- ⚠️ 有驗證機制（例如不能創建循環依賴）
- ⚠️ 編輯前會警告使用者

#### 具體範例

**Call Graph（唯讀 + 可調整布局）**：
```
使用者操作：
1. 拖曳 main() 節點到畫面中央
2. 拖曳 printf() 節點到 main() 下方
3. 點擊「儲存布局」

系統行為：
- 節點位置儲存到 layout.json
- 程式碼不受影響
- 下次開啟時，節點在同樣的位置
```

**Dependency Graph（可編輯結構）**：
```
使用者操作：
1. 右鍵點擊 module_a → module_b 的連線
2. 選擇「移除此依賴」

系統行為：
- 顯示警告對話框：
  「將會從 module_a.c 中移除 #include "module_b.h"
   確定要繼續嗎？」
- 使用者確認後：
  - 修改 module_a.c，移除 #include
  - 更新圖譜，移除連線
  - 重新驗證專案（檢查是否有編譯錯誤）
```

### 布局管理系統

#### 布局演算法選擇

不同的圖譜類型適合不同的布局演算法：

##### 1. Hierarchical（階層式）

**適用圖譜**：Call Graph, Control Flow Graph

**特徵**：
- 由上到下（或由左到右）的層級結構
- 清楚顯示呼叫層級或執行順序
- 父節點在上，子節點在下

**參數**：
```typescript
interface HierarchicalLayoutParams {
  direction: 'TB' | 'BT' | 'LR' | 'RL';  // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  levelSeparation: number;  // 層級間距（預設 100px）
  nodeSeparation: number;   // 同層節點間距（預設 50px）
  edgeMinimization: boolean; // 是否最小化邊交叉
}
```

**範例**：
```
Call Graph (TB):
    main()
    ↙  ↓  ↘
input() process() output()
        ↓
      helper()
```

##### 2. Force-Directed（力導向）

**適用圖譜**：Dependency Graph, Data Flow Graph

**特徵**：
- 節點互相排斥（像彈簧）
- 有連線的節點互相吸引
- 自然地形成群集（tightly coupled modules）

**參數**：
```typescript
interface ForceDirectedLayoutParams {
  springLength: number;      // 彈簧長度（預設 100）
  springStrength: number;    // 彈簧強度（預設 0.1）
  repulsionStrength: number; // 排斥強度（預設 1000）
  gravity: number;           // 重力中心強度（預設 0.1）
  iterations: number;        // 迭代次數（預設 300）
}
```

**優點**：
- 相互依賴的模組自然靠近
- 獨立的模組自動分散
- 可以偵測模組群集

##### 3. Circular（圓形）

**適用圖譜**：Dependency Graph（特別是有循環依賴時）

**特徵**：
- 所有節點排列成圓形
- 依賴連線穿過中央
- 容易看出循環依賴

**參數**：
```typescript
interface CircularLayoutParams {
  radius: number;        // 圓形半徑（預設 200）
  startAngle: number;    // 起始角度（預設 0）
  angleSpacing: 'uniform' | 'weighted';  // 均勻分布或根據連線數調整
}
```

**範例**：
```
     A
   ↗   ↖
 B       F
 ↓       ↑
 C  →  D → E

如果 A → B → C → D → E → F → A（循環），
在圓形布局中非常明顯
```

##### 4. Orthogonal（正交式）

**適用圖譜**：Control Flow Graph

**特徵**：
- 所有連線都是水平或垂直
- 類似傳統流程圖
- 適合表示順序執行流程

**參數**：
```typescript
interface OrthogonalLayoutParams {
  direction: 'TB' | 'LR';
  gridSize: number;  // 網格大小（預設 20）
  edgeRouting: 'direct' | 'orthogonal'; // 連線路徑
}
```

##### 5. Radial（輻射狀）

**適用圖譜**：Call Graph（入口點少的情況）

**特徵**：
- 中心節點（如 main）在中央
- 其他節點圍繞輻射
- 層級關係以同心圓表示

**參數**：
```typescript
interface RadialLayoutParams {
  centerNode: string;  // 中心節點 ID
  layerDistance: number;  // 層級距離（預設 100）
}
```

##### 6. Layered（分層式）

**適用圖譜**：Data Flow Graph

**特徵**：
- 從左到右（或上到下）分層
- 每一層是數據處理的一個階段
- 適合 Pipeline 式的數據流

**參數**：
```typescript
interface LayeredLayoutParams {
  direction: 'LR' | 'TB';
  layerSpacing: number;  // 層間距（預設 100）
  nodeSpacing: number;   // 節點間距（預設 50）
}
```

**範例**：
```
Input Layer → Processing Layer → Output Layer
   A    →    B → C → D    →    E
   F    →        ↓         →    G
             H →
```

#### 布局選擇器

自動推薦最適合的布局演算法：

```typescript
class LayoutSelector {
  /**
   * 根據圖譜特徵推薦布局
   */
  recommendLayout(graph: Graph): LayoutRecommendation {
    const features = this.analyzeGraphFeatures(graph);

    // Call Graph
    if (graph.type === 'call-graph') {
      if (features.hasClearHierarchy && features.depth <= 5) {
        return {
          algorithm: 'hierarchical',
          params: { direction: 'TB', levelSeparation: 100 },
          reason: '呼叫層級清楚且深度適中，階層式布局最佳',
          confidence: 0.9
        };
      } else if (features.hasComplexInterconnections) {
        return {
          algorithm: 'force-directed',
          reason: '函式互相呼叫複雜，力導向可以自然群集',
          confidence: 0.8
        };
      } else if (features.hasFewEntryPoints) {
        return {
          algorithm: 'radial',
          params: { centerNode: features.mainEntryPoint },
          reason: '入口點少，輻射狀布局可以清楚顯示呼叫關係',
          confidence: 0.85
        };
      }
    }

    // Data Flow Graph
    if (graph.type === 'dataflow') {
      return {
        algorithm: 'layered',
        params: { direction: 'LR', layerSpacing: 120 },
        reason: '數據流從左到右，分層布局最直觀',
        confidence: 0.95
      };
    }

    // Dependency Graph
    if (graph.type === 'dependency') {
      if (features.hasCycles) {
        return {
          algorithm: 'circular',
          reason: '偵測到循環依賴，圓形布局可以清楚顯示',
          confidence: 0.85,
          warning: '⚠️ 發現循環依賴，建議重構'
        };
      } else {
        return {
          algorithm: 'force-directed',
          reason: '複雜的依賴關係，力導向可以顯示模組群集',
          confidence: 0.8
        };
      }
    }

    // Control Flow Graph
    if (graph.type === 'controlflow') {
      return {
        algorithm: 'orthogonal',
        params: { direction: 'TB', edgeRouting: 'orthogonal' },
        reason: '控制流使用正交布局最像傳統流程圖',
        confidence: 0.9
      };
    }

    // 預設
    return {
      algorithm: 'force-directed',
      reason: '通用布局',
      confidence: 0.5
    };
  }

  /**
   * 分析圖譜特徵
   */
  analyzeGraphFeatures(graph: Graph): GraphFeatures {
    return {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      density: graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1)),
      hasClearHierarchy: this.detectHierarchy(graph),
      depth: this.calculateMaxDepth(graph),
      hasComplexInterconnections: this.detectComplexInterconnections(graph),
      hasFewEntryPoints: this.countEntryPoints(graph) <= 3,
      mainEntryPoint: this.findMainEntryPoint(graph),
      hasCycles: this.detectCycles(graph)
    };
  }
}
```

#### 布局儲存格式

**visualizations/layout.json**：
```json
{
  "version": "1.0",
  "graphId": "hello-world-call-graph",
  "graphType": "call-graph",
  "lastModified": "2025-10-20T15:30:00Z",

  "algorithm": {
    "type": "hierarchical",
    "auto": false,
    "params": {
      "direction": "TB",
      "levelSeparation": 100,
      "nodeSeparation": 50
    }
  },

  "nodes": {
    "main": {
      "x": 200,
      "y": 100,
      "collapsed": false,
      "pinned": true
    },
    "printf": {
      "x": 200,
      "y": 250,
      "collapsed": false,
      "pinned": false
    },
    "stdio": {
      "x": 50,
      "y": 250,
      "collapsed": true,
      "pinned": false
    }
  },

  "viewport": {
    "zoom": 1.5,
    "centerX": 200,
    "centerY": 200,
    "rotation": 0
  },

  "userPreferences": {
    "autoLayout": false,
    "edgeStyle": "curved",
    "nodeSpacing": 100,
    "showLabels": true,
    "showMinimap": true
  }
}
```

#### UI 設計

**布局控制面板**：
```
┌─────────────────────────────────────────────────┐
│ 📊 Call Graph - main.c                         │
├─────────────────────────────────────────────────┤
│ 布局演算法: [Hierarchical (階層式) ▼]          │
│                                                 │
│ 💡 系統推薦: Hierarchical                      │
│    呼叫層級清楚且深度適中，階層式布局最佳      │
│    信心度: 90%                                  │
│                                                 │
│ 其他選項:                                       │
│   ○ Force-Directed (適合複雜互相呼叫) 80%     │
│   ○ Radial (以入口點為中心輻射) 75%           │
│   ○ Circular (圓形排列) 60%                   │
│                                                 │
│ ⚙️ 進階參數 ▼                                  │
│   方向: [由上到下 ▼]                           │
│   層級間距: [100] px                           │
│   節點間距: [50] px                            │
│   最小化邊交叉: [✓]                            │
│                                                 │
│ [套用] [重設為推薦] [儲存為預設]               │
│                                                 │
│ 互動模式: 🔒 唯讀 + 可調整布局                 │
│ [儲存當前布局] [恢復自動布局]                   │
└─────────────────────────────────────────────────┘
```

**節點右鍵選單**（根據圖譜類型動態調整）：
```
Call Graph:
  - 📋 查看節點詳情
  - 🔍 高亮此節點的所有呼叫
  - 📍 固定位置 (Pin)
  - 📂 摺疊/展開
  - ❌ 無法刪除（唯讀）

Dependency Graph:
  - 📋 查看模組詳情
  - ➕ 新增依賴
  - ➖ 移除依賴
  - 🔍 檢查循環依賴
  - 📍 固定位置
```

### 圖譜生成策略

#### 從文字生成圖譜

```typescript
class SequenceToTopologyTransformer {
  async transform(code: string, language: string): Promise<Graph> {
    // 1. 解析 AST
    const ast = this.parseCode(code, language);

    // 2. 提取節點
    const nodes = this.extractNodes(ast, {
      functions: true,
      variables: true,
      types: true
    });

    // 3. 分析關係
    const edges = this.analyzeRelations(ast, nodes, {
      callGraph: true,
      dataFlow: true,
      dependencies: true,
      controlFlow: false  // 可選
    });

    // 4. 建構圖譜
    return new Graph(nodes, edges);
  }

  extractNodes(ast, options) {
    const nodes = [];

    // 遍歷 AST
    traverse(ast, {
      FunctionDeclaration(path) {
        if (options.functions) {
          nodes.push({
            id: generateId(),
            type: 'function',
            label: path.node.name,
            properties: extractFunctionProps(path.node)
          });
        }
      },
      VariableDeclaration(path) {
        if (options.variables) {
          // ... 提取變數
        }
      }
    });

    return nodes;
  }

  analyzeRelations(ast, nodes, options) {
    const edges = [];

    if (options.callGraph) {
      edges.push(...this.buildCallGraph(ast, nodes));
    }

    if (options.dataFlow) {
      edges.push(...this.traceDataFlow(ast, nodes));
    }

    if (options.dependencies) {
      edges.push(...this.analyzeDependencies(ast, nodes));
    }

    return edges;
  }
}
```

#### 從圖譜生成文字

```typescript
class TopologyToSequenceTransformer {
  async transform(graph: Graph, language: string, strategy: string): Promise<string> {
    switch (strategy) {
      case 'topological-sort':
        return this.topologicalSort(graph, language);

      case 'inline-expansion':
        return this.inlineExpansion(graph, language);

      case 'modular-decomposition':
        return this.modularDecomposition(graph, language);

      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  /**
   * 拓撲排序：按依賴順序生成程式碼
   */
  topologicalSort(graph: Graph, language: string): string {
    // 1. 拓撲排序節點
    const sorted = graph.topologicalSort();

    // 2. 依序生成每個節點的程式碼
    const codeBlocks = sorted.map(node => {
      return this.generateNodeCode(node, language);
    });

    // 3. 組合成完整程式
    return this.assembleCode(codeBlocks, language);
  }

  /**
   * 內聯展開：將所有節點內聯到一個函式
   */
  inlineExpansion(graph: Graph, language: string): string {
    const entryNode = graph.getEntryPoint();
    return this.expandNodeRecursively(entryNode, graph, language);
  }

  /**
   * 模組化分解：保持模組結構
   */
  modularDecomposition(graph: Graph, language: string): string {
    // 識別模組邊界
    const modules = graph.identifyModules();

    // 為每個模組生成程式碼
    return modules.map(mod => {
      return this.generateModuleCode(mod, language);
    }).join('\n\n');
  }
}
```

---

## 轉換系統設計

### 轉換引擎架構

```typescript
/**
 * 多形態轉換引擎
 */
class PolyglotTransformationEngine {
  private transformers: Map<string, Transformer>;
  private pathRouter: PathRouter;
  private lossTracker: LossTracker;

  constructor() {
    this.initializeTransformers();
    this.pathRouter = new PathRouter();
    this.lossTracker = new LossTracker();
  }

  /**
   * 主轉換介面
   */
  async transform(
    input: FormData,
    targetForm: FormType,
    options: TransformOptions
  ): Promise<TransformResult> {
    // 1. 確定轉換路徑
    const path = this.pathRouter.selectPath(
      input.form,
      targetForm,
      options
    );

    // 2. 執行轉換
    let current = input;
    const losses = [];

    for (const step of path.steps) {
      const transformer = this.getTransformer(step);

      // 轉換前警告
      const warnings = transformer.getWarnings(current);
      if (warnings.length > 0 && !options.suppressWarnings) {
        await this.showWarnings(warnings);
      }

      // 執行轉換
      const result = await transformer.transform(current);

      // 記錄損失
      losses.push(...result.losses);
      current = result.output;
    }

    // 3. 返回結果
    return {
      output: current,
      losses: losses,
      confidence: path.confidence
    };
  }
}
```

### 路徑選擇器

```typescript
/**
 * 轉換路徑選擇器
 */
class PathRouter {
  /**
   * 選擇最佳轉換路徑
   */
  selectPath(
    from: FormType,
    to: FormType,
    options: TransformOptions
  ): TransformPath {
    // 1. 找出所有可能路徑
    const paths = this.findAllPaths(from, to);

    // 2. 評分
    const scored = paths.map(path => ({
      path,
      score: this.scorePath(path, options)
    }));

    // 3. 選擇最高分
    scored.sort((a, b) => b.score - a.score);

    return scored[0].path;
  }

  /**
   * 路徑評分
   */
  scorePath(path: TransformPath, options: TransformOptions): number {
    const weights = options.weights || {
      accuracy: 0.4,
      speed: 0.3,
      preservation: 0.3
    };

    const accuracy = this.calculateAccuracy(path);
    const speed = this.estimateSpeed(path);
    const preservation = this.calculatePreservation(path);

    return (
      accuracy * weights.accuracy +
      speed * weights.speed +
      preservation * weights.preservation
    );
  }

  /**
   * 計算準確度
   */
  calculateAccuracy(path: TransformPath): number {
    // 基於每個步驟的歷史準確率
    const stepAccuracies = path.steps.map(step =>
      this.getStepAccuracy(step)
    );

    // 連續準確率相乘
    return stepAccuracies.reduce((acc, val) => acc * val, 1.0);
  }

  /**
   * 計算資訊保留度
   */
  calculatePreservation(path: TransformPath): number {
    // 損失越多，保留度越低
    const totalLoss = path.steps.reduce((sum, step) =>
      sum + this.getStepLossRate(step), 0
    );

    return Math.exp(-totalLoss);  // 指數衰減
  }
}
```

### 損失追蹤器

```typescript
/**
 * 資訊損失追蹤器
 */
class LossTracker {
  private losses: Loss[] = [];

  /**
   * 記錄損失
   */
  recordLoss(loss: Loss): void {
    this.losses.push({
      ...loss,
      timestamp: Date.now()
    });
  }

  /**
   * 生成損失報告
   */
  generateReport(): LossReport {
    return {
      totalLosses: this.losses.length,
      byType: this.groupByType(this.losses),
      bySeverity: this.groupBySeverity(this.losses),
      recoverable: this.losses.filter(l => l.recoverable),
      critical: this.losses.filter(l => l.severity === 'critical')
    };
  }

  /**
   * 檢查是否可接受
   */
  isAcceptable(options: LossOptions): boolean {
    const critical = this.losses.filter(
      l => l.severity === 'critical'
    );

    if (critical.length > 0 && !options.allowCritical) {
      return false;
    }

    const totalLossRate = this.calculateTotalLossRate();
    return totalLossRate <= options.maxLossRate;
  }
}
```

### 轉換警告系統

```typescript
/**
 * 警告使用者資訊損失
 */
class WarningSystem {
  /**
   * 顯示轉換前警告
   */
  async showTransformWarnings(
    transformation: Transformation,
    input: FormData
  ): Promise<boolean> {
    const warnings = transformation.getWarnings(input);

    if (warnings.length === 0) {
      return true;  // 無警告，繼續
    }

    // 分類警告
    const critical = warnings.filter(w => w.severity === 'critical');
    const warnings = warnings.filter(w => w.severity === 'warning');
    const info = warnings.filter(w => w.severity === 'info');

    // 顯示警告對話框
    const message = this.formatWarnings({critical, warnings, info});

    // 詢問使用者是否繼續
    return await this.askUserConfirmation(message);
  }

  /**
   * 格式化警告訊息
   */
  formatWarnings(categorized: CategorizedWarnings): string {
    let message = '⚠️  轉換警告\n\n';

    if (categorized.critical.length > 0) {
      message += '🔴 **關鍵損失**（無法轉換）:\n';
      categorized.critical.forEach(w => {
        message += `  - ${w.feature}: ${w.message}\n`;
      });
      message += '\n';
    }

    if (categorized.warnings.length > 0) {
      message += '🟡 **警告**（可能遺失資訊）:\n';
      categorized.warnings.forEach(w => {
        message += `  - ${w.feature}: ${w.message}\n`;
      });
      message += '\n';
    }

    if (categorized.info.length > 0) {
      message += 'ℹ️  **資訊**（細節遺失）:\n';
      categorized.info.forEach(w => {
        message += `  - ${w.feature}: ${w.message}\n`;
      });
    }

    return message;
  }
}
```

### 收斂性分析

```typescript
/**
 * 分析轉換的收斂性
 */
class ConvergenceAnalyzer {
  /**
   * 執行多次迭代轉換，觀察收斂
   */
  async analyzeConvergence(
    initialCode: string,
    transformSequence: Transformation[],
    iterations: number = 10
  ): Promise<ConvergenceReport> {
    const states = [initialCode];
    const similarities = [];

    let current = initialCode;

    for (let i = 0; i < iterations; i++) {
      // 執行一輪轉換序列
      for (const transform of transformSequence) {
        current = await transform.execute(current);
      }

      states.push(current);

      // 計算與前一狀態的相似度
      const similarity = this.calculateSimilarity(
        states[states.length - 2],
        current
      );

      similarities.push(similarity);

      // 檢查是否收斂
      if (similarity > 0.99) {
        return {
          converged: true,
          iterations: i + 1,
          finalState: current,
          similarities: similarities
        };
      }
    }

    return {
      converged: false,
      iterations: iterations,
      finalState: current,
      similarities: similarities
    };
  }

  /**
   * 計算兩個程式的相似度
   */
  calculateSimilarity(code1: string, code2: string): number {
    // 使用多種指標
    const astSimilarity = this.compareAST(code1, code2);
    const textSimilarity = this.compareText(code1, code2);
    const semanticSimilarity = this.compareSemantic(code1, code2);

    // 加權平均
    return (
      astSimilarity * 0.5 +
      textSimilarity * 0.2 +
      semanticSimilarity * 0.3
    );
  }
}
```

---

## Transformation Assistant

> **概念來源**：受「伴侶蛋白（Chaperone Protein）」啟發——當蛋白質折疊過程複雜時，需要輔助蛋白引導正確折疊。同理，當程式形態轉換過於複雜時，需要 Transformation Assistant 輔助使用者完成轉換。

### 設計動機

在多形態轉換系統中，並非所有轉換都能完全自動化。以下情況需要**互動式輔助**：

#### 需要輔助的典型場景

**1. 語義模糊轉換**
```c
// C 程式碼
int* ptr = malloc(sizeof(int) * 10);
// ... 使用 ptr
free(ptr);
```

轉換至 Python 時面臨選擇：
- 選項 A：`ptr = [0] * 10`（使用 list）
- 選項 B：`ptr = array.array('i', [0] * 10)`（使用 array）
- 選項 C：`ptr = np.zeros(10, dtype=int)`（使用 NumPy）

**系統無法自動決定**，需要使用者根據**使用情境**選擇。

**2. 跨語言概念映射**
```c
// C 的指標運算
int arr[5] = {1, 2, 3, 4, 5};
int* p = arr + 2;  // 指向 arr[2]
printf("%d", *p);  // 輸出 3
```

轉換至 Python 時：
- 直譯：`p = id(arr) + 2 * sys.getsizeof(int)` ❌ **錯誤且危險**
- 語義轉換：`p = 2; print(arr[p])` ✅ **正確但失去指標概念**
- 解釋轉換：加入註解說明 ✅ **教學友善**

**3. 一對多映射**

某些 C 語言模式可映射到多種 Python 實現：

| C 模式 | Python 選項 | 適用場景 |
|--------|-------------|---------|
| `for(int i=0; i<n; i++)` | `for i in range(n)` | 一般情況 |
| | `for i, val in enumerate(lst)` | 需要同時取得索引和值 |
| | `[f(i) for i in range(n)]` | List comprehension |
| | `map(f, range(n))` | 函數式風格 |

**4. 結構損失與重構**

```c
// C 程式碼：使用 goto 實現狀態機
int state = 0;
loop:
    switch(state) {
        case 0: /* ... */ state = 1; goto loop;
        case 1: /* ... */ state = 2; goto loop;
        case 2: /* ... */ break;
    }
```

Python 沒有 `goto`，需要重構為：
- 選項 A：while + switch 模擬
- 選項 B：狀態機類別
- 選項 C：保留註解說明原始邏輯

---

### 助手角色定位

```typescript
/**
 * Transformation Assistant 的角色
 */
interface TransformationAssistant {
  /**
   * 角色一：決策建議者
   * 當系統遇到不確定的轉換選擇時，提供建議
   */
  suggestOptions(context: TransformContext): TransformOption[];

  /**
   * 角色二：轉換驗證者
   * 驗證使用者選擇的轉換是否語義正確
   */
  validateTransform(
    source: FormData,
    target: FormData,
    userChoice: TransformOption
  ): ValidationResult;

  /**
   * 角色三：知識提供者
   * 提供轉換相關的教學資訊
   */
  explainTransform(
    source: FormData,
    target: FormData,
    option: TransformOption
  ): Explanation;

  /**
   * 角色四：學習記錄者
   * 記住使用者的選擇偏好，減少未來詢問
   */
  learnPreference(
    context: TransformContext,
    userChoice: TransformOption
  ): void;
}
```

---

### 互動流程設計

#### 基本互動流程

```
使用者發起轉換（例：C → Python）
       ↓
系統嘗試自動轉換
       ↓
  遇到模糊情況 ──┐
       ↓          │
 信心度評估      │ 信心度 ≥ 0.9
       ↓          │ 直接轉換
 信心度 < 0.9 ←──┘
       ↓
啟動 Assistant
       ↓
┌────────────────┐
│ 展示轉換選項    │
│ - 選項 A (推薦) │
│ - 選項 B        │
│ - 選項 C        │
│ [查看說明]      │
└────────────────┘
       ↓
使用者選擇
       ↓
┌────────────────┐
│ 驗證選擇        │
│ - 語法檢查      │
│ - 語義檢查      │
│ - 風格一致性    │
└────────────────┘
       ↓
  驗證通過？
   /        \
 否          是
  ↓          ↓
顯示錯誤   記錄偏好
  ↓          ↓
重新選擇   完成轉換
```

#### 信心度計算

```typescript
interface ConfidenceScore {
  syntaxConfidence: number;      // 語法層面信心度 (0-1)
  semanticConfidence: number;    // 語義層面信心度 (0-1)
  patternConfidence: number;     // 模式匹配信心度 (0-1)
  historyConfidence: number;     // 歷史選擇信心度 (0-1)
}

class ConfidenceCalculator {
  calculate(context: TransformContext): number {
    const scores = {
      syntaxConfidence: this.calculateSyntaxConfidence(context),
      semanticConfidence: this.calculateSemanticConfidence(context),
      patternConfidence: this.calculatePatternConfidence(context),
      historyConfidence: this.calculateHistoryConfidence(context)
    };

    // 加權計算總信心度
    return (
      scores.syntaxConfidence * 0.2 +
      scores.semanticConfidence * 0.4 +
      scores.patternConfidence * 0.3 +
      scores.historyConfidence * 0.1
    );
  }

  /**
   * 語法信心度：語法樹是否完整匹配
   */
  calculateSyntaxConfidence(context: TransformContext): number {
    const { sourceAST, targetPattern } = context;
    return this.astMatcher.match(sourceAST, targetPattern).score;
  }

  /**
   * 語義信心度：語義等價性
   */
  calculateSemanticConfidence(context: TransformContext): number {
    const { sourceSemantics, targetSemantics } = context;
    return this.semanticAnalyzer.compareSemantics(
      sourceSemantics,
      targetSemantics
    );
  }

  /**
   * 模式信心度：已知模式匹配程度
   */
  calculatePatternConfidence(context: TransformContext): number {
    const knownPatterns = this.patternLibrary.findMatches(context.source);
    return knownPatterns.length > 0 ? knownPatterns[0].confidence : 0;
  }

  /**
   * 歷史信心度：使用者過去的選擇傾向
   */
  calculateHistoryConfidence(context: TransformContext): number {
    const history = this.preferenceStore.getHistory(context.pattern);
    if (history.length === 0) return 0;

    // 計算一致性
    const mostFrequent = this.findMostFrequent(history);
    return mostFrequent.frequency / history.length;
  }
}
```

---

### 轉換選項生成

```typescript
/**
 * 轉換選項生成器
 */
class TransformOptionGenerator {
  /**
   * 生成轉換選項
   */
  generateOptions(
    source: CodeSnippet,
    targetLang: string,
    context: TransformContext
  ): TransformOption[] {
    // 1. 從已知模式庫生成選項
    const patternOptions = this.generateFromPatterns(source, targetLang);

    // 2. 從轉換規則生成選項
    const ruleOptions = this.generateFromRules(source, targetLang);

    // 3. 合併並排序
    const allOptions = [...patternOptions, ...ruleOptions];

    // 4. 評分排序
    return this.rankOptions(allOptions, context);
  }

  /**
   * 從模式庫生成選項
   */
  private generateFromPatterns(
    source: CodeSnippet,
    targetLang: string
  ): TransformOption[] {
    const options: TransformOption[] = [];

    // 查找匹配的轉換模式
    const patterns = this.patternLibrary.findMatches(source);

    for (const pattern of patterns) {
      const variants = pattern.getVariants(targetLang);

      for (const variant of variants) {
        options.push({
          id: generateId(),
          name: variant.name,
          description: variant.description,
          targetCode: variant.generate(source),
          confidence: variant.confidence,
          pros: variant.advantages,
          cons: variant.disadvantages,
          useCases: variant.useCases,
          tags: variant.tags
        });
      }
    }

    return options;
  }

  /**
   * 選項排序
   */
  private rankOptions(
    options: TransformOption[],
    context: TransformContext
  ): TransformOption[] {
    return options
      .map(option => ({
        option,
        score: this.scoreOption(option, context)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.option);
  }

  /**
   * 選項評分
   */
  private scoreOption(
    option: TransformOption,
    context: TransformContext
  ): number {
    let score = option.confidence;

    // 考慮使用者歷史偏好
    const preference = this.preferenceStore.getPreference(
      context.pattern,
      option.id
    );
    if (preference) {
      score += preference.weight * 0.3;
    }

    // 考慮情境適用度
    const contextFit = this.evaluateContextFit(option, context);
    score += contextFit * 0.2;

    return score;
  }
}
```

#### 轉換選項資料結構

```typescript
interface TransformOption {
  id: string;
  name: string;                    // 選項名稱
  description: string;             // 簡短描述
  targetCode: string;              // 轉換後的程式碼
  confidence: number;              // 系統信心度 (0-1)

  // 選項評估
  pros: string[];                  // 優點
  cons: string[];                  // 缺點
  useCases: string[];              // 適用場景
  tags: string[];                  // 標籤（如 "pythonic", "performance"）

  // 轉換資訊
  informationLoss: InformationLoss;  // 資訊損失分析
  complexity: 'simple' | 'moderate' | 'complex';  // 複雜度

  // 學習輔助
  explanation?: string;            // 詳細說明
  references?: Reference[];        // 參考資料連結
}
```

---

### UI 設計

#### 助手面板設計

```
┌─────────────────────────────────────────────┐
│ 🤖 Transformation Assistant                 │
├─────────────────────────────────────────────┤
│                                             │
│ 偵測到複雜轉換：C 指標 → Python            │
│                                             │
│ 原始程式碼：                                │
│ ┌─────────────────────────────────────┐   │
│ │ int* ptr = malloc(sizeof(int) * 10);│   │
│ │ free(ptr);                          │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 請選擇轉換方式：                            │
│                                             │
│ ● 選項 A (推薦) 信心度: 85%                │
│   使用 Python list                          │
│   ┌─────────────────────────────────────┐ │
│   │ ptr = [0] * 10                      │ │
│   │ # 自動記憶體管理，無需手動釋放          │ │
│   └─────────────────────────────────────┘ │
│   ✅ 簡單直觀                               │
│   ✅ Python 慣用寫法                        │
│   ⚠️  效能略低於 array                      │
│                                             │
│ ○ 選項 B 信心度: 65%                       │
│   使用 array 模組                           │
│   ┌─────────────────────────────────────┐ │
│   │ import array                        │ │
│   │ ptr = array.array('i', [0] * 10)   │ │
│   └─────────────────────────────────────┘ │
│   ✅ 效能較好                               │
│   ✅ 型別固定                               │
│   ⚠️  需要額外 import                       │
│                                             │
│ ○ 選項 C 信心度: 70%                       │
│   使用 NumPy                                │
│   ┌─────────────────────────────────────┐ │
│   │ import numpy as np                  │ │
│   │ ptr = np.zeros(10, dtype=int)      │ │
│   └─────────────────────────────────────┘ │
│   ✅ 科學計算標準                           │
│   ✅ 功能強大                               │
│   ⚠️  需要安裝 NumPy                        │
│                                             │
│ [ 查看詳細說明 ]  [ 記住我的選擇 ]         │
│                                             │
│ [ 取消 ]  [ 確定 ]                          │
└─────────────────────────────────────────────┘
```

#### 漸進式揭露設計

對於**初學者**，預設顯示：
- ✅ 推薦選項（已標記）
- ✅ 轉換結果程式碼
- ✅ 簡要優缺點

點擊「查看詳細說明」後展開：
- 📊 信心度分析
- 🔬 語義差異說明
- 📚 相關教學資源連結
- 🧪 測試案例對比

對於**進階使用者**（可在設定中調整）：
- 預設展開所有資訊
- 顯示轉換規則細節
- 提供手動編輯選項程式碼

---

### 偏好學習系統

#### 偏好儲存結構

```typescript
interface UserPreference {
  userId: string;
  pattern: string;              // 轉換模式識別碼
  sourceLanguage: string;
  targetLanguage: string;

  // 偏好選項
  preferredOptionId: string;
  confidence: number;           // 偏好信心度 (0-1)

  // 使用情境
  context: {
    projectType?: string;       // 專案類型
    codeStyle?: string;         // 程式碼風格
    performancePriority?: boolean;  // 是否優先考慮效能
  };

  // 統計資訊
  useCount: number;             // 使用次數
  lastUsed: Date;
  createdAt: Date;
}
```

#### 偏好學習邏輯

```typescript
class PreferenceLearner {
  /**
   * 記錄使用者選擇
   */
  recordChoice(
    pattern: string,
    option: TransformOption,
    context: TransformContext
  ): void {
    const existing = this.preferenceStore.get(pattern);

    if (!existing) {
      // 首次選擇：建立新偏好
      this.preferenceStore.set(pattern, {
        pattern,
        preferredOptionId: option.id,
        confidence: 0.6,  // 初始信心度
        useCount: 1,
        lastUsed: new Date(),
        createdAt: new Date(),
        context: this.extractContext(context)
      });
    } else {
      // 更新現有偏好
      if (existing.preferredOptionId === option.id) {
        // 選擇一致：增加信心度
        existing.confidence = Math.min(1.0, existing.confidence + 0.1);
        existing.useCount++;
      } else {
        // 選擇不一致：檢查是否情境不同
        if (this.isContextSimilar(existing.context, context)) {
          // 情境相似但選擇不同：降低信心度
          existing.confidence *= 0.8;
        } else {
          // 情境不同：建立新的情境化偏好
          this.createContextualPreference(pattern, option, context);
        }
      }
      existing.lastUsed = new Date();
    }
  }

  /**
   * 取得推薦選項
   */
  getRecommendation(
    pattern: string,
    context: TransformContext
  ): TransformOption | null {
    const preferences = this.preferenceStore.getAll(pattern);

    // 找最匹配的情境偏好
    const matchedPref = preferences
      .filter(pref => this.isContextSimilar(pref.context, context))
      .sort((a, b) => {
        // 優先考慮信心度和使用次數
        const scoreA = a.confidence * 0.7 + (a.useCount / 100) * 0.3;
        const scoreB = b.confidence * 0.7 + (b.useCount / 100) * 0.3;
        return scoreB - scoreA;
      })[0];

    return matchedPref ? this.getOptionById(matchedPref.preferredOptionId) : null;
  }

  /**
   * 情境相似度判斷
   */
  private isContextSimilar(
    ctx1: TransformContext,
    ctx2: TransformContext
  ): boolean {
    // 簡單的相似度判斷
    return (
      ctx1.projectType === ctx2.projectType &&
      ctx1.codeStyle === ctx2.codeStyle &&
      ctx1.performancePriority === ctx2.performancePriority
    );
  }
}
```

---

### 驗證系統

```typescript
/**
 * 轉換驗證器
 */
class TransformValidator {
  /**
   * 驗證轉換結果
   */
  validate(
    source: CodeSnippet,
    target: CodeSnippet,
    option: TransformOption
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. 語法驗證
    const syntaxResult = this.validateSyntax(target);
    errors.push(...syntaxResult.errors);
    warnings.push(...syntaxResult.warnings);

    // 2. 語義驗證
    const semanticResult = this.validateSemantics(source, target);
    errors.push(...semanticResult.errors);
    warnings.push(...semanticResult.warnings);

    // 3. 風格驗證
    const styleResult = this.validateStyle(target);
    warnings.push(...styleResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 語法驗證
   */
  private validateSyntax(code: CodeSnippet): ValidationResult {
    try {
      const ast = this.parser.parse(code.content, code.language);
      return { valid: true, errors: [], warnings: [] };
    } catch (e) {
      return {
        valid: false,
        errors: [{
          type: 'syntax',
          message: e.message,
          location: e.location
        }],
        warnings: []
      };
    }
  }

  /**
   * 語義驗證（基本檢查）
   */
  private validateSemantics(
    source: CodeSnippet,
    target: CodeSnippet
  ): ValidationResult {
    const warnings: ValidationWarning[] = [];

    // 檢查變數名稱是否保持一致
    const sourceVars = this.extractVariables(source);
    const targetVars = this.extractVariables(target);

    for (const varName of sourceVars) {
      if (!targetVars.includes(varName)) {
        warnings.push({
          type: 'semantic',
          message: `變數 '${varName}' 在轉換後消失`,
          severity: 'medium'
        });
      }
    }

    // 檢查控制流結構
    const sourceStructures = this.extractControlStructures(source);
    const targetStructures = this.extractControlStructures(target);

    if (sourceStructures.length !== targetStructures.length) {
      warnings.push({
        type: 'semantic',
        message: '控制流結構數量改變，請確認邏輯正確',
        severity: 'high'
      });
    }

    return {
      valid: true,
      errors: [],
      warnings
    };
  }
}
```

---

### 知識庫設計

#### 轉換模式庫

```json
{
  "patterns": [
    {
      "id": "c-malloc-to-python",
      "name": "C malloc 轉 Python",
      "sourcePattern": {
        "language": "c",
        "astPattern": {
          "type": "VariableDeclaration",
          "init": {
            "type": "CallExpression",
            "callee": { "name": "malloc" }
          }
        }
      },
      "targetVariants": [
        {
          "language": "python",
          "variantId": "list",
          "name": "使用 list",
          "confidence": 0.85,
          "template": "{{varName}} = [{{initValue}}] * {{size}}",
          "advantages": ["簡單", "Python 慣用"],
          "disadvantages": ["效能略低"],
          "useCases": ["一般用途", "初學者"],
          "tags": ["pythonic", "beginner-friendly"]
        },
        {
          "language": "python",
          "variantId": "array",
          "name": "使用 array",
          "confidence": 0.65,
          "template": "import array\n{{varName}} = array.array('{{type}}', [{{initValue}}] * {{size}})",
          "advantages": ["效能較好", "型別固定"],
          "disadvantages": ["需要 import"],
          "useCases": ["效能敏感", "大量數值運算"],
          "tags": ["performance"]
        },
        {
          "language": "python",
          "variantId": "numpy",
          "name": "使用 NumPy",
          "confidence": 0.70,
          "template": "import numpy as np\n{{varName}} = np.zeros({{size}}, dtype={{type}})",
          "advantages": ["科學計算標準", "功能強大"],
          "disadvantages": ["需要安裝 NumPy"],
          "useCases": ["科學計算", "數據分析"],
          "tags": ["scientific", "data-science"]
        }
      ]
    },
    {
      "id": "c-for-loop-to-python",
      "name": "C for 迴圈轉 Python",
      "sourcePattern": {
        "language": "c",
        "astPattern": {
          "type": "ForStatement",
          "init": { "type": "VariableDeclaration" },
          "test": { "type": "BinaryExpression", "operator": "<" },
          "update": { "type": "UpdateExpression", "operator": "++" }
        }
      },
      "targetVariants": [
        {
          "language": "python",
          "variantId": "range",
          "name": "使用 range()",
          "confidence": 0.9,
          "template": "for {{var}} in range({{start}}, {{end}}):\n    {{body}}",
          "advantages": ["簡潔", "Pythonic"],
          "disadvantages": [],
          "useCases": ["一般迴圈"],
          "tags": ["pythonic"]
        },
        {
          "language": "python",
          "variantId": "enumerate",
          "name": "使用 enumerate()",
          "confidence": 0.75,
          "template": "for {{var}}, {{value}} in enumerate({{iterable}}):\n    {{body}}",
          "advantages": ["同時取得索引和值"],
          "disadvantages": ["需要可迭代物件"],
          "useCases": ["遍歷 list 且需要索引"],
          "tags": ["pythonic"]
        },
        {
          "language": "python",
          "variantId": "comprehension",
          "name": "List Comprehension",
          "confidence": 0.8,
          "template": "[{{expression}} for {{var}} in range({{start}}, {{end}})]",
          "advantages": ["簡潔", "效能好"],
          "disadvantages": ["僅適用於生成 list"],
          "useCases": ["建立新 list"],
          "tags": ["pythonic", "functional"]
        }
      ]
    }
  ]
}
```

---

### 與其他系統的整合

```typescript
/**
 * Assistant 與轉換引擎的整合
 */
class IntegratedTransformationEngine {
  private engine: PolyglotTransformationEngine;
  private assistant: TransformationAssistant;

  async transform(
    input: FormData,
    targetForm: FormType,
    options: TransformOptions
  ): Promise<TransformResult> {
    // 1. 嘗試自動轉換
    const result = await this.engine.transform(input, targetForm, {
      ...options,
      returnConfidence: true
    });

    // 2. 檢查信心度
    if (result.confidence < 0.9 && !options.autoAccept) {
      // 信心度不足，啟動助手
      const assistedResult = await this.assistant.assist({
        source: input,
        target: result.output,
        options: result.options,
        confidence: result.confidence,
        context: this.buildContext(input, targetForm)
      });

      return assistedResult;
    }

    // 3. 信心度足夠，直接返回
    return result;
  }
}
```

---

### 待討論問題

1. **助手觸發時機**
   - 信心度閾值設定為 0.9 是否合適？
   - 是否提供「總是詢問」或「從不詢問」的設定選項？

2. **偏好學習範圍**
   - 偏好是全局的還是每個專案獨立？
   - 是否需要支援匯入/匯出偏好設定？

3. **選項數量上限**
   - 最多顯示幾個轉換選項？（建議 3-5 個）
   - 如何處理超過上限的選項？

4. **驗證程度**
   - 語義驗證的深度？（目前僅基本檢查）
   - 是否需要執行測試來驗證等價性？

5. **教學模式**
   - 是否需要「教學模式」，詳細解釋每個選擇？
   - 是否提供「快速模式」，僅顯示推薦選項？

---

## 跨語言支援

### 透過積木的語言互轉

**流程**：
```
C 程式碼
   ↓ [parsing + structuring]
通用積木表示
   ↓ [Python generator]
Python 程式碼
```

**範例**：

輸入 (C):
```c
for(int i = 0; i < 10; i++) {
    printf("%d\n", i);
}
```

↓ 結構化

積木表示:
```blockly
[universal_for_loop]
  iterator: i
  start: 0
  end: 9
  body:
    [universal_print]
      format: "%d\n"
      values: [i]
```

↓ Python 生成

輸出 (Python):
```python
for i in range(0, 10):
    print(i)
```

### 語言特性映射表

#### 可轉換特性

| 特性 | C | Python | JavaScript | 策略 |
|------|---|--------|------------|------|
| for 迴圈 | ✓ | ✓ | ✓ | 通用積木 |
| if-else | ✓ | ✓ | ✓ | 通用積木 |
| 函式定義 | ✓ | ✓ | ✓ | 通用積木 |
| 陣列/列表 | ✓ | ✓ | ✓ | 通用積木 |

#### 不可直接轉換特性

| 特性 | 語言 | 替代方案 |
|------|------|----------|
| 指標 | C | Python: 物件引用<br>JS: 無直接等價 |
| 列表推導 | Python | C: for 迴圈<br>JS: map/filter |
| async/await | JS, Python | C: 無直接等價（多執行緒） |
| 巨集 | C | Python: 裝飾器<br>JS: 無等價 |

### 跨語言轉換範例

#### 範例 1: Hello World (C → Python)

**輸入 (C)**:
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

**轉換過程**:
```
1. Parse C code → AST
2. Match pattern → "hello_world_program" template
3. Structure → Universal blocks:
   [program_entry]
     [print] "Hello, World!"
4. Serialize to Python → Python generator
```

**輸出 (Python)**:
```python
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
```

#### 範例 2: Bubble Sort (C → JavaScript)

**輸入 (C)**:
```c
void bubble_sort(int arr[], int n) {
    for(int i = 0; i < n-1; i++) {
        for(int j = 0; j < n-i-1; j++) {
            if(arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}
```

**積木表示**:
```blockly
[function] bubble_sort(arr, n)
  [for] i from 0 to n-2
    [for] j from 0 to n-i-2
      [if] arr[j] > arr[j+1]
        [swap] arr[j], arr[j+1]
```

**輸出 (JavaScript)**:
```javascript
function bubbleSort(arr) {
    const n = arr.length;
    for(let i = 0; i < n-1; i++) {
        for(let j = 0; j < n-i-1; j++) {
            if(arr[j] > arr[j+1]) {
                [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
            }
        }
    }
}
```

---

## 對應關係管理系統

> **核心挑戰**：如何維護 Sequence ↔ Structure ↔ Topology 之間的對應關係，確保一致性與可追溯性？

### 設計動機

在多形態系統中，同一份程式邏輯可以有三種表示形式：

```
C 程式碼 (Sequence)
    ↕ 對應
通用積木 (Structure)
    ↕ 對應
呼叫圖 (Topology)
```

**關鍵問題**：
1. 如何記錄這些對應關係？
2. 如何確保對應關係的一致性？
3. 當一個形態改變時，如何更新其他形態？
4. 如何處理一對多或多對一的映射？

---

### 對應關係類型

#### 1. Template ↔ Block 對應

**一對一映射（理想情況）**

```
templates/high-level/c/basics/hello-world/
  ├── meta.json       # 知識單元元資料
  ├── sequence.c      # Sequence Form
  ├── structure.xml   # Structure Form (一對一對應)
  └── topology.json   # Topology Form
```

**記錄方式** - 在 meta.json 中記錄：
```json
{
  "id": "c-hello-world",
  "name": "Hello World",
  "language": "c",
  "mappings": {
    "structure": {
      "type": "universal",
      "path": "complete-programs/hello-world",
      "confidence": 1.0,
      "bidirectional": true
    }
  }
}
```

**一對多映射（常見情況）**

同一個 Sequence Form 可能對應多種 Structure Form 變體：

```
templates/high-level/c/control/for-loop/
  ├── meta.json           # 記錄多種 Structure 變體
  ├── sequence.c          # Sequence Form (同一份程式碼)
  ├── structure-basic.xml         # Structure 變體 1: 基本迴圈
  ├── structure-with-array.xml    # Structure 變體 2: 陣列走訪
  ├── structure-nested.xml        # Structure 變體 3: 巢狀迴圈
  └── topology.json       # Topology Form
```

**記錄方式** - 在 meta.json 中記錄：
```json
{
  "id": "c-for-loop",
  "forms": {
    "sequence": {
      "main": "sequence.c"
    },
    "structure": {
      "variants": [
        {
          "file": "structure-basic.xml",
          "description": "基本迴圈",
          "confidence": 0.9,
          "conditions": ["simple iteration", "no nesting"]
        },
        {
          "file": "structure-with-array.xml",
          "description": "陣列走訪",
          "confidence": 0.85,
          "conditions": ["array traversal"]
        },
        {
          "file": "structure-nested.xml",
          "description": "巢狀迴圈",
          "confidence": 0.7,
          "conditions": ["nested loops"]
        }
      ]
    },
    "topology": {
      "graphs": ["topology.json"]
    }
  }
}
```

#### 2. Block ↔ Topology 對應

**Structure → Topology** 的對應通常是**一對多**：

```
templates/high-level/c/projects/student-management/
  ├── meta.json
  ├── sequence.c          # Sequence Form
  ├── structure.xml       # Structure Form
  └── topology.json       # Topology Form (包含多種圖譜類型)
```

**記錄方式** - 在 meta.json 和 topology.json 中：

meta.json:
```json
{
  "id": "student-management-system",
  "forms": {
    "sequence": {
      "main": "sequence.c"
    },
    "structure": {
      "workspace": "structure.xml"
    },
    "topology": {
      "graphs": ["topology.json"],
      "types": ["call-graph", "data-flow", "dependency-graph"]
    }
  }
}
```

topology.json:
```json
{
  "version": "3.0",
  "graphs": [
    {
      "type": "call-graph",
      "autoGenerated": true,
      "sourceForm": "sequence",
      "nodes": [...],
      "edges": [...]
    },
    {
      "type": "data-flow",
      "autoGenerated": true,
      "sourceForm": "structure",
      "nodes": [...],
      "edges": [...]
    },
    {
      "type": "dependency-graph",
      "autoGenerated": false,
      "nodes": [...],
      "edges": [...]
    }
  ]
}
```

#### 3. Sequence ↔ Topology 直接對應

**跳過中間形態** 的直接轉換：

```
C 程式碼 ─────→ 呼叫圖
        (直接分析 AST)
```

**記錄方式** - 自動生成時記錄於圖譜的 metadata：
```json
{
  "graphId": "call-graph-xyz",
  "graphType": "call-graph",
  "source": {
    "form": "sequence",
    "language": "c",
    "templatePath": "c/10-advanced/templates/student-management",
    "generatedAt": "2025-10-20T10:30:00Z",
    "generationMethod": "ast-analysis"
  }
}
```

---

### 對應關係索引系統

#### 全局索引檔案

**位置**: `forms/_index/mappings.json`

**結構**:
```json
{
  "version": "1.0",
  "lastUpdated": "2025-10-20T10:30:00Z",
  "mappings": {
    "sequence-to-structure": [
      {
        "sequenceId": "c-hello-world",
        "sequencePath": "sequence/c/01-basic/templates/hello-world",
        "structureId": "universal-hello-world",
        "structurePath": "structure/universal/complete-programs/hello-world",
        "mappingType": "one-to-one",
        "confidence": 1.0,
        "verified": true,
        "lastVerified": "2025-10-20"
      },
      {
        "sequenceId": "c-for-loop",
        "sequencePath": "sequence/c/02-control/templates/for-loop",
        "mappingType": "one-to-many",
        "targets": [
          {
            "structureId": "universal-for-basic",
            "structurePath": "structure/universal/loops/for-basic",
            "confidence": 0.9,
            "conditions": ["simple iteration"]
          },
          {
            "structureId": "universal-for-array",
            "structurePath": "structure/universal/loops/for-with-array",
            "confidence": 0.85,
            "conditions": ["array traversal"]
          }
        ]
      }
    ],
    "structure-to-topology": [
      {
        "structureId": "universal-hello-world",
        "structurePath": "structure/universal/complete-programs/hello-world",
        "mappingType": "one-to-many",
        "targets": [
          {
            "topologyType": "call-graph",
            "topologyPath": "topology/call-graph/hello-world.json",
            "autoGenerated": true
          },
          {
            "topologyType": "control-flow",
            "topologyPath": "topology/control-flow/hello-world.json",
            "autoGenerated": true
          }
        ]
      }
    ],
    "sequence-to-topology": [
      {
        "sequenceId": "c-student-management",
        "sequencePath": "sequence/c/10-advanced/templates/student-management",
        "topologyType": "call-graph",
        "topologyPath": "topology/call-graph/student-management.json",
        "directMapping": true,
        "method": "ast-analysis"
      }
    ]
  },
  "statistics": {
    "totalSequenceTemplates": 150,
    "totalStructureBlocks": 200,
    "totalTopologyGraphs": 50,
    "verifiedMappings": 120,
    "pendingMappings": 30
  }
}
```

---

### 對應關係驗證

#### 驗證流程

```typescript
/**
 * 對應關係驗證器
 */
class MappingValidator {
  /**
   * 驗證 Sequence → Structure 對應
   */
  async validateSequenceToStructure(
    sequencePath: string,
    structurePath: string
  ): Promise<ValidationResult> {
    // 1. 載入兩邊的資料
    const template = await this.loadTemplate(sequencePath);
    const block = await this.loadBlock(structurePath);

    // 2. 進行雙向轉換測試
    const structureFromSequence = await this.transformToStructure(template);
    const sequenceFromStructure = await this.transformToSequence(block);

    // 3. 比較結果
    const forwardMatch = this.compareStructures(
      structureFromSequence,
      block
    );
    const backwardMatch = this.compareSequences(
      sequenceFromStructure,
      template
    );

    // 4. 計算信心度
    const confidence = (forwardMatch.similarity + backwardMatch.similarity) / 2;

    return {
      valid: confidence > 0.8,
      confidence,
      forwardMatch,
      backwardMatch,
      issues: this.identifyIssues(forwardMatch, backwardMatch)
    };
  }

  /**
   * 結構比較（忽略格式差異）
   */
  private compareStructures(
    structure1: Structure,
    structure2: Structure
  ): ComparisonResult {
    const ast1 = this.structureToAST(structure1);
    const ast2 = this.structureToAST(structure2);

    return {
      similarity: this.calculateASTSimilarity(ast1, ast2),
      differences: this.findASTDifferences(ast1, ast2)
    };
  }

  /**
   * 序列比較（語義層面）
   */
  private compareSequences(
    seq1: string,
    seq2: string
  ): ComparisonResult {
    // 忽略格式差異，比較語義
    const semantics1 = this.extractSemantics(seq1);
    const semantics2 = this.extractSemantics(seq2);

    return {
      similarity: this.calculateSemanticSimilarity(semantics1, semantics2),
      differences: this.findSemanticDifferences(semantics1, semantics2)
    };
  }

  /**
   * 識別問題
   */
  private identifyIssues(
    forwardMatch: ComparisonResult,
    backwardMatch: ComparisonResult
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (forwardMatch.similarity < 0.9) {
      issues.push({
        type: 'forward-transformation',
        severity: 'medium',
        message: 'Sequence → Structure 轉換損失過大',
        details: forwardMatch.differences
      });
    }

    if (backwardMatch.similarity < 0.9) {
      issues.push({
        type: 'backward-transformation',
        severity: 'medium',
        message: 'Structure → Sequence 轉換損失過大',
        details: backwardMatch.differences
      });
    }

    return issues;
  }
}
```

#### 自動驗證排程

```typescript
/**
 * 定期驗證排程器
 */
class ValidationScheduler {
  /**
   * 每週驗證所有對應關係
   */
  async scheduleWeeklyValidation() {
    const mappings = await this.loadAllMappings();

    for (const mapping of mappings) {
      const result = await this.validator.validate(mapping);

      if (!result.valid) {
        // 記錄驗證失敗
        await this.reportValidationFailure(mapping, result);

        // 降低信心度
        mapping.confidence *= 0.8;
        mapping.verified = false;
      } else {
        // 更新驗證狀態
        mapping.verified = true;
        mapping.lastVerified = new Date();
      }
    }

    // 儲存更新後的對應關係
    await this.saveMappings(mappings);

    // 生成驗證報告
    await this.generateValidationReport();
  }
}
```

---

### 對應關係同步機制

#### 單向同步策略

**場景 1：使用者修改 Sequence（文字模板）**

```
1. 使用者編輯 templates/high-level/c/control/for-loop/sequence.c
       ↓
2. 檔案監控器偵測到變更
       ↓
3. 查詢 meta.json 中的 forms 配置
       ↓
4. 找到對應的 Structure Forms: structure-basic.xml, structure-with-array.xml
       ↓
5. 提示使用者：
   ┌─────────────────────────────────────┐
   │ 偵測到對應的積木已過期              │
   │ - sequence.c 已修改                 │
   │ - 積木檔案可能需要更新：            │
   │   • structure-basic.xml             │
   │   • structure-with-array.xml        │
   │                                     │
   │ [ 自動更新 ] [ 稍後處理 ] [ 取消對應 ] │
   └─────────────────────────────────────┘
       ↓
6a. 若選擇「自動更新」：
    - 執行 Sequence → Structure 轉換
    - 更新對應的 structure-*.xml 檔案
    - 標記為「需要人工檢查」

6b. 若選擇「稍後處理」：
    - 標記對應關係為「out-of-sync」
    - 降低信心度
    - 加入待同步清單

6c. 若選擇「取消對應」：
    - 移除對應關係
    - 在索引中標記為「已取消」
```

**場景 2：使用者修改 Structure（積木）**

```
1. 使用者在 Blockly Editor 中修改積木
       ↓
2. 編輯器保存 structure.xml（生成新版本 structure-v2.xml）
       ↓
3. 查詢 meta.json 中的 forms 配置
       ↓
4. 找到對應的 Sequence Form (sequence.c)
       ↓
5. 提示使用者：
   ┌─────────────────────────────────────┐
   │ 積木已修改                          │
   │ - 檢測到與以下模板的對應：          │
   │   - C for-loop 模板                 │
   │   - Python for-loop 模板            │
   │                                     │
   │ 是否同步更新對應模板？              │
   │ [ 全部更新 ] [ 選擇性更新 ] [ 不更新 ] │
   └─────────────────────────────────────┘
       ↓
6. 若選擇更新：
   - 執行 Structure → Sequence 轉換
   - 生成新程式碼
   - 顯示 diff 供使用者確認
```

#### 雙向同步協調

```typescript
/**
 * 雙向同步協調器
 */
class BidirectionalSyncCoordinator {
  /**
   * 處理衝突的修改
   */
  async handleConflictingChanges(
    mapping: Mapping,
    sequenceChange: Change,
    structureChange: Change
  ): Promise<SyncResult> {
    // 1. 檢測衝突
    const conflict = this.detectConflict(sequenceChange, structureChange);

    if (!conflict) {
      // 無衝突，分別套用
      return this.applyBothChanges(sequenceChange, structureChange);
    }

    // 2. 有衝突，需要使用者介入
    const userChoice = await this.promptUserResolution({
      sequenceChange,
      structureChange,
      conflict
    });

    switch (userChoice) {
      case 'keep-sequence':
        // 保留 Sequence 變更，同步到 Structure
        return this.syncSequenceToStructure(mapping, sequenceChange);

      case 'keep-structure':
        // 保留 Structure 變更,同步到 Sequence
        return this.syncStructureToSequence(mapping, structureChange);

      case 'merge':
        // 嘗試合併兩邊的變更
        return this.mergeChanges(mapping, sequenceChange, structureChange);

      case 'keep-both':
        // 解除對應關係，保留兩邊獨立版本
        return this.unlinkMapping(mapping);
    }
  }

  /**
   * 提示使用者解決衝突
   */
  private async promptUserResolution(
    context: ConflictContext
  ): Promise<ResolutionChoice> {
    // 顯示衝突解決 UI
    return showConflictResolutionDialog({
      title: '同步衝突',
      message: '偵測到 Sequence 與 Structure 同時被修改',
      sequenceChanges: context.sequenceChange.diff,
      structureChanges: context.structureChange.diff,
      options: [
        {
          value: 'keep-sequence',
          label: '使用文字版本',
          description: '以文字模板為準，更新積木'
        },
        {
          value: 'keep-structure',
          label: '使用積木版本',
          description: '以積木為準，更新文字模板'
        },
        {
          value: 'merge',
          label: '嘗試合併',
          description: '系統嘗試合併兩邊的變更（可能失敗）'
        },
        {
          value: 'keep-both',
          label: '保留兩邊',
          description: '解除對應關係，維持兩個獨立版本'
        }
      ]
    });
  }
}
```

---

### 對應關係推薦系統

#### 自動推薦流程

當建立新的 Template 或 Block 時，系統自動推薦可能的對應：

```typescript
/**
 * 對應關係推薦引擎
 */
class MappingRecommender {
  /**
   * 為新建立的 Sequence template 推薦對應的 Structure
   */
  async recommendStructureForSequence(
    templatePath: string
  ): Promise<MappingRecommendation[]> {
    // 1. 載入模板
    const template = await this.loadTemplate(templatePath);

    // 2. 分析 AST
    const ast = this.parseCode(template.code, template.language);

    // 3. 提取特徵
    const features = this.extractFeatures(ast);

    // 4. 在 Structure 庫中搜尋相似積木
    const candidates = await this.searchSimilarBlocks(features);

    // 5. 計算相似度並排序
    const recommendations = candidates
      .map(candidate => ({
        structurePath: candidate.path,
        confidence: this.calculateSimilarity(ast, candidate.ast),
        reasons: this.explainSimilarity(ast, candidate.ast),
        preview: this.generatePreview(candidate)
      }))
      .filter(rec => rec.confidence > 0.6)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return recommendations;
  }

  /**
   * 特徵提取
   */
  private extractFeatures(ast: AST): Features {
    return {
      // 結構特徵
      nodeCount: this.countNodes(ast),
      depth: this.calculateDepth(ast),
      controlStructures: this.extractControlStructures(ast),

      // 語義特徵
      operations: this.extractOperations(ast),
      dataFlow: this.analyzeDataFlow(ast),

      // 模式特徵
      patterns: this.matchKnownPatterns(ast)
    };
  }

  /**
   * 相似度計算
   */
  private calculateSimilarity(ast1: AST, ast2: AST): number {
    // 結構相似度 (0-1)
    const structuralSim = this.compareStructure(ast1, ast2);

    // 語義相似度 (0-1)
    const semanticSim = this.compareSemantics(ast1, ast2);

    // 模式相似度 (0-1)
    const patternSim = this.comparePatterns(ast1, ast2);

    // 加權平均
    return (
      structuralSim * 0.4 +
      semanticSim * 0.4 +
      patternSim * 0.2
    );
  }
}
```

#### 推薦 UI

```
┌─────────────────────────────────────────────┐
│ 🔗 對應關係推薦                             │
├─────────────────────────────────────────────┤
│                                             │
│ 偵測到新的 C 模板：for-loop                 │
│ 系統找到 3 個可能的對應積木：               │
│                                             │
│ 1. ✨ universal/loops/for-basic             │
│    信心度: 92%                              │
│    原因: 結構完全匹配，單層迴圈             │
│    [預覽] [建立對應]                        │
│                                             │
│ 2. universal/loops/for-with-array           │
│    信心度: 78%                              │
│    原因: 包含陣列操作，但本模板未使用       │
│    [預覽] [建立對應]                        │
│                                             │
│ 3. universal/loops/for-nested               │
│    信心度: 65%                              │
│    原因: 巢狀結構，但本模板為單層           │
│    [預覽] [建立對應]                        │
│                                             │
│ [ 全部忽略 ] [ 手動指定 ]                   │
└─────────────────────────────────────────────┘
```

---

### 對應關係查詢 API

```typescript
/**
 * 對應關係查詢服務
 */
class MappingQueryService {
  /**
   * 根據 Sequence 路徑查詢對應的 Structure
   */
  async findStructureBySequence(
    sequencePath: string
  ): Promise<StructureMapping[]> {
    const index = await this.loadMappingIndex();
    return index.mappings['sequence-to-structure']
      .filter(m => m.sequencePath === sequencePath);
  }

  /**
   * 根據 Structure 路徑查詢對應的 Sequence
   */
  async findSequenceByStructure(
    structurePath: string
  ): Promise<SequenceMapping[]> {
    const index = await this.loadMappingIndex();
    return index.mappings['sequence-to-structure']
      .filter(m => m.structurePath === structurePath);
  }

  /**
   * 查詢多跳路徑（例如 Sequence → Structure → Topology）
   */
  async findMultiHopPath(
    sourcePath: string,
    sourceForm: FormType,
    targetForm: FormType
  ): Promise<MappingPath[]> {
    const graph = await this.buildMappingGraph();
    return this.findPaths(graph, sourcePath, sourceForm, targetForm);
  }

  /**
   * 建立對應關係圖
   */
  private async buildMappingGraph(): Promise<MappingGraph> {
    const index = await this.loadMappingIndex();
    const graph = new MappingGraph();

    // 加入 Sequence → Structure 邊
    for (const mapping of index.mappings['sequence-to-structure']) {
      graph.addEdge(
        mapping.sequencePath,
        mapping.structurePath,
        mapping.confidence
      );
    }

    // 加入 Structure → Topology 邊
    for (const mapping of index.mappings['structure-to-topology']) {
      for (const target of mapping.targets) {
        graph.addEdge(
          mapping.structurePath,
          target.topologyPath,
          1.0  // 自動生成的圖譜，信心度固定為 1
        );
      }
    }

    // 加入直接的 Sequence → Topology 邊
    for (const mapping of index.mappings['sequence-to-topology']) {
      graph.addEdge(
        mapping.sequencePath,
        mapping.topologyPath,
        0.95  // 直接轉換，略低於 1
      );
    }

    return graph;
  }
}
```

---

### 待討論問題

1. **對應關係的粒度**
   - 是否只記錄頂層對應（模板 ↔ 積木）？
   - 還是也記錄細粒度對應（L2, L3）？

2. **信心度閾值**
   - 多少信心度以下視為「不可靠對應」？
   - 不可靠對應是否應該定期清理？

3. **同步策略**
   - 預設是「自動同步」還是「詢問使用者」？
   - 不同類型的修改是否應有不同策略？

4. **衝突解決**
   - 是否需要「三方合併」工具？
   - 如何處理無法自動合併的衝突？

5. **對應關係版本控制**
   - 對應關係的歷史是否需要保留？
   - 是否需要「回滾」功能？

---

## Template Registry

> **概念**：集中式模板註冊表，管理所有形態的模板/積木/圖譜，提供統一的查詢、版本控制、依賴管理介面。

### 設計動機

隨著系統規模擴大，需要一個**集中式管理系統**：

**面臨的問題**：
- 📦 模板分散在不同目錄，難以統一管理
- 🔍 查詢效率低（需要遍歷檔案系統）
- 🔗 依賴關係不明確
- 📊 缺乏統計和分析能力
- 🔄 版本管理混亂
- 🏷️ 標籤和分類不一致

**Registry 的價值**：
- ✅ 統一的元資料管理
- ✅ 快速查詢和檢索
- ✅ 依賴關係追蹤
- ✅ 版本控制和更新
- ✅ 統計和分析
- ✅ API 存取介面

---

### Registry 架構設計

#### 核心資料結構

```typescript
/**
 * Template Registry Entry
 * v3.0: 支援插件系統和多語言層級
 */
interface RegistryEntry {
  // 基本資訊
  id: string;                      // 唯一識別碼
  type: 'sequence' | 'structure' | 'topology';  // 形態類型
  path: string;                    // 檔案系統路徑
  name: string;                    // 顯示名稱
  description: string;             // 描述

  // 分類與標籤
  category: string;                // 分類（如 "loops", "algorithms"）
  tags: string[];                  // 標籤（如 "beginner", "advanced"）

  // v3.0: 語言層級支援
  languageLevel: {
    type: "natural" | "high-level" | "low-level" | "machine" | "hdl" | "physical";
    specific?: string;             // 具體語言（如 "python", "x86-asm", "verilog"）
  };
  granularity: "L0" | "L1" | "L2" | "L3";  // 粒度層級

  // 版本資訊
  version: string;                 // 版本號（語義化版本）
  createdAt: Date;                 // 建立時間
  updatedAt: Date;                 // 最後更新時間
  author: string;                  // 作者

  // 依賴關係
  dependencies: Dependency[];      // 依賴的其他模板
  usedBy: string[];                // 被哪些模板使用

  // 對應關係
  mappings: {
    sequence?: string[];           // 對應的 Sequence templates
    structure?: string[];          // 對應的 Structure blocks
    topology?: string[];           // 對應的 Topology graphs
  };

  // 統計資訊
  stats: {
    usageCount: number;            // 使用次數
    favoriteCount: number;         // 收藏次數
    lastUsed?: Date;               // 最後使用時間
  };

  // 品質指標
  quality: {
    verified: boolean;             // 是否已驗證
    rating: number;                // 評分 (0-5)
    reviews: number;               // 評論數
  };

  // 元資料（從原始 meta.json 載入）
  metadata: Record<string, any>;

  // v3.0: 插件系統支援
  plugins?: {
    installed: string[];           // 已安裝的插件名稱
    data: Record<string, any>;     // 插件提供的額外資料
  };
}

/**
 * 依賴關係
 */
interface Dependency {
  id: string;                      // 依賴的模板 ID
  type: 'required' | 'optional';   // 依賴類型
  version: string;                 // 版本要求（如 "^1.0.0"）
  reason?: string;                 // 依賴原因
}
```

#### Registry 檔案結構

```
forms/_registry/
├── registry.db                    # 主要資料庫（SQLite）
├── index.json                     # 快速查詢索引
├── cache/                         # 快取
│   ├── by-language/
│   ├── by-category/
│   └── by-tag/
└── backups/                       # 備份
    ├── 2025-10-20.db
    └── 2025-10-19.db
```

---

### Registry 核心功能

#### 1. 註冊與索引

```typescript
/**
 * Template Registry 管理器
 * v3.0: 支援插件系統
 */
class TemplateRegistry {
  private db: Database;
  private cache: Cache;
  private pluginManager: PluginManager;  // v3.0: 插件管理器

  /**
   * 註冊新模板
   * v3.0: 支援插件生命週期鉤子
   */
  async register(entry: RegistryEntry): Promise<void> {
    // 1. 驗證唯一性
    if (await this.exists(entry.id)) {
      throw new Error(`Template ${entry.id} already registered`);
    }

    // 2. 驗證依賴
    await this.validateDependencies(entry.dependencies);

    // v3.0: 3. 觸發插件的 onLoad 鉤子
    if (entry.plugins?.installed) {
      for (const pluginName of entry.plugins.installed) {
        const plugin = this.pluginManager.getPlugin(pluginName);
        if (plugin?.onLoad) {
          await plugin.onLoad(entry);
        }
      }
    }

    // 4. 寫入資料庫
    await this.db.insert('templates', entry);

    // 5. 更新索引
    await this.updateIndices(entry);

    // 6. 清除相關快取
    await this.cache.invalidate(['all', `category:${entry.category}`]);

    // 7. 觸發事件
    this.emit('registered', entry);
  }

  /**
   * 批次註冊（初始化時使用）
   */
  async registerAll(rootPath: string): Promise<RegistrationResult> {
    const results = {
      registered: [],
      failed: [],
      skipped: []
    };

    // 1. 掃描所有模板目錄
    const paths = await this.scanTemplateDirectories(rootPath);

    // 2. 逐一註冊
    for (const path of paths) {
      try {
        const entry = await this.loadTemplateEntry(path);
        await this.register(entry);
        results.registered.push(entry.id);
      } catch (error) {
        results.failed.push({ path, error: error.message });
      }
    }

    return results;
  }

  /**
   * 更新註冊資訊
   */
  async update(id: string, updates: Partial<RegistryEntry>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Template ${id} not found`);
    }

    // 增加版本號
    updates.version = this.incrementVersion(existing.version);
    updates.updatedAt = new Date();

    await this.db.update('templates', { id }, updates);
    await this.cache.invalidate([id]);
    this.emit('updated', { id, updates });
  }
}
```

#### 2. 查詢與檢索

```typescript
/**
 * Registry 查詢服務
 */
class RegistryQueryService {
  /**
   * 根據 ID 查詢
   */
  async getById(id: string): Promise<RegistryEntry | null> {
    // 優先從快取取得
    const cached = await this.cache.get(id);
    if (cached) return cached;

    // 從資料庫查詢
    const entry = await this.db.query(
      'SELECT * FROM templates WHERE id = ?',
      [id]
    );

    if (entry) {
      await this.cache.set(id, entry);
    }

    return entry;
  }

  /**
   * 按分類查詢
   */
  async findByCategory(
    category: string,
    options?: QueryOptions
  ): Promise<RegistryEntry[]> {
    const cacheKey = `category:${category}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const entries = await this.db.query(
      'SELECT * FROM templates WHERE category = ? ORDER BY name',
      [category]
    );

    await this.cache.set(cacheKey, entries);
    return entries;
  }

  /**
   * 按標籤查詢
   */
  async findByTags(
    tags: string[],
    matchAll: boolean = false
  ): Promise<RegistryEntry[]> {
    if (matchAll) {
      // 需要匹配所有標籤
      return this.db.query(`
        SELECT * FROM templates
        WHERE ${tags.map(() => 'tags LIKE ?').join(' AND ')}
      `, tags.map(tag => `%${tag}%`));
    } else {
      // 匹配任一標籤
      return this.db.query(`
        SELECT * FROM templates
        WHERE ${tags.map(() => 'tags LIKE ?').join(' OR ')}
      `, tags.map(tag => `%${tag}%`));
    }
  }

  /**
   * 全文搜尋
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    // 使用全文索引搜尋
    const results = await this.db.query(`
      SELECT *,
        (CASE
          WHEN name LIKE ? THEN 100
          WHEN description LIKE ? THEN 50
          WHEN tags LIKE ? THEN 30
          ELSE 0
        END) as relevance
      FROM templates
      WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
      ORDER BY relevance DESC, usageCount DESC
      LIMIT ?
    `, [
      `%${query}%`, `%${query}%`, `%${query}%`,
      `%${query}%`, `%${query}%`, `%${query}%`,
      options?.limit || 20
    ]);

    return results;
  }

  /**
   * 進階查詢（組合條件）
   * v3.0: 支援語言層級和插件查詢
   */
  async advancedSearch(criteria: SearchCriteria): Promise<RegistryEntry[]> {
    const conditions = [];
    const params = [];

    if (criteria.type) {
      conditions.push('type = ?');
      params.push(criteria.type);
    }

    // v3.0: 語言層級查詢
    if (criteria.languageLevel) {
      conditions.push('languageLevel_type = ?');
      params.push(criteria.languageLevel);
    }

    if (criteria.specificLanguage) {
      conditions.push('languageLevel_specific = ?');
      params.push(criteria.specificLanguage);
    }

    // v3.0: 粒度層級查詢
    if (criteria.granularity) {
      conditions.push('granularity = ?');
      params.push(criteria.granularity);
    }

    if (criteria.categories && criteria.categories.length > 0) {
      conditions.push(`category IN (${criteria.categories.map(() => '?').join(',')})`);
      params.push(...criteria.categories);
    }

    if (criteria.minRating) {
      conditions.push('quality_rating >= ?');
      params.push(criteria.minRating);
    }

    if (criteria.verified !== undefined) {
      conditions.push('quality_verified = ?');
      params.push(criteria.verified ? 1 : 0);
    }

    // v3.0: 插件查詢
    if (criteria.hasPlugin) {
      conditions.push('plugins_installed LIKE ?');
      params.push(`%${criteria.hasPlugin}%`);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    return this.db.query(`
      SELECT * FROM templates
      ${whereClause}
      ORDER BY ${criteria.sortBy || 'usageCount'} DESC
    `, params);
  }

  /**
   * v3.0: 按語言層級查詢
   */
  async findByLanguageLevel(
    languageLevel: string,
    specificLanguage?: string
  ): Promise<RegistryEntry[]> {
    const cacheKey = `language:${languageLevel}:${specificLanguage || 'all'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    let query = 'SELECT * FROM templates WHERE languageLevel_type = ?';
    const params = [languageLevel];

    if (specificLanguage) {
      query += ' AND languageLevel_specific = ?';
      params.push(specificLanguage);
    }

    const entries = await this.db.query(query + ' ORDER BY name', params);
    await this.cache.set(cacheKey, entries);
    return entries;
  }

  /**
   * v3.0: 按粒度層級查詢
   */
  async findByGranularity(granularity: string): Promise<RegistryEntry[]> {
    const cacheKey = `granularity:${granularity}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const entries = await this.db.query(
      'SELECT * FROM templates WHERE granularity = ? ORDER BY name',
      [granularity]
    );

    await this.cache.set(cacheKey, entries);
    return entries;
  }

  /**
   * v3.0: 按插件查詢
   */
  async findByPlugin(pluginName: string): Promise<RegistryEntry[]> {
    const cacheKey = `plugin:${pluginName}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const entries = await this.db.query(
      'SELECT * FROM templates WHERE plugins_installed LIKE ? ORDER BY name',
      [`%${pluginName}%`]
    );

    await this.cache.set(cacheKey, entries);
    return entries;
  }
}
```

#### 3. 依賴管理

```typescript
/**
 * 依賴管理器
 */
class DependencyManager {
  /**
   * 解析依賴樹
   */
  async resolveDependencies(
    templateId: string
  ): Promise<DependencyTree> {
    const entry = await this.registry.getById(templateId);
    if (!entry) {
      throw new Error(`Template ${templateId} not found`);
    }

    const tree: DependencyTree = {
      id: templateId,
      entry,
      dependencies: []
    };

    // 遞迴解析依賴
    for (const dep of entry.dependencies) {
      const depTree = await this.resolveDependencies(dep.id);
      tree.dependencies.push(depTree);
    }

    return tree;
  }

  /**
   * 檢查循環依賴
   */
  async detectCircularDependencies(
    templateId: string
  ): Promise<CircularDependency[]> {
    const visited = new Set<string>();
    const stack: string[] = [];
    const circles: CircularDependency[] = [];

    const dfs = async (id: string) => {
      if (stack.includes(id)) {
        // 發現循環
        const circleStart = stack.indexOf(id);
        circles.push({
          cycle: [...stack.slice(circleStart), id]
        });
        return;
      }

      if (visited.has(id)) return;

      visited.add(id);
      stack.push(id);

      const entry = await this.registry.getById(id);
      if (entry) {
        for (const dep of entry.dependencies) {
          await dfs(dep.id);
        }
      }

      stack.pop();
    };

    await dfs(templateId);
    return circles;
  }

  /**
   * 計算影響範圍（當某個模板更新時）
   */
  async calculateImpact(templateId: string): Promise<ImpactAnalysis> {
    const entry = await this.registry.getById(templateId);
    if (!entry) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 找出所有依賴此模板的模板
    const directDependents = entry.usedBy;

    // 遞迴找出間接依賴
    const allDependents = new Set<string>(directDependents);
    for (const depId of directDependents) {
      const subImpact = await this.calculateImpact(depId);
      subImpact.directDependents.forEach(id => allDependents.add(id));
    }

    return {
      templateId,
      directDependents,
      totalAffected: allDependents.size,
      affectedTemplates: Array.from(allDependents)
    };
  }
}
```

#### 4. 插件整合

> **v3.0 新增**：Registry 與插件系統的深度整合

```typescript
/**
 * Registry Plugin Manager
 * 管理 Registry 層級的插件功能
 */
class RegistryPluginManager {
  private pluginManager: PluginManager;
  private registry: TemplateRegistry;

  /**
   * 為模板附加插件數據
   */
  async attachPluginData(entry: RegistryEntry): Promise<RegistryEntry> {
    if (!entry.plugins?.installed) {
      return entry;
    }

    // 從每個插件收集元資料
    const pluginData: Record<string, any> = {};

    for (const pluginName of entry.plugins.installed) {
      const plugin = this.pluginManager.getPlugin(pluginName);
      if (plugin?.provideMetadata) {
        const metadata = await plugin.provideMetadata(entry);
        pluginData[pluginName] = metadata;
      }
    }

    // 附加到 entry
    return {
      ...entry,
      plugins: {
        ...entry.plugins,
        data: pluginData
      }
    };
  }

  /**
   * 批次附加插件數據
   */
  async batchAttachPluginData(
    entries: RegistryEntry[]
  ): Promise<RegistryEntry[]> {
    return Promise.all(
      entries.map(entry => this.attachPluginData(entry))
    );
  }

  /**
   * 插件驗證
   */
  async validateWithPlugins(entry: RegistryEntry): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!entry.plugins?.installed) {
      return { valid: true, errors, warnings };
    }

    for (const pluginName of entry.plugins.installed) {
      const plugin = this.pluginManager.getPlugin(pluginName);
      if (plugin?.provideValidation) {
        const result = await plugin.provideValidation(entry);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 插件工具註冊
   * 允許插件提供自定義工具（如語法檢查、優化建議）
   */
  async registerPluginTools(pluginName: string): Promise<void> {
    const plugin = this.pluginManager.getPlugin(pluginName);
    if (!plugin?.provideTools) {
      return;
    }

    const tools = await plugin.provideTools();

    // 註冊工具到 Registry
    for (const tool of tools) {
      this.registry.registerTool({
        name: tool.name,
        plugin: pluginName,
        execute: tool.execute,
        description: tool.description
      });
    }
  }

  /**
   * 查詢插件統計
   */
  async getPluginStats(pluginName: string): Promise<PluginStats> {
    const entries = await this.registry.queryService.findByPlugin(pluginName);

    return {
      pluginName,
      totalTemplates: entries.length,
      byLanguageLevel: this.groupByLanguageLevel(entries),
      byGranularity: this.groupByGranularity(entries),
      averageRating: this.calculateAverageRating(entries),
      totalUsage: entries.reduce((sum, e) => sum + e.stats.usageCount, 0)
    };
  }

  /**
   * 插件更新傳播
   * 當插件更新時，通知所有使用該插件的模板
   */
  async propagatePluginUpdate(
    pluginName: string,
    newVersion: string
  ): Promise<PropagationResult> {
    const affectedEntries = await this.registry.queryService.findByPlugin(pluginName);

    const results = {
      updated: [],
      failed: [],
      requiresManualUpdate: []
    };

    for (const entry of affectedEntries) {
      try {
        // 嘗試自動更新插件數據
        const updated = await this.attachPluginData(entry);
        await this.registry.update(entry.id, updated);
        results.updated.push(entry.id);
      } catch (error) {
        if (error.code === 'BREAKING_CHANGE') {
          results.requiresManualUpdate.push(entry.id);
        } else {
          results.failed.push({ id: entry.id, error: error.message });
        }
      }
    }

    return results;
  }

  private groupByLanguageLevel(entries: RegistryEntry[]) {
    return entries.reduce((acc, entry) => {
      const key = entry.languageLevel.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByGranularity(entries: RegistryEntry[]) {
    return entries.reduce((acc, entry) => {
      acc[entry.granularity] = (acc[entry.granularity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageRating(entries: RegistryEntry[]): number {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.quality.rating, 0);
    return sum / entries.length;
  }
}
```

**使用範例**：

```typescript
// 1. 附加插件數據查詢
const hdlTemplates = await registry.queryService.findByLanguageLevel('hdl');
const withPluginData = await registryPluginManager.batchAttachPluginData(hdlTemplates);

// 2. 插件驗證
const validationResult = await registryPluginManager.validateWithPlugins(template);
if (!validationResult.valid) {
  console.error('驗證失敗:', validationResult.errors);
}

// 3. 查詢插件統計
const hdlPluginStats = await registryPluginManager.getPluginStats('hdl-plugin');
console.log(`HDL Plugin 使用於 ${hdlPluginStats.totalTemplates} 個模板`);

// 4. 插件更新傳播
const result = await registryPluginManager.propagatePluginUpdate('hdl-plugin', '2.0.0');
console.log(`成功更新 ${result.updated.length} 個模板`);
console.log(`需要手動更新 ${result.requiresManualUpdate.length} 個模板`);
```

---

#### 5. 版本控制

```typescript
/**
 * 版本管理器
 */
class VersionManager {
  /**
   * 發布新版本
   */
  async publishVersion(
    templateId: string,
    versionType: 'major' | 'minor' | 'patch',
    changelog: string
  ): Promise<VersionInfo> {
    const entry = await this.registry.getById(templateId);
    if (!entry) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 計算新版本號
    const newVersion = this.incrementVersion(entry.version, versionType);

    // 儲存版本歷史
    await this.saveVersionHistory(templateId, {
      version: entry.version,
      content: await this.loadTemplateContent(entry.path),
      changelog: changelog,
      publishedAt: new Date()
    });

    // 更新 Registry
    await this.registry.update(templateId, {
      version: newVersion
    });

    return {
      templateId,
      oldVersion: entry.version,
      newVersion,
      changelog
    };
  }

  /**
   * 回滾到指定版本
   */
  async rollback(
    templateId: string,
    targetVersion: string
  ): Promise<void> {
    const history = await this.getVersionHistory(templateId);
    const targetSnapshot = history.find(h => h.version === targetVersion);

    if (!targetSnapshot) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    // 恢復內容
    const entry = await this.registry.getById(templateId);
    await this.writeTemplateContent(entry.path, targetSnapshot.content);

    // 更新 Registry（標記為回滾）
    await this.registry.update(templateId, {
      version: `${targetVersion}-rollback`,
      updatedAt: new Date()
    });
  }

  /**
   * 版本號遞增
   */
  private incrementVersion(
    current: string,
    type: 'major' | 'minor' | 'patch'
  ): string {
    const [major, minor, patch] = current.split('.').map(Number);

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
    }
  }
}
```

---

### Registry API

```typescript
/**
 * Template Registry API
 */
class TemplateRegistryAPI {
  // === 查詢 API ===

  /** GET /registry/templates/:id - 取得單一模板資訊 */
  async getTemplate(id: string): Promise<RegistryEntry>;

  /** GET /registry/templates - 列出所有模板 */
  async listTemplates(options?: ListOptions): Promise<RegistryEntry[]>;

  /** GET /registry/search?q=... - 搜尋模板 */
  async searchTemplates(query: string): Promise<SearchResult[]>;

  /** POST /registry/search/advanced - 進階搜尋 */
  async advancedSearch(criteria: SearchCriteria): Promise<RegistryEntry[]>;

  // === 分類與標籤 ===

  /** GET /registry/categories - 取得所有分類 */
  async getCategories(): Promise<Category[]>;

  /** GET /registry/tags - 取得所有標籤 */
  async getTags(): Promise<Tag[]>;

  /** GET /registry/templates/by-category/:category - 按分類查詢 */
  async getByCategory(category: string): Promise<RegistryEntry[]>;

  /** GET /registry/templates/by-tag/:tag - 按標籤查詢 */
  async getByTag(tag: string): Promise<RegistryEntry[]>;

  // === 依賴管理 ===

  /** GET /registry/templates/:id/dependencies - 取得依賴樹 */
  async getDependencies(id: string): Promise<DependencyTree>;

  /** GET /registry/templates/:id/dependents - 取得被依賴列表 */
  async getDependents(id: string): Promise<string[]>;

  /** GET /registry/templates/:id/impact - 計算影響範圍 */
  async getImpact(id: string): Promise<ImpactAnalysis>;

  // === 統計與分析 ===

  /** GET /registry/stats - 取得統計資訊 */
  async getStatistics(): Promise<RegistryStatistics>;

  /** GET /registry/templates/:id/stats - 取得單一模板統計 */
  async getTemplateStats(id: string): Promise<TemplateStatistics>;

  // === 版本管理 ===

  /** GET /registry/templates/:id/versions - 取得版本歷史 */
  async getVersionHistory(id: string): Promise<VersionHistory[]>;

  /** POST /registry/templates/:id/publish - 發布新版本 */
  async publishVersion(
    id: string,
    type: 'major' | 'minor' | 'patch',
    changelog: string
  ): Promise<VersionInfo>;

  /** POST /registry/templates/:id/rollback - 回滾版本 */
  async rollbackVersion(id: string, targetVersion: string): Promise<void>;

  // === 管理 API ===

  /** POST /registry/templates - 註冊新模板 */
  async registerTemplate(entry: RegistryEntry): Promise<void>;

  /** PUT /registry/templates/:id - 更新模板資訊 */
  async updateTemplate(id: string, updates: Partial<RegistryEntry>): Promise<void>;

  /** DELETE /registry/templates/:id - 刪除模板 */
  async deleteTemplate(id: string): Promise<void>;

  /** POST /registry/rebuild - 重建整個 Registry */
  async rebuildRegistry(): Promise<RegistrationResult>;
}
```

---

### Registry 初始化

```typescript
/**
 * Registry 初始化器
 */
class RegistryInitializer {
  /**
   * 初始化 Registry（首次啟動時）
   */
  async initialize(formsRoot: string): Promise<void> {
    console.log('Initializing Template Registry...');

    // 1. 建立資料庫
    await this.createDatabase();

    // 2. 建立索引
    await this.createIndices();

    // 3. 掃描並註冊所有模板
    const result = await this.scanAndRegister(formsRoot);

    console.log(`Registry initialized: ${result.registered.length} templates registered`);

    // 4. 建立依賴關係
    await this.buildDependencyGraph();

    // 5. 建立對應關係索引
    await this.buildMappingIndex();

    console.log('Registry initialization complete');
  }

  /**
   * 掃描並註冊所有模板
   */
  private async scanAndRegister(root: string): Promise<RegistrationResult> {
    const result: RegistrationResult = {
      registered: [],
      failed: [],
      skipped: []
    };

    // 掃描 Sequence templates
    await this.scanSequenceTemplates(`${root}/sequence`, result);

    // 掃描 Structure blocks
    await this.scanStructureBlocks(`${root}/structure`, result);

    // 掃描 Topology graphs
    await this.scanTopologyGraphs(`${root}/topology`, result);

    return result;
  }
}
```

---

### 待討論問題

1. **Registry 儲存方式**
   - SQLite 是否足夠？還是需要更強大的資料庫？
   - 是否需要支援分散式 Registry？

2. **快取策略**
   - 快取的有效期？
   - 何時該清除快取？

3. **版本號格式**
   - 是否嚴格遵循語義化版本（Semantic Versioning）？
   - 如何處理不相容的版本更新？

4. **依賴解析**
   - 是否支援版本範圍（如 `^1.0.0`, `~1.2.3`）？
   - 如何處理依賴衝突？

5. **Registry 同步**
   - 檔案系統與 Registry 不同步時如何處理？
   - 是否需要「Registry 優先」模式？

---

## 實施路線圖

### v0.3.2 - 文字模板改版 (當前規劃) ⏸️ **暫緩實施**

**目標**: 讓文字模板可以直接用編輯器編輯

**背景**: 經過深入討論後，發現單純的模板改版無法充分發揮多形態架構的潛力。**決定暫緩 v0.3.2，直接進入 v0.4.0 積木系統開發**。

#### 三種可能選項的分析

在討論過程中考慮了三種可能的 v0.3.2 實施方案：

**選項 A：保守升級（原始方案）**
```
當前: templates/{language}/{category}/templates/{name}/
改為: templates/{language}/{category}/templates/{name}/
        ├── code.{ext}
        ├── README.md
        ├── meta.json
        └── examples/
```

✅ **優點**:
- 最小改動，風險低
- 向後兼容性好
- 快速實施（1-2 週）

❌ **缺點**:
- 無法充分利用多形態架構
- 未來仍需大規模重構
- 「過渡性」設計，投資回報率低

**選項 B：中度重構**
```
forms/
├── _index/                    # 全局索引
├── sequence/{language}/...    # 遷移現有 templates/
└── (預留 structure/, topology/)
```

✅ **優點**:
- 開始建立 forms/ 架構
- 為未來擴展奠定基礎
- 投資不會浪費

❌ **缺點**:
- 中等複雜度
- 需要資料遷移工具
- 可能引入風險

**選項 C：完整實作（激進方案）**
```
forms/
├── _index/              # 完整索引系統
├── _registry/           # Template Registry
├── sequence/            # 完整序列形態
├── structure/           # 完整積木系統
└── topology/            # 完整圖譜系統
```

✅ **優點**:
- 一次到位，避免多次重構
- 完整體驗多形態架構價值
- 長期投資回報率最高

❌ **缺點**:
- 開發時間長（2-3 個月）
- 複雜度高
- 風險較大

#### 最終決策：直接進入 v0.4.0

**理由**:
1. **選項 A 價值有限** - 「過渡性」設計會造成二次重構，不如直接進入下一階段
2. **選項 B 不上不下** - 既承擔了部分風險，又無法充分體驗多形態架構
3. **選項 C 與 v0.4.0 重疊** - 不如直接進入 v0.4.0，獲得完整價值

**策略調整**:
- ⏸️ **暫緩** v0.3.2 模板改版
- 🚀 **直接開始** v0.4.0 積木系統開發
- 📋 **目前狀態** v0.3.1 保持穩定，繼續設計與規劃階段

**用戶引用**:
> "現在還有很多要仔細討論與思考的地方，不用急著實作，現在還在設計及分析需求。"

---

### v0.4.0 - 積木系統 (核心) 🎯 **重新設計**

**目標**: 實現文字 ↔ 積木 雙向轉換（基於四級積木系統）

**核心特性**:
1. **四級積木系統** (L0/L1/L2/L3)
   - L0: 系統級（多模板組合）
   - L1: 模板級（完整程式）
   - L2: 語句級（控制結構）
   - L3: 表達式級（運算元素）

2. **展開摺疊機制**
   - 積木可展開查看內部細節
   - 支援多層級展開（L0→L1→L2→L3）
   - Structure Form 版本控制

3. **對應關係管理**
   - 自動建立 Sequence ↔ Structure 對應
   - 對應關係驗證與同步
   - 衝突解決機制

4. **Template Registry**
   - 集中式模板/積木管理
   - 依賴追蹤與版本控制
   - 快速查詢與檢索

**實施範圍**:
- ✅ 建立 templates/ 知識單元架構
  - templates/{language-level}/ - 按語言層級組織
  - 每個模板包含完整的三形態檔案（sequence.*, structure.*, topology.*）
  - templates/_registry/ - Template Registry
  - 統一的 meta.json 格式（v3.0）

- ✅ 積木系統核心
  - L0/L1/L2/L3 積木定義
  - 通用積木庫（universal blocks）
  - 語言特定積木（C, Python, JavaScript）
  - 展開/摺疊機制

- ✅ 轉換引擎
  - Sequence → Structure (結構化)
  - Structure → Sequence (序列化)
  - 信心度評估
  - 損失追蹤

- ✅ 對應關係系統
  - 對應關係索引 (mappings.json)
  - 自動推薦引擎
  - 驗證與同步機制
  - 衝突解決 UI

- ✅ Registry 系統
  - SQLite 資料庫
  - 註冊與查詢 API
  - 依賴管理
  - 版本控制

- ✅ UI 面板
  - Blockly Editor Panel（基礎版）
  - 展開/摺疊控制
  - 對應關係管理介面

**時程**: 3-4 個月

**里程碑**:
- **Month 1**: forms/ 架構 + L1/L2 積木系統
- **Month 2**: 轉換引擎 + 對應關係系統
- **Month 3**: Registry + 展開摺疊機制
- **Month 4**: UI 整合 + 測試優化

---

### v0.4.x - 積木系統增強

**v0.4.1 - L3 表達式級積木**
- ✅ L3 粒度支援
- ✅ 表達式級積木定義
- ✅ 細粒度轉換

**v0.4.2 - 跨語言轉換**
- ✅ C ↔ Python 基礎轉換
- ✅ Transformation Assistant 基礎版
- ✅ 轉換模式庫

**v0.4.3 - 優化與穩定**
- ✅ 效能優化
- ✅ 錯誤處理增強
- ✅ 使用者體驗改善

**預計時程**: v0.4.0 完成後 2-3 個月

### v0.5.0 - 圖譜系統 (完整) 🌐

**目標**: 實現三形態完整轉換（Sequence ↔ Structure ↔ Topology）

**核心特性**:
1. **四種圖譜類型**
   - Call Graph（呼叫圖）- 函式呼叫關係
   - Data Flow（數據流圖）- 數據流向追蹤
   - Dependency Graph（依賴圖）- 模組依賴關係
   - Control Flow（控制流圖）- 程式執行路徑

2. **混合互動模式**
   - Call Graph: 唯讀 + 可調整布局
   - Data Flow: 唯讀 + 可調整布局
   - Dependency Graph: 可編輯結構
   - Control Flow: 唯讀

3. **六種布局算法**
   - Hierarchical（階層式）
   - Force-Directed（力導向）
   - Circular（環形）
   - Orthogonal（正交）
   - Radial（輻射）
   - Layered（分層）

4. **智慧布局推薦**
   - 根據圖譜特徵自動推薦布局
   - 使用者可手動切換
   - 布局參數可調整

**實施範圍**:
- ✅ 圖譜資料結構
  - Graph, Node, Edge 定義
  - 圖譜類型系統
  - 圖譜序列化格式

- ✅ 圖譜生成引擎
  - Sequence → Topology (AST 分析)
  - Structure → Topology (積木遍歷)
  - 關係提取演算法

- ✅ 圖譜轉換引擎
  - Topology → Sequence (拓撲排序)
  - Topology → Structure (模式匹配)

- ✅ 布局系統
  - 六種布局算法實作
  - 自動布局推薦
  - 布局參數 UI

- ✅ 互動系統
  - 唯讀模式（查看、縮放）
  - 可編輯模式（新增、刪除、連接）
  - 布局調整模式

- ✅ Node Flow Panel
  - 圖譜渲染引擎
  - 互動控制
  - 布局切換器
  - 匯出功能

**時程**: 3-4 個月

**里程碑**:
- **Month 1**: 圖譜資料結構 + 生成引擎
- **Month 2**: 布局算法 + 自動推薦
- **Month 3**: 互動系統 + Node Flow Panel
- **Month 4**: 優化 + 整合測試

---

### v0.5.x - 圖譜系統增強

**v0.5.1 - 進階圖譜分析**
- ✅ 圖譜簡化演算法
- ✅ 關鍵路徑分析
- ✅ 循環偵測

**v0.5.2 - 程式碼重構工具**
- ✅ 基於圖譜的重構建議
- ✅ 依賴解耦分析
- ✅ 程式碼模組化建議

**v0.5.3 - 效能優化**
- ✅ 大型圖譜懶載入
- ✅ 層級縮放
- ✅ 視覺化優化

**預計時程**: v0.5.0 完成後 2-3 個月

---

### v0.6.0 - 自然語言模板系統 📝 **v3.0 新增**

> **v3.0 核心更新**：自然語言成為第一等公民，支援 Spec-Driven Development

**目標**: 將自然語言提升為與程式語言同等的語言層級，支援規格驅動開發工作流

**核心特性**:

1. **Spec Template 系統**
   - Markdown 規格模板
   - 結構化欄位（Method, Path, Request, Response）
   - 概念型變數系統（{{concept:http-method}}）
   - 範例與測試案例

2. **SpecKit 深度整合**
   - /specify 階段的模板建議
   - /implement 階段的 Code Template 推薦
   - spec.md ↔ template 雙向同步
   - Spec 變更追蹤

3. **概念管理系統（Phase 2）**
   - 類型化概念（Concept Types）
   - 概念驗證（Validation Rules）
   - 概念關係（Concept Graph）
   - 可重用概念庫

4. **Natural Language 三形態**
   - Sequence: Markdown 文字規格
   - Structure: 概念積木（Blockly for Specs）
   - Topology: 概念圖（Concept Map）

**實施範圍**:

- ✅ **Spec Template 格式**
  - Markdown 模板解析器
  - 結構化欄位提取
  - 變數系統 v2（類型化概念）
  - 模板驗證器

- ✅ **SpecKit 整合**
  - .speckit/ 目錄結構支援
  - /specify 階段鉤子
  - /implement 階段建議
  - Spec-Code 對應關係

- ✅ **概念管理**
  - Concept Type 定義
  - Concept Validation
  - Concept 查詢與推薦
  - Concept Graph（基礎版）

- ✅ **自然語言轉換**
  - Natural Language → High-Level Code（透過 Coding Agent）
  - Code → Natural Language Spec（文檔生成）
  - Spec ↔ Structure（概念積木）

- ✅ **UI 增強**
  - Spec Template 編輯器
  - 概念瀏覽器
  - Spec-Code 對應視圖
  - SpecKit 工作流整合

**時程**: 3-4 個月

**里程碑**:
- **Month 1**: Spec Template 格式 + 解析器
- **Month 2**: SpecKit 整合 + 工作流
- **Month 3**: 概念管理系統（Phase 2）
- **Month 4**: 自然語言轉換 + UI 整合

**依賴關係**:
- 需要 v0.4.0 的 Registry 系統
- 需要 v0.5.0 的轉換引擎基礎
- 與 SpecKit 團隊協作（可能）

---

### v0.6.x - 自然語言增強

**v0.6.1 - 知識圖譜（Phase 3）**
- ✅ 概念圖完整實作
- ✅ 概念關係推理
- ✅ 知識查詢語言

**v0.6.2 - AI 輔助規格生成**
- ✅ 從對話生成規格
- ✅ 規格補全建議
- ✅ 規格品質檢查

**v0.6.3 - 多語言規格**
- ✅ 中文 Spec Template
- ✅ 日文 Spec Template
- ✅ 多語言概念對應

**預計時程**: v0.6.0 完成後 2-3 個月

---

### v0.7.0 - 底層與硬體開發支援 ⚙️ **v3.0 新增**

> **v3.0 核心更新**：擴展到低階語言、機器語言、HDL 和實體電路

**目標**: 支援完整的抽象層級，從自然語言到物理電路

**核心特性**:

1. **Assembly 模板系統**
   - x86-64, ARM, RISC-V 支援
   - 指令級模板（L3）
   - 暫存器分配模式
   - 系統呼叫模板

2. **HDL 模板系統**
   - Verilog, VHDL, SystemVerilog
   - 模組模板（L1）
   - 基本元件模板（L2）
   - 時序圖生成

3. **Machine Code 可視化**
   - 指令編碼顯示
   - 管線圖（Topology）
   - 執行追蹤

4. **插件系統深化**
   - Assembly Plugin（暫存器、週期）
   - HDL Plugin（時序、資源、綜合）
   - Machine Code Plugin（性能分析）

**實施範圍**:

- ✅ **Assembly 支援**
  - 三大架構模板庫（x86-64, ARM, RISC-V）
  - 指令積木（Blockly for Assembly）
  - 暫存器流程圖（Topology）
  - 組合語言 ↔ 機器碼轉換

- ✅ **HDL 支援**
  - Verilog/VHDL 模板庫
  - 模組積木（Hierarchical Blocks）
  - RTL 圖（Schematic Topology）
  - HDL ↔ 網表轉換

- ✅ **Machine Code 支援**
  - 指令編碼模板
  - 管線圖生成
  - 執行追蹤視覺化

- ✅ **插件系統**
  - Assembly Plugin（完整版）
  - HDL Plugin（完整版）
  - 插件 API v2（支援所有語言層級）

- ✅ **工具鏈整合**
  - nasm, gas 整合（Assembly）
  - Vivado, Quartus 整合（HDL）
  - objdump 整合（Machine Code）

- ✅ **UI 增強**
  - 雙窗格編輯器（Code + Binary/Schematic）
  - 暫存器/資源監視器
  - 時序分析視圖

**時程**: 3-4 個月

**里程碑**:
- **Month 1**: Assembly 模板 + 插件
- **Month 2**: HDL 模板 + RTL 圖
- **Month 3**: Machine Code 可視化 + 插件 API v2
- **Month 4**: 工具鏈整合 + UI 增強

**特殊需求**:
- 需要硬體背景專家協作
- 需要精確的位元層級處理
- 需要與硬體工具鏈深度整合

---

### v0.7.x - 底層開發增強

**v0.7.1 - 性能分析工具**
- ✅ 指令週期分析
- ✅ 資源使用分析（HDL）
- ✅ 熱點檢測

**v0.7.2 - 優化建議**
- ✅ 組合語言優化模式
- ✅ HDL 綜合優化
- ✅ 機器碼對齊優化

**v0.7.3 - 除錯支援**
- ✅ 暫存器監視
- ✅ 波形圖（HDL）
- ✅ 斷點與單步執行

**預計時程**: v0.7.0 完成後 2-3 個月

---

### v1.0 - 統一多語言平台 + 社群與 AI 🚀 **v3.0 更新**

**目標**: 完整的跨語言層級多形態平台，整合 AI 與社群

**v3.0 更新**: 從「程式碼模板工具」升級為「跨語言層級知識平台」

**核心特性**:

1. **統一語言架構**
   - 6 個語言層級完整支援（Natural → Physical）
   - 跨層級轉換（如 Spec → HDL 直通）
   - 統一的元資料與註解系統
   - 領域插件生態系統

2. **AI 深度整合**
   - 自然語言理解（Spec 生成）
   - 智慧轉換建議（跨語言、跨形態）
   - 程式碼補全與優化
   - 設計意圖推理

3. **社群平台**
   - 跨語言層級的模板分享
   - 插件市場
   - 協作開發（多人編輯 Spec/Code/HDL）
   - 品質認證系統

4. **企業功能**
   - 團隊模板庫管理
   - 權限與審核流程
   - 使用分析與報告
   - 私有部署支援

**實施範圍**:

- ✅ **統一語言平台**
  - 完整的 6 層級支援
  - 跨層級轉換引擎
  - 統一 Registry（支援所有層級）
  - 插件生態系統

- ✅ **AI 能力**
  - 收斂性分析與優化
  - 自編碼訓練資料收集
  - AI 意圖理解
  - 智慧轉換建議（跨語言、跨層級）
  - 設計決策推理

- ✅ **社群功能**
  - 模板/積木/圖譜分享
  - 插件市場
  - 評分與評論系統
  - 協作功能

- ✅ **企業功能**
  - 團隊管理
  - 私有模板庫
  - 審核工作流
  - 使用統計

**時程**: 6-12 個月

**里程碑**:
- **Quarter 1**: 統一語言平台基礎
- **Quarter 2**: AI 能力開發
- **Quarter 3**: 社群平台建設
- **Quarter 4**: 企業功能 + 穩定化

**成功指標**:
- 支援所有 6 個語言層級
- 社群貢獻 1000+ 模板
- 插件生態 50+ 插件
- 企業客戶採用

---

## 開放問題

以下是尚未完全解決、需要進一步討論的問題：

---

### 核心架構問題

#### 1. 積木展開摺疊的視覺呈現 🔍

**問題**: L0 系統級積木應該如何視覺化呈現？

**選項**:
- A. 「超級積木」- 特殊的大型積木
- B. 「容器積木」- 可容納其他積木的容器
- C. 「分頁系統」- 使用 Tab 切換不同模板

**待討論**:
- 哪種方式最直覺？
- 如何處理大量模板的情況（10+ 個模板）？
- 是否支援巢狀容器？

---

#### 2. 多層級展開的視圖管理 📱

**問題**: 當同時展開多個層級時（L0→L1→L2），如何避免畫面混亂？

**選項**:
- A. 取代原積木（展開後隱藏原本的摺疊積木）
- B. 並排顯示（原積木 + 展開視圖）
- C. 覆蓋顯示（modal 或 overlay）
- D. 分頁顯示（不同層級在不同 tab）

**待討論**:
- 如何標示當前層級？
- 是否需要「麵包屑」導航？
- 如何快速跳回上層？

---

#### 3. 摺疊分數的閾值設定 ⚖️

**問題**: 摺疊分數多少才算「適合摺疊」？

**當前設計**:
```typescript
if (foldingScore.total >= 0.8) {
  // 建議摺疊
}
```

**待討論**:
- 0.8 是否合適？
- 是否需要依據情境調整（教學 vs. 開發）？
- 使用者是否可自訂閾值？

---

#### 4. 對應關係的粒度範圍 🔗

**問題**: 對應關係應該記錄到什麼粒度？

**選項**:
- A. 僅頂層（Template ↔ L1 Block）
- B. 包含 L2（Template ↔ L1 + L2 細節）
- C. 完整記錄（Template ↔ L1 + L2 + L3）

**考量**:
- **選項 A**: 簡單，但細節對應會遺失
- **選項 B**: 平衡，記錄主要結構
- **選項 C**: 完整，但資料量大且維護複雜

**待討論**:
- 細粒度對應的實際價值？
- 維護成本 vs. 使用價值？

---

#### 5. 對應關係信心度閾值 📊

**問題**: 多少信心度以下視為「不可靠對應」？

**當前設計**:
- 信心度 ≥ 0.9: 自動建立對應
- 信心度 0.6-0.9: 推薦給使用者確認
- 信心度 < 0.6: 不推薦

**待討論**:
- 閾值是否合適？
- 不可靠對應（< 0.6）是否應該定期清理？
- 清理週期？（每週、每月）

---

#### 6. 同步策略的預設行為 🔄

**問題**: 當偵測到對應關係不一致時，預設行為是什麼？

**選項**:
- A. 自動同步（風險：可能覆蓋使用者變更）
- B. 詢問使用者（較安全但需要互動）
- C. 依修改類型決定（小變更自動，大變更詢問）

**待討論**:
- 如何定義「小變更」vs「大變更」？
- 是否提供「靜音模式」（不再提示）？
- 不同使用者角色是否有不同預設（初學者 vs. 進階）？

---

#### 7. Transformation Assistant 觸發時機 🤖

**問題**: 什麼情況下啟動 Transformation Assistant？

**當前設計**: 信心度 < 0.9

**待討論**:
- 閾值是否合適？
- 是否提供設定選項：
  - 「總是詢問」模式（所有轉換都詢問）
  - 「從不詢問」模式（信任系統自動轉換）
  - 「智慧模式」（預設，信心度 < 0.9 才詢問）

---

#### 8. 偏好學習的範圍與隔離 📚

**問題**: 使用者偏好應該是全局的還是每個專案獨立？

**選項**:
- A. 全局偏好（所有專案共用）
- B. 專案偏好（每個專案獨立）
- C. 混合模式（全局預設 + 專案覆蓋）

**相關問題**:
- 是否支援匯入/匯出偏好設定？
- 團隊協作時如何共享偏好？
- 是否需要「偏好配置檔」（類似 .eslintrc）？

---

### 實作細節問題

#### 9. Transformation Assistant 選項數量上限 📋

**問題**: 最多顯示幾個轉換選項？

**建議**: 3-5 個

**待討論**:
- 如何處理超過上限的選項？
  - 只顯示最高分的 5 個
  - 提供「顯示更多」按鈕
  - 進階搜尋/過濾功能
- 初學者 vs. 進階使用者是否有不同上限？

---

#### 10. 語義驗證的深度 🔬

**問題**: 對應關係驗證應該做到多深入？

**當前設計**: 基本檢查（變數名稱、控制結構數量）

**可能的增強**:
- 數據流分析
- 語義等價性測試
- 執行測試（實際運行程式碼比較輸出）

**待討論**:
- 驗證深度 vs. 效能開銷？
- 是否需要「快速驗證」和「深度驗證」模式？

---

#### 11. Registry 儲存方式選擇 💾

**問題**: SQLite 是否足夠？還是需要更強大的資料庫？

**考量**:
- **SQLite 優點**: 輕量、無需額外伺服器、易於部署
- **SQLite 缺點**: 並發能力有限、功能較簡單

**待討論**:
- 預期的模板數量規模？（數百、數千、數萬？）
- 是否需要支援分散式 Registry？
- 雲端同步需求？

---

#### 12. Registry 快取策略 ⚡

**問題**: 快取的有效期和清除時機？

**待討論**:
- 快取有效期（5 分鐘、1 小時、永久直到更新）？
- 何時該清除快取：
  - 檔案系統變更
  - 手動重新整理
  - 定時清除
- LRU vs. LFU 策略？

---

#### 13. 版本號格式與規範 📦

**問題**: 是否嚴格遵循語義化版本（Semantic Versioning）？

**Semantic Versioning**: `MAJOR.MINOR.PATCH`
- MAJOR: 不相容的 API 變更
- MINOR: 向後相容的功能新增
- PATCH: 向後相容的錯誤修正

**待討論**:
- 模板/積木是否適用此規範？
- 如何定義「不相容變更」（對模板而言）？
- 是否需要預發布版本（alpha, beta, rc）？

---

#### 14. 依賴版本範圍支援 🎯

**問題**: 是否支援版本範圍（如 `^1.0.0`, `~1.2.3`）？

**npm 風格語法**:
- `^1.0.0` - 接受 1.x.x（MINOR, PATCH 可變）
- `~1.2.3` - 接受 1.2.x（只有 PATCH 可變）
- `1.0.0` - 精確版本

**待討論**:
- 是否需要這種彈性？
- 如何處理依賴衝突（A 需要 ^1.0.0，B 需要 ^2.0.0）？
- 是否提供衝突解決工具？

---

#### 15. Registry 與檔案系統的同步優先權 📁

**問題**: 當 Registry 與檔案系統不一致時，以哪個為準？

**場景**:
- 使用者直接修改檔案系統，但 Registry 尚未更新
- Registry 有記錄，但檔案已被刪除

**選項**:
- A. 檔案系統優先（檔案是 source of truth）
- B. Registry 優先（Registry 是 source of truth）
- C. 顯示警告，讓使用者決定

**待討論**:
- 哪種模式最符合使用者預期？
- 是否提供「Registry 優先」模式選項？

---

### 使用者體驗問題

#### 16. 教學模式 vs. 快速模式 🎓

**問題**: 是否需要針對不同使用者提供不同模式？

**教學模式**:
- 詳細解釋每個轉換選項
- 顯示完整的信心度分析
- 提供學習資源連結

**快速模式**:
- 僅顯示推薦選項
- 最少互動
- 信任系統自動選擇

**待討論**:
- 如何判斷使用者應該用哪種模式？
- 是否需要「混合模式」（依任務類型自動切換）？
- 模式切換是否應該容易（一鍵切換）？

---

### 原有問題更新

#### 17. 積木與模板的關係 ✅ **已解決**

**決策**: 採用 D 選項 - 中央註冊表記錄對應關係

**實作**:
- 對應關係索引 (`forms/_index/mappings.json`)
- Template Registry 整合
- 自動推薦與驗證系統

---

#### 18. 粒度層級的詳細設計 ✅ **已定義**

**決策**: 四級積木系統 (L0/L1/L2/L3)

- **L0**: 系統級（多模板組合與協作）
- **L1**: 模板級（完整程式功能單元）
- **L2**: 語句級（控制結構與功能區塊）
- **L3**: 表達式級（基本運算與操作元素）

**設計靈感**: 受生物學中蛋白質四級結構啟發（詳見附錄 C）

---

#### 19. 轉換準確度的評估標準 📊

**問題**: 如何量化轉換的準確度？

**當前設計**: 多維度評估
- AST 相似度（結構層面）
- 語義相似度（意義層面）
- 模式匹配信心度

**待討論**:
- 是否需要使用者回饋評分？
- 測試案例通過率如何整合？

---

#### 20. 積木的版本兼容性 🔄

**問題**: 當積木定義更新時，如何處理舊的 workspace？

**挑戰**:
- 向後兼容
- 自動遷移
- 版本檢測

**待設計**:
- Structure Form 版本標記
- 自動遷移腳本
- 降級（fallback）策略

---

#### 21. 大型程式的圖譜效能 ⚡

**問題**: 數千行程式碼的圖譜如何有效顯示和互動？

**規劃** (v0.5.3):
- 懶載入
- 層級縮放
- 視覺化優化
- 圖簡化演算法

---

#### 22. 跨語言轉換的範圍 🌍

**問題**: 應該支援哪些語言之間的互轉？優先級如何？

**優先級**:
1. C ↔ Python (v0.4.2)
2. C ↔ JavaScript (v0.4.x)
3. Python ↔ JavaScript (v0.4.x)
4. 其他語言（v0.5+）

---

#### 23. AI 整合的具體方式 🤖

**問題**: 如何利用收集的資料訓練 AI？

**規劃** (v1.0):
- 意圖識別模型
- 推薦系統模型
- 程式碼補全模型
- 錯誤檢測模型

**待探索**:
- 自編碼器（Autoencoder）訓練
- 收斂性分析資料收集
- 隱私保護機制

---

### v3.0 新增問題

以下是 v3.0 引入的新概念所帶來的待解決問題：

---

#### 24. 自然語言 L3 概念粒度 📝 **v3.0 新增**

**問題**: Natural Language 的 L3（表達式級）應該有多細？

**當前設計**:
- L3 = 概念片段（如 "使用者", "JWT token", "過期時間24小時"）

**選項**:
- A. **粗粒度** - 完整語義單元（"使用者認證使用JWT token，有效期24小時"）
- B. **中粒度** - 概念片段（"使用者", "JWT token", "有效期24小時"）— **當前選擇**
- C. **細粒度** - 單詞/短語級別（"使用者", "JWT", "token", "24", "小時"）

**待討論**:
- 太粗 → 難以組合和重用
- 太細 → 失去語義完整性
- 如何在靈活性與可理解性之間平衡？
- 不同領域（API spec vs. Algorithm spec）是否需要不同粒度？

---

#### 25. 概念類型系統的複雜度 🎯 **v3.0 新增**

**問題**: Concept Type 系統應該有多複雜？

**當前設計** (Phase 2):
```typescript
interface ConceptType {
  name: string;
  category: string;
  validation?: ValidationRule[];
  options?: string[];
}
```

**可能擴展** (Phase 3):
- 繼承關係（"RestMethod extends HttpMethod"）
- 組合關係（"Endpoint contains Method + Path + Request + Response"）
- 約束關係（"If Method=GET, then Request should be null"）

**待討論**:
- 需要完整的型別系統嗎？還是簡單的標籤就夠？
- 如何避免過度工程化？
- 使用者學習成本 vs. 表達能力？

---

#### 26. 概念圖譜的實作技術選擇 🕸️ **v3.0 新增**

**問題**: Knowledge Graph 應該用什麼技術實作？

**選項**:
- A. **輕量級** - JSON 物件圖 + 簡單查詢
- B. **中量級** - 圖資料庫（如 Neo4j Embedded）
- C. **重量級** - 完整圖資料庫（Neo4j Server, ArangoDB）

**考量**:
- **選項 A**: 簡單，但查詢能力有限
- **選項 B**: 平衡，但增加依賴
- **選項 C**: 強大，但複雜度和資源需求高

**待討論**:
- VS Code Extension 的資源限制
- 查詢需求的實際複雜度
- 是否需要支援 SPARQL 或 Cypher 查詢？

---

#### 27. Spec ↔ Code 對應的準確度閾值 🔗 **v3.0 新增**

**問題**: SpecKit 整合中，多少信心度才建立 Spec-Code 對應？

**當前設計**:
- 信心度 ≥ 0.85: 自動建立對應
- 信心度 0.6-0.85: 推薦給使用者確認
- 信心度 < 0.6: 不推薦

**待討論**:
- 閾值是否合適？
- 自動對應失敗的風險 vs. 減少使用者負擔
- 是否需要根據專案調整閾值？
- 是否需要「試用期」（provisional mapping）機制？

---

#### 28. Assembly/HDL 的 Blockly 表示 ⚙️ **v3.0 新增**

**問題**: 低階語言是否適合用 Blockly？

**挑戰**:
- Assembly: 需要精確控制暫存器、位址
- HDL: 需要表達時序、並行
- Blockly 的「拖放友善」與「精確控制」之間的張力

**選項**:
- A. **標準 Blockly** - 簡化表示，損失部分精確性
- B. **擴展 Blockly** - 客製化積木支援精確控制
- C. **混合模式** - Blockly 用於高層架構，文字用於低層細節

**待討論**:
- 目標使用者是誰？（初學者 vs. 專家）
- 「教學友善」vs. 「實用性」的優先順序
- 是否需要不同模式（簡化模式 vs. 專家模式）？

---

#### 29. Machine Code 的可編輯性 🔢 **v3.0 新增**

**問題**: Machine Code 形態應該允許編輯嗎？

**選項**:
- A. **唯讀** - Machine Code 僅供查看
- B. **有限編輯** - 允許修改指令參數，不允許新增/刪除
- C. **完全可編輯** - 支援完整的機器碼編輯

**考量**:
- Machine Code 通常是編譯結果，手動編輯風險高
- 某些優化場景需要手動調整機器碼
- 如何確保編輯後的 Machine Code 合法？

**待討論**:
- 目標場景（教學、逆向工程、優化）
- 編輯後如何同步回 Assembly/High-Level Code？
- 是否需要「專家模式」？

---

#### 30. 插件的安全性與沙箱 🔒 **v3.0 新增**

**問題**: 插件系統需要多強的安全性保護？

**風險**:
- 惡意插件可能存取檔案系統
- 惡意插件可能竊取程式碼
- 惡意插件可能影響編輯器穩定性

**選項**:
- A. **信任模式** - 不限制插件（僅官方/社群認證）
- B. **權限模式** - 插件需聲明權限，使用者審核
- C. **沙箱模式** - 插件在隔離環境執行

**待討論**:
- VS Code Extension API 的限制
- 使用者體驗 vs. 安全性
- 社群插件的審核機制

---

#### 31. 跨語言層級轉換的可行性 🌉 **v3.0 新增**

**問題**: 是否支援「跳躍式」轉換（如 Spec → HDL）？

**當前架構**:
```
Natural Language → High-Level → Low-Level → Machine → HDL → Physical
```

**「跳躍式」轉換範例**:
- Spec → HDL（直接描述硬體需求）
- Spec → Assembly（嵌入式系統）
- High-Level → HDL（高階綜合 HLS）

**挑戰**:
- 跨越多層，資訊損失更大
- 轉換準確度難以保證
- 需要領域專家知識

**待討論**:
- 哪些「跳躍式」轉換有實際需求？
- 是否透過「中間層級」的連續轉換實現？
- AI 輔助的必要性？

---

#### 32. 元資料的多語言支援 🌍 **v3.0 新增**

**問題**: 元資料（註解、設計理由）是否需要多語言？

**場景**:
- 國際團隊協作
- 模板社群分享
- 教學材料本地化

**選項**:
- A. **英文唯一** - 簡單，但限制非英語使用者
- B. **主+翻譯** - 主要語言 + 機器翻譯
- C. **多語言儲存** - 每個註解有多個語言版本

**待討論**:
- 儲存格式（單一檔案 vs. 分語言檔案）
- 翻譯品質保證
- UI 切換語言的方式

---

#### 33. 插件更新的向後兼容性 ♻️ **v3.0 新增**

**問題**: 插件更新時如何處理舊版模板？

**場景**:
- HDL Plugin 2.0 新增時序分析功能
- 舊模板使用 HDL Plugin 1.0 的資料格式
- 是否自動遷移？還是保持舊版？

**選項**:
- A. **自動遷移** - 嘗試自動轉換，失敗則通知
- B. **手動遷移** - 提示使用者逐一檢查並遷移
- C. **多版本共存** - 允許舊模板繼續使用舊插件

**待討論**:
- 遷移失敗的處理策略
- 是否需要插件的 Migration Script？
- 版本鎖定 vs. 自動更新

---

#### 34. Coding Agent 偏好與模板推薦 🤖 **v3.0 新增**

**問題**: 不同 Coding Agent（Claude, Copilot, Cursor）有不同風格，如何調整推薦？

**觀察**:
- Claude: 偏好詳細註解、完整錯誤處理
- Copilot: 偏好簡潔程式碼、常見模式
- Cursor: 偏好專案風格、上下文相關

**選項**:
- A. **統一推薦** - 不區分 Coding Agent
- B. **Agent Profile** - 為每個 Agent 設定偏好權重
- C. **學習式調整** - 根據 Agent 的實際選擇學習

**待討論**:
- 是否值得投資開發此功能？
- 使用者是否在意這種細節？
- Agent API 是否提供足夠資訊？

---

## 附錄

### A. 專有名詞對照表

| 英文 | 中文 | 說明 |
|------|------|------|
| Sequence Form | 文字形態 | 傳統的線性程式碼 |
| Structure Form | 積木形態 | Blockly 積木表示 |
| Topology Form | 圖譜形態 | 關係網絡表示 |
| Structuring | 結構化 | 文字 → 積木 |
| Serialization | 序列化 | 積木 → 文字 |
| Topologization | 圖譜化 | 其他 → 圖譜 |
| Sequentialization | 序列化 | 圖譜 → 文字 |
| Universal Block | 通用積木 | 跨語言積木 |
| Language-Specific Block | 語言特定積木 | 單一語言積木 |
| Granularity | 粒度 | 積木的詳細程度 |
| Convergence | 收斂 | 多次轉換趨於穩定 |
| Lossiness | 損失性 | 轉換中的資訊遺失 |

### B. 參考文獻

- [Blockly 官方文檔](https://developers.google.com/blockly)
- [AST Explorer](https://astexplorer.net/)
- [Graphviz](https://graphviz.org/)
- [TextBricks PRD](./PRD.md)
- [蛋白質結構（維基百科）](https://zh.wikipedia.org/wiki/蛋白質結構)
- [中心法則（Central Dogma）](https://zh.wikipedia.org/wiki/中心法則)

---

### C. 與 SpecKit 整合 🔗 **v3.0 新增**

> **v3.0 核心更新**：TextBricks 與 SpecKit 深度整合，支援完整的 Spec-Driven Development 工作流

#### C.1 SpecKit 簡介

**SpecKit** 是 GitHub 推出的規格驅動開發工具包，提供結構化的軟體開發流程：

```
/specify   → 撰寫規格 (spec.md)
   ↓
/implement → 實作功能 (根據 spec)
   ↓
/test      → 測試驗證 (確保符合 spec)
   ↓
/review    → 審查與迭代
```

**核心理念**：
- **Spec 是第一公民** - 所有開發從規格開始
- **AI 輔助實作** - Coding Agent 根據 spec 生成程式碼
- **規格即文檔** - spec.md 同時是需求、設計、測試規範
- **協作友善** - 清晰的規格降低溝通成本

**SpecKit 的局限**：
- ❌ 沒有規格模板系統（每次從空白開始）
- ❌ 沒有概念重用機制（重複描述相同概念）
- ❌ 缺乏 Spec ↔ Code 雙向同步
- ❌ 沒有視覺化工具（純文字）

**TextBricks 的補充價值**：
- ✅ Spec Template 系統（快速產生結構化規格）
- ✅ 概念管理系統（可重用的類型化概念）
- ✅ Spec ↔ Code 雙向對應
- ✅ 三形態視覺化（Sequence/Structure/Topology）

---

#### C.2 整合架構

**整體流程**：

```
┌─────────────────────────────────────────────────────────────┐
│                        SpecKit Workflow                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    /specify              /implement            /test
         │                    │                    │
         ↓                    ↓                    ↓
  ┌─────────────┐      ┌─────────────┐      ┌──────────┐
  │  TextBricks │      │  TextBricks │      │ SpecKit  │
  │ Spec Temple │──┬──→│ Code Temple │      │  Native  │
  │   建議系統   │  │   │   建議系統   │      │          │
  └─────────────┘  │   └─────────────┘      └──────────┘
         │         │          │
         │    Spec-Code       │
         │   對應關係追蹤      │
         │         │          │
         └─────────┴──────────┘
               ↓
        ┌─────────────┐
        │  Template   │
        │  Registry   │
        │ (統一管理)   │
        └─────────────┘
```

**TextBricks 的角色**：
1. **/specify 階段** - 提供 Spec Template 建議
2. **/implement 階段** - 根據 spec 推薦 Code Template
3. **持續追蹤** - 維護 Spec ↔ Code 對應關係
4. **視覺化** - 提供三形態查看與編輯

---

#### C.3 實際整合方式

##### 1. 目錄結構整合

```
project/
├── .speckit/                    # SpecKit 管理目錄
│   ├── specs/
│   │   ├── feature-a/
│   │   │   ├── spec.md         # 規格文件
│   │   │   └── .textbricks/    # TextBricks 擴充 ⭐
│   │   │       ├── template.json      # 使用的 Spec Template
│   │   │       ├── concepts.json      # 提取的概念
│   │   │       └── mappings.json      # Spec → Code 對應
│   │   └── feature-b/
│   │       └── ...
│   └── config.json
│
├── src/                         # 實作程式碼
│   ├── feature-a/
│   │   ├── implementation.py
│   │   └── .textbricks/        # TextBricks 擴充 ⭐
│   │       ├── templates.json  # 使用的 Code Template
│   │       └── mappings.json   # Code → Spec 對應
│   └── ...
│
└── .textbricks/                 # TextBricks 全局設定
    └── config.json
```

##### 2. /specify 階段整合

**場景**: 開發者執行 `/specify` 開始撰寫新功能規格

**TextBricks 介入點**:

```typescript
// SpecKit 呼叫鉤子
async onSpecifyPhaseStart(context: SpecifyContext) {
  const { featureName, featureType } = context;

  // 1. 根據功能類型推薦 Spec Template
  const recommendations = await textbricks.specTemplates.recommend({
    featureType,              // "rest-api", "algorithm", "data-model", etc.
    projectContext: context.project,
    recentSpecs: context.recentSpecs
  });

  // 2. 顯示建議給開發者
  return {
    templates: recommendations.map(t => ({
      id: t.id,
      name: t.name,
      preview: t.forms.sequence.content,
      confidence: t.score
    })),
    action: 'insert' | 'preview' | 'customize'
  };
}

// 開發者選擇 Template
async onTemplateSelected(templateId: string, context: SpecifyContext) {
  const template = await textbricks.registry.getById(templateId);

  // 1. 插入 Spec Template 到 spec.md
  const specContent = await textbricks.specTemplates.render(template, {
    variables: context.initialValues
  });

  // 2. 記錄使用的 Template
  await textbricks.tracking.recordSpecTemplateUsage({
    specPath: context.specPath,
    templateId,
    timestamp: Date.now()
  });

  // 3. 建立 .textbricks/ 擴充目錄
  await textbricks.extensions.createSpecExtension({
    specPath: context.specPath,
    template,
    concepts: template.concepts || []
  });

  return { content: specContent };
}
```

**使用者體驗**:

```bash
$ /specify create-user-endpoint

⚡ SpecKit 啟動 /specify 階段...
🧱 TextBricks 正在分析...

📋 建議的 Spec Templates:
  1. REST API Endpoint (95% 相關)
     - Method, Path, Request, Response 結構化欄位
     - 自動產生範例與測試案例

  2. CRUD Operation (87% 相關)
     - Create, Read, Update, Delete 完整流程

  3. Custom (空白模板)

選擇模板 [1-3]: 1

✅ 已插入 "REST API Endpoint" 模板到 spec.md
📝 請填寫以下欄位:
   - Endpoint Name: _______
   - HTTP Method: [GET/POST/PUT/DELETE]
   - Path: /api/_______
   - ...
```

##### 3. /implement 階段整合

**場景**: 開發者執行 `/implement` 開始實作功能

**TextBricks 介入點**:

```typescript
// SpecKit 呼叫鉤子
async onImplementPhaseStart(context: ImplementContext) {
  const { specPath } = context;

  // 1. 讀取 spec.md
  const spec = await fs.readFile(specPath, 'utf-8');

  // 2. 從 spec 中提取概念
  const concepts = await textbricks.nlp.extractConcepts(spec);

  // 3. 根據概念推薦 Code Templates
  const recommendations = await textbricks.codeTemplates.recommend({
    concepts,
    language: context.targetLanguage,
    framework: context.framework,
    specType: context.specType
  });

  return {
    templates: recommendations,
    suggestedWorkflow: [
      { step: 1, template: 'fastapi-route-handler', reason: '實作 API endpoint' },
      { step: 2, template: 'pydantic-request-model', reason: '定義 request schema' },
      { step: 3, template: 'database-query', reason: '資料庫操作' }
    ]
  };
}

// Coding Agent 選擇 Templates
async onCodeGeneration(templateIds: string[], context: ImplementContext) {
  const templates = await Promise.all(
    templateIds.map(id => textbricks.registry.getById(id))
  );

  // 1. 建立 Spec → Code 對應關係
  await textbricks.mapping.createSpecCodeMapping({
    specPath: context.specPath,
    codeFiles: context.targetFiles,
    templates
  });

  // 2. 記錄使用
  await textbricks.tracking.recordCodeTemplateUsage({
    specPath: context.specPath,
    templates,
    codingAgent: context.agent  // "Claude", "Copilot", etc.
  });

  return { mappings: [...] };
}
```

**使用者體驗**:

```bash
$ /implement create-user-endpoint

⚡ SpecKit 啟動 /implement 階段...
🧱 TextBricks 分析 spec.md...

📊 提取概念:
   - Method: POST
   - Path: /api/users
   - Request: { name, email, password }
   - Response: { id, name, email, created_at }

💡 建議 Code Templates (Python + FastAPI):
   1. FastAPI Route Handler (必要)
   2. Pydantic Request Model (必要)
   3. Database Query (建議)
   4. Error Handling (建議)

🤖 Coding Agent 開始實作...
   ✅ 已套用 Template #1: FastAPI Route Handler
   ✅ 已套用 Template #2: Pydantic Request Model
   ✅ 已套用 Template #3: Database Query

📝 已建立 Spec ↔ Code 對應關係
   spec.md:15-30 → src/routes/users.py:10-45
```

##### 4. 雙向同步機制

**Spec 變更 → Code 更新**:

```typescript
async onSpecChanged(specPath: string, changes: SpecChange[]) {
  // 1. 找出受影響的 Code 區塊
  const mappings = await textbricks.mapping.getMappingsBySpec(specPath);

  for (const mapping of mappings) {
    // 2. 分析變更影響
    const impact = await textbricks.analyzer.analyzeSpecChange({
      mapping,
      changes
    });

    if (impact.requiresCodeUpdate) {
      // 3. 通知開發者
      await textbricks.notifications.notifyCodeUpdateRequired({
        specPath,
        codeFile: mapping.codeFile,
        affectedLines: mapping.codeLines,
        suggestedUpdates: impact.suggestions
      });
    }
  }
}
```

**Code 變更 → Spec 更新建議**:

```typescript
async onCodeChanged(codeFile: string, changes: CodeChange[]) {
  // 1. 找出對應的 Spec
  const mappings = await textbricks.mapping.getMappingsByCode(codeFile);

  if (mappings.length === 0) {
    // 沒有對應 Spec，建議創建
    await textbricks.notifications.suggestSpecCreation(codeFile);
    return;
  }

  for (const mapping of mappings) {
    // 2. 檢測是否與 Spec 不一致
    const inconsistencies = await textbricks.analyzer.detectInconsistencies({
      mapping,
      codeChanges: changes
    });

    if (inconsistencies.length > 0) {
      // 3. 建議更新 Spec
      await textbricks.notifications.suggestSpecUpdate({
        specPath: mapping.specPath,
        inconsistencies,
        suggestedUpdates: textbricks.nlp.generateSpecUpdates(inconsistencies)
      });
    }
  }
}
```

---

#### C.4 技術實現細節

##### API 擴充點

```typescript
// TextBricks Plugin for SpecKit
interface SpecKitPlugin {
  name: 'textbricks-speckit-integration';
  version: '1.0.0';

  // 生命週期鉤子
  hooks: {
    // /specify 階段
    'specify:start': (context) => TemplateRecommendation[];
    'specify:template-selected': (templateId, context) => SpecContent;
    'specify:complete': (spec) => void;

    // /implement 階段
    'implement:start': (context) => CodeTemplateRecommendation[];
    'implement:template-applied': (templateId, context) => void;
    'implement:complete': (codeFiles) => void;

    // 變更監聽
    'spec:changed': (specPath, changes) => void;
    'code:changed': (codeFile, changes) => void;
  };

  // API
  api: {
    getSpecTemplates: (criteria) => Promise<SpecTemplate[]>;
    getCodeTemplates: (concepts, language) => Promise<CodeTemplate[]>;
    createMapping: (spec, code) => Promise<Mapping>;
    getMappings: (path) => Promise<Mapping[]>;
  };
}
```

##### 資料結構

```typescript
// Spec-Code 對應關係
interface SpecCodeMapping {
  id: string;

  // Spec 資訊
  specPath: string;
  specLines: { start: number; end: number };
  specTemplate?: string;

  // Code 資訊
  codeFile: string;
  codeLines: { start: number; end: number };
  codeTemplates: string[];

  // 對應關係
  mappingType: 'one-to-one' | 'one-to-many' | 'many-to-one';
  confidence: number;  // 0-1

  // 概念連結
  sharedConcepts: Concept[];

  // 元資料
  createdAt: Date;
  createdBy: 'user' | 'ai';
  lastVerified: Date;
  isValid: boolean;
}
```

---

#### C.5 未來展望

**Phase 1 (v0.6.0)**: 基礎整合
- Spec Template 建議
- Code Template 推薦
- 基本對應關係追蹤

**Phase 2 (v0.6.1-0.6.3)**: 深度整合
- 概念圖譜（Knowledge Graph）
- AI 輔助規格生成
- 多語言 Spec 支援

**Phase 3 (v1.0)**: 完整生態
- SpecKit 官方插件（需與 SpecKit 團隊合作）
- 社群 Spec Template 分享
- 企業級工作流定制

**潛在協作機會**:
- 與 SpecKit 團隊合作，成為官方推薦插件
- 貢獻 Spec Template 格式標準
- 共建 Spec ↔ Code 對應生態

---

### D. 生物學類比完整闡述 🧬

> **核心洞察**：「可以想像 DNA（sequence）、蛋白質四級結構（structure）、系統組織（topology）之間的關係」
>
> 這個類比不僅僅是個隱喻，而是揭示了**資訊在不同層次組織與表達**的普遍原理。

---

#### C.1 為什麼生物學類比如此精彩？

生物學中的資訊流動與程式碼的多形態轉換有著驚人的相似性：

```
生物學資訊流動：
DNA（序列）→ RNA（轉錄）→ 蛋白質（翻譯）→ 功能結構 → 細胞系統

程式碼資訊流動：
Code（序列）→ AST（解析）→ 積木（結構化）→ 功能模組 → 程式系統
```

兩者都涉及：
1. **資訊編碼** - DNA 用 ATCG，程式用字元
2. **結構折疊** - 蛋白質折疊成 3D 結構，程式碼組織成模組
3. **功能實現** - 蛋白質行使生物功能，程式執行計算任務
4. **系統組織** - 多個單元協同工作達成複雜目標

---

#### C.2 三形態的生物學對應

| 程式形態 | 生物學對應 | 本質 | 特性 |
|---------|-----------|------|------|
| **Sequence** (文字) | DNA / RNA 序列 | 線性資訊編碼 | 易於儲存、傳輸、複製 |
| **Structure** (積木) | 蛋白質結構 | 空間組織形態 | 功能單元、可組合、可互動 |
| **Topology** (圖譜) | 系統組織網絡 | 關係與互動 | 展現協作、依賴、流動 |

##### Sequence ↔ DNA/RNA

**DNA 序列**:
```
...ATGCGATCGTAGCTAGC...
```

**程式碼序列**:
```c
int main() { printf("Hello"); }
```

**共同特徵**:
- 線性排列
- 易於複製（基因複製 / 程式碼複製）
- 可壓縮儲存
- 需要「解讀」才能發揮功能

**差異**:
- DNA 僅有 4 種鹼基（A, T, C, G）
- 程式碼有更豐富的字元集和語法

---

##### Structure ↔ 蛋白質結構

**蛋白質四級結構**:

```
一級結構（Primary）    → 胺基酸序列（線性）
     ↓ 折疊
二級結構（Secondary）  → α-螺旋、β-摺板（局部結構）
     ↓ 進一步折疊
三級結構（Tertiary）   → 完整蛋白質 3D 形狀（單一鏈）
     ↓ 多鏈組合
四級結構（Quaternary） → 多個蛋白質亞基組成複合體
```

**對應的四級積木系統**:

```
L3 - 表達式級    → 一級結構（基本元素）
     ↓ 組合
L2 - 語句級      → 二級結構（局部功能單元）
     ↓ 組合
L1 - 模板級      → 三級結構（完整功能模組）
     ↓ 協作
L0 - 系統級      → 四級結構（多模組系統）
```

**對應細節**:

| 蛋白質 | 程式積木 | 功能 |
|--------|---------|------|
| **一級結構**: 胺基酸序列 | **L3**: 表達式 `x + 1`, `arr[i]` | 最基本的資訊單元 |
| **二級結構**: α-螺旋、β-摺板 | **L2**: `for`, `if`, `function` | 局部功能結構 |
| **三級結構**: 完整蛋白質 | **L1**: 完整程式模板 | 獨立功能單元 |
| **四級結構**: 蛋白質複合體 | **L0**: 多模組系統 | 複雜協同系統 |

**關鍵洞察**:
- 蛋白質的**折疊**（folding）對應積木的**摺疊**（collapse）
- 多肽鏈的**展開**（unfold）對應積木的**展開**（expand）
- 二級結構的**功能域**對應 L2 的**控制結構**
- 四級結構的**亞基**對應 L0 的**模板組合**

---

##### Topology ↔ 系統組織

**生物系統網絡**:
```
蛋白質交互網絡 (PPI Network)
代謝通路網絡 (Metabolic Pathways)
基因調控網絡 (Gene Regulatory Network)
```

**程式系統圖譜**:
```
Call Graph（呼叫圖）
Data Flow（數據流圖）
Dependency Graph（依賴圖）
```

**共同特徵**:
- 節點代表功能單元（蛋白質/函式）
- 邊代表關係（互動/呼叫）
- 揭示系統層級的組織
- 可分析關鍵路徑、瓶頸、循環

---

#### C.3 轉換過程的生物學對應

##### DNA → 蛋白質（中心法則）

```
DNA ──轉錄→ RNA ──翻譯→ 蛋白質 ──折疊→ 功能結構
 ↑_________________________________↓
          （反向工程：極困難）
```

**特性**:
- **資訊損失**: DNA 包含內含子（introns），翻譯時會被移除
- **一對多映射**: 同一段 DNA 可產生不同蛋白質（選擇性剪接）
- **不可逆**: 無法從蛋白質完全還原 DNA（序列退化）
- **折疊問題**: 蛋白質折疊是 NP-hard 問題

##### Code → Block（結構化）

```
Code ──解析→ AST ──結構化→ Block ──摺疊→ 功能模組
 ↑_____________________________________↓
          （反向工程：可能但有損失）
```

**對應**:
- **資訊損失**: 格式、註解可能遺失
- **一對多映射**: 同一段程式碼可對應多種積木組合
- **近似可逆**: 可以還原，但可能失去格式細節
- **摺疊問題**: 決定如何組合積木為高階模組是複雜的

---

#### C.4 「伴侶蛋白」與 Transformation Assistant

**伴侶蛋白（Chaperone Protein）**:
- 當蛋白質折疊過程複雜時，需要伴侶蛋白輔助
- 防止錯誤折疊（misfolding）
- 引導正確的折疊路徑
- 範例：熱休克蛋白（Heat Shock Protein）

**Transformation Assistant**:
- 當程式形態轉換複雜時，需要助手輔助
- 防止錯誤轉換（incorrect transformation）
- 提供多種轉換選項
- 學習使用者偏好

**類比**:

| 伴侶蛋白 | Transformation Assistant |
|---------|--------------------------|
| 識別折疊困難的蛋白質 | 識別低信心度的轉換（< 0.9） |
| 提供穩定環境避免聚集 | 提供互動介面避免錯誤選擇 |
| 引導正確折疊路徑 | 推薦合適的轉換選項 |
| ATP 驅動（需要能量） | 計算資源驅動 |

---

#### C.5 資訊損失與必要的抽象

**生物學視角**:

在 DNA → 蛋白質的過程中，並非所有資訊都保留：

```
DNA: ...ATGCGATCGTAGCTAGCTAAGTAG...
      ↓ （移除內含子、調控序列）
mRNA: ...AUGCGAUCGUAGCUAGCUAAGUAG...
      ↓ （三聯體密碼子 → 胺基酸）
蛋白質: Met-Arg-Ser-*（僅保留必要資訊）
```

**關鍵洞察**:
> **損失是必要的抽象** - 不是所有細節都重要，抽象化的本質就是有選擇性的遺忘。

**對應到程式轉換**:

```c
// 原始 C 程式碼（保留格式、註解）
for(int i = 0; i < 10; i++) {  // 迴圈 10 次
    printf("%d\n", i);
}

↓ （結構化：遺失格式和註解）

[universal_for_loop]
  iterator: i
  start: 0
  end: 9
  body: [print] i

↓ （序列化：生成 Python，格式不同）

for i in range(10):
    print(i)
```

**遺失的資訊**:
- ✗ 註解「迴圈 10 次」
- ✗ 原始格式（縮排、空行）
- ✗ C 特定語法（`int i = 0`）

**保留的資訊**:
- ✓ 核心邏輯（迴圈 0-9）
- ✓ 功能語義（印出數字）
- ✓ 控制流結構

**結論**: 就像 DNA 的非編碼區域在翻譯時被忽略，程式碼的「非本質資訊」在轉換時可以合理遺失。

---

#### C.6 收斂性與 Autoencoder 類比

**蛋白質折疊的穩定狀態**:

蛋白質會折疊至**能量最低的穩定狀態**：

```
隨機肽鏈 → 折疊過程 → 穩定結構 ↺ （維持穩定）
         （能量下降）
```

特性：
- 給定序列 → 特定的穩定結構（幾乎唯一）
- 穩定結構會自我維持
- 外力擾動後會回到穩定狀態

**程式多形態轉換的收斂**:

```
Code → Structure → Topology → Structure → Code → ...
                    ↓
              收斂至穩定形態
```

**Autoencoder 視角**:

```
     Encoder                 Decoder
Code ────────→ Latent Space ────────→ Code'
     （壓縮）                  （重建）

理想情況：Code ≈ Code'（語義等價）
```

**收斂條件**:
- **語義保持**: 核心邏輯不變
- **結構穩定**: 識別出的模式一致
- **損失收斂**: 每次轉換的損失趨於零

**實際應用**:
- 測試收斂性：多次 Code → Block → Code 是否穩定
- 訓練資料：收集「穩定對」作為訓練資料
- 品質指標：收斂速度反映轉換品質

---

#### C.7 專有名詞的「去生物學化」

雖然生物學類比提供了深刻洞察，但在實際開發中，我們應使用**中性、直觀的術語**，避免讓非生物背景的開發者困惑。

**建議的術語對應**:

| 生物學術語 | 中性術語（建議使用） | 說明 |
|-----------|---------------------|------|
| Chaperone Protein（伴侶蛋白） | Transformation Assistant | 轉換輔助工具 |
| Primary Structure（一級結構） | Expression Level (L3) | 表達式層級 |
| Secondary Structure（二級結構） | Statement Level (L2) | 語句層級 |
| Tertiary Structure（三級結構） | Template Level (L1) | 模板層級 |
| Quaternary Structure（四級結構） | System Level (L0) | 系統層級 |
| Folding（折疊） | Collapse / Fold | 摺疊 |
| Unfolding（展開） | Expand | 展開 |
| Misfolding（錯誤折疊） | Incorrect Transformation | 錯誤轉換 |
| Genome（基因組） | Template Collection | 模板集合 |
| Gene Expression（基因表現） | Template Instantiation | 模板實例化 |

**使用原則**:
1. **文檔中**: 可以提及生物學類比作為**解釋和啟發**
2. **程式碼中**: 一律使用**中性術語**
3. **UI 中**: 避免生物學術語，使用**通俗易懂的描述**

**範例**:

❌ **不建議**（過度生物學化）:
```typescript
class ChaperoneProtein {
  unfoldQuaternaryStructure(genome: DNA): PrimaryStructure {}
}
```

✅ **建議**（清晰中性）:
```typescript
class TransformationAssistant {
  expandSystemLevel(templates: TemplateCollection): ExpressionList {}
}
```

---

#### C.8 生物學類比的限制與差異

雖然類比很精彩，但我們必須認識到**程式系統與生物系統的本質差異**：

| 面向 | 生物系統 | 程式系統 |
|-----|---------|---------|
| **確定性** | 隨機與概率（量子效應） | 確定性（理想情況） |
| **可逆性** | 幾乎不可逆（熵增） | 可以設計為可逆 |
| **錯誤處理** | 演化與自然選擇 | 明確的錯誤處理邏輯 |
| **複雜度來源** | 數十億年演化累積 | 人為設計與組合 |
| **優化目標** | 生存與繁殖 | 功能需求與效能 |
| **變異機制** | 突變（隨機） | 重構（有意圖） |

**關鍵差異**:

1. **意圖 vs. 演化**
   - 生物：無設計者，演化而來
   - 程式：有明確設計意圖

2. **容錯性**
   - 生物：高度容錯（冗餘機制）
   - 程式：通常需要精確無誤

3. **時間尺度**
   - 生物：百萬年演化
   - 程式：數年或數十年發展

**結論**:
> 生物學類比是**啟發性的**（heuristic），而非**精確對應**（exact mapping）。它幫助我們理解資訊組織的普遍模式，但不應限制我們的設計思維。

---

#### C.9 從類比中學到的設計原則

生物學類比給我們的啟示：

##### 1. 分層組織的力量

**生物**: DNA → RNA → 蛋白質 → 細胞 → 組織 → 器官
**程式**: Code → AST → Block → Module → System

**啟示**:
- 每一層都有其**最適表達形態**
- 跨層轉換需要**中介機制**
- 層級之間要**明確界線**

##### 2. 資訊壓縮與展開

**生物**: 基因組（3GB）→ 蛋白質組（更複雜）→ 生命活動
**程式**: Template（簡潔）→ 實例化（具體）→ 執行

**啟示**:
- **模板是壓縮**的知識
- **實例化是展開**的過程
- 需要平衡**壓縮率與可理解性**

##### 3. 容錯與冗餘

**生物**: 同義密碼子、DNA 修復機制、冗餘基因
**程式**: 錯誤處理、降級方案、備份機制

**啟示**:
- 關鍵轉換需要**多重驗證**
- 提供**降級選項**（fallback）
- 容忍**小範圍的資訊損失**

##### 4. 協同與模組化

**生物**: 蛋白質複合體協同工作
**程式**: 模組化設計、微服務架構

**啟示**:
- **L0 系統級**設計很重要
- 模組間需要**明確介面**
- 支援**動態組合**

##### 5. 演化與漸進

**生物**: 物種逐步演化，非一蹴而就
**程式**: 從 v0.3 → v0.4 → v0.5，逐步完善

**啟示**:
- **不要試圖一次做完**所有功能
- 保持**向後兼容性**
- 允許**漸進式遷移**

---

#### C.10 類比在教學中的應用

生物學類比對**初學者教學**特別有價值：

**場景 1: 解釋「為什麼有三種形態」**

老師：
> 「想像 DNA 和蛋白質。DNA 是文字序列，像程式碼一樣線性排列，易於儲存和複製。但蛋白質會折疊成立體結構，才能發揮功能——就像積木一樣，組合起來才有實際用途。而生物系統中，許多蛋白質協同工作形成網絡，就像程式的呼叫圖一樣！」

**場景 2: 解釋「展開與摺疊」**

老師：
> 「蛋白質有四級結構。當我們展開一個複雜蛋白質時，會看到它的組成部分——就像展開一個 L1 積木，看到裡面的 L2 語句。這幫助我們理解『大積木』是怎麼由『小積木』組成的！」

**場景 3: 解釋「資訊損失」**

老師：
> 「從 DNA 到蛋白質，有些資訊會遺失——例如內含子被移除了。但這不是壞事！就像翻譯程式碼時，註解可能消失，但核心邏輯保留了。我們要的是『功能等價』，而不是『完全一致』。」

**場景 4: 解釋「Transformation Assistant」**

老師：
> 「有些蛋白質折疊很複雜，需要『伴侶蛋白』幫忙——它們不參與最終結構,只是輔助折疊過程。同樣地，當程式碼轉換很複雜時，我們的 Transformation Assistant 會跳出來協助你選擇最適合的方案！」

---

#### C.11 總結：為什麼這個類比如此重要

生物學類比不只是一個有趣的比喻，它揭示了：

1. **普遍性**: 資訊在不同層次組織的模式是跨領域的
2. **深刻性**: 幫助理解「為何需要多形態」而非「如何實作多形態」
3. **啟發性**: 引導設計決策（如四級積木、展開摺疊、Transformation Assistant）
4. **教學性**: 提供直觀的解釋框架，降低學習門檻
5. **前瞻性**: 類比到 AI（如 Autoencoder、收斂性）預示未來發展方向

**最終洞察**:

> 程式碼不僅是**指令序列**，更是**可以在多個層次組織和表達的資訊**。
> 理解這一點，就理解了 TextBricks 多形態架構的核心哲學。

**用戶的精彩引言**:
> "可以想像 DNA（sequence）、蛋白質四級結構（structure）、系統組織（topology）之間的關係"

這句話開啟了一個全新的視角，讓我們看到程式設計的本質——
**資訊的層次化組織與多形態表達**。🧬 → 🧱 → 🌐

---

**版本歷史**:
- **v1.0** (2025-10-20): 初版，完整架構設計
- **v2.0** (2025-10-20): 重大更新
  - 四級積木系統 (L0/L1/L2/L3)
  - 積木展開摺疊機制
  - 圖譜系統：混合互動模式 + 六種布局算法
  - Transformation Assistant（受伴侶蛋白啟發）
  - 對應關係管理系統
  - Template Registry
  - v0.3.2 決策：暫緩實施，直接進入 v0.4.0
  - 更新實施路線圖（v0.4.0 重新設計）
  - 23 個開放問題詳細分析
  - 生物學類比完整闡述（附錄 C）
  - 專有名詞去生物學化（正文使用中性術語）

**下一步**:
1. ✅ 完成架構設計文檔 v2.0
2. ✅ 加入生物學類比完整闡述（附錄 C）
3. ✅ 統一專有名詞（去生物學化）
4. 💬 與團隊討論 23 個開放問題
5. 📋 根據討論結果更新設計
6. 🚀 開始 v0.4.0 實作準備

**文檔統計**:
- 總行數：約 6,000+ 行
- 主要章節：14 個
- 新增章節：4 個（展開摺疊、Transformation Assistant、對應關係、Registry）
- 開放問題：23 個（含原有 7 個 + 新增 16 個）
- 附錄：3 個（專有名詞、參考文獻、生物學類比）
