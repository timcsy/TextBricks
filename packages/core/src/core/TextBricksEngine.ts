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
    ExtendedCard
} from '@textbricks/shared';
import { FormattingEngine } from './FormattingEngine';
import { IPlatform } from '../interfaces/IPlatform';

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

    constructor(platform: IPlatform) {
        this.platform = platform;
        this.formattingEngine = new FormattingEngine();
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
        try {
            const CURRENT_DATA_VERSION = '0.2.5-with-new-topic-format';
            const jsonData = JSON.stringify(data, null, 2);

            // 保存到內存存儲
            await this.platform.storage.set('templates.json', jsonData);
            await this.platform.storage.set('templates.version', CURRENT_DATA_VERSION);

            console.log('[TextBricksEngine] Template data saved to storage');
        } catch (error) {
            throw new Error(`Failed to save template data: ${error}`);
        }
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
            const CURRENT_DATA_VERSION = '0.2.5-with-new-topic-format';

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
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

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

            // 直接使用提供的資料目錄作為 localScopePath
            const localScopePath = this.dataDirectory;
            try {
                await stat(localScopePath);
            } catch {
                return null; // local scope 不存在
            }

            // 收集所有主題
            const topics: Topic[] = [];
            const templates: ExtendedTemplate[] = [];
            const languages: Language[] = [];
            const cards: ExtendedCard[] = [];

            // 遞迴載入所有主題
            await this.loadTopicsRecursively(localScopePath, topics, templates, languages, cards);

            console.log(`[TextBricksEngine] Loaded data summary:`);
            console.log(`  - Topics: ${topics.length}`);
            console.log(`  - Templates: ${templates.length}`);
            console.log(`  - Languages: ${languages.length}`);
            console.log(`  - Cards: ${cards.length}`);

            // 建構返回的資料結構
            const templateData = {
                languages: languages,
                topics: topics,
                templates: templates,
                cards: cards
            };

            return JSON.stringify(templateData, null, 2);
        } catch (error) {
            console.error('Error loading from new data structure:', error);
            return null;
        }
    }

    private async loadTopicsRecursively(dirPath: string, topics: Topic[], templates: ExtendedTemplate[], languages: Language[], cards: ExtendedCard[]): Promise<void> {
        try {
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

            console.log('[TextBricksEngine] loadTopicsRecursively scanning directory:', dirPath);
            const items = await readdir(dirPath);

            for (const item of items) {
                const itemPath = join(dirPath, item);
                const itemStat = await stat(itemPath);

                if (itemStat.isDirectory()) {
                    // 檢查是否有 topic.json
                    const topicJsonPath = join(itemPath, 'topic.json');
                    try {
                        console.log('[TextBricksEngine] Reading topic file:', topicJsonPath);
                        const topicContent = await readFile(topicJsonPath, 'utf8');
                        const topic: Topic = JSON.parse(topicContent);
                        console.log('[TextBricksEngine] Loaded topic:', {
                            name: topic.name,
                            description: topic.description,
                            documentationLength: topic.documentation?.length,
                            documentationPreview: topic.documentation?.substring(0, 100)
                        });
                        topics.push(topic);

                        // 檢查是否應該添加為語言 (基於路徑推測)
                        const pathSegments = itemPath.split(/[/\\]/);
                        const isLanguageLevel = pathSegments[pathSegments.length - 2] === 'local'; // 直接在 local 下的為語言

                        if (isLanguageLevel && !languages.find(lang => lang.id === topic.name)) {
                            // 添加為語言
                            languages.push({
                                id: topic.name,
                                name: topic.name,
                                displayName: topic.displayName || topic.name,
                                extension: this.getLanguageExtension(topic.name),
                                icon: "file-text"
                            });
                        }

                        // 載入該主題下的模板檔案和卡片
                        await this.loadTemplatesFromTopic(itemPath, topic, templates);
                        await this.loadCardsFromTopic(itemPath, topic, cards);

                    } catch {
                        // 沒有 topic.json，繼續遞迴搜索
                    }

                    // 遞迴處理子目錄
                    await this.loadTopicsRecursively(itemPath, topics, templates, languages, cards);
                }
            }
        } catch (error) {
            console.error('Error in loadTopicsRecursively:', error);
        }
    }

    private async loadTemplatesFromTopic(topicPath: string, topic: Topic, templates: ExtendedTemplate[]): Promise<void> {
        try {
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

            // 獲取模板資料夾名稱，預設為 "templates"
            const templatesFolderName = topic.templates || 'templates';
            const templatesPath = join(topicPath, templatesFolderName);

            // 檢查模板資料夾是否存在
            try {
                await stat(templatesPath);
            } catch {
                // 模板資料夾不存在，跳過
                return;
            }

            // 從路徑推斷語言和主題路徑
            const pathSegments = topicPath.split(/[/\\]/);
            const localIndex = pathSegments.findIndex(segment => segment === 'local');
            const language = localIndex >= 0 && localIndex + 1 < pathSegments.length ? pathSegments[localIndex + 1] : '';

            // 建構完整的主題路徑 (從 local 之後的所有路徑段)
            const topicPathSegments = localIndex >= 0 ? pathSegments.slice(localIndex + 1) : [];
            const fullTopicPath = topicPathSegments.join('/');

            // 讀取模板資料夾中的所有檔案
            const templateFiles = await readdir(templatesPath);

            for (const templateFile of templateFiles) {
                if (templateFile.endsWith('.json')) {
                    try {
                        const templateFilePath = join(templatesPath, templateFile);
                        const templateContent = await readFile(templateFilePath, 'utf8');
                        const template = JSON.parse(templateContent);

                        // 確保模板有必需的屬性，從路徑推斷語言和主題
                        const extendedTemplate: ExtendedTemplate = {
                            id: template.id,
                            title: template.title,
                            description: template.description,
                            language: language,
                            topic: fullTopicPath,
                            code: template.code,
                            documentation: template.documentation
                        };

                        templates.push(extendedTemplate);
                    } catch (error) {
                        console.error(`Error loading template ${templateFile}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in loadTemplatesFromTopic:', error);
        }
    }

    private getLanguageExtension(languageName: string): string {
        const extensions: { [key: string]: string } = {
            'c': '.c',
            'cpp': '.cpp',
            'python': '.py',
            'javascript': '.js',
            'java': '.java',
            'arduino': '.ino',
            'esp32': '.ino'
        };
        return extensions[languageName.toLowerCase()] || '.txt';
    }

    private async loadCardsFromTopic(topicPath: string, topic: Topic, cards: ExtendedCard[]): Promise<void> {
        try {
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

            // 從路徑推斷語言和主題路徑
            const pathSegments = topicPath.split(/[/\\]/);
            const localIndex = pathSegments.findIndex(segment => segment === 'local');
            const language = localIndex >= 0 && localIndex + 1 < pathSegments.length ? pathSegments[localIndex + 1] : '';
            const topicPathSegments = localIndex >= 0 ? pathSegments.slice(localIndex + 1) : [];
            const fullTopicPath = topicPathSegments.join('/');

            // 1. 載入子主題卡片（從子資料夾推斷）
            const items = await readdir(topicPath);
            for (const item of items) {
                const itemPath = join(topicPath, item);
                const itemStat = await stat(itemPath);

                if (itemStat.isDirectory() && !['templates', 'links'].includes(item)) {
                    // 檢查是否有 topic.json，如果有就是子主題
                    const subTopicJsonPath = join(itemPath, 'topic.json');
                    try {
                        await stat(subTopicJsonPath);

                        // 讀取 topic.json 以獲取正確的 displayName 和描述
                        const topicJsonContent = await readFile(subTopicJsonPath, 'utf8');
                        const topicData = JSON.parse(topicJsonContent);

                        // 這是一個子主題，建立 topic 卡片
                        const subTopicCard: ExtendedCard = {
                            type: 'topic',
                            id: `${fullTopicPath}/${item}`,
                            title: topicData.displayName || topicData.name || item,
                            description: topicData.description || `進入 ${topicData.displayName || item} 主題`,
                            language: language,
                            topic: fullTopicPath,
                            target: `${fullTopicPath}/${item}` // 用於導航
                        };
                        cards.push(subTopicCard);
                    } catch (error) {
                        console.error(`Error loading subtopic ${item}:`, error);
                        // 不是子主題或讀取失敗，跳過
                    }
                }
            }

            // 2. 載入連結卡片
            const linksFolderName = topic.links || 'links';
            const linksPath = join(topicPath, linksFolderName);

            try {
                await stat(linksPath);
                const linkFiles = await readdir(linksPath);

                for (const linkFile of linkFiles) {
                    if (linkFile.endsWith('.json')) {
                        try {
                            const linkFilePath = join(linksPath, linkFile);
                            const linkContent = await readFile(linkFilePath, 'utf8');
                            const linkData = JSON.parse(linkContent);

                            const linkCard: ExtendedCard = {
                                type: 'link',
                                id: linkData.id,
                                title: linkData.title,
                                description: linkData.description,
                                language: language,
                                topic: fullTopicPath,
                                target: linkData.target
                            };
                            cards.push(linkCard);
                        } catch (error) {
                            console.error(`Error loading link ${linkFile}:`, error);
                        }
                    }
                }
            } catch {
                // links 資料夾不存在，跳過
            }

            // 3. 載入模板卡片
            const templatesFolderName = topic.templates || 'templates';
            const templatesPath = join(topicPath, templatesFolderName);

            try {
                await stat(templatesPath);
                const templateFiles = await readdir(templatesPath);

                for (const templateFile of templateFiles) {
                    if (templateFile.endsWith('.json')) {
                        try {
                            const templateFilePath = join(templatesPath, templateFile);
                            const templateContent = await readFile(templateFilePath, 'utf8');
                            const template = JSON.parse(templateContent);

                            const templateCard: ExtendedCard = {
                                type: 'template',
                                id: template.id,
                                title: template.title,
                                description: template.description,
                                language: language,
                                topic: fullTopicPath,
                                code: template.code,
                                documentation: template.documentation
                            };
                            cards.push(templateCard);
                        } catch (error) {
                            console.error(`Error loading template card ${templateFile}:`, error);
                        }
                    }
                }
            } catch {
                // templates 資料夾不存在，跳過
            }

        } catch (error) {
            console.error('Error in loadCardsFromTopic:', error);
        }
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
                        description: `${topicName} 相關模板`,
                        display: {
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

        // 更新文件系統中的模板文件
        await this.updateTemplateFile(updatedTemplate);

        const data = await this.loadTemplateData();
        const templateIndex = data.templates.findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
            data.templates[templateIndex] = updatedTemplate;
        }

        // 同時更新對應的卡片數據
        if (data.cards) {
            console.log(`[TextBricksEngine] Looking for card with ID: ${templateId}, total cards: ${data.cards.length}`);

            // 列出所有卡片的ID和類型用於調試
            data.cards.forEach((card, index) => {
                if (card.type === 'template') {
                    console.log(`[TextBricksEngine] Card ${index}: ID=${card.id}, type=${card.type}, title=${card.title}`);
                }
            });

            const cardIndex = data.cards.findIndex(c => c.id === templateId && c.type === 'template');
            if (cardIndex !== -1) {
                console.log(`[TextBricksEngine] Found card at index ${cardIndex}, updating description from "${data.cards[cardIndex].description}" to "${updatedTemplate.description}"`);

                data.cards[cardIndex] = {
                    ...data.cards[cardIndex],
                    title: updatedTemplate.title,
                    description: updatedTemplate.description,
                    code: updatedTemplate.code,
                    documentation: updatedTemplate.documentation
                };
                console.log(`[TextBricksEngine] Updated card data for template ${templateId}`);
            } else {
                console.warn(`[TextBricksEngine] Could not find card for template ID: ${templateId}`);
            }
        } else {
            console.warn(`[TextBricksEngine] No cards data available`);
        }

        // 先清除緩存，確保下次載入時從文件系統重新讀取
        await this.invalidateCache();

        // 重新從文件系統載入最新數據
        await this.loadTemplates();

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