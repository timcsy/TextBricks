/**
 * TextBricks 核心引擎 - 平台無關
 * 整合所有核心業務邏輯，不依賴任何特定平台 API
 */

import { 
    Template, 
    TemplateCategory, 
    Language, 
    ExtendedTemplate, 
    TemplateImportData 
} from '@textbricks/shared';
import { FormattingEngine } from './FormattingEngine';
import { IPlatform } from '../interfaces/IPlatform';

interface TemplateData {
    languages: Language[];
    categories: TemplateCategory[];
    templates: ExtendedTemplate[];
}

export class TextBricksEngine {
    private languages: Language[] = [];
    private categories: TemplateCategory[] = [];
    private templates: ExtendedTemplate[] = [];
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
            this.categories = data.categories;
            this.templates = data.templates;
        } catch (error) {
            this.platform.logError(error as Error, 'Loading templates');
            this.languages = [];
            this.categories = [];
            this.templates = [];
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
            // 首先嘗試從 storage 載入（用戶資料）
            const storageData = await this.platform.storage.get<string>('templates.json');
            if (storageData) {
                return JSON.parse(storageData);
            }
            
            // 如果 storage 沒有，從檔案系統載入預設資料
            const rawData = await this.loadFromFileSystem();
            if (rawData) {
                const data = JSON.parse(rawData);
                // 將預設資料儲存到 storage 供後續使用
                await this.platform.storage.set('templates.json', rawData);
                return data;
            }

            // 返回默認結構
            return {
                languages: [],
                categories: [],
                templates: []
            };
        } catch (error) {
            throw new Error(`Failed to load template data: ${error}`);
        }
    }

    private async loadFromFileSystem(): Promise<string | null> {
        try {
            // 檢查平台是否支援檔案系統操作
            if (!this.platform.supports('filesystem')) {
                return null;
            }

            // 使用平台功能檢測而非硬編碼字串比較
            const info = this.platform.getInfo();
            const isVSCode = info.features.includes('webview') && 
                           info.capabilities.system.filesystem && 
                           typeof (this.platform as any).getExtensionContext === 'function';
            
            if (isVSCode) {
                // 透過平台方法獲取擴展路徑，避免直接存取內部屬性
                const extensionPath = (this.platform as any).getExtensionPath?.() || 
                                    (this.platform as any).getExtensionContext?.()?.extensionPath;
                
                if (!extensionPath) {
                    this.platform.logWarning('Could not get extension path', 'TextBricksEngine');
                    return null;
                }

                // 動態導入以避免同步載入問題
                const { join } = await import('path');
                const { readFile } = await import('fs/promises');
                
                // 按優先順序嘗試不同路徑
                const possiblePaths = [
                    join(extensionPath, 'dist', 'plugins', 'vscode', 'current', 'out', 'data', 'templates.json'),
                    join(extensionPath, 'out', 'data', 'templates.json'),
                    join(extensionPath, 'dist', 'packages', 'vscode', 'data', 'templates.json'),
                    join(extensionPath, 'src', 'data', 'templates.json'),
                    join(extensionPath, 'assets', 'data', 'templates.json'),
                    join(extensionPath, 'data', 'templates.json')
                ];
                
                for (const templatePath of possiblePaths) {
                    try {
                        const content = await readFile(templatePath, 'utf8');
                        this.platform.logDebug(`Successfully loaded templates from: ${templatePath}`, 'TextBricksEngine');
                        return content;
                    } catch (error) {
                        this.platform.logDebug(`Failed to load from ${templatePath}: ${error}`, 'TextBricksEngine');
                        continue;
                    }
                }
                
                this.platform.logWarning('Template file not found in any expected location', 'TextBricksEngine');
            }
            
            return null;
        } catch (error) {
            this.platform.logError(error as Error, 'Loading from filesystem');
            return null;
        }
    }

    // === 查詢方法 ===

    getTemplateById(id: string): ExtendedTemplate | undefined {
        return this.templates.find(template => template.id === id);
    }

    getTemplatesByCategory(categoryId: string): ExtendedTemplate[] {
        return this.templates.filter(template => template.categoryId === categoryId);
    }

    getTemplatesByLanguage(languageId: string): ExtendedTemplate[] {
        return this.templates.filter(template => template.language === languageId);
    }

    getTemplatesByLanguageAndCategory(languageId: string, categoryId: string): ExtendedTemplate[] {
        return this.templates.filter(
            template => template.language === languageId && template.categoryId === categoryId
        );
    }

    getAllTemplates(): ExtendedTemplate[] {
        return [...this.templates];
    }

    getCategories(): TemplateCategory[] {
        return [...this.categories];
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

    // 補充相容性方法
    getContextualRecommendations(): any[] {
        return [];
    }

    getPositionAwareRecommendations(): any[] {
        return [];
    }

    // context property for compatibility
    get context(): any {
        return null;
    }

    // === 分類 CRUD 操作 ===

    async createCategory(category: Omit<TemplateCategory, 'id'>): Promise<TemplateCategory> {
        const newCategory: TemplateCategory = {
            ...category,
            id: this.generateCategoryId()
        };

        const data = await this.loadTemplateData();
        data.categories.push(newCategory);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return newCategory;
    }

    async updateCategory(categoryId: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory | null> {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            return null;
        }

        const updatedCategory = { ...category, ...updates, id: categoryId };
        const data = await this.loadTemplateData();
        const index = data.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            data.categories[index] = updatedCategory;
            await this.saveTemplateData(data);
            await this.loadTemplates();
        }

        return updatedCategory;
    }

    async deleteCategory(categoryId: string): Promise<boolean> {
        const templatesInCategory = this.getTemplatesByCategory(categoryId);
        if (templatesInCategory.length > 0) {
            throw new Error(`Cannot delete category "${categoryId}": ${templatesInCategory.length} templates are using this category.`);
        }

        const data = await this.loadTemplateData();
        data.categories = data.categories.filter(c => c.id !== categoryId);
        await this.saveTemplateData(data);
        await this.loadTemplates();

        return true;
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
        categoryIds?: string[];
        templateIds?: string[];
    }): Promise<TemplateImportData> {
        let templates = this.getAllTemplates();

        if (filters) {
            if (filters.languageIds && filters.languageIds.length > 0) {
                templates = templates.filter(t => filters.languageIds!.includes(t.language));
            }
            if (filters.categoryIds && filters.categoryIds.length > 0) {
                templates = templates.filter(t => filters.categoryIds!.includes(t.categoryId));
            }
            if (filters.templateIds && filters.templateIds.length > 0) {
                templates = templates.filter(t => filters.templateIds!.includes(t.id));
            }
        }

        return {
            templates,
            categories: this.getCategories(),
            languages: this.getLanguages(),
            version: '1.0.0',
            exportedAt: new Date(),
            exportedBy: 'TextBricks Template Manager'
        };
    }

    async importTemplates(importData: TemplateImportData, options?: {
        overwriteExisting?: boolean;
        mergeCategories?: boolean;
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

            if (importData.categories && options?.mergeCategories) {
                for (const category of importData.categories) {
                    try {
                        const existing = this.categories.find(c => c.id === category.id);
                        if (!existing) {
                            await this.createCategory(category);
                        }
                    } catch (error) {
                        result.errors.push(`Failed to import category ${category.id}: ${error instanceof Error ? error.message : String(error)}`);
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

    private generateCategoryId(): string {
        return `category-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}