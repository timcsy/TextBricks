/**
 * 平台無關的文檔服務
 * 處理模板文檔的解析、格式化和生成
 */

import { DocumentationType, DocumentationContent, Template } from '@textbricks/shared';
import { IPlatform } from '../interfaces/IPlatform';

export class DocumentationService {
    constructor(private readonly platform: IPlatform) {}

    /**
     * 根據內容判斷文檔類型
     */
    getDocumentationType(documentation: string): DocumentationType {
        if (!documentation) {
            return DocumentationType.MARKDOWN;
        }

        // 檢查 URL
        if (documentation.startsWith('http://') || documentation.startsWith('https://')) {
            return DocumentationType.URL;
        }

        // 檢查檔案路徑 - 必須是簡單路徑，不是多行內容
        const isLikelyFilePath = documentation.length < 500 && 
                                !documentation.includes('\n') && 
                                !documentation.includes('\r') &&
                                (documentation.endsWith('.md') || 
                                 (documentation.includes('/') || documentation.includes('\\')) &&
                                 !documentation.startsWith('#')); // Markdown 通常以 # 開頭

        if (isLikelyFilePath) {
            return DocumentationType.FILE;
        }

        // 默認為 Markdown 內容
        return DocumentationType.MARKDOWN;
    }

    /**
     * 根據類型處理文檔內容
     */
    async processDocumentation(
        template: Template, 
        documentation: string
    ): Promise<DocumentationContent> {
        const type = this.getDocumentationType(documentation);

        try {
            switch (type) {
                case DocumentationType.URL:
                    return await this.processUrlDocumentation(template, documentation);
                
                case DocumentationType.FILE:
                    return await this.processFileDocumentation(template, documentation);
                
                case DocumentationType.MARKDOWN:
                default:
                    return await this.processMarkdownDocumentation(template, documentation);
            }
        } catch (error) {
            this.platform.logError(error as Error, 'processDocumentation');
            return {
                type: DocumentationType.MARKDOWN,
                content: `Error processing documentation: ${error instanceof Error ? error.message : String(error)}`,
                processedAt: new Date(),
                metadata: {
                    error: true,
                    originalContent: documentation
                }
            };
        }
    }

    /**
     * 處理 URL 類型文檔
     */
    private async processUrlDocumentation(
        template: Template, 
        url: string
    ): Promise<DocumentationContent> {
        return {
            type: DocumentationType.URL,
            content: url,
            processedAt: new Date(),
            metadata: {
                originalUrl: url,
                title: `${template.title} - External Documentation`
            }
        };
    }

    /**
     * 處理檔案類型文檔
     */
    private async processFileDocumentation(
        template: Template, 
        filePath: string
    ): Promise<DocumentationContent> {
        try {
            // 使用平台的存儲服務讀取檔案
            const fileContent = await this.platform.storage.get<string>(`docs/${filePath}`);
            
            if (!fileContent) {
                throw new Error(`Documentation file not found: ${filePath}`);
            }

            return {
                type: DocumentationType.FILE,
                content: fileContent,
                processedAt: new Date(),
                metadata: {
                    originalPath: filePath,
                    title: `${template.title} - Documentation`
                }
            };
        } catch (error) {
            return {
                type: DocumentationType.MARKDOWN,
                content: `**Documentation file not found:** ${filePath}\n\nPlease ensure the documentation file exists and is accessible.`,
                processedAt: new Date(),
                metadata: {
                    error: true,
                    originalPath: filePath
                }
            };
        }
    }

    /**
     * 處理 Markdown 類型文檔
     */
    private async processMarkdownDocumentation(
        template: Template, 
        markdown: string
    ): Promise<DocumentationContent> {
        // 基本 Markdown 處理和增強
        let processedContent = markdown;

        // 添加模板資訊到開頭（如果還沒有標題）
        if (!markdown.trim().startsWith('#')) {
            processedContent = `# ${template.title}\n\n${processedContent}`;
        }

        // 添加模板元資訊
        const metadata = this.generateDocumentationMetadata(template);
        if (Object.keys(metadata).length > 0) {
            const metadataSection = this.generateMetadataSection(metadata);
            processedContent = `${processedContent}\n\n---\n\n${metadataSection}`;
        }

        return {
            type: DocumentationType.MARKDOWN,
            content: processedContent,
            processedAt: new Date(),
            metadata: {
                title: template.title,
                language: template.language,
                topic: template.topic,
                ...metadata
            }
        };
    }

    /**
     * 生成文檔元資訊
     */
    private generateDocumentationMetadata(template: Template): Record<string, any> {
        const metadata: Record<string, any> = {};

        if (template.language) {
            metadata.language = template.language;
        }

        if (template.topic) {
            metadata.topic = template.topic;
        }

        if ((template as any).metadata?.tags && (template as any).metadata.tags.length > 0) {
            metadata.tags = (template as any).metadata.tags;
        }

        if ('metadata' in template && template.metadata) {
            const metadataObj = template.metadata as any;
            if (metadataObj.version) {
                metadata.version = metadataObj.version;
            }
            if (metadataObj.author) {
                metadata.author = metadataObj.author;
            }
            if (metadataObj.usage) {
                metadata.usage = metadataObj.usage;
            }
        }

        return metadata;
    }

    /**
     * 生成元資訊區段
     */
    private generateMetadataSection(metadata: Record<string, any>): string {
        let section = '## Template Information\n\n';

        for (const [key, value] of Object.entries(metadata)) {
            if (value !== undefined && value !== null && value !== '') {
                const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
                
                if (Array.isArray(value)) {
                    section += `**${displayKey}:** ${value.join(', ')}\n\n`;
                } else {
                    section += `**${displayKey}:** ${value}\n\n`;
                }
            }
        }

        return section;
    }

    /**
     * 生成模板列表文檔
     */
    async generateTemplateListDocumentation(templates: Template[]): Promise<DocumentationContent> {
        let content = '# Templates\n\n';

        // 按主題分組
        const grouped = this.groupTemplatesByTopic(templates);

        for (const [topic, topicTemplates] of Object.entries(grouped)) {
            content += `## ${topic}\n\n`;

            for (const template of topicTemplates) {
                content += `### ${template.title}\n\n`;
                
                if (template.description) {
                    content += `${template.description}\n\n`;
                }

                content += '```\n';
                content += template.code;
                content += '\n```\n\n';

                if ((template as any).metadata?.tags && (template as any).metadata.tags.length > 0) {
                    content += `**Tags:** ${(template as any).metadata.tags.join(', ')}\n\n`;
                }

                content += '---\n\n';
            }
        }

        return {
            type: DocumentationType.MARKDOWN,
            content,
            processedAt: new Date(),
            metadata: {
                title: 'Template List',
                templateCount: templates.length,
                topics: Object.keys(grouped).length
            }
        };
    }

    /**
     * 根據主題分組模板
     */
    private groupTemplatesByTopic(templates: Template[]): Record<string, Template[]> {
        const grouped: Record<string, Template[]> = {};

        for (const template of templates) {
            const topic = template.topic || 'Uncategorized';
            if (!grouped[topic]) {
                grouped[topic] = [];
            }
            grouped[topic].push(template);
        }

        return grouped;
    }

    /**
     * 驗證文檔內容
     */
    validateDocumentation(documentation: string): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!documentation || documentation.trim().length === 0) {
            warnings.push('Documentation is empty');
        }

        const type = this.getDocumentationType(documentation);

        switch (type) {
            case DocumentationType.URL:
                if (!this.isValidUrl(documentation)) {
                    errors.push('Invalid URL format');
                }
                break;

            case DocumentationType.FILE:
                if (!this.isValidFilePath(documentation)) {
                    errors.push('Invalid file path format');
                }
                break;

            case DocumentationType.MARKDOWN:
                // 基本 Markdown 驗證
                if (documentation.length > 50000) {
                    warnings.push('Documentation is very long (>50KB)');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 驗證 URL 格式
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 驗證檔案路徑格式
     */
    private isValidFilePath(path: string): boolean {
        // 基本檔案路徑驗證
        if (path.length === 0 || path.length > 500) {
            return false;
        }

        // 檢查是否包含危險字元
        const dangerousChars = ['<', '>', '|', '?', '*', '"'];
        for (const char of dangerousChars) {
            if (path.includes(char)) {
                return false;
            }
        }

        return true;
    }
}