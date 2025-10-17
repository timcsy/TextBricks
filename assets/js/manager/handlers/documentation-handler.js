// Documentation Handler - 文檔處理器
// 負責處理文檔的類型檢測、預覽和範本生成

(function() {
    'use strict';

    /**
     * Documentation Handler 類
     * 處理文檔相關的所有操作
     */
    class DocumentationHandler {
        constructor(context) {
            this.context = context;
        }

        /**
         * 獲取文檔類型
         */
        getDocumentationType(documentation) {
            if (!documentation) return '';

            // Check for URL
            if (documentation.startsWith('http://') || documentation.startsWith('https://')) {
                return 'url';
            }

            // Check for file path - must be a simple path, not multiline content
            const isLikelyFilePath = documentation.length < 500 &&
                                    !documentation.includes('\n') &&
                                    !documentation.includes('\r') &&
                                    (documentation.endsWith('.md') ||
                                     (documentation.includes('/') || documentation.includes('\\')) &&
                                     !documentation.startsWith('#')); // Markdown usually starts with #

            if (isLikelyFilePath) {
                return 'file';
            }

            return 'markdown';
        }

        /**
         * 處理模板文檔類型變更
         */
        handleTemplateDocumentationTypeChange(type) {
            const contentGroup = document.getElementById('documentation-content-group');
            const inputContainer = document.getElementById('documentation-input-container');

            if (!contentGroup || !inputContainer) return;

            if (type === '') {
                contentGroup.style.display = 'none';
                inputContainer.innerHTML = '';
                return;
            }

            contentGroup.style.display = 'block';

            const inputHTML = this._getDocumentationInputHTML(type, 'template');
            inputContainer.innerHTML = inputHTML;

            // Set existing value if editing template
            const modalManager = this.context.getModalManager();
            const editingItem = modalManager.getEditingItem();
            if (editingItem && editingItem.documentation) {
                const currentType = this.getDocumentationType(editingItem.documentation);
                if (currentType === type) {
                    const input = document.getElementById('template-documentation');
                    if (input) {
                        input.value = editingItem.documentation;
                    }
                }
            }
        }

        /**
         * 處理主題文檔類型變更
         */
        handleTopicDocumentationTypeChange(type) {
            const contentGroup = document.getElementById('topic-documentation-content-group');
            const inputContainer = document.getElementById('topic-documentation-input-container');

            if (!contentGroup || !inputContainer) return;

            if (type === '') {
                contentGroup.style.display = 'none';
                inputContainer.innerHTML = '';
                return;
            }

            contentGroup.style.display = 'block';

            const inputHTML = this._getDocumentationInputHTML(type, 'topic');
            inputContainer.innerHTML = inputHTML;

            // Set existing value if editing topic
            const modalManager = this.context.getModalManager();
            const editingItem = modalManager.getEditingItem();
            if (editingItem && editingItem.documentation) {
                const currentType = this.getDocumentationType(editingItem.documentation);
                if (currentType === type) {
                    const input = document.getElementById('topic-documentation');
                    if (input) {
                        input.value = editingItem.documentation;
                    }
                }
            }
        }

        /**
         * 獲取文檔輸入 HTML（私有方法）
         */
        _getDocumentationInputHTML(type, itemType) {
            const idPrefix = itemType === 'template' ? 'template' : 'topic';
            const examplePath = itemType === 'template' ? 'template-guide.md' : 'topic-guide.md';
            const exampleUrl = itemType === 'template' ? 'documentation.html' : 'topic-guide.html';

            switch (type) {
                case 'markdown':
                    return `
                        <textarea id="${idPrefix}-documentation" rows="10" placeholder="請輸入 Markdown 格式的說明文件..."></textarea>
                        <div class="form-help">支援完整 Markdown 語法</div>
                    `;
                case 'file':
                    return `
                        <input type="text" id="${idPrefix}-documentation" placeholder="例如：docs/${examplePath}">
                        <div class="form-help">請輸入相對或絕對檔案路徑</div>
                    `;
                case 'url':
                    return `
                        <input type="url" id="${idPrefix}-documentation" placeholder="例如：https://example.com/${exampleUrl}">
                        <div class="form-help">請輸入外部網頁的完整 URL</div>
                    `;
                default:
                    return '';
            }
        }

        /**
         * 預覽模板文檔
         */
        previewTemplateDocumentation() {
            const docInput = document.getElementById('template-documentation');
            const typeSelect = document.getElementById('template-documentation-type');

            if (!typeSelect || !typeSelect.value) {
                this.context.showError('請先選擇說明文檔類型');
                return;
            }

            if (!docInput || !docInput.value.trim()) {
                this.context.showError('請先輸入說明文檔內容');
                return;
            }

            const content = docInput.value;
            const type = typeSelect.value;

            // 創建臨時模板對象進行預覽
            const modalManager = this.context.getModalManager();
            const editingItem = modalManager.getEditingItem();
            const title = editingItem ? `模板文檔預覽 - ${editingItem.title}` : '模板文檔預覽 - 新模板';

            const tempTemplate = {
                title: title,
                name: 'preview',
                documentation: content
            };

            // 如果是 markdown，使用後端渲染；否則顯示簡單預覽
            if (type === 'markdown') {
                modalManager.showDocumentationModal(tempTemplate, 'template');
            } else {
                this._showSimplePreview(content, type, title);
            }
        }

        /**
         * 預覽主題文檔
         */
        previewTopicDocumentation() {
            const docInput = document.getElementById('topic-documentation');
            const typeSelect = document.getElementById('topic-documentation-type');

            if (!typeSelect || !typeSelect.value) {
                this.context.showError('請先選擇說明文檔類型');
                return;
            }

            if (!docInput || !docInput.value.trim()) {
                this.context.showError('請先輸入說明文檔內容');
                return;
            }

            const content = docInput.value;
            const type = typeSelect.value;

            // 創建臨時主題對象進行預覽
            const modalManager = this.context.getModalManager();
            const editingItem = modalManager.getEditingItem();
            const title = editingItem ? `主題文檔預覽 - ${editingItem.title || editingItem.name}` : '主題文檔預覽 - 新主題';

            const tempTopic = {
                title: title,
                name: 'preview',
                documentation: content
            };

            // 如果是 markdown，使用後端渲染；否則顯示簡單預覽
            if (type === 'markdown') {
                modalManager.showDocumentationModal(tempTopic, 'topic');
            } else {
                this._showSimplePreview(content, type, title);
            }
        }

        /**
         * 顯示簡單預覽（非 Markdown）（私有方法）
         */
        _showSimplePreview(content, type, title) {
            const utils = this.context.getUtils();
            let contentHtml;

            switch (type) {
                case 'file':
                    contentHtml = `
                        <div class="file-path-preview">
                            <h2>📄 檔案路徑</h2>
                            <div class="path-display"><code>${utils.escapeHtml(content)}</code></div>
                            <p class="path-note">注意：確保此檔案存在且可讀取</p>
                        </div>
                    `;
                    break;
                case 'url':
                    contentHtml = `
                        <div class="url-preview">
                            <h2>🌐 外部連結</h2>
                            <div class="url-display">
                                <a href="${utils.escapeHtml(content)}" target="_blank" rel="noopener noreferrer">${utils.escapeHtml(content)}</a>
                            </div>
                            <p class="url-note">點擊連結可在新視窗中開啟</p>
                        </div>
                    `;
                    break;
                default:
                    contentHtml = `
                        <div class="error">
                            <h2>⚠️ 無法預覽</h2>
                            <p>請先選擇說明文檔類型</p>
                        </div>
                    `;
            }

            const modalManager = this.context.getModalManager();
            modalManager._displayDocumentationModal(contentHtml, title);
        }

        /**
         * 生成模板文檔標準格式
         */
        generateTemplateDocumentationTemplate() {
            const titleInput = document.getElementById('template-title');
            const descriptionInput = document.getElementById('template-description');
            const codeInput = document.getElementById('template-code');
            const languageSelect = document.getElementById('template-language');
            const docInput = document.getElementById('template-documentation');

            if (!titleInput || !descriptionInput || !codeInput || !languageSelect || !docInput) return;

            const title = titleInput.value || '模板標題';
            const description = descriptionInput.value || '模板描述';
            const code = codeInput.value || '';
            const language = languageSelect.value || '';

            const template = `# ${title}

## 功能簡介
${description}

## 模板內容
\`\`\`${language}
${code}
\`\`\`

## 範例輸入
\`\`\`
(如果需要輸入，請在此提供範例輸入)
\`\`\`

## 範例輸出
\`\`\`
(請在此提供預期的程式輸出結果)
\`\`\`

## 重點說明
- 解釋關鍵概念和語法要點
- 提供注意事項和常見錯誤
- 建議延伸學習方向

## 相關模板
- 列出相關或進階的模板建議
`;

            docInput.value = template;
        }

        /**
         * 生成主題文檔標準格式
         */
        generateTopicDocumentationTemplate() {
            const titleInput = document.getElementById('topic-title');
            const descriptionInput = document.getElementById('topic-description');
            const docInput = document.getElementById('topic-documentation');

            if (!titleInput || !descriptionInput || !docInput) return;

            const title = titleInput.value || '主題名稱';
            const description = descriptionInput.value || '主題描述';

            const template = `# ${title}

## 主題簡介
${description}

## 內容概覽
這個主題包含了以下內容：

- **核心概念**：基本原理和重要概念
- **實用範例**：實際應用和程式範例
- **進階技巧**：高級用法和最佳實踐

## 相關技術
- 相關技術1
- 相關技術2

## 使用指南
1. **基礎瞭解**：掌握基本概念和語法
2. **實際操作**：參考範例程式進行實作
3. **深入探索**：嘗試不同的應用場景
4. **最佳實踐**：遵循業界標準和建議

## 相關主題
- 相關主題1
- 相關主題2

## 參考資料
- 官方文檔
- 推薦教程
- 實用工具`;

            docInput.value = template;
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DocumentationHandler;
    } else {
        window.DocumentationHandler = DocumentationHandler;
    }
})();
