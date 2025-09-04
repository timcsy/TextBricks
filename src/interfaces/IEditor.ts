/**
 * 編輯器平台抽象接口
 * 定義所有編輯器平台必須實現的基本功能
 */

export interface Position {
    line: number;
    character: number;
}

export interface Selection {
    start: Position;
    end: Position;
    text: string;
}

export interface EditOperation {
    position: Position;
    text: string;
    replace?: boolean; // true: 替換選取內容, false: 插入
}

export interface IndentationInfo {
    unit: string; // '\t' or '    '
    size: number; // 縮排大小
    current: string; // 當前行縮排
}

/**
 * 編輯器接口
 * 抽象所有編輯器的核心功能，讓核心邏輯與具體編輯器實現分離
 */
export interface IEditor {
    // ==================== 位置和選取 ====================
    
    /**
     * 獲取當前游標位置
     */
    getCurrentPosition(): Promise<Position>;
    
    /**
     * 獲取當前選取範圍
     */
    getCurrentSelection(): Promise<Selection | null>;
    
    /**
     * 設定游標位置
     */
    setPosition(position: Position): Promise<void>;
    
    /**
     * 設定選取範圍
     */
    setSelection(start: Position, end: Position): Promise<void>;
    
    // ==================== 文檔內容操作 ====================
    
    /**
     * 插入文字到指定位置
     */
    insertText(text: string, position?: Position): Promise<void>;
    
    /**
     * 批量編輯操作
     */
    applyEdits(edits: EditOperation[]): Promise<void>;
    
    /**
     * 取得指定行的內容
     */
    getLineContent(lineNumber: number): Promise<string>;
    
    /**
     * 取得文檔總行數
     */
    getLineCount(): Promise<number>;
    
    // ==================== 編輯器狀態 ====================
    
    /**
     * 檢查是否有活躍編輯器
     */
    isEditorActive(): boolean;
    
    /**
     * 獲取當前檔案語言
     */
    getCurrentLanguage(): Promise<string>;
    
    /**
     * 獲取編輯器縮排設定
     */
    getIndentationInfo(): Promise<IndentationInfo>;
    
    /**
     * 根據上下文計算目標縮排
     */
    calculateTargetIndentation(position?: Position): Promise<string>;
    
    // ==================== 檔案操作 ====================
    
    /**
     * 獲取當前檔案路徑
     */
    getCurrentFilePath(): Promise<string | null>;
    
    /**
     * 創建新檔案
     */
    createNewFile(content?: string): Promise<void>;
    
    // ==================== 編輯器特定功能 ====================
    
    /**
     * 開啟檔案到新編輯器
     */
    openFile(filePath: string): Promise<void>;
    
    /**
     * 聚焦編輯器
     */
    focus(): Promise<void>;
}

/**
 * 編輯器工廠接口
 * 用於創建特定平台的編輯器實例
 */
export interface IEditorFactory {
    createEditor(): IEditor;
    getPlatformName(): string;
    isSupported(): boolean;
}