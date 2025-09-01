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
    TemplateRecommendation,
    ProgrammingContext,
    ContextualRecommendation
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
        const template = this.getTemplate(templateId);
        if (template && template.metadata) {
            // 更新使用次數
            template.metadata.usage = (template.metadata.usage || 0) + 1;
            template.metadata.lastUsedAt = new Date();
            
            // 更新流行度（基於最近的使用頻率）
            this.updatePopularity(template);
            
            await this.updateTemplate(templateId, template);
        }
    }

    // 獲取推薦模板（基於使用頻率和最近使用時間）
    getRecommendedTemplates(limit: number = 6): ExtendedTemplate[] {
        console.log('[DEBUG] getRecommendedTemplates called with limit:', limit);
        const allTemplates = this.templateManager.getAllTemplates() as ExtendedTemplate[];
        console.log('[DEBUG] Total templates from manager:', allTemplates.length);
        
        if (allTemplates.length === 0) {
            console.log('[DEBUG] No templates found - returning empty array');
            return [];
        }

        // 為每個模板計算推薦分數
        const templatesWithScore = allTemplates.map(template => {
            const usage = template.metadata?.usage || 0;
            const lastUsedAt = template.metadata?.lastUsedAt ? new Date(template.metadata.lastUsedAt) : null;
            
            console.log('[DEBUG] Template:', template.title, 'usage:', usage, 'lastUsedAt:', lastUsedAt);
            
            // 基礎分數來自使用次數
            let score = usage * 10;
            
            // 如果有使用記錄，根據最近使用時間加分
            if (lastUsedAt) {
                const daysSinceLastUse = (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
                // 7 天內使用過的模板額外加分
                if (daysSinceLastUse <= 7) {
                    score += 50 * (7 - daysSinceLastUse) / 7;
                }
                // 30 天內使用過的模板少量加分
                else if (daysSinceLastUse <= 30) {
                    score += 20 * (30 - daysSinceLastUse) / 30;
                }
            }
            
            console.log('[DEBUG] Template:', template.title, 'calculated score:', score);
            return { ...template, score } as ExtendedTemplate & { score: number };
        });
        
        // 按分數排序並取前幾名
        const result = templatesWithScore
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
            
        console.log('[DEBUG] Recommended templates result:', result.length, 'templates');
        return result;
    }


    // 更新模板的流行度分數
    private updatePopularity(template: ExtendedTemplate): void {
        if (!template.metadata) return;
        
        const usage = template.metadata.usage || 0;
        const lastUsedAt = template.metadata.lastUsedAt ? new Date(template.metadata.lastUsedAt) : null;
        
        // 基礎流行度來自使用次數
        let popularity = Math.min(usage * 5, 100); // 最高 100 分
        
        // 根據最近使用時間調整流行度
        if (lastUsedAt) {
            const daysSinceLastUse = (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastUse <= 1) {
                popularity = Math.min(popularity * 1.2, 100); // 1 天內使用，提升 20%
            } else if (daysSinceLastUse <= 7) {
                popularity = Math.min(popularity * 1.1, 100); // 7 天內使用，提升 10%
            } else if (daysSinceLastUse > 30) {
                popularity = Math.max(popularity * 0.8, 0); // 超過 30 天未使用，降低 20%
            }
        }
        
        template.metadata.popularity = Math.round(popularity);
    }

    // === 上下文感知推薦功能 (預留接口) ===

    // 基於編程上下文的智能推薦
    async getContextualRecommendations(
        context: ProgrammingContext, 
        limit: number = 6
    ): Promise<ContextualRecommendation[]> {
        // TODO: 實現基於上下文的推薦算法
        // 這裡將來會分析：
        // 1. 當前檔案類型和內容
        // 2. 游標位置和周圍代碼
        // 3. 項目結構和框架
        // 4. 用戶編程習慣和技能等級
        
        // 暫時回退到基本推薦，添加上下文包裝
        const basicRecommendations = this.getRecommendedTemplates(limit);
        
        return basicRecommendations.map(template => {
            const templateWithScore = template as ExtendedTemplate & { score: number };
            const contextualScore = this.calculateContextualScore(template, context);
            const contextReasons = this.generateContextReasons(template, context);
            
            return {
                ...template,
                templateId: template.id,
                score: templateWithScore.score || 0,
                reason: 'Based on usage history', // 基本推薦原因
                contextualScore,
                contextReasons,
                relevanceFactors: this.calculateRelevanceFactors(template, context),
                context: this.extractLearningContext(context)
            } as ContextualRecommendation;
        });
    }

    // 根據當前編輯位置推薦相關模板
    async getPositionAwareRecommendations(
        filePath: string,
        line: number,
        column: number,
        surroundingCode: string,
        limit: number = 3
    ): Promise<ContextualRecommendation[]> {
        // TODO: 實現位置感知推薦
        // 分析游標位置的上下文，推薦相關的模板
        // 例如：在函數內部推薦相關的控制結構、在類中推薦方法模板等
        
        const context: ProgrammingContext = {
            currentFile: {
                path: filePath,
                language: this.detectLanguageFromPath(filePath),
                extension: path.extname(filePath),
                size: 0 // TODO: 計算檔案大小
            },
            cursor: {
                line,
                column,
                surroundingCode,
                currentFunction: this.extractCurrentFunction(surroundingCode),
                currentClass: this.extractCurrentClass(surroundingCode)
            }
        };
        
        return this.getContextualRecommendations(context, limit);
    }

    // 根據項目類型推薦適用的模板
    async getProjectTypeRecommendations(
        projectType: string,
        framework?: string,
        limit: number = 6
    ): Promise<ContextualRecommendation[]> {
        // TODO: 實現項目類型感知推薦
        // 根據項目類型（web、desktop、mobile等）和框架推薦相應的模板
        
        const context: ProgrammingContext = {
            project: {
                type: projectType as any,
                framework,
                hasTests: false, // TODO: 檢測項目是否有測試
                hasLinter: false // TODO: 檢測項目是否有 linter
            }
        };
        
        return this.getContextualRecommendations(context, limit);
    }

    // 根據用戶技能等級調整推薦
    async getSkillLevelAwareRecommendations(
        language: string,
        skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
        limit: number = 6
    ): Promise<ContextualRecommendation[]> {
        // TODO: 實現技能等級感知推薦
        // 為初學者推薦簡單模板，為進階用戶推薦複雜模板
        
        const context: ProgrammingContext = {
            skillLevel: [{
                language,
                level: skillLevel,
                estimatedProgress: this.estimateProgressByLevel(skillLevel)
            }]
        };
        
        return this.getContextualRecommendations(context, limit);
    }

    // === 上下文分析輔助方法 ===

    private calculateContextualScore(template: ExtendedTemplate, context: ProgrammingContext): number {
        // TODO: 實現複雜的上下文評分算法
        let score = 50; // 基礎分數
        
        // 基於當前檔案類型
        if (context.currentFile?.language === template.language) {
            score += 20;
        }
        
        // 基於技能等級
        if (context.skillLevel) {
            const templateDifficulty = template.metadata?.difficulty || 'beginner';
            const userLevel = context.skillLevel.find(s => s.language === template.language)?.level || 'beginner';
            if (this.isSkillLevelMatch(templateDifficulty, userLevel)) {
                score += 15;
            }
        }
        
        // TODO: 添加更多上下文因子
        
        return Math.min(score, 100);
    }

    private generateContextReasons(template: ExtendedTemplate, context: ProgrammingContext): string[] {
        const reasons: string[] = [];
        
        // TODO: 根據上下文生成推薦理由
        if (context.currentFile?.language === template.language) {
            reasons.push(`符合當前 ${template.language.toUpperCase()} 檔案`);
        }
        
        if (context.project?.type) {
            reasons.push(`適用於 ${context.project.type} 項目`);
        }
        
        if (context.skillLevel) {
            const userLevel = context.skillLevel.find(s => s.language === template.language)?.level;
            if (userLevel) {
                reasons.push(`符合您的 ${userLevel} 技能等級`);
            }
        }
        
        return reasons;
    }

    private calculateRelevanceFactors(template: ExtendedTemplate, context: ProgrammingContext) {
        return {
            currentFileRelevance: context.currentFile?.language === template.language ? 0.8 : 0.2,
            projectTypeRelevance: 0.5, // TODO: 基於項目類型計算
            skillLevelMatch: 0.7, // TODO: 基於技能等級匹配度計算
            recentPatternMatch: 0.3, // TODO: 基於最近編程模式計算
            frameworkRelevance: 0.4 // TODO: 基於框架相關性計算
        };
    }

    private extractLearningContext(context: ProgrammingContext): LearningContext {
        return {
            currentLanguage: context.currentFile?.language,
            currentProject: context.project?.type,
            recentTemplates: context.recentActivity?.editingPatterns,
            learningObjectives: context.skillLevel?.flatMap(s => s.weakAreas || []) || []
        };
    }

    // === 預留的上下文分析工具方法 ===

    private detectLanguageFromPath(filePath: string): string {
        const ext = path.extname(filePath);
        const languageMap: { [key: string]: string } = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.c': 'c',
            '.cpp': 'cpp',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust'
        };
        return languageMap[ext] || 'unknown';
    }

    private extractCurrentFunction(code: string): string | undefined {
        // TODO: 實現函數名提取邏輯
        const functionMatch = code.match(/function\s+(\w+)\s*\(/);
        return functionMatch ? functionMatch[1] : undefined;
    }

    private extractCurrentClass(code: string): string | undefined {
        // TODO: 實現類名提取邏輯
        const classMatch = code.match(/class\s+(\w+)/);
        return classMatch ? classMatch[1] : undefined;
    }

    private estimateProgressByLevel(level: string): number {
        const progressMap = {
            'beginner': 25,
            'intermediate': 50,
            'advanced': 75,
            'expert': 90
        };
        return progressMap[level as keyof typeof progressMap] || 0;
    }

    private isSkillLevelMatch(templateDifficulty: string, userLevel: string): boolean {
        // TODO: 實現技能等級匹配邏輯
        const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const templateIndex = levels.indexOf(templateDifficulty);
        const userIndex = levels.indexOf(userLevel);
        
        // 允許用戶使用同等級或稍低等級的模板
        return templateIndex <= userIndex + 1;
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