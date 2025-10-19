// Message Handler - 消息處理器
// 負責處理來自 VSCode extension 的消息

(function() {
    'use strict';

    /**
     * Message Handler 類
     * 處理所有來自 VSCode 的消息
     */
    class MessageHandler {
        constructor(context) {
            this.context = context;
        }

        /**
         * 初始化消息監聽
         */
        initialize() {
            console.log('[MessageHandler] Initializing message listener');
            window.addEventListener('message', (event) => this.handleMessage(event));
        }

        /**
         * 處理消息
         */
        handleMessage(event) {
            const message = event.data;
            console.log('[MessageHandler] Received message:', message.type);

            switch (message.type) {
                case 'dataLoaded':
                    this._handleDataLoaded(message);
                    break;

                // 資料位置管理訊息
                case 'dataLocationInfo':
                    this._handleDataLocationInfo(message);
                    break;

                case 'availableLocations':
                    this._handleAvailableLocations(message);
                    break;

                case 'pathValidationResult':
                    this._handlePathValidationResult(message);
                    break;

                case 'dataLocationChanged':
                    this._handleDataLocationChanged(message);
                    break;

                case 'dataLocationReset':
                    this._handleDataLocationReset(message);
                    break;

                // 清空詳情面板
                case 'clearDetailsPanel':
                    this._handleClearDetailsPanel(message);
                    break;

                // 文檔渲染
                case 'documentationRendered':
                    this._handleDocumentationRendered(message);
                    break;

                // 錯誤處理
                case 'error':
                    this._handleError(message);
                    break;

                default:
                    // Unknown message type
                    console.log('Unknown message type:', message.type);
                    break;
            }
        }

        /**
         * 處理數據加載消息（私有方法）
         */
        _handleDataLoaded(message) {
            console.log('[MessageHandler] Handling dataLoaded message');
            const stateManager = this.context.getStateManager();

            // 更新數據
            console.log('[MessageHandler] Updating data...');
            stateManager.updateData(message.data);

            // 調試：檢查更新後的數據
            const currentData = stateManager.getCurrentData();
            console.log('[MessageHandler] Updated data - templates count:', currentData.templates?.length);
            console.log('[MessageHandler] Updated data - topics hierarchy:', currentData.topics?.hierarchy);

            // 隱藏加載狀態
            console.log('[MessageHandler] Hiding loading indicator...');
            stateManager.showLoading(false);

            // 更新 UI
            console.log('[MessageHandler] Updating UI...');
            this.context.updateScopeSelector();
            this.context.updateFilters();
            this.context.renderCurrentTab();

            console.log('[MessageHandler] Data loaded successfully');

            // 如果模板模態框已打開，刷新主題列表
            this._refreshModalTopicList();
        }

        /**
         * 處理資料位置資訊消息（私有方法）
         */
        _handleDataLocationInfo(message) {
            const settingsRenderer = this.context.getSettingsRenderer();
            if (settingsRenderer) {
                settingsRenderer.updateCurrentLocationInfo(message.data);
            }
        }

        /**
         * 處理可用位置列表消息（私有方法）
         */
        _handleAvailableLocations(message) {
            const settingsRenderer = this.context.getSettingsRenderer();
            if (settingsRenderer) {
                settingsRenderer.updateAvailableLocations(message.data);
            }
        }

        /**
         * 處理路徑驗證結果消息（私有方法）
         */
        _handlePathValidationResult(message) {
            const settingsRenderer = this.context.getSettingsRenderer();
            if (settingsRenderer) {
                settingsRenderer._showValidationResult(message.data);
            }
        }

        /**
         * 處理資料位置變更消息（私有方法）
         */
        _handleDataLocationChanged(message) {
            const settingsRenderer = this.context.getSettingsRenderer();
            if (settingsRenderer) {
                settingsRenderer.refreshDataLocationInfo();
            }

            const stateManager = this.context.getStateManager();
            stateManager.showMessage('資料位置已成功變更');
        }

        /**
         * 處理資料位置重置消息（私有方法）
         */
        _handleDataLocationReset(message) {
            const settingsRenderer = this.context.getSettingsRenderer();
            if (settingsRenderer) {
                settingsRenderer.refreshDataLocationInfo();
            }

            const stateManager = this.context.getStateManager();
            stateManager.showMessage('已重設為系統預設位置');
        }

        /**
         * 處理清空詳情面板消息（私有方法）
         */
        _handleClearDetailsPanel(message) {
            console.log('[MessageHandler] Clearing details panel');
            const contentRenderer = this.context.getContentRenderer();
            if (contentRenderer) {
                contentRenderer.clearContentDetails();
            }
        }

        /**
         * 處理文檔渲染完成消息（私有方法）
         */
        _handleDocumentationRendered(message) {
            // 此消息由 ModalManager 中的特定監聽器處理
            // 這裡不需要做任何事情，因為 showDocumentationModal 已經設置了臨時監聽器
        }

        /**
         * 處理錯誤消息（私有方法）
         */
        _handleError(message) {
            console.error('Backend error:', message.message);

            const stateManager = this.context.getStateManager();
            stateManager.showLoading(false);
            stateManager.showError(message.message || '載入數據時發生未知錯誤');
        }

        /**
         * 刷新模態框中的主題列表（私有方法）
         */
        _refreshModalTopicList() {
            const modal = document.getElementById('modal');
            if (!modal || !modal.classList.contains('active')) return;
            if (modal.dataset.type !== 'template') return;

            const topicSelect = document.getElementById('template-topic');
            if (!topicSelect) return;

            const currentValue = topicSelect.value;
            const utils = this.context.getUtils();
            const existingTopics = this.context.getExistingTopics();

            // 重新生成主題選項
            const options = existingTopics.map(topicName => {
                const displayName = this.context.getTopicDisplayName(topicName);
                return `<option value="${utils.escapeHtml(topicName)}" ${currentValue === topicName ? 'selected' : ''}>${utils.escapeHtml(displayName)}</option>`;
            }).join('');

            topicSelect.innerHTML = `<option value="">選擇現有主題...</option>${options}`;

            if (currentValue) {
                topicSelect.value = currentValue;
            }
        }

        /**
         * 發送消息到 VSCode
         */
        sendMessage(type, data = {}) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: type,
                ...data
            });
        }

        /**
         * 請求加載數據
         */
        requestDataLoad() {
            console.log('[MessageHandler] Requesting data load');
            this.sendMessage('loadData');
        }

        /**
         * 請求重新加載
         */
        requestReload() {
            const stateManager = this.context.getStateManager();
            stateManager.showLoading(true);
            this.requestDataLoad();
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MessageHandler;
    } else {
        window.MessageHandler = MessageHandler;
    }
})();
