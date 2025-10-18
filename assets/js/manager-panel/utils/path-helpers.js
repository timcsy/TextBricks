// Path Helpers - 路徑處理工具
// 負責路徑轉換、顯示名稱獲取等功能

(function() {
    'use strict';

    /**
     * Path Helpers 類
     * 提供路徑相關的工具方法
     */
    class PathHelpers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 構建模板路徑
         */
        buildTemplatePath(template) {
            const topicPath = template.topicPath || '';
            const name = template.name || template.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
            return topicPath ? `${topicPath}/templates/${name}` : `templates/${name}`;
        }

        /**
         * 獲取語言顯示名稱
         */
        getLanguageDisplayName(languageName) {
            if (!languageName) return '';

            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            const languages = currentData.languages || [];
            const language = languages.find(l => l.name === languageName);

            return language?.title || language?.displayName || languageName;
        }

        /**
         * 獲取主題顯示名稱
         */
        getTopicDisplayName(topicPath) {
            if (!topicPath) return '';

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
            } else if (window.topicLookup) {
                topics = Array.from(window.topicLookup.values());
            }

            const topic = topics.find(t => t.path?.join('/') === topicPath);
            return topic?.title || topicPath;
        }

        /**
         * 將路徑字串轉換為顯示路徑
         */
        getDisplayPath(pathString) {
            if (!pathString) return '';

            const stateManager = this.context.getStateManager();
            const currentData = stateManager.getCurrentData();

            // 檢查是否為模板路徑（包含 /templates/）
            const templatesIndex = pathString.indexOf('/templates/');
            if (templatesIndex !== -1) {
                // 這是模板路徑，特殊處理
                const topicPath = pathString.substring(0, templatesIndex);
                const templateName = pathString.substring(templatesIndex + '/templates/'.length);

                // 查找模板獲取標題
                const template = currentData.templates?.find(t =>
                    this.buildTemplatePath(t) === pathString
                );

                const displayParts = [];

                // 轉換主題路徑部分
                if (topicPath) {
                    displayParts.push(this.getDisplayPath(topicPath));
                }

                // 添加模板標題
                if (template && template.title) {
                    displayParts.push(template.title);
                } else {
                    displayParts.push(templateName);
                }

                return displayParts.join('/');
            }

            // 收集所有主題 - 從 hierarchy.roots 遍歷
            let topics = [];

            if (currentData?.topics?.hierarchy?.roots) {
                // 遞歸收集所有主題
                const collectTopics = (nodes, pathPrefix = '') => {
                    nodes.forEach(node => {
                        if (node.topic) {
                            const topicPath = pathPrefix ? `${pathPrefix}/${node.topic.name}` : node.topic.name;
                            topics.push({
                                name: node.topic.name,
                                title: node.topic.title,
                                path: topicPath
                            });
                            if (node.children && node.children.length > 0) {
                                collectTopics(node.children, topicPath);
                            }
                        }
                    });
                };
                collectTopics(currentData.topics.hierarchy.roots);
            }

            // Fallback: 使用 topicsMap 或 topicLookup
            if (topics.length === 0) {
                if (currentData?.topics?.hierarchy?.topicsMap) {
                    if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                        topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
                    } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                        topics = Object.values(currentData.topics.hierarchy.topicsMap);
                    }
                }

                if (topics.length === 0 && window.topicLookup) {
                    if (window.topicLookup instanceof Map) {
                        topics = Array.from(window.topicLookup.values());
                    } else if (typeof window.topicLookup === 'object') {
                        topics = Object.values(window.topicLookup);
                    }
                }

                if (topics.length === 0 && currentData?.topics?.all) {
                    topics = currentData.topics.all;
                }
            }

            // 將路徑拆分並轉換每個部分
            const pathParts = pathString.split('/');
            const displayParts = [];

            for (let i = 0; i < pathParts.length; i++) {
                const partialPath = pathParts.slice(0, i + 1).join('/');
                const currentPart = pathParts[i];

                const topic = topics.find(t => {
                    const topicPath = Array.isArray(t.path) ? t.path.join('/') : t.path;
                    return topicPath === partialPath || t.name === currentPart;
                });

                if (topic && topic.title) {
                    displayParts.push(topic.title);
                } else {
                    displayParts.push(currentPart);
                }
            }

            return displayParts.join('/');
        }

        /**
         * 獲取主題路徑（用於顯示）
         */
        getTopicPath(topic) {
            // 如果是字串路徑，直接返回
            if (typeof topic.path === 'string') {
                return topic.path;
            }

            // 從路徑陣列構建顯示路徑
            if (Array.isArray(topic.path) && topic.path.length > 0) {
                const pathSegments = [];
                let currentPath = [];

                for (const pathSegment of topic.path) {
                    currentPath.push(pathSegment);
                    // 查找對應的主題
                    const dataHelpers = this.context.getDataHelpers();
                    const topicForSegment = dataHelpers.findTopicByPath(currentPath);
                    if (topicForSegment && topicForSegment.title) {
                        pathSegments.push(topicForSegment.title);
                    } else {
                        pathSegments.push(pathSegment); // fallback
                    }
                }

                return pathSegments.join('/');
            }

            // Fallback
            return topic.title || topic.name;
        }

        /**
         * 獲取主題圖標
         */
        getTopicIcon(topicName) {
            const topicLower = topicName.toLowerCase();
            if (topicLower.includes('python')) return '🐍';
            if (topicLower.includes('javascript')) return '⚡';
            if (topicLower.includes('c語言') || topicLower.includes('c++')) return '⚙️';
            if (topicLower.includes('java')) return '☕';
            if (topicLower.includes('html')) return '🌐';
            if (topicLower.includes('css')) return '🎨';
            return '🏷️';
        }

        /**
         * 標準化路徑
         */
        normalizePath(path) {
            if (!path) return '';
            return path.replace(/\\/g, '/').replace(/\/+/g, '/');
        }

        /**
         * 拆分路徑
         */
        splitPath(path) {
            if (!path) return [];
            return this.normalizePath(path).split('/').filter(Boolean);
        }

        /**
         * 合併路徑
         */
        joinPath(...parts) {
            return parts.filter(Boolean).join('/');
        }

        /**
         * 獲取父路徑
         */
        getParentPath(path) {
            if (!path) return '';
            const parts = this.splitPath(path);
            if (parts.length <= 1) return '';
            return parts.slice(0, -1).join('/');
        }

        /**
         * 獲取路徑最後一部分
         */
        getPathBasename(path) {
            if (!path) return '';
            const parts = this.splitPath(path);
            return parts[parts.length - 1] || '';
        }

        /**
         * 檢查是否為子路徑
         */
        isSubPath(childPath, parentPath) {
            if (!childPath || !parentPath) return false;
            const normalizedChild = this.normalizePath(childPath);
            const normalizedParent = this.normalizePath(parentPath);
            return normalizedChild.startsWith(normalizedParent + '/');
        }

        /**
         * 獲取相對路徑
         */
        getRelativePath(fromPath, toPath) {
            if (!fromPath || !toPath) return toPath;

            const fromParts = this.splitPath(fromPath);
            const toParts = this.splitPath(toPath);

            // 找到共同前綴
            let commonLength = 0;
            while (commonLength < fromParts.length &&
                   commonLength < toParts.length &&
                   fromParts[commonLength] === toParts[commonLength]) {
                commonLength++;
            }

            // 構建相對路徑
            const upSteps = fromParts.length - commonLength;
            const downSteps = toParts.slice(commonLength);

            const relativeParts = [];
            for (let i = 0; i < upSteps; i++) {
                relativeParts.push('..');
            }
            relativeParts.push(...downSteps);

            return relativeParts.join('/') || '.';
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PathHelpers;
    } else {
        window.PathHelpers = PathHelpers;
    }
})();
