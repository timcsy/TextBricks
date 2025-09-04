# 🏛️ Architecture Decision Record (ADR)

TextBricks 多平台架構重構決策記錄

---

## ADR-001: 採用分層架構模式

**日期**: 2024-01-XX  
**狀態**: 提議中  
**決策者**: 開發團隊

### 問題陳述
需要設計一個能夠支援多個編輯器平台（VS Code、Vim、NeoVim、Chrome、Obsidian、Zed）的架構，同時保持代碼的可維護性和可測試性。

### 考慮選項

#### 選項 1: 單一代碼庫，條件編譯
```typescript
if (platform === 'vscode') {
    // VS Code 特定代碼
} else if (platform === 'vim') {
    // Vim 特定代碼
}
```
**優點**: 簡單直接  
**缺點**: 代碼複雜度高，難以維護，測試困難

#### 選項 2: 為每個平台創建獨立專案
**優點**: 平台代碼完全獨立  
**缺點**: 代碼重複嚴重，功能不一致，維護成本高

#### 選項 3: 分層架構 + 適配器模式 ✅
```
Core Business Layer (平台無關)
    ↓
Platform Interfaces (抽象接口)
    ↓  
Platform Adapters (具體實現)
    ↓
Plugin Layer (平台特定入口)
```
**優點**: 關注點分離，易於測試，代碼復用性高  
**缺點**: 初期架構複雜度較高

### 決策
採用**選項 3: 分層架構 + 適配器模式**

### 理由
1. **關注點分離**: 核心邏輯與平台實現完全分離
2. **可測試性**: 核心邏輯可以獨立於平台進行測試
3. **可擴展性**: 新增平台只需實現適配器接口
4. **可維護性**: 修改核心邏輯影響所有平台，修改適配器只影響特定平台
5. **一致性**: 所有平台使用相同的核心邏輯，保證功能一致

### 後果
- **正面**: 長期維護成本低，擴展容易，測試覆蓋率高
- **負面**: 初期開發複雜度增加，需要設計良好的抽象接口

---

## ADR-002: 採用 TypeScript 作為主要開發語言

**日期**: 2024-01-XX  
**狀態**: 已確定  
**決策者**: 開發團隊

### 問題陳述
選擇適合多平台開發的程式語言，需要考慮類型安全、生態系統、平台支援等因素。

### 考慮選項

#### 選項 1: JavaScript
**優點**: 輕量、靈活、所有平台都支援  
**缺點**: 缺乏類型檢查，大型專案維護困難

#### 選項 2: TypeScript ✅
**優點**: 強類型、優秀的 IDE 支援、漸進式採用、編譯到 JS  
**缺點**: 編譯步驟、學習成本

#### 選項 3: Rust
**優點**: 效能優秀、記憶體安全、現代語言特性  
**缺點**: 某些平台支援有限、生態系統相對較小

### 決策
採用 **TypeScript**

### 理由
1. **類型安全**: 編譯時錯誤檢查，減少運行時錯誤
2. **IDE 支援**: 優秀的自動完成、重構、導航功能
3. **生態系統**: 豐富的 npm 生態系統
4. **平台兼容**: 所有目標平台都支援 JavaScript/TypeScript
5. **團隊熟悉度**: 團隊已有相關經驗

### 後果
- **正面**: 代碼品質提升，開發效率提高，重構安全
- **負面**: 需要編譯步驟，類型定義維護

---

## ADR-003: 使用 Monorepo 管理多個 Package

**日期**: 2024-01-XX  
**狀態**: 提議中  
**決策者**: 開發團隊

### 問題陳述
如何組織和管理核心庫、平台適配器、插件等多個相關但獨立的組件，同時支援不同開發團隊的套件管理器偏好。

### 考慮選項

#### 選項 1: 多個獨立 Repository
**優點**: 完全獨立，版本控制簡單  
**缺點**: 依賴管理複雜，跨 repo 更改困難，版本同步問題

#### 選項 2: 單一 Repository，所有代碼在一起
**優點**: 簡單  
**缺點**: 構建和發布複雜，無法獨立版本控制

#### 選項 3: Monorepo + 多套件管理器支援 ✅
支援多種 monorepo 解決方案和套件管理器
**優點**: 統一依賴管理，跨 package 重構容易，版本同步簡單，開發者選擇靈活  
**缺點**: 初期設置複雜，需要維護多套配置

### 決策
採用 **Monorepo** 結構，**支援多種套件管理器和工具**：

#### 主要支援的套件管理器
1. **pnpm workspaces** (推薦) - 高效能、節省磁碟空間
2. **Yarn workspaces** - 成熟穩定、功能完整  
3. **npm workspaces** - 原生支援、無額外依賴

#### 可選的 Monorepo 工具
- **Lerna** - 傳統成熟方案
- **Rush** - 企業級大型專案
- **Nx** - 現代化開發體驗

### 理由
1. **依賴管理**: 統一管理所有 package 的依賴
2. **開發效率**: 跨 package 修改和測試更容易
3. **版本控制**: 可以原子性地修改多個 package
4. **CI/CD**: 統一的建置和測試流程
5. **開發者友好**: 支援不同團隊的工具偏好
6. **靈活性**: 可根據專案規模選擇合適的工具
7. **遷移容易**: 提供統一的 API，工具間切換成本低

### 實施策略
1. **預設配置**: 提供 pnpm workspaces 作為預設和推薦配置
2. **多重配置**: 同時維護多種套件管理器的配置檔
3. **統一腳本**: 所有工具使用相同的 npm scripts 介面
4. **自動檢測**: 提供自動檢測腳本，根據環境推薦最佳配置
5. **文件完整**: 為每種工具提供詳細的設置和使用指南

### 後果
- **正面**: 開發效率提升，依賴管理簡化，版本同步容易，開發者選擇靈活，社群接受度高
- **負面**: 初期設置較複雜，需要維護多套配置，文檔工作量增加

---

## ADR-004: 接口設計原則

**日期**: 2024-01-XX  
**狀態**: 提議中  
**決策者**: 開發團隊

### 問題陳述
如何設計平台抽象接口，使其既能滿足不同平台的能力差異，又能保持一致的API。

### 設計原則

#### 1. 最小公約數原則
接口應該基於所有平台都能實現的最小功能集設計
```typescript
// ✅ 所有平台都支援
interface IEditor {
    insertText(text: string): Promise<void>;
}

// ❌ 某些平台不支援
interface IEditor {
    insertSnippet(snippet: SnippetString): Promise<void>; // VS Code 特有
}
```

#### 2. 優雅降級原則
高級功能應該可選，並提供降級策略
```typescript
interface IUI {
    showMessage(message: string): Promise<void>;
    showRichMessage?(html: string): Promise<void>; // 可選，支援 HTML
}
```

#### 3. 能力查詢原則
提供能力查詢接口，讓核心邏輯適應不同平台
```typescript
interface IPlatform {
    supports(feature: string): boolean;
    getCapabilities(): PlatformCapabilities;
}

// 使用方式
if (platform.supports('webview')) {
    await ui.createWebviewPanel(options);
} else {
    await ui.showMessage('功能不支援 WebView 的平台');
}
```

#### 4. 異步優先原則
所有可能涉及 I/O 的操作都設計為異步
```typescript
// ✅ 異步設計
interface IStorage {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
}

// ❌ 同步設計（某些平台可能需要異步）
interface IStorage {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
}
```

### 決策
採用上述四個設計原則指導接口設計

### 理由
1. **兼容性**: 確保所有目標平台都能實現基本功能
2. **可擴展性**: 允許平台發揮特有能力
3. **穩定性**: 異步設計適應不同平台的實現差異
4. **適應性**: 核心邏輯能夠適應平台能力差異

---

## ADR-005: 錯誤處理策略

**日期**: 2024-01-XX  
**狀態**: 提議中  
**決策者**: 開發團隊

### 問題陳述
設計統一的錯誤處理機制，處理不同平台可能出現的各種錯誤情況。

### 考慮選項

#### 選項 1: 異常拋出
```typescript
async function insertText(text: string): Promise<void> {
    if (!editor.isActive()) {
        throw new Error('No active editor');
    }
    // ...
}
```

#### 選項 2: Result 類型 ✅
```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

async function insertText(text: string): Promise<Result<void>> {
    if (!editor.isActive()) {
        return { success: false, error: new Error('No active editor') };
    }
    // ...
    return { success: true, data: undefined };
}
```

#### 選項 3: 混合模式
核心層使用 Result，適配器層處理異常轉換

### 決策
採用 **混合模式**：
- 核心業務邏輯使用 Result 類型
- 平台適配器負責異常捕獲和轉換
- 對外 API 提供兩種模式

### 理由
1. **明確性**: Result 類型讓錯誤處理更明確
2. **靈活性**: 不同層可以選擇合適的錯誤處理方式
3. **兼容性**: 適配不同平台的錯誤處理慣例

---

## ADR-006: 測試策略

**日期**: 2024-01-XX  
**狀態**: 提議中  
**決策者**: 開發團隊

### 問題陳述
設計測試策略，確保多平台架構的質量和穩定性。

### 測試層級

#### 1. 單元測試 (Unit Tests)
- **範圍**: 核心業務邏輯
- **工具**: Jest + TypeScript
- **覆蓋率目標**: 80%+
- **Mock**: 使用 Mock 平台適配器

```typescript
describe('TemplateService', () => {
    let service: TemplateService;
    let mockPlatform: jest.Mocked<IPlatform>;

    beforeEach(() => {
        mockPlatform = createMockPlatform();
        service = new TemplateService(mockPlatform);
    });

    it('should insert template with correct formatting', async () => {
        // 測試邏輯
    });
});
```

#### 2. 整合測試 (Integration Tests)
- **範圍**: 核心服務與平台適配器的整合
- **工具**: Jest + 實際平台適配器
- **重點**: 接口契約驗證

#### 3. 端到端測試 (E2E Tests)
- **範圍**: 完整的用戶工作流程
- **工具**: 平台特定測試工具
- **重點**: 用戶體驗驗證

#### 4. 契約測試 (Contract Tests)
- **範圍**: 平台適配器接口實現
- **工具**: 自定義契約測試套件
- **重點**: 確保所有適配器實現相同行為

### 決策
採用**四層測試策略**，優先投入在單元測試和契約測試

### 理由
1. **品質保證**: 多層次測試確保代碼品質
2. **快速反饋**: 單元測試提供快速反饋循環
3. **平台一致性**: 契約測試確保平台行為一致
4. **用戶體驗**: E2E 測試驗證實際用戶體驗

---

## ADR-007: 版本管理和發布策略

**日期**: 2024-01-XX  
**狀態**: 提議中  
**決策者**: 開發團隊

### 問題陳述
管理多個 package 和多個平台插件的版本控制和發布流程。

### 版本管理策略

#### 1. 語義化版本控制 (Semantic Versioning)
所有 package 遵循 SemVer 規範：
- `MAJOR.MINOR.PATCH`
- Breaking changes → MAJOR
- New features → MINOR
- Bug fixes → PATCH

#### 2. 獨立版本 vs 統一版本
- **核心 packages**: 統一版本，同步發布
- **平台插件**: 獨立版本，按需發布

#### 3. 發布流程
```bash
# 1. 自動化測試
pnpm test:all

# 2. 版本更新
pnpm changeset version

# 3. 建置所有 packages
pnpm build:all

# 4. 發布到對應平台
pnpm release:vscode  # 發布到 VS Code Marketplace
pnpm release:vim     # 發布到 Vim 插件庫
# ...
```

### 決策
採用**混合版本管理**：核心統一，插件獨立

### 理由
1. **核心一致性**: 核心 packages 統一版本確保兼容性
2. **插件靈活性**: 插件可以根據平台特性獨立迭代
3. **用戶體驗**: 用戶只關心其使用平台的版本

---

## 總結

這些架構決策為 TextBricks 多平台重構提供了清晰的指導原則。隨著實施進展，我們會持續評估和調整這些決策，確保架構能夠滿足實際需求。

**下一步行動**:
1. 團隊評審所有 ADR
2. 基於決策開始 Phase 1 實施
3. 在實施過程中驗證架構決策
4. 根據實際情況調整和細化

---

*文檔維護：請在重要架構變更時更新相應的 ADR*