// Drag Drop Handler - 拖放處理器
// 負責處理模板卡片的拖放功能

(function() {
    'use strict';

    /**
     * Drag Drop Handler 類
     * 處理模板拖放相關操作
     */
    class DragDropHandler {
        constructor(context) {
            this.context = context;
            // 拖放狀態
            this.isDragging = false;
            this.draggedTemplateId = null;
        }

        /**
         * 處理拖放開始
         */
        handleDragStart(event) {
            const templateCard = event.target.closest('.template-card');
            if (!templateCard) return;

            // Check if drag is supported in current environment
            const supportsDrag = this.context.getSupportsDrag();
            if (!supportsDrag) {
                event.preventDefault();
                return false;
            }

            const templatePath = templateCard.dataset.templatePath;
            const templateCode = templateCard.dataset.templateCode;

            if (templatePath && templateCode) {
                this.isDragging = true;
                this.draggedTemplateId = templatePath;

                try {
                    // Set drag data with better browser compatibility
                    if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed = 'copy';

                        // Set data in multiple formats for compatibility
                        event.dataTransfer.setData('text/plain', templateCode);
                        event.dataTransfer.setData('text', templateCode); // Fallback format

                        try {
                            event.dataTransfer.setData('application/vscode-template', JSON.stringify({
                                id: templatePath,
                                code: templateCode
                            }));
                        } catch (e) {
                            console.warn('Custom MIME type not supported, using text/plain only');
                        }

                        // Visual feedback
                        templateCard.classList.add('dragging');

                        // Set drag image with error handling
                        try {
                            const dragImage = this.createDragImage(templateCard);
                            event.dataTransfer.setDragImage(dragImage, 10, 10);
                        } catch (e) {
                            console.warn('Custom drag image not supported');
                        }
                    }

                    // Notify extension about drag start for smart indentation
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'dragTemplate',
                        templatePath: templatePath,
                        text: templateCode
                    });

                    console.log('Started dragging template:', templatePath);

                } catch (error) {
                    console.error('Drag start failed:', error);
                    event.preventDefault();
                    return false;
                }
            }
        }

        /**
         * 處理拖放結束
         */
        handleDragEnd(event) {
            const templateCard = event.target.closest('.template-card');
            if (templateCard) {
                templateCard.classList.remove('dragging');
            }

            this.isDragging = false;
            this.draggedTemplateId = null;

            console.log('Ended dragging template');
        }

        /**
         * 創建拖放圖像
         */
        createDragImage(templateCard) {
            const dragImage = templateCard.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '-1000px';
            dragImage.style.width = templateCard.offsetWidth + 'px';
            dragImage.style.opacity = '0.8';
            dragImage.style.transform = 'rotate(2deg)';
            dragImage.style.pointerEvents = 'none';

            document.body.appendChild(dragImage);

            // Clean up after a short delay
            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 1000);

            return dragImage;
        }

        /**
         * 獲取拖放狀態
         */
        getIsDragging() {
            return this.isDragging;
        }

        /**
         * 獲取拖放的模板 ID
         */
        getDraggedTemplateId() {
            return this.draggedTemplateId;
        }

        /**
         * 重置拖放狀態
         */
        resetDragState() {
            this.isDragging = false;
            this.draggedTemplateId = null;

            // Remove dragging visual state
            const draggingCard = document.querySelector('.template-card.dragging');
            if (draggingCard) {
                draggingCard.classList.remove('dragging');
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DragDropHandler;
    } else {
        window.DragDropHandler = DragDropHandler;
    }
})();
