import * as vscode from 'vscode';

/**
 * 統一的錯誤處理工具
 */
export class ErrorHandler {
    /**
     * 處理並顯示錯誤
     */
    static handleError(error: unknown, context?: string): void {
        const errorMessage = this.getErrorMessage(error);
        const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
        
        console.error('[TextBricks Error]', fullMessage, error);
        vscode.window.showErrorMessage(fullMessage);
    }

    /**
     * 處理並顯示警告
     */
    static handleWarning(message: string, details?: unknown): void {
        const fullMessage = details ? `${message}: ${this.getErrorMessage(details)}` : message;
        
        console.warn('[TextBricks Warning]', fullMessage, details);
        vscode.window.showWarningMessage(fullMessage);
    }

    /**
     * 記錄資訊日誌
     */
    static logInfo(message: string, data?: unknown): void {
        console.log('[TextBricks Info]', message, data);
    }

    /**
     * 記錄調試日誌
     */
    static logDebug(message: string, data?: unknown): void {
        console.debug('[TextBricks Debug]', message, data);
    }

    /**
     * 從錯誤對象提取錯誤訊息
     */
    private static getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return String(error);
    }

    /**
     * 安全執行異步操作
     */
    static async safeExecute<T>(
        operation: () => Promise<T>,
        errorContext?: string,
        defaultValue?: T
    ): Promise<T | undefined> {
        try {
            return await operation();
        } catch (error) {
            this.handleError(error, errorContext);
            return defaultValue;
        }
    }

    /**
     * 安全執行同步操作
     */
    static safeExecuteSync<T>(
        operation: () => T,
        errorContext?: string,
        defaultValue?: T
    ): T | undefined {
        try {
            return operation();
        } catch (error) {
            this.handleError(error, errorContext);
            return defaultValue;
        }
    }
}