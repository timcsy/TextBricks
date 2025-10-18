// Data Helpers - 資料輔助工具
// 負責數據查詢、查找和處理

(function() {
    'use strict';

    /**
     * Data Helpers 類
     * 提供數據查詢和查找的工具方法
     */
    class DataHelpers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 根據路徑查找主題
         */
        findTopicByPath(topicPath) {
            if (!topicPath) return null;

            const contentRenderer = this.context.getContentRenderer();
            const topicLookup = contentRenderer?.getTopicLookup();

            // 首先檢查自己的主題查找快取
            if (topicLookup && topicLookup.has(topicPath)) {
                return topicLookup.get(topicPath);
            }

            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            // 在層級結構中搜索
            if (currentData.topics?.hierarchy?.topicsMap) {
                if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                    const topic = currentData.topics.hierarchy.topicsMap.get(topicPath);
                    if (topic) return topic;
                } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                    const topic = currentData.topics.hierarchy.topicsMap[topicPath];
                    if (topic) return topic;
                }
            }

            // 通過在模板中匹配主題名稱來搜索
            const templates = currentData.templates?.filter(t => t.topic === topicPath) || [];

            if (templates.length > 0) {
                const pathHelpers = this.context.getPathHelpers();
                const topicData = {
                    path: topicPath,
                    name: topicPath,
                    displayName: topicPath,
                    description: `包含 ${templates.length} 個模板`,
                    display: {
                        icon: pathHelpers.getTopicIcon(topicPath)
                    }
                };
                return topicData;
            }

            return null;
        }

        /**
         * 根據名稱查找主題
         */
        findTopicByName(topicName) {
            if (!topicName) return null;

            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            // 收集所有主題
            let topics = [];

            if (currentData.topics?.hierarchy?.topicsMap) {
                if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                    topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
                } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                    topics = Object.values(currentData.topics.hierarchy.topicsMap);
                }
            }

            // 查找匹配名稱的主題
            return topics.find(t => t.name === topicName) || null;
        }

        /**
         * 根據名稱查找連結
         */
        findLinkByName(linkName) {
            if (!linkName) return null;

            const contentRenderer = this.context.getContentRenderer();
            const treeData = contentRenderer?.getTreeData();

            // 首先嘗試在樹數據中搜索
            if (treeData && treeData.length > 0) {
                const link = this._searchTreeForLink(treeData, linkName);
                if (link) return link;
            }

            // 備選：在所有主題的 loadedLinks 中搜索
            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            if (currentData.topics?.hierarchy?.topicsMap) {
                let topicsMap = currentData.topics.hierarchy.topicsMap;
                let allTopics = [];

                if (topicsMap instanceof Map) {
                    allTopics = Array.from(topicsMap.values());
                } else if (typeof topicsMap === 'object') {
                    allTopics = Object.values(topicsMap);
                }

                for (const topic of allTopics) {
                    if (topic.loadedLinks && Array.isArray(topic.loadedLinks)) {
                        const link = topic.loadedLinks.find(l => l.name === linkName);
                        if (link) {
                            return {
                                ...link,
                                topic: Array.isArray(topic.path) ? topic.path.join('/') : topic.path
                            };
                        }
                    }
                }
            }

            return null;
        }

        /**
         * 獲取現有主題列表
         */
        getExistingTopics() {
            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            // 從模板獲取主題
            const topicsFromTemplates = currentData.templates ?
                currentData.templates.map(t => t.topic).filter(t => t) : [];

            // 從層級結構提取主題
            let managedTopics = [];
            if (currentData.topics?.hierarchy?.topicsMap) {
                if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                    managedTopics = Array.from(currentData.topics.hierarchy.topicsMap.values()).map(t => t.name);
                } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                    managedTopics = Object.values(currentData.topics.hierarchy.topicsMap).map(t => t.name);
                }
            }

            // 同時檢查主題查找快取
            const contentRenderer = this.context.getContentRenderer();
            const topicLookup = contentRenderer?.getTopicLookup();

            if (topicLookup && topicLookup.size > 0) {
                const cachedTopics = Array.from(topicLookup.values()).map(t => t.name);
                managedTopics = [...managedTopics, ...cachedTopics];
            }

            const allTopics = new Set([...topicsFromTemplates, ...managedTopics]);
            return Array.from(allTopics).sort();
        }

        /**
         * 獲取主題的模板
         */
        getTemplatesForTopic(topic) {
            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            if (!currentData.templates) return [];

            const topicDataPath = topic.path ?
                (Array.isArray(topic.path) ? topic.path.join('/') : topic.path) :
                topic.name;

            const matchedTemplates = currentData.templates.filter(template => {
                // 使用 topicPath 屬性匹配
                return template.topicPath === topicDataPath ||
                       template.topicPath === topic.name;
            });

            return matchedTemplates;
        }

        /**
         * 根據路徑獲取主題的模板
         */
        getTemplatesForTopicPath(topicPath) {
            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            if (!currentData.templates) return [];

            return currentData.templates.filter(template => {
                return template.topicPath === topicPath;
            });
        }

        /**
         * 獲取所有可用主題（用於瀏覽器）
         */
        getAllAvailableTopics() {
            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();
            const pathHelpers = this.context.getPathHelpers();

            const topics = [];

            if (currentData && currentData.topics && currentData.topics.hierarchy) {
                // 使用 hierarchy.roots 而不是 topicsMap
                this._collectTopicsFromHierarchy(
                    currentData.topics.hierarchy.roots,
                    topics,
                    pathHelpers
                );
            }

            return topics;
        }

        /**
         * 收集所有主題（遞歸）
         */
        collectAllTopics(nodes, result = []) {
            if (!nodes || !Array.isArray(nodes)) return result;

            nodes.forEach(node => {
                if (node.topic) {
                    result.push(node.topic);
                }
                if (node.children && node.children.length > 0) {
                    this.collectAllTopics(node.children, result);
                }
            });

            return result;
        }

        /**
         * 搜索主題
         */
        searchTopics(query) {
            if (!query) return [];

            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            let allTopics = [];

            if (currentData.topics?.hierarchy?.topicsMap) {
                if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                    allTopics = Array.from(currentData.topics.hierarchy.topicsMap.values());
                } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                    allTopics = Object.values(currentData.topics.hierarchy.topicsMap);
                }
            }

            const lowerQuery = query.toLowerCase();
            return allTopics.filter(topic => {
                return topic.title?.toLowerCase().includes(lowerQuery) ||
                       topic.name?.toLowerCase().includes(lowerQuery) ||
                       topic.description?.toLowerCase().includes(lowerQuery);
            });
        }

        /**
         * 搜索模板
         */
        searchTemplates(query) {
            if (!query) return [];

            const stateManager = this.context.getStateManager();
            const templates = stateManager.getTemplates();

            const lowerQuery = query.toLowerCase();
            return templates.filter(template => {
                return template.title?.toLowerCase().includes(lowerQuery) ||
                       template.description?.toLowerCase().includes(lowerQuery) ||
                       template.language?.toLowerCase().includes(lowerQuery);
            });
        }

        /**
         * 獲取主題統計信息
         */
        getTopicStats(topicPath) {
            const topic = this.findTopicByPath(topicPath);
            if (!topic) return null;

            const templates = this.getTemplatesForTopic(topic);

            return {
                templateCount: templates.length,
                languages: [...new Set(templates.map(t => t.language))],
                hasDocumentation: !!topic.documentation
            };
        }

        /**
         * 獲取語言統計信息
         */
        getLanguageStats() {
            const stateManager = this.context.getStateManager();
            const templates = stateManager.getTemplates();

            const languageMap = {};

            templates.forEach(template => {
                const lang = template.language || 'unknown';
                if (!languageMap[lang]) {
                    languageMap[lang] = {
                        name: lang,
                        count: 0,
                        templates: []
                    };
                }
                languageMap[lang].count++;
                languageMap[lang].templates.push(template);
            });

            return Object.values(languageMap).sort((a, b) => b.count - a.count);
        }

        /**
         * 在樹中搜索連結（私有方法）
         */
        _searchTreeForLink(nodes, linkName, parentPath = null) {
            for (const node of nodes) {
                if (node.type === 'link') {
                    // 連結的 path 格式是：topicPath/links/linkName
                    // 需要提取最後一部分來比對
                    const nodeLinkName = node.path.split('/links/').pop();
                    if (nodeLinkName === linkName || node.name === linkName) {
                        // 附加主題路徑信息
                        return {
                            ...node.data,
                            topic: parentPath  // 儲存所屬主題路徑
                        };
                    }
                }
                if (node.children && node.children.length > 0) {
                    // 如果這是一個主題節點，將其路徑作為 parent 傳遞給子節點
                    const currentParent = node.type === 'topic' ? node.path : parentPath;
                    const found = this._searchTreeForLink(node.children, linkName, currentParent);
                    if (found) return found;
                }
            }
            return null;
        }

        /**
         * 從層級結構收集主題（私有方法）
         */
        _collectTopicsFromHierarchy(nodes, topics, pathHelpers) {
            if (!nodes || !Array.isArray(nodes)) return;

            nodes.forEach(node => {
                if (node.topic) {
                    const topic = node.topic;
                    const path = topic.path ? topic.path.join('/') : topic.name;
                    // 使用 displayNames 生成完整顯示路徑
                    const fullDisplayPath = pathHelpers.getTopicPath(topic);

                    topics.push({
                        path: path,
                        title: topic.title,
                        fullDisplayPath: fullDisplayPath,
                        name: topic.name
                    });

                    // 同時添加該主題的模板
                    const templates = this.getTemplatesForTopic(topic);
                    templates.forEach(template => {
                        const templatePath = pathHelpers.buildTemplatePath(template);
                        // 顯示路徑不包含 "templates" - 只顯示為主題的一部分
                        const templateDisplayPath = `${fullDisplayPath}/${template.title}`;

                        topics.push({
                            path: templatePath,
                            displayName: `📄 ${template.title}`,
                            fullDisplayPath: templateDisplayPath,
                            isTemplate: true
                        });
                    });
                }

                // 遞歸處理子節點
                if (node.children && node.children.length > 0) {
                    this._collectTopicsFromHierarchy(node.children, topics, pathHelpers);
                }
            });
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DataHelpers;
    } else {
        window.DataHelpers = DataHelpers;
    }
})();
