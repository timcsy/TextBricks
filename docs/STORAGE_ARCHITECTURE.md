# TextBricks 儲存架構設計

## 📋 架構概述

TextBricks v0.3.0 採用平台無關的分散式儲存架構，取代原本集中式的 JSON 檔案儲存方式，提供更靈活、可擴展且易維護的資料管理解決方案。

## 🎯 設計目標

### 1. 平台無關性
- 遵循各平台的標準目錄規範
- 避免硬編碼路徑依賴
- 支援多使用者環境

### 2. 可擴展性
- 支援無限層級的主題結構
- 彈性的範圍管理系統
- 模組化的儲存組件

### 3. 資料完整性
- 原子性操作保證
- 資料備份與復原機制
- 版本控制與遷移支援

## 🗂️ 目錄結構設計

### 系統標準目錄

#### macOS
```
~/Library/Application Support/TextBricks/
├── local/                    # 本機範圍
├── user1/                    # 使用者範圍 1
├── MyProject/               # 專案範圍
└── .metadata/               # 系統元資料
    ├── scopes.json         # 範圍註冊表
    ├── migrations.json     # 遷移記錄
    └── cache/              # 快取資料
```

#### Windows
```
%APPDATA%/TextBricks/
├── local/
├── user1/
├── MyProject/
└── .metadata/
```

#### Linux
```
~/.local/share/TextBricks/
├── local/
├── user1/
├── MyProject/
└── .metadata/
```

### 範圍資料夾結構

```
{scope}/                     # 範圍根目錄
├── topic.json              # 主題配置檔
├── templates/              # 模板檔案夾 (可重新命名)
│   ├── hello-world.c
│   ├── for-loop.py
│   └── function-basic.js
├── links/                  # 連結檔案夾 (可重新命名)
│   └── advanced-concepts.json
├── subtopics/              # 子主題資料夾
│   ├── basic-concepts/     # 子主題 1
│   │   ├── topic.json
│   │   ├── templates/
│   │   └── subtopics/
│   └── control-structures/ # 子主題 2
│       ├── topic.json
│       ├── templates/
│       └── subtopics/
└── docs/                   # 文檔資料夾
    ├── intro.md
    └── tutorial.md
```

## 📄 檔案格式規範

### topic.json 主題配置

```json
{
  "id": "basic-programming",
  "title": "程式設計基礎",
  "version": "1.0.0",
  "navigation": [
    {
      "id": "hello-world",
      "title": "Hello World",
      "type": "template",
      "targetId": "templates/hello-world.c",
      "icon": "file-code",
      "documentation": {
        "type": "file",
        "content": "docs/hello-world.md"
      }
    },
    {
      "id": "basic-concepts",
      "title": "基礎概念",
      "type": "folder",
      "targetId": "subtopics/basic-concepts",
      "icon": "folder"
    },
    {
      "id": "advanced-link",
      "title": "進階概念連結",
      "type": "link",
      "targetId": "advanced-programming.data-structures",
      "linkType": "folder",
      "icon": "link"
    }
  ],
  "metadata": {
    "created": "2025-09-24T10:00:00Z",
    "modified": "2025-09-24T12:30:00Z",
    "author": "TextBricks User",
    "scope": "local",
    "language": "c",
    "tags": ["beginner", "fundamentals"]
  },
  "folderNames": {
    "templates": "程式碼範例",
    "links": "快捷連結",
    "subtopics": "子主題",
    "docs": "說明文檔"
  },
  "documentation": {
    "type": "file",
    "content": "docs/intro.md",
    "title": "主題介紹"
  }
}
```

### scopes.json 範圍註冊表

```json
{
  "scopes": [
    {
      "id": "local",
      "name": "本機範圍",
      "type": "builtin",
      "path": "local",
      "active": true,
      "created": "2025-09-24T10:00:00Z"
    },
    {
      "id": "user1",
      "name": "使用者範圍 1",
      "type": "user",
      "path": "user1",
      "active": true,
      "created": "2025-09-24T11:00:00Z"
    },
    {
      "id": "myproject",
      "name": "我的專案",
      "type": "project",
      "path": "MyProject",
      "active": true,
      "created": "2025-09-24T12:00:00Z"
    }
  ],
  "defaultScope": "local",
  "version": "1.0.0"
}
```

### 連結檔案格式

```json
{
  "id": "advanced-concepts",
  "title": "進階概念快捷方式",
  "type": "link",
  "linkType": "folder",
  "targetId": "advanced-programming.data-structures",
  "targetScope": "local",
  "created": "2025-09-24T13:00:00Z",
  "documentation": {
    "type": "inline",
    "content": "快速存取進階資料結構相關模板"
  }
}
```

## 🔧 儲存元件設計

### StorageManager 主儲存管理器

```typescript
interface StorageManager {
  // 範圍管理
  createScope(name: string, type: ScopeType): Promise<Scope>;
  deleteScope(scopeId: string): Promise<void>;
  listScopes(): Promise<Scope[]>;

  // 主題操作
  loadTopic(scopeId: string, topicPath?: string): Promise<TopicConfig>;
  saveTopic(scopeId: string, topic: TopicConfig, topicPath?: string): Promise<void>;
  deleteTopic(scopeId: string, topicPath: string): Promise<void>;

  // 模板操作
  loadTemplate(scopeId: string, templatePath: string): Promise<string>;
  saveTemplate(scopeId: string, templatePath: string, content: string): Promise<void>;
  deleteTemplate(scopeId: string, templatePath: string): Promise<void>;

  // 文檔操作
  loadDocumentation(scopeId: string, docPath: string): Promise<string>;
  saveDocumentation(scopeId: string, docPath: string, content: string): Promise<void>;
}
```

### ScopeManager 範圍管理器

```typescript
interface ScopeManager {
  initialize(): Promise<void>;
  registerScope(scope: Scope): Promise<void>;
  unregisterScope(scopeId: string): Promise<void>;
  getScope(scopeId: string): Promise<Scope | null>;
  getAllScopes(): Promise<Scope[]>;
  getActiveScopes(): Promise<Scope[]>;
  setDefaultScope(scopeId: string): Promise<void>;
}

interface Scope {
  id: string;
  name: string;
  type: 'builtin' | 'user' | 'project';
  path: string;
  active: boolean;
  created: Date;
  metadata?: Record<string, any>;
}
```

### PathResolver 路徑解析器

```typescript
interface PathResolver {
  getSystemDataDirectory(): string;
  getScopeDirectory(scopeId: string): string;
  getTopicDirectory(scopeId: string, topicPath: string): string;
  getTemplateDirectory(scopeId: string, topicPath: string): string;
  resolveTemplatePath(scopeId: string, templateId: string): string;
  resolveLinkTarget(linkItem: NavigationItem): string;
}
```

## 🔄 資料遷移策略

### 遷移流程設計

```typescript
interface MigrationEngine {
  detectLegacyData(): Promise<LegacyDataInfo>;
  createMigrationPlan(legacyInfo: LegacyDataInfo): MigrationPlan;
  executeMigration(plan: MigrationPlan): Promise<MigrationResult>;
  rollbackMigration(migrationId: string): Promise<void>;
}

interface MigrationPlan {
  id: string;
  version: string;
  steps: MigrationStep[];
  backupRequired: boolean;
  estimatedTime: number;
}

interface MigrationStep {
  id: string;
  type: 'create-scope' | 'migrate-templates' | 'convert-structure' | 'update-references';
  description: string;
  data: any;
}
```

### v0.2.5 → v0.3.0 遷移對應

```typescript
// 舊格式 (templates.json)
{
  "c": {
    "基礎": {
      "hello-world": {
        "title": "Hello World",
        "code": "#include <stdio.h>..."
      }
    }
  }
}

// 新格式轉換
// 1. 建立 local/ 範圍
// 2. 建立主題結構：local/c-programming/
// 3. 轉換模板：templates/hello-world.c
// 4. 生成 topic.json 配置
```

## 💾 快取與效能設計

### 快取策略

```typescript
interface CacheManager {
  // 主題快取
  cacheTopicConfig(scopeId: string, topicPath: string, config: TopicConfig): void;
  getCachedTopicConfig(scopeId: string, topicPath: string): TopicConfig | null;
  invalidateTopicCache(scopeId: string, topicPath?: string): void;

  // 模板快取
  cacheTemplate(templateId: string, content: string): void;
  getCachedTemplate(templateId: string): string | null;

  // 搜尋索引快取
  buildSearchIndex(scopeId: string): Promise<SearchIndex>;
  getCachedSearchIndex(scopeId: string): SearchIndex | null;
}
```

### 效能最佳化策略

1. **延遲載入**: 僅載入當前檢視所需的資料
2. **增量更新**: 僅重新載入變更的部分
3. **記憶體快取**: 快取常用的主題和模板
4. **索引快取**: 預建搜尋索引提升搜尋效能

## 🛡️ 資料安全與備份

### 原子性操作

```typescript
interface TransactionManager {
  beginTransaction(): Transaction;
  commitTransaction(transaction: Transaction): Promise<void>;
  rollbackTransaction(transaction: Transaction): Promise<void>;
}

interface Transaction {
  id: string;
  operations: Operation[];
  rollbackData: any[];
}
```

### 備份與復原

```typescript
interface BackupManager {
  createBackup(scopeId: string): Promise<BackupInfo>;
  restoreBackup(backupId: string): Promise<void>;
  listBackups(): Promise<BackupInfo[]>;
  cleanupOldBackups(retentionDays: number): Promise<void>;
}

interface BackupInfo {
  id: string;
  scopeId: string;
  created: Date;
  size: number;
  checksum: string;
  path: string;
}
```

## 🔍 監控與診斷

### 儲存監控

```typescript
interface StorageMonitor {
  getDiskUsage(): Promise<DiskUsageInfo>;
  getAccessPatterns(): Promise<AccessPattern[]>;
  validateDataIntegrity(): Promise<IntegrityReport>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
}

interface DiskUsageInfo {
  totalSize: number;
  scopeSizes: Record<string, number>;
  cacheSize: number;
  backupSize: number;
}
```

### 錯誤處理與日誌

```typescript
interface StorageLogger {
  logOperation(operation: string, scopeId: string, details?: any): void;
  logError(error: Error, context: string): void;
  getOperationHistory(scopeId?: string): Promise<OperationLog[]>;
  exportLogs(dateRange: DateRange): Promise<string>;
}
```

## 🎯 實作時程

### Phase 1: 基礎架構 (1-2 週)
- [ ] PathResolver 實作
- [ ] StorageManager 基礎功能
- [ ] ScopeManager 實作
- [ ] 基礎檔案操作

### Phase 2: 資料遷移 (1-2 週)
- [ ] MigrationEngine 實作
- [ ] 舊格式偵測與轉換
- [ ] 備份與復原機制
- [ ] 遷移測試與驗證

### Phase 3: 進階功能 (1 週)
- [ ] CacheManager 實作
- [ ] TransactionManager 實作
- [ ] 效能最佳化
- [ ] 錯誤處理完善

### Phase 4: 監控與診斷 (1 週)
- [ ] StorageMonitor 實作
- [ ] StorageLogger 實作
- [ ] 診斷工具開發
- [ ] 效能分析工具

---

**版本**: v0.3.0
**更新**: 2025-09-24
**狀態**: 架構設計