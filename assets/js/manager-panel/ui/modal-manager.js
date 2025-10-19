// Modal Manager - 模態框管理器
// 負責管理模態框的開啟、關閉和內容渲染

(function() {
    'use strict';

    /**
     * Modal Manager 類
     * 統一管理所有模態框的顯示邏輯
     */
    class ModalManager {
        constructor(context) {
            this.context = context;
            this.editingItem = null;
        }

        /**
         * 打開模態框
         * @param {string} type - 模態框類型 ('template', 'topic', 'link', 'language')
         * @param {Object} item - 編輯的項目（如果是創建則為 null）
         * @param {Object} prefillData - 預填資料（可選）
         */
        openModal(type, item = null, prefillData = null) {
            console.log('[ModalManager] openModal called with type:', type, 'item:', item, 'prefillData:', prefillData);
            this.editingItem = item;

            const modal = document.getElementById('modal');
            const title = document.getElementById('modal-title');
            const body = document.getElementById('modal-body');

            if (!modal || !title || !body) {
                console.error('Modal elements not found');
                return;
            }

            let titleText, bodyHTML;

            // 根據類型生成對應的標題和表單
            switch (type) {
                case 'template':
                    titleText = item ? '編輯模板' : '創建新模板';
                    console.log('[ModalManager] Calling getTemplateForm with item:', item, 'prefillData:', prefillData);
                    bodyHTML = this.context.getFormGenerator().getTemplateForm(item, prefillData);
                    break;
                case 'topic':
                    titleText = item ? '編輯主題' : '創建新主題';
                    console.log('[ModalManager] Calling getTopicForm with item:', item, 'prefillData:', prefillData);
                    bodyHTML = this.context.getFormGenerator().getTopicForm(item, prefillData);
                    break;
                case 'link':
                    titleText = item ? '編輯連結' : '創建新連結';
                    console.log('[ModalManager] Calling getLinkForm with item:', item, 'prefillData:', prefillData);
                    bodyHTML = this.context.getFormGenerator().getLinkForm(item, prefillData);
                    break;
                case 'language':
                    titleText = item ? '編輯語言' : '創建新語言';
                    bodyHTML = this.context.getFormGenerator().getLanguageForm(item, prefillData);
                    break;
                default:
                    console.error('Unknown modal type:', type);
                    return;
            }

            // 設置模態框內容
            title.textContent = titleText;
            body.innerHTML = bodyHTML;
            modal.classList.add('active');
            modal.dataset.type = type;

            // 根據類型設置特殊處理
            this._setupModalSpecialHandlers(type, item);

            // 預填資料（如果有）
            if (prefillData) {
                this._prefillFormData(type, prefillData);
            }

            // 聚焦第一個輸入框
            this._focusFirstInput(body);
        }

        /**
         * 關閉模態框
         */
        closeModal() {
            const modal = document.getElementById('modal');
            if (modal) {
                modal.classList.remove('active');
            }
            this.editingItem = null;
        }

        /**
         * 獲取當前編輯的項目
         */
        getEditingItem() {
            return this.editingItem;
        }

        /**
         * 打開主題瀏覽器
         */
        openTopicBrowser(targetInputId = 'template-topic', displayInputId = null) {
            const browserModal = document.createElement('div');
            browserModal.className = 'modal active topic-browser-modal';

            browserModal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>瀏覽主題</h2>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="target-browser-content">
                            <div class="browser-tree" id="topic-browser-tree">
                                <div class="loading">載入中...</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-topic-btn">取消</button>
                        <button class="btn btn-secondary" id="create-topic-from-browser">+ 新增主題</button>
                        <button class="btn btn-primary" id="select-topic-btn" disabled>選擇</button>
                    </div>
                </div>
            `;

            document.body.appendChild(browserModal);

            // 設置事件監聽器
            this._setupTopicBrowserListeners(browserModal, targetInputId, displayInputId);

            // 渲染主題樹
            this._renderTopicBrowserTree();
        }

        /**
         * 打開目標瀏覽器（可選主題或模板）
         */
        openTargetBrowser() {
            const browserModal = document.createElement('div');
            browserModal.className = 'modal active target-browser-modal';

            browserModal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>選擇目標</h2>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="target-browser-content">
                            <div class="browser-tree" id="target-browser-tree">
                                <div class="loading">載入中...</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-target-btn">取消</button>
                        <button class="btn btn-primary" id="select-target-btn" disabled>選擇</button>
                    </div>
                </div>
            `;

            document.body.appendChild(browserModal);

            // 設置事件監聽器
            this._setupTargetBrowserListeners(browserModal);

            // 渲染目標樹
            this._renderTargetBrowserTree();
        }

        /**
         * 顯示文檔模態框
         */
        showDocumentationModal(item, itemType) {
            const requestId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 監聽渲染結果
            const messageHandler = (event) => {
                const message = event.data;
                if (message.type === 'documentationRendered' && message.requestId === requestId) {
                    // 移除監聽器
                    window.removeEventListener('message', messageHandler);

                    // 顯示模態框
                    this._displayDocumentationModal(message.html, message.title);
                }
            };
            window.addEventListener('message', messageHandler);

            // 發送渲染請求
            const vscode = this.context.getVSCode();
            if (itemType === 'template') {
                vscode.postMessage({
                    type: 'renderTemplateDocumentation',
                    requestId: requestId,
                    template: item
                });
            } else if (itemType === 'topic') {
                vscode.postMessage({
                    type: 'renderTopicDocumentation',
                    requestId: requestId,
                    topic: item
                });
            }
        }

        /**
         * 設置模態框特殊處理（私有方法）
         */
        _setupModalSpecialHandlers(type, item) {
            setTimeout(() => {
                if (type === 'template') {
                    this._setupTemplateModalHandlers(item);
                } else if (type === 'topic') {
                    this._setupTopicModalHandlers(item);
                } else if (type === 'link') {
                    this._setupLinkModalHandlers(item);
                }
            }, 50);
        }

        /**
         * 設置模板模態框處理器（私有方法）
         */
        _setupTemplateModalHandlers(item) {
            // 設置文檔類型處理
            if (item && item.documentation) {
                const docTypeSelect = document.getElementById('template-documentation-type');
                if (docTypeSelect) {
                    const docType = this.context.getDocumentationType(item.documentation);
                    docTypeSelect.value = docType;
                    this.context.handleDocumentationTypeChange(docType);
                }
            }

            // 設置主題瀏覽按鈕
            const browseBtn = document.getElementById('browse-topic-btn');
            if (browseBtn) {
                browseBtn.addEventListener('click', () => {
                    this.openTopicBrowser('template-topic', 'template-topic-display');
                });
            }
        }

        /**
         * 設置主題模態框處理器（私有方法）
         */
        _setupTopicModalHandlers(item) {
            // 設置文檔類型處理
            if (item && item.documentation) {
                const docTypeSelect = document.getElementById('topic-documentation-type');
                if (docTypeSelect) {
                    const docType = this.context.getDocumentationType(item.documentation);
                    docTypeSelect.value = docType;
                    this.context.handleTopicDocumentationTypeChange(docType);
                }
            }

            // 設置父主題瀏覽按鈕
            const browseParentBtn = document.getElementById('browse-parent-topic-btn');
            const clearParentBtn = document.getElementById('clear-parent-topic-btn');

            if (browseParentBtn) {
                browseParentBtn.addEventListener('click', () => {
                    this.openTopicBrowser('topic-parent', 'topic-parent-display');
                });
            }

            if (clearParentBtn) {
                clearParentBtn.addEventListener('click', () => {
                    const parentInput = document.getElementById('topic-parent');
                    const parentDisplayInput = document.getElementById('topic-parent-display');
                    if (parentInput) parentInput.value = '';
                    if (parentDisplayInput) parentDisplayInput.value = '';
                });
            }
        }

        /**
         * 設置連結模態框處理器（私有方法）
         */
        _setupLinkModalHandlers(item) {
            // 設置目標瀏覽按鈕
            const browseTargetBtn = document.getElementById('browse-target-btn');
            if (browseTargetBtn) {
                browseTargetBtn.addEventListener('click', () => {
                    this.openTargetBrowser();
                });
            }

            // 設置保存到主題瀏覽按鈕
            const browseSaveToTopicBtn = document.getElementById('browse-save-to-topic-btn');
            if (browseSaveToTopicBtn) {
                browseSaveToTopicBtn.addEventListener('click', () => {
                    this.openTopicBrowser('link-save-to-topic', 'link-save-to-topic-display');
                });
            }
        }

        /**
         * 聚焦第一個輸入框（私有方法）
         */
        _focusFirstInput(body) {
            const firstInput = body.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }

        /**
         * 預填表單資料（私有方法）
         */
        _prefillFormData(type, prefillData) {
            setTimeout(() => {
                if (type === 'topic' && prefillData.parentPath) {
                    // 預填父主題路徑
                    const parentInput = document.getElementById('topic-parent');
                    const parentDisplayInput = document.getElementById('topic-parent-display');

                    if (parentInput) {
                        parentInput.value = prefillData.parentPath;
                    }

                    if (parentDisplayInput) {
                        const displayPath = this.context.getDisplayPath(prefillData.parentPath);
                        parentDisplayInput.value = displayPath;
                    }
                } else if (type === 'template' && prefillData.topicPath) {
                    // 預填模板主題路徑
                    const topicInput = document.getElementById('template-topic');
                    const topicDisplayInput = document.getElementById('template-topic-display');

                    if (topicInput) {
                        topicInput.value = prefillData.topicPath;
                    }

                    if (topicDisplayInput) {
                        const displayPath = this.context.getDisplayPath(prefillData.topicPath);
                        topicDisplayInput.value = displayPath;
                    }
                } else if (type === 'link' && prefillData.targetPath) {
                    // 預填連結目標路徑
                    const targetInput = document.getElementById('link-target');
                    const targetDisplayInput = document.getElementById('link-target-display');

                    if (targetInput) {
                        targetInput.value = prefillData.targetPath;
                    }

                    if (targetDisplayInput) {
                        const displayPath = this.context.getDisplayPath(prefillData.targetPath);
                        targetDisplayInput.value = displayPath;
                    }
                }
            }, 100); // 延遲以確保 DOM 已經渲染完成
        }

        /**
         * 設置主題瀏覽器監聽器（私有方法）
         */
        _setupTopicBrowserListeners(browserModal, targetInputId, displayInputId) {
            const closeBtn = browserModal.querySelector('.modal-close-btn');
            const cancelBtn = browserModal.querySelector('#cancel-topic-btn');
            const selectBtn = browserModal.querySelector('#select-topic-btn');
            const createBtn = browserModal.querySelector('#create-topic-from-browser');

            const closeBrowser = () => {
                browserModal.remove();
            };

            if (closeBtn) closeBtn.addEventListener('click', closeBrowser);
            if (cancelBtn) cancelBtn.addEventListener('click', closeBrowser);

            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    const selected = browserModal.querySelector('.tree-item.selected');
                    if (selected) {
                        const node = selected.closest('.tree-node');
                        const topicPath = node.dataset.path;
                        const displayPath = this.context.getDisplayPath(topicPath);

                        // 設置目標輸入框
                        const targetInput = document.getElementById(targetInputId);
                        if (targetInput) targetInput.value = topicPath;

                        // 設置顯示輸入框
                        if (displayInputId) {
                            const displayInput = document.getElementById(displayInputId);
                            if (displayInput) displayInput.value = displayPath;
                        }

                        closeBrowser();
                    }
                });
            }

            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    closeBrowser();
                    this.openModal('topic');
                });
            }
        }

        /**
         * 設置目標瀏覽器監聽器（私有方法）
         */
        _setupTargetBrowserListeners(browserModal) {
            const closeBtn = browserModal.querySelector('.modal-close-btn');
            const cancelBtn = browserModal.querySelector('#cancel-target-btn');
            const selectBtn = browserModal.querySelector('#select-target-btn');

            const closeBrowser = () => {
                browserModal.remove();
            };

            if (closeBtn) closeBtn.addEventListener('click', closeBrowser);
            if (cancelBtn) cancelBtn.addEventListener('click', closeBrowser);

            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    const selected = browserModal.querySelector('.tree-item.selected');
                    if (selected) {
                        const node = selected.closest('.tree-node');
                        const nodePath = node.dataset.path;
                        const nodeType = node.dataset.type;

                        let targetPath = nodePath;

                        // 如果選擇的是連結，則使用連結的目標路徑
                        if (nodeType === 'link') {
                            const dataHelpers = this.context.getDataHelpers();
                            const linkName = nodePath.split('/links/').pop();
                            const link = dataHelpers.findLinkByName(linkName);

                            if (link && link.target) {
                                targetPath = link.target;
                            }
                        }

                        const displayPath = this.context.getDisplayPath(targetPath);

                        const targetInput = document.getElementById('link-target');
                        const displayInput = document.getElementById('link-target-display');

                        if (targetInput) targetInput.value = targetPath;
                        if (displayInput) displayInput.value = displayPath;

                        closeBrowser();
                    }
                });
            }
        }

        /**
         * 渲染主題瀏覽器樹（私有方法）
         */
        _renderTopicBrowserTree() {
            const treeContainer = document.getElementById('topic-browser-tree');
            if (!treeContainer) return;

            const currentData = this.context.getCurrentData();
            const treeBuilderService = this.context.getTreeBuilderService();

            const hierarchy = currentData.topics?.hierarchy?.roots || [];
            const templates = currentData.templates || [];
            const treeData = treeBuilderService.buildContentTree(hierarchy, templates);

            // 只顯示主題，不顯示模板
            const topicsOnly = this._filterTopicsOnly(treeData);

            if (topicsOnly.length === 0) {
                treeContainer.innerHTML = '<div class="no-data">尚無可用主題</div>';
                return;
            }

            const html = topicsOnly.map(node => this._renderBrowserTreeNode(node, 0)).join('');
            treeContainer.innerHTML = html;

            // 設置樹互動
            this._setupBrowserTreeInteractions(treeContainer);
        }

        /**
         * 渲染目標瀏覽器樹（私有方法）
         */
        _renderTargetBrowserTree() {
            const treeContainer = document.getElementById('target-browser-tree');
            if (!treeContainer) return;

            const currentData = this.context.getCurrentData();
            const treeBuilderService = this.context.getTreeBuilderService();

            const hierarchy = currentData.topics?.hierarchy?.roots || [];
            const templates = currentData.templates || [];
            const treeData = treeBuilderService.buildContentTree(hierarchy, templates);

            if (treeData.length === 0) {
                treeContainer.innerHTML = '<div class="no-data">尚無可用目標</div>';
                return;
            }

            const html = treeData.map(node => this._renderBrowserTreeNode(node, 0)).join('');
            treeContainer.innerHTML = html;

            // 設置樹互動
            this._setupBrowserTreeInteractions(treeContainer);
        }

        /**
         * 過濾只保留主題（私有方法）
         */
        _filterTopicsOnly(nodes) {
            return nodes.filter(node => node.type === 'topic').map(node => ({
                ...node,
                children: node.children ? this._filterTopicsOnly(node.children) : []
            }));
        }

        /**
         * 渲染瀏覽器樹節點（私有方法）
         */
        _renderBrowserTreeNode(node, depth) {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = depth === 0; // 頂層默認展開

            // 根據節點類型設置圖示
            let icon;
            switch (node.type) {
                case 'topic':
                    icon = node.data?.display?.icon || '🏷️';
                    break;
                case 'template':
                    icon = '📄';
                    break;
                case 'link':
                    icon = '🔗';
                    break;
                default:
                    icon = '📄';
            }

            const toggleClass = hasChildren ? (isExpanded ? 'expanded' : 'collapsed') : 'leaf';

            const utils = this.context.getUtils();

            return `
                <div class="tree-node" data-path="${node.path}" data-type="${node.type}">
                    <div class="tree-item ${node.type}" style="padding-left: ${depth * 16}px">
                        <span class="tree-toggle ${toggleClass}"></span>
                        <span class="tree-icon">${icon}</span>
                        <span class="tree-label">${utils.escapeHtml(node.title || node.name)}</span>
                    </div>
                    ${hasChildren ? `
                        <div class="tree-children" style="display: ${isExpanded ? 'block' : 'none'}">
                            ${node.children.map(child => this._renderBrowserTreeNode(child, depth + 1)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * 設置瀏覽器樹互動（私有方法）
         */
        _setupBrowserTreeInteractions(container) {
            container.addEventListener('click', (e) => {
                const toggle = e.target.closest('.tree-toggle');
                const item = e.target.closest('.tree-item');

                if (toggle && !toggle.classList.contains('leaf')) {
                    // Toggle expand/collapse
                    const node = toggle.closest('.tree-node');
                    const children = node.querySelector('.tree-children');

                    if (children) {
                        const isExpanded = toggle.classList.contains('expanded');
                        toggle.classList.toggle('expanded', !isExpanded);
                        toggle.classList.toggle('collapsed', isExpanded);
                        children.style.display = isExpanded ? 'none' : 'block';
                    }

                    e.stopPropagation();
                } else if (item) {
                    // 選擇項目
                    container.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    // 啟用選擇按鈕
                    const selectBtn = document.querySelector('.modal.active #select-topic-btn, .modal.active #select-target-btn');
                    if (selectBtn) selectBtn.disabled = false;
                }
            });
        }

        /**
         * 顯示文檔模態框內容（私有方法）
         */
        _displayDocumentationModal(html, title) {
            // 移除已存在的文檔模態框
            const existingModal = document.getElementById('documentation-modal');
            if (existingModal) {
                existingModal.remove();
            }

            const utils = this.context.getUtils();
            const docModal = document.createElement('div');
            docModal.id = 'documentation-modal';
            docModal.className = 'modal';
            docModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            docModal.innerHTML = `
                <style>
                    /* Documentation content styles - inline version */
                    .documentation-content {
                        line-height: 1.7;
                    }
                    .documentation-content h1,
                    .documentation-content h2,
                    .documentation-content h3,
                    .documentation-content h4,
                    .documentation-content h5,
                    .documentation-content h6 {
                        margin-top: 24px;
                        margin-bottom: 12px;
                        font-weight: 600;
                        line-height: 1.3;
                        color: var(--vscode-foreground) !important;
                    }
                    .documentation-content h1 {
                        font-size: 28px;
                        border-bottom: 2px solid var(--vscode-panel-border);
                        padding-bottom: 8px;
                    }
                    .documentation-content h2 {
                        font-size: 22px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 6px;
                    }
                    .documentation-content h3 {
                        font-size: 18px;
                    }
                    .documentation-content h4 {
                        font-size: 16px;
                    }
                    .documentation-content p {
                        margin: 12px 0;
                        color: var(--vscode-foreground);
                    }
                    .documentation-content a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: underline;
                        cursor: pointer;
                    }
                    .documentation-content a:hover {
                        color: var(--vscode-textLink-activeForeground);
                    }
                    .documentation-content ul,
                    .documentation-content ol {
                        margin: 12px 0;
                        padding-left: 24px;
                    }
                    .documentation-content li {
                        margin: 6px 0;
                        color: var(--vscode-foreground);
                    }
                    .documentation-content code {
                        background-color: var(--vscode-textCodeBlock-background);
                        color: var(--vscode-textPreformat-foreground);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: 0.9em;
                    }
                    .documentation-content pre {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 16px;
                        margin: 16px 0;
                        overflow-x: auto;
                    }
                    .documentation-content pre code {
                        background: none;
                        padding: 0;
                        border-radius: 0;
                        font-size: 13px;
                        line-height: 1.5;
                        color: var(--vscode-editor-foreground);
                    }
                    .documentation-content blockquote {
                        margin: 16px 0;
                        padding: 12px 16px;
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textLink-foreground);
                        color: var(--vscode-textBlockQuote-foreground);
                        font-style: italic;
                    }
                    .documentation-content blockquote p {
                        margin: 0;
                    }
                    .documentation-content table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 16px 0;
                        font-size: 14px;
                    }
                    .documentation-content th,
                    .documentation-content td {
                        border: 1px solid var(--vscode-panel-border);
                        padding: 8px 12px;
                        text-align: left;
                    }
                    .documentation-content th {
                        background-color: var(--vscode-editorWidget-background);
                        font-weight: 600;
                        color: var(--vscode-foreground);
                    }
                    .documentation-content tr:nth-child(even) {
                        background-color: var(--vscode-list-inactiveSelectionBackground);
                    }

                    /* Code Block Container */
                    .code-block-container {
                        margin: 16px 0;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        background-color: var(--vscode-textCodeBlock-background);
                        overflow: hidden;
                    }
                    .code-block-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background-color: var(--vscode-editorWidget-background) !important;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .language-label {
                        font-size: 11px;
                        font-weight: 600;
                        color: var(--vscode-descriptionForeground);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .code-actions {
                        display: flex;
                        gap: 6px;
                    }
                    .code-action-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 4px 8px;
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-button-border);
                        border-radius: 3px;
                        font-size: 11px;
                        font-family: inherit;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .code-action-btn:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                    .code-action-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .code-block-container pre {
                        margin: 0;
                        border: none;
                        border-radius: 0;
                        background-color: transparent;
                    }
                    .code-block-container pre code {
                        padding: 16px;
                        display: block;
                        background-color: transparent;
                    }

                    /* Force all code elements to have consistent background */
                    .code-block-container pre,
                    .code-block-container code,
                    .code-block-container .hljs,
                    .code-block-container [class*="language-"] {
                        background-color: transparent !important;
                        background: transparent !important;
                    }

                    /* Modal-specific styles */
                    .documentation-modal-backdrop {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.8);
                        z-index: 9999;
                    }
                    .documentation-modal-content {
                        position: relative;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        max-width: 900px;
                        max-height: 90vh;
                        width: 90%;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        z-index: 10001;
                    }
                    .documentation-modal-header {
                        padding: 16px 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: var(--vscode-editorWidget-background);
                    }
                    .documentation-modal-header h3 {
                        margin: 0;
                        color: var(--vscode-foreground);
                        font-size: 18px;
                        font-weight: 600;
                    }
                    .documentation-close-btn {
                        background: none;
                        border: none;
                        color: var(--vscode-foreground);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                    }
                    .documentation-close-btn:hover {
                        background: var(--vscode-toolbar-hoverBackground);
                    }
                    .documentation-modal-body {
                        padding: 20px;
                        overflow-y: auto;
                        flex: 1;
                        background-color: var(--vscode-editor-background);
                    }
                </style>
                <div class="documentation-modal-backdrop"></div>
                <div class="documentation-modal-content">
                    <div class="documentation-modal-header">
                        <h3>${utils.escapeHtml(String(title || ''))}</h3>
                        <button class="documentation-close-btn" title="關閉 (ESC)">✕</button>
                    </div>
                    <div class="documentation-modal-body">
                        <div class="documentation-content">
                            ${html || ''}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(docModal);

            const closeBtn = docModal.querySelector('.documentation-close-btn');
            const backdrop = docModal.querySelector('.documentation-modal-backdrop');

            const closeDocModal = () => {
                docModal.remove();
            };

            if (closeBtn) closeBtn.addEventListener('click', closeDocModal);
            if (backdrop) backdrop.addEventListener('click', closeDocModal);

            // ESC key to close
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    closeDocModal();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ModalManager;
    } else {
        window.ModalManager = ModalManager;
    }
})();
