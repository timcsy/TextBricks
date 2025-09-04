"use strict";
/**
 * 平台統一抽象接口
 * 整合所有平台功能，提供統一的平台訪問入口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAdapter = void 0;
/**
 * 平台適配器抽象基類
 */
class PlatformAdapter {
    constructor() {
        this._config = {};
        this._plugins = new Map();
        this._eventListeners = new Map();
    }
    get editor() { return this._editor; }
    get ui() { return this._ui; }
    get clipboard() { return this._clipboard; }
    get storage() { return this._storage; }
    supports(feature) {
        const info = this.getInfo();
        return info.features.includes(feature);
    }
    getConfiguration() {
        return { ...this._config };
    }
    async updateConfiguration(config) {
        this._config = { ...this._config, ...config };
    }
    on(event, listener) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(listener);
        return {
            dispose: () => this.off(event, listener)
        };
    }
    emit(event, ...args) {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(...args);
                }
                catch (error) {
                    this.logError(error, `Event listener for '${event}'`);
                }
            });
        }
    }
    off(event, listener) {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            if (listener) {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
            else {
                listeners.length = 0;
            }
        }
    }
    registerPlugin(plugin) {
        this._plugins.set(plugin.id, plugin);
    }
    unregisterPlugin(pluginId) {
        const plugin = this._plugins.get(pluginId);
        if (plugin) {
            plugin.deactivate().catch(error => this.logError(error, `Deactivating plugin '${pluginId}'`));
            this._plugins.delete(pluginId);
        }
    }
    getPlugins() {
        return Array.from(this._plugins.values());
    }
    setErrorHandler(handler) {
        this._errorHandler = handler;
    }
    logError(error, context) {
        if (this._errorHandler) {
            this._errorHandler(error, context || 'Unknown');
        }
        else {
            console.error(`[${this.getInfo().name}] ${context || 'Error'}:`, error);
        }
    }
    logWarning(message, context) {
        if (this._config.logLevel === 'debug' || this._config.logLevel === 'info' || this._config.logLevel === 'warn') {
            console.warn(`[${this.getInfo().name}] ${context ? `${context}: ` : ''}${message}`);
        }
    }
    logInfo(message, context) {
        if (this._config.logLevel === 'debug' || this._config.logLevel === 'info') {
            console.info(`[${this.getInfo().name}] ${context ? `${context}: ` : ''}${message}`);
        }
    }
    logDebug(message, context) {
        if (this._config.logLevel === 'debug') {
            console.debug(`[${this.getInfo().name}] ${context ? `${context}: ` : ''}${message}`);
        }
    }
}
exports.PlatformAdapter = PlatformAdapter;
//# sourceMappingURL=IPlatform.js.map