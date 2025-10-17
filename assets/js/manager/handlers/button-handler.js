// Button Handler - 按鈕處理器
// 負責處理動態按鈕的點擊事件（使用事件委託）

(function() {
    'use strict';

    /**
     * Button Handler 類
     * 處理所有動態生成的按鈕點擊事件
     */
    class ButtonHandler {
        constructor(context) {
            this.context = context;
        }

        /**
         * 處理按鈕點擊事件
         */
        handleClick(event) {
            const button = event.target.closest('button[data-action], #create-first-template-btn, #create-first-topic-btn, #create-first-language-btn');
            if (!button) return;

            // Handle special "create first" buttons
            if (this._handleCreateFirstButtons(button)) return;

            // Handle data-action buttons
            const action = button.dataset.action;
            if (!action) return;

            this._handleAction(action, button);
        }

        /**
         * 處理 "create first" 按鈕（私有方法）
         */
        _handleCreateFirstButtons(button) {
            const modalManager = this.context.getModalManager();

            if (button.id === 'create-first-template-btn') {
                modalManager.openModal('template');
                return true;
            }
            if (button.id === 'create-first-topic-btn') {
                modalManager.openModal('topic');
                return true;
            }
            if (button.id === 'create-first-language-btn') {
                modalManager.openModal('language');
                return true;
            }

            return false;
        }

        /**
         * 處理動作（私有方法）
         */
        _handleAction(action, button) {
            const actionHandlers = {
                'edit-template': () => this._editTemplate(button),
                'delete-template': () => this._deleteTemplate(button),
                'edit-topic': () => this._editTopic(button),
                'delete-topic': () => this._deleteTopic(button),
                'view-topic-doc': () => this._viewTopicDoc(button),
                'edit-language': () => this._editLanguage(button),
                'create-template-in-topic': () => this._createTemplateInTopic(button),
                'use-template': () => this._useTemplate(button),
                'show-template-details': () => this._showTemplateDetails(button),
                'open-modal': () => this._openModal(button),
                'toggle-favorite': () => this._toggleFavorite(button),
                'view-template': () => this._viewTemplate(button),
                'view-topic': () => this._viewTopic(button),
                'remove-from-favorites': () => this._removeFromFavorites(button),
                'render-content-tree': () => this._renderContentTree(),
                'view-documentation': () => this._viewDocumentation(button),
                'view-topic-documentation': () => this._viewTopicDocumentation(button),
                'edit-link': () => this._editLink(button),
                'delete-link': () => this._deleteLink(button),
                'follow-link': () => this._followLink(button)
            };

            const handler = actionHandlers[action];
            if (handler) {
                handler();
            }
        }

        /**
         * 編輯模板
         */
        _editTemplate(button) {
            const templatePath = button.dataset.templatePath;
            this.context.getTemplateHandlers().editTemplate(templatePath);
        }

        /**
         * 刪除模板
         */
        _deleteTemplate(button) {
            const templatePath = button.dataset.templatePath;
            this.context.getTemplateHandlers().deleteTemplate(templatePath);
        }

        /**
         * 編輯主題
         */
        _editTopic(button) {
            const topicPath = button.dataset.topicPath;
            this.context.getTopicHandlers().editTopic(topicPath);
        }

        /**
         * 刪除主題
         */
        _deleteTopic(button) {
            const topicPath = button.dataset.topicPath;
            this.context.getTopicHandlers().deleteTopic(topicPath);
        }

        /**
         * 查看主題文檔
         */
        _viewTopicDoc(button) {
            const topicPath = button.dataset.topicPath;
            this.context.getTopicHandlers().viewTopicDocumentation(topicPath);
        }

        /**
         * 編輯語言
         */
        _editLanguage(button) {
            const languageName = button.dataset.languageName;
            const stateManager = this.context.getStateManager();
            const language = stateManager.getCurrentData().languages?.find(l => l.name === languageName);

            if (language) {
                this.context.openModal('language', language);
            }
        }

        /**
         * 在主題中創建模板
         */
        _createTemplateInTopic(button) {
            const topicPath = button.dataset.topicPath;
            this.context.getTemplateHandlers().createTemplateInTopic(topicPath);
        }

        /**
         * 使用模板
         */
        _useTemplate(button) {
            const templatePath = button.dataset.templatePath;
            this.context.getTemplateHandlers().useTemplate(templatePath);
        }

        /**
         * 顯示模板詳情
         */
        _showTemplateDetails(button) {
            const templatePath = button.dataset.templatePath;
            this.context.getContentRenderer().showTemplateDetails(templatePath);
        }

        /**
         * 打開模態框
         */
        _openModal(button) {
            const modalType = button.dataset.modalType;
            this.context.openModal(modalType);
        }

        /**
         * 切換收藏
         */
        _toggleFavorite(button) {
            const topicPath = button.dataset.topicPath;
            this.context.getFavoritesHandlers().toggleFavorite(topicPath);
        }

        /**
         * 查看模板
         */
        _viewTemplate(button) {
            const templatePath = button.dataset.templatePath;
            const stateManager = this.context.getStateManager();

            // 切換到內容管理頁面
            stateManager.switchTab('content');
            this.context.renderCurrentTab();

            // 顯示模板詳情
            setTimeout(() => {
                this.context.getContentRenderer().showTemplateDetails(templatePath);
            }, 100);
        }

        /**
         * 查看主題
         */
        _viewTopic(button) {
            const topicPath = button.dataset.topicPath;
            const stateManager = this.context.getStateManager();

            // 切換到內容管理頁面
            stateManager.switchTab('content');
            this.context.renderCurrentTab();

            // 顯示主題詳情
            setTimeout(() => {
                this.context.getContentRenderer().showContentDetails(topicPath, 'topic');
            }, 100);
        }

        /**
         * 從收藏中移除
         */
        _removeFromFavorites(button) {
            const itemPath = button.dataset.itemPath;
            this.context.getFavoritesHandlers().removeFromFavorites(itemPath);
        }

        /**
         * 渲染內容樹
         */
        _renderContentTree() {
            this.context.getContentRenderer().render();
        }

        /**
         * 查看模板文檔
         */
        _viewDocumentation(button) {
            const templatePath = button.dataset.templatePath;
            const stateManager = this.context.getStateManager();
            const pathHelpers = this.context.getPathHelpers();
            const modalManager = this.context.getModalManager();

            const currentData = stateManager.getCurrentData();
            const template = currentData.templates?.find(t =>
                pathHelpers.buildTemplatePath(t) === templatePath
            );

            if (template && template.documentation) {
                modalManager.showDocumentationModal(template, 'template');
            }
        }

        /**
         * 查看主題文檔
         */
        _viewTopicDocumentation(button) {
            const topicPath = button.dataset.topicPath;
            const dataHelpers = this.context.getDataHelpers();
            const modalManager = this.context.getModalManager();

            const topic = dataHelpers.findTopicByPath(topicPath);

            if (topic && topic.documentation) {
                modalManager.showDocumentationModal(topic, 'topic');
            }
        }

        /**
         * 編輯連結
         */
        _editLink(button) {
            const linkName = button.dataset.linkName;
            this.context.getLinkHandlers().editLink(linkName);
        }

        /**
         * 刪除連結
         */
        _deleteLink(button) {
            const linkName = button.dataset.linkName;
            this.context.getLinkHandlers().deleteLink(linkName);
        }

        /**
         * 前往連結目標
         */
        _followLink(button) {
            const linkPath = button.dataset.linkPath;
            const contentRenderer = this.context.getContentRenderer();

            // 調用 ContentRenderer 的 _followLink 方法
            // 由於 _followLink 是私有方法，我們需要通過公共介面訪問
            if (contentRenderer._followLink) {
                contentRenderer._followLink(linkPath);
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ButtonHandler;
    } else {
        window.ButtonHandler = ButtonHandler;
    }
})();
