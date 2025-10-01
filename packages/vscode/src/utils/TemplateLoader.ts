import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * HTML 模板載入器
 * 用於從外部文件載入和渲染 HTML 模板
 */
export class TemplateLoader {
    private templateCache: Map<string, string> = new Map();

    constructor(private extensionUri: vscode.Uri) {}

    /**
     * 載入並渲染模板
     * @param templateName - 模板文件名（不含路徑）
     * @param variables - 模板變量
     * @returns 渲染後的 HTML
     */
    async loadTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
        // 從緩存獲取模板
        let template = this.templateCache.get(templateName);

        if (!template) {
            // 讀取模板文件
            const templatePath = vscode.Uri.joinPath(
                this.extensionUri,
                'assets',
                'templates',
                templateName
            );

            try {
                const templateBytes = await vscode.workspace.fs.readFile(templatePath);
                template = Buffer.from(templateBytes).toString('utf8');
                this.templateCache.set(templateName, template);
            } catch (error) {
                console.error(`Failed to load template ${templateName}:`, error);
                throw new Error(`Template not found: ${templateName}`);
            }
        }

        // 渲染模板（替換變量）
        return this.renderTemplate(template, variables);
    }

    /**
     * 渲染模板（替換 {{variable}} 格式的變量）
     * @param template - 模板字符串
     * @param variables - 變量映射
     * @returns 渲染後的字符串
     */
    private renderTemplate(template: string, variables: Record<string, string>): string {
        let rendered = template;

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, value);
        }

        return rendered;
    }

    /**
     * 清除模板緩存
     */
    clearCache(): void {
        this.templateCache.clear();
    }

    /**
     * 移除特定模板的緩存
     * @param templateName - 模板文件名
     */
    removeCacheEntry(templateName: string): void {
        this.templateCache.delete(templateName);
    }
}
