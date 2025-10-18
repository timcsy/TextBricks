// Tree Navigation Handler - 樹狀導航處理器
// 負責處理樹狀結構的鍵盤導航和展開/摺疊

(function() {
    'use strict';

    /**
     * Tree Navigation Handler 類
     * 處理樹狀視圖的導航操作
     */
    class TreeNavigationHandler {
        constructor(context) {
            this.context = context;
        }

        /**
         * 獲取下一個樹項目
         */
        getNextTreeItem(selected) {
            const allItems = Array.from(document.querySelectorAll('.tree-item'));
            const currentIndex = allItems.indexOf(selected);
            return currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
        }

        /**
         * 獲取上一個樹項目
         */
        getPreviousTreeItem(selected) {
            const allItems = Array.from(document.querySelectorAll('.tree-item'));
            const currentIndex = allItems.indexOf(selected);
            return currentIndex > 0 ? allItems[currentIndex - 1] : null;
        }

        /**
         * 展開樹節點
         */
        expandTreeNode(selected) {
            const node = selected.closest('.tree-node');
            const toggle = node?.querySelector('.tree-toggle');
            const children = node?.querySelector('.tree-children');

            if (toggle && children && toggle.classList.contains('collapsed')) {
                toggle.classList.remove('collapsed');
                toggle.classList.add('expanded');
                children.style.display = 'block';
            }
        }

        /**
         * 摺疊樹節點
         */
        collapseTreeNode(selected) {
            const node = selected.closest('.tree-node');
            const toggle = node?.querySelector('.tree-toggle');
            const children = node?.querySelector('.tree-children');

            if (toggle && children && toggle.classList.contains('expanded')) {
                toggle.classList.remove('expanded');
                toggle.classList.add('collapsed');
                children.style.display = 'none';
            }
        }

        /**
         * 切換樹節點展開/摺疊狀態
         */
        toggleTreeNode(selected) {
            const node = selected.closest('.tree-node');
            const toggle = node?.querySelector('.tree-toggle');
            const children = node?.querySelector('.tree-children');

            if (!toggle || !children) return;

            const isExpanded = toggle.classList.contains('expanded');

            if (isExpanded) {
                this.collapseTreeNode(selected);
            } else {
                this.expandTreeNode(selected);
            }
        }

        /**
         * 展開所有節點
         */
        expandAll() {
            const allToggles = document.querySelectorAll('.tree-toggle.collapsed');
            allToggles.forEach(toggle => {
                const node = toggle.closest('.tree-node');
                const children = node?.querySelector('.tree-children');

                if (children) {
                    toggle.classList.remove('collapsed');
                    toggle.classList.add('expanded');
                    children.style.display = 'block';
                }
            });
        }

        /**
         * 摺疊所有節點
         */
        collapseAll() {
            const allToggles = document.querySelectorAll('.tree-toggle.expanded');
            allToggles.forEach(toggle => {
                const node = toggle.closest('.tree-node');
                const children = node?.querySelector('.tree-children');

                if (children) {
                    toggle.classList.remove('expanded');
                    toggle.classList.add('collapsed');
                    children.style.display = 'none';
                }
            });
        }

        /**
         * 滾動到指定項目
         */
        scrollToItem(item) {
            if (item) {
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        /**
         * 選擇樹項目
         */
        selectTreeItem(item) {
            // 移除所有選中狀態
            document.querySelectorAll('.tree-item.selected').forEach(i => {
                i.classList.remove('selected');
            });

            // 添加選中狀態
            if (item) {
                item.classList.add('selected');
                this.scrollToItem(item);
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TreeNavigationHandler;
    } else {
        window.TreeNavigationHandler = TreeNavigationHandler;
    }
})();
