// Content Renderer - 內容管理渲染
// 負責渲染內容管理頁面的樹狀結構

(function() {
    'use strict';

    /**
     * Content Renderer 類
     * 處理內容管理頁面的渲染邏輯
     */
    class ContentRenderer {
        constructor(context) {
            this.context = context;
            this._listenersSetup = false;
            this._treeData = null;
            this._topicLookup = null;
        }

        /**
         * 渲染內容管理頁面
         */
        render() {
            // 確保內容管理頁面是活躍的

            // 初始化內容管理界面
            this.setupEventListeners();
            this.updateFilters();
            this.renderTree();
        }

        /**
         * 設置事件監聽器
         */
        setupEventListeners() {
            // 防止重複綁定事件監聽器
            if (this._listenersSetup) return;
            this._listenersSetup = true;
            // View mode toggle
            const treeViewBtn = document.getElementById('tree-view-btn');
            const listViewBtn = document.getElementById('list-view-btn');

            if (treeViewBtn && listViewBtn) {
                treeViewBtn.addEventListener('click', () => this.switchView('tree'));
                listViewBtn.addEventListener('click', () => this.switchView('list'));
            }

            // Tree actions
            const addTopicBtn = document.getElementById('add-topic-btn');
            const addTemplateBtn = document.getElementById('add-template-btn');
            const addLinkBtn = document.getElementById('add-link-btn');
            const expandAllBtn = document.getElementById('expand-all-btn');
            const collapseAllBtn = document.getElementById('collapse-all-btn');

            if (addTopicBtn) {
                addTopicBtn.addEventListener('click', () => this.context.openModal('topic'));
            }
            if (addTemplateBtn) {
                addTemplateBtn.addEventListener('click', () => this.context.openModal('template'));
            }
            if (addLinkBtn) {
                addLinkBtn.addEventListener('click', () => this.context.openModal('link'));
            }
            if (expandAllBtn) {
                expandAllBtn.addEventListener('click', () => this.expandAllNodes());
            }
            if (collapseAllBtn) {
                collapseAllBtn.addEventListener('click', () => this.collapseAllNodes());
            }

            // Content filters
            const contentFilterLanguage = document.getElementById('content-filter-language');
            const searchContent = document.getElementById('search-content');

            if (contentFilterLanguage) {
                contentFilterLanguage.addEventListener('change', () => this.filterTree());
            }

            if (searchContent) {
                searchContent.addEventListener('input', () => this.filterTree());
            }
        }

        /**
         * 更新篩選器選項
         */
        updateFilters() {
            const currentData = this.context.getCurrentData();

            // Update language filter options
            const languageFilter = document.getElementById('content-filter-language');
            if (languageFilter && currentData.languages) {
                const utils = this.context.getUtils();
                languageFilter.innerHTML = '<option value="">所有語言</option>' +
                    currentData.languages.map(lang => `<option value="${lang.name}">${utils.escapeHtml(lang.title)}</option>`).join('');
            }

            // Update topic filter options
            const topicFilter = document.getElementById('content-filter-topic');
            if (topicFilter && currentData.templates) {
                const topics = [...new Set(currentData.templates.map(t => t.topic).filter(Boolean))].sort();
                const utils = this.context.getUtils();
                topicFilter.innerHTML = '<option value="">所有主題</option>' +
                    topics.map(topic => `<option value="${utils.escapeHtml(topic)}">${utils.escapeHtml(this.context.getTopicDisplayName(topic))}</option>`).join('');
            }

            // Apply current filters
            this.filterTree();
        }

        /**
         * 切換視圖模式
         */
        switchView(viewType) {
            const treeView = document.getElementById('content-tree-view');
            const listView = document.getElementById('content-list-view');
            const treeBtn = document.getElementById('tree-view-btn');
            const listBtn = document.getElementById('list-view-btn');

            if (viewType === 'tree') {
                treeView?.classList.add('active');
                listView?.classList.remove('active');
                treeBtn?.classList.add('active');
                listBtn?.classList.remove('active');
            } else {
                treeView?.classList.remove('active');
                listView?.classList.add('active');
                treeBtn?.classList.remove('active');
                listBtn?.classList.add('active');

                // Render list view content
                this.context.renderTemplates();
                this.context.renderTopicHierarchy();
            }
        }

        /**
         * 渲染內容樹
         */
        renderTree() {
            const container = document.getElementById('content-tree');
            if (!container) return;

            try {
                // Show loading state
                container.innerHTML = '<div class="loading-state">載入中...</div>';

                const currentData = this.context.getCurrentData();
                const treeBuilderService = this.context.getTreeBuilderService();

                // 使用 TreeBuilderService 構建樹
                const hierarchy = currentData.topics?.hierarchy?.roots || [];
                const templates = currentData.templates || [];
                const treeData = treeBuilderService.buildContentTree(hierarchy, templates);

                // 存儲樹數據到實例變量
                this._treeData = treeData;

                // 建立 topic lookup map
                this._topicLookup = new Map();
                this._buildTopicLookup(treeData);

                // 為了向後兼容，暫時也設置到全局（將在後續移除）
                // TODO: 移除全局變量，改為通過 context 訪問
                window.treeData = treeData;
                window.topicLookup = this._topicLookup;

                if (!treeData || treeData.length === 0) {
                    container.innerHTML = this._renderEmptyState();
                    return;
                }

                const html = treeData.map(node => this._renderTreeNode(node, 0)).join('');
                container.innerHTML = html;

                // Setup tree interactions
                this.setupTreeInteractions();

                // Add keyboard navigation support
                this.setupTreeKeyboardNavigation();

                // Restore previous selection
                setTimeout(() => {
                    this.context.restoreTreeSelection(container);
                }, 100);

            } catch (error) {
                console.error('Error rendering content tree:', error);
                console.error('Error stack:', error.stack);
                const utils = this.context.getUtils();
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <div class="error-text">載入失敗</div>
                        <div class="error-detail" style="font-size: 0.8em; color: #888; margin-top: 8px;">${utils.escapeHtml(error.message)}</div>
                        <button class="btn btn-secondary btn-small" data-action="render-content-tree">重試</button>
                    </div>
                `;
            }
        }

        /**
         * 展開所有節點
         */
        expandAllNodes() {
            document.querySelectorAll('.tree-toggle.collapsed').forEach(toggle => {
                toggle.classList.remove('collapsed');
                toggle.classList.add('expanded');

                const node = toggle.closest('.tree-node');
                const children = node.querySelector('.tree-children');
                if (children) {
                    children.classList.remove('collapsed');
                    children.style.display = 'block';
                }
            });
        }

        /**
         * 摺疊所有節點
         */
        collapseAllNodes() {
            document.querySelectorAll('.tree-toggle.expanded').forEach(toggle => {
                toggle.classList.remove('expanded');
                toggle.classList.add('collapsed');

                const node = toggle.closest('.tree-node');
                const children = node.querySelector('.tree-children');
                if (children) {
                    children.classList.add('collapsed');
                    children.style.display = 'none';
                }
            });
        }

        /**
         * 篩選內容樹
         */
        filterTree() {
            const languageFilter = document.getElementById('content-filter-language')?.value || '';
            const searchFilter = document.getElementById('search-content')?.value?.toLowerCase() || '';
            const currentData = this.context.getCurrentData();

            document.querySelectorAll('.tree-node').forEach(node => {
                const itemType = node.dataset.type;
                const itemPath = node.dataset.path;
                let shouldShow = true;

                if (itemType === 'template') {
                    const template = currentData.templates?.find(t => this.context.buildTemplatePath(t) === itemPath);
                    if (template) {
                        // Language filter
                        if (languageFilter && template.language !== languageFilter) {
                            shouldShow = false;
                        }

                        // Search filter
                        if (searchFilter) {
                            const searchText = (template.title + ' ' + (template.description || '')).toLowerCase();
                            if (!searchText.includes(searchFilter)) {
                                shouldShow = false;
                            }
                        }
                    }
                } else if (itemType === 'topic') {
                    // For topics, check if any child templates match
                    if (languageFilter || searchFilter) {
                        const hasMatchingTemplates = this._hasMatchingChildTemplates(node, languageFilter, searchFilter);
                        shouldShow = hasMatchingTemplates;
                    }
                }

                node.style.display = shouldShow ? 'block' : 'none';
            });
        }

        /**
         * 設置樹狀結構互動
         */
        setupTreeInteractions() {
            const container = document.getElementById('content-tree');
            if (!container) return;

            container.addEventListener('click', (e) => {
                const toggle = e.target.closest('.tree-toggle');
                const item = e.target.closest('.tree-item');

                if (toggle && !toggle.classList.contains('leaf')) {
                    // Toggle expand/collapse
                    const node = toggle.closest('.tree-node');
                    const children = node.querySelector('.tree-children');

                    if (children) {
                        const isExpanded = toggle.classList.contains('expanded');

                        if (isExpanded) {
                            // Collapse
                            toggle.classList.remove('expanded');
                            toggle.classList.add('collapsed');
                            children.classList.add('collapsed');
                            children.style.display = 'none';
                            node.dataset.expanded = 'false';
                        } else {
                            // Expand
                            toggle.classList.remove('collapsed');
                            toggle.classList.add('expanded');
                            children.classList.remove('collapsed');
                            children.style.display = 'block';
                            node.dataset.expanded = 'true';
                        }
                    }

                    e.stopPropagation();
                } else if (item) {
                    // Select item and show details
                    this.selectTreeItem(item);
                }
            });

            // Add double-click to edit
            container.addEventListener('dblclick', (e) => {
                const item = e.target.closest('.tree-item');
                if (item) {
                    const node = item.closest('.tree-node');
                    const itemPath = node.dataset.path;
                    const itemType = node.dataset.type;

                    if (itemType === 'topic') {
                        this.context.editTopic(itemPath);
                    } else if (itemType === 'template') {
                        this.context.editTemplate(itemPath);
                    }
                }
            });

            // Add right-click context menu
            container.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const item = e.target.closest('.tree-item');
                if (item) {
                    this.context.showContextMenu(e, item);
                }
            });

            // Close context menu when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.context-menu')) {
                    this.context.closeContextMenu();
                }
            });
        }

        /**
         * 設置鍵盤導航
         */
        setupTreeKeyboardNavigation() {
            const container = document.getElementById('content-tree');
            if (!container) return;

            container.setAttribute('tabindex', '0'); // Make container focusable

            container.addEventListener('keydown', (e) => {
                const selected = container.querySelector('.tree-item.selected');
                if (!selected) return;

                let nextItem = null;

                switch (e.key) {
                    case 'ArrowDown':
                        nextItem = this.context.getNextTreeItem(selected);
                        break;
                    case 'ArrowUp':
                        nextItem = this.context.getPreviousTreeItem(selected);
                        break;
                    case 'ArrowRight':
                        this.context.expandTreeNode(selected);
                        break;
                    case 'ArrowLeft':
                        this.context.collapseTreeNode(selected);
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        selected.click();
                        break;
                    case 'F2':
                        e.preventDefault();
                        const node = selected.closest('.tree-node');
                        const itemType = node.dataset.type;
                        const itemPath = node.dataset.path;
                        if (itemType === 'topic') {
                            this.context.renameTopic(itemPath);
                        }
                        break;
                }

                if (nextItem) {
                    e.preventDefault();
                    nextItem.click();
                    nextItem.scrollIntoView({ block: 'nearest' });
                }
            });
        }

        /**
         * 獲取樹數據（公開方法）
         */
        getTreeData() {
            return this._treeData;
        }

        /**
         * 獲取主題查找表（公開方法）
         */
        getTopicLookup() {
            return this._topicLookup;
        }

        /**
         * 建立主題查找表（私有方法）
         */
        _buildTopicLookup(nodes, parentPath = null) {
            nodes.forEach(node => {
                if (node.type === 'topic') {
                    this._topicLookup.set(node.path, {
                        ...node.data,
                        parent: parentPath,
                        path: node.path
                    });
                    if (node.children) {
                        this._buildTopicLookup(node.children, node.path);
                    }
                }
            });
        }

        /**
         * 渲染空狀態（私有方法）
         */
        _renderEmptyState() {
            return `
                <div class="no-data">
                    <div class="no-data-icon">📁</div>
                    <div class="no-data-text">尚無主題或模板數據</div>
                    <div class="no-data-help">
                        開始創建您的第一個主題來組織代碼模板，或直接創建模板。
                    </div>
                    <div class="no-data-actions">
                        <button class="btn btn-primary btn-small" data-action="open-modal" data-modal-type="topic">
                            <span class="icon">🏷️</span> 新增主題
                        </button>
                        <button class="btn btn-secondary btn-small" data-action="open-modal" data-modal-type="template">
                            <span class="icon">📄</span> 新增模板
                        </button>
                    </div>
                    <div class="usage-tips">
                        <small>💡 提示：雙擊項目可編輯，右鍵點擊查看更多選項</small>
                    </div>
                </div>
            `;
        }

        /**
         * 渲染樹節點（私有方法）
         */
        _renderTreeNode(node, depth) {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = node.expanded === true || (node.expanded !== false && depth === 0);
            let icon;

            switch (node.type) {
                case 'topic':
                    icon = node.data?.display?.icon || this.context.getTopicIcon(node.name);
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

            const toggleClass = hasChildren ?
                (isExpanded ? 'expanded' : 'collapsed') : 'leaf';

            const utils = this.context.getUtils();

            return `
                <div class="tree-node" data-path="${node.path}" data-type="${node.type}" data-expanded="${isExpanded}">
                    <div class="tree-item ${node.type}" style="padding-left: ${depth * 16}px">
                        <span class="tree-toggle ${toggleClass}"></span>
                        <span class="tree-icon">${icon}</span>
                        <span class="tree-label">${utils.escapeHtml(node.title || node.name)}</span>
                        ${hasChildren && node.type === 'topic' ?
                            `<span class="tree-count">${node.children.length}</span>` : ''}
                    </div>
                    ${hasChildren ? `
                        <div class="tree-children ${isExpanded ? '' : 'collapsed'}" style="display: ${isExpanded ? 'block' : 'none'}">
                            ${node.children.map(child => this._renderTreeNode(child, depth + 1)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * 檢查是否有匹配的子模板（私有方法）
         */
        _hasMatchingChildTemplates(topicNode, languageFilter, searchFilter) {
            const children = topicNode.querySelectorAll('.tree-node[data-type="template"]');
            const currentData = this.context.getCurrentData();

            for (const child of children) {
                const templatePath = child.dataset.path;
                const template = currentData.templates?.find(t => this.context.buildTemplatePath(t) === templatePath);

                if (template) {
                    let matches = true;

                    if (languageFilter && template.language !== languageFilter) {
                        matches = false;
                    }

                    if (searchFilter) {
                        const searchText = (template.title + ' ' + (template.description || '')).toLowerCase();
                        if (!searchText.includes(searchFilter)) {
                            matches = false;
                        }
                    }

                    if (matches) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * 選擇樹項目並顯示詳細資訊
         */
        selectTreeItem(item) {
            // Remove previous selection
            document.querySelectorAll('.tree-item.selected').forEach(el => {
                el.classList.remove('selected');
            });

            // Add selection to clicked item
            item.classList.add('selected');

            // Get item data
            const node = item.closest('.tree-node');
            const itemPath = node.dataset.path;
            const itemType = node.dataset.type;

            // 顯示詳細資訊（包括連結）
            this.showContentDetails(itemPath, itemType);
        }

        /**
         * 跟隨連結跳轉到目標位置（私有方法）
         */
        _followLink(linkPath) {
            const dataHelpers = this.context.getDataHelpers();

            // 從完整路徑中提取連結名稱
            const linkName = linkPath.split('/links/').pop();
            const link = dataHelpers.findLinkByName(linkName);

            if (!link || !link.target) {
                console.warn('Link or target not found:', linkName);
                return;
            }

            // 檢查目標類型
            const targetPath = link.target;
            let targetType = 'topic';

            // 如果目標包含 /templates/，則為模板
            if (targetPath.includes('/templates/')) {
                targetType = 'template';
            }

            // 在樹中查找目標節點
            const targetNode = document.querySelector(`.tree-node[data-path="${targetPath}"]`);

            if (targetNode) {
                // 展開所有父節點
                let parent = targetNode.parentElement?.closest('.tree-node');
                while (parent) {
                    const toggle = parent.querySelector(':scope > .tree-item > .tree-toggle');
                    const children = parent.querySelector(':scope > .tree-children');

                    if (toggle && children) {
                        toggle.classList.remove('collapsed');
                        toggle.classList.add('expanded');
                        children.style.display = 'block';
                    }

                    parent = parent.parentElement?.closest('.tree-node');
                }

                // 選擇目標項目
                const targetItem = targetNode.querySelector(':scope > .tree-item');
                if (targetItem) {
                    // 移除之前的選擇
                    document.querySelectorAll('.tree-item.selected').forEach(el => {
                        el.classList.remove('selected');
                    });

                    // 選擇目標
                    targetItem.classList.add('selected');

                    // 滾動到可見
                    targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // 顯示目標詳細資訊
                    this.showContentDetails(targetPath, targetType);
                }
            } else {
                console.warn('Target node not found in tree:', targetPath);
            }
        }

        /**
         * 顯示模板詳細資訊（公共方法）
         */
        showTemplateDetails(templatePath) {
            this.showContentDetails(templatePath, 'template');
        }

        /**
         * 顯示內容詳細資訊
         */
        showContentDetails(itemPath, itemType) {
            const container = document.getElementById('content-details');
            if (!container) return;

            if (itemType === 'topic') {
                this._showTopicDetails(itemPath, container);
            } else if (itemType === 'template') {
                this._showTemplateDetails(itemPath, container);
            } else if (itemType === 'link') {
                this._showLinkDetails(itemPath, container);
            }
        }

        /**
         * 顯示主題詳細資訊（私有方法）
         */
        _showTopicDetails(topicPath, container) {
            const topic = this._topicLookup?.get(topicPath);
            if (!topic) return;

            const utils = this.context.getUtils();
            const pathHelpers = this.context.getPathHelpers();

            const html = `
                <div class="content-details-header">
                    <div class="details-title">
                        <span class="details-icon">${topic.display?.icon || '🏷️'}</span>
                        <h3>${utils.escapeHtml(topic.title || topic.name)}</h3>
                    </div>
                    <div class="details-actions">
                        <button class="btn btn-secondary btn-small" data-action="edit-topic" data-topic-path="${topicPath}">
                            <span class="icon">✏️</span> 編輯
                        </button>
                        <button class="btn btn-success btn-small" data-action="create-template-in-topic" data-topic-path="${topicPath}">
                            <span class="icon">＋</span> 新增模板
                        </button>
                        ${topic.documentation ? `
                            <button class="btn btn-info btn-small" data-action="view-topic-documentation" data-topic-path="${topicPath}">
                                <span class="icon">📖</span> 說明文件
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="content-details-body">
                    <div class="details-section">
                        <h4>完整路徑</h4>
                        <p>${utils.escapeHtml(pathHelpers.getDisplayPath(topicPath))}</p>
                    </div>

                    <div class="details-section">
                        <h4>描述</h4>
                        <p>${utils.escapeHtml(topic.description || '無描述')}</p>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        /**
         * 顯示模板詳細資訊（私有方法）
         */
        _showTemplateDetails(templatePath, container) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t => this.context.buildTemplatePath(t) === templatePath);
            if (!template) {
                console.warn('Template not found for path:', templatePath);
                return;
            }

            const utils = this.context.getUtils();
            const pathHelpers = this.context.getPathHelpers();
            const stateManager = this.context.getStateManager();

            // Get language display name
            const language = stateManager.getCurrentData().languages?.find(l => l.name === template.language);
            const languageDisplay = language ? (language.title || language.displayName || language.name) : template.language;

            const html = `
                <div class="content-details-header">
                    <div class="details-title">
                        <span class="details-icon">📄</span>
                        <h3>${utils.escapeHtml(template.title)}</h3>
                    </div>
                    <div class="details-actions">
                        <button class="btn btn-secondary btn-small" data-action="edit-template" data-template-path="${templatePath}">
                            <span class="icon">✏️</span> 編輯
                        </button>
                        ${template.documentation ? `
                            <button class="btn btn-info btn-small" data-action="view-documentation" data-template-path="${templatePath}">
                                <span class="icon">📖</span> 說明文件
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="content-details-body">
                    <div class="details-section">
                        <h4>描述</h4>
                        <p>${utils.escapeHtml(template.description)}</p>
                    </div>

                    <div class="details-section">
                        <h4>資訊</h4>
                        <div class="template-meta-grid">
                            <div class="meta-item">
                                <span class="meta-label">語言:</span>
                                <span class="meta-value">${utils.escapeHtml(languageDisplay)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">主題:</span>
                                <span class="meta-value">${utils.escapeHtml(pathHelpers.getDisplayPath(template.topicPath) || template.topicPath || template.topic)}</span>
                            </div>
                            ${template.metadata?.lastUsedAt ? `
                                <div class="meta-item">
                                    <span class="meta-label">最後使用:</span>
                                    <span class="meta-value">${new Date(template.metadata.lastUsedAt).toLocaleDateString()}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>程式碼</h4>
                        <div class="code-preview">
                            <pre><code>${utils.escapeHtml(template.code)}</code></pre>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        /**
         * 顯示連結詳細資訊（私有方法）
         */
        _showLinkDetails(linkPath, container) {
            const dataHelpers = this.context.getDataHelpers();

            // 從完整路徑中提取連結名稱
            // 路徑格式：topicPath/links/linkName
            const linkName = linkPath.split('/links/').pop();
            const link = dataHelpers.findLinkByName(linkName);

            if (!link) {
                console.warn('Link not found for name:', linkName, 'from path:', linkPath);
                container.innerHTML = '<p>連結資料未找到</p>';
                return;
            }

            const utils = this.context.getUtils();
            const pathHelpers = this.context.getPathHelpers();

            // 處理連結目標路徑顯示
            let targetDisplayPath = link.target;
            if (link.target) {
                const pathParts = link.target.split('/');
                const templatesIndex = pathParts.indexOf('templates');

                if (templatesIndex !== -1) {
                    // 目標是模板
                    const topicPath = pathParts.slice(0, templatesIndex).join('/');
                    const topicDisplayPath = topicPath ? pathHelpers.getDisplayPath(topicPath) : '';

                    // 嘗試從實際模板獲取 title
                    const currentData = this.context.getCurrentData();
                    const allTemplates = currentData.templates || [];
                    const actualTemplate = allTemplates.find(t =>
                        pathHelpers.buildTemplatePath(t) === link.target
                    );
                    const templateName = actualTemplate?.title || pathParts[templatesIndex + 1] || '';

                    // 組合顯示路徑（不包含 templates）
                    if (topicDisplayPath) {
                        targetDisplayPath = `${topicDisplayPath}/${templateName}`;
                    } else {
                        targetDisplayPath = templateName;
                    }
                } else {
                    // 目標是主題
                    targetDisplayPath = pathHelpers.getDisplayPath(link.target);
                }
            }

            const html = `
                <div class="content-details-header">
                    <div class="details-title">
                        <span class="details-icon">🔗</span>
                        <h3>${utils.escapeHtml(link.title)}</h3>
                    </div>
                    <div class="details-actions">
                        <button class="btn btn-primary btn-small" data-action="follow-link" data-link-path="${linkPath}">
                            <span class="icon">➡️</span> 前往目標
                        </button>
                        <button class="btn btn-secondary btn-small" data-action="edit-link" data-link-name="${linkPath}">
                            <span class="icon">✏️</span> 編輯
                        </button>
                        <button class="btn btn-danger btn-small" data-action="delete-link" data-link-name="${linkPath}">
                            <span class="icon">🗑️</span> 刪除
                        </button>
                    </div>
                </div>

                <div class="content-details-body">
                    <div class="details-section">
                        <h4>描述</h4>
                        <p>${utils.escapeHtml(link.description || '無描述')}</p>
                    </div>

                    <div class="details-section">
                        <h4>連結資訊</h4>
                        <div class="template-meta-grid">
                            <div class="meta-item">
                                <span class="meta-label">目標路徑:</span>
                                <span class="meta-value">${utils.escapeHtml(targetDisplayPath)}</span>
                            </div>
                            ${link.topic ? `
                                <div class="meta-item">
                                    <span class="meta-label">所屬主題:</span>
                                    <span class="meta-value">${utils.escapeHtml(pathHelpers.getDisplayPath(link.topic) || link.topic)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ContentRenderer;
    } else {
        window.ContentRenderer = ContentRenderer;
    }
})();
