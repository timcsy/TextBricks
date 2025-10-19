# TextBricks Scope 資料夾撰寫完整指南

本指南詳細說明如何在 TextBricks 中建立和管理 Scope 資料夾結構，包含所有 JSON 檔案格式和組織方式。

> **資料位置**：
> - **macOS**: `~/Library/Application Support/TextBricks/scopes/`
> - **Windows**: `%APPDATA%\TextBricks\scopes\`
> - **Linux**: `~/.config/TextBricks/scopes/`

---

## 📋 目錄

1. [Scope 概念與架構](#scope-概念與架構)
2. [目錄結構規範](#目錄結構規範)
3. [檔案格式詳解](#檔案格式詳解)
   - [scope.json - Scope 配置](#scopejson---scope-配置)
   - [topic.json - 主題配置](#topicjson---主題配置)
   - [template JSON - 模板檔案](#template-json---模板檔案)
   - [link JSON - 連結檔案](#link-json---連結檔案)
4. [建立完整 Scope 範例](#建立完整-scope-範例)
5. [路徑識別系統](#路徑識別系統)
6. [最佳實踐](#最佳實踐)
7. [常見問題](#常見問題)

---

## Scope 概念與架構

### 什麼是 Scope？

**Scope（範圍）** 是 TextBricks 的核心組織單位，用於管理不同來源和信任度的模板集合。

**主要用途**：
- **信任度管理** - 區分可信任的本地內容和外部來源
- **內容隔離** - 個人模板、團隊模板、課程模板分開管理
- **情境切換** - 不同專案或學習場景使用不同的模板集
- **分享與協作** - 匯出整個 Scope 給他人使用

**Scope 類型**：
- **local scope** - 使用者絕對信任的本地內容（預設）
- **team scope** - 團隊共享的模板集
- **course scope** - 教師為課程建立的模板集
- **community scope** - 社群分享的模板集（未來功能）

### 階層式主題系統

TextBricks 使用**路徑基礎**的階層組織：

```
scopes/
└── local/                          # Scope 根目錄
    ├── scope.json                  # Scope 配置檔案
    ├── c/                          # 語言作為頂層主題
    │   ├── topic.json              # C 語言主題配置
    │   ├── templates/              # C 語言的直接模板（可選）
    │   ├── links/                  # C 語言的直接連結（可選）
    │   ├── basic/                  # 子主題：基礎語法
    │   │   ├── topic.json
    │   │   ├── templates/          # 基礎語法模板
    │   │   │   ├── hello-world.json
    │   │   │   └── variables.json
    │   │   └── links/              # 基礎語法連結
    │   │       └── python-basic.json
    │   └── advanced/               # 子主題：進階概念
    │       ├── topic.json
    │       └── templates/
    │           └── pointers.json
    ├── python/                     # 另一個頂層主題
    │   ├── topic.json
    │   └── templates/
    └── algorithms/                 # 語言無關的主題（可選）
        ├── sorting/
        └── searching/
```

**設計特點**：
- ✅ **無限嵌套** - 支援任意深度的子主題
- ✅ **彈性組織** - 可按語言、概念、專案等多種方式組織
- ✅ **路徑識別** - 使用檔案路徑作為唯一識別（如 `c/basic/templates/hello-world`）
- ✅ **語言中立** - 不限定必須按語言組織

---

## 目錄結構規範

### 基本規則

1. **Scope 根目錄**
   - 必須包含 `scope.json`
   - 直接子目錄為頂層主題（通常是語言）

2. **主題目錄**
   - 必須包含 `topic.json`
   - 可包含子目錄 `subtopics/`（在 topic.json 中聲明）
   - 可包含 `templates/` 目錄存放模板
   - 可包含 `links/` 目錄存放連結

3. **檔案命名**
   - 使用 **kebab-case** 格式（小寫字母，連字符分隔）
   - 範例：`hello-world.json`、`for-loop.json`、`object-oriented.json`

4. **必要檔案**
   - Scope 根目錄：`scope.json`（必需）
   - 每個主題目錄：`topic.json`（必需）
   - 模板檔案：`templates/xxx.json`（可選）
   - 連結檔案：`links/xxx.json`（可選）

### 完整目錄範例

```
scopes/
└── local/                                  # Scope ID
    ├── scope.json                          # ✅ Scope 配置（必需）
    │
    ├── c/                                  # 頂層主題：C 語言
    │   ├── topic.json                      # ✅ 主題配置（必需）
    │   ├── templates/                      # C 語言的直接模板
    │   │   └── main-function.json
    │   ├── links/                          # C 語言的直接連結
    │   │   └── advanced-pointer.json
    │   │
    │   ├── basic/                          # 子主題：基礎
    │   │   ├── topic.json                  # ✅ 子主題配置
    │   │   ├── templates/
    │   │   │   ├── hello-world.json
    │   │   │   └── variables.json
    │   │   └── links/
    │   │       └── python-basic.json
    │   │
    │   └── advanced/                       # 子主題：進階
    │       ├── topic.json
    │       ├── templates/
    │       │   ├── pointers.json
    │       │   └── memory-management.json
    │       └── links/
    │           └── data-structures.json
    │
    ├── python/                             # 頂層主題：Python
    │   ├── topic.json
    │   ├── templates/
    │   │   ├── hello-world.json
    │   │   └── variables.json
    │   └── links/
    │
    └── algorithms/                         # 頂層主題：演算法（語言無關）
        ├── topic.json
        ├── sorting/                        # 子主題：排序
        │   ├── topic.json
        │   └── templates/
        │       ├── bubble-sort.json
        │       └── quick-sort.json
        └── searching/                      # 子主題：搜尋
            ├── topic.json
            └── templates/
                └── binary-search.json
```

---

## 檔案格式詳解

### scope.json - Scope 配置

**位置**：`scopes/{scope-id}/scope.json`

**用途**：定義 Scope 的基本資訊、語言支援和頂層主題列表。

#### 完整範例

```json
{
  "name": "local",
  "title": "本機範圍",
  "description": "本機開發環境的程式語言模板和主題",

  "languages": [
    {
      "name": "c",
      "title": "C 語言",
      "tagName": "C",
      "description": "系統程式設計語言",
      "fileExtensions": [".c", ".h"],
      "icon": "⚙️",
      "color": "#A8B9CC"
    },
    {
      "name": "python",
      "title": "Python",
      "tagName": "PY",
      "description": "高階程式設計語言",
      "fileExtensions": [".py", ".pyw"],
      "icon": "🐍",
      "color": "#3776AB"
    },
    {
      "name": "javascript",
      "title": "JavaScript",
      "tagName": "JS",
      "description": "網頁前端程式設計語言",
      "fileExtensions": [".js", ".mjs", ".jsx"],
      "icon": "📜",
      "color": "#F7DF1E"
    }
  ],

  "topics": [
    "c",
    "python",
    "javascript"
  ],

  "favorites": [
    "c/basic/templates/hello-world",
    "python/templates/variables",
    "c/advanced"
  ],

  "usage": {
    "c/basic/templates/hello-world": 17,
    "python/templates/hello-world": 12,
    "javascript/templates/hello-world": 8,
    "c/basic/templates/variables": 11
  }
}
```

#### 欄位說明

| 欄位 | 類型 | 必需 | 說明 |
|------|------|------|------|
| **name** | string | ✅ | Scope 唯一識別符（與資料夾名稱相同） |
| **title** | string | ✅ | Scope 顯示標題 |
| **description** | string | ✅ | Scope 說明 |
| **languages** | array | ✅ | 支援的程式語言列表 |
| **topics** | array | ✅ | 頂層主題列表（對應直接子資料夾） |
| **favorites** | array | ❌ | 收藏的項目路徑列表（系統自動管理） |
| **usage** | object | ❌ | 使用次數統計（系統自動管理） |

#### languages 陣列

每個語言物件包含：

```json
{
  "name": "c",                    // 語言 ID（小寫，用於路徑）
  "title": "C 語言",              // 顯示名稱
  "tagName": "C",                 // 標籤名稱（UI 顯示）
  "description": "系統程式設計語言",
  "fileExtensions": [".c", ".h"], // 檔案副檔名列表
  "icon": "⚙️",                   // 圖示（emoji 或圖示名稱）
  "color": "#A8B9CC"              // 主題顏色（CSS 色碼）
}
```

**新欄位說明**（v0.3.0+）：
- **icon**：現在支援 emoji（如 `"⚙️"`, `"🐍"`, `"📜"`）或圖示名稱
- **color**：語言的代表色，用於 UI 標籤顯示

#### topics 陣列

**格式**：頂層主題名稱的字串陣列

```json
"topics": [
  "c",           // 對應 c/ 資料夾
  "python",      // 對應 python/ 資料夾
  "javascript"   // 對應 javascript/ 資料夾
]
```

**注意**：
- 只包含直接子主題的名稱
- 順序決定 UI 中的顯示順序
- 主題必須存在對應的資料夾和 topic.json
- 通常與 languages 對應，但也可以包含語言無關的主題（如 `algorithms`）

#### favorites 陣列

**格式**：收藏項目的路徑字串陣列

```json
"favorites": [
  "c/basic/templates/hello-world",   // 模板路徑
  "python/templates/variables",      // 模板路徑
  "c/advanced",                       // 主題路徑
  "algorithms/sorting"                // 主題路徑
]
```

**說明**：
- **路徑格式**：不包含 scope ID 前綴
  - 模板：`topic/subtopic.../templates/template-name`
  - 主題：`topic/subtopic...`
- **自動管理**：由系統自動維護，當使用者在 UI 中點擊收藏/取消收藏時更新
- **用途**：
  - 在 Templates Panel 顯示「我的最愛」區域
  - 快速存取常用模板和主題
- **手動編輯**：可以手動編輯來預設收藏項目，但使用者操作會覆蓋

#### usage 物件

**格式**：`{ "路徑": { "count": 使用次數, "lastUsedAt": 最後使用時間 } }`

```json
"usage": {
  "c/basic/templates/hello-world": {
    "count": 17,
    "lastUsedAt": "2025-10-19T12:34:56.789Z"
  },
  "python/templates/hello-world": {
    "count": 12,
    "lastUsedAt": "2025-10-18T09:21:43.123Z"
  },
  "c/basic/templates/variables": {
    "count": 11,
    "lastUsedAt": "2025-10-17T14:56:32.456Z"
  }
}
```

**說明**：
- **記錄內容**：追蹤每個模板的使用次數和最後使用時間
- **數據結構**：每個項目包含：
  - `count`：使用次數（number）
  - `lastUsedAt`：最後使用時間（ISO 8601 格式字串）
- **自動更新**：每次插入模板時自動更新計數和時間戳
- **用途**：
  - 生成「推薦模板」列表（結合頻率和時間）
  - 排序搜尋結果（按使用頻率）
  - 提供使用統計資訊
  - 追蹤最近使用的模板
- **重置統計**：可以透過 TextBricks Manager 清空使用記錄
- **不建議手動編輯**：系統會覆蓋手動修改

**使用統計的應用**：

1. **推薦演算法**：結合使用次數和最近使用時間，計算推薦分數
2. **搜尋排序**：可以按 `usage` 排序搜尋結果
3. **數據分析**：透過 `ScopeManager.getUsageStats()` 獲取統計資訊

```typescript
// 取得使用統計
const stats = scopeManager.getUsageStats();
// 輸出:
// {
//   totalUsage: 48,
//   topUsed: [
//     { path: "c/basic/templates/hello-world", usage: 17 },
//     { path: "python/templates/hello-world", usage: 12 },
//     ...
//   ],
//   favoritesCount: 4
// }

// 取得特定模板的使用次數
const count = scopeManager.getUsageCount("c/basic/templates/hello-world");
// 輸出: 17

// 取得最後使用時間
const lastUsed = scopeManager.getLastUsedAt("c/basic/templates/hello-world");
// 輸出: Date object
```

---

### topic.json - 主題配置

**位置**：`scopes/{scope-id}/{topic-path}/topic.json`

**用途**：定義主題的顯示資訊、子主題結構和文檔內容。

#### 完整範例

```json
{
  "type": "topic",
  "name": "c",
  "title": "C 語言",
  "description": "C 語言的基本語法和概念",

  "documentation": "# C 語言\n\n## 主題簡介\nC 語言是一種通用的程式語言...\n\n## 內容概覽\n- 基礎語法\n- 控制結構\n- 函數與指標",

  "templates": "templates",
  "links": "links",

  "subtopics": [
    "basic",
    "advanced"
  ],

  "display": {
    "icon": "⚙️",
    "color": "#A8B9CC",
    "order": 1,
    "collapsed": false,
    "showInNavigation": true
  }
}
```

#### 欄位說明

| 欄位 | 類型 | 必需 | 說明 |
|------|------|------|------|
| **type** | string | ✅ | 固定為 `"topic"` |
| **name** | string | ✅ | 主題名稱（與資料夾名稱相同） |
| **title** | string | ✅ | 主題顯示標題 |
| **description** | string | ✅ | 主題簡短描述 |
| **documentation** | string/object | ❌ | Markdown 文檔（字串或物件格式） |
| **templates** | string | ❌ | 模板目錄名稱（通常為 `"templates"`） |
| **links** | string | ❌ | 連結目錄名稱（通常為 `"links"`） |
| **subtopics** | array | ❌ | 子主題名稱列表 |
| **display** | object | ❌ | 顯示設定 |

#### documentation 欄位

**支援兩種格式**（v0.3.0+）：

**格式 1：字串（簡單格式）**
```json
{
  "documentation": "# 標題\n\n內容..."
}
```

**格式 2：物件（進階格式）**
```json
{
  "documentation": {
    "type": "markdown",
    "content": "# 標題\n\n內容..."
  }
}
```

或引用外部檔案：
```json
{
  "documentation": {
    "type": "file",
    "path": "README.md"
  }
}
```

或連結到 URL：
```json
{
  "documentation": {
    "type": "url",
    "url": "https://example.com/docs"
  }
}
```

#### subtopics 陣列

**格式**：子主題資料夾名稱的字串陣列

```json
"subtopics": [
  "basic",      // 對應 basic/ 資料夾
  "advanced",   // 對應 advanced/ 資料夾
  "practice"    // 對應 practice/ 資料夾
]
```

**注意**：
- 只包含直接子主題的名稱
- 順序決定 UI 中的顯示順序
- 子主題必須存在對應的資料夾和 topic.json

#### display 物件

```json
"display": {
  "icon": "⚙️",              // 主題圖示（emoji 或圖示名稱）
  "color": "#A8B9CC",        // 主題顏色（CSS 色碼）
  "order": 1,                // 排序順序（數字越小越前面）
  "collapsed": false,        // 預設是否摺疊
  "showInNavigation": true   // 是否在導航中顯示
}
```

**常用圖示範例**：
- 📚 基礎
- 🎯 進階
- 🚀 實戰
- ⚙️ 系統
- 🔧 工具
- 💡 技巧

---

### template JSON - 模板檔案

**位置**：`scopes/{scope-id}/{topic-path}/templates/{template-name}.json`

**用途**：儲存單一程式碼模板的內容和元資料。

#### 完整範例

```json
{
  "type": "template",
  "name": "hello-world",
  "title": "Hello World",
  "description": "基本的 Hello World 程式",
  "language": "c",

  "code": "#include <stdio.h>\n\nint main() {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}",

  "documentation": "## Hello World\n\n這是最基本的 C 程式，用來輸出 \"Hello, World!\" 訊息。\n\n### 程式說明\n\n1. `#include <stdio.h>` - 引入標準輸入輸出函式庫\n2. `int main()` - 主函數\n3. `printf()` - 輸出函數\n4. `return 0` - 正常結束程式\n\n### 使用方式\n\n```bash\ngcc hello.c -o hello\n./hello\n```"
}
```

#### 欄位說明

| 欄位 | 類型 | 必需 | 說明 |
|------|------|------|------|
| **type** | string | ✅ | 固定為 `"template"` |
| **name** | string | ✅ | 模板名稱（與檔案名稱相同） |
| **title** | string | ✅ | 模板顯示標題 |
| **description** | string | ✅ | 模板簡短描述 |
| **language** | string | ✅ | 程式語言（需在 scope.json 中定義） |
| **code** | string | ✅ | 程式碼內容 |
| **documentation** | string | ❌ | Markdown 格式的詳細文檔 |

#### code 欄位處理

**換行符號**：使用 `\n` 表示換行

```json
{
  "code": "line1\nline2\nline3"
}
```

**特殊字符轉義**：
- `\"` - 雙引號
- `\\` - 反斜線
- `\n` - 換行
- `\t` - Tab

**範例**：

```json
{
  "code": "#include <stdio.h>\n\nint main() {\n\tprintf(\"Hello, World!\\n\");\n\treturn 0;\n}"
}
```

顯示為：
```c
#include <stdio.h>

int main() {
	printf("Hello, World!\n");
	return 0;
}
```

---

### link JSON - 連結檔案

**位置**：`scopes/{scope-id}/{topic-path}/links/{link-name}.json`

**用途**：建立主題間的導航連結，方便使用者在相關主題間切換。

#### 完整範例

```json
{
  "type": "link",
  "name": "python-basic",
  "title": "Python 基礎",
  "target": "python",
  "description": "切換到 Python 語言學習",
  "language": "python"
}
```

#### 欄位說明

| 欄位 | 類型 | 必需 | 說明 |
|------|------|------|------|
| **type** | string | ✅ | 固定為 `"link"` |
| **name** | string | ✅ | 連結名稱（與檔案名稱相同） |
| **title** | string | ✅ | 連結顯示標題 |
| **target** | string | ✅ | 目標主題路徑 |
| **description** | string | ✅ | 連結說明 |
| **language** | string | ❌ | 語言標籤（用於顯示） |

#### target 路徑格式

**絕對路徑**：從 scope 根目錄開始

```json
{
  "target": "python/basic"          // 指向 python/basic/
}
```

**相對路徑**：從當前主題開始

```json
{
  "target": "../advanced"           // 指向同層的 advanced/
}
```

**範例**：

在 `c/basic/links/` 中建立連結：

```json
{
  "type": "link",
  "name": "c-advanced",
  "title": "C 進階概念",
  "target": "../advanced",          // 相對路徑：c/advanced
  "description": "學習指標和記憶體管理"
}
```

```json
{
  "type": "link",
  "name": "python-basics",
  "title": "Python 基礎",
  "target": "python/basic",         // 絕對路徑：python/basic
  "description": "切換到 Python 學習",
  "language": "python"
}
```

---

## 建立完整 Scope 範例

### 情境：建立課程 Scope

假設您是教師，想為「程式設計入門」課程建立專屬的模板集。

#### Step 1: 建立 Scope 目錄

```bash
cd ~/Library/Application\ Support/TextBricks/scopes
mkdir course-intro-2024
cd course-intro-2024
```

#### Step 2: 建立 scope.json

`course-intro-2024/scope.json`：

```json
{
  "id": "course-intro-2024",
  "name": "程式設計入門 2024",
  "description": "2024 年度程式設計入門課程模板",

  "languages": [
    {
      "name": "python",
      "title": "Python",
      "tagName": "PYTHON",
      "description": "Python 3.x",
      "fileExtensions": [".py"],
      "icon": "file-code"
    }
  ],

  "favorites": [],
  "usage": {},

  "settings": {
    "autoSync": false,
    "readOnly": true,
    "shareMode": "course",
    "autoBackup": true
  },

  "metadata": {
    "version": "1.0.0",
    "created": "2024-09-01",
    "author": "Professor Chen",
    "course": "CS101",
    "semester": "2024 Fall"
  }
}
```

#### Step 3: 建立主題結構

```bash
mkdir -p python/{week1,week2,week3}/templates
```

#### Step 4: 建立主題配置

`python/topic.json`：

```json
{
  "type": "topic",
  "name": "python",
  "title": "Python 程式設計",
  "description": "從零開始學習 Python",

  "subtopics": [
    "week1",
    "week2",
    "week3"
  ],

  "display": {
    "icon": "🐍",
    "color": "#3776ab",
    "order": 1,
    "collapsed": false,
    "showInNavigation": true
  }
}
```

`python/week1/topic.json`：

```json
{
  "type": "topic",
  "name": "week1",
  "title": "第一週：基礎語法",
  "description": "變數、資料型別、基本運算",

  "documentation": "# 第一週：Python 基礎\n\n## 學習目標\n- 理解變數和資料型別\n- 掌握基本運算\n- 學會使用 print() 函數",

  "display": {
    "icon": "1️⃣",
    "color": "#4CAF50",
    "order": 1,
    "collapsed": false,
    "showInNavigation": true
  }
}
```

#### Step 5: 建立模板

`python/week1/templates/hello.json`：

```json
{
  "type": "template",
  "name": "hello",
  "title": "Hello Python",
  "description": "第一個 Python 程式",
  "language": "python",

  "code": "# 我的第一個 Python 程式\nprint(\"Hello, Python!\")\nprint(\"歡迎來到程式設計的世界\")",

  "documentation": "## 作業說明\n\n請修改此程式，輸出您自己的名字。\n\n### 範例\n```python\nprint(\"我是陳小明\")\n```"
}
```

`python/week1/templates/variables.json`：

```json
{
  "type": "template",
  "name": "variables",
  "title": "變數練習",
  "description": "變數宣告和使用",
  "language": "python",

  "code": "# 變數練習\nname = \"小明\"\nage = 20\nheight = 175.5\n\nprint(f\"我叫 {name}\")\nprint(f\"今年 {age} 歲\")\nprint(f\"身高 {height} 公分\")",

  "documentation": "## 變數\n\n變數就像是一個容器，可以儲存資料。\n\n### 練習\n1. 修改變數的值\n2. 新增一個 `hobby` 變數\n3. 輸出完整的自我介紹"
}
```

#### Step 6: 驗證結構

```bash
tree course-intro-2024
```

輸出：
```
course-intro-2024/
├── scope.json
└── python/
    ├── topic.json
    ├── week1/
    │   ├── topic.json
    │   └── templates/
    │       ├── hello.json
    │       └── variables.json
    ├── week2/
    │   └── topic.json
    └── week3/
        └── topic.json
```

#### Step 7: 重新載入 TextBricks

在 VS Code 中執行：
```
Command Palette > TextBricks: Refresh Templates
```

---

## 路徑識別系統

TextBricks 使用**路徑基礎識別**，每個項目都有唯一的路徑。

### 路徑格式

```
{scope-id}/{topic-path}/templates/{template-name}
{scope-id}/{topic-path}/links/{link-name}
{scope-id}/{topic-path}
```

### 路徑範例

| 項目 | 路徑 | 說明 |
|------|------|------|
| Scope | `local` | Scope ID |
| 主題 | `c` | 頂層主題 |
| 子主題 | `c/basic` | 子主題 |
| 模板 | `c/basic/templates/hello-world` | 模板完整路徑 |
| 連結 | `c/basic/links/python-basic` | 連結完整路徑 |

### 路徑在收藏和統計中的使用

**favorites**：
```json
"favorites": [
  "c/basic/templates/hello-world",    // 模板
  "c/advanced",                        // 主題
  "python"                             // 頂層主題
]
```

**usage**：
```json
"usage": {
  "c/basic/templates/hello-world": 17,
  "python/templates/variables": 12
}
```

---

## 最佳實踐

### 1. 開發時同步資料夾

在開發 TextBricks 時，系統資料夾與專案資料夾之間需要同步，以便測試和版本控制。

#### 使用 TextBricks Manager 同步（推薦）

**同步方向**：系統資料夾 → 專案資料夾

TextBricks Manager 提供內建的同步功能：

1. 開啟 **TextBricks Manager**
2. 進入「**設定**」→「**資料位置設定**」
3. 點擊「**🔄 同步到開發數據 (data/local)**」按鈕

**功能說明**：
- 將系統資料夾的 `local` scope 同步到專案的 `data/local/` 目錄
- 同步前會自動備份到 `data/local.backup/`
- 可選擇包含：
  - ✅ **包含使用統計 (usage)**：同步使用次數記錄
  - ✅ **包含收藏列表 (favorites)**：同步收藏項目
  - ✅ **包含元數據 (metadata)**：同步其他元資料

**系統資料夾位置**：
- **macOS**: `~/Library/Application Support/TextBricks/scopes/local`
- **Windows**: `%APPDATA%\TextBricks\scopes\local`
- **Linux**: `~/.config/TextBricks/scopes/local`

**專案資料夾位置**：
- `{project-root}/data/local/`

**使用時機**：
- ✅ 在 UI 中修改了 scope 內容後，想提交到 Git
- ✅ 測試新功能後，想保存測試資料
- ✅ 開發完成後，更新專案的預設資料

#### 推薦的開發流程

1. **開發過程**：
   - 使用 TextBricks Manager 的 UI 新增/編輯模板和主題
   - 或直接在系統資料夾中修改檔案進行測試

2. **同步到專案**：
   - 開啟 TextBricks Manager
   - 進入「設定」→「資料位置設定」
   - 點擊「🔄 同步到開發數據 (data/local)」
   - 選擇要包含的選項：
     - 如果需要保留測試統計，勾選「包含使用統計」
     - 如果需要預設收藏項目，勾選「包含收藏列表」
     - 通常不需要勾選「包含元數據」

3. **版本控制**：
   - 檢查 Git 變更是否符合預期
   - 提交有意義的變更到 Git
   - 如果不需要同步 usage/favorites，可以還原這些變更

**注意事項**：
- ⚠️ 同步前會自動備份現有的 `data/local/` 到 `data/local.backup/`
- ⚠️ 同步會**覆蓋**專案中的 `data/local/` 內容
- ⚠️ 記得定期同步，避免遺失在系統資料夾中的修改
- ✅ 建議在完成一個功能或修改後立即同步並提交

**開發技巧**：

- **快速測試**：直接在系統資料夾中修改，即時看到效果
- **批次修改**：直接編輯專案中的 `data/local/` JSON 檔案
- **UI 操作**：使用 Manager Panel 視覺化新增/編輯內容
- **定期同步**：養成習慣在每次開發會議結束時同步一次

### 2. 目錄組織

✅ **推薦做法**：

```
scopes/
└── local/
    ├── c/              # 按語言組織
    │   ├── basic/
    │   └── advanced/
    ├── python/
    │   ├── week1/      # 按課程週次組織
    │   ├── week2/
    │   └── week3/
    └── algorithms/     # 語言無關主題
        ├── sorting/
        └── searching/
```

❌ **不推薦做法**：

```
scopes/
└── local/
    ├── week1/          # 混合不同語言在一起
    │   ├── c-hello.json
    │   └── py-hello.json
    └── random/         # 缺乏組織結構
```

### 2. 命名規範

✅ **推薦命名**：
- `hello-world.json`
- `for-loop-basic.json`
- `object-oriented-intro.json`

❌ **不推薦命名**：
- `HelloWorld.json` （應使用 kebab-case）
- `for loop.json` （避免空格）
- `OOP_01.json` （避免底線和數字前綴）

### 3. 模板內容品質

✅ **高品質模板**：

```json
{
  "title": "氣泡排序",
  "description": "簡單排序演算法實作",
  "code": "def bubble_sort(arr):\n    \"\"\"氣泡排序法\"\"\"\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\n# 測試\ndata = [64, 34, 25, 12, 22]\nprint(bubble_sort(data))",
  "documentation": "## 氣泡排序\n\n時間複雜度：O(n²)\n..."
}
```

**特點**：
- ✅ 程式碼完整可執行
- ✅ 包含註解和文檔字串
- ✅ 提供測試範例
- ✅ 有詳細的文檔說明

❌ **低品質模板**：

```json
{
  "title": "排序",
  "description": "排序",
  "code": "def sort(a):\n    return sorted(a)"
}
```

**問題**：
- ❌ 標題和描述不明確
- ❌ 程式碼過於簡化
- ❌ 缺乏教學價值
- ❌ 沒有文檔說明

### 4. 主題層級深度

✅ **適當深度**（2-4 層）：

```
python/
├── basic/
│   ├── syntax/
│   └── control-flow/
└── advanced/
    ├── oop/
    └── async/
```

❌ **過深層級**（避免 >5 層）：

```
python/
└── course/
    └── 2024/
        └── fall/
            └── week1/
                └── day1/
                    └── morning/
```

### 5. 文檔撰寫

✅ **良好文檔**：

```json
{
  "documentation": "# 變數與資料型別\n\n## 學習目標\n- 理解變數的概念\n- 掌握基本資料型別\n\n## 基本資料型別\n\n### 整數 (int)\n```python\nage = 20\n```\n\n### 浮點數 (float)\n```python\nheight = 175.5\n```\n\n## 練習\n1. 建立自己的變數\n2. 嘗試不同的資料型別"
}
```

❌ **不良文檔**：

```json
{
  "documentation": "變數"
}
```

### 6. 連結使用

✅ **有意義的連結**：

在 `c/basic/` 中建立連結到 `c/advanced/`：

```json
{
  "type": "link",
  "name": "next-level",
  "title": "準備好進階了嗎？",
  "target": "../advanced",
  "description": "學習指標、記憶體管理等進階概念"
}
```

在 `python/basic/` 中建立連結到相似概念：

```json
{
  "type": "link",
  "name": "compare-with-c",
  "title": "與 C 語言比較",
  "target": "c/basic",
  "description": "查看相同概念在 C 語言中的實現",
  "language": "c"
}
```

---

## 常見問題

### Q1: 如何新增一個新的語言？

**步驟**：

1. 在 `scope.json` 中添加語言定義：

```json
{
  "languages": [
    {
      "name": "rust",
      "title": "Rust",
      "tagName": "RUST",
      "description": "Rust programming language",
      "fileExtensions": [".rs"],
      "icon": "file-code"
    }
  ]
}
```

2. 建立語言主題目錄：

```bash
mkdir -p rust/templates
```

3. 建立 `rust/topic.json`

4. 添加模板檔案

5. 重新載入 TextBricks

### Q2: 如何處理多行程式碼？

**使用 `\n` 表示換行**：

```json
{
  "code": "line 1\nline 2\nline 3"
}
```

**使用編輯器輔助**：
- 在 VS Code 中可以使用字串轉換工具
- 線上工具：https://www.freeformatter.com/json-escape.html

### Q3: 可以刪除 scope.json 中的 favorites 和 usage 嗎？

**可以，但不建議**。這些欄位由系統自動管理：
- `favorites` - 使用者收藏的項目
- `usage` - 使用統計，用於推薦系統

**建議**：
- ✅ 可以手動編輯 `favorites` 來預設一些收藏
- ❌ 不要手動編輯 `usage`，會被系統覆蓋

### Q4: 如何建立語言無關的主題（如演算法）？

**直接在 scope 根目錄建立主題**：

```bash
mkdir -p algorithms/{sorting,searching}/templates
```

`algorithms/topic.json`：

```json
{
  "type": "topic",
  "name": "algorithms",
  "title": "演算法",
  "description": "常見演算法實作（多語言）",
  "subtopics": ["sorting", "searching"]
}
```

`algorithms/sorting/templates/bubble-sort-python.json`：

```json
{
  "type": "template",
  "name": "bubble-sort-python",
  "title": "氣泡排序 (Python)",
  "language": "python",
  "code": "..."
}
```

### Q5: subtopics 的順序重要嗎？

**是的，順序決定 UI 中的顯示順序**：

```json
{
  "subtopics": [
    "week1",    // 顯示在最前面
    "week2",    // 第二
    "week3"     // 第三
  ]
}
```

**結合 `display.order` 進行更細緻的排序**：

`week1/topic.json`：
```json
{
  "display": {
    "order": 1
  }
}
```

### Q6: 如何匯出和分享 Scope？

**方法 1：直接複製資料夾**

```bash
cp -r ~/Library/Application\ Support/TextBricks/scopes/course-intro-2024 \
      /path/to/share/
```

**方法 2：使用 TextBricks Manager**

1. 開啟 TextBricks Manager
2. 選擇「匯出 Scope」
3. 選擇目標 Scope
4. 保存為 ZIP 或資料夾

**方法 3：使用 Git**

```bash
cd ~/Library/Application\ Support/TextBricks/scopes/course-intro-2024
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/course-intro-2024.git
git push -u origin main
```

### Q7: 如何處理特殊字符（引號、反斜線）？

**使用 JSON 轉義**：

```json
{
  "code": "print(\"Hello, \\\"World\\\"!\")\nprint('It\\'s okay')"
}
```

顯示為：
```python
print("Hello, \"World\"!")
print('It's okay')
```

**轉義規則**：
- `\"` → `"`
- `\\` → `\`
- `\n` → 換行
- `\t` → Tab
- `\r` → 回車

### Q8: 可以嵌套多深的主題？

**技術上無限制，但建議 2-4 層**：

✅ **推薦**（3 層）：
```
c/                  # 1
├── basic/          # 2
│   └── syntax/     # 3
```

⚠️ **可接受**（4 層）：
```
algorithms/         # 1
└── sorting/        # 2
    └── advanced/   # 3
        └── hybrid/ # 4
```

❌ **不推薦**（>5 層）：太深會造成導航困難

### Q9: 如何建立不同難度的模板？

**方法 1：使用主題名稱區分**

```
python/
├── beginner/
├── intermediate/
└── advanced/
```

**方法 2：在 description 中標註**

```json
{
  "title": "迴圈練習",
  "description": "【初級】基本 for 迴圈使用"
}
```

**方法 3：使用命名慣例**

```
python/loops/templates/
├── for-loop-basic.json
├── for-loop-intermediate.json
└── for-loop-advanced.json
```

### Q10: 如何更新已存在的 Scope？

**建議流程**：

1. **備份當前版本**：

```bash
cp -r ~/Library/Application\ Support/TextBricks/scopes/local \
      ~/Library/Application\ Support/TextBricks/scopes/local.backup
```

2. **修改檔案**

3. **更新 metadata**：

```json
{
  "metadata": {
    "version": "1.1.0",
    "lastUpdated": "2024-10-18T10:00:00.000Z"
  }
}
```

4. **重新載入**：

```
Command Palette > TextBricks: Refresh Templates
```

5. **測試變更**

6. **如果有問題，恢復備份**：

```bash
rm -rf ~/Library/Application\ Support/TextBricks/scopes/local
mv ~/Library/Application\ Support/TextBricks/scopes/local.backup \
   ~/Library/Application\ Support/TextBricks/scopes/local
```

---

## 附錄：完整目錄範例

### 小型 Scope（單一語言課程）

```
scopes/
└── python-intro/
    ├── scope.json
    └── python/
        ├── topic.json
        ├── week1/
        │   ├── topic.json
        │   └── templates/
        │       ├── hello.json
        │       └── variables.json
        ├── week2/
        │   ├── topic.json
        │   └── templates/
        │       ├── if-else.json
        │       └── loops.json
        └── week3/
            ├── topic.json
            └── templates/
                ├── functions.json
                └── lists.json
```

### 中型 Scope（多語言基礎）

```
scopes/
└── local/
    ├── scope.json
    ├── c/
    │   ├── topic.json
    │   ├── basic/
    │   │   ├── topic.json
    │   │   ├── templates/
    │   │   └── links/
    │   └── advanced/
    │       ├── topic.json
    │       └── templates/
    ├── python/
    │   ├── topic.json
    │   ├── basic/
    │   └── advanced/
    └── javascript/
        ├── topic.json
        ├── basic/
        └── advanced/
```

### 大型 Scope（完整課程體系）

```
scopes/
└── cs-program/
    ├── scope.json
    ├── c/
    │   ├── topic.json
    │   ├── basic/
    │   │   ├── syntax/
    │   │   ├── control-flow/
    │   │   └── functions/
    │   ├── advanced/
    │   │   ├── pointers/
    │   │   ├── memory/
    │   │   └── files/
    │   └── projects/
    ├── python/
    │   ├── basic/
    │   ├── intermediate/
    │   ├── advanced/
    │   └── libraries/
    ├── javascript/
    │   ├── basic/
    │   ├── dom/
    │   ├── async/
    │   └── frameworks/
    ├── algorithms/
    │   ├── sorting/
    │   ├── searching/
    │   ├── dynamic-programming/
    │   └── graphs/
    └── data-structures/
        ├── arrays/
        ├── linked-lists/
        ├── trees/
        └── hash-tables/
```

---

## 參考資源

- **GitHub Issues**: [回報問題](https://github.com/timcsy/TextBricks/issues)
- **範例 Scope**: [TextBricks Examples](https://github.com/timcsy/TextBricks/tree/main/examples)
- **型別定義**: 參考 `packages/shared/src/models/` 中的 TypeScript 介面

---

**製作團隊**：TextBricks 開發組
**最後更新**：2025-10-19
**版本**：v2.1

## 更新記錄

### v2.1 (2025-10-19)
- ✨ 更新 scope.json 格式說明（移除已廢棄欄位 `id`, `settings`, `metadata`）
- ✨ 新增 `favorites` 和 `usage` 的詳細說明
- ✨ 新增 `topics` 陣列說明
- ✨ 更新 languages 格式（新增 `icon` 和 `color` 欄位）
- ✨ 新增 topic.json 的 `templates` 和 `links` 欄位說明
- ✨ 新增 documentation 物件格式支援（v0.3.0+）
- ✨ 新增「開發時同步資料夾」完整指南（4 種方法）
- 📝 更新所有範例以反映實際實作

### v2.0 (2025-10-18)
- 初始完整版本

> **提示**：建議先從小型 Scope 開始，熟悉結構後再逐步擴展。善用 TextBricks Manager 的匯入匯出功能來管理和分享您的模板集。
