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
    TopicConfig
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

        // 3. 從模板中提取語言列表（語言資訊儲存在模板中）
        const languageMap = new Map<string, Language>();

        for (const template of templates) {
            if (template.language && !languageMap.has(template.language)) {
                languageMap.set(template.language, {
                    id: template.language,
                    name: template.language,
                    displayName: this.formatLanguageDisplayName(template.language),
                    extension: this.inferLanguageExtension(template.language),
                    icon: "file-text"
                });
            }
        }

        const languages = Array.from(languageMap.values());
        console.log(`[TextBricksEngine] Extracted ${languages.length} languages from ${templates.length} templates`);

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
     * 找到主題的根主題 ID（用於首頁分組）
     */
    private findRootTopicId(topic: TopicConfig, allTopics: TopicConfig[]): string {
        // 如果沒有父主題，自己就是根主題
        if (!topic.parentId) {
            return topic.id;
        }

        // 遞迴找到根主題
        let currentTopic = topic;
        while (currentTopic.parentId) {
            const parentTopic = allTopics.find(t => t.id === currentTopic.parentId);
            if (!parentTopic) {
                // 找不到父主題，返回當前主題 ID
                return currentTopic.id;
            }
            currentTopic = parentTopic;
        }

        return currentTopic.id;
    }

    /**
     * 從檔案系統載入卡片
     * Phase 2: 使用 TemplateRepository 構建模板卡片
     */
    private async loadCardsFromFileSystem(): Promise<ExtendedCard[]> {
        const { join } = await import('path');
        const { readdir, readFile, stat } = await import('fs/promises');
        const cards: ExtendedCard[] = [];

        if (!this.dataDirectory) {
            return cards;
        }

        try {
            const allTopics = this.topicManager.getAllTopics();

            for (const topic of allTopics) {
                // 使用 topic.path 構建文件系統路徑，而不是 topic.id
                const topicPath = topic.path && topic.path.length > 0
                    ? join(this.dataDirectory, ...topic.path)
                    : join(this.dataDirectory, topic.id);
                const pathParts = topic.path || topic.id.split('/');
                const language = pathParts[0] || '';

                // 找到根主題 ID（用於首頁分組顯示）
                const rootTopicId = this.findRootTopicId(topic, allTopics);

                // 1. 載入子主題作為 topic 卡片
                const subtopics = this.topicManager.getSubtopics(topic.id);
                for (const subtopic of subtopics) {
                    cards.push({
                        type: 'topic',
                        id: subtopic.id,
                        title: subtopic.displayName || subtopic.name,
                        description: subtopic.description || `進入 ${subtopic.displayName || subtopic.name} 主題`,
                        language: language,
                        topic: topic.id,  // 使用原始主題 ID
                        target: subtopic.id
                    });
                }

                // 2. 載入連結卡片
                const linksPath = join(topicPath, 'links');
                try {
                    await stat(linksPath);
                    const linkFiles = await readdir(linksPath);
                    console.log(`[TextBricksEngine] Loading links for topic "${topic.id}": found ${linkFiles.length} files in ${linksPath}`);

                    for (const file of linkFiles) {
                        if (file.endsWith('.json')) {
                            try {
                                const filePath = join(linksPath, file);
                                const content = await readFile(filePath, 'utf8');
                                const link = JSON.parse(content);

                                cards.push({
                                    type: 'link',
                                    id: link.id,
                                    title: link.title,
                                    description: link.description,
                                    language: language,
                                    topic: topic.id,  // 使用原始主題 ID
                                    target: link.target
                                });
                                console.log(`[TextBricksEngine] Loaded link "${link.title}" (id: ${link.id}) for topic "${topic.id}"`);
                            } catch (error) {
                                console.warn(`Failed to load link ${file}:`, error);
                            }
                        }
                    }
                } catch {
                    // links 資料夾不存在，跳過
                    console.log(`[TextBricksEngine] No links directory for topic "${topic.id}"`);
                }

                // 3. 從 TemplateRepository 載入模板作為 template 卡片
                const topicTemplates = this.templateRepository.findByTopic(topic.id);
                console.log(`[TextBricksEngine] Loading templates for topic "${topic.id}": found ${topicTemplates.length} templates`);

                for (const template of topicTemplates) {
                    cards.push({
                        type: 'template',
                        id: template.id,
                        title: template.title,
                        description: template.description,
                        language: template.language,
                        topic: topic.id,  // 使用原始主題 ID
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

    getCardsByTopic(topic: string): ExtendedCard[] {
        return this.cards.filter(card => card.topic === topic);
    }

    getCardsByType(type: 'template' | 'topic' | 'link'): ExtendedCard[] {
        return this.cards.filter(card => card.type === type);
    }

    getTopics(): string[] {
        // 如果有模板，優先顯示有模板的主題
        const templateTopics = new Set(this.templates.map(template => template.topic));

        // 按照 topics 陣列中定義的順序返回主題
        const topicOrder = this.topics.map(topic => topic.name);

        if (templateTopics.size > 0) {
            // 有模板時，只返回有模板的主題
            const orderedTopics = topicOrder.filter(topicName => templateTopics.has(topicName));
            const remainingTopics = Array.from(templateTopics).filter(topicName => !topicOrder.includes(topicName));
            const result = [...orderedTopics, ...remainingTopics.sort()];

            console.log('TextBricksEngine.getTopics() called (with templates)');
            console.log('Topic order from topics array:', topicOrder);
            console.log('Template topics found:', Array.from(templateTopics));
            console.log('Final ordered topics:', result);

            return result;
        } else {
            // 沒有模板時，返回所有載入的主題
            const result = topicOrder.sort();

            console.log('TextBricksEngine.getTopics() called (no templates, showing all topics)');
            console.log('All topics from topics array:', topicOrder);
            console.log('Final ordered topics:', result);

            return result;
        }
    }

    // 新方法：回傳完整的 Topic 物件
    getTopicObjects(): Topic[] {
        const templateTopics = new Set(this.templates.map(template => template.topic));

        if (templateTopics.size > 0) {
            // 有模板時，回傳有模板的主題物件
            const result: Topic[] = [];

            // 先加入已定義的主題物件（如果有對應模板）
            this.topics.forEach(topic => {
                if (templateTopics.has(topic.name)) {
                    result.push(topic);
                }
            });

            // 為沒有 Topic 物件但有模板的主題建立預設的 Topic
            templateTopics.forEach(topicName => {
                if (!result.some(topic => topic.name === topicName)) {
                    result.push({
                        id: topicName.toLowerCase().replace(/\s+/g, '-'),
                        name: topicName,
                        displayName: topicName,
                        description: `${topicName} 相關模板`,
                        templates: topicName.toLowerCase().replace(/\s+/g, '-'),
                        links: `${topicName.toLowerCase().replace(/\s+/g, '-')}-links`,
                        display: {
                            icon: 'folder',
                            color: '#666666',
                            order: 999,
                            collapsed: false,
                            showInNavigation: true
                        }
                    });
                }
            });

            console.log('TextBricksEngine.getTopicObjects() called (with templates)');
            console.log('Topics with objects:', result.length, 'topics');

            return result;
        } else {
            // 沒有模板時，返回所有載入的主題
            console.log('TextBricksEngine.getTopicObjects() called (no templates, showing all topics)');
            console.log('Topics with objects:', this.topics.length, 'topics');

            return [...this.topics];
        }
    }

    // 根據名稱取得 Topic 物件
    getTopicByName(name: string): Topic | undefined {
        return this.topics.find(topic => topic.name === name);
    }

    getLanguages(): Language[] {
        return [...this.languages];
    }

    getLanguageById(id: string): Language | undefined {
        return this.languages.find(language => language.id === id);
    }

    // === 模板 CRUD 操作 ===
    // Phase 2: 委託給 TemplateRepository

    async createTemplate(template: Omit<ExtendedTemplate, 'id'>): Promise<ExtendedTemplate> {
        const newTemplate = await this.templateRepository.create(template);
        await this.loadTemplates(); // 重新載入快取
        return newTemplate;
    }

    async updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>): Promise<ExtendedTemplate | null> {
        const updated = await this.templateRepository.update(templateId, updates);
        if (updated) {
            await this.loadTemplates(); // 重新載入快取
        }
        return updated;
    }

    async deleteTemplate(templateId: string): Promise<boolean> {
        const success = await this.templateRepository.delete(templateId);
        if (success) {
            await this.loadTemplates(); // 重新載入快取
        }
        return success;
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

    async createTopic(topic: Omit<Topic, 'id'>): Promise<Topic> {
        const newTopic: Topic = {
            ...topic,
            id: this.generateTopicId()
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
            id: topicId
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

    async ensureTopicExists(topicName: string): Promise<Topic> {
        // 檢查是否已存在具有該名稱的主題
        let topic = this.getTopicByName(topicName);
        if (topic) {
            return topic;
        }

        // 如果不存在，創建新主題
        topic = await this.createTopic({
            name: topicName,
            displayName: topicName,
            description: `自動生成的主題：${topicName}`,
            templates: topicName.toLowerCase().replace(/\s+/g, '-'),
            links: `${topicName.toLowerCase().replace(/\s+/g, '-')}-links`,
            display: {
                icon: 'folder',
                color: '#666666',
                order: 999,
                collapsed: false,
                showInNavigation: true
            }
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

    /**
     * 獲取推薦模板
     * @param limit - 返回數量限制
     * @returns 推薦的模板列表
     */
    getRecommendedTemplates(limit: number = 6): ExtendedTemplate[] {
        return this.recommendationService.getRecommendedTemplates(this.templates, limit);
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

    /**
     * 更新文件系統中的模板文件
     */
    private async updateTemplateFile(template: ExtendedTemplate): Promise<void> {
        try {
            if (!this.dataDirectory) {
                console.warn('[TextBricksEngine] No data directory configured, skipping file update');
                return;
            }

            const { join } = await import('path');
            const { writeFile } = await import('fs/promises');

            // 構建模板文件路徑
            // 格式: dataDirectory/topic/templates/templateId.json
            const topicPath = join(this.dataDirectory, template.topic);

            // 查找模板文件 - 需要遞迴搜索可能的位置
            const templateFilePath = await this.findTemplateFilePath(template);

            if (!templateFilePath) {
                console.warn(`[TextBricksEngine] Could not find template file for ${template.id}`);
                return;
            }

            // 創建要保存的模板數據（不包含推斷的 language 和 topic）
            const templateData = {
                id: template.id,
                title: template.title,
                description: template.description,
                code: template.code,
                documentation: template.documentation
            };

            // 保存到文件
            await writeFile(templateFilePath, JSON.stringify(templateData, null, 2), 'utf8');
            console.log(`[TextBricksEngine] Updated template file: ${templateFilePath}`);

        } catch (error) {
            console.error('[TextBricksEngine] Error updating template file:', error);
            throw error;
        }
    }

    /**
     * 查找模板的文件路徑
     */
    private async findTemplateFilePath(template: ExtendedTemplate): Promise<string | null> {
        try {
            const { join } = await import('path');
            const { readdir, stat } = await import('fs/promises');

            if (!this.dataDirectory) {
                return null;
            }

            // 根據 topic 構建可能的路徑
            const topicPath = join(this.dataDirectory, template.topic);

            // 遞迴搜索模板文件
            return await this.searchTemplateFile(topicPath, template.id);

        } catch (error) {
            console.error('[TextBricksEngine] Error finding template file path:', error);
            return null;
        }
    }

    /**
     * 遞迴搜索模板文件
     */
    private async searchTemplateFile(dirPath: string, templateId: string): Promise<string | null> {
        try {
            const { join } = await import('path');
            const { readdir, stat } = await import('fs/promises');

            const items = await readdir(dirPath);

            for (const item of items) {
                const itemPath = join(dirPath, item);
                const itemStat = await stat(itemPath);

                if (itemStat.isDirectory()) {
                    if (item === 'templates') {
                        // 在 templates 目錄中查找模板文件
                        const templateFiles = await readdir(itemPath);
                        for (const file of templateFiles) {
                            if (file.endsWith('.json')) {
                                const filePath = join(itemPath, file);
                                // 讀取文件檢查 ID
                                try {
                                    const { readFile } = await import('fs/promises');
                                    const content = await readFile(filePath, 'utf8');
                                    const data = JSON.parse(content);
                                    if (data.id === templateId) {
                                        return filePath;
                                    }
                                } catch {
                                    // 忽略無法讀取的文件
                                }
                            }
                        }
                    } else {
                        // 遞迴搜索子目錄
                        const result = await this.searchTemplateFile(itemPath, templateId);
                        if (result) {
                            return result;
                        }
                    }
                }
            }

            return null;
        } catch {
            return null;
        }
    }

}