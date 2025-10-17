// Event Coordinator - 事件協調器
// 負責協調和設置所有事件監聽器

(function() {
    'use strict';

    /**
     * Event Coordinator 類
     * 統一管理所有事件監聽器的設置
     */
    class EventCoordinator {
        constructor(context) {
            this.context = context;
        }

        /**
         * 設置所有事件監聽器
         */
        setupAllListeners() {
            this._setupTabNavigation();
            this._setupButtonListeners();
            this._setupChangeListeners();
            this._setupModalListeners();
            this._setupFilterListeners();
            this._setupSettingsListeners();
            this._setupDynamicListeners();
        }

        /**
         * 設置標籤導航監聽器（私有方法）
         */
        _setupTabNavigation() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const tabName = e.currentTarget.dataset.tab;
                    if (!tabName) return;

                    const stateManager = this.context.getStateManager();
                    stateManager.switchTab(tabName);
                    this.context.renderCurrentTab();
                });
            });
        }

        /**
         * 設置按鈕監聽器（私有方法）
         */
        _setupButtonListeners() {
            const modalManager = this.context.getModalManager();
            const messageHandler = this.context.getMessageHandler();

            const buttonHandlers = {
                'refresh-btn': () => messageHandler.requestDataLoad(),
                'import-btn': () => this._importTemplates(),
                'export-btn': () => this._exportTemplates(),
                'create-template-btn': () => modalManager.openModal('template'),
                'create-topic-btn': () => modalManager.openModal('topic'),
                'create-link-btn': () => modalManager.openModal('link'),
                'create-language-btn': () => modalManager.openModal('language'),
                'create-scope-btn': () => modalManager.openModal('scope'),
                'export-scope-btn': () => this._exportScope(),
                'import-scope-btn': () => this._importScope(),
                'clear-stats-btn': () => this._clearUsageStats(),
                'json-import-btn': () => this._openJsonModal()
            };

            // 批量綁定點擊事件
            Object.entries(buttonHandlers).forEach(([id, handler]) => {
                const btn = document.getElementById(id);
                if (btn) btn.addEventListener('click', handler);
            });
        }

        /**
         * 設置變更監聽器（私有方法）
         */
        _setupChangeListeners() {
            // Scope selector
            const scopeSelector = document.getElementById('scope-selector');
            if (scopeSelector) {
                scopeSelector.addEventListener('change', (e) => {
                    const newScopeId = e.target.value;
                    const stateManager = this.context.getStateManager();
                    const currentData = stateManager.getCurrentData();
                    const newScope = currentData.scope?.available?.find(s => s.id === newScopeId);

                    if (newScope) {
                        stateManager.setCurrentScope(newScope);
                        const vscode = this.context.getVSCode();
                        vscode.postMessage({
                            type: 'switchScope',
                            scopeId: newScopeId
                        });
                    }
                });
            }
        }

        /**
         * 設置模態框監聽器（私有方法）
         */
        _setupModalListeners() {
            const modalManager = this.context.getModalManager();

            // Close/Cancel buttons
            ['modal-close', 'modal-cancel'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', () => modalManager.closeModal());
            });

            // Save button
            document.getElementById('modal-save')?.addEventListener('click', () => {
                this._saveItem();
            });

            // Click outside modal to close
            document.getElementById('modal')?.addEventListener('click', (e) => {
                if (e.target.id === 'modal') modalManager.closeModal();
            });
        }

        /**
         * 設置過濾器監聽器（私有方法）
         */
        _setupFilterListeners() {
            const contentRenderer = this.context.getContentRenderer();
            const favoritesRenderer = this.context.getFavoritesRenderer();
            const stateManager = this.context.getStateManager();

            // Content management filters
            ['content-filter-language', 'content-filter-topic'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', () => contentRenderer.render());
            });

            const contentSearch = document.getElementById('search-content');
            if (contentSearch) {
                contentSearch.addEventListener('input', () => contentRenderer.render());
            }

            // Favorites filters
            const updateFavIfActive = () => {
                if (stateManager.getCurrentTab() === 'favorites') {
                    favoritesRenderer.render();
                }
            };

            ['favorites-filter-language', 'favorites-filter-topic'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', updateFavIfActive);
            });

            const favSearch = document.getElementById('search-favorites');
            if (favSearch) favSearch.addEventListener('input', updateFavIfActive);
        }

        /**
         * 設置設定頁面監聽器（私有方法）
         */
        _setupSettingsListeners() {
            const settingsRenderer = this.context.getSettingsRenderer();

            const locationHandlers = {
                'refresh-location-info-btn': () => settingsRenderer.refreshDataLocationInfo(),
                'open-location-btn': () => settingsRenderer.openDataLocation(),
                'validate-custom-path-btn': () => settingsRenderer.validateCustomPath(),
                'apply-custom-location-btn': () => settingsRenderer.applyCustomLocation(),
                'reset-to-system-default-btn': () => settingsRenderer.resetToSystemDefault()
            };

            Object.entries(locationHandlers).forEach(([id, handler]) => {
                document.getElementById(id)?.addEventListener('click', handler);
            });

            // Available locations list change
            document.getElementById('available-locations')?.addEventListener('change', (e) => {
                settingsRenderer.handleLocationSelection(e);
            });
        }

        /**
         * 設置動態監聽器（私有方法）
         */
        _setupDynamicListeners() {
            const buttonHandler = this.context.getButtonHandler();
            const documentationHandler = this.context.getDocumentationHandler();

            // 動態按鈕事件委託
            document.body.addEventListener('click', (e) => buttonHandler.handleClick(e));

            // 動態元素 change 事件委託
            document.addEventListener('change', (e) => {
                const changeHandlers = {
                    'template-documentation-type': () => documentationHandler.handleTemplateDocumentationTypeChange(e.target.value),
                    'topic-documentation-type': () => documentationHandler.handleTopicDocumentationTypeChange(e.target.value)
                };

                if (changeHandlers[e.target.id]) {
                    changeHandlers[e.target.id]();
                }
            });

            // Modal 內動態按鈕事件委託
            document.addEventListener('click', (e) => {
                const modalButtonHandlers = {
                    'preview-documentation': () => documentationHandler.previewTemplateDocumentation(),
                    'preview-topic-documentation': () => documentationHandler.previewTopicDocumentation(),
                    'generate-doc-template': () => documentationHandler.generateTemplateDocumentationTemplate(),
                    'generate-topic-doc-template': () => documentationHandler.generateTopicDocumentationTemplate()
                };

                if (e.target.id && modalButtonHandlers[e.target.id]) {
                    modalButtonHandlers[e.target.id]();
                }
            });
        }

        /**
         * 導入模板（私有方法）
         */
        _importTemplates() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'importTemplates' });
        }

        /**
         * 導出模板（私有方法）
         */
        _exportTemplates() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'exportTemplates' });
        }

        /**
         * 導出範圍（私有方法）
         */
        _exportScope() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'exportScope' });
        }

        /**
         * 導入範圍（私有方法）
         */
        _importScope() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'importScope' });
        }

        /**
         * 清除使用統計（私有方法）
         */
        _clearUsageStats() {
            if (confirm('確定要清除所有使用統計嗎？此操作無法恢復。')) {
                const vscode = this.context.getVSCode();
                vscode.postMessage({ type: 'clearUsageStats' });
            }
        }

        /**
         * 打開 JSON 導入模態框（私有方法）
         */
        _openJsonModal() {
            // TODO: Implement JSON import modal
            console.log('JSON import modal not yet implemented');
        }

        /**
         * 保存項目（私有方法）
         */
        _saveItem() {
            const modal = document.getElementById('modal');
            const type = modal?.dataset.type;
            const modalManager = this.context.getModalManager();
            const formGenerator = this.context.getFormGenerator();
            const pathHelpers = this.context.getPathHelpers();
            const vscode = this.context.getVSCode();
            const editingItem = modalManager.getEditingItem();

            if (!type) return;

            try {
                let data, messageType, identifier;

                switch (type) {
                    case 'template':
                        data = formGenerator.getTemplateData();
                        if (editingItem) {
                            messageType = 'updateTemplate';
                            identifier = pathHelpers.buildTemplatePath(editingItem);
                        } else {
                            messageType = 'createTemplate';
                        }
                        break;

                    case 'topic':
                        data = formGenerator.getTopicData();
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
                        data = formGenerator.getLinkData();
                        if (editingItem) {
                            messageType = 'updateLink';
                            identifier = editingItem.name;
                        } else {
                            messageType = 'createLink';
                        }
                        break;

                    case 'language':
                        data = formGenerator.getLanguageData();
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
                vscode.postMessage(message);
                modalManager.closeModal();

            } catch (error) {
                vscode.postMessage({
                    type: 'showError',
                    message: error.message
                });
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EventCoordinator;
    } else {
        window.EventCoordinator = EventCoordinator;
    }
})();
