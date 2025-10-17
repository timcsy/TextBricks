// Context Menu Handler - 右鍵選單處理器
// 負責處理右鍵選單的顯示、隱藏和動作執行

(function() {
    'use strict';

    /**
     * Context Menu Handler 類
     * 處理右鍵選單相關的所有操作
     */
    class ContextMenuHandler {
        constructor(context) {
            this.context = context;
        }

        /**
         * 顯示右鍵選單
         */
        showContextMenu(e, item) {
            e.preventDefault();

            const menu = document.getElementById('context-menu');
            if (!menu) return;

            // 獲取項目類型和路徑（從父節點獲取）
            const node = item.closest('.tree-node');
            if (!node) return;

            const itemType = node.dataset.type; // 'topic', 'template', 'link'
            const itemPath = node.dataset.path;

            if (!itemType || !itemPath) return;

            // 儲存當前項目資訊到選單
            menu.dataset.itemType = itemType;
            menu.dataset.itemPath = itemPath;

            // 根據項目類型顯示/隱藏選單項
            this._updateMenuItemsVisibility(menu, itemType, itemPath);

            // 定位選單到滑鼠位置
            this._positionMenu(menu, e);

            // 綁定選單項點擊事件（只綁定一次）
            this._attachMenuEvents(menu);
        }

        /**
         * 關閉右鍵選單
         */
        closeContextMenu() {
            const menu = document.getElementById('context-menu');
            if (menu) {
                menu.style.display = 'none';
            }
        }

        /**
         * 更新選單項目可見性（私有方法）
         */
        _updateMenuItemsVisibility(menu, itemType, itemPath) {
            const menuItems = menu.querySelectorAll('.context-menu-item');
            menuItems.forEach(menuItem => {
                const action = menuItem.dataset.action;

                // 所有項目都可以編輯、複製、刪除、加入收藏
                if (['edit', 'copy', 'delete', 'toggle-favorite'].includes(action)) {
                    menuItem.style.display = 'flex';
                }
                // 只有主題可以新增子主題和模板
                else if (['add-topic', 'add-template'].includes(action)) {
                    menuItem.style.display = itemType === 'topic' ? 'flex' : 'none';
                }
                // 建立連結功能對所有項目可用
                else if (action === 'add-link') {
                    menuItem.style.display = 'flex';
                }
            });

            // 更新收藏按鈕文字
            const favoriteItem = menu.querySelector('[data-action="toggle-favorite"]');
            if (favoriteItem) {
                const favoritesHandlers = this.context.getFavoritesHandlers();
                const isFavorited = favoritesHandlers.isFavorite(itemPath);
                favoriteItem.textContent = isFavorited ? '💔 取消收藏' : '❤️ 加入收藏';
            }
        }

        /**
         * 定位選單到滑鼠位置（私有方法）
         */
        _positionMenu(menu, e) {
            menu.style.display = 'block';
            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;

            // 確保選單不會超出視窗邊界
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = `${window.innerWidth - rect.width - 10}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = `${window.innerHeight - rect.height - 10}px`;
            }
        }

        /**
         * 綁定選單事件（私有方法）
         */
        _attachMenuEvents(menu) {
            // 只綁定一次
            if (menu.dataset.eventsAttached) return;

            const menuItems = menu.querySelectorAll('.context-menu-item');
            menuItems.forEach(menuItem => {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleContextMenuAction(menuItem.dataset.action);
                });
            });

            // 點擊選單外部關閉選單
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    this.closeContextMenu();
                }
            });

            menu.dataset.eventsAttached = 'true';
        }

        /**
         * 處理右鍵選單動作（私有方法）
         */
        _handleContextMenuAction(action) {
            const menu = document.getElementById('context-menu');
            if (!menu) return;

            const itemType = menu.dataset.itemType;
            const itemPath = menu.dataset.itemPath;

            if (!itemType || !itemPath) return;

            // 關閉選單
            this.closeContextMenu();

            // 執行對應動作
            switch (action) {
                case 'edit':
                    this._handleEdit(itemType, itemPath);
                    break;

                case 'delete':
                    this._handleDelete(itemType, itemPath);
                    break;

                case 'add-template':
                    this._handleAddTemplate(itemType, itemPath);
                    break;

                case 'add-topic':
                    this._handleAddTopic(itemType, itemPath);
                    break;

                case 'add-link':
                    this._handleAddLink(itemType, itemPath);
                    break;

                case 'copy':
                    this._handleCopy(itemType, itemPath);
                    break;

                case 'toggle-favorite':
                    this._handleToggleFavorite(itemPath);
                    break;
            }
        }

        /**
         * 處理編輯動作
         */
        _handleEdit(itemType, itemPath) {
            if (itemType === 'topic') {
                this.context.getTopicHandlers().editTopic(itemPath);
            } else if (itemType === 'template') {
                this.context.getTemplateHandlers().editTemplate(itemPath);
            } else if (itemType === 'link') {
                const linkName = itemPath.split('/links/').pop();
                this.context.getLinkHandlers().editLink(linkName);
            }
        }

        /**
         * 處理刪除動作
         */
        _handleDelete(itemType, itemPath) {
            if (itemType === 'topic') {
                this.context.getTopicHandlers().deleteTopic(itemPath);
            } else if (itemType === 'template') {
                this.context.getTemplateHandlers().deleteTemplate(itemPath);
            } else if (itemType === 'link') {
                const linkName = itemPath.split('/links/').pop();
                this.context.getLinkHandlers().deleteLink(linkName);
            }
        }

        /**
         * 處理新增模板動作
         */
        _handleAddTemplate(itemType, itemPath) {
            if (itemType === 'topic') {
                // 在主題中新增模板，預填主題路徑
                this.context.openModal('template', null, { topicPath: itemPath });
            }
        }

        /**
         * 處理新增子主題動作
         */
        _handleAddTopic(itemType, itemPath) {
            if (itemType === 'topic') {
                // 創建子主題，預填父主題路徑
                this.context.openModal('topic', null, { parentPath: itemPath });
            }
        }

        /**
         * 處理建立連結動作
         */
        _handleAddLink(itemType, itemPath) {
            // 打開連結模態框，預填目標路徑
            let targetPath = itemPath;

            // 如果選擇的項目是連結，則使用連結的目標路徑
            if (itemType === 'link') {
                const linkName = itemPath.split('/links/').pop();
                const link = this.context.findLinkByName(linkName);
                if (link && link.target) {
                    targetPath = link.target;
                }
            }

            this.context.openModal('link', null, { targetPath: targetPath });
        }

        /**
         * 處理複製動作
         */
        _handleCopy(itemType, itemPath) {
            if (itemType === 'topic') {
                this.context.getTopicHandlers().copyTopic(itemPath);
            } else if (itemType === 'template') {
                this.context.getTemplateHandlers().copyTemplate(itemPath);
            } else if (itemType === 'link') {
                this.context.getLinkHandlers().copyLink(itemPath);
            }
        }

        /**
         * 處理切換收藏動作
         */
        _handleToggleFavorite(itemPath) {
            this.context.getFavoritesHandlers().toggleFavorite(itemPath);
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ContextMenuHandler;
    } else {
        window.ContextMenuHandler = ContextMenuHandler;
    }
})();
