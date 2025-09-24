# TextBricks Manager v3.0 設計規範

## 📋 管理器概述

TextBricks Manager v3.0 是一個全新設計的模板管理介面，採用現代化的樹狀結構和直觀的拖放操作，支援階層式主題系統的完整管理功能。

## 🎯 設計目標

### 1. 直觀操作
- 樹狀結構清晰展示階層關係
- 拖放操作簡化管理流程
- 上下文選單提供快速操作

### 2. 功能完整
- 支援所有 CRUD 操作
- 整合文檔編輯功能
- ZIP + JSON 匯入匯出
- 範圍管理與切換

### 3. 效能優化
- 延遲載入大型結構
- 智慧快取機制
- 即時預覽功能

## 🖥️ 介面設計

### 主介面佈局

```
┌─────────────────────────────────────────────────────────────────┐
│ TextBricks Manager v3.0                    🔍 ⚙️ 💾 📤 📥 ❌  │
├─────────────────────────────────────────────────────────────────┤
│ Scope: [local        ▼] [+ New Scope]                          │
├─────────────────┬───────────────────────────┬───────────────────┤
│ 📁 Topic Tree   │ 📄 Content Editor        │ 📖 Documentation │
│                 │                           │                   │
│ 📚 Programming  │ Template: hello-world.c   │ # Hello World     │
│ ├─📁 基礎概念   │                           │                   │
│ │ ├─📄 Hello    │ #include <stdio.h>        │ 這是一個基礎的    │
│ │ ├─📄 變數     │                           │ Hello World 程式  │
│ │ └─🔗 → 資料   │ int main() {              │ 範例...           │
│ ├─📁 控制結構   │     printf("Hello!\n");   │                   │
│ └─📁 函數       │     return 0;             │ ## 使用方法       │
│                 │ }                         │                   │
│ [+ 新增項目]    │                           │ 1. 包含標頭檔     │
│                 │ [✓ 儲存] [✗ 取消]        │ 2. 定義 main      │
│                 │                           │ 3. 印出訊息       │
├─────────────────┼───────────────────────────┼───────────────────┤
│ 🔍 Quick Search │ 📊 Statistics             │ 🎯 Actions        │
│ [search_____🔍] │ Templates: 25             │ [🔄 Refresh]      │
│                 │ Links: 3                  │ [📋 Import]       │
│                 │ Topics: 8                 │ [📤 Export]       │
│                 │ Modified: 2 days ago      │ [⚙️ Settings]     │
└─────────────────┴───────────────────────────┴───────────────────┘
```

### 樹狀結構詳細設計

#### 節點類型視覺

```
📚 Programming Fundamentals        ← Root Topic (bold, larger)
├─📁 基礎概念                     ← Folder (expandable)
│ ├─📄 Hello World               ← Template (file icon)
│ ├─📄 變數宣告                  ← Template
│ └─🔗 → 進階概念/資料型別        ← Link (with arrow + target)
├─📁 控制結構 [3]                ← Folder with item count
│ ├─📁 條件判斷                  ← Nested folder
│ │ ├─📄 if-else                ← Template
│ │ └─📄 switch-case            ← Template
│ └─📁 迴圈                      ← Nested folder
│   ├─📄 for 迴圈               ← Template
│   └─📄 while 迴圈             ← Template
└─📁 函數 [!]                    ← Folder with warning badge
  ├─📄 基本函數                  ← Template
  ├─📄 參數傳遞 ⭐               ← Template with star (favorite)
  └─🔗 → 演算法/遞迴 [?]          ← Link with broken target indicator
```

#### 節點狀態指示

- **📄 綠色圖示**: 正常模板
- **📄 灰色圖示**: 檔案不存在
- **🔗 藍色圖示**: 正常連結
- **🔗 紅色圖示**: 連結目標不存在
- **📁 展開/收合**: 資料夾狀態
- **[數字]**: 子項目數量
- **[!]**: 有問題的項目
- **⭐**: 我的最愛標記

### 操作介面設計

#### 1. 工具列功能

```
🔍 搜尋  ⚙️ 設定  💾 儲存  📤 匯出  📥 匯入  ❌ 關閉
```

#### 2. 上下文選單

**主題資料夾右鍵選單**:
```
📁 重新命名主題
📋 複製主題 ID
🗂️ 在檔案管理器中開啟
➕ 新增資料夾
📄 新增模板
🔗 新增連結
📖 編輯文檔
🗑️ 刪除主題
```

**模板項目右鍵選單**:
```
📝 編輯模板
📋 複製模板內容
🏷️ 重新命名
🔗 建立連結
📖 編輯文檔
⭐ 加入我的最愛
🗑️ 刪除模板
```

**連結項目右鍵選單**:
```
🔗 編輯連結目標
📋 複製連結 ID
🔍 前往目標
🏷️ 重新命名
📖 編輯文檔
🗑️ 刪除連結
```

#### 3. 拖放操作

```typescript
interface DragDropOperation {
  source: NavigationItem;
  target: NavigationItem;
  operation: 'move' | 'copy' | 'link';
  position: 'before' | 'after' | 'inside';
}
```

**支援的拖放操作**:
- **模板 → 資料夾**: 移動或複製模板
- **資料夾 → 資料夾**: 移動子主題
- **連結 → 任何位置**: 移動連結
- **外部檔案 → 資料夾**: 匯入新模板

### 內容編輯器設計

#### 模板編輯器

```
┌─────────────────────────────────────┐
│ Template: hello-world.c             │
├─────────────────────────────────────┤
│ Language: [C        ▼]             │
│ Title:    [Hello World Program___] │
│ Icon:     [file-code ▼] [preview]  │
│ Badge:    [NEW______] (optional)   │
├─────────────────────────────────────┤
│ #include <stdio.h>                  │
│                                     │
│ int main() {                        │
│     printf("Hello, World!\n");     │
│     return 0;                       │
│ }                                   │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [✓ Save & Apply] [✗ Cancel]        │
│ [🔍 Preview] [📋 Copy] [🗑️ Delete] │
└─────────────────────────────────────┘
```

#### 連結編輯器

```
┌─────────────────────────────────────┐
│ Link: advanced-concepts             │
├─────────────────────────────────────┤
│ Title:     [進階概念快捷方式______] │
│ Link Type: ○ Folder ● Template     │
│ Target:    [Browse...] [📁]        │
│            advanced-concepts.data   │
│ Icon:      [link ▼] [preview]      │
├─────────────────────────────────────┤
│ Target Preview:                     │
│ 📁 Advanced Programming Concepts    │
│ ├─ 📄 Data Structures              │
│ ├─ 📄 Algorithms                   │
│ └─ 📄 Design Patterns              │
├─────────────────────────────────────┤
│ [✓ Save Link] [✗ Cancel]           │
│ [🔍 Test Link] [🗑️ Delete]         │
└─────────────────────────────────────┘
```

### 文檔編輯系統

#### 整合式 Markdown 編輯器

```
┌─────────────────────────────────────────────────────────────┐
│ Documentation Editor                                        │
├─────────────────────────────────────────────────────────────┤
│ Type: ● Inline ○ File ○ URL                               │
│ Title: [Hello World 說明____________]                       │
├─────────────────────────────┬───────────────────────────────┤
│ # Hello World 程式         │ Hello World 程式             │
│                             │                               │
│ 這是一個基礎的 Hello World  │ 這是一個基礎的 Hello World    │
│ 程式範例。                  │ 程式範例。                    │
│                             │                               │
│ ## 程式說明                 │ 程式說明                      │
│                             │                               │
│ ```c                        │ #include <stdio.h>            │
│ #include <stdio.h>          │                               │
│ int main() {                │ int main() {                  │
│     printf("Hello!\n");     │     printf("Hello!\n");       │
│     return 0;               │     return 0;                 │
│ }                          │ }                             │
│ ```                        │                               │
├─────────────────────────────┼───────────────────────────────┤
│ Markdown Source             │ Live Preview                  │
├─────────────────────────────┴───────────────────────────────┤
│ [✓ Save Documentation] [✗ Cancel] [👁️ Preview] [📄 Export] │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 功能模組設計

### TreeManager 樹狀結構管理

```typescript
interface TreeManager {
  // 樹狀結構操作
  loadTopicTree(scopeId: string): Promise<TopicNode>;
  refreshTree(scopeId: string): Promise<void>;
  expandNode(nodeId: string): Promise<void>;
  collapseNode(nodeId: string): Promise<void>;

  // 節點操作
  createNode(parentId: string, type: NodeType): Promise<NavigationItem>;
  updateNode(nodeId: string, updates: Partial<NavigationItem>): Promise<void>;
  deleteNode(nodeId: string): Promise<void>;
  moveNode(nodeId: string, targetId: string, position: DropPosition): Promise<void>;

  // 搜尋與篩選
  searchNodes(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  filterNodes(filter: NodeFilter): Promise<NavigationItem[]>;
}

interface TopicNode extends NavigationItem {
  children: TopicNode[];
  expanded: boolean;
  level: number;
  parent?: TopicNode;
}
```

### ContentEditor 內容編輯器

```typescript
interface ContentEditor {
  // 編輯器狀態
  openTemplate(templateId: string): Promise<void>;
  openLink(linkId: string): Promise<void>;
  saveCurrentContent(): Promise<void>;
  discardChanges(): Promise<void>;

  // 內容操作
  getContent(): string;
  setContent(content: string): void;
  insertSnippet(snippet: string, position: number): void;
  formatCode(language: string): void;

  // 驗證與預覽
  validateContent(): ValidationResult;
  previewTemplate(): string;
}
```

### DocumentationManager 文檔管理器

```typescript
interface DocumentationManager {
  // 文檔編輯
  openDocumentation(itemId: string): Promise<Documentation>;
  saveDocumentation(itemId: string, doc: Documentation): Promise<void>;
  previewDocumentation(markdown: string): string;

  // 文檔類型處理
  convertToInline(doc: Documentation): Documentation;
  convertToFile(doc: Documentation, filename: string): Promise<Documentation>;
  convertToUrl(doc: Documentation, url: string): Documentation;

  // 資源管理
  uploadImage(file: File): Promise<string>;
  manageAssets(): Promise<Asset[]>;
}
```

## 🎨 進階功能

### 智慧搜尋與篩選

#### 搜尋介面

```
┌─────────────────────────────────────┐
│ 🔍 Advanced Search                  │
├─────────────────────────────────────┤
│ Query: [for迴圈_________________] 🔍│
│                                     │
│ Filters:                            │
│ Type:     ☑️ Templates ☑️ Links     │
│           ☑️ Folders               │
│ Scope:    ☑️ Local ☑️ User1        │
│           ☑️ MyProject             │
│ Language: [All ▼] [C] [Python] [JS]│
│ Tags:     [beginner] [✗] [+]       │
│                                     │
│ Sort by:  ○ Relevance ● Modified   │
│           ○ Name ○ Usage           │
├─────────────────────────────────────┤
│ Results: 8 found                    │
│                                     │
│ 📄 for 迴圈基礎 (95%)              │
│    💬 基礎概念 > 控制結構          │
│ 📄 for-each 迴圈 (87%)             │
│    💬 進階概念 > 集合操作          │
│ 🔗 → 迴圈最佳實踐 (78%)            │
│    💬 最佳實踐 > 效能優化          │
└─────────────────────────────────────┘
```

### 匯入匯出系統

#### 匯出選項

```
┌─────────────────────────────────────┐
│ 📤 Export Templates                 │
├─────────────────────────────────────┤
│ Scope: [local ▼]                   │
│ Topic: [☑️] Programming Fundamentals│
│                                     │
│ Export Format:                      │
│ ○ JSON Only (legacy)               │
│ ● ZIP Package (recommended)        │
│                                     │
│ Include:                            │
│ ☑️ Templates                       │
│ ☑️ Documentation                   │
│ ☑️ Topic Structure                 │
│ ☑️ Links                           │
│ ☑️ Metadata                        │
│                                     │
│ Output: [Browse...] [📁]           │
│         ~/Downloads/textbricks.zip  │
├─────────────────────────────────────┤
│ [📤 Export] [❌ Cancel]             │
└─────────────────────────────────────┘
```

#### 匯入處理

```
┌─────────────────────────────────────┐
│ 📥 Import Templates                 │
├─────────────────────────────────────┤
│ Source: [Browse...] [📁]           │
│         textbricks-backup.zip       │
│                                     │
│ Detected Format: ZIP Package        │
│ Content Preview:                    │
│ ├─📚 C Programming (25 templates)   │
│ ├─📚 Python Basics (18 templates)  │
│ └─📚 Web Development (12 templates) │
│                                     │
│ Import Options:                     │
│ Target Scope: [local ▼]           │
│ Conflict Resolution:                │
│ ○ Skip existing                    │
│ ● Merge and update                 │
│ ○ Replace all                      │
│                                     │
│ ☑️ Validate before import          │
│ ☑️ Create backup                   │
├─────────────────────────────────────┤
│ [📥 Import] [❌ Cancel]             │
└─────────────────────────────────────┘
```

### 範圍管理系統

#### 範圍切換器

```
┌─────────────────────────────────────┐
│ Scope Manager                       │
├─────────────────────────────────────┤
│ Active Scopes:                      │
│                                     │
│ ● 📁 local (本機範圍)              │
│   ├─ 📚 Programming (25)           │
│   └─ 📚 Web Development (12)       │
│                                     │
│ ○ 👤 user1 (使用者範圍)            │
│   └─ 📚 Personal Projects (8)      │
│                                     │
│ ○ 🚀 MyProject (專案範圍)          │
│   ├─ 📚 Frontend (15)              │
│   └─ 📚 Backend (20)               │
│                                     │
│ [+ Create New Scope]               │
│ [⚙️ Manage Scopes]                 │
└─────────────────────────────────────┘
```

## 🎯 實作時程

### Phase 1: 基礎架構 (2-3 週)
- [ ] TreeManager 核心功能
- [ ] 基礎 UI 框架建立
- [ ] 節點渲染系統
- [ ] 基本 CRUD 操作

### Phase 2: 編輯功能 (2 週)
- [ ] ContentEditor 實作
- [ ] 模板編輯器介面
- [ ] 連結編輯器介面
- [ ] 即時預覽功能

### Phase 3: 文檔系統 (2 週)
- [ ] DocumentationManager 實作
- [ ] Markdown 編輯器整合
- [ ] 文檔類型轉換
- [ ] 資源管理功能

### Phase 4: 進階功能 (2-3 週)
- [ ] 智慧搜尋系統
- [ ] 拖放操作實作
- [ ] 匯入匯出功能
- [ ] 範圍管理介面

### Phase 5: 最佳化與測試 (1-2 週)
- [ ] 效能最佳化
- [ ] 使用者體驗調整
- [ ] 完整功能測試
- [ ] 文檔與說明

---

**版本**: v3.0
**更新**: 2025-09-24
**狀態**: 設計規範