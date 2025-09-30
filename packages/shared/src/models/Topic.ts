/**
 * TextBricks Topic 模型定義
 * 定義階層主題系統的接口和類型
 */

export interface TopicConfig {
    /** 主題唯一標識 */
    id: string;
    /** 內部名稱 */
    name: string;
    /** 顯示名稱 */
    displayName: string;
    /** 描述 */
    description: string;
    /** 說明文檔 */
    documentation?: string;
    /** 模板資料夾名稱 */
    templates: string;
    /** 連結資料夾名稱 */
    links: string;
    /** 子主題列表 */
    subtopics?: string[];
    /** 顯示配置 */
    display: TopicDisplayConfig;
    /** 父主題 ID（用於階層關係） */
    parentId?: string;
    /** 主題路徑（從根到當前主題的完整路徑） */
    path?: string[];
}

export interface TopicDisplayConfig {
    /** 圖示 */
    icon: string;
    /** 顏色 */
    color: string;
    /** 排序順序 */
    order: number;
    /** 是否摺疊 */
    collapsed: boolean;
    /** 是否在導航中顯示 */
    showInNavigation: boolean;
}

export interface TopicHierarchy {
    /** 根主題列表 */
    roots: TopicNode[];
    /** 所有主題的平面映射 */
    topicsMap: Map<string, TopicConfig>;
    /** 階層深度統計 */
    maxDepth: number;
}

export interface TopicNode {
    /** 主題配置 */
    topic: TopicConfig;
    /** 子主題節點 */
    children: TopicNode[];
    /** 父節點引用 */
    parent?: TopicNode;
    /** 階層深度 */
    depth: number;
    /** 是否為葉子節點 */
    isLeaf: boolean;
    /** 模板數量（含子主題） */
    totalTemplates: number;
    /** 直接模板數量 */
    directTemplates: number;
}

export interface TopicCreateData {
    /** 基本配置 */
    id: string;
    name: string;
    displayName: string;
    description: string;
    documentation?: string;
    /** 父主題 ID */
    parentId?: string;
    /** 顯示配置 */
    display: Partial<TopicDisplayConfig>;
    /** 初始模板資料 */
    templates?: any[];
    /** 初始連結資料 */
    links?: any[];
}

export interface TopicUpdateData {
    /** 可更新的欄位 */
    name?: string;
    displayName?: string;
    description?: string;
    documentation?: string;
    display?: Partial<TopicDisplayConfig>;
    /** 模板資料夾重新命名 */
    templatesFolder?: string;
    /** 連結資料夾重新命名 */
    linksFolder?: string;
}

export interface TopicMoveOperation {
    /** 移動的主題 ID */
    topicId: string;
    /** 新的父主題 ID（null 表示移至根層級） */
    newParentId: string | null;
    /** 新的排序位置 */
    newOrder?: number;
}

export interface TopicStatistics {
    /** 主題總數 */
    totalTopics: number;
    /** 根主題數 */
    rootTopics: number;
    /** 最大階層深度 */
    maxDepth: number;
    /** 各層級的主題數量 */
    depthDistribution: Record<number, number>;
    /** 有模板的主題數 */
    topicsWithTemplates: number;
    /** 有子主題的主題數 */
    topicsWithSubtopics: number;
    /** 模板總數 */
    totalTemplates: number;
    /** 語言分佈 */
    languageDistribution: Record<string, number>;
}

export type TopicEvent =
    | { type: 'topic-created', topic: TopicConfig }
    | { type: 'topic-updated', topic: TopicConfig }
    | { type: 'topic-deleted', topicId: string }
    | { type: 'topic-moved', topicId: string, oldParentId: string | null, newParentId: string | null }
    | { type: 'hierarchy-reordered', changes: TopicMoveOperation[] };