// Favorites Handlers - 收藏操作處理器
// 負責處理收藏功能的操作

(function() {
    'use strict';

    /**
     * Favorites Handlers 類
     * 處理收藏相關的用戶操作
     */
    class FavoritesHandlers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 添加到收藏
         */
        addToFavorites(itemPath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'addToFavorites',
                itemPath: itemPath
            });
        }

        /**
         * 從收藏中移除
         */
        removeFromFavorites(itemPath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'removeFromFavorites',
                itemPath: itemPath
            });
        }

        /**
         * 切換收藏狀態
         */
        toggleFavorite(itemPath) {
            const currentData = this.context.getCurrentData();
            const isFavorite = currentData.scope?.favorites?.includes(itemPath);

            if (isFavorite) {
                this.removeFromFavorites(itemPath);
            } else {
                this.addToFavorites(itemPath);
            }
        }

        /**
         * 檢查是否已收藏
         */
        isFavorite(itemPath) {
            const currentData = this.context.getCurrentData();
            return currentData.scope?.favorites?.includes(itemPath) || false;
        }

        /**
         * 獲取收藏列表
         */
        getFavorites() {
            const currentData = this.context.getCurrentData();
            return currentData.scope?.favorites || [];
        }

        /**
         * 清空所有收藏
         */
        clearAllFavorites() {
            const currentData = this.context.getCurrentData();
            const favorites = currentData.scope?.favorites || [];

            if (favorites.length === 0) {
                alert('目前沒有收藏項目');
                return;
            }

            const confirmMessage = `確定要清空所有 ${favorites.length} 個收藏項目嗎？\n此操作無法復原。`;

            if (confirm(confirmMessage)) {
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'clearAllFavorites'
                });
            }
        }

        /**
         * 批量添加到收藏
         */
        addMultipleToFavorites(itemPaths) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'addMultipleToFavorites',
                itemPaths: itemPaths
            });
        }

        /**
         * 批量從收藏中移除
         */
        removeMultipleFromFavorites(itemPaths) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'removeMultipleFromFavorites',
                itemPaths: itemPaths
            });
        }

        /**
         * 獲取收藏統計
         */
        getFavoritesStats() {
            const currentData = this.context.getCurrentData();
            const favorites = currentData.scope?.favorites || [];

            // 統計各類型收藏數量
            let templatesCount = 0;
            let topicsCount = 0;

            favorites.forEach(itemPath => {
                // 判斷是模板還是主題
                const isTemplate = currentData.templates?.some(t =>
                    this.context.buildTemplatePath(t) === itemPath
                );

                if (isTemplate) {
                    templatesCount++;
                } else {
                    topicsCount++;
                }
            });

            return {
                total: favorites.length,
                templates: templatesCount,
                topics: topicsCount
            };
        }

        /**
         * 排序收藏列表
         */
        sortFavorites(sortBy = 'name', order = 'asc') {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'sortFavorites',
                sortBy: sortBy,
                order: order
            });
        }

        /**
         * 導出收藏列表
         */
        exportFavorites() {
            const favorites = this.getFavorites();
            const currentData = this.context.getCurrentData();

            const favoritesData = favorites.map(itemPath => {
                const template = currentData.templates?.find(t =>
                    this.context.buildTemplatePath(t) === itemPath
                );

                if (template) {
                    return {
                        type: 'template',
                        path: itemPath,
                        title: template.title,
                        language: template.language,
                        topic: template.topic
                    };
                }

                return {
                    type: 'unknown',
                    path: itemPath
                };
            });

            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'exportFavorites',
                data: favoritesData
            });
        }

        /**
         * 導入收藏列表
         */
        importFavorites(favoritesData) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'importFavorites',
                data: favoritesData
            });
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FavoritesHandlers;
    } else {
        window.FavoritesHandlers = FavoritesHandlers;
    }
})();
