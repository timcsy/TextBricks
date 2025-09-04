/**
 * VS Code 剪貼簿適配器
 * 實現 IClipboard 接口，提供 VS Code 特定的剪貼簿功能
 */

import * as vscode from 'vscode';
import { 
    IClipboard, 
    ClipboardData, 
    ClipboardDataType, 
    ClipboardWriteOptions, 
    ClipboardReadOptions,
    IDisposable 
} from '../../interfaces/IClipboard';

export class VSCodeClipboard implements IClipboard {
    
    // ==================== 基本讀寫 ====================

    async writeText(text: string, options?: ClipboardWriteOptions): Promise<void> {
        await vscode.env.clipboard.writeText(text);
        
        if (options?.notification) {
            await vscode.window.showInformationMessage('內容已複製到剪貼簿');
        }
    }

    async readText(options?: ClipboardReadOptions): Promise<string> {
        return await vscode.env.clipboard.readText();
    }

    // ==================== 多格式支援 ====================

    async write(data: ClipboardData[], options?: ClipboardWriteOptions): Promise<void> {
        // VS Code 主要支持文字，找到文字類型的數據
        const textData = data.find(d => d.type === 'text');
        if (textData && typeof textData.content === 'string') {
            await this.writeText(textData.content, options);
            return;
        }

        // 如果沒有文字數據，嘗試轉換其他格式
        const firstData = data[0];
        if (firstData && typeof firstData.content === 'string') {
            await this.writeText(firstData.content, options);
        }
    }

    async read(options?: ClipboardReadOptions): Promise<ClipboardData[]> {
        const text = await this.readText(options);
        
        return [{
            type: 'text',
            content: text,
            metadata: {
                format: 'plain',
                encoding: 'utf-8',
                mimeType: 'text/plain'
            }
        }];
    }

    async hasType(type: ClipboardDataType): Promise<boolean> {
        // VS Code 主要支持文字類型
        if (type === 'text') {
            const content = await this.readText();
            return content.length > 0;
        }
        
        return false;
    }

    async getAvailableTypes(): Promise<ClipboardDataType[]> {
        const text = await this.readText();
        return text.length > 0 ? ['text'] : [];
    }

    // ==================== HTML 支援 ====================

    async writeHTML(html: string, options?: ClipboardWriteOptions): Promise<void> {
        // VS Code 不直接支持 HTML，轉為文字
        const textContent = this.convertHtmlToText(html);
        await this.writeText(textContent, options);
    }

    async readHTML(options?: ClipboardReadOptions): Promise<string> {
        // VS Code 不支持 HTML 讀取，返回空字符串
        return '';
    }

    // ==================== 程式碼特殊處理 ====================

    async writeCode(code: string, language?: string, options?: ClipboardWriteOptions): Promise<void> {
        let formattedCode = code;
        
        if (language) {
            // 添加語言標識作為註解（如果適用）
            const comment = this.getLanguageComment(language);
            if (comment) {
                formattedCode = `${comment} ${language}\n${code}`;
            }
        }

        await this.writeText(formattedCode, options);
        
        if (options?.notification) {
            const message = language ? 
                `${language} 程式碼已複製到剪貼簿` : 
                '程式碼已複製到剪貼簿';
            await vscode.window.showInformationMessage(message);
        }
    }

    async writeFormattedCode(code: string, metadata: {
        language?: string;
        indentation?: string;
        lineNumbers?: boolean;
        theme?: string;
    }, options?: ClipboardWriteOptions): Promise<void> {
        let formattedCode = code;

        // 應用縮排
        if (metadata.indentation) {
            const lines = code.split('\n');
            formattedCode = lines.map(line => 
                line.trim() ? metadata.indentation + line : line
            ).join('\n');
        }

        // 添加行號
        if (metadata.lineNumbers) {
            const lines = formattedCode.split('\n');
            formattedCode = lines.map((line, index) => 
                `${String(index + 1).padStart(3, ' ')}: ${line}`
            ).join('\n');
        }

        // 添加語言標識
        if (metadata.language) {
            const comment = this.getLanguageComment(metadata.language);
            if (comment) {
                formattedCode = `${comment} ${metadata.language}\n${formattedCode}`;
            }
        }

        await this.writeText(formattedCode, options);
    }

    // ==================== 歷史記錄 ====================

    async getHistory(limit?: number): Promise<ClipboardData[]> {
        // VS Code 不支持剪貼簿歷史，返回當前內容
        const current = await this.read();
        return current;
    }

    async clearHistory(): Promise<void> {
        // VS Code 不支持歷史清除
        // 可以清空當前剪貼簿
        await this.writeText('');
    }

    // ==================== 事件監聽 ====================

    onDidChange(listener: (data: ClipboardData[]) => void): IDisposable {
        // VS Code 不提供剪貼簿變更事件
        // 返回一個空的 disposable
        return {
            dispose: () => {}
        };
    }

    // ==================== 平台能力檢測 ====================

    supportsFeature(feature: 'html' | 'rtf' | 'image' | 'files' | 'history' | 'events'): boolean {
        switch (feature) {
            case 'html':
            case 'rtf':
            case 'image':
            case 'files':
            case 'history':
            case 'events':
                return false; // VS Code 有限的剪貼簿支援
            default:
                return false;
        }
    }

    getLimitations(): {
        maxTextLength?: number;
        maxDataSize?: number;
        supportedTypes: ClipboardDataType[];
    } {
        return {
            maxTextLength: undefined, // 無明確限制
            maxDataSize: undefined,   // 無明確限制
            supportedTypes: ['text']
        };
    }

    // ==================== 輔助功能 ====================

    async clear(): Promise<void> {
        await this.writeText('');
    }

    async isEmpty(): Promise<boolean> {
        const content = await this.readText();
        return content.trim().length === 0;
    }

    async getSummary(): Promise<{
        types: ClipboardDataType[];
        textPreview?: string;
        size: number;
        timestamp: Date;
    }> {
        const text = await this.readText();
        const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
        
        return {
            types: text.length > 0 ? ['text'] : [],
            textPreview: text.length > 0 ? preview : undefined,
            size: text.length,
            timestamp: new Date()
        };
    }

    // ==================== 私有輔助方法 ====================

    private convertHtmlToText(html: string): string {
        // 簡單的 HTML 到文字轉換
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }

    private getLanguageComment(language: string): string | null {
        const commentMap: Record<string, string> = {
            'javascript': '//',
            'typescript': '//',
            'java': '//',
            'cpp': '//',
            'c': '//',
            'csharp': '//',
            'python': '#',
            'bash': '#',
            'shell': '#',
            'ruby': '#',
            'yaml': '#',
            'toml': '#',
            'sql': '--',
            'html': '<!--',
            'xml': '<!--',
            'css': '/*'
        };

        return commentMap[language.toLowerCase()] || null;
    }
}