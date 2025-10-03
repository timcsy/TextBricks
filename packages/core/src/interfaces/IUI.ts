/**
 * 用戶界面平台抽象接口
 * 定義所有平台必須實現的 UI 交互功能
 */

export type MessageType = 'info' | 'warning' | 'error' | 'success';

export interface MessageOptions {
    modal?: boolean;
    actions?: string[]; // 可選的動作按鈕
    timeout?: number; // 自動消失時間(ms)
}

export interface InputBoxOptions {
    title?: string;
    placeholder?: string;
    prompt?: string;
    value?: string;
    password?: boolean;
    multiline?: boolean;
    validation?: (value: string) => string | null; // 返回錯誤訊息或 null
}

export interface QuickPickItem {
    id: string;
    label: string;
    description?: string;
    detail?: string;
    picked?: boolean;
}

export interface QuickPickOptions {
    title?: string;
    placeholder?: string;
    canSelectMany?: boolean;
    matchOnDescription?: boolean;
    matchOnDetail?: boolean;
}

export interface ProgressOptions {
    title: string;
    cancellable?: boolean;
    location?: 'notification' | 'window' | 'source-control';
}

export interface IProgress {
    report(increment: number, message?: string): void;
    cancel(): void;
    isCompleted: boolean;
    isCancelled: boolean;
}

/**
 * UI 接口
 * 抽象所有平台的用戶界面交互功能
 */
export interface IUI {
    // ==================== 消息通知 ====================
    
    /**
     * 顯示消息通知
     */
    showMessage(message: string, type?: MessageType, options?: MessageOptions): Promise<string | undefined>;
    
    /**
     * 顯示資訊消息
     */
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
    
    /**
     * 顯示警告消息
     */
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
    
    /**
     * 顯示錯誤消息
     */
    showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
    
    // ==================== 輸入對話框 ====================
    
    /**
     * 顯示輸入框
     */
    showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
    
    /**
     * 顯示確認對話框
     */
    showConfirmation(message: string, confirmText?: string, cancelText?: string): Promise<boolean>;
    
    // ==================== 選擇器 ====================
    
    /**
     * 顯示快速選擇器
     */
    showQuickPick(items: QuickPickItem[], options?: QuickPickOptions): Promise<QuickPickItem | QuickPickItem[] | undefined>;
    
    /**
     * 顯示檔案選擇器
     */
    showOpenDialog(options?: {
        title?: string;
        defaultPath?: string;
        filters?: { [name: string]: string[] };
        canSelectMany?: boolean;
        canSelectFiles?: boolean;
        canSelectFolders?: boolean;
    }): Promise<string[] | undefined>;
    
    /**
     * 顯示儲存檔案對話框
     */
    showSaveDialog(options?: {
        title?: string;
        defaultPath?: string;
        defaultName?: string;
        filters?: { [name: string]: string[] };
    }): Promise<string | undefined>;
    
    // ==================== 進度指示器 ====================
    
    /**
     * 顯示進度指示器
     */
    showProgress<T>(
        options: ProgressOptions,
        task: (progress: IProgress) => Promise<T>
    ): Promise<T>;
    
    // ==================== WebView 和自定義 UI ====================
    
    /**
     * 創建 WebView 面板
     */
    createWebviewPanel(options: {
        viewType: string;
        title: string;
        column?: number;
        options?: {
            enableScripts?: boolean;
            retainContextWhenHidden?: boolean;
            enableFindWidget?: boolean;
        };
    }): Promise<IWebviewPanel>;
    
    /**
     * 註冊 WebView 提供者
     */
    registerWebviewProvider(viewType: string, provider: IWebviewProvider): void;
    
    // ==================== 狀態列 ====================
    
    /**
     * 顯示狀態列項目
     */
    showStatusBarItem(options: {
        text: string;
        tooltip?: string;
        command?: string;
        alignment?: 'left' | 'right';
        priority?: number;
    }): IStatusBarItem;
    
    // ==================== 平台特定 ====================
    
    /**
     * 獲取平台名稱
     */
    getPlatformName(): string;
    
    /**
     * 檢查是否支援某個功能
     */
    supportsFeature(feature: string): boolean;
}

/**
 * WebView 面板接口
 */
export interface IWebviewPanel {
    readonly webview: IWebview;
    readonly viewType: string;
    title: string;
    readonly visible: boolean;
    readonly active: boolean;
    
    reveal(column?: number, preserveFocus?: boolean): void;
    dispose(): void;
    
    onDidDispose: (listener: () => void) => void;
    onDidChangeViewState: (listener: (e: { webviewPanel: IWebviewPanel }) => void) => void;
}

/**
 * WebView 接口
 */
export interface IWebview {
    html: string;
    options: {
        enableScripts?: boolean;
        enableCommandUris?: boolean;
        retainContextWhenHidden?: boolean;
    };

    postMessage(message: unknown): Promise<boolean>;
    onDidReceiveMessage: (listener: (message: unknown) => void) => void;

    asWebviewUri(localResource: string): string;
    cspSource: string;
}

/**
 * WebView 提供者接口
 */
export interface IWebviewProvider {
    resolveWebviewView(webviewView: IWebviewPanel): void | Promise<void>;
}

/**
 * 狀態列項目接口
 */
export interface IStatusBarItem {
    text: string;
    tooltip?: string;
    command?: string;
    show(): void;
    hide(): void;
    dispose(): void;
}