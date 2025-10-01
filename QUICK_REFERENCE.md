# TextBricks v0.3.0 重構 - 快速參考

> 📖 完整詳情請參考 [REFACTORING.md](./REFACTORING.md) 和 [REFACTORING_REPORT.md](./REFACTORING_REPORT.md)

## 🎯 重構概覽

**執行日期**: 2025-09-30
**完成階段**: 8 個（Phase 1-6 + UI Phase 1-2）
**狀態**: ✅ 完成

## 📊 關鍵數據

```
TextBricksEngine:  1,203 → 1,027 行 (-14.6%)
新增結構化代碼:  +1,294 行
消除重複邏輯:    ~500 行
修改檔案:        13 個
新增檔案:        6 個
```

## 🏗️ 新增服務/組件

### 核心服務

| 服務 | 位置 | 行數 | 功能 |
|------|------|------|------|
| **TemplateRepository** | `packages/core/src/repositories/` | 370 | 模板數據訪問 |
| **RecommendationService** | `packages/core/src/services/` | 107 | 推薦演算法 |

### UI 組件

| 組件 | 位置 | 行數 | 功能 |
|------|------|------|------|
| **utils.js** | `assets/js/common/` | 338 | 共享工具函數（20+） |
| **variables.css** | `assets/css/common/` | 81 | 設計令牌系統 |
| **components.css** | `assets/css/common/` | 398 | UI 組件樣式 |

## 🔧 架構改進

### 依賴注入

TextBricksEngine 現在整合以下服務：

```typescript
constructor(
    platform: IPlatform,
    dataPathService?: DataPathService,      // 單例
    topicManager?: TopicManager,
    scopeManager?: ScopeManager,
    templateRepository?: TemplateRepository,
    recommendationService?: RecommendationService
)
```

### 使用範例

```typescript
// 創建 Engine（自動注入所有服務）
const engine = new TextBricksEngine(platform);

// 或手動注入（用於測試）
const mockRepo = new MockTemplateRepository();
const engine = new TextBricksEngine(
    platform,
    undefined,
    undefined,
    undefined,
    mockRepo
);
```

## 🎨 設計系統

### CSS 變數

```css
/* 顏色 */
--tb-bg-primary
--tb-text-primary
--tb-color-info

/* 間距 */
--tb-spacing-xs: 4px
--tb-spacing-sm: 8px
--tb-spacing-md: 12px

/* 動畫 */
--tb-transition-fast: 0.15s ease
```

### UI 組件

```html
<!-- 卡片 -->
<div class="tb-card">...</div>

<!-- 按鈕 -->
<button class="tb-btn tb-btn--primary">...</button>

<!-- Modal -->
<div class="tb-modal tb-modal--open">...</div>
```

### JavaScript 工具

```javascript
// 使用共享工具
const { escapeHtml, renderMarkdown, formatDate } = window.TextBricksUtils;

escapeHtml('<script>alert("xss")</script>');
// → "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
```

## 📝 重要變更

### Topic 模型統一

```typescript
// ❌ 舊寫法（仍可用，但已 deprecated）
import { Topic } from '@textbricks/shared';

// ✅ 新寫法（推薦）
import { TopicConfig } from '@textbricks/shared';

// Topic 現在是 TopicConfig 的別名
```

### DataPathService 單例

```typescript
// ❌ 舊寫法
const service = new DataPathService(platform);

// ✅ 新寫法
const service = DataPathService.getInstance(platform);
```

### 推薦功能

```typescript
// Engine 內部使用 RecommendationService
const recommended = engine.getRecommendedTemplates(6);

// 可自定義推薦配置
const customService = new RecommendationService(platform, {
    usageWeight: 20,    // 預設: 10
    recencyWeight: 100, // 預設: 50
    recentDays: 14      // 預設: 7
});
```

## 🗂️ 目錄結構變更

### 新增

```
packages/core/src/
├── repositories/
│   └── TemplateRepository.ts       ← 新增
└── services/
    └── RecommendationService.ts    ← 新增

assets/
├── js/common/
│   └── utils.js                    ← 新增
└── css/common/
    ├── variables.css               ← 新增
    └── components.css              ← 新增
```

### 刪除

```
packages/core/src/
├── data/           ← 已刪除（空目錄）
├── migration/      ← 已刪除（空目錄）
├── hierarchical/   ← 已刪除（空目錄）
└── storage/        ← 已刪除（空目錄）
```

## 🧪 測試建議

### 單元測試

```typescript
// 測試 TemplateRepository
describe('TemplateRepository', () => {
    it('should create template', async () => {
        const mockPlatform = createMockPlatform();
        const repo = new TemplateRepository(mockPlatform, ...);

        const template = await repo.create({
            title: 'Test',
            code: 'console.log("test")',
            // ...
        });

        expect(template.id).toBeDefined();
    });
});
```

### 集成測試

```typescript
// 測試 Engine 與 Repository 整合
describe('TextBricksEngine with Repository', () => {
    it('should delegate CRUD to repository', async () => {
        const mockRepo = new MockTemplateRepository();
        const engine = new TextBricksEngine(platform, ..., mockRepo);

        await engine.createTemplate({ /* ... */ });

        expect(mockRepo.create).toHaveBeenCalled();
    });
});
```

## 📚 相關文檔

- **[REFACTORING.md](./REFACTORING.md)** - 完整重構計劃和執行記錄
- **[REFACTORING_REPORT.md](./REFACTORING_REPORT.md)** - 詳細完成報告
- **[AGENTS.md](./AGENTS.md)** - AI 助手參考文件（含變更日誌）

## 🔗 Git 提交

```bash
# 重構主要提交
7d7bd6a - refactor: Complete v0.3.0 architecture refactoring (8 phases)

# 報告提交
1605595 - docs: Add comprehensive v0.3.0 refactoring completion report
```

## 💡 使用提示

### 開發新功能

1. **使用依賴注入** - 方便測試和替換實現
2. **遵循單一職責** - 每個類專注一個功能
3. **使用 CSS 組件** - 統一 UI 風格
4. **使用工具函數** - 避免重複代碼

### 添加新服務

```typescript
// 1. 創建服務
export class MyService {
    constructor(private platform: IPlatform) {}

    myMethod() {
        // 實現邏輯
    }
}

// 2. 注入到 Engine
class TextBricksEngine {
    private myService: MyService;

    constructor(
        platform: IPlatform,
        // ...
        myService?: MyService
    ) {
        this.myService = myService || new MyService(platform);
    }
}

// 3. 導出
export { MyService } from './services/MyService';
```

### 添加 CSS 組件

```css
/* components.css */

.tb-my-component {
    background: var(--tb-bg-primary);
    padding: var(--tb-spacing-md);
    border-radius: var(--tb-radius-md);
    transition: all var(--tb-transition-fast);
}

.tb-my-component:hover {
    box-shadow: var(--tb-shadow-sm);
}
```

## ⚠️ 注意事項

1. **向後兼容** - `Topic` 類型仍可使用，但建議遷移到 `TopicConfig`
2. **DataPathService** - 務必使用 `getInstance()` 而非 `new`
3. **CSS 順序** - 確保 `variables.css` → `components.css` → `style.css`
4. **工具函數** - 檢查 `window.TextBricksUtils` 是否存在

## 🎯 下一步

1. ✅ 執行測試驗證
2. ✅ 性能基準測試
3. ✅ 更新 API 文檔
4. ⬜ UI Phase 3-5（可選）
5. ⬜ 多平台支援

---

**文檔版本**: 1.0
**最後更新**: 2025-09-30
**維護者**: TextBricks Team