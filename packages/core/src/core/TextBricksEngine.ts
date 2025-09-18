/**
 * TextBricks 核心引擎 - 平台無關
 * 整合所有核心業務邏輯，不依賴任何特定平台 API
 */

import {
    Template,
    Language,
    ExtendedTemplate,
    TemplateImportData,
    Topic
} from '@textbricks/shared';
import { FormattingEngine } from './FormattingEngine';
import { IPlatform } from '../interfaces/IPlatform';

interface TemplateData {
    languages: Language[];
    templates: ExtendedTemplate[];
    topics?: Topic[];
}

export class TextBricksEngine {
    private languages: Language[] = [];
    private templates: ExtendedTemplate[] = [];
    private topics: Topic[] = [];
    private formattingEngine: FormattingEngine;
    private platform: IPlatform;

    constructor(platform: IPlatform) {
        this.platform = platform;
        this.formattingEngine = new FormattingEngine();
    }

    // === 初始化 ===

    async initialize(): Promise<void> {
        try {
            await this.loadTemplates();
        } catch (error) {
            this.platform.logError(error as Error, 'Initialize TextBricksEngine');
            throw error;
        }
    }

    // === 資料載入與儲存 ===

    async loadTemplates(): Promise<void> {
        try {
            const data = await this.loadTemplateData();
            this.languages = data.languages || [];
            this.templates = data.templates;
            this.topics = data.topics || [];
        } catch (error) {
            this.platform.logError(error as Error, 'Loading templates');
            this.languages = [];
            this.templates = [];
            this.topics = [];
        }
    }

    private async saveTemplateData(data: TemplateData): Promise<void> {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            await this.platform.storage.set('templates.json', jsonData);
        } catch (error) {
            throw new Error(`Failed to save template data: ${error}`);
        }
    }

    private async loadTemplateData(): Promise<TemplateData> {
        try {
            const CURRENT_DATA_VERSION = '0.2.4-atomic-v2-' + Date.now();

            // 檢查 storage 中的資料版本
            const storedVersion = await this.platform.storage.get<string>('templates.version');
            const storageData = await this.platform.storage.get<string>('templates.json');

            // 如果版本匹配且資料有效，使用 storage 中的資料
            if (storageData && storedVersion === CURRENT_DATA_VERSION) {
                const data = JSON.parse(storageData);
                if (data.templates && data.templates.length > 0 && data.templates[0].topic) {
                    return data;
                }
            }

            // 從檔案系統載入預設資料
            const rawData = await this.loadFromFileSystem();
            if (rawData) {
                const data = JSON.parse(rawData);
                // 儲存新資料和版本標記到 storage
                await this.platform.storage.set('templates.json', rawData);
                await this.platform.storage.set('templates.version', CURRENT_DATA_VERSION);
                return data;
            }

            // 返回默認結構
            return {
                languages: [],
                templates: [],
                topics: []
            };
        } catch (error) {
            throw new Error(`Failed to load template data: ${error}`);
        }
    }

    private async loadFromFileSystem(): Promise<string | null> {
        try {
            // 直接獲取擴展路徑
            const extensionPath = (this.platform as any).getExtensionPath?.() || 
                                (this.platform as any).getExtensionContext?.()?.extensionPath;
                                
            if (!extensionPath) {
                return null;
            }

            // 動態導入
            const { join } = await import('path');
            const { readFile } = await import('fs/promises');
            
            // 按優先級順序嘗試路徑
            const paths = [
                // 0.1.8 相容路徑 (最高優先級)
                join(extensionPath, 'out', 'data', 'templates.json'),
                // Arduino IDE 可能路徑
                join(extensionPath, 'extension', 'out', 'data', 'templates.json'),
                // 新架構路徑  
                join(extensionPath, 'packages', 'vscode', 'dist', 'data', 'templates.json'),
                join(extensionPath, 'extension', 'packages', 'vscode', 'dist', 'data', 'templates.json'),
            ];
            
            for (const templatePath of paths) {
                try {
                    const content = await readFile(templatePath, 'utf8');
                    return content;
                } catch {
                    // Continue to next path
                }
            }
            
            return null;
        } catch {
            return null;
        }
    }

    // === 查詢方法 ===

    getTemplateById(id: string): ExtendedTemplate | undefined {
        return this.templates.find(template => template.id === id);
    }

    getTemplatesByTopic(topic: string): ExtendedTemplate[] {
        return this.templates.filter(template => template.topic === topic);
    }

    getTemplatesByLanguage(languageId: string): ExtendedTemplate[] {
        return this.templates.filter(template => template.language === languageId);
    }

    getTemplatesByLanguageAndTopic(languageId: string, topic: string): ExtendedTemplate[] {
        return this.templates.filter(
            template => template.language === languageId && template.topic === topic
        );
    }

    getAllTemplates(): ExtendedTemplate[] {
        return [...this.templates];
    }

    getTopics(): string[] {
        const templateTopics = new Set(this.templates.map(template => template.topic));
        // 按照 topics 陣列中定義的順序返回主題，而不是字母順序
        const topicOrder = this.topics.map(topic => topic.name);
        const orderedTopics = topicOrder.filter(topicName => templateTopics.has(topicName));

        // 添加任何在模板中存在但在 topics 陣列中未定義的主題
        const remainingTopics = Array.from(templateTopics).filter(topicName => !topicOrder.includes(topicName));

        const result = [...orderedTopics, ...remainingTopics.sort()];

        // Debug log
        console.log('TextBricksEngine.getTopics() called');
        console.log('Topic order from topics array:', topicOrder);
        console.log('Template topics found:', Array.from(templateTopics));
        console.log('Final ordered topics:', result);

        return result;
    }

    getLanguages(): Language[] {
        return [...this.languages];
    }

    getLanguageById(id: string): Language | undefined {
        return this.languages.find(language => language.id === id);
    }

    // === 模板 CRUD 操作 ===

    async createTemplate(template: Omit<ExtendedTemplate, 'id'>): Promise<ExtendedTemplate> {
        const newTemplate: ExtendedTemplate = {
            ...template,
            id: this.generateTemplateId(),
            metadata: {
                ...template.metadata,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: '1.0.0',
                usage: 0,
                popularity: 0
            }
        };

        const data = await this.loadTemplateData();
        data.templates.push(newTemplate);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return newTemplate;
    }

    async updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>): Promise<ExtendedTemplate | null> {
        const existingTemplate = this.getTemplateById(templateId);
        if (!existingTemplate) {
            return null;
        }

        const updatedTemplate: ExtendedTemplate = {
            ...existingTemplate,
            ...updates,
            id: templateId,
            metadata: {
                ...existingTemplate.metadata,
                ...updates.metadata,
                updatedAt: new Date()
            }
        };

        const data = await this.loadTemplateData();
        const index = data.templates.findIndex(t => t.id === templateId);
        if (index !== -1) {
            data.templates[index] = updatedTemplate;
            await this.saveTemplateData(data);
            await this.loadTemplates();
        }

        return updatedTemplate;
    }

    async deleteTemplate(templateId: string): Promise<boolean> {
        const template = this.getTemplateById(templateId);
        if (!template) {
            return false;
        }

        const data = await this.loadTemplateData();
        data.templates = data.templates.filter(t => t.id !== templateId);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return true;
    }


    // context property for compatibility
    get context(): any {
        return null;
    }


    // === 語言管理 ===

    async createLanguage(language: Language): Promise<Language> {
        const data = await this.loadTemplateData();
        if (!data.languages) {
            data.languages = [];
        }
        data.languages.push(language);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return language;
    }

    async updateLanguage(languageId: string, updates: Partial<Language>): Promise<Language | null> {
        const language = this.languages.find(l => l.id === languageId);
        if (!language) {
            return null;
        }

        const updatedLanguage = { ...language, ...updates, id: languageId };
        const data = await this.loadTemplateData();
        if (!data.languages) {
            data.languages = [];
        }
        const index = data.languages.findIndex(l => l.id === languageId);
        if (index !== -1) {
            data.languages[index] = updatedLanguage;
            await this.saveTemplateData(data);
            await this.loadTemplates();
        }

        return updatedLanguage;
    }

    // === 主題管理 ===

    getManagedTopics(): Topic[] {
        return [...this.topics];
    }

    getTopicById(id: string): Topic | undefined {
        return this.topics.find(topic => topic.id === id);
    }

    async createTopic(topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>): Promise<Topic> {
        const newTopic: Topic = {
            ...topic,
            id: this.generateTopicId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const data = await this.loadTemplateData();
        if (!data.topics) {
            data.topics = [];
        }
        data.topics.push(newTopic);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return newTopic;
    }

    async updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic | null> {
        const existingTopic = this.getTopicById(topicId);
        if (!existingTopic) {
            return null;
        }

        const updatedTopic: Topic = {
            ...existingTopic,
            ...updates,
            id: topicId,
            updatedAt: new Date()
        };

        const data = await this.loadTemplateData();
        if (!data.topics) {
            data.topics = [];
        }
        const index = data.topics.findIndex(t => t.id === topicId);
        if (index !== -1) {
            data.topics[index] = updatedTopic;
            await this.saveTemplateData(data);
            await this.loadTemplates();
        }

        return updatedTopic;
    }

    async deleteTopic(topicId: string): Promise<boolean> {
        const topic = this.getTopicById(topicId);
        if (!topic) {
            return false;
        }

        const data = await this.loadTemplateData();
        if (!data.topics) {
            return false;
        }
        data.topics = data.topics.filter(t => t.id !== topicId);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return true;
    }

    getTopicByName(name: string): Topic | undefined {
        return this.topics.find(topic => topic.name === name);
    }

    async ensureTopicExists(topicName: string): Promise<Topic> {
        // 檢查是否已存在具有該名稱的主題
        let topic = this.getTopicByName(topicName);
        if (topic) {
            return topic;
        }

        // 如果不存在，創建新主題
        topic = await this.createTopic({
            name: topicName,
            description: `自動生成的主題：${topicName}`
        });

        return topic;
    }

    // === 格式化相關 ===

    formatTemplate(template: ExtendedTemplate, targetIndentation?: string): string {
        return this.formattingEngine.formatTemplate(template, targetIndentation);
    }

    formatCodeSnippet(code: string, template?: ExtendedTemplate, targetIndentation?: string): string {
        return this.formattingEngine.formatCodeSnippet(code, template, targetIndentation);
    }

    // === 模板操作 ===

    async insertTemplate(templateId: string): Promise<void> {
        const template = this.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        if (!this.platform.editor.isEditorActive()) {
            await this.platform.ui.showWarningMessage('沒有打開的編輯器');
            return;
        }

        const targetIndentation = await this.platform.editor.calculateTargetIndentation();
        const formattedCode = this.formatTemplate(template, targetIndentation);
        
        await this.platform.editor.insertText(formattedCode);
        await this.recordTemplateUsage(templateId);
        
        await this.platform.ui.showInformationMessage(`模板 '${template.title}' 已插入`);
    }

    async copyTemplate(templateId: string): Promise<void> {
        const template = this.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        const targetIndentation = this.platform.editor.isEditorActive() ? 
            await this.platform.editor.calculateTargetIndentation() : '';
        const formattedCode = this.formatTemplate(template, targetIndentation);
        
        await this.platform.clipboard.writeText(formattedCode);
        await this.recordTemplateUsage(templateId);
        
        await this.platform.ui.showInformationMessage(`模板 '${template.title}' 已複製`);
    }

    // === 匯入匯出 ===

    async exportTemplates(filters?: {
        languageIds?: string[];
        topics?: string[];
        templateIds?: string[];
    }): Promise<TemplateImportData> {
        let templates = this.getAllTemplates();

        if (filters) {
            if (filters.languageIds && filters.languageIds.length > 0) {
                templates = templates.filter(t => filters.languageIds!.includes(t.language));
            }
            if (filters.topics && filters.topics.length > 0) {
                templates = templates.filter(t => filters.topics!.includes(t.topic));
            }
            if (filters.templateIds && filters.templateIds.length > 0) {
                templates = templates.filter(t => filters.templateIds!.includes(t.id));
            }
        }

        return {
            templates,
            languages: this.getLanguages(),
            version: '1.0.0',
            exportedAt: new Date(),
            exportedBy: 'TextBricks Manager'
        };
    }

    async importTemplates(importData: TemplateImportData, options?: {
        overwriteExisting?: boolean;
        mergeLanguages?: boolean;
    }): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }> {
        const result = { imported: 0, skipped: 0, errors: [] as string[] };

        try {
            if (importData.languages && options?.mergeLanguages) {
                for (const language of importData.languages) {
                    try {
                        const existing = this.getLanguageById(language.id);
                        if (!existing) {
                            await this.createLanguage(language);
                        }
                    } catch (error) {
                        result.errors.push(`Failed to import language ${language.id}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }


            for (const template of importData.templates) {
                try {
                    const existing = this.getTemplateById(template.id);
                    
                    if (existing && !options?.overwriteExisting) {
                        result.skipped++;
                        continue;
                    }

                    if (existing && options?.overwriteExisting) {
                        await this.updateTemplate(template.id, template);
                    } else {
                        await this.createTemplate(template);
                    }

                    result.imported++;
                } catch (error) {
                    result.errors.push(`Failed to import template ${template.id}: ${error instanceof Error ? error.message : String(error)}`);
                    result.skipped++;
                }
            }
        } catch (error) {
            result.errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        return result;
    }

    // === 推薦功能 ===

    async recordTemplateUsage(templateId: string): Promise<void> {
        const template = this.getTemplateById(templateId);
        if (template && template.metadata) {
            template.metadata.usage = (template.metadata.usage || 0) + 1;
            template.metadata.lastUsedAt = new Date();
            this.updatePopularity(template);
            await this.updateTemplate(templateId, template);
        }
    }

    getRecommendedTemplates(limit: number = 6): ExtendedTemplate[] {
        const templatesWithScore = this.templates.map(template => {
            const usage = template.metadata?.usage || 0;
            const lastUsedAt = template.metadata?.lastUsedAt ? new Date(template.metadata.lastUsedAt) : null;
            
            let score = usage * 10;
            
            if (lastUsedAt) {
                const daysSinceLastUse = (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceLastUse <= 7) {
                    score += 50 * (7 - daysSinceLastUse) / 7;
                } else if (daysSinceLastUse <= 30) {
                    score += 20 * (30 - daysSinceLastUse) / 30;
                }
            }
            
            return { ...template, score } as ExtendedTemplate & { score: number };
        });
        
        return templatesWithScore
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // === 向後兼容 ===

    getTemplate(templateId: string): ExtendedTemplate | null {
        return this.getTemplateById(templateId) || null;
    }

    getTemplateManager(): TextBricksEngine {
        return this;
    }

    // === 私有輔助方法 ===

    private updatePopularity(template: ExtendedTemplate): void {
        if (!template.metadata) return;
        
        const usage = template.metadata.usage || 0;
        const lastUsedAt = template.metadata.lastUsedAt ? new Date(template.metadata.lastUsedAt) : null;
        
        let popularity = Math.min(usage * 5, 100);
        
        if (lastUsedAt) {
            const daysSinceLastUse = (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastUse <= 1) {
                popularity = Math.min(popularity * 1.2, 100);
            } else if (daysSinceLastUse <= 7) {
                popularity = Math.min(popularity * 1.1, 100);
            } else if (daysSinceLastUse > 30) {
                popularity = Math.max(popularity * 0.8, 0);
            }
        }
        
        template.metadata.popularity = Math.round(popularity);
    }

    private generateTemplateId(): string {
        return `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    private generateTopicId(): string {
        return `topic-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

}