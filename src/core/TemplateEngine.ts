import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
    Template, 
    TemplateCategory, 
    Language, 
    ExtendedTemplate, 
    TemplateImportData 
} from '../models/Template';
import { FormattingEngine } from './FormattingEngine';

interface TemplateData {
    languages: Language[];
    categories: TemplateCategory[];
    templates: ExtendedTemplate[];
}

/**
 * 統一的模板引擎 - 合併原本的 TemplateManager 和 TemplateManagementService
 * 負責模板的載入、查詢、CRUD 操作和匯入匯出
 */
export class TemplateEngine {
    private languages: Language[] = [];
    private categories: TemplateCategory[] = [];
    private templates: ExtendedTemplate[] = [];
    private context: vscode.ExtensionContext;
    private formattingEngine: FormattingEngine;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.formattingEngine = new FormattingEngine();
    }

    // === 資料載入與儲存 ===

    loadTemplates(): void {
        try {
            const dataPath = path.join(__dirname, '../data/templates.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            const data: TemplateData = JSON.parse(rawData);
            
            this.languages = data.languages || [];
            this.categories = data.categories;
            this.templates = data.templates;
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.languages = [];
            this.categories = [];
            this.templates = [];
        }
    }

    private async saveTemplateData(data: TemplateData): Promise<void> {
        try {
            const dataPath = path.join(__dirname, '../data/templates.json');
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(dataPath, jsonData, 'utf8');
        } catch (error) {
            throw new Error(`Failed to save template data: ${error}`);
        }
    }

    private async loadTemplateData(): Promise<TemplateData> {
        try {
            const dataPath = path.join(__dirname, '../data/templates.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            throw new Error(`Failed to load template data: ${error}`);
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
        this.loadTemplates();

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
            this.loadTemplates();
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
        this.loadTemplates();

        return true;
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
        this.loadTemplates();

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
            this.loadTemplates();
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
        this.loadTemplates();

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
        this.loadTemplates();

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
            this.loadTemplates();
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

    // 暫時保留的方法，用於向後兼容
    async getContextualRecommendations(context: any, limit: number = 6): Promise<any[]> {
        // 回退到基本推薦
        return this.getRecommendedTemplates(limit);
    }

    async getPositionAwareRecommendations(
        filePath: string,
        line: number,
        column: number,
        surroundingCode: string,
        limit: number = 3
    ): Promise<any[]> {
        // 回退到基本推薦
        return this.getRecommendedTemplates(limit);
    }

    // 為了向後兼容保留的方法
    getTemplate(templateId: string): ExtendedTemplate | null {
        return this.getTemplateById(templateId) || null;
    }

    getTemplateManager(): TemplateEngine {
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
        return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateCategoryId(): string {
        return `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}