/**
 * TextBricks Topic 模型定義
 * 定義階層主題系統的接口和類型
 */

export interface TopicConfig {
    /** 主題類型 */
    type: 'topic';
    /** 內部名稱（用於路徑識別，如 "python", "basic"） */
    name: string;
    /** 顯示標題（原 displayName） */
    title: string;
    /** 描述 */
    description: string;
    /** 說明文檔 */
    documentation?: string;
    /** 子主題列表（僅包含直接子主題的 name） */
    subtopics?: string[];
    /** 顯示配置 */
    display: TopicDisplayConfig;
    // 注意：以下欄位從檔案系統結構推導，不再儲存：
    // - id: 改用路徑作為唯一識別
    // - templates/links: 固定為 "templates" 和 "links" 資料夾
    // - parentId: 從檔案系統結構推導
    // - path: 從檔案系統路徑推導
}

/** Link 介面定義 */
export interface TopicLink {
    type: 'link';
    name: string;
    title: string;
    target: string;
    description: string;
}

/**
 * Runtime Topic 配置
 * 擴展 TopicConfig，加入運行時推導的欄位
 */
export interface RuntimeTopicConfig extends TopicConfig {
    /** 運行時載入的連結列表 */
    loadedLinks?: TopicLink[];
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
    type: 'topic';
    name: string;
    title: string;  // 原 displayName
    description: string;
    documentation?: string;
    /** 父主題路徑（如 "c" 或 "c/basic"） */
    parentPath?: string;
    /** 顯示配置 */
    display: Partial<TopicDisplayConfig>;
    /** 初始模板資料 */
    templates?: unknown[];
    /** 初始連結資料 */
    links?: unknown[];
}

export interface TopicUpdateData {
    /** 可更新的欄位 */
    name?: string;
    title?: string;  // 原 displayName
    description?: string;
    documentation?: string;
    display?: Partial<TopicDisplayConfig>;
    // 注意：templates 和 links 資料夾固定，不支援重新命名
}

export interface TopicMoveOperation {
    /** 移動的主題路徑 */
    topicPath: string;
    /** 新的父主題路徑（null 表示移至根層級） */
    newParentPath: string | null;
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
    | { type: 'topic-deleted', topicPath: string }
    | { type: 'topic-moved', topicPath: string, oldParentPath: string | null, newParentPath: string | null }
    | { type: 'hierarchy-reordered', changes: TopicMoveOperation[] };