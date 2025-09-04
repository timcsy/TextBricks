/**
 * 平台統一抽象接口
 * 整合所有平台功能，提供統一的平台訪問入口
 */

import { IEditor } from './IEditor';
import { IUI } from './IUI';
import { IClipboard } from './IClipboard';
import { IStorage } from './IStorage';

export interface PlatformInfo {
    name: string;
    version: string;
    features: string[];
    capabilities: PlatformCapabilities;
}

export interface PlatformCapabilities {
    editor: {
        multiCursor: boolean;
        folding: boolean;
        syntaxHighlighting: boolean;
        autoComplete: boolean;
        goToDefinition: boolean;
        findReferences: boolean;
    };
    ui: {
        webview: boolean;
        statusBar: boolean;
        sidePanel: boolean;
        commandPalette: boolean;
        notifications: boolean;
        progress: boolean;
    };
    clipboard: {
        html: boolean;
        rtf: boolean;
        image: boolean;
        files: boolean;
        history: boolean;
        events: boolean;
    };
    storage: {
        encryption: boolean;
        compression: boolean;
        sync: boolean;
        backup: boolean;
        transactions: boolean;
        events: boolean;
    };
    system: {
        filesystem: boolean;
        network: boolean;
        processes: boolean;
        shell: boolean;
    };
}

export interface PlatformConfiguration {
    debug?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    features?: {
        [feature: string]: boolean | any;
    };
    limits?: {
        maxTemplates?: number;
        maxTemplateSize?: number;
        maxClipboardSize?: number;
        maxStorageSize?: number;
    };
}

/**
 * 平台接口
 * 提供對所有平台功能的統一訪問
 */
export interface IPlatform {
    // ==================== 平台信息 ====================
    
    /**
     * 獲取平台信息
     */
    getInfo(): PlatformInfo;
    
    /**
     * 檢查是否支援某個功能
     */
    supports(feature: string): boolean;
    
    /**
     * 獲取平台配置
     */
    getConfiguration(): PlatformConfiguration;
    
    /**
     * 更新平台配置
     */
    updateConfiguration(config: Partial<PlatformConfiguration>): Promise<void>;
    
    // ==================== 核心服務 ====================
    
    /**
     * 編輯器服務
     */
    readonly editor: IEditor;
    
    /**
     * UI 服務
     */
    readonly ui: IUI;
    
    /**
     * 剪貼簿服務
     */
    readonly clipboard: IClipboard;
    
    /**
     * 存儲服務
     */
    readonly storage: IStorage;
    
    // ==================== 平台生命周期 ====================
    
    /**
     * 初始化平台
     */
    initialize(config?: PlatformConfiguration): Promise<void>;
    
    /**
     * 啟動平台服務
     */
    start(): Promise<void>;
    
    /**
     * 停止平台服務
     */
    stop(): Promise<void>;
    
    /**
     * 清理資源
     */
    dispose(): Promise<void>;
    
    // ==================== 事件系統 ====================
    
    /**
     * 監聽平台事件
     */
    on(event: string, listener: (...args: any[]) => void): IDisposable;
    
    /**
     * 發出平台事件
     */
    emit(event: string, ...args: any[]): void;
    
    /**
     * 移除事件監聽器
     */
    off(event: string, listener?: (...args: any[]) => void): void;
    
    // ==================== 插件系統 ====================
    
    /**
     * 註冊插件
     */
    registerPlugin(plugin: IPlatformPlugin): void;
    
    /**
     * 卸載插件
     */
    unregisterPlugin(pluginId: string): void;
    
    /**
     * 獲取已註冊的插件
     */
    getPlugins(): IPlatformPlugin[];
    
    // ==================== 錯誤處理 ====================
    
    /**
     * 設置全局錯誤處理器
     */
    setErrorHandler(handler: (error: Error, context: string) => void): void;
    
    /**
     * 記錄錯誤
     */
    logError(error: Error, context?: string): void;
    
    /**
     * 記錄警告
     */
    logWarning(message: string, context?: string): void;
    
    /**
     * 記錄信息
     */
    logInfo(message: string, context?: string): void;
    
    /**
     * 記錄調試信息
     */
    logDebug(message: string, context?: string): void;
}

/**
 * 平台插件接口
 */
export interface IPlatformPlugin {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    
    activate(platform: IPlatform): Promise<void>;
    deactivate(): Promise<void>;
    
    getCommands?(): Record<string, (...args: any[]) => any>;
    getServices?(): Record<string, any>;
}

/**
 * 可釋放資源接口
 */
export interface IDisposable {
    dispose(): void;
}

/**
 * 平台工廠接口
 */
export interface IPlatformFactory {
    /**
     * 創建平台實例
     */
    createPlatform(config?: PlatformConfiguration): Promise<IPlatform>;
    
    /**
     * 獲取支援的平台列表
     */
    getSupportedPlatforms(): string[];
    
    /**
     * 檢測當前運行環境
     */
    detectPlatform(): string | null;
    
    /**
     * 檢查平台兼容性
     */
    checkCompatibility(platform: string): {
        compatible: boolean;
        missingFeatures: string[];
        recommendations: string[];
    };
}

/**
 * 平台適配器抽象基類
 */
export abstract class PlatformAdapter implements IPlatform {
    protected _editor!: IEditor;
    protected _ui!: IUI;
    protected _clipboard!: IClipboard;
    protected _storage!: IStorage;
    protected _config: PlatformConfiguration = {};
    protected _plugins: Map<string, IPlatformPlugin> = new Map();
    protected _eventListeners: Map<string, Function[]> = new Map();
    protected _errorHandler?: (error: Error, context: string) => void;
    
    abstract getInfo(): PlatformInfo;
    
    get editor(): IEditor { return this._editor; }
    get ui(): IUI { return this._ui; }
    get clipboard(): IClipboard { return this._clipboard; }
    get storage(): IStorage { return this._storage; }
    
    supports(feature: string): boolean {
        const info = this.getInfo();
        return info.features.includes(feature);
    }
    
    getConfiguration(): PlatformConfiguration {
        return { ...this._config };
    }
    
    async updateConfiguration(config: Partial<PlatformConfiguration>): Promise<void> {
        this._config = { ...this._config, ...config };
    }
    
    abstract initialize(config?: PlatformConfiguration): Promise<void>;
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract dispose(): Promise<void>;
    
    on(event: string, listener: (...args: any[]) => void): IDisposable {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event)!.push(listener);
        
        return {
            dispose: () => this.off(event, listener)
        };
    }
    
    emit(event: string, ...args: any[]): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(...args);
                } catch (error) {
                    this.logError(error as Error, `Event listener for '${event}'`);
                }
            });
        }
    }
    
    off(event: string, listener?: (...args: any[]) => void): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            if (listener) {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            } else {
                listeners.length = 0;
            }
        }
    }
    
    registerPlugin(plugin: IPlatformPlugin): void {
        this._plugins.set(plugin.id, plugin);
    }
    
    unregisterPlugin(pluginId: string): void {
        const plugin = this._plugins.get(pluginId);
        if (plugin) {
            plugin.deactivate().catch(error => 
                this.logError(error, `Deactivating plugin '${pluginId}'`)
            );
            this._plugins.delete(pluginId);
        }
    }
    
    getPlugins(): IPlatformPlugin[] {
        return Array.from(this._plugins.values());
    }
    
    setErrorHandler(handler: (error: Error, context: string) => void): void {
        this._errorHandler = handler;
    }
    
    logError(error: Error, context?: string): void {
        if (this._errorHandler) {
            this._errorHandler(error, context || 'Unknown');
        } else {
            console.error(`[${this.getInfo().name}] ${context || 'Error'}:`, error);
        }
    }
    
    logWarning(message: string, context?: string): void {
        if (this._config.logLevel === 'debug' || this._config.logLevel === 'info' || this._config.logLevel === 'warn') {
            console.warn(`[${this.getInfo().name}] ${context ? `${context}: ` : ''}${message}`);
        }
    }
    
    logInfo(message: string, context?: string): void {
        if (this._config.logLevel === 'debug' || this._config.logLevel === 'info') {
            console.info(`[${this.getInfo().name}] ${context ? `${context}: ` : ''}${message}`);
        }
    }
    
    logDebug(message: string, context?: string): void {
        if (this._config.logLevel === 'debug') {
            console.debug(`[${this.getInfo().name}] ${context ? `${context}: ` : ''}${message}`);
        }
    }
}