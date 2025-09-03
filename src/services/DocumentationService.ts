import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentationType, DocumentationContent, Template } from '../models/Template';

export class DocumentationService {
    private readonly _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    /**
     * Determine the documentation type based on content
     */
    public getDocumentationType(documentation: string): DocumentationType {
        if (!documentation) {
            return DocumentationType.MARKDOWN;
        }

        // Check for URL
        if (documentation.startsWith('http://') || documentation.startsWith('https://')) {
            return DocumentationType.URL;
        }

        // Check for file path - must be a simple path, not multiline content
        // File paths should be relatively short and not contain newlines
        const isLikelyFilePath = documentation.length < 500 && 
                                !documentation.includes('\n') && 
                                !documentation.includes('\r') &&
                                (documentation.endsWith('.md') || 
                                 (documentation.includes('/') || documentation.includes('\\')) &&
                                 !documentation.startsWith('#')); // Markdown usually starts with #

        if (isLikelyFilePath) {
            return DocumentationType.FILE;
        }

        // Default to markdown content
        return DocumentationType.MARKDOWN;
    }

    /**
     * Process documentation content based on its type
     */
    public async processDocumentation(
        template: Template, 
        documentation: string
    ): Promise<DocumentationContent> {
        const type = this.getDocumentationType(documentation);

        try {
            switch (type) {
                case DocumentationType.URL:
                    return await this.processUrlDocumentation(documentation);
                
                case DocumentationType.FILE:
                    return await this.processFileDocumentation(documentation);
                
                case DocumentationType.MARKDOWN:
                default:
                    return this.processMarkdownDocumentation(template, documentation);
            }
        } catch (error) {
            return {
                type,
                content: '',
                error: `Failed to process documentation: ${error}`
            };
        }
    }

    /**
     * Process URL-based documentation
     */
    private async processUrlDocumentation(url: string): Promise<DocumentationContent> {
        try {
            // For now, we'll create an iframe wrapper for external URLs
            const content = `
# 外部說明文檔

此模板的詳細說明文檔位於外部鏈接：

<div style="margin: 20px 0; padding: 15px; border: 2px solid var(--vscode-textLink-foreground); border-radius: 5px; background: var(--vscode-editor-background);">
    <p>📖 <strong>說明文檔連結：</strong></p>
    <p><a href="${url}" target="_blank" style="color: var(--vscode-textLink-foreground); text-decoration: underline;">${url}</a></p>
    <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground); margin-top: 10px;">
        點擊上方連結在新分頁中開啟完整說明文檔
    </p>
</div>

> **注意**：外部連結將在你的預設瀏覽器中開啟。
            `;

            return {
                type: DocumentationType.URL,
                content
            };
        } catch (error) {
            return {
                type: DocumentationType.URL,
                content: '',
                error: `無法載入外部文檔：${error}`
            };
        }
    }

    /**
     * Process file-based documentation
     */
    private async processFileDocumentation(filePath: string): Promise<DocumentationContent> {
        try {
            let resolvedPath: string;

            // Handle relative paths
            if (!path.isAbsolute(filePath)) {
                // Try to resolve relative to workspace
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    resolvedPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
                } else {
                    // Fallback to extension directory
                    resolvedPath = path.join(this._extensionUri.fsPath, filePath);
                }
            } else {
                resolvedPath = filePath;
            }

            // Check if file exists
            if (!fs.existsSync(resolvedPath)) {
                throw new Error(`檔案不存在：${resolvedPath}`);
            }

            // Read file content
            const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
            
            return {
                type: DocumentationType.FILE,
                content: fileContent
            };
        } catch (error) {
            return {
                type: DocumentationType.FILE,
                content: '',
                error: `無法讀取文檔檔案：${error}`
            };
        }
    }

    /**
     * Process markdown documentation with template content injection
     */
    private processMarkdownDocumentation(
        template: Template, 
        documentation: string
    ): DocumentationContent {
        let processedContent = documentation;

        // Replace entire "模板內容" section (including the code block that follows)
        const templateContentSectionRegex = /^## (模板內容|Template Content)\s*\n```[\w]*\n[\s\S]*?\n```/m;
        
        if (templateContentSectionRegex.test(documentation)) {
            // Replace the entire section (title + code block) with actual template content
            const templateCodeBlock = `## 模板內容\n\`\`\`${template.language}\n${template.code}\n\`\`\``;
            processedContent = documentation.replace(
                templateContentSectionRegex, 
                templateCodeBlock
            );
        } else {
            // Check if there's just a "模板內容" header without code block
            const headerOnlyRegex = /^## (模板內容|Template Content)\s*$/m;
            if (headerOnlyRegex.test(documentation)) {
                // Replace just the header
                const templateCodeBlock = `## 模板內容\n\`\`\`${template.language}\n${template.code}\n\`\`\``;
                processedContent = documentation.replace(headerOnlyRegex, templateCodeBlock);
            } else if (!documentation.includes('```' + template.language)) {
                // If no template content section exists and no code block is present, 
                // auto-append template content
                const autoTemplateSection = `\n\n## 模板內容\n\`\`\`${template.language}\n${template.code}\n\`\`\`\n`;
                processedContent += autoTemplateSection;
            }
        }

        return {
            type: DocumentationType.MARKDOWN,
            content: processedContent
        };
    }

    /**
     * Generate standard documentation template for a given template
     */
    public generateDocumentationTemplate(template: Template): string {
        return `# ${template.title}

## 功能簡介
${template.description}

## 模板內容
\`\`\`${template.language}
${template.code}
\`\`\`

## 範例輸入
\`\`\`
(如果需要輸入，請在此提供範例輸入)
\`\`\`

## 範例輸出
\`\`\`
(請在此提供預期的程式輸出結果)
\`\`\`

## 重點說明
- 解釋關鍵概念和語法要點
- 提供注意事項和常見錯誤
- 建議延伸學習方向

## 相關模板
- 列出相關或進階的模板建議
`;
    }

    /**
     * Validate documentation content
     */
    public validateDocumentation(documentation: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!documentation || documentation.trim().length === 0) {
            return { isValid: true, errors: [] }; // Empty is valid (optional field)
        }

        const type = this.getDocumentationType(documentation);

        switch (type) {
            case DocumentationType.URL:
                if (!this.isValidUrl(documentation)) {
                    errors.push('無效的 URL 格式');
                }
                break;
            
            case DocumentationType.FILE:
                if (!documentation.endsWith('.md')) {
                    errors.push('檔案路徑必須指向 .md 檔案');
                }
                break;
            
            case DocumentationType.MARKDOWN:
                if (documentation.length > 10000) {
                    errors.push('Markdown 內容過長（限制 10,000 字符）');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}