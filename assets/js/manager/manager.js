// TextBricks Manager - 主協調器
// 負責初始化和協調所有模組

(function() {
    'use strict';

    /**
     * TextBricks Manager 類
     * 創建並協調所有模組，提供統一的 context 對象
     */
    class TextBricksManager {
        constructor() {
            // VSCode API
            this.vscode = acquireVsCodeApi();

            // 創建所有模組實例
            this._initializeModules();

            // 創建 context 對象
            this._createContext();

            // 將 context 注入到所有模組
            this._injectContext();
        }

        /**
         * 初始化所有模組
         */
        _initializeModules() {
            // Utils
            this.pathHelpers = new PathHelpers(null);
            this.dataHelpers = new DataHelpers(null);
            this.utils = TextBricksUtils;  // 使用全局的 TextBricksUtils 對象
            this.uiStateService = new UIStateService();
            this.treeBuilderService = new TreeBuilderService();

            // Core
            this.stateManager = new StateManager(null);
            this.messageHandler = new MessageHandler(null);

            // Handlers
            this.templateHandlers = new TemplateHandlers(null);
            this.topicHandlers = new TopicHandlers(null);
            this.favoritesHandlers = new FavoritesHandlers(null);
            this.linkHandlers = new LinkHandlers(null);
            this.contextMenuHandler = new ContextMenuHandler(null);
            this.treeNavigationHandler = new TreeNavigationHandler(null);
            this.documentationHandler = new DocumentationHandler(null);
            this.buttonHandler = new ButtonHandler(null);

            // Core - Event Coordinator (initialized after handlers)
            this.eventCoordinator = new EventCoordinator(null);

            // UI Managers
            this.modalManager = new ModalManager(null);
            this.formGenerator = new FormGenerator(null);

            // Renderers
            this.overviewRenderer = new OverviewRenderer(null);
            this.statsRenderer = new StatsRenderer(null);
            this.favoritesRenderer = new FavoritesRenderer(null);
            this.contentRenderer = new ContentRenderer(null);
            this.languagesRenderer = new LanguagesRenderer(null);
            this.settingsRenderer = new SettingsRenderer(null);
        }

        /**
         * 創建 context 對象
         */
        _createContext() {
            this.context = {
                // VSCode API
                getVSCode: () => this.vscode,

                // Core
                getStateManager: () => this.stateManager,
                getMessageHandler: () => this.messageHandler,

                // Utils
                getPathHelpers: () => this.pathHelpers,
                getDataHelpers: () => this.dataHelpers,
                getUtils: () => this.utils,
                getUIStateService: () => this.uiStateService,
                getTreeBuilderService: () => this.treeBuilderService,

                // Handlers
                getTemplateHandlers: () => this.templateHandlers,
                getTopicHandlers: () => this.topicHandlers,
                getFavoritesHandlers: () => this.favoritesHandlers,
                getLinkHandlers: () => this.linkHandlers,
                getContextMenuHandler: () => this.contextMenuHandler,
                getTreeNavigationHandler: () => this.treeNavigationHandler,
                getDocumentationHandler: () => this.documentationHandler,
                getButtonHandler: () => this.buttonHandler,
                getEventCoordinator: () => this.eventCoordinator,

                // UI Managers
                getModalManager: () => this.modalManager,
                getFormGenerator: () => this.formGenerator,

                // Renderers
                getOverviewRenderer: () => this.overviewRenderer,
                getStatsRenderer: () => this.statsRenderer,
                getFavoritesRenderer: () => this.favoritesRenderer,
                getContentRenderer: () => this.contentRenderer,
                getLanguagesRenderer: () => this.languagesRenderer,
                getSettingsRenderer: () => this.settingsRenderer,

                // Convenient shortcuts (delegated to appropriate modules)

                // State shortcuts
                getCurrentData: () => this.stateManager.getCurrentData(),
                getCurrentTab: () => this.stateManager.getCurrentTab(),
                getCurrentScope: () => this.stateManager.getCurrentScope(),

                // Data finding shortcuts
                findTopicByPath: (path) => this.dataHelpers.findTopicByPath(path),
                findLinkByName: (name) => this.dataHelpers.findLinkByName(name),
                getExistingTopics: () => this.dataHelpers.getExistingTopics(),
                getTemplatesForTopic: (topic) => this.dataHelpers.getTemplatesForTopic(topic),

                // Path shortcuts
                buildTemplatePath: (template) => this.pathHelpers.buildTemplatePath(template),
                getLanguageDisplayName: (languageName) => this.pathHelpers.getLanguageDisplayName(languageName),
                getTopicDisplayName: (topicPath) => this.pathHelpers.getTopicDisplayName(topicPath),
                getDisplayPath: (pathString) => this.pathHelpers.getDisplayPath(pathString),
                getTopicPath: (topic) => this.pathHelpers.getTopicPath(topic),

                // Modal shortcuts
                openModal: (type, item) => this.modalManager.openModal(type, item),
                closeModal: () => this.modalManager.closeModal(),
                showDocumentationModal: (item, itemType) => this.modalManager.showDocumentationModal(item, itemType),

                // Favorites shortcuts
                toggleFavorite: (itemPath) => this.favoritesHandlers.toggleFavorite(itemPath),
                isFavorite: (itemPath) => this.favoritesHandlers.isFavorite(itemPath),

                // Render shortcuts
                renderCurrentTab: () => this.renderCurrentTab(),
                updateScopeSelector: () => this.updateScopeSelector(),
                updateFilters: () => this.updateFilters(),

                // Message shortcuts
                showError: (message) => this.stateManager.showError(message),
                showMessage: (message) => this.stateManager.showMessage(message),
                showLoading: (show) => this.stateManager.showLoading(show),

                // Handler shortcuts
                editTopic: (topicPath) => this.topicHandlers.editTopic(topicPath),
                editTemplate: (templatePath) => this.templateHandlers.editTemplate(templatePath),
                renameTopic: (topicPath) => this.topicHandlers.renameTopic(topicPath),

                // Content renderer shortcuts
                showTemplateDetails: (templatePath) => this.contentRenderer.showTemplateDetails(templatePath),
                getTopicIcon: (topicName) => this.pathHelpers.getTopicIcon(topicName),

                // Documentation helpers (delegate to DocumentationHandler)
                getDocumentationType: (documentation) => this.documentationHandler.getDocumentationType(documentation),

                // UI Navigation - delegate to appropriate handlers
                renderTemplates: () => { console.warn('renderTemplates not fully implemented'); },
                renderTopicHierarchy: () => { console.warn('renderTopicHierarchy not fully implemented'); },
                restoreTreeSelection: (container) => { /* No-op for now */ },
                showContextMenu: (e, item) => this.contextMenuHandler.showContextMenu(e, item),
                closeContextMenu: () => this.contextMenuHandler.closeContextMenu(),
                getNextTreeItem: (selected) => this.treeNavigationHandler.getNextTreeItem(selected),
                getPreviousTreeItem: (selected) => this.treeNavigationHandler.getPreviousTreeItem(selected),
                expandTreeNode: (selected) => this.treeNavigationHandler.expandTreeNode(selected),
                collapseTreeNode: (selected) => this.treeNavigationHandler.collapseTreeNode(selected),
            };
        }

        /**
         * 將 context 注入到所有模組
         */
        _injectContext() {
            // Utils
            this.pathHelpers.context = this.context;
            this.dataHelpers.context = this.context;

            // Core
            this.stateManager.context = this.context;
            this.messageHandler.context = this.context;

            // Handlers
            this.templateHandlers.context = this.context;
            this.topicHandlers.context = this.context;
            this.favoritesHandlers.context = this.context;
            this.linkHandlers.context = this.context;
            this.contextMenuHandler.context = this.context;
            this.treeNavigationHandler.context = this.context;
            this.documentationHandler.context = this.context;
            this.buttonHandler.context = this.context;
            this.eventCoordinator.context = this.context;

            // UI Managers
            this.modalManager.context = this.context;
            this.formGenerator.context = this.context;

            // Renderers
            this.overviewRenderer.context = this.context;
            this.statsRenderer.context = this.context;
            this.favoritesRenderer.context = this.context;
            this.contentRenderer.context = this.context;
            this.languagesRenderer.context = this.context;
            this.settingsRenderer.context = this.context;
        }

        /**
         * 初始化管理器
         */
        initialize() {
            this.eventCoordinator.setupAllListeners();
            this.messageHandler.initialize();
            this.loadData();
        }

        /**
         * 載入數據
         */
        loadData() {
            this.stateManager.showLoading(true);
            this.messageHandler.requestDataLoad();
        }

        /**
         * 處理標籤切換
         */
        handleTabSwitch(event) {
            const tabName = event.currentTarget.dataset.tab;
            if (!tabName) return;

            this.stateManager.switchTab(tabName);
            this.renderCurrentTab();
        }

        /**
         * 渲染當前標籤頁
         */
        renderCurrentTab() {
            const currentTab = this.stateManager.getCurrentTab();

            switch (currentTab) {
                case 'overview':
                    this.overviewRenderer.render();
                    break;
                case 'content':
                    this.contentRenderer.render();
                    break;
                case 'favorites':
                    this.favoritesRenderer.render();
                    break;
                case 'stats':
                    this.statsRenderer.render();
                    break;
                case 'languages':
                    this.languagesRenderer.render();
                    break;
                case 'settings':
                    this.settingsRenderer.render();
                    break;
            }
        }

        /**
         * 更新範圍選擇器
         */
        updateScopeSelector() {
            const selector = document.getElementById('scope-selector');
            if (!selector) return;

            const currentData = this.stateManager.getCurrentData();
            const scopes = currentData.scope?.available || [];
            const current = currentData.scope?.current;

            selector.innerHTML = scopes.map(scope => {
                const selected = current && scope.id === current.id ? 'selected' : '';
                return `<option value="${this.utils.escapeHtml(scope.id)}" ${selected}>${this.utils.escapeHtml(scope.name)}</option>`;
            }).join('');
        }

        /**
         * 處理範圍切換
         */
        handleScopeSwitch(event) {
            const newScopeId = event.target.value;
            const currentData = this.stateManager.getCurrentData();
            const newScope = currentData.scope?.available?.find(s => s.id === newScopeId);

            if (newScope) {
                this.stateManager.setCurrentScope(newScope);
                this.vscode.postMessage({
                    type: 'switchScope',
                    scopeId: newScopeId
                });
            }
        }

        /**
         * 更新過濾器
         */
        updateFilters() {
            // Update language filter
            const languageFilter = document.getElementById('content-filter-language');
            if (languageFilter) {
                const languages = this.stateManager.getLanguages();
                const options = languages.map(lang =>
                    `<option value="${this.utils.escapeHtml(lang.name)}">${this.utils.escapeHtml(lang.displayName || lang.name)}</option>`
                ).join('');
                languageFilter.innerHTML = '<option value="">全部語言</option>' + options;
            }

            // Update topic filter
            const topicFilter = document.getElementById('content-filter-topic');
            if (topicFilter) {
                const topics = this.dataHelpers.getExistingTopics();
                const options = topics.map(topicName => {
                    const displayName = this.pathHelpers.getTopicDisplayName(topicName);
                    return `<option value="${this.utils.escapeHtml(topicName)}">${this.utils.escapeHtml(displayName)}</option>`;
                }).join('');
                topicFilter.innerHTML = '<option value="">全部主題</option>' + options;
            }

            // Update favorites filters
            const favLanguageFilter = document.getElementById('favorites-filter-language');
            if (favLanguageFilter) {
                const languages = this.stateManager.getLanguages();
                const options = languages.map(lang =>
                    `<option value="${this.utils.escapeHtml(lang.name)}">${this.utils.escapeHtml(lang.displayName || lang.name)}</option>`
                ).join('');
                favLanguageFilter.innerHTML = '<option value="">全部語言</option>' + options;
            }

            const favTopicFilter = document.getElementById('favorites-filter-topic');
            if (favTopicFilter) {
                const topics = this.dataHelpers.getExistingTopics();
                const options = topics.map(topicName => {
                    const displayName = this.pathHelpers.getTopicDisplayName(topicName);
                    return `<option value="${this.utils.escapeHtml(topicName)}">${this.utils.escapeHtml(displayName)}</option>`;
                }).join('');
                favTopicFilter.innerHTML = '<option value="">全部主題</option>' + options;
            }
        }

        /**
         * 更新內容過濾器
         */
        updateContentFilters() {
            this.contentRenderer.render();
        }

        /**
         * 保存項目
         */
        saveItem() {
            const modal = document.getElementById('modal');
            const type = modal?.dataset.type;
            const editingItem = this.modalManager.getEditingItem();

            if (!type) return;

            try {
                let data, messageType, identifier;

                switch (type) {
                    case 'template':
                        data = this.formGenerator.getTemplateData();
                        if (editingItem) {
                            messageType = 'updateTemplate';
                            identifier = this.pathHelpers.buildTemplatePath(editingItem);
                        } else {
                            messageType = 'createTemplate';
                        }
                        break;

                    case 'topic':
                        data = this.formGenerator.getTopicData();
                        if (editingItem) {
                            messageType = 'updateTopic';
                            identifier = Array.isArray(editingItem.path)
                                ? editingItem.path.join('/')
                                : (editingItem.path || editingItem.name);
                        } else {
                            messageType = 'createTopic';
                        }
                        break;

                    case 'link':
                        data = this.formGenerator.getLinkData();
                        if (editingItem) {
                            messageType = 'updateLink';
                            identifier = editingItem.name;
                        } else {
                            messageType = 'createLink';
                        }
                        break;

                    case 'language':
                        data = this.formGenerator.getLanguageData();
                        if (editingItem) {
                            messageType = 'updateLanguage';
                            identifier = editingItem.name;
                        } else {
                            messageType = 'createLanguage';
                        }
                        break;

                    default:
                        return;
                }

                if (!data) return;

                const message = { type: messageType, data };

                // 添加識別符
                if (identifier) {
                    if (type === 'template') {
                        message.templatePath = identifier;
                    } else if (type === 'topic') {
                        message.topicPath = identifier;
                    } else if (type === 'link') {
                        message.linkName = identifier;
                    } else if (type === 'language') {
                        message.languageName = identifier;
                    }
                }

                console.log('Sending message to VS Code:', message);
                this.vscode.postMessage(message);
                this.modalManager.closeModal();

            } catch (error) {
                this.vscode.postMessage({
                    type: 'showError',
                    message: error.message
                });
            }
        }

        /**
         * 導入模板
         */
        importTemplates() {
            this.vscode.postMessage({ type: 'importTemplates' });
        }

        /**
         * 導出模板
         */
        exportTemplates() {
            this.vscode.postMessage({ type: 'exportTemplates' });
        }

        /**
         * 導出範圍
         */
        exportScope() {
            this.vscode.postMessage({ type: 'exportScope' });
        }

        /**
         * 導入範圍
         */
        importScope() {
            this.vscode.postMessage({ type: 'importScope' });
        }

        /**
         * 清除使用統計
         */
        clearUsageStats() {
            if (confirm('確定要清除所有使用統計嗎？此操作無法恢復。')) {
                this.vscode.postMessage({ type: 'clearUsageStats' });
            }
        }

        /**
         * 打開 JSON 導入模態框
         */
        openJsonModal() {
            // TODO: Implement JSON import modal
            console.log('JSON import modal not yet implemented');
        }

        /**
         * 編輯語言
         */
        editLanguage(languageName) {
            const language = this.stateManager.getCurrentData().languages?.find(l => l.name === languageName);
            if (language) {
                this.modalManager.openModal('language', language);
            }
        }
    }

    // 初始化管理器
    let manager;

    function init() {
        console.log('[TextBricks Manager] Initializing...');
        try {
            manager = new TextBricksManager();
            console.log('[TextBricks Manager] Manager created');
            manager.initialize();
            console.log('[TextBricks Manager] Manager initialized');

            // 暴露到全局供調試使用
            window.textBricksManager = manager;
        } catch (error) {
            console.error('[TextBricks Manager] Initialization failed:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TextBricksManager;
    } else {
        window.TextBricksManager = TextBricksManager;
    }
})();
