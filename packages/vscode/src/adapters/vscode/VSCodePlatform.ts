/**
 * VS Code 平台適配器
 * 實現 IPlatform 接口，整合所有 VS Code 特定功能
 */

import * as vscode from 'vscode';
import { 
    IPlatform, 
    PlatformInfo, 
    PlatformConfiguration,
    IPlatformPlugin,
    PlatformAdapter 
} from '@textbricks/core';
import { VSCodeEditor } from './VSCodeEditor';
import { VSCodeUI } from './VSCodeUI';
import { VSCodeClipboard } from './VSCodeClipboard';
import { VSCodeStorage } from './VSCodeStorage';

export class VSCodePlatform extends PlatformAdapter {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
    }

    // ==================== 平台信息 ====================

    getInfo(): PlatformInfo {
        const vscodeVersion = vscode.version;
        
        return {
            name: 'Visual Studio Code',
            version: vscodeVersion,
            features: [
                'editor',
                'ui',
                'clipboard',
                'storage',
                'webview',
                'statusBar',
                'quickPick',
                'inputBox',
                'fileDialog',
                'progress',
                'notifications',
                'commandPalette'
            ],
            capabilities: {
                editor: {
                    multiCursor: true,
                    folding: true,
                    syntaxHighlighting: true,
                    autoComplete: true,
                    goToDefinition: true,
                    findReferences: true
                },
                ui: {
                    webview: true,
                    statusBar: true,
                    sidePanel: true,
                    commandPalette: true,
                    notifications: true,
                    progress: true
                },
                clipboard: {
                    html: false,
                    rtf: false,
                    image: false,
                    files: false,
                    history: false,
                    events: false
                },
                storage: {
                    encryption: false,
                    compression: false,
                    sync: false,
                    backup: true,
                    transactions: true,
                    events: false
                },
                system: {
                    filesystem: true,
                    network: true,
                    processes: false,
                    shell: true
                }
            }
        };
    }

    // ==================== 平台生命周期 ====================

    async initialize(config?: PlatformConfiguration): Promise<void> {
        if (config) {
            this._config = { ...this._config, ...config };
        }

        // 初始化所有適配器
        this._editor = new VSCodeEditor();
        this._ui = new VSCodeUI();
        this._clipboard = new VSCodeClipboard();
        this._storage = new VSCodeStorage(this.context);

        this.logInfo('VS Code platform initialized', 'VSCodePlatform');
    }

    async start(): Promise<void> {
        this.logInfo('VS Code platform started', 'VSCodePlatform');
        this.emit('platform:started');
    }

    async stop(): Promise<void> {
        this.logInfo('VS Code platform stopped', 'VSCodePlatform');
        this.emit('platform:stopped');
    }

    async dispose(): Promise<void> {
        // 清理所有插件
        for (const plugin of this._plugins.values()) {
            try {
                await plugin.deactivate();
            } catch (error) {
                this.logError(error as Error, `Disposing plugin ${plugin.id}`);
            }
        }
        this._plugins.clear();

        // 清理事件監聽器
        this._eventListeners.clear();

        this.logInfo('VS Code platform disposed', 'VSCodePlatform');
        this.emit('platform:disposed');
    }

    // ==================== VS Code 特定功能 ====================

    /**
     * 獲取擴展上下文
     */
    getExtensionContext(): vscode.ExtensionContext {
        return this.context;
    }

    /**
     * 註冊 VS Code 命令
     */
    registerCommand(command: string, callback: (...args: any[]) => any): vscode.Disposable {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.context.subscriptions.push(disposable);
        
        this.logInfo(`Registered command: ${command}`, 'VSCodePlatform');
        return disposable;
    }

    /**
     * 註冊樹狀視圖提供者
     */
    registerTreeDataProvider<T>(viewId: string, provider: vscode.TreeDataProvider<T>): vscode.Disposable {
        const disposable = vscode.window.registerTreeDataProvider(viewId, provider);
        this.context.subscriptions.push(disposable);
        
        this.logInfo(`Registered tree data provider: ${viewId}`, 'VSCodePlatform');
        return disposable;
    }

    /**
     * 註冊 WebView 提供者
     */
    registerWebviewViewProvider(viewId: string, provider: vscode.WebviewViewProvider): vscode.Disposable {
        const disposable = vscode.window.registerWebviewViewProvider(viewId, provider);
        this.context.subscriptions.push(disposable);
        
        this.logInfo(`Registered webview view provider: ${viewId}`, 'VSCodePlatform');
        return disposable;
    }

    /**
     * 創建輸出通道
     */
    createOutputChannel(name: string): vscode.OutputChannel {
        return vscode.window.createOutputChannel(name);
    }

    /**
     * 獲取工作區配置
     */
    getWorkspaceConfiguration(section?: string): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(section);
    }

    /**
     * 監聽配置變更
     */
    onDidChangeConfiguration(listener: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(listener);
    }

    /**
     * 監聽工作區變更
     */
    onDidChangeWorkspaceFolders(listener: (e: vscode.WorkspaceFoldersChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeWorkspaceFolders(listener);
    }

    /**
     * 獲取當前工作區資料夾
     */
    getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
        return vscode.workspace.workspaceFolders;
    }

    /**
     * 執行 VS Code 命令
     */
    async executeCommand<T>(command: string, ...args: any[]): Promise<T | undefined> {
        try {
            return await vscode.commands.executeCommand<T>(command, ...args);
        } catch (error) {
            this.logError(error as Error, `Executing command: ${command}`);
            return undefined;
        }
    }

    // ==================== 插件系統增強 ====================

    registerPlugin(plugin: IPlatformPlugin): void {
        super.registerPlugin(plugin);
        
        // VS Code 特定的插件初始化
        plugin.activate(this).then(() => {
            this.logInfo(`Plugin activated: ${plugin.id}`, 'VSCodePlatform');
            this.emit('plugin:activated', plugin.id);
        }).catch(error => {
            this.logError(error, `Activating plugin: ${plugin.id}`);
            this.emit('plugin:error', plugin.id, error);
        });
    }

    // ==================== 擴展的錯誤處理和日誌 ====================

    logError(error: Error, context?: string): void {
        const message = context ? `[${context}] ${error.message}` : error.message;
        
        if (this._errorHandler) {
            this._errorHandler(error, context || 'VSCodePlatform');
        } else {
            console.error(`[TextBricks VSCode] ${message}`, error);
            
            // 在開發模式下也顯示給用戶
            if (this._config.debug) {
                vscode.window.showErrorMessage(`TextBricks Error: ${message}`);
            }
        }
    }

    logWarning(message: string, context?: string): void {
        if (this._config.logLevel === 'debug' || this._config.logLevel === 'info' || this._config.logLevel === 'warn') {
            const fullMessage = context ? `[${context}] ${message}` : message;
            console.warn(`[TextBricks VSCode] ${fullMessage}`);
            
            if (this._config.debug) {
                vscode.window.showWarningMessage(`TextBricks: ${message}`);
            }
        }
    }

    logInfo(message: string, context?: string): void {
        if (this._config.logLevel === 'debug' || this._config.logLevel === 'info') {
            const fullMessage = context ? `[${context}] ${message}` : message;
            console.info(`[TextBricks VSCode] ${fullMessage}`);
        }
    }

    logDebug(message: string, context?: string): void {
        if (this._config.logLevel === 'debug') {
            const fullMessage = context ? `[${context}] ${message}` : message;
            console.debug(`[TextBricks VSCode] ${fullMessage}`);
        }
    }

    // ==================== VS Code 特定的實用方法 ====================

    /**
     * 顯示進度通知
     */
    async withProgress<R>(
        options: vscode.ProgressOptions,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<R>
    ): Promise<R> {
        return vscode.window.withProgress(options, task);
    }

    /**
     * 創建狀態列項目
     */
    createStatusBarItem(alignment?: vscode.StatusBarAlignment, priority?: number): vscode.StatusBarItem {
        const item = vscode.window.createStatusBarItem(alignment, priority);
        this.context.subscriptions.push(item);
        return item;
    }

    /**
     * 創建 WebView 面板
     */
    createWebviewPanel(
        viewType: string,
        title: string,
        showOptions: vscode.ViewColumn | { viewColumn: vscode.ViewColumn; preserveFocus?: boolean },
        options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
    ): vscode.WebviewPanel {
        return vscode.window.createWebviewPanel(viewType, title, showOptions, options);
    }

    /**
     * 開啟外部連結
     */
    async openExternal(target: vscode.Uri): Promise<boolean> {
        return vscode.env.openExternal(target);
    }

    /**
     * 獲取擴展信息
     */
    getExtensionInfo(): {
        id: string;
        version: string;
        isActive: boolean;
        packageJSON: any;
    } {
        const extension = vscode.extensions.getExtension('textbricks.textbricks');
        
        return {
            id: extension?.id || 'textbricks.textbricks',
            version: extension?.packageJSON?.version || '0.0.0',
            isActive: extension?.isActive || false,
            packageJSON: extension?.packageJSON || {}
        };
    }

    /**
     * 重新載入窗口
     */
    async reloadWindow(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }

    /**
     * 檢查是否在開發模式
     */
    isDevelopmentMode(): boolean {
        return this.context.extensionMode === vscode.ExtensionMode.Development;
    }

    /**
     * 獲取擴展路徑
     */
    getExtensionPath(): string {
        return this.context.extensionPath;
    }

    /**
     * 獲取全局存儲路徑
     */
    getGlobalStoragePath(): string {
        return this.context.globalStorageUri.fsPath;
    }

    /**
     * 獲取工作區存儲路徑
     */
    getWorkspaceStoragePath(): string | undefined {
        return this.context.storageUri?.fsPath;
    }
}