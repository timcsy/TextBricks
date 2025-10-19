// Tooltip Manager - 工具提示管理器
// 負責處理模板預覽工具提示的顯示、隱藏和交互

(function() {
    'use strict';

    /**
     * Tooltip Manager 類
     * 處理模板預覽工具提示的完整生命週期
     */
    class TooltipManager {
        constructor(context) {
            this.context = context;

            // Tooltip state
            this.currentTooltip = null;
            this.tooltipTimeout = null;
            this.tooltipHideTimeout = null;
            this.isTooltipHovered = false;
            this.isPreviewBtnHovered = false;
            this.currentPreviewBtn = null;
        }

        /**
         * 處理鼠標進入事件
         */
        handleMouseEnter(event) {
            // Check if event.target is a DOM element
            if (!event.target || typeof event.target.closest !== 'function') {
                return;
            }

            const previewBtn = event.target.closest('.preview-btn');
            const tooltip = event.target.closest('.template-tooltip');

            if (tooltip) {
                // Mouse entered tooltip - cancel hide timeout
                this.isTooltipHovered = true;
                if (this.tooltipHideTimeout) {
                    clearTimeout(this.tooltipHideTimeout);
                    this.tooltipHideTimeout = null;
                }
                return;
            }

            if (!previewBtn) return;

            const templateCard = previewBtn.closest('.template-card');
            if (!templateCard) return;

            // Hide any existing tooltip
            if (this.currentTooltip && this.currentPreviewBtn !== previewBtn) {
                this.hideTooltip();
            }

            this.currentPreviewBtn = previewBtn;
            this.isPreviewBtnHovered = true;

            // Clear any existing timeout
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            // Show tooltip after delay
            this.tooltipTimeout = setTimeout(() => {
                if (this.isPreviewBtnHovered && this.currentPreviewBtn === previewBtn) {
                    this.showTooltip(templateCard, previewBtn);
                }
            }, 300);
        }

        /**
         * 處理鼠標離開事件
         */
        handleMouseLeave(event) {
            // Check if event.target is a DOM element
            if (!event.target || typeof event.target.closest !== 'function') {
                return;
            }

            const previewBtn = event.target.closest('.preview-btn');
            const tooltip = event.target.closest('.template-tooltip');

            if (tooltip) {
                // Only handle tooltip leave events - ignore all other events inside tooltip
                return;
            }

            if (!previewBtn) return;

            // Mouse left preview button
            this.isPreviewBtnHovered = false;
            this.currentPreviewBtn = null;

            // Clear show timeout
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }

            // Only hide if not hovering tooltip
            if (!this.isTooltipHovered) {
                this.scheduleHideTooltip();
            }
        }

        /**
         * 排程隱藏工具提示
         */
        scheduleHideTooltip() {
            if (this.tooltipHideTimeout) {
                clearTimeout(this.tooltipHideTimeout);
            }

            this.tooltipHideTimeout = setTimeout(() => {
                // Only hide if mouse is not over tooltip or preview button
                if (!this.isTooltipHovered && !this.isPreviewBtnHovered) {
                    this.hideTooltip();
                } else {
                    // Reschedule check if still hovering
                    this.scheduleHideTooltip();
                }
            }, 200);
        }

        /**
         * 顯示工具提示
         */
        showTooltip(templateCard, previewBtn) {
            // Force hide any existing tooltip first to prevent stacking
            if (this.currentTooltip) {
                this.forceHideTooltip();
            }

            const templatePath = templateCard.dataset.templatePath;
            const templateCode = templateCard.dataset.templateCode;

            // Get utility functions
            const escapeHtml = this.context.getUtils().escapeHtml || (text => text);
            const supportsDrag = this.context.getSupportsDrag();

            // Safe element queries with null checks (support both CSS selector formats)
            const titleElement = templateCard.querySelector('.card-title, .template-title');
            const descriptionElement = templateCard.querySelector('.card-description, .template-description');
            const languageElement = templateCard.querySelector('.language-tag');

            if (!titleElement || !descriptionElement) {
                console.error('Missing required template card elements:', {
                    title: !!titleElement,
                    description: !!descriptionElement,
                    language: !!languageElement,
                    templateCard
                });
                return;
            }

            const title = titleElement.textContent;
            const description = descriptionElement.textContent;
            const languageTag = languageElement ? languageElement.textContent : '';

            // Check if template has documentation
            const hasDocumentation = templateCard.dataset.hasDocumentation === 'true';

            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'template-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <div class="tooltip-title-wrapper">
                        <div class="tooltip-title">${escapeHtml(title)}</div>
                        <div class="tooltip-actions">
                            ${hasDocumentation ? `<button class="tooltip-action-btn doc-btn" data-template-path="${templatePath}" title="查看說明文檔">📖 說明</button>` : ''}
                            <button class="tooltip-action-btn insert-all-btn" data-template-path="${templatePath}">＋ 插入</button>
                            <button class="tooltip-action-btn copy-all-btn" data-template-path="${templatePath}">📋 複製</button>
                            ${supportsDrag ? `<div class="tooltip-drag-handle" draggable="true" data-template-path="${templatePath}" title="拖曳到編輯器">✋ 拖曳</div>` : ''}
                        </div>
                    </div>
                    <button class="tooltip-close" title="關閉">✕</button>
                </div>
                <div class="tooltip-description">${escapeHtml(description)}</div>
                <div class="tooltip-code">
                    <pre><code>${escapeHtml(templateCode)}</code></pre>
                </div>
                <div class="tooltip-footer">
                    ${languageTag ? `<span class="language-tag">${languageTag}</span>` : ''}
                    <span class="tooltip-hint">可選取文字複製 • 可滾動查看</span>
                </div>
            `;

            // Position tooltip using fixed positioning relative to preview button
            const rect = previewBtn.getBoundingClientRect();

            // Add to body first to measure actual size
            document.body.appendChild(tooltip);

            // Force layout to get actual dimensions
            tooltip.offsetHeight;
            const tooltipRect = tooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width;
            const tooltipHeight = tooltipRect.height;

            // Calculate position relative to viewport, positioned from the preview button
            let left = rect.right + 10;
            let top = rect.top;

            // Adjust if tooltip would go beyond screen horizontally
            if (left + tooltipWidth > window.innerWidth - 20) {
                // Try positioning to the left of the button
                left = rect.left - tooltipWidth - 10;
                // If still doesn't fit, position at right edge of screen
                if (left < 10) {
                    left = window.innerWidth - tooltipWidth - 20;
                }
            }

            // Adjust if tooltip would go beyond screen vertically
            if (top + tooltipHeight > window.innerHeight - 20) {
                // Position at bottom edge of screen
                top = window.innerHeight - tooltipHeight - 20;
            }

            // Final bounds checking to ensure tooltip stays within screen
            left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 20));
            top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 20));

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';

            // Add event listeners to tooltip
            this.setupTooltipEventListeners(tooltip, templatePath, templateCode);

            // Show tooltip with animation
            requestAnimationFrame(() => {
                tooltip.classList.add('visible');
            });

            this.currentTooltip = tooltip;

            console.log('Show tooltip for:', templatePath);
        }

        /**
         * 隱藏工具提示
         */
        hideTooltip() {
            if (this.currentTooltip) {
                this.currentTooltip.remove();
                this.currentTooltip = null;
            }

            // Reset states
            this.isTooltipHovered = false;
            this.isPreviewBtnHovered = false;
            this.currentPreviewBtn = null;

            // Clear timeouts
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
            if (this.tooltipHideTimeout) {
                clearTimeout(this.tooltipHideTimeout);
                this.tooltipHideTimeout = null;
            }
        }

        /**
         * 強制隱藏所有工具提示
         */
        forceHideTooltip() {
            // Remove all tooltips from DOM
            document.querySelectorAll('.template-tooltip').forEach(tooltip => tooltip.remove());

            // Reset all states
            this.currentTooltip = null;
            this.isTooltipHovered = false;
            this.isPreviewBtnHovered = false;
            this.currentPreviewBtn = null;

            // Clear all timeouts
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
            if (this.tooltipHideTimeout) {
                clearTimeout(this.tooltipHideTimeout);
                this.tooltipHideTimeout = null;
            }
        }

        /**
         * 設置工具提示事件監聽器
         */
        setupTooltipEventListeners(tooltip, templatePath, templateCode) {
            const templateOps = this.context.getTemplateOperations();
            const dragDropHandler = this.context.getDragDropHandler();
            const vscode = this.context.getVSCode();
            const supportsDrag = this.context.getSupportsDrag();

            // Handle close button
            const closeBtn = tooltip.querySelector('.tooltip-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.forceHideTooltip();
            });

            // Handle insert button
            const insertBtn = tooltip.querySelector('.insert-all-btn');

            // Store selected text before any click events might clear it
            let storedSelection = null;

            // Capture selection on mousedown (before click clears it)
            insertBtn.addEventListener('mousedown', (e) => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                storedSelection = selectedText;
                console.log(`[DEBUG] Mousedown - stored selection: "${selectedText}"`);
            });

            insertBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templatePath = e.target.dataset.templatePath;

                // Use stored selection or check current selection
                const selection = window.getSelection();
                const currentSelectedText = selection.toString().trim();
                const selectedText = storedSelection || currentSelectedText;

                console.log(`[DEBUG] Insert button clicked for template: ${templatePath}`);
                console.log(`[DEBUG] Stored selection: "${storedSelection}"`);
                console.log(`[DEBUG] Current selection: "${currentSelectedText}"`);
                console.log(`[DEBUG] Final selected text: "${selectedText}"`);
                console.log(`[DEBUG] Selected text length:`, selectedText.length);

                if (selectedText && selectedText.length > 0) {
                    // Insert selected text
                    templateOps.insertCodeSnippet(selectedText, templatePath);
                    console.log('[DEBUG] Inserting selected code snippet:', selectedText.substring(0, 50) + '...');
                } else {
                    // Insert entire template
                    templateOps.insertTemplate(templatePath);
                    console.log('[DEBUG] Inserting entire template:', templatePath);
                }

                // 使用次數已由後端 insertTemplate/insertCodeSnippet 自動記錄

                // Clear stored selection
                storedSelection = null;

                // Visual feedback
                insertBtn.textContent = '✅ 已插入';
                insertBtn.classList.add('success');
                setTimeout(() => {
                    insertBtn.textContent = '＋ 插入';
                    insertBtn.classList.remove('success');
                }, 2000);
            });

            // Handle copy button - similar logic to insert button for selected text
            const copyBtn = tooltip.querySelector('.copy-all-btn');

            // Capture selection on mousedown (before click clears it)
            copyBtn.addEventListener('mousedown', (e) => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                storedSelection = selectedText;
                console.log(`[DEBUG] Copy mousedown - stored selection: "${selectedText}"`);
            });

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templatePath = e.target.dataset.templatePath;

                // Use stored selection or check current selection
                const selection = window.getSelection();
                const currentSelectedText = selection.toString().trim();
                const selectedText = storedSelection || currentSelectedText;

                console.log(`[DEBUG] Copy button clicked for template: ${templatePath}`);
                console.log(`[DEBUG] Stored selection: "${storedSelection}"`);
                console.log(`[DEBUG] Current selection: "${currentSelectedText}"`);
                console.log(`[DEBUG] Final selected text: "${selectedText}"`);
                console.log(`[DEBUG] Selected text length:`, selectedText.length);

                if (selectedText && selectedText.length > 0) {
                    // Copy selected text
                    templateOps.copyCodeSnippet(selectedText, templatePath);
                    console.log('[DEBUG] Copying selected code snippet:', selectedText.substring(0, 50) + '...');
                } else {
                    // Copy entire template
                    templateOps.copyTemplate(templatePath);
                    console.log('[DEBUG] Copying entire template:', templatePath);
                }

                // Clear stored selection
                storedSelection = null;

                // Visual feedback
                copyBtn.textContent = '✅ 已複製';
                copyBtn.classList.add('success');
                setTimeout(() => {
                    copyBtn.textContent = '📋 複製';
                    copyBtn.classList.remove('success');
                }, 2000);
            });

            // Handle documentation button
            const docBtn = tooltip.querySelector('.doc-btn');
            if (docBtn) {
                docBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const templatePath = e.target.dataset.templatePath;
                    templateOps.showDocumentation(templatePath);

                    // Visual feedback
                    const originalText = docBtn.textContent;
                    docBtn.textContent = '📖 開啟中...';
                    docBtn.style.opacity = '0.7';
                    setTimeout(() => {
                        docBtn.textContent = originalText;
                        docBtn.style.opacity = '';
                    }, 1000);
                });
            }

            // Handle drag handle (only if drag is supported)
            if (supportsDrag) {
                const dragHandle = tooltip.querySelector('.tooltip-drag-handle');
                if (dragHandle) {
                    dragHandle.addEventListener('dragstart', (e) => {
                        if (templatePath && templateCode) {
                            // Update drag drop handler state
                            dragDropHandler.isDragging = true;
                            dragDropHandler.draggedTemplateId = templatePath;

                            try {
                                // Set drag data with better browser compatibility
                                e.dataTransfer.effectAllowed = 'copy';
                                e.dataTransfer.setData('text/plain', templateCode);
                                e.dataTransfer.setData('text', templateCode); // Fallback

                                try {
                                    e.dataTransfer.setData('application/vscode-template', JSON.stringify({
                                        id: templatePath,
                                        code: templateCode
                                    }));
                                } catch (err) {
                                    console.warn('Custom MIME type not supported in tooltip drag');
                                }

                                // Visual feedback
                                dragHandle.style.opacity = '0.5';

                                // Notify extension about drag start for smart indentation
                                vscode.postMessage({
                                    type: 'dragTemplate',
                                    templatePath: templatePath,
                                    text: templateCode
                                });

                                console.log('Started dragging from tooltip drag handle:', templatePath);

                            } catch (error) {
                                console.error('Tooltip drag failed:', error);
                                e.preventDefault();
                            }
                        }
                    });

                    dragHandle.addEventListener('dragend', (e) => {
                        // Reset visual feedback
                        dragHandle.style.opacity = '';

                        // 如果拖曳成功完成（dropEffect 不是 'none'），則更新使用次數
                        if (e.dataTransfer && e.dataTransfer.dropEffect !== 'none') {
                            console.log('Tooltip drag successful, incrementing usage for:', templatePath);
                            vscode.postMessage({
                                type: 'incrementUsage',
                                templatePath: templatePath
                            });
                        }

                        // Reset drag drop handler state
                        dragDropHandler.isDragging = false;
                        dragDropHandler.draggedTemplateId = null;

                        console.log('Ended dragging from tooltip drag handle');
                    });
                }
            }

            // Handle text selection in code area
            const codeArea = tooltip.querySelector('.tooltip-code');

            // Allow all interactions inside code area without closing tooltip
            codeArea.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            codeArea.addEventListener('mouseup', (e) => {
                e.stopPropagation();
            });

            codeArea.addEventListener('selectstart', (e) => {
                e.stopPropagation();
            });

            // Handle copy operation for selected text in code area
            codeArea.addEventListener('copy', (e) => {
                // Get selected text
                const selection = window.getSelection();
                if (selection && selection.toString().trim()) {
                    e.preventDefault();

                    const selectedText = selection.toString();

                    // Find the template ID - look for it in the tooltip or parent elements
                    let templatePath = null;

                    // Debug: log the codeArea and its context
                    console.log('[DEBUG] codeArea:', codeArea);
                    console.log('[DEBUG] codeArea parent:', codeArea.parentElement);
                    console.log('[DEBUG] codeArea closest tooltip:', codeArea.closest('.tooltip'));

                    // First try to find from parent elements with data-template-path
                    const parentWithTemplateId = codeArea.closest('[data-template-path]');
                    if (parentWithTemplateId) {
                        templatePath = parentWithTemplateId.getAttribute('data-template-path');
                        console.log('[DEBUG] Found templatePath from parent:', templatePath);
                    }

                    // If not found, look in the tooltip for any element with data-template-path
                    if (!templatePath) {
                        const tooltipElement = codeArea.closest('.template-tooltip');
                        console.log('[DEBUG] Found tooltip element:', tooltipElement);
                        if (tooltipElement) {
                            const templateElements = tooltipElement.querySelectorAll('[data-template-path]');
                            console.log('[DEBUG] Template elements in tooltip:', templateElements);
                            if (templateElements.length > 0) {
                                templatePath = templateElements[0].getAttribute('data-template-path');
                                console.log('[DEBUG] Found templatePath from tooltip:', templatePath);
                            }
                        }
                    }

                    console.log('[DEBUG] Final templatePath:', templatePath);

                    // Send to extension for smart indentation processing
                    vscode.postMessage({
                        type: 'copyCodeSnippet',
                        code: selectedText,
                        templatePath: templatePath
                    });

                    console.log('Copy selected code snippet with smart indentation:', selectedText.substring(0, 50) + '...', 'from template:', templatePath);
                }
                // If no text is selected, let the default copy behavior happen
            });

            // Handle keyboard shortcuts for copy in code area
            codeArea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    const selection = window.getSelection();
                    if (selection && selection.toString().trim()) {
                        e.preventDefault();

                        const selectedText = selection.toString();

                        // Find the template ID - look for it in the tooltip or parent elements
                        let templatePath = null;

                        // First try to find from parent elements with data-template-path
                        const parentWithTemplateId = codeArea.closest('[data-template-path]');
                        if (parentWithTemplateId) {
                            templatePath = parentWithTemplateId.getAttribute('data-template-path');
                        }

                        // If not found, look in the tooltip for any element with data-template-path
                        if (!templatePath) {
                            const tooltipElement = codeArea.closest('.template-tooltip');
                            if (tooltipElement) {
                                const templateElements = tooltipElement.querySelectorAll('[data-template-path]');
                                if (templateElements.length > 0) {
                                    templatePath = templateElements[0].getAttribute('data-template-path');
                                }
                            }
                        }

                        // Send to extension for smart indentation processing
                        vscode.postMessage({
                            type: 'copyCodeSnippet',
                            code: selectedText,
                            templatePath: templatePath
                        });

                        console.log('Copy selected code snippet via keyboard:', selectedText.substring(0, 50) + '...', 'from template:', templatePath);
                    }
                    // If no text is selected, let the default behavior happen
                }
            });

            // Ensure tooltip hover state is properly maintained
            tooltip.addEventListener('mouseenter', () => {
                this.isTooltipHovered = true;
                if (this.tooltipHideTimeout) {
                    clearTimeout(this.tooltipHideTimeout);
                    this.tooltipHideTimeout = null;
                }
            });

            tooltip.addEventListener('mouseleave', () => {
                this.isTooltipHovered = false;
                this.scheduleHideTooltip();
            });

            // Prevent tooltip from closing when interacting inside
            tooltip.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            tooltip.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        }

        /**
         * 獲取當前工具提示
         */
        getCurrentTooltip() {
            return this.currentTooltip;
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TooltipManager;
    } else {
        window.TooltipManager = TooltipManager;
    }
})();
