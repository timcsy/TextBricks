# 階層式主題系統設計規範

## 📋 設計概述

階層式主題系統是 TextBricks v0.3.0 的核心特色，提供統一、靈活且直觀的程式碼模板組織方式。

## 🎯 設計原則

### 1. 統一性 (Uniformity)
- 資料夾、模板、連結採用統一的 `NavigationItem` 介面
- 一致的操作行為和視覺呈現
- 標準化的文檔系統

### 2. 靈活性 (Flexibility)
- 自訂主題名稱和階層結構
- 支援跨主題連結
- 彈性的資料夾命名

### 3. 直觀性 (Intuitiveness)
- 類似檔案系統的階層導航
- 清晰的視覺層次
- 符合用戶習慣的互動方式

## 🏗️ 資料模型設計

### NavigationItem 核心介面

```typescript
interface NavigationItem {
  id: string;              // 全域唯一識別碼 (UUID)
  title: string;           // 使用者可見的標題
  type: 'folder' | 'template' | 'link';  // 項目類型
  targetId: string;        // 目標識別碼
  linkType?: 'folder' | 'template';      // 連結類型
  icon?: string;           // 自訂圖示名稱
  badge?: string;          // 徽章文字
  order?: number;          // 排序權重
  documentation?: Documentation;  // 說明文檔
}
```

### 項目類型詳解

#### 1. Folder (資料夾)
- **用途**: 組織和分類其他項目
- **行為**: 點擊進入子層級
- **視覺**: 資料夾圖示 + 右側 `>` 箭頭
- **targetId**: 指向子主題的 ID

#### 2. Template (模板)
- **用途**: 實際的程式碼模板
- **行為**: 插入、複製、預覽等操作
- **視覺**: 檔案圖示 + 操作按鈕
- **targetId**: 指向模板檔案路徑

#### 3. Link (連結)
- **用途**: 快捷連結到其他項目
- **行為**: 根據 `linkType` 決定行為
- **視覺**: 連結圖示 + 目標類型圖示
- **targetId**: 指向目標項目的 ID

### TopicConfig 主題配置

```typescript
interface TopicConfig {
  id: string;              // 主題唯一識別碼
  title: string;           // 主題顯示標題
  navigation: NavigationItem[];  // 導航項目清單
  metadata: TopicMetadata; // 主題元資料
  documentation?: Documentation;  // 主題說明文檔
}

interface TopicMetadata {
  version: string;         // 配置版本
  created: Date;          // 建立時間
  modified: Date;         // 最後修改時間
  author?: string;        // 作者資訊
  scope: string;          // 所屬範圍
  tags?: string[];        // 標籤
  language?: string;      // 主要程式語言
}
```

## 🗂️ 階層結構設計

### 主題階層示例

```
Programming Fundamentals (根主題)
├── 基礎概念/
│   ├── Hello World (template)
│   ├── 變數宣告 (template)
│   └── 資料型別 → 進階概念/資料型別詳解 (link)
├── 控制結構/
│   ├── 條件判斷/
│   │   ├── if-else (template)
│   │   └── switch-case (template)
│   └── 迴圈/
│       ├── for 迴圈 (template)
│       └── while 迴圈 (template)
└── 函數/
    ├── 基本函數 (template)
    ├── 參數傳遞 (template)
    └── 遞迴函數 → 演算法/遞迴 (link)
```

### 階層導航邏輯

```typescript
interface NavigationState {
  currentTopicId: string;     // 當前主題 ID
  breadcrumb: BreadcrumbItem[];  // 麵包屑路徑
  history: string[];          // 瀏覽歷史
  favorites: string[];        // 我的最愛
}

interface BreadcrumbItem {
  id: string;
  title: string;
  topicId: string;
}
```

## 🎨 使用者介面設計

### 主導航面板

```
┌─────────────────────────────┐
│ 📚 Programming Fundamentals │ ← 當前主題標題
├─────────────────────────────┤
│ 🏠 > 基礎概念 > 變數        │ ← 麵包屑導航
├─────────────────────────────┤
│ 📁 基礎概念              > │ ← 資料夾項目
│ 📁 控制結構              > │
│ 📁 函數                  > │
│ 📄 README                  │ ← 模板項目
│ 🔗 → 進階概念/類別         │ ← 連結項目
└─────────────────────────────┘
```

### 項目互動設計

#### Folder 互動
- **左鍵點擊**: 進入子層級
- **右鍵選單**: 重新命名、刪除、新增項目
- **拖放**: 移動到其他資料夾

#### Template 互動
- **左鍵點擊**: 插入模板到編輯器
- **右鍵選單**: 複製、編輯、刪除、新增連結
- **拖放**: 拖到編輯器或其他資料夾
- **懸停**: 顯示預覽工具提示

#### Link 互動
- **左鍵點擊**: 根據 `linkType` 執行對應行為
- **右鍵選單**: 編輯連結、刪除
- **視覺提示**: 顯示目標項目狀態

## 🔗 連結系統設計

### 連結類型

#### 1. Folder Link
```typescript
{
  type: 'link',
  linkType: 'folder',
  targetId: 'advanced-concepts',  // 目標資料夾 ID
  title: '進階概念快捷方式'
}
```

#### 2. Template Link
```typescript
{
  type: 'link',
  linkType: 'template',
  targetId: 'quicksort-algorithm',  // 目標模板 ID
  title: '快速排序演算法'
}
```

### 連結解析邏輯

```typescript
interface LinkResolver {
  resolve(linkItem: NavigationItem): NavigationTarget;
  validate(linkItem: NavigationItem): boolean;
  update(oldId: string, newId: string): void;
}

interface NavigationTarget {
  item: NavigationItem;
  topicPath: string;
  exists: boolean;
  accessible: boolean;
}
```

## 📖 文檔整合設計

### Documentation 類型系統

```typescript
interface Documentation {
  type: 'inline' | 'file' | 'url';
  content: string;
  title?: string;
  language?: string;      // 用於語法高亮
  metadata?: {
    author?: string;
    version?: string;
    lastUpdated?: Date;
  };
}
```

### 文檔呈現方式

#### 1. Inline 內聯文檔
- 直接嵌入在項目中的文字說明
- 支援 Markdown 格式
- 適用於簡短說明

#### 2. File 檔案文檔
- 指向獨立的文檔檔案
- 支援 .md、.txt、.html 格式
- 適用於詳細說明

#### 3. URL 網址文檔
- 連結到外部資源
- 在內建瀏覽器中開啟
- 適用於線上教程或參考資料

### 文檔編輯器整合

```
┌─────────────────────────────┐
│ 📖 Template Documentation  │
├─────────────────────────────┤
│ Title: [Hello World範例]    │
│ Type:  ○Inline ●File ○URL   │
├─────────────────────────────┤
│ # Hello World 程式         │
│                             │
│ 這是一個基礎的 Hello World  │
│ 程式範例，展示如何...       │
│                             │
│ ```c                        │
│ #include <stdio.h>          │
│ int main() {                │
│     printf("Hello!\n");     │
│     return 0;               │
│ }                          │
│ ```                         │
└─────────────────────────────┘
```

## 🔍 搜尋與篩選設計

### 智慧搜尋功能

```typescript
interface SearchCriteria {
  query: string;              // 搜尋關鍵字
  type?: ItemType[];          // 項目類型篩選
  scope?: string[];           // 範圍篩選
  tags?: string[];            // 標籤篩選
  language?: string[];        // 程式語言篩選
  hasDocumentation?: boolean; // 是否有文檔
}

interface SearchResult {
  item: NavigationItem;
  relevance: number;          // 相關度分數
  topicPath: string;          // 所在路徑
  matchedFields: string[];    // 匹配的欄位
}
```

### 搜尋結果呈現

```
┌─────────────────────────────┐
│ 🔍 [for迴圈________] 🔍     │
├─────────────────────────────┤
│ 📄 for 迴圈基礎 (95%)       │
│    控制結構 > 迴圈          │
│ 📄 for-each 迴圈 (87%)      │
│    進階概念 > 集合操作      │
│ 🔗 → 迴圈最佳實踐 (78%)     │
│    最佳實踐 > 效能優化      │
└─────────────────────────────┘
```

## 🎯 實作考量

### 效能最佳化
- 延遲載入子主題內容
- 搜尋索引快取機制
- 項目圖示預載機制

### 資料一致性
- 連結完整性檢查
- 主題 ID 唯一性驗證
- 循環參照偵測

### 使用者體驗
- 流暢的動畫過渡
- 響應式介面設計
- 鍵盤快捷鍵支援

---

**版本**: v0.3.0
**更新**: 2025-09-24
**狀態**: 設計規範