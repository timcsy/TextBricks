/**
 * TemplateRepository - 模板資料存取層
 *
 * 負責模板的 CRUD 操作和檔案系統管理
 * Phase 2: 從 TextBricksEngine 提取模板管理邏輯
 */

import { IPlatform } from '../interfaces/IPlatform';
import { DataPathService } from '../services/DataPathService';
import { TopicManager } from '../managers/TopicManager';
import { ExtendedTemplate } from '@textbricks/shared';

export class TemplateRepository {
    private templates: Map<string, ExtendedTemplate> = new Map(); // Key: path (如 "python/templates/hello-world")
    private platform: IPlatform;
    private dataPathService: DataPathService;
    private topicManager?: TopicManager;

    constructor(
        platform: IPlatform,
        dataPathService: DataPathService,
        topicManager?: TopicManager
    ) {
        this.platform = platform;
        this.dataPathService = dataPathService;
        this.topicManager = topicManager;
    }

    /**
     * 初始化 Repository，載入所有模板
     */
    async initialize(): Promise<void> {
        await this.loadAllTemplates();
    }

    // ==================== CRUD 操作 ====================

    /**
     * 創建新模板
     * @param templateData 模板資料
     * @param topicPath 主題路徑（如 "python" 或 "c/basic"）
     */
    async create(templateData: Omit<ExtendedTemplate, 'type'>, topicPath: string): Promise<ExtendedTemplate> {
        const { join } = await import('path');
        const { writeFile, mkdir } = await import('fs/promises');

        const template: ExtendedTemplate = {
            type: 'template',
            ...templateData,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date()
            },
            topicPath: topicPath
        };

        // 構建檔案路徑
        const scopePath = await this.dataPathService.getScopePath('local');
        if (!scopePath) {
            throw new Error('Scope path not configured');
        }

        const fullTopicPath = join(scopePath, topicPath);
        const templatesPath = join(fullTopicPath, 'templates');
        const filePath = join(templatesPath, `${template.name}.json`);

        // 確保目錄存在
        await mkdir(templatesPath, { recursive: true });

        // 保存檔案
        await writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');

        // 加入快取 (使用完整路徑作為 key)
        const templatePath = `${topicPath}/templates/${template.name}`;
        this.templates.set(templatePath, template);

        return template;
    }

    /**
     * 根據路徑查詢模板
     * @param path 模板路徑（如 "python/templates/hello-world"）
     */
    async findByPath(path: string): Promise<ExtendedTemplate | null> {
        return this.templates.get(path) || null;
    }

    /**
     * @deprecated 使用 findByPath 替代
     */
    async findById(id: string): Promise<ExtendedTemplate | null> {
        return this.findByPath(id);
    }

    /**
     * 更新模板
     * @param path 模板路徑（如 "python/templates/hello-world"）
     */
    async update(path: string, updates: Partial<ExtendedTemplate>): Promise<ExtendedTemplate | null> {
        const existing = this.templates.get(path);
        if (!existing) {
            return null;
        }

        const updated: ExtendedTemplate = {
            ...existing,
            ...updates,
            type: 'template',
            name: existing.name, // 保持 name 不變
            metadata: {
                ...existing.metadata,
                ...updates.metadata,
                updatedAt: new Date()
            }
        };

        // 提取主題路徑
        const topicPath = path.replace('/templates/' + existing.name, '');

        // 更新檔案
        await this.saveTemplateFile(updated, topicPath);

        // 更新快取
        this.templates.set(path, updated);

        return updated;
    }

    /**
     * 刪除模板
     * @param path 模板路徑（如 "python/templates/hello-world"）
     */
    async delete(path: string): Promise<boolean> {
        const template = this.templates.get(path);
        if (!template) {
            return false;
        }

        try {
            // 提取主題路徑
            const topicPath = path.replace('/templates/' + template.name, '');
            await this.deleteTemplateFile(template.name, topicPath);
            this.templates.delete(path);
            return true;
        } catch (error) {
            this.platform.logError(error as Error, 'delete');
            return false;
        }
    }

    // ==================== 查詢方法 ====================

    /**
     * 根據主題路徑查詢模板
     * @param topicPath 主題路徑（如 "python" 或 "c/basic"）
     */
    findByTopic(topicPath: string): ExtendedTemplate[] {
        const results: ExtendedTemplate[] = [];
        const prefix = `${topicPath}/templates/`;

        for (const [path, template] of this.templates.entries()) {
            if (path.startsWith(prefix)) {
                results.push(template);
            }
        }
        return results;
    }

    /**
     * 根據語言查詢模板
     */
    findByLanguage(languageId: string): ExtendedTemplate[] {
        const results: ExtendedTemplate[] = [];
        for (const template of this.templates.values()) {
            if (template.language === languageId) {
                results.push(template);
            }
        }
        return results;
    }

    /**
     * 取得所有模板
     */
    getAll(): ExtendedTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * 根據使用次數排序
     */
    getMostUsed(limit: number = 10): ExtendedTemplate[] {
        return this.getAll()
            .sort((a, b) => (b.metadata?.usage || 0) - (a.metadata?.usage || 0))
            .slice(0, limit);
    }

    /**
     * 搜尋模板（標題或描述）
     */
    search(query: string): ExtendedTemplate[] {
        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(template =>
            template.title.toLowerCase().includes(lowerQuery) ||
            template.description?.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 增加模板使用次數
     * @deprecated usage 統計已移至 ScopeManager 集中管理
     */
    async incrementUsage(path: string): Promise<void> {
        this.platform.logWarning('incrementUsage is deprecated. Use ScopeManager.updateUsage instead.', 'TemplateRepository');
        // 此方法保留用於向後相容，但建議使用 ScopeManager
    }

    // ==================== 檔案系統操作 (私有) ====================

    /**
     * 從檔案系統載入所有模板
     */
    private async loadAllTemplates(): Promise<void> {
        const { join } = await import('path');
        const { readdir, readFile, stat } = await import('fs/promises');

        this.templates.clear();

        // 使用 getScopePath 而不是 getDataPath，因為模板存儲在 scope 目錄下
        const scopePath = await this.dataPathService.getScopePath('local');
        if (!scopePath) {
            this.platform.logWarning('No scope path configured', 'TemplateRepository');
            return;
        }
        this.platform.logInfo(`Using scope path: ${scopePath}`, 'TemplateRepository');

        try {
            // 遞迴掃描目錄載入所有模板
            await this.scanDirectoryRecursively(scopePath, '');

            this.platform.logInfo(`Loaded ${this.templates.size} templates`, 'TemplateRepository');
        } catch (error) {
            this.platform.logError(error as Error, 'loadAllTemplates');
        }
    }

    /**
     * 遞迴掃描目錄載入模板
     * @param dirPath 目錄的絕對路徑
     * @param relativePath 相對於 scope 的路徑（如 "python" 或 "c/basic"）
     */
    private async scanDirectoryRecursively(dirPath: string, relativePath: string): Promise<void> {
        const { join } = await import('path');
        const { readdir, readFile, stat } = await import('fs/promises');

        try {
            const items = await readdir(dirPath);

            for (const item of items) {
                const itemPath = join(dirPath, item);
                const itemStat = await stat(itemPath);

                if (itemStat.isDirectory()) {
                    if (item === 'templates') {
                        // 找到 templates 資料夾，載入其中的模板
                        const files = await readdir(itemPath);
                        for (const file of files) {
                            if (file.endsWith('.json')) {
                                try {
                                    const filePath = join(itemPath, file);
                                    const content = await readFile(filePath, 'utf8');
                                    const template: ExtendedTemplate = JSON.parse(content);

                                    // 構建模板路徑作為 key
                                    const templateName = file.replace('.json', '');
                                    const templatePath = relativePath
                                        ? `${relativePath}/templates/${templateName}`
                                        : `templates/${templateName}`;

                                    // 添加 topicPath 屬性用於前端顯示
                                    template.topicPath = relativePath || '';

                                    this.templates.set(templatePath, template);
                                    this.platform.logInfo(`Loaded template: ${templatePath}, topicPath: ${relativePath}, language: ${template.language}`, 'TemplateRepository');
                                } catch (error) {
                                    this.platform.logWarning(`Failed to load template ${file}`, 'TemplateRepository');
                                }
                            }
                        }
                    } else if (item !== 'links') {
                        // 遞迴掃描子目錄（跳過 links 資料夾）
                        const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
                        await this.scanDirectoryRecursively(itemPath, newRelativePath);
                    }
                }
            }
        } catch (error) {
            // 忽略無法讀取的目錄（通常是權限問題或不存在）
            this.platform.logInfo(`Skipping directory ${dirPath}: ${error}`, 'TemplateRepository');
        }
    }

    /**
     * 保存模板到檔案系統
     * @param template 模板物件
     * @param topicPath 主題路徑（如 "python" 或 "c/basic"）
     */
    private async saveTemplateFile(template: ExtendedTemplate, topicPath: string): Promise<void> {
        const { join } = await import('path');
        const { writeFile, mkdir } = await import('fs/promises');

        const scopePath = await this.dataPathService.getScopePath('local');
        if (!scopePath) {
            throw new Error('Scope path not configured');
        }

        const fullTopicPath = join(scopePath, topicPath);
        const templatesPath = join(fullTopicPath, 'templates');
        const filePath = join(templatesPath, `${template.name}.json`);

        this.platform.logInfo(`Saving template to: ${filePath}`, 'TemplateRepository');

        // 確保目錄存在
        await mkdir(templatesPath, { recursive: true });

        // 保存檔案
        await writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
    }

    /**
     * 從檔案系統刪除模板
     * @param templateName 模板名稱（如 "hello-world"）
     * @param topicPath 主題路徑（如 "python" 或 "c/basic"）
     */
    private async deleteTemplateFile(templateName: string, topicPath: string): Promise<void> {
        const { join } = await import('path');
        const { unlink } = await import('fs/promises');

        const scopePath = await this.dataPathService.getScopePath('local');
        if (!scopePath) {
            throw new Error('Scope path not configured');
        }

        const fullTopicPath = join(scopePath, topicPath);
        const templatesPath = join(fullTopicPath, 'templates');
        const filePath = join(templatesPath, `${templateName}.json`);

        this.platform.logInfo(`Deleting template from: ${filePath}`, 'TemplateRepository');

        await unlink(filePath);
    }

    /**
     * 清除快取並重新載入
     */
    async reload(): Promise<void> {
        await this.loadAllTemplates();
    }
}