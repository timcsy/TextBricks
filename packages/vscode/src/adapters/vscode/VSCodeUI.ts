/**
 * VS Code UI 適配器
 * 實現 IUI 接口，提供 VS Code 特定的用戶界面功能
 */

import * as vscode from 'vscode';
import { 
    IUI, 
    MessageType, 
    QuickPickItem, 
    InputBoxOptions, 
    IWebviewPanel,
    ProgressOptions,
    IProgress
} from '@textbricks/core';

export class VSCodeUI implements IUI {
    
    // ==================== 消息通知 ====================

    async showMessage(message: string, type: MessageType = 'info', options?: unknown): Promise<string | undefined> {
        switch (type) {
            case 'info':
                return await vscode.window.showInformationMessage(message);
            case 'warning':
                return await vscode.window.showWarningMessage(message);
            case 'error':
                return await vscode.window.showErrorMessage(message);
            default:
                return await vscode.window.showInformationMessage(message);
        }
    }

    async showInformationMessage(message: string, ...items: string[]): Promise<string | undefined> {
        if (items.length > 0) {
            return await vscode.window.showInformationMessage(message, ...items);
        }
        return await vscode.window.showInformationMessage(message);
    }

    async showWarningMessage(message: string, ...items: string[]): Promise<string | undefined> {
        if (items.length > 0) {
            return await vscode.window.showWarningMessage(message, ...items);
        }
        return await vscode.window.showWarningMessage(message);
    }

    async showErrorMessage(message: string, ...items: string[]): Promise<string | undefined> {
        if (items.length > 0) {
            return await vscode.window.showErrorMessage(message, ...items);
        }
        return await vscode.window.showErrorMessage(message);
    }

    // ==================== 輸入對話框 ====================

    async showInputBox(options?: InputBoxOptions): Promise<string | undefined> {
        const vscodeOptions: vscode.InputBoxOptions = {};
        
        if (options) {
            if (options.prompt) {vscodeOptions.prompt = options.prompt;}
            if (options.placeholder) {vscodeOptions.placeHolder = options.placeholder;}
            if (options.value) {vscodeOptions.value = options.value;}
            if (options.password) {vscodeOptions.password = options.password;}
            
            if (options.validation) {
                vscodeOptions.validateInput = (value: string) => {
                    const result = options.validation!(value);
                    return Promise.resolve(result);
                };
            }
        }

        return await vscode.window.showInputBox(vscodeOptions);
    }

    async showConfirmation(message: string, confirmText: string = 'OK'): Promise<boolean> {
        const result = await vscode.window.showWarningMessage(
            message, 
            { modal: true }, 
            confirmText, 
            'Cancel'
        );
        return result === confirmText;
    }

    // ==================== 選擇器 ====================

    async showQuickPick(items: QuickPickItem[], options?: unknown): Promise<QuickPickItem | QuickPickItem[] | undefined> {
        const vscodeItems: vscode.QuickPickItem[] = items.map(item => ({
            label: item.label,
            description: item.description,
            detail: item.detail,
            picked: item.picked
        }));

        const selected = await vscode.window.showQuickPick(vscodeItems);
        if (!selected) { return undefined; }

        // Find original item
        return items.find(item => 
            item.label === selected.label && 
            item.description === selected.description
        );
    }

    async showOpenDialog(options?: unknown): Promise<string[] | undefined> {
        const vscodeOptions: vscode.OpenDialogOptions = {};

        if (options) {
            const opts = options as any;
            if (opts.canSelectFiles !== undefined) {vscodeOptions.canSelectFiles = opts.canSelectFiles;}
            if (opts.canSelectFolders !== undefined) {vscodeOptions.canSelectFolders = opts.canSelectFolders;}
            if (opts.canSelectMany !== undefined) {vscodeOptions.canSelectMany = opts.canSelectMany;}
            if (opts.defaultPath) {vscodeOptions.defaultUri = vscode.Uri.file(opts.defaultPath);}
            if (opts.title) {vscodeOptions.title = opts.title;}

            if (opts.filters) {
                vscodeOptions.filters = opts.filters;
            }
        }

        const result = await vscode.window.showOpenDialog(vscodeOptions);
        return result?.map(uri => uri.fsPath);
    }

    async showSaveDialog(options?: {
        defaultUri?: string;
        saveLabel?: string;
        title?: string;
        filters?: Record<string, string[]>;
    }): Promise<string | undefined> {
        const vscodeOptions: vscode.SaveDialogOptions = {};
        
        if (options) {
            if (options.defaultUri) {vscodeOptions.defaultUri = vscode.Uri.file(options.defaultUri);}
            if (options.title) {vscodeOptions.title = options.title;}
            if (options.filters) {vscodeOptions.filters = options.filters;}
        }

        const result = await vscode.window.showSaveDialog(vscodeOptions);
        return result?.fsPath;
    }

    // ==================== WebView 支援 ====================

    async createWebviewPanel(options: unknown): Promise<IWebviewPanel> {
        const opts = options as any;
        const panel = vscode.window.createWebviewPanel(
            opts.viewType,
            opts.title,
            vscode.ViewColumn.One,
            {
                enableScripts: opts.enableScripts || false,
                retainContextWhenHidden: opts.retainContextWhenHidden || false,
                localResourceRoots: opts.localResourceRoots?.map((path: string) => vscode.Uri.file(path))
            }
        );

        if (opts.html) {
            panel.webview.html = opts.html;
        }

        // 創建適配器包裝
        const webviewAdapter: IWebviewPanel = {
            webview: {
                html: panel.webview.html,
                options: {
                    enableScripts: opts.enableScripts || false,
                    retainContextWhenHidden: opts.retainContextWhenHidden || false
                },

                postMessage: (message: unknown) => Promise.resolve(panel.webview.postMessage(message)),

                onDidReceiveMessage: (listener: (message: unknown) => unknown) =>
                    panel.webview.onDidReceiveMessage(listener),

                asWebviewUri: (localResource: string) =>
                    panel.webview.asWebviewUri(vscode.Uri.file(localResource)).toString(),

                cspSource: panel.webview.cspSource
            },

            viewType: opts.viewType,
            title: panel.title,

            onDidDispose: (listener: () => unknown) => panel.onDidDispose(listener),

            onDidChangeViewState: (listener: (event: { webviewPanel: IWebviewPanel }) => unknown) =>
                panel.onDidChangeViewState((e) => listener({ webviewPanel: webviewAdapter })),

            dispose: () => panel.dispose(),

            reveal: (viewColumn?: number, preserveFocus?: boolean) =>
                panel.reveal(viewColumn as vscode.ViewColumn, preserveFocus),

            get visible() { return panel.visible; },
            get active() { return panel.active; }
        };

        return webviewAdapter;
    }

    // ==================== 進度指示器 ====================

    async showProgress<T>(
        options: ProgressOptions, 
        task: (progress: IProgress) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress({
            location: this.convertProgressLocation(options.location || 'notification'),
            title: options.title,
            cancellable: options.cancellable || false
        }, async (progress, token) => {
            const progressAdapter: IProgress = {
                report: (increment: number, message?: string) => {
                    progress.report({ increment, message });
                },
                cancel: () => {
                    // VS Code doesn't support programmatic cancellation
                },
                isCompleted: false,
                isCancelled: token ? token.isCancellationRequested : false
            };

            if (token && options.cancellable) {
                token.onCancellationRequested(() => {
                    // Handle cancellation if needed
                });
            }

            return await task(progressAdapter);
        });
    }

    private convertProgressLocation(location: string): vscode.ProgressLocation {
        switch (location) {
            case 'SourceControl':
                return vscode.ProgressLocation.SourceControl;
            case 'Window':
                return vscode.ProgressLocation.Window;
            case 'Notification':
                return vscode.ProgressLocation.Notification;
            default:
                return vscode.ProgressLocation.Notification;
        }
    }

    // ==================== 狀態列 ====================

    async showStatusBarMessage(message: string, hideAfterTimeout?: number): Promise<void> {
        if (hideAfterTimeout) {
            vscode.window.setStatusBarMessage(message, hideAfterTimeout);
        } else {
            vscode.window.setStatusBarMessage(message);
        }
    }

    async createStatusBarItem(alignment: 'left' | 'right' = 'left', priority?: number): Promise<{
        text: string;
        tooltip?: string;
        command?: string;
        show(): void;
        hide(): void;
        dispose(): void;
    }> {
        const vscodeAlignment = alignment === 'left' ? 
            vscode.StatusBarAlignment.Left : 
            vscode.StatusBarAlignment.Right;
        
        const item = vscode.window.createStatusBarItem(vscodeAlignment, priority);
        
        return {
            get text() { return item.text; },
            set text(value: string) { item.text = value; },
            
            get tooltip() { return item.tooltip as string; },
            set tooltip(value: string | undefined) { item.tooltip = value; },
            
            get command() { return item.command as string; },
            set command(value: string | undefined) { item.command = value; },
            
            show: () => item.show(),
            hide: () => item.hide(),
            dispose: () => item.dispose()
        };
    }

    // ==================== 平台功能檢測 ====================

    supportsFeature(feature: string): boolean {
        switch (feature) {
            case 'webview':
            case 'statusBar':
            case 'quickPick':
            case 'inputBox':
            case 'fileDialog':
            case 'progress':
            case 'notifications':
                return true;
            default:
                return false;
        }
    }

    // ==================== 輔助方法 ====================

    async setClipboard(text: string): Promise<void> {
        await vscode.env.clipboard.writeText(text);
    }

    async getClipboard(): Promise<string> {
        return await vscode.env.clipboard.readText();
    }

    async openExternal(uri: string): Promise<void> {
        await vscode.env.openExternal(vscode.Uri.parse(uri));
    }

    // ==================== 新增缺少的方法 ====================

    registerWebviewProvider(viewType: string, provider: unknown): void {
        // VS Code specific implementation handled elsewhere
        throw new Error('registerWebviewProvider should be called on VSCodePlatform');
    }

    showStatusBarItem(options: {
        text: string;
        tooltip?: string;
        command?: string;
        alignment?: 'left' | 'right';
        priority?: number;
    }): { text: string; tooltip?: string; command?: string; dispose(): void; show(): void; hide(): void } {
        const alignment = options.alignment === 'right' ?
            vscode.StatusBarAlignment.Right :
            vscode.StatusBarAlignment.Left;

        const item = vscode.window.createStatusBarItem(alignment, options.priority);
        item.text = options.text;
        if (options.tooltip) {item.tooltip = options.tooltip;}
        if (options.command) {item.command = options.command;}
        item.show();

        return {
            get text() { return item.text; },
            set text(value: string) { item.text = value; },
            get tooltip() { return item.tooltip as string | undefined; },
            set tooltip(value: string | undefined) { item.tooltip = value; },
            get command() { return item.command as string | undefined; },
            set command(value: string | undefined) { item.command = value; },
            dispose: () => item.dispose(),
            show: () => item.show(),
            hide: () => item.hide()
        };
    }

    getPlatformName(): string {
        return 'VS Code';
    }
}