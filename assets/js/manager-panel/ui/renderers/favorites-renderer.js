// Favorites Renderer - 收藏頁面渲染
// 負責渲染收藏頁面的所有內容

(function() {
    'use strict';

    /**
     * Favorites Renderer 類
     * 處理收藏頁面的渲染邏輯
     */
    class FavoritesRenderer {
        constructor(context) {
            this.context = context;
        }

        /**
         * 渲染收藏頁面
         */
        render() {
            // 確保收藏頁面是活躍的

            // 更新收藏統計和列表
            this.updateStats();
            this.updateList();
        }

        /**
         * 更新收藏統計
         */
        updateStats() {
            const currentData = this.context.getCurrentData();
            const favorites = currentData.scope?.favorites || [];
            const totalCount = favorites.length;

            // 更新總收藏數
            this._updateStatValue('total-favorites', totalCount);

            // 計算當前語言收藏數
            const currentLanguageFilter = document.getElementById('favorites-filter-language')?.value || '';
            let languageCount = totalCount;

            if (currentLanguageFilter) {
                const languageFavorites = favorites.filter(itemPath => {
                    const template = currentData.templates?.find(t =>
                        this.context.buildTemplatePath(t) === itemPath
                    );
                    return template && template.language === currentLanguageFilter;
                });
                languageCount = languageFavorites.length;
            }

            this._updateStatValue('favorites-by-language', languageCount);
        }

        /**
         * 更新收藏列表
         */
        updateList() {
            const container = document.getElementById('favorites-list');
            if (!container) return;

            const currentData = this.context.getCurrentData();
            const favorites = currentData.scope?.favorites || [];

            if (favorites.length === 0) {
                container.innerHTML = '<p class="no-data">尚無收藏的項目</p>';
                return;
            }

            // 獲取篩選條件
            const languageFilter = document.getElementById('favorites-filter-language')?.value || '';
            const topicFilter = document.getElementById('favorites-filter-topic')?.value || '';
            const searchFilter = document.getElementById('search-favorites')?.value?.toLowerCase() || '';

            const utils = this.context.getUtils();
            const pathHelpers = this.context.getPathHelpers();
            const dataHelpers = this.context.getDataHelpers();

            // 建立主題查找表
            let topicLookup = new Map();
            if (currentData?.topics?.hierarchy?.roots) {
                const collectTopics = (nodes, pathPrefix = '') => {
                    nodes.forEach(node => {
                        if (node.topic) {
                            const topicPath = pathPrefix ? `${pathPrefix}/${node.topic.name}` : node.topic.name;
                            topicLookup.set(topicPath, {
                                ...node.topic,
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

            // 將收藏項目分類並篩選
            const favoriteItems = favorites.map(itemPath => {
                // 檢查是否為模板
                const template = currentData.templates?.find(t =>
                    this.context.buildTemplatePath(t) === itemPath
                );

                if (template) {
                    return {
                        type: 'template',
                        path: itemPath,
                        data: template
                    };
                }

                // 檢查是否為主題
                const topic = topicLookup.get(itemPath);
                if (topic) {
                    return {
                        type: 'topic',
                        path: itemPath,
                        data: topic
                    };
                }

                return null;
            }).filter(Boolean);

            // 篩選收藏項目
            const filteredFavorites = favoriteItems.filter(item => {
                if (item.type === 'template') {
                    const template = item.data;

                    // 語言篩選
                    if (languageFilter && template.language !== languageFilter) return false;

                    // 主題篩選
                    if (topicFilter && template.topic !== topicFilter) return false;

                    // 搜索篩選
                    if (searchFilter && !template.title.toLowerCase().includes(searchFilter)) return false;
                } else if (item.type === 'topic') {
                    const topic = item.data;

                    // 主題類型不受語言篩選影響

                    // 主題篩選 - 檢查主題路徑是否匹配
                    if (topicFilter && !item.path.startsWith(topicFilter)) return false;

                    // 搜索篩選
                    if (searchFilter && !(topic.title || topic.name).toLowerCase().includes(searchFilter)) return false;
                }

                return true;
            });

            const html = filteredFavorites.map(item => {
                if (item.type === 'template') {
                    const template = item.data;

                    // 獲取語言顯示名稱
                    const language = currentData.languages?.find(l => l.name === template.language);
                    const languageDisplay = language ? (language.title || language.displayName || language.name) : template.language;

                    // 獲取主題顯示路徑
                    const topicDisplayPath = pathHelpers.getDisplayPath(template.topicPath || template.topic);

                    return `
                        <div class="favorite-item">
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span class="tree-icon">📄</span>
                                        <h3>${utils.escapeHtml(template.title)}</h3>
                                    </div>
                                    <div class="favorite-badge">收藏</div>
                                </div>
                                <p class="description">${utils.escapeHtml(template.description || '無描述')}</p>
                                <div class="data-item-meta">
                                    <span class="language-tag">${utils.escapeHtml(languageDisplay)}</span>
                                    <span class="topic-tag">${utils.escapeHtml(topicDisplayPath)}</span>
                                </div>
                                <div class="data-item-actions">
                                    <button class="btn btn-primary btn-small" data-action="view-template" data-template-path="${this.context.buildTemplatePath(template)}">查看</button>
                                    <button class="btn btn-secondary btn-small" data-action="edit-template" data-template-path="${this.context.buildTemplatePath(template)}">編輯</button>
                                    <button class="btn btn-warning btn-small" data-action="remove-from-favorites" data-item-path="${item.path}">取消收藏</button>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (item.type === 'topic') {
                    const topic = item.data;
                    const topicDisplayPath = pathHelpers.getDisplayPath(item.path);
                    const icon = topic.display?.icon || pathHelpers.getTopicIcon(topic.name);

                    return `
                        <div class="favorite-item">
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span class="tree-icon">${icon}</span>
                                        <h3>${utils.escapeHtml(topic.title || topic.name)}</h3>
                                    </div>
                                    <div class="favorite-badge">收藏</div>
                                </div>
                                <p class="description">${utils.escapeHtml(topic.description || '無描述')}</p>
                                <div class="data-item-meta">
                                    <span class="topic-tag">${utils.escapeHtml(topicDisplayPath)}</span>
                                </div>
                                <div class="data-item-actions">
                                    <button class="btn btn-primary btn-small" data-action="view-topic" data-topic-path="${item.path}">查看</button>
                                    <button class="btn btn-secondary btn-small" data-action="edit-topic" data-topic-path="${item.path}">編輯</button>
                                    <button class="btn btn-warning btn-small" data-action="remove-from-favorites" data-item-path="${item.path}">取消收藏</button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                return '';
            }).filter(Boolean).join('');

            container.innerHTML = html || '<p class="no-data">沒有符合篩選條件的收藏項目</p>';
        }

        /**
         * 更新統計數值（私有方法）
         */
        _updateStatValue(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FavoritesRenderer;
    } else {
        window.FavoritesRenderer = FavoritesRenderer;
    }
})();
