/**
 * TextBricks Services Bridge
 *
 * 此檔案提供 JavaScript 到 TypeScript Services 的橋接層
 * 讓 WebView 中的 JavaScript 代碼能夠調用 Extension 中的 TypeScript Services
 */

const TextBricksServices = (() => {
    // Request ID 生成器
    let requestIdCounter = 0;
    const pendingRequests = new Map();

    /**
     * 生成唯一的請求 ID
     */
    function generateRequestId() {
        return `req_${Date.now()}_${++requestIdCounter}`;
    }

    /**
     * 發送服務請求並等待回應
     */
    function sendServiceRequest(method, params) {
        return new Promise((resolve, reject) => {
            const requestId = generateRequestId();

            // 儲存 Promise 的 resolve/reject
            pendingRequests.set(requestId, { resolve, reject });

            // 設置超時
            const timeout = setTimeout(() => {
                pendingRequests.delete(requestId);
                reject(new Error(`Service request timeout: ${method}`));
            }, 5000);

            // 清理函數
            const cleanup = () => {
                clearTimeout(timeout);
                pendingRequests.delete(requestId);
            };

            // 更新 resolve/reject 以包含清理邏輯
            pendingRequests.set(requestId, {
                resolve: (value) => {
                    cleanup();
                    resolve(value);
                },
                reject: (error) => {
                    cleanup();
                    reject(error);
                }
            });

            // 發送消息到 Extension
            vscode.postMessage({
                type: method,
                requestId,
                ...params
            });
        });
    }

    /**
     * 處理來自 Extension 的服務回應
     */
    function handleServiceResponse(message) {
        if (message.type === 'serviceResponse') {
            const pending = pendingRequests.get(message.requestId);
            if (pending) {
                pending.resolve(message.result);
            }
        } else if (message.type === 'serviceError') {
            const pending = pendingRequests.get(message.requestId);
            if (pending) {
                pending.reject(new Error(message.error));
            }
        }
    }

    // 監聽來自 Extension 的消息
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'serviceResponse' || message.type === 'serviceError') {
            handleServiceResponse(message);
        }
    });

    // 公開的 API
    return {
        /**
         * PathTransformService API
         */
        PathTransform: {
            /**
             * 將內部路徑轉換為顯示路徑
             * @param {string} path - 內部路徑，如 "c/basic"
             * @returns {Promise<string>} 顯示路徑，如 "C 語言/基礎語法"
             */
            async pathToDisplayPath(path) {
                return sendServiceRequest('pathToDisplayPath', { path });
            },

            /**
             * 將顯示路徑轉換為內部路徑
             * @param {string} displayPath - 顯示路徑，如 "C 語言/基礎語法"
             * @returns {Promise<string>} 內部路徑，如 "c/basic"
             */
            async displayPathToPath(displayPath) {
                return sendServiceRequest('displayPathToPath', { displayPath });
            },

            /**
             * 建構 template 的完整路徑
             * @param {object} template - 模板物件
             * @returns {Promise<string>} 路徑格式: {topicPath}/templates/{name}
             */
            async buildTemplatePath(template) {
                return sendServiceRequest('buildTemplatePath', { template });
            },

            /**
             * 獲取項目的唯一識別路徑
             * @param {object} item - 項目物件
             * @param {string} itemType - 項目類型 ('template'|'topic'|'link'|'language')
             * @returns {Promise<string|null>} 唯一識別路徑
             */
            async getItemIdentifier(item, itemType) {
                return sendServiceRequest('getItemIdentifier', { item, itemType });
            }
        },

        /**
         * DisplayNameService API
         */
        DisplayName: {
            /**
             * 獲取語言的顯示名稱
             * @param {string} languageName - 語言名稱（內部標識）
             * @returns {Promise<string>} 顯示名稱
             */
            async getLanguageDisplayName(languageName) {
                return sendServiceRequest('getLanguageDisplayName', { languageName });
            },

            /**
             * 獲取主題的顯示名稱
             * @param {string} topicPath - 主題路徑
             * @returns {Promise<string>} 顯示名稱
             */
            async getTopicDisplayName(topicPath) {
                return sendServiceRequest('getTopicDisplayName', { topicPath });
            },

            /**
             * 將路徑轉換為完整的顯示路徑
             * @param {string} path - 路徑字串
             * @returns {Promise<string>} 完整顯示路徑
             */
            async getFullDisplayPath(path) {
                return sendServiceRequest('getFullDisplayPath', { path });
            }
        }
    };
})();
