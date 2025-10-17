// State Manager - 狀態管理器
// 負責管理應用的全局狀態

(function() {
    'use strict';

    /**
     * State Manager 類
     * 管理 currentData, currentTab, currentScope 等全局狀態
     */
    class StateManager {
        constructor(context) {
            this.context = context;
            this.currentData = this._getInitialData();
            this.currentTab = 'overview';
            this.currentScope = null;
            this.selectedTreeItem = null;
        }

        /**
         * 獲取當前數據
         */
        getCurrentData() {
            return this.currentData;
        }

        /**
         * 更新當前數據
         */
        updateData(data) {
            this.currentData = data || this._getInitialData();

            // 確保數據結構完整性
            this.currentData.templates = this.currentData.templates || [];
            this.currentData.languages = this.currentData.languages || [];

            if (!this.currentData.scope) {
                this.currentData.scope = {
                    current: { id: 'local', name: '本機範圍', type: 'local' },
                    available: [{ id: 'local', name: '本機範圍', type: 'local' }],
                    usageStats: null,
                    favorites: []
                };
            }

            if (!this.currentData.topics) {
                this.currentData.topics = {
                    hierarchy: null,
                    statistics: { totalTopics: 0, activeTopics: 0 }
                };
            }

            // 更新當前 scope 引用
            this.currentScope = this.currentData.scope.current;

            // 通知 UIStateService 更新
            const uiStateService = this.context.getUIStateService();
            const topics = this.currentData.topics?.hierarchy?.roots?.map(r => r.topic) || [];
            uiStateService.updateData(
                this.currentData.templates,
                topics,
                this.currentData.languages
            );

            return this.currentData;
        }

        /**
         * 獲取當前標籤頁
         */
        getCurrentTab() {
            return this.currentTab;
        }

        /**
         * 設置當前標籤頁
         */
        setCurrentTab(tab) {
            this.currentTab = tab;
        }

        /**
         * 獲取當前 Scope
         */
        getCurrentScope() {
            return this.currentScope;
        }

        /**
         * 設置當前 Scope
         */
        setCurrentScope(scope) {
            this.currentScope = scope;
        }

        /**
         * 獲取選中的樹項目
         */
        getSelectedTreeItem() {
            return this.selectedTreeItem;
        }

        /**
         * 設置選中的樹項目
         */
        setSelectedTreeItem(item) {
            this.selectedTreeItem = item;
        }

        /**
         * 獲取模板列表
         */
        getTemplates() {
            return this.currentData.templates || [];
        }

        /**
         * 獲取語言列表
         */
        getLanguages() {
            return this.currentData.languages || [];
        }

        /**
         * 獲取主題層級
         */
        getTopicHierarchy() {
            return this.currentData.topics?.hierarchy || null;
        }

        /**
         * 獲取主題統計
         */
        getTopicStatistics() {
            return this.currentData.topics?.statistics || { totalTopics: 0, activeTopics: 0 };
        }

        /**
         * 獲取收藏列表
         */
        getFavorites() {
            return this.currentData.scope?.favorites || [];
        }

        /**
         * 獲取使用統計
         */
        getUsageStats() {
            return this.currentData.scope?.usageStats || null;
        }

        /**
         * 獲取可用 Scopes
         */
        getAvailableScopes() {
            return this.currentData.scope?.available || [];
        }

        /**
         * 根據路徑查找模板
         */
        findTemplateByPath(templatePath) {
            return this.currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );
        }

        /**
         * 根據路徑查找主題
         */
        findTopicByPath(topicPath) {
            return this.context.findTopicByPath(topicPath);
        }

        /**
         * 根據名稱查找連結
         */
        findLinkByName(linkName) {
            return this.context.findLinkByName(linkName);
        }

        /**
         * 根據名稱查找語言
         */
        findLanguageByName(languageName) {
            return this.currentData.languages?.find(l => l.name === languageName);
        }

        /**
         * 檢查是否已收藏
         */
        isFavorite(itemPath) {
            return this.currentData.scope?.favorites?.includes(itemPath) || false;
        }

        /**
         * 切換標籤頁
         */
        switchTab(tabName) {
            // 更新導航狀態
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }

            // 顯示對應標籤頁內容
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            const tabContent = document.getElementById(`${tabName}-tab`);
            if (tabContent) {
                tabContent.classList.add('active');
                this.currentTab = tabName;
            }
        }

        /**
         * 顯示/隱藏加載狀態
         */
        showLoading(show) {
            const loader = document.getElementById('loading');
            if (loader) {
                loader.style.display = show ? 'flex' : 'none';
            }
        }

        /**
         * 顯示錯誤訊息
         */
        showError(message) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'showError',
                message: message
            });
        }

        /**
         * 顯示資訊訊息
         */
        showMessage(message) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'showInfo',
                message: message
            });
        }

        /**
         * 重置狀態
         */
        reset() {
            this.currentData = this._getInitialData();
            this.currentTab = 'overview';
            this.currentScope = null;
            this.selectedTreeItem = null;
        }

        /**
         * 導出狀態（用於調試）
         */
        exportState() {
            return {
                currentTab: this.currentTab,
                currentScope: this.currentScope,
                selectedTreeItem: this.selectedTreeItem,
                dataStats: {
                    templatesCount: this.currentData.templates?.length || 0,
                    languagesCount: this.currentData.languages?.length || 0,
                    favoritesCount: this.currentData.scope?.favorites?.length || 0
                }
            };
        }

        /**
         * 獲取初始數據結構（私有方法）
         */
        _getInitialData() {
            return {
                templates: [],
                languages: [],
                scope: {
                    current: null,
                    available: [],
                    usageStats: null,
                    favorites: []
                },
                topics: {
                    hierarchy: null,
                    statistics: null
                }
            };
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StateManager;
    } else {
        window.StateManager = StateManager;
    }
})();
