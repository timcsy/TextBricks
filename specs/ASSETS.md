# TextBricks 資產管理

## 📁 目錄結構

### 根目錄資產 (標準專案結構)
```
├── assets/          # 標準資產目錄
│   ├── icons/       # VS Code 擴展圖示
│   │   ├── TextBricks.ico    # 擴展圖示 (package.json icon)
│   │   └── TextBricks.svg    # 活動欄圖示 (viewsContainers icon)
│   ├── css/         # 樣式表
│   │   ├── style.css
│   │   ├── documentation.css
│   │   └── textbricks-manager.css  # TextBricks Manager styles
│   └── js/          # JavaScript 檔案
│       ├── main.js
│       ├── documentation.js
│       └── textbricks-manager.js  # TextBricks Manager logic
```

### VS Code 包資產 (開發時使用)
```
packages/vscode/
├── src/data/        # 模板資料
└── dist/            # 構建輸出 (自動生成)
    ├── data/        # 複製自 src/data/
    └── assets/      # 複製自根目錄 assets/
        ├── css/     # CSS 檔案
        ├── js/      # JavaScript 檔案
        └── icons/   # 圖示檔案
```

## 🔄 資產管理策略

### 主要來源
- **icons/, media/** - 根目錄作為主要來源
- **packages/vscode/src/data/** - VS Code 包特定資料

### 構建流程
1. **開發階段** - 直接使用根目錄資產
2. **構建階段** - 複製到 packages/vscode/dist/
3. **發布階段** - 從根目錄發布 VS Code 擴展

### 同步機制
- VS Code 包構建時自動複製根目錄資產
- 避免重複儲存，減少維護負擔
- 保持 VS Code 擴展發布格式相容性

## 🎯 設計原則

1. **單一來源** - 根目錄資產為權威來源
2. **自動同步** - 構建時自動複製，避免手動同步
3. **向後相容** - 保持 VS Code 擴展發布格式
4. **清晰分離** - 區分開發資產和發布資產

---
*此文檔說明 monorepo 架構下的資產管理策略*