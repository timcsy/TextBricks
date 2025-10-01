/**
 * Topic 管理器 - 處理階層主題系統的核心邏輯
 * 提供主題的 CRUD、階層管理、排序等功能
 */

import { IPlatform } from '../interfaces/IPlatform';
import { DataPathService } from '../services/DataPathService';
import {
    TopicConfig,
    TopicHierarchy,
    TopicNode,
    TopicCreateData,
    TopicUpdateData,
    TopicMoveOperation,
    TopicStatistics,
    TopicEvent
} from '@textbricks/shared';

export class TopicManager {
    private platform: IPlatform;
    private scopeId: string;
    private dataPathService: DataPathService;
    private hierarchy: TopicHierarchy | null = null;
    private eventListeners: Array<(event: TopicEvent) => void> = [];

    constructor(platform: IPlatform, dataPathService?: DataPathService, scopeId: string = 'local') {
        this.platform = platform;
        this.scopeId = scopeId;
        this.dataPathService = dataPathService || DataPathService.getInstance(platform);
    }

    // ==================== 初始化和載入 ====================

    async initialize(): Promise<void> {
        try {
            await this.loadTopicHierarchy();
        } catch (error) {
            this.platform.logError(error as Error, 'TopicManager.initialize');
            throw error;
        }
    }

    async loadTopicHierarchy(): Promise<void> {
        try {
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

            // 使用 DataPathService 獲取正確的 scope 路徑
            const scopePath = await this.dataPathService.getScopePath(this.scopeId);
            console.log('[TopicManager] Using scope path:', scopePath);

            // 檢查 scope 是否存在
            try {
                await stat(scopePath);
            } catch {
                // 創建空的階層結構
                this.hierarchy = {
                    roots: [],
                    topicsMap: new Map(),
                    maxDepth: 0
                };
                return;
            }

            const topicsMap = new Map<string, TopicConfig>();

            // 遞迴載入所有主題
            await this.loadTopicsRecursively(scopePath, '', topicsMap);

            // 建構階層結構
            this.hierarchy = this.buildHierarchy(topicsMap);

        } catch (error) {
            throw new Error(`Failed to load topic hierarchy: ${error}`);
        }
    }

    private async loadTopicsRecursively(
        basePath: string,
        relativePath: string,
        topicsMap: Map<string, TopicConfig>
    ): Promise<void> {
        const { join } = await import('path');
        const { readdir, readFile, stat } = await import('fs/promises');

        const currentPath = join(basePath, relativePath);

        try {
            const entries = await readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const entryPath = join(currentPath, entry.name);
                    const topicConfigPath = join(entryPath, 'topic.json');

                    try {
                        // 檢查是否有 topic.json 文件
                        await stat(topicConfigPath);
                        const topicData = await readFile(topicConfigPath, 'utf-8');
                        const topicConfig: TopicConfig = JSON.parse(topicData);

                        // 設定完整路徑和父主題關係
                        const fullPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                        topicConfig.path = fullPath.split('/');

                        if (relativePath) {
                            // 找到父主題 ID
                            const parentTopic = Array.from(topicsMap.values())
                                .find(t => t.path?.join('/') === relativePath);
                            if (parentTopic) {
                                topicConfig.parentId = parentTopic.id;
                            }
                        }

                        // 載入該主題的連結
                        await this.loadTopicLinks(entryPath, topicConfig);

                        topicsMap.set(topicConfig.id, topicConfig);

                        // 遞迴處理子目錄
                        await this.loadTopicsRecursively(basePath, fullPath, topicsMap);

                    } catch (error) {
                        // 如果沒有 topic.json，繼續遞迴處理子目錄
                        await this.loadTopicsRecursively(basePath, join(relativePath, entry.name), topicsMap);
                    }
                }
            }
        } catch (error) {
            // 目錄不存在或無法讀取，忽略
        }
    }

    private async loadTopicLinks(topicPath: string, topicConfig: TopicConfig): Promise<void> {
        const { join } = await import('path');
        const { readdir, readFile } = await import('fs/promises');

        try {
            const linksPath = join(topicPath, topicConfig.links || 'links');
            const linkFiles = await readdir(linksPath);

            const links: any[] = [];

            for (const linkFile of linkFiles) {
                if (linkFile.endsWith('.json')) {
                    try {
                        const linkFilePath = join(linksPath, linkFile);
                        const linkData = await readFile(linkFilePath, 'utf-8');
                        const link = JSON.parse(linkData);
                        links.push(link);
                    } catch (error) {
                        console.warn(`Failed to load link file ${linkFile}:`, error);
                    }
                }
            }

            // 將連結添加到主題配置中
            (topicConfig as any).loadedLinks = links;
            console.log(`[TopicManager] Loaded ${links.length} links for topic ${topicConfig.id}:`, links.map(l => l.title));

        } catch (error) {
            // 連結目錄不存在或無法讀取，忽略
            (topicConfig as any).loadedLinks = [];
            console.log(`[TopicManager] No links directory for topic ${topicConfig.id}`);
        }
    }

    private buildHierarchy(topicsMap: Map<string, TopicConfig>): TopicHierarchy {
        const nodeMap = new Map<string, TopicNode>();
        const roots: TopicNode[] = [];
        let maxDepth = 0;

        // 創建所有節點
        for (const topic of topicsMap.values()) {
            const node: TopicNode = {
                topic,
                children: [],
                depth: 0,
                isLeaf: true,
                totalTemplates: 0,
                directTemplates: 0
            };
            nodeMap.set(topic.id, node);
        }

        // 建立父子關係
        for (const topic of topicsMap.values()) {
            const node = nodeMap.get(topic.id)!;

            if (topic.parentId) {
                const parentNode = nodeMap.get(topic.parentId);
                if (parentNode) {
                    parentNode.children.push(node);
                    node.parent = parentNode;
                    parentNode.isLeaf = false;
                } else {
                    // 父主題不存在，放到根層級
                    roots.push(node);
                }
            } else {
                // 根主題
                roots.push(node);
            }
        }

        // 計算深度並排序
        const calculateDepth = (node: TopicNode, depth: number = 0): void => {
            node.depth = depth;
            maxDepth = Math.max(maxDepth, depth);

            // 按照 display.order 排序子節點
            node.children.sort((a, b) =>
                (a.topic.display.order || 0) - (b.topic.display.order || 0)
            );

            for (const child of node.children) {
                calculateDepth(child, depth + 1);
            }
        };

        // 排序根節點
        roots.sort((a, b) =>
            (a.topic.display.order || 0) - (b.topic.display.order || 0)
        );

        for (const root of roots) {
            calculateDepth(root);
        }

        return {
            roots,
            topicsMap,
            maxDepth
        };
    }

    // ==================== 主題管理 ====================

    getHierarchy(): TopicHierarchy | null {
        return this.hierarchy;
    }

    getTopic(topicId: string): TopicConfig | undefined {
        return this.hierarchy?.topicsMap.get(topicId);
    }

    getTopicNode(topicId: string): TopicNode | undefined {
        if (!this.hierarchy) return undefined;

        const findNode = (nodes: TopicNode[]): TopicNode | undefined => {
            for (const node of nodes) {
                if (node.topic.id === topicId) {
                    return node;
                }
                const found = findNode(node.children);
                if (found) return found;
            }
            return undefined;
        };

        return findNode(this.hierarchy.roots);
    }

    getTopicPath(topicId: string): TopicConfig[] {
        const node = this.getTopicNode(topicId);
        if (!node) return [];

        const path: TopicConfig[] = [];
        let current: TopicNode | undefined = node;

        while (current) {
            path.unshift(current.topic);
            current = current.parent;
        }

        return path;
    }

    getSubtopics(topicId: string): TopicConfig[] {
        const node = this.getTopicNode(topicId);
        return node ? node.children.map(child => child.topic) : [];
    }

    getRootTopics(): TopicConfig[] {
        return this.hierarchy?.roots.map(node => node.topic) || [];
    }

    getAllTopics(): TopicConfig[] {
        return this.hierarchy ? Array.from(this.hierarchy.topicsMap.values()) : [];
    }

    async createTopic(createData: TopicCreateData): Promise<TopicConfig> {
        try {
            // 驗證數據
            if (this.hierarchy?.topicsMap.has(createData.id)) {
                throw new Error(`Topic with ID '${createData.id}' already exists`);
            }

            // 建立完整的主題配置
            const topicConfig: TopicConfig = {
                id: createData.id,
                name: createData.name,
                displayName: createData.displayName,
                description: createData.description,
                documentation: createData.documentation,
                templates: 'templates',
                links: 'links',
                subtopics: [],
                parentId: createData.parentId,
                display: {
                    icon: createData.display.icon || '📁',
                    color: createData.display.color || '#007ACC',
                    order: createData.display.order || 0,
                    collapsed: createData.display.collapsed || false,
                    showInNavigation: createData.display.showInNavigation !== false
                }
            };

            // 計算路徑
            if (createData.parentId) {
                const parentTopic = this.getTopic(createData.parentId);
                if (!parentTopic) {
                    throw new Error(`Parent topic '${createData.parentId}' not found`);
                }
                topicConfig.path = [...(parentTopic.path || []), createData.name];
            } else {
                topicConfig.path = [createData.name];
            }

            // 創建文件系統結構
            await this.createTopicFileStructure(topicConfig, createData);

            // 更新階層結構
            if (this.hierarchy) {
                this.hierarchy.topicsMap.set(topicConfig.id, topicConfig);
                this.hierarchy = this.buildHierarchy(this.hierarchy.topicsMap);
            }

            // 觸發事件
            this.emitEvent({ type: 'topic-created', topic: topicConfig });

            return topicConfig;

        } catch (error) {
            throw new Error(`Failed to create topic: ${error}`);
        }
    }

    async updateTopic(topicId: string, updateData: TopicUpdateData): Promise<TopicConfig> {
        try {
            const existingTopic = this.getTopic(topicId);
            if (!existingTopic) {
                throw new Error(`Topic '${topicId}' not found`);
            }

            // 更新主題配置
            const updatedTopic: TopicConfig = {
                ...existingTopic,
                name: updateData.name || existingTopic.name,
                displayName: updateData.displayName || existingTopic.displayName,
                description: updateData.description || existingTopic.description,
                documentation: updateData.documentation || existingTopic.documentation,
                templates: updateData.templatesFolder || existingTopic.templates,
                links: updateData.linksFolder || existingTopic.links,
                display: {
                    ...existingTopic.display,
                    ...updateData.display
                }
            };

            // 保存到文件系統
            await this.saveTopicConfig(updatedTopic);

            // 更新階層結構
            if (this.hierarchy) {
                this.hierarchy.topicsMap.set(topicId, updatedTopic);
                this.hierarchy = this.buildHierarchy(this.hierarchy.topicsMap);
            }

            // 觸發事件
            this.emitEvent({ type: 'topic-updated', topic: updatedTopic });

            return updatedTopic;

        } catch (error) {
            throw new Error(`Failed to update topic: ${error}`);
        }
    }

    async deleteTopic(topicId: string, deleteChildren: boolean = false): Promise<void> {
        try {
            const topic = this.getTopic(topicId);
            if (!topic) {
                throw new Error(`Topic '${topicId}' not found`);
            }

            const node = this.getTopicNode(topicId);
            if (node && node.children.length > 0 && !deleteChildren) {
                throw new Error(`Cannot delete topic '${topicId}' because it has subtopics. Use deleteChildren=true to force deletion.`);
            }

            // 遞迴刪除子主題
            if (node && deleteChildren) {
                for (const child of node.children) {
                    await this.deleteTopic(child.topic.id, true);
                }
            }

            // 從文件系統刪除
            await this.deleteTopicFromFileSystem(topic);

            // 從階層結構中移除
            if (this.hierarchy) {
                this.hierarchy.topicsMap.delete(topicId);
                this.hierarchy = this.buildHierarchy(this.hierarchy.topicsMap);
            }

            // 觸發事件
            this.emitEvent({ type: 'topic-deleted', topicId });

        } catch (error) {
            throw new Error(`Failed to delete topic: ${error}`);
        }
    }

    async moveTopic(operation: TopicMoveOperation): Promise<void> {
        try {
            const topic = this.getTopic(operation.topicId);
            if (!topic) {
                throw new Error(`Topic '${operation.topicId}' not found`);
            }

            const oldParentId = topic.parentId || null;

            // 驗證移動操作
            if (operation.newParentId === operation.topicId) {
                throw new Error('Cannot move topic to itself');
            }

            // 檢查是否會造成循環引用
            if (operation.newParentId && this.wouldCreateCycle(operation.topicId, operation.newParentId)) {
                throw new Error('Move operation would create a cycle');
            }

            // 更新主題的父子關係
            const updatedTopic: TopicConfig = {
                ...topic,
                parentId: operation.newParentId || undefined
            };

            // 重新計算路徑
            if (operation.newParentId) {
                const newParent = this.getTopic(operation.newParentId);
                if (!newParent) {
                    throw new Error(`New parent topic '${operation.newParentId}' not found`);
                }
                updatedTopic.path = [...(newParent.path || []), topic.name];
            } else {
                updatedTopic.path = [topic.name];
            }

            // 更新排序
            if (operation.newOrder !== undefined) {
                updatedTopic.display.order = operation.newOrder;
            }

            // 移動文件系統結構
            await this.moveTopicFileStructure(topic, updatedTopic);

            // 更新階層結構
            if (this.hierarchy) {
                this.hierarchy.topicsMap.set(operation.topicId, updatedTopic);
                this.hierarchy = this.buildHierarchy(this.hierarchy.topicsMap);
            }

            // 觸發事件
            this.emitEvent({
                type: 'topic-moved',
                topicId: operation.topicId,
                oldParentId,
                newParentId: operation.newParentId
            });

        } catch (error) {
            throw new Error(`Failed to move topic: ${error}`);
        }
    }

    async reorderTopics(operations: TopicMoveOperation[]): Promise<void> {
        try {
            for (const operation of operations) {
                const topic = this.getTopic(operation.topicId);
                if (topic && operation.newOrder !== undefined) {
                    await this.updateTopic(operation.topicId, {
                        display: { order: operation.newOrder }
                    });
                }
            }

            // 觸發事件
            this.emitEvent({ type: 'hierarchy-reordered', changes: operations });

        } catch (error) {
            throw new Error(`Failed to reorder topics: ${error}`);
        }
    }

    // ==================== 統計和分析 ====================

    getStatistics(): TopicStatistics {
        if (!this.hierarchy) {
            return {
                totalTopics: 0,
                rootTopics: 0,
                maxDepth: 0,
                depthDistribution: {},
                topicsWithTemplates: 0,
                topicsWithSubtopics: 0,
                totalTemplates: 0,
                languageDistribution: {}
            };
        }

        const stats: TopicStatistics = {
            totalTopics: this.hierarchy.topicsMap.size,
            rootTopics: this.hierarchy.roots.length,
            maxDepth: this.hierarchy.maxDepth,
            depthDistribution: {},
            topicsWithTemplates: 0,
            topicsWithSubtopics: 0,
            totalTemplates: 0,
            languageDistribution: {}
        };

        // 遍歷所有節點收集統計資料
        const collectStats = (nodes: TopicNode[]): void => {
            for (const node of nodes) {
                const depth = node.depth;
                stats.depthDistribution[depth] = (stats.depthDistribution[depth] || 0) + 1;

                if (node.directTemplates > 0) {
                    stats.topicsWithTemplates++;
                }

                if (node.children.length > 0) {
                    stats.topicsWithSubtopics++;
                }

                stats.totalTemplates += node.directTemplates;

                collectStats(node.children);
            }
        };

        collectStats(this.hierarchy.roots);

        return stats;
    }

    // ==================== 私有方法 ====================

    private wouldCreateCycle(topicId: string, newParentId: string): boolean {
        const isDescendant = (ancestorId: string, descendantId: string): boolean => {
            const node = this.getTopicNode(descendantId);
            if (!node) return false;

            let current: TopicNode | undefined = node.parent;
            while (current) {
                if (current.topic.id === ancestorId) {
                    return true;
                }
                current = current.parent;
            }
            return false;
        };

        return isDescendant(topicId, newParentId);
    }

    private async createTopicFileStructure(topic: TopicConfig, createData: TopicCreateData): Promise<void> {
        const { join } = await import('path');
        const { mkdir, writeFile } = await import('fs/promises');

        const extensionPath = (this.platform as any).getExtensionPath?.() ||
                            (this.platform as any).getExtensionContext?.()?.extensionPath;

        if (!extensionPath) {
            throw new Error('Extension path not found');
        }

        const topicPath = join(extensionPath, 'data', this.scopeId, ...(topic.path || []));

        // 創建主題目錄
        await mkdir(topicPath, { recursive: true });

        // 創建 topic.json
        await this.saveTopicConfig(topic);

        // 創建模板和連結目錄
        await mkdir(join(topicPath, topic.templates), { recursive: true });
        await mkdir(join(topicPath, topic.links), { recursive: true });

        // 創建初始模板和連結（如果提供）
        if (createData.templates && createData.templates.length > 0) {
            for (const template of createData.templates) {
                const templatePath = join(topicPath, topic.templates, `${template.id}.json`);
                await writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');
            }
        }

        if (createData.links && createData.links.length > 0) {
            for (const link of createData.links) {
                const linkPath = join(topicPath, topic.links, `${link.id}.json`);
                await writeFile(linkPath, JSON.stringify(link, null, 2), 'utf-8');
            }
        }
    }

    private async saveTopicConfig(topic: TopicConfig): Promise<void> {
        const { join } = await import('path');
        const { writeFile, mkdir } = await import('fs/promises');

        // 使用 DataPathService 獲取正確的 scope 路徑
        const scopePath = await this.dataPathService.getScopePath(this.scopeId);
        const topicPath = join(scopePath, ...(topic.path || []));
        const configPath = join(topicPath, 'topic.json');

        console.log('[TopicManager] Saving topic to:', configPath);
        console.log('[TopicManager] Topic data being saved:', {
            name: topic.name,
            description: topic.description,
            documentationLength: topic.documentation?.length,
            documentationPreview: topic.documentation?.substring(0, 100)
        });

        // 確保目錄存在
        await mkdir(topicPath, { recursive: true });

        // 保存配置文件
        await writeFile(configPath, JSON.stringify(topic, null, 2), 'utf-8');
    }

    private async deleteTopicFromFileSystem(topic: TopicConfig): Promise<void> {
        const { join } = await import('path');
        const { rm } = await import('fs/promises');

        const extensionPath = (this.platform as any).getExtensionPath?.() ||
                            (this.platform as any).getExtensionContext?.()?.extensionPath;

        if (!extensionPath) {
            throw new Error('Extension path not found');
        }

        const topicPath = join(extensionPath, 'data', this.scopeId, ...(topic.path || []));
        await rm(topicPath, { recursive: true, force: true });
    }

    private async moveTopicFileStructure(oldTopic: TopicConfig, newTopic: TopicConfig): Promise<void> {
        const { join } = await import('path');
        const { rename, mkdir } = await import('fs/promises');

        const extensionPath = (this.platform as any).getExtensionPath?.() ||
                            (this.platform as any).getExtensionContext?.()?.extensionPath;

        if (!extensionPath) {
            throw new Error('Extension path not found');
        }

        const oldPath = join(extensionPath, 'data', this.scopeId, ...(oldTopic.path || []));
        const newPath = join(extensionPath, 'data', this.scopeId, ...(newTopic.path || []));

        if (oldPath !== newPath) {
            // 確保新的父目錄存在
            const parentPath = join(newPath, '..');
            await mkdir(parentPath, { recursive: true });

            // 移動目錄
            await rename(oldPath, newPath);
        }

        // 更新 topic.json
        await this.saveTopicConfig(newTopic);
    }

    // ==================== 事件系統 ====================

    addEventListener(listener: (event: TopicEvent) => void): void {
        this.eventListeners.push(listener);
    }

    removeEventListener(listener: (event: TopicEvent) => void): void {
        const index = this.eventListeners.indexOf(listener);
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    private emitEvent(event: TopicEvent): void {
        this.eventListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in topic event listener:', error);
            }
        });
    }

    // ==================== Scope 管理 ====================

    setScopeId(scopeId: string): void {
        this.scopeId = scopeId;
        this.hierarchy = null;
    }

    getScopeId(): string {
        return this.scopeId;
    }
}