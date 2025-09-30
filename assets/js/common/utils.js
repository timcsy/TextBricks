/**
 * TextBricks UI 共享工具函數庫
 *
 * 此文件包含所有 UI 組件共用的工具函數
 * 避免在 main.js 和 textbricks-manager.js 中重複定義
 */

const TextBricksUtils = {
    // ========== HTML 處理 ==========

    /**
     * 轉義 HTML 特殊字符
     * 防止 XSS 攻擊
     * @param {string} text - 要轉義的文字
     * @returns {string} 轉義後的文字
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 簡單的 Markdown 渲染
     * @param {string} text - Markdown 文字
     * @returns {string} HTML 字符串
     */
    renderMarkdown(text) {
        if (!text) return '';

        // 簡單的 markdown 轉換
        return text
            // 粗體
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // 斜體
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // 行內代碼
            .replace(/`(.+?)`/g, '<code>$1</code>')
            // 標題
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // 連結
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 換行
            .replace(/\n/g, '<br>');
    },

    // ========== 顯示名稱處理 ==========

    /**
     * 獲取主題顯示名稱
     * @param {string} topicPath - 主題路徑，如 "c/basic"
     * @param {Object} topicsData - 主題資料對象
     * @returns {string} 顯示名稱
     */
    getTopicDisplayName(topicPath, topicsData) {
        if (!topicPath) return '未分類';

        // 如果有主題數據，查找對應的 displayName
        if (topicsData) {
            const topic = topicsData.find(t => t.id === topicPath);
            if (topic?.displayName) {
                return topic.displayName;
            }
        }

        // 否則格式化路徑
        const parts = topicPath.split('/');
        return parts[parts.length - 1]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    },

    /**
     * 獲取語言標籤名稱
     * @param {string} languageId - 語言 ID
     * @param {Array} languages - 語言列表
     * @returns {string} 語言標籤名稱
     */
    getLanguageTagName(languageId, languages) {
        if (!languages) {
            return languageId.toUpperCase();
        }

        const language = languages.find(lang => lang.id === languageId);
        return language?.displayName || languageId.toUpperCase();
    },

    // ========== 日期時間 ==========

    /**
     * 格式化日期
     * @param {Date|string} date - 日期對象或字符串
     * @returns {string} 格式化後的日期字符串
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    /**
     * 格式化相對時間
     * @param {Date|string} date - 日期對象或字符串
     * @returns {string} 相對時間描述
     */
    formatRelativeTime(date) {
        if (!date) return '';
        const now = Date.now();
        const then = new Date(date).getTime();
        const diff = now - then;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '剛剛';
        if (minutes < 60) return `${minutes} 分鐘前`;
        if (hours < 24) return `${hours} 小時前`;
        if (days < 7) return `${days} 天前`;
        return this.formatDate(date);
    },

    // ========== UI 互動 ==========

    /**
     * 顯示簡單提示訊息
     * @param {HTMLElement} element - 目標元素
     * @param {string} message - 提示訊息
     * @param {number} duration - 顯示時長（毫秒）
     */
    showSimpleTooltip(element, message, duration = 2000) {
        const tooltip = document.createElement('div');
        tooltip.textContent = message;
        tooltip.className = 'simple-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;

        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;

        document.body.appendChild(tooltip);

        setTimeout(() => {
            tooltip.remove();
        }, duration);
    },

    /**
     * 顯示載入狀態
     * @param {boolean} show - 是否顯示載入狀態
     * @param {string} elementId - 載入元素的 ID（默認 'loading'）
     */
    showLoading(show, elementId = 'loading') {
        const loading = document.getElementById(elementId);
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    },

    // ========== 數據處理 ==========

    /**
     * 安全的 JSON 解析
     * @param {string} jsonString - JSON 字符串
     * @param {*} defaultValue - 解析失敗時的默認值
     * @returns {*} 解析結果或默認值
     */
    safeJsonParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('JSON parse error:', error);
            return defaultValue;
        }
    },

    /**
     * 深拷貝對象
     * @param {*} obj - 要拷貝的對象
     * @returns {*} 拷貝後的對象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));

        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    },

    /**
     * 防抖函數
     * @param {Function} func - 要執行的函數
     * @param {number} wait - 等待時間（毫秒）
     * @returns {Function} 防抖後的函數
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 節流函數
     * @param {Function} func - 要執行的函數
     * @param {number} limit - 時間限制（毫秒）
     * @returns {Function} 節流後的函數
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ========== 字符串處理 ==========

    /**
     * 截斷文字並添加省略號
     * @param {string} text - 原始文字
     * @param {number} maxLength - 最大長度
     * @returns {string} 截斷後的文字
     */
    truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * 將字符串轉換為 kebab-case
     * @param {string} str - 原始字符串
     * @returns {string} kebab-case 字符串
     */
    toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    },

    /**
     * 將字符串轉換為 camelCase
     * @param {string} str - 原始字符串
     * @returns {string} camelCase 字符串
     */
    toCamelCase(str) {
        return str
            .toLowerCase()
            .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase());
    },

    // ========== 數組處理 ==========

    /**
     * 根據屬性對對象數組進行排序
     * @param {Array} array - 要排序的數組
     * @param {string} key - 排序依據的屬性
     * @param {boolean} ascending - 是否升序
     * @returns {Array} 排序後的數組
     */
    sortByKey(array, key, ascending = true) {
        return [...array].sort((a, b) => {
            const valueA = a[key];
            const valueB = b[key];

            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });
    },

    /**
     * 數組去重
     * @param {Array} array - 原始數組
     * @param {string} key - 用於判斷唯一性的屬性（可選）
     * @returns {Array} 去重後的數組
     */
    unique(array, key) {
        if (!key) {
            return [...new Set(array)];
        }

        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }
};

// 如果在 Node.js 環境中，使用 module.exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextBricksUtils;
}

// 如果在瀏覽器環境中，掛載到全局對象
if (typeof window !== 'undefined') {
    window.TextBricksUtils = TextBricksUtils;
}