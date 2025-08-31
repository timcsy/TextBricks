import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
    Template, 
    TemplateCategory, 
    Language, 
    ExtendedTemplate, 
    TemplateImportData, 
    TemplateManagementMetadata,
    UserProfile,
    LearningContext,
    TemplateRecommendation
} from '../models/Template';
import { TemplateManager } from './TemplateManager';

export class TemplateManagementService {
    private templateManager: TemplateManager;
    private context: vscode.ExtensionContext;

    constructor(templateManager: TemplateManager, context: vscode.ExtensionContext) {
        this.templateManager = templateManager;
        this.context = context;
    }

    // === CRUD Operations ===

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

        await this.addTemplateToData(newTemplate);
        return newTemplate;
    }

    async updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>): Promise<ExtendedTemplate | null> {
        const existingTemplate = this.templateManager.getTemplateById(templateId) as ExtendedTemplate;
        if (!existingTemplate) {
            return null;
        }

        const updatedTemplate: ExtendedTemplate = {
            ...existingTemplate,
            ...updates,
            id: templateId, // 確保ID不會被修改
            metadata: {
                ...existingTemplate.metadata,
                ...updates.metadata,
                updatedAt: new Date()
            }
        };

        await this.updateTemplateInData(updatedTemplate);
        return updatedTemplate;
    }

    async deleteTemplate(templateId: string): Promise<boolean> {
        const template = this.templateManager.getTemplateById(templateId);
        if (!template) {
            return false;
        }

        await this.removeTemplateFromData(templateId);
        return true;
    }

    getTemplate(templateId: string): ExtendedTemplate | null {
        return this.templateManager.getTemplateById(templateId) as ExtendedTemplate || null;
    }

    // === Category Management ===

    async createCategory(category: Omit<TemplateCategory, 'id'>): Promise<TemplateCategory> {
        const newCategory: TemplateCategory = {
            ...category,
            id: this.generateCategoryId()
        };

        await this.addCategoryToData(newCategory);
        return newCategory;
    }

    async updateCategory(categoryId: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory | null> {
        const categories = this.templateManager.getCategories();
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        
        if (categoryIndex === -1) {
            return null;
        }

        const updatedCategory = { ...categories[categoryIndex], ...updates, id: categoryId };
        await this.updateCategoryInData(updatedCategory);
        return updatedCategory;
    }

    async deleteCategory(categoryId: string): Promise<boolean> {
        // 檢查是否有模板使用這個分類
        const templatesInCategory = this.templateManager.getTemplatesByCategory(categoryId);
        if (templatesInCategory.length > 0) {
            throw new Error(`Cannot delete category "${categoryId}": ${templatesInCategory.length} templates are using this category.`);
        }

        await this.removeCategoryFromData(categoryId);
        return true;
    }

    // === Language Management ===

    async createLanguage(language: Language): Promise<Language> {
        await this.addLanguageToData(language);
        return language;
    }

    async updateLanguage(languageId: string, updates: Partial<Language>): Promise<Language | null> {
        const languages = this.templateManager.getLanguages();
        const languageIndex = languages.findIndex(l => l.id === languageId);
        
        if (languageIndex === -1) {
            return null;
        }

        const updatedLanguage = { ...languages[languageIndex], ...updates, id: languageId };
        await this.updateLanguageInData(updatedLanguage);
        return updatedLanguage;
    }

    // === Import/Export ===

    async exportTemplates(filters?: {
        languageIds?: string[];
        categoryIds?: string[];
        templateIds?: string[];
    }): Promise<TemplateImportData> {
        let templates = this.templateManager.getAllTemplates() as ExtendedTemplate[];

        // Apply filters
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
            categories: this.templateManager.getCategories(),
            languages: this.templateManager.getLanguages(),
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
        const result: {
            imported: number;
            skipped: number;
            errors: string[];
        } = {
            imported: 0,
            skipped: 0,
            errors: []
        };

        try {
            // Import languages first
            if (importData.languages && options?.mergeLanguages) {
                for (const language of importData.languages) {
                    try {
                        const existing = this.templateManager.getLanguageById(language.id);
                        if (!existing) {
                            await this.createLanguage(language);
                        }
                    } catch (error) {
                        result.errors.push(`Failed to import language ${language.id}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }

            // Import categories
            if (importData.categories && options?.mergeCategories) {
                for (const category of importData.categories) {
                    try {
                        const existing = this.templateManager.getCategories().find(c => c.id === category.id);
                        if (!existing) {
                            await this.createCategory(category);
                        }
                    } catch (error) {
                        result.errors.push(`Failed to import category ${category.id}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }

            // Import templates
            for (const template of importData.templates) {
                try {
                    const existing = this.templateManager.getTemplateById(template.id);
                    
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

        // Reload templates after import
        this.templateManager.loadTemplates();
        
        return result;
    }

    // === Future Expansion Methods ===

    // These methods are placeholders for future features
    async getRecommendations(context: LearningContext, userProfile?: UserProfile): Promise<TemplateRecommendation[]> {
        // TODO: Implement recommendation algorithm based on user profile and learning context
        return [];
    }

    async recordTemplateUsage(templateId: string, userId?: string): Promise<void> {
        // TODO: Implement usage tracking
        const template = await this.getTemplate(templateId);
        if (template && template.metadata) {
            template.metadata.usage = (template.metadata.usage || 0) + 1;
            await this.updateTemplate(templateId, template);
        }
    }

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        // TODO: Implement user profile management
        return null;
    }

    async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
        // TODO: Implement user profile updates
        return null;
    }

    // === Public Helper Methods ===

    public getTemplateManager(): TemplateManager {
        return this.templateManager;
    }

    // === Private Helper Methods ===

    private generateTemplateId(): string {
        return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateCategoryId(): string {
        return `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private async addTemplateToData(template: ExtendedTemplate): Promise<void> {
        const data = await this.loadTemplateData();
        data.templates.push(template);
        await this.saveTemplateData(data);
        this.templateManager.loadTemplates();
    }

    private async updateTemplateInData(template: ExtendedTemplate): Promise<void> {
        const data = await this.loadTemplateData();
        const index = data.templates.findIndex((t: any) => t.id === template.id);
        if (index !== -1) {
            data.templates[index] = template;
            await this.saveTemplateData(data);
            this.templateManager.loadTemplates();
        }
    }

    private async removeTemplateFromData(templateId: string): Promise<void> {
        const data = await this.loadTemplateData();
        data.templates = data.templates.filter((t: any) => t.id !== templateId);
        await this.saveTemplateData(data);
        this.templateManager.loadTemplates();
    }

    private async addCategoryToData(category: TemplateCategory): Promise<void> {
        const data = await this.loadTemplateData();
        data.categories.push(category);
        await this.saveTemplateData(data);
        this.templateManager.loadTemplates();
    }

    private async updateCategoryInData(category: TemplateCategory): Promise<void> {
        const data = await this.loadTemplateData();
        const index = data.categories.findIndex((c: any) => c.id === category.id);
        if (index !== -1) {
            data.categories[index] = category;
            await this.saveTemplateData(data);
            this.templateManager.loadTemplates();
        }
    }

    private async removeCategoryFromData(categoryId: string): Promise<void> {
        const data = await this.loadTemplateData();
        data.categories = data.categories.filter((c: any) => c.id !== categoryId);
        await this.saveTemplateData(data);
        this.templateManager.loadTemplates();
    }

    private async addLanguageToData(language: Language): Promise<void> {
        const data = await this.loadTemplateData();
        if (!data.languages) {
            data.languages = [];
        }
        data.languages.push(language);
        await this.saveTemplateData(data);
        this.templateManager.loadTemplates();
    }

    private async updateLanguageInData(language: Language): Promise<void> {
        const data = await this.loadTemplateData();
        if (!data.languages) {
            data.languages = [];
        }
        const index = data.languages.findIndex((l: any) => l.id === language.id);
        if (index !== -1) {
            data.languages[index] = language;
            await this.saveTemplateData(data);
            this.templateManager.loadTemplates();
        }
    }

    private async loadTemplateData(): Promise<any> {
        try {
            const dataPath = path.join(__dirname, '../data/templates.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            throw new Error(`Failed to load template data: ${error}`);
        }
    }

    private async saveTemplateData(data: any): Promise<void> {
        try {
            const dataPath = path.join(__dirname, '../data/templates.json');
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(dataPath, jsonData, 'utf8');
        } catch (error) {
            throw new Error(`Failed to save template data: ${error}`);
        }
    }
}