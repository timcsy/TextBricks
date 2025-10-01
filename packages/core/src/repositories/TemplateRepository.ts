/**
 * TemplateRepository - 模板資料存取層
 *
 * 負責模板的 CRUD 操作和檔案系統管理
 * Phase 2: 從 TextBricksEngine 提取模板管理邏輯
 */

import { IPlatform } from '../interfaces/IPlatform';
import { DataPathService } from '../services/DataPathService';
import { ExtendedTemplate } from '@textbricks/shared';

export class TemplateRepository {
    private templates: Map<string, ExtendedTemplate> = new Map();
    private platform: IPlatform;
    private dataPathService: DataPathService;
    private topicManager: any; // 待整合 TopicManager

    constructor(
        platform: IPlatform,
        dataPathService: DataPathService,
        topicManager?: any
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
     */
    async create(templateData: Omit<ExtendedTemplate, 'id'>): Promise<ExtendedTemplate> {
        const { join } = await import('path');
        const { writeFile, mkdir } = await import('fs/promises');

        // 生成唯一 ID
        const id = this.generateTemplateId(templateData.title);

        const template: ExtendedTemplate = {
            ...templateData,
            id,
            metadata: {
                usage: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };

        // 構建檔案路徑
        const dataPath = await this.dataPathService.getDataPath();
        if (!dataPath) {
            throw new Error('Data path not configured');
        }

        const topicPath = join(dataPath, template.topic);
        const templatesPath = join(topicPath, 'templates');
        const filePath = join(templatesPath, `${id}.json`);

        // 確保目錄存在
        await mkdir(templatesPath, { recursive: true });

        // 保存檔案
        await writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');

        // 加入快取
        this.templates.set(id, template);

        return template;
    }

    /**
     * 根據 ID 查詢模板
     */
    async findById(id: string): Promise<ExtendedTemplate | null> {
        return this.templates.get(id) || null;
    }

    /**
     * 更新模板
     */
    async update(id: string, updates: Partial<ExtendedTemplate>): Promise<ExtendedTemplate | null> {
        const existing = this.templates.get(id);
        if (!existing) {
            return null;
        }

        const updated: ExtendedTemplate = {
            ...existing,
            ...updates,
            id: existing.id, // 保持 ID 不變
            metadata: {
                ...existing.metadata,
                ...updates.metadata,
                updatedAt: new Date()
            }
        };

        // 更新檔案
        await this.saveTemplateFile(updated);

        // 更新快取
        this.templates.set(id, updated);

        return updated;
    }

    /**
     * 刪除模板
     */
    async delete(id: string): Promise<boolean> {
        const template = this.templates.get(id);
        if (!template) {
            return false;
        }

        try {
            await this.deleteTemplateFile(id, template.topic);
            this.templates.delete(id);
            return true;
        } catch (error) {
            console.error(`Failed to delete template ${id}:`, error);
            return false;
        }
    }

    // ==================== 查詢方法 ====================

    /**
     * 根據主題查詢模板
     */
    findByTopic(topic: string): ExtendedTemplate[] {
        const results: ExtendedTemplate[] = [];
        for (const template of this.templates.values()) {
            if (template.topic === topic) {
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
     */
    async incrementUsage(id: string): Promise<void> {
        const template = this.templates.get(id);
        if (template) {
            if (!template.metadata) {
                template.metadata = {};
            }
            template.metadata.usage = (template.metadata.usage || 0) + 1;
            template.metadata.lastUsedAt = new Date();
            await this.saveTemplateFile(template);
        }
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
            console.warn('[TemplateRepository] No scope path configured');
            return;
        }
        console.log(`[TemplateRepository] Using scope path: ${scopePath}`);

        try {
            // 如果有 TopicManager，使用它獲取主題列表
            if (this.topicManager && typeof this.topicManager.getAllTopics === 'function') {
                const topics = this.topicManager.getAllTopics();
                console.log(`[TemplateRepository] Scanning ${topics.length} topics for templates`);

                for (const topic of topics) {
                    // 使用 topic.path 而不是 topic.id 來構建檔案路徑
                    // topic.id 可能是 "c-basic"，但檔案路徑是 "c/basic"
                    const topicPath = topic.path
                        ? join(scopePath, ...topic.path)
                        : join(scopePath, topic.id);
                    const templatesPath = join(topicPath, 'templates');

                    try {
                        await stat(templatesPath);
                        const files = await readdir(templatesPath);
                        console.log(`[TemplateRepository] Found ${files.length} files in ${templatesPath}`);

                        for (const file of files) {
                            if (file.endsWith('.json')) {
                                try {
                                    const filePath = join(templatesPath, file);
                                    const content = await readFile(filePath, 'utf8');
                                    const template: ExtendedTemplate = JSON.parse(content);

                                    // 確保有主題資訊
                                    // language 欄位應該在模板 JSON 中明確定義，不自動推斷
                                    if (!template.topic) {
                                        template.topic = topic.id;
                                    }

                                    this.templates.set(template.id, template);
                                    console.log(`[TemplateRepository] Loaded template: ${template.id} from ${topic.id}, language: ${template.language}`);
                                } catch (error) {
                                    console.warn(`[TemplateRepository] Failed to load template ${file}:`, error);
                                }
                            }
                        }
                    } catch (error) {
                        // templates 資料夾不存在，跳過
                        console.log(`[TemplateRepository] No templates folder at ${templatesPath}: ${error}`);
                    }
                }
            } else {
                // 降級方案：遞迴掃描目錄
                await this.scanDirectoryRecursively(scopePath);
            }

            console.log(`[TemplateRepository] Loaded ${this.templates.size} templates`);
        } catch (error) {
            console.error('[TemplateRepository] Failed to load templates:', error);
        }
    }

    /**
     * 遞迴掃描目錄載入模板（降級方案）
     */
    private async scanDirectoryRecursively(dirPath: string): Promise<void> {
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
                                    this.templates.set(template.id, template);
                                } catch (error) {
                                    console.warn(`Failed to load template ${file}:`, error);
                                }
                            }
                        }
                    } else {
                        // 遞迴掃描子目錄
                        await this.scanDirectoryRecursively(itemPath);
                    }
                }
            }
        } catch (error) {
            // 忽略無法讀取的目錄
        }
    }

    /**
     * 保存模板到檔案系統
     */
    private async saveTemplateFile(template: ExtendedTemplate): Promise<void> {
        const { join } = await import('path');
        const { writeFile, mkdir } = await import('fs/promises');

        const dataPath = await this.dataPathService.getDataPath();
        if (!dataPath) {
            throw new Error('Data path not configured');
        }

        const topicPath = join(dataPath, template.topic);
        const templatesPath = join(topicPath, 'templates');
        const filePath = join(templatesPath, `${template.id}.json`);

        // 確保目錄存在
        await mkdir(templatesPath, { recursive: true });

        // 保存檔案
        await writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
    }

    /**
     * 從檔案系統刪除模板
     */
    private async deleteTemplateFile(templateId: string, topicId: string): Promise<void> {
        const { join } = await import('path');
        const { unlink } = await import('fs/promises');

        const dataPath = await this.dataPathService.getDataPath();
        if (!dataPath) {
            throw new Error('Data path not configured');
        }

        const topicPath = join(dataPath, topicId);
        const templatesPath = join(topicPath, 'templates');
        const filePath = join(templatesPath, `${templateId}.json`);

        await unlink(filePath);
    }

    /**
     * 生成唯一的模板 ID
     */
    private generateTemplateId(title: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const sanitized = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 20);

        return `${sanitized}-${timestamp}-${random}`;
    }

    /**
     * 清除快取並重新載入
     */
    async reload(): Promise<void> {
        await this.loadAllTemplates();
    }
}