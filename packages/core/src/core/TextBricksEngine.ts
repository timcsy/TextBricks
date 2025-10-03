/**
 * TextBricks 核心引擎 - 平台無關
 * 整合所有核心業務邏輯，不依賴任何特定平台 API
 */

import {
    Template,
    Language,
    ExtendedTemplate,
    TemplateImportData,
    Topic,
    Card,
    ExtendedCard,
    TopicConfig,
    TopicCreateData,
    TopicUpdateData,
    TopicMoveOperation
} from '@textbricks/shared';
import { FormattingEngine } from './FormattingEngine';
import { IPlatform } from '../interfaces/IPlatform';
import { TopicManager } from '../managers/TopicManager';
import { ScopeManager } from '../managers/ScopeManager';
import { DataPathService } from '../services/DataPathService';
import { TemplateRepository } from '../repositories/TemplateRepository';
import { RecommendationService } from '../services/RecommendationService';

interface TemplateData {
    languages: Language[];
    templates: ExtendedTemplate[];
    topics?: Topic[];
    cards?: ExtendedCard[];
}

export class TextBricksEngine {
    private languages: Language[] = [];
    private templates: ExtendedTemplate[] = [];
    private topics: Topic[] = [];
    private cards: ExtendedCard[] = [];
    private dataDirectory: string = '';
    private formattingEngine: FormattingEngine;
    private platform: IPlatform;

    // 新增的管理器和 Repository
    private topicManager: TopicManager;
    private scopeManager: ScopeManager;
    private dataPathService: DataPathService;
    private templateRepository: TemplateRepository;
    private recommendationService: RecommendationService;

    constructor(
        platform: IPlatform,
        dataPathService?: DataPathService,
        topicManager?: TopicManager,
        scopeManager?: ScopeManager,
        templateRepository?: TemplateRepository,
        recommendationService?: RecommendationService
    ) {
        this.platform = platform;
        this.formattingEngine = new FormattingEngine();

        // 使用注入的服務或獲取單例
        this.dataPathService = dataPathService || DataPathService.getInstance(platform);
        this.topicManager = topicManager || new TopicManager(platform, this.dataPathService);
        this.scopeManager = scopeManager || new ScopeManager(platform);
        this.templateRepository = templateRepository || new TemplateRepository(platform, this.dataPathService, this.topicManager);
        this.recommendationService = recommendationService || new RecommendationService(platform);
    }

    // === 初始化 ===

    async initialize(dataDirectory?: string): Promise<void> {
        try {
            if (dataDirectory) {
                this.dataDirectory = dataDirectory;
            }
            // 注意：ScopeManager 應該在外部已經初始化
            // 如果是自己創建的實例（沒有注入），則需要初始化
            if (this.scopeManager && !this.scopeManager.getCurrentScope()) {
                await this.scopeManager.initialize();
            }
            await this.loadTemplates();
        } catch (error) {
            this.platform.logError(error as Error, 'Initialize TextBricksEngine');
            throw error;
        }
    }

    setDataDirectory(dataDirectory: string): void {
        this.dataDirectory = dataDirectory;
    }

    // === 資料載入與儲存 ===

    async loadTemplates(): Promise<void> {
        try {
            const data = await this.loadTemplateData();
            this.languages = data.languages || [];
            this.templates = data.templates;
            this.topics = data.topics || [];
            this.cards = data.cards || [];
        } catch (error) {
            this.platform.logError(error as Error, 'Loading templates');
            this.languages = [];
            this.templates = [];
            this.topics = [];
            this.cards = [];
        }
    }

    // 強制重新載入數據，清除緩存
    async forceReloadTemplates(): Promise<void> {
        console.log('[TextBricksEngine] Force reloading templates - clearing cache first');
        await this.invalidateCache();
        await this.loadTemplates();
        console.log('[TextBricksEngine] Force reload completed. Topics loaded:', this.topics.length);
        if (this.topics.length > 0) {
            console.log('[TextBricksEngine] Sample topic:', {
                name: this.topics[0].name,
                description: this.topics[0].description,
                docLength: this.topics[0].documentation?.length
            });
        }
    }

    private async saveTemplateData(data: TemplateData): Promise<void> {
        // 不再保存到緩存，直接從檔案系統讀取
        console.log('[TextBricksEngine] Cache disabled, data loaded from filesystem');
    }

    /**
     * 強制清除存儲緩存並重新載入
     */
    private async invalidateCache(): Promise<void> {
        try {
            // 清除存儲中的緩存數據
            await this.platform.storage.set('templates.version', null);
            await this.platform.storage.set('templates.json', null);

            console.log('[TextBricksEngine] Cache invalidated');
        } catch (error) {
            console.error('[TextBricksEngine] Error invalidating cache:', error);
        }
    }

    private async loadTemplateData(): Promise<TemplateData> {
        try {
            // 直接從檔案系統載入，不使用緩存
            const rawData = await this.loadFromFileSystem();
            if (rawData) {
                return JSON.parse(rawData);
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
            // 先嘗試載入新的 data/local 結構
            const newStructureData = await this.loadFromNewDataStructure();
            if (newStructureData) {
                return newStructureData;
            }

            // 回退到舊的 templates.json 結構
            return await this.loadFromLegacyTemplatesJson();
        } catch {
            return null;
        }
    }

    private async loadFromNewDataStructure(): Promise<string | null> {
        try {
            const { stat } = await import('fs/promises');

            // 使用動態資料目錄
            if (!this.dataDirectory) {
                console.log('[TextBricksEngine] No data directory configured');
                return null;
            }

            console.log(`[TextBricksEngine] Using data directory: ${this.dataDirectory}`);

            // 檢查資料目錄是否存在
            try {
                await stat(this.dataDirectory);
                console.log(`[TextBricksEngine] Data directory found: ${this.dataDirectory}`);
            } catch (error) {
                console.log(`[TextBricksEngine] Data directory not found: ${this.dataDirectory}, error:`, error);
                return null; // 資料目錄不存在
            }

            // 使用管理器載入資料並構建內部結構
            const templateData = await this.buildFromManagers();

            console.log(`[TextBricksEngine] Loaded data summary:`);
            console.log(`  - Topics: ${templateData.topics.length}`);
            console.log(`  - Languages: ${templateData.languages.length}`);
            console.log(`  - Templates: ${templateData.templates.length}`);
            console.log(`  - Cards: ${templateData.cards.length}`);

            return JSON.stringify(templateData, null, 2);
        } catch (error) {
            console.error('Error loading from new data structure:', error);
            return null;
        }
    }

    /**
     * 從管理器構建資料結構
     * Phase 2: 使用 TemplateRepository 載入模板
     */
    private async buildFromManagers(): Promise<{
        languages: Language[];
        topics: any[];
        templates: ExtendedTemplate[];
        cards: ExtendedCard[];
    }> {
        // 1. 使用 TopicManager 載入主題階層
        await this.topicManager.initialize();
        const allTopics = this.topicManager.getAllTopics();

        console.log(`[TextBricksEngine] TopicManager loaded ${allTopics.length} topics`);

        // 2. 使用 TemplateRepository 載入模板
        await this.templateRepository.initialize();
        const templates = this.templateRepository.getAll();
        console.log(`[TextBricksEngine] TemplateRepository loaded ${templates.length} templates`);

        // 3. 從 scope.json 載入語言列表
        const languages = await this.loadLanguagesFromScope();
        console.log(`[TextBricksEngine] Loaded ${languages.length} languages from scope.json`);

        // 4. Cards - Phase 2 將從 TopicManager 和 TemplateRepository 構建
        const cards = await this.loadCardsFromFileSystem();

        return {
            languages,
            topics: allTopics,
            templates,
            cards
        };
    }

    /**
     * 從 scope.json 載入語言列表
     */
    private async loadLanguagesFromScope(): Promise<Language[]> {
        try {
            const { readFile } = await import('fs/promises');
            const { join } = await import('path');

            const scopePath = await this.dataPathService.getScopePath('local');
            if (!scopePath) {
                console.warn('[TextBricksEngine] No scope path available, using empty languages array');
                return [];
            }

            const scopeJsonPath = join(scopePath, 'scope.json');

            const content = await readFile(scopeJsonPath, 'utf-8');
            const scopeData = JSON.parse(content);

            return scopeData.languages || [];
        } catch (error) {
            console.error('[TextBricksEngine] Error loading languages from scope.json:', error);
            return [];
        }
    }

    /**
     * 格式化語言顯示名稱
     */
    private formatLanguageDisplayName(languageId: string): string {
        const displayNames: Record<string, string> = {
            'c': 'C',
            'cpp': 'C++',
            'python': 'Python',
            'javascript': 'JavaScript',
            'java': 'Java',
            'arduino': 'Arduino',
            'esp32': 'ESP32'
        };
        return displayNames[languageId.toLowerCase()] ||
               languageId.charAt(0).toUpperCase() + languageId.slice(1);
    }

    /**
     * 根據語言 ID 推導副檔名
     */
    private inferLanguageExtension(languageId: string): string {
        const extensions: Record<string, string> = {
            'c': '.c',
            'cpp': '.cpp',
            'python': '.py',
            'javascript': '.js',
            'java': '.java',
            'arduino': '.ino',
            'esp32': '.ino'
        };
        return extensions[languageId.toLowerCase()] || '.txt';
    }


    /**
     * 從主題路徑找到根主題名稱（用於首頁分組）
     * @param topicPath 主題路徑，如 "c/basic" 或 "python"
     * @returns 根主題名稱，如 "c" 或 "python"
     */
    private findRootTopicName(topicPath: string): string {
        const parts = topicPath.split('/');
        return parts[0] || topicPath;
    }

    /**
     * 從檔案系統載入卡片
     * Phase 2: 使用路徑化系統構建卡片
     */
    private async loadCardsFromFileSystem(): Promise<ExtendedCard[]> {
        const { join } = await import('path');
        const { readdir, readFile, stat } = await import('fs/promises');
        const cards: ExtendedCard[] = [];

        if (!this.dataDirectory) {
            return cards;
        }

        try {
            // 獲取主題階層結構
            const hierarchy = this.topicManager.getHierarchy();
            const topicsMap = hierarchy.topicsMap;

            // 遍歷所有主題路徑
            for (const [topicPath, topic] of topicsMap.entries()) {
                // 構建檔案系統路徑
                const fsTopicPath = join(this.dataDirectory, ...topicPath.split('/'));
                const language = this.findRootTopicName(topicPath);

                // 1. 載入子主題作為 topic 卡片
                const subtopics = this.topicManager.getSubtopics(topicPath);
                for (const subtopic of subtopics) {
                    const subtopicPath = `${topicPath}/${subtopic.name}`;
                    cards.push({
                        type: 'topic',
                        name: subtopic.name,
                        title: subtopic.title,
                        description: subtopic.description || `進入 ${subtopic.title} 主題`,
                        language: language,
                        topicPath: topicPath,
                        originalTopicPath: topicPath,
                        target: subtopicPath
                    });
                }

                // 2. 載入連結卡片
                const linksPath = join(fsTopicPath, 'links');
                try {
                    await stat(linksPath);
                    const linkFiles = await readdir(linksPath);
                    console.log(`[TextBricksEngine] Loading links for topic "${topicPath}": found ${linkFiles.length} files in ${linksPath}`);

                    for (const file of linkFiles) {
                        if (file.endsWith('.json')) {
                            try {
                                const filePath = join(linksPath, file);
                                const content = await readFile(filePath, 'utf8');
                                const link = JSON.parse(content);

                                cards.push({
                                    type: 'link',
                                    name: link.name,
                                    title: link.title,
                                    description: link.description,
                                    language: language,
                                    topicPath: topicPath,
                                    originalTopicPath: topicPath,
                                    target: link.target
                                });
                                console.log(`[TextBricksEngine] Loaded link "${link.title}" (name: ${link.name}) for topic "${topicPath}"`);
                            } catch (error) {
                                console.warn(`Failed to load link ${file}:`, error);
                            }
                        }
                    }
                } catch {
                    // links 資料夾不存在，跳過
                    console.log(`[TextBricksEngine] No links directory for topic "${topicPath}"`);
                }

                // 3. 從 TemplateRepository 載入模板作為 template 卡片
                const topicTemplates = this.templateRepository.findByTopic(topicPath);
                console.log(`[TextBricksEngine] Loading templates for topic "${topicPath}": found ${topicTemplates.length} templates`);

                for (const template of topicTemplates) {
                    const templatePath = `${topicPath}/templates/${template.name}`;
                    cards.push({
                        type: 'template',
                        name: template.name,
                        title: template.title,
                        description: template.description,
                        language: template.language,
                        topicPath: topicPath,
                        originalTopicPath: topicPath,
                        code: template.code,
                        documentation: template.documentation
                    });
                }
            }
        } catch (error) {
            console.error('Error loading cards from filesystem:', error);
        }

        return cards;
    }


    private async loadFromLegacyTemplatesJson(): Promise<string | null> {
        try {
            const { join } = await import('path');
            const { readFile } = await import('fs/promises');

            const extensionPath = (this.platform as any).getExtensionPath?.() ||
                                (this.platform as any).getExtensionContext?.()?.extensionPath;

            if (!extensionPath) {
                return null;
            }

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

    getTemplateByPath(path: string): ExtendedTemplate | undefined {
        // 統一使用 topicPath/templates/name 格式 (例如: c/basic/templates/hello-world)
        return this.templates.find(t => {
            const templatePath = (t as any).topicPath ? `${(t as any).topicPath}/templates/${t.name}` : null;
            return templatePath === path || t.name === path;
        });
    }

    getTemplatesByTopic(topicPath: string): ExtendedTemplate[] {
        return this.templateRepository.findByTopic(topicPath);
    }

    getTemplatesByLanguage(languageName: string): ExtendedTemplate[] {
        return this.templates.filter(template => template.language === languageName);
    }

    getTemplatesByLanguageAndTopic(languageName: string, topicPath: string): ExtendedTemplate[] {
        return this.templateRepository.findByTopic(topicPath)
            .filter(template => template.language === languageName);
    }

    getAllTemplates(): ExtendedTemplate[] {
        return this.templateRepository.getAll();
    }

    // 卡片相關查詢方法
    getAllCards(): ExtendedCard[] {
        return [...this.cards];
    }

    getAllTopicConfigs(): TopicConfig[] {
        return this.topicManager.getAllTopics();
    }

    getRootTopics(): TopicConfig[] {
        return this.topicManager.getRootTopics();
    }

    getCardsByTopic(topicPath: string): ExtendedCard[] {
        return this.cards.filter(card => card.topicPath === topicPath);
    }

    getCardsByType(type: 'template' | 'topic' | 'link'): ExtendedCard[] {
        return this.cards.filter(card => card.type === type);
    }

    getTopics(): string[] {
        // 返回所有根主題路徑
        const rootTopics = this.topicManager.getRootTopics();
        return rootTopics.map(topic => topic.name);
    }

    getTopicPaths(): string[] {
        const hierarchy = this.topicManager.getHierarchy();
        const result = Array.from(hierarchy.topicsMap.keys());
        console.log('TextBricksEngine.getTopicPaths() returning', result.length, 'topic paths');
        return result;
    }

    getTopicConfigs(): TopicConfig[] {
        const hierarchy = this.topicManager.getHierarchy();
        return Array.from(hierarchy.topicsMap.values());
    }

    getTopicConfigByPath(topicPath: string): TopicConfig | undefined {
        const hierarchy = this.topicManager.getHierarchy();
        return hierarchy.topicsMap.get(topicPath);
    }

    getLanguages(): Language[] {
        return [...this.languages];
    }

    getLanguageByName(name: string): Language | undefined {
        return this.languages.find(language => language.name === name);
    }

    async createTemplate(templateData: Omit<ExtendedTemplate, 'type'>, topicPath: string): Promise<ExtendedTemplate> {
        const newTemplate = await this.templateRepository.create(templateData, topicPath);
        await this.loadTemplates();
        return newTemplate;
    }

    async updateTemplate(templatePath: string, updates: Partial<ExtendedTemplate>): Promise<ExtendedTemplate | null> {
        const updated = await this.templateRepository.update(templatePath, updates);
        if (updated) {
            await this.loadTemplates();
        }
        return updated;
    }

    async deleteTemplate(templatePath: string): Promise<boolean> {
        const success = await this.templateRepository.delete(templatePath);
        if (success) {
            await this.loadTemplates();
        }
        return success;
    }


    // context property for compatibility
    get context(): any {
        return null;
    }


    async createLanguage(language: Language): Promise<Language> {
        this.languages.push(language);
        const currentScope = this.scopeManager.getCurrentScope();
        if (!currentScope) {
            throw new Error('No current scope available');
        }
        await this.scopeManager.updateScope(currentScope.id, {
            languages: this.languages
        });
        return language;
    }

    async updateLanguage(languageName: string, updates: Partial<Language>): Promise<Language | null> {
        const index = this.languages.findIndex(l => l.name === languageName);
        if (index === -1) {
            return null;
        }

        const updatedLanguage = { ...this.languages[index], ...updates, name: languageName };
        this.languages[index] = updatedLanguage;

        const currentScope = this.scopeManager.getCurrentScope();
        if (!currentScope) {
            throw new Error('No current scope available');
        }
        await this.scopeManager.updateScope(currentScope.id, {
            languages: this.languages
        });

        return updatedLanguage;
    }

    async createTopic(createData: TopicCreateData): Promise<TopicConfig> {
        return await this.topicManager.createTopic(createData);
    }

    async updateTopic(topicPath: string, updates: TopicUpdateData): Promise<TopicConfig> {
        return await this.topicManager.updateTopic(topicPath, updates);
    }

    async deleteTopic(topicPath: string, deleteChildren: boolean = false): Promise<void> {
        await this.topicManager.deleteTopic(topicPath, deleteChildren);
    }

    async moveTopic(operation: TopicMoveOperation): Promise<void> {
        await this.topicManager.moveTopic(operation);
    }

    // === 格式化相關 ===

    formatTemplate(template: ExtendedTemplate, targetIndentation?: string): string {
        return this.formattingEngine.formatTemplate(template, targetIndentation);
    }

    formatCodeSnippet(code: string, template?: ExtendedTemplate, targetIndentation?: string): string {
        return this.formattingEngine.formatCodeSnippet(code, template, targetIndentation);
    }

    async insertTemplate(templatePath: string): Promise<void> {
        const template = this.getTemplateByPath(templatePath);
        if (!template) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        if (!this.platform.editor.isEditorActive()) {
            await this.platform.ui.showWarningMessage('沒有打開的編輯器');
            return;
        }

        const targetIndentation = await this.platform.editor.calculateTargetIndentation();
        const formattedCode = this.formatTemplate(template, targetIndentation);

        await this.platform.editor.insertText(formattedCode);
        await this.recordTemplateUsage(templatePath);

        await this.platform.ui.showInformationMessage(`模板 '${template.title}' 已插入`);
    }

    async copyTemplate(templatePath: string): Promise<void> {
        const template = this.getTemplateByPath(templatePath);
        if (!template) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const targetIndentation = this.platform.editor.isEditorActive() ?
            await this.platform.editor.calculateTargetIndentation() : '';
        const formattedCode = this.formatTemplate(template, targetIndentation);

        await this.platform.clipboard.writeText(formattedCode);
        await this.recordTemplateUsage(templatePath);

        await this.platform.ui.showInformationMessage(`模板 '${template.title}' 已複製`);
    }

    // === 匯入匯出 ===

    async exportTemplates(filters?: {
        languages?: string[];
        topicPaths?: string[];
        templatePaths?: string[];
    }): Promise<TemplateImportData> {
        let templates = this.getAllTemplates();

        if (filters) {
            if (filters.languages && filters.languages.length > 0) {
                templates = templates.filter(t => filters.languages!.includes(t.language));
            }
            if (filters.topicPaths && filters.topicPaths.length > 0) {
                templates = templates.filter(t => {
                    const templatePath = `${t.name}`;
                    return filters.topicPaths!.some(topicPath => templatePath.startsWith(topicPath + '/'));
                });
            }
            if (filters.templatePaths && filters.templatePaths.length > 0) {
                templates = templates.filter(t => filters.templatePaths!.includes(t.name));
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

    async importTemplates(importData: TemplateImportData, targetTopicPath: string, options?: {
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
                        const existing = this.getLanguageByName(language.name);
                        if (!existing) {
                            await this.createLanguage(language);
                        }
                    } catch (error) {
                        result.errors.push(`Failed to import language ${language.name}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }

            for (const template of importData.templates) {
                try {
                    const templatePath = `${targetTopicPath}/templates/${template.name}`;
                    const existing = this.getTemplateByPath(templatePath);

                    if (existing && !options?.overwriteExisting) {
                        result.skipped++;
                        continue;
                    }

                    if (existing && options?.overwriteExisting) {
                        await this.updateTemplate(templatePath, template);
                    } else {
                        await this.createTemplate(template, targetTopicPath);
                    }

                    result.imported++;
                } catch (error) {
                    result.errors.push(`Failed to import template ${template.name}: ${error instanceof Error ? error.message : String(error)}`);
                    result.skipped++;
                }
            }
        } catch (error) {
            result.errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        return result;
    }

    async recordTemplateUsage(templatePath: string): Promise<void> {
        await this.scopeManager.updateUsage(templatePath);

        const template = this.getTemplateByPath(templatePath);
        if (template && template.metadata) {
            template.metadata.usage = (template.metadata.usage || 0) + 1;
            template.metadata.lastUsedAt = new Date();
            this.updatePopularity(template);
            await this.updateTemplate(templatePath, template);
        }
    }

    /**
     * 獲取推薦模板
     * @param limit - 返回數量限制
     * @returns 推薦的模板列表
     */
    getRecommendedTemplates(limit: number = 6): ExtendedTemplate[] {
        return this.recommendationService.getRecommendedTemplates(this.templates, limit);
    }

    getTemplate(templatePath: string): ExtendedTemplate | null {
        return this.getTemplateByPath(templatePath) || null;
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


}