/**
 * UIStateService (前端版本)
 * 統一管理前端 UI 狀態和過濾邏輯
 */
class UIStateService {
    constructor() {
        this.state = {
            currentTab: 'overview',
            filters: {
                content: {},
                favorites: {}
            },
            selection: {}
        };
        this.templates = [];
        this.topics = [];
        this.languages = [];
    }

    /**
     * 更新數據源
     */
    updateData(templates, topics, languages) {
        this.templates = templates;
        this.topics = topics;
        this.languages = languages;
    }

    /**
     * 獲取當前標籤頁
     */
    getCurrentTab() {
        return this.state.currentTab;
    }

    /**
     * 切換標籤頁
     */
    setCurrentTab(tab) {
        this.state.currentTab = tab;
    }

    /**
     * 設置過濾器
     */
    setFilter(context, filter) {
        this.state.filters[context] = {
            ...this.state.filters[context],
            ...filter
        };
    }

    /**
     * 獲取過濾器
     */
    getFilter(context) {
        return this.state.filters[context];
    }

    /**
     * 清除過濾器
     */
    clearFilter(context) {
        this.state.filters[context] = {};
    }

    /**
     * 設置選擇
     */
    setSelection(type, path) {
        this.state.selection = { type, path };
    }

    /**
     * 獲取選擇
     */
    getSelection() {
        return this.state.selection;
    }

    /**
     * 清除選擇
     */
    clearSelection() {
        this.state.selection = {};
    }

    /**
     * 根據過濾器獲取模板列表
     */
    getFilteredTemplates(context) {
        const filter = this.state.filters[context];
        let results = this.templates;

        // 語言過濾
        if (filter.language) {
            results = results.filter(t => t.language === filter.language);
        }

        // 主題過濾
        if (filter.topic) {
            results = results.filter(t =>
                t.topicPath === filter.topic ||
                t.topicPath?.startsWith(filter.topic + '/')
            );
        }

        // 搜索過濾
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            results = results.filter(t =>
                t.title?.toLowerCase().includes(searchLower) ||
                t.description?.toLowerCase().includes(searchLower) ||
                t.name?.toLowerCase().includes(searchLower)
            );
        }

        return results;
    }

    /**
     * 獲取所有語言
     */
    getAllLanguages() {
        return this.languages;
    }

    /**
     * 獲取所有主題
     */
    getAllTopics() {
        return this.topics;
    }

    /**
     * 根據語言分組模板
     */
    groupTemplatesByLanguage() {
        const grouped = new Map();

        this.templates.forEach(template => {
            const lang = template.language || 'unknown';
            if (!grouped.has(lang)) {
                grouped.set(lang, []);
            }
            grouped.get(lang).push(template);
        });

        return grouped;
    }

    /**
     * 根據主題分組模板
     */
    groupTemplatesByTopic() {
        const grouped = new Map();

        this.templates.forEach(template => {
            const topic = template.topicPath || 'uncategorized';
            if (!grouped.has(topic)) {
                grouped.set(topic, []);
            }
            grouped.get(topic).push(template);
        });

        return grouped;
    }

    /**
     * 獲取統計數據
     */
    getStatistics() {
        const languageGroups = this.groupTemplatesByLanguage();
        const topicGroups = this.groupTemplatesByTopic();

        const templatesByLanguage = {};
        languageGroups.forEach((templates, lang) => {
            templatesByLanguage[lang] = templates.length;
        });

        const templatesByTopic = {};
        topicGroups.forEach((templates, topic) => {
            templatesByTopic[topic] = templates.length;
        });

        return {
            totalTemplates: this.templates.length,
            totalTopics: this.topics.length,
            totalLanguages: this.languages.length,
            templatesByLanguage,
            templatesByTopic
        };
    }

    /**
     * 搜索所有內容
     */
    searchAll(query) {
        const queryLower = query.toLowerCase();

        return {
            templates: this.templates.filter(t =>
                t.title?.toLowerCase().includes(queryLower) ||
                t.description?.toLowerCase().includes(queryLower) ||
                t.name?.toLowerCase().includes(queryLower)
            ),
            topics: this.topics.filter(t =>
                t.title?.toLowerCase().includes(queryLower) ||
                t.description?.toLowerCase().includes(queryLower) ||
                t.name?.toLowerCase().includes(queryLower)
            ),
            languages: this.languages.filter(l =>
                l.title?.toLowerCase().includes(queryLower) ||
                l.name?.toLowerCase().includes(queryLower)
            )
        };
    }

    /**
     * 重置狀態
     */
    resetState() {
        this.state = {
            currentTab: 'overview',
            filters: {
                content: {},
                favorites: {}
            },
            selection: {}
        };
    }
}
