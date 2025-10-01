/**
 * TextBricks 統一事件委託系統
 * 簡化事件處理，提升性能
 */

console.log('[TextBricks] Loading event-delegator.js');

const EventDelegator = {
    /**
     * 事件處理器映射表
     * @private
     */
    _handlers: new Map(),

    /**
     * 已註冊的事件類型
     * @private
     */
    _registeredEvents: new Set(),

    /**
     * 註冊事件處理器
     * @param {string} selector - CSS 選擇器
     * @param {string} eventType - 事件類型 (click, mouseenter, etc.)
     * @param {Function} handler - 處理函數
     * @param {Object} options - 選項 {capture, stopPropagation, preventDefault}
     */
    on(selector, eventType, handler, options = {}) {
        const key = `${eventType}:${selector}`;

        if (!this._handlers.has(key)) {
            this._handlers.set(key, []);
        }

        this._handlers.get(key).push({
            handler,
            stopPropagation: options.stopPropagation || false,
            preventDefault: options.preventDefault || false
        });

        // 確保事件監聽器已註冊
        this._ensureEventListener(eventType, options.capture);
    },

    /**
     * 移除事件處理器
     * @param {string} selector - CSS 選擇器
     * @param {string} eventType - 事件類型
     * @param {Function} handler - 處理函數（可選，不提供則移除所有）
     */
    off(selector, eventType, handler = null) {
        const key = `${eventType}:${selector}`;

        if (!this._handlers.has(key)) {
            return;
        }

        if (handler) {
            const handlers = this._handlers.get(key);
            const index = handlers.findIndex(h => h.handler === handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
            if (handlers.length === 0) {
                this._handlers.delete(key);
            }
        } else {
            this._handlers.delete(key);
        }
    },

    /**
     * 一次性事件處理器
     * @param {string} selector - CSS 選擇器
     * @param {string} eventType - 事件類型
     * @param {Function} handler - 處理函數
     * @param {Object} options - 選項
     */
    once(selector, eventType, handler, options = {}) {
        const wrappedHandler = (event, target) => {
            handler(event, target);
            this.off(selector, eventType, wrappedHandler);
        };
        this.on(selector, eventType, wrappedHandler, options);
    },

    /**
     * 確保事件監聽器已註冊到 document
     * @private
     * @param {string} eventType - 事件類型
     * @param {boolean} capture - 是否捕獲階段
     */
    _ensureEventListener(eventType, capture = false) {
        const key = capture ? `${eventType}:capture` : eventType;

        if (this._registeredEvents.has(key)) {
            return;
        }

        document.addEventListener(
            eventType,
            (event) => this._handleEvent(event, eventType),
            capture
        );

        this._registeredEvents.add(key);
    },

    /**
     * 統一事件處理
     * @private
     * @param {Event} event - 原生事件對象
     * @param {string} eventType - 事件類型
     */
    _handleEvent(event, eventType) {
        // 遍歷所有註冊的選擇器
        for (const [key, handlerConfigs] of this._handlers.entries()) {
            const [type, selector] = key.split(':');

            if (type !== eventType) {
                continue;
            }

            // 查找匹配的目標元素
            const target = event.target.closest(selector);

            if (!target) {
                continue;
            }

            // 執行所有匹配的處理器
            for (const config of handlerConfigs) {
                if (config.preventDefault) {
                    event.preventDefault();
                }
                if (config.stopPropagation) {
                    event.stopPropagation();
                }

                try {
                    config.handler(event, target);
                } catch (error) {
                    console.error(`Event handler error for ${selector}:`, error);
                }
            }
        }
    },

    /**
     * 批量註冊事件
     * @param {Array} registrations - 註冊配置數組
     * @example
     * EventDelegator.registerAll([
     *   { selector: '.btn', event: 'click', handler: handleClick },
     *   { selector: '.card', event: 'mouseenter', handler: handleHover }
     * ]);
     */
    registerAll(registrations) {
        for (const config of registrations) {
            this.on(
                config.selector,
                config.event || 'click',
                config.handler,
                config.options || {}
            );
        }
    },

    /**
     * 移除所有事件處理器
     */
    clear() {
        this._handlers.clear();
    },

    /**
     * 獲取調試信息
     * @returns {Object} 調試信息
     */
    getDebugInfo() {
        return {
            totalHandlers: this._handlers.size,
            registeredEvents: Array.from(this._registeredEvents),
            handlers: Array.from(this._handlers.entries()).map(([key, configs]) => ({
                key,
                count: configs.length
            }))
        };
    }
};

// 導出為全局變量
if (typeof window !== 'undefined') {
    window.EventDelegator = EventDelegator;
}

// 支持模塊化導入
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventDelegator;
}
