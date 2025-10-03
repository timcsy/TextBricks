/**
 * 剪貼簿平台抽象接口
 * 定義所有平台必須實現的剪貼簿功能
 */

export type ClipboardDataType = 'text' | 'html' | 'rtf' | 'image' | 'files';

export interface ClipboardData {
    type: ClipboardDataType;
    content: string | ArrayBuffer;
    metadata?: {
        format?: string;
        encoding?: string;
        mimeType?: string;
        [key: string]: unknown;
    };
}

export interface ClipboardWriteOptions {
    format?: string;
    append?: boolean; // 是否追加到現有內容
    notification?: boolean; // 是否顯示複製通知
}

export interface ClipboardReadOptions {
    preferredType?: ClipboardDataType;
    timeout?: number; // 讀取超時時間(ms)
}

/**
 * 剪貼簿接口
 * 抽象所有平台的剪貼簿操作功能
 */
export interface IClipboard {
    // ==================== 基本讀寫 ====================
    
    /**
     * 寫入純文字到剪貼簿
     */
    writeText(text: string, options?: ClipboardWriteOptions): Promise<void>;
    
    /**
     * 從剪貼簿讀取純文字
     */
    readText(options?: ClipboardReadOptions): Promise<string>;
    
    // ==================== 多格式支援 ====================
    
    /**
     * 寫入多種格式的資料
     */
    write(data: ClipboardData[], options?: ClipboardWriteOptions): Promise<void>;
    
    /**
     * 讀取剪貼簿資料
     */
    read(options?: ClipboardReadOptions): Promise<ClipboardData[]>;
    
    /**
     * 檢查剪貼簿是否包含指定類型的資料
     */
    hasType(type: ClipboardDataType): Promise<boolean>;
    
    /**
     * 獲取剪貼簿可用的資料類型
     */
    getAvailableTypes(): Promise<ClipboardDataType[]>;
    
    // ==================== HTML 支援 ====================
    
    /**
     * 寫入 HTML 內容
     */
    writeHTML(html: string, options?: ClipboardWriteOptions): Promise<void>;
    
    /**
     * 讀取 HTML 內容
     */
    readHTML(options?: ClipboardReadOptions): Promise<string>;
    
    // ==================== 程式碼特殊處理 ====================
    
    /**
     * 寫入程式碼內容（帶語法高亮）
     */
    writeCode(code: string, language?: string, options?: ClipboardWriteOptions): Promise<void>;
    
    /**
     * 寫入格式化的程式碼
     */
    writeFormattedCode(code: string, metadata: {
        language?: string;
        indentation?: string;
        lineNumbers?: boolean;
        theme?: string;
    }, options?: ClipboardWriteOptions): Promise<void>;
    
    // ==================== 歷史記錄 ====================
    
    /**
     * 獲取剪貼簿歷史記錄（如果平台支援）
     */
    getHistory(limit?: number): Promise<ClipboardData[]>;
    
    /**
     * 清除剪貼簿歷史記錄
     */
    clearHistory(): Promise<void>;
    
    // ==================== 事件監聽 ====================
    
    /**
     * 監聽剪貼簿變更事件
     */
    onDidChange(listener: (data: ClipboardData[]) => void): IDisposable;
    
    // ==================== 平台能力檢測 ====================
    
    /**
     * 檢查平台是否支援指定功能
     */
    supportsFeature(feature: 'html' | 'rtf' | 'image' | 'files' | 'history' | 'events'): boolean;
    
    /**
     * 獲取平台限制資訊
     */
    getLimitations(): {
        maxTextLength?: number;
        maxDataSize?: number;
        supportedTypes: ClipboardDataType[];
    };
    
    // ==================== 輔助功能 ====================
    
    /**
     * 清空剪貼簿
     */
    clear(): Promise<void>;
    
    /**
     * 檢查剪貼簿是否為空
     */
    isEmpty(): Promise<boolean>;
    
    /**
     * 獲取剪貼簿內容摘要
     */
    getSummary(): Promise<{
        types: ClipboardDataType[];
        textPreview?: string;
        size: number;
        timestamp: Date;
    }>;
}

/**
 * 可釋放資源接口
 */
export interface IDisposable {
    dispose(): void;
}

/**
 * 剪貼簿工廠接口
 */
export interface IClipboardFactory {
    createClipboard(): IClipboard;
    getPlatformName(): string;
    getSupportedFeatures(): string[];
}