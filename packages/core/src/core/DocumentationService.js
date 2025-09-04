"use strict";
/**
 * 平台無關的文檔服務
 * 處理模板文檔的解析、格式化和生成
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationService = void 0;
const shared_1 = require("@textbricks/shared");
class DocumentationService {
    constructor(platform) {
        this.platform = platform;
    }
    /**
     * 根據內容判斷文檔類型
     */
    getDocumentationType(documentation) {
        if (!documentation) {
            return shared_1.DocumentationType.MARKDOWN;
        }
        // 檢查 URL
        if (documentation.startsWith('http://') || documentation.startsWith('https://')) {
            return shared_1.DocumentationType.URL;
        }
        // 檢查檔案路徑 - 必須是簡單路徑，不是多行內容
        const isLikelyFilePath = documentation.length < 500 &&
            !documentation.includes('\n') &&
            !documentation.includes('\r') &&
            (documentation.endsWith('.md') ||
                (documentation.includes('/') || documentation.includes('\\')) &&
                    !documentation.startsWith('#')); // Markdown 通常以 # 開頭
        if (isLikelyFilePath) {
            return shared_1.DocumentationType.FILE;
        }
        // 默認為 Markdown 內容
        return shared_1.DocumentationType.MARKDOWN;
    }
    /**
     * 根據類型處理文檔內容
     */
    async processDocumentation(template, documentation) {
        const type = this.getDocumentationType(documentation);
        try {
            switch (type) {
                case shared_1.DocumentationType.URL:
                    return await this.processUrlDocumentation(template, documentation);
                case shared_1.DocumentationType.FILE:
                    return await this.processFileDocumentation(template, documentation);
                case shared_1.DocumentationType.MARKDOWN:
                default:
                    return await this.processMarkdownDocumentation(template, documentation);
            }
        }
        catch (error) {
            this.platform.logError(error, 'processDocumentation');
            return {
                type: shared_1.DocumentationType.MARKDOWN,
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
    async processUrlDocumentation(template, url) {
        return {
            type: shared_1.DocumentationType.URL,
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
    async processFileDocumentation(template, filePath) {
        try {
            // 使用平台的存儲服務讀取檔案
            const fileContent = await this.platform.storage.get(`docs/${filePath}`);
            if (!fileContent) {
                throw new Error(`Documentation file not found: ${filePath}`);
            }
            return {
                type: shared_1.DocumentationType.FILE,
                content: fileContent,
                processedAt: new Date(),
                metadata: {
                    originalPath: filePath,
                    title: `${template.title} - Documentation`
                }
            };
        }
        catch (error) {
            return {
                type: shared_1.DocumentationType.MARKDOWN,
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
    async processMarkdownDocumentation(template, markdown) {
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
            type: shared_1.DocumentationType.MARKDOWN,
            content: processedContent,
            processedAt: new Date(),
            metadata: {
                title: template.title,
                language: template.language,
                category: template.categoryId,
                ...metadata
            }
        };
    }
    /**
     * 生成文檔元資訊
     */
    generateDocumentationMetadata(template) {
        const metadata = {};
        if (template.language) {
            metadata.language = template.language;
        }
        if (template.categoryId) {
            metadata.category = template.categoryId;
        }
        if (template.metadata?.tags && template.metadata.tags.length > 0) {
            metadata.tags = template.metadata.tags;
        }
        if ('metadata' in template && template.metadata) {
            const metadataObj = template.metadata;
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
    generateMetadataSection(metadata) {
        let section = '## Template Information\n\n';
        for (const [key, value] of Object.entries(metadata)) {
            if (value !== undefined && value !== null && value !== '') {
                const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
                if (Array.isArray(value)) {
                    section += `**${displayKey}:** ${value.join(', ')}\n\n`;
                }
                else {
                    section += `**${displayKey}:** ${value}\n\n`;
                }
            }
        }
        return section;
    }
    /**
     * 生成模板列表文檔
     */
    async generateTemplateListDocumentation(templates) {
        let content = '# Templates\n\n';
        // 按分類分組
        const grouped = this.groupTemplatesByCategory(templates);
        for (const [category, categoryTemplates] of Object.entries(grouped)) {
            content += `## ${category}\n\n`;
            for (const template of categoryTemplates) {
                content += `### ${template.title}\n\n`;
                if (template.description) {
                    content += `${template.description}\n\n`;
                }
                content += '```\n';
                content += template.code;
                content += '\n```\n\n';
                if (template.metadata?.tags && template.metadata.tags.length > 0) {
                    content += `**Tags:** ${template.metadata.tags.join(', ')}\n\n`;
                }
                content += '---\n\n';
            }
        }
        return {
            type: shared_1.DocumentationType.MARKDOWN,
            content,
            processedAt: new Date(),
            metadata: {
                title: 'Template List',
                templateCount: templates.length,
                categories: Object.keys(grouped).length
            }
        };
    }
    /**
     * 根據分類分組模板
     */
    groupTemplatesByCategory(templates) {
        const grouped = {};
        for (const template of templates) {
            const category = template.categoryId || 'Uncategorized';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(template);
        }
        return grouped;
    }
    /**
     * 驗證文檔內容
     */
    validateDocumentation(documentation) {
        const errors = [];
        const warnings = [];
        if (!documentation || documentation.trim().length === 0) {
            warnings.push('Documentation is empty');
        }
        const type = this.getDocumentationType(documentation);
        switch (type) {
            case shared_1.DocumentationType.URL:
                if (!this.isValidUrl(documentation)) {
                    errors.push('Invalid URL format');
                }
                break;
            case shared_1.DocumentationType.FILE:
                if (!this.isValidFilePath(documentation)) {
                    errors.push('Invalid file path format');
                }
                break;
            case shared_1.DocumentationType.MARKDOWN:
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
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 驗證檔案路徑格式
     */
    isValidFilePath(path) {
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
exports.DocumentationService = DocumentationService;
//# sourceMappingURL=DocumentationService.js.map