// TextBricks Webview JavaScript

(function() {
    const vscode = acquireVsCodeApi();

    // Track drag state
    let isDragging = false;
    let draggedTemplateId = null;
    
    // Track tooltip state
    let currentTooltip = null;
    let tooltipTimeout = null;
    let tooltipHideTimeout = null;
    let isTooltipHovered = false;
    let isPreviewBtnHovered = false;
    let currentPreviewBtn = null;

    // Environment detection
    const isCodespaces = checkCodespacesEnvironment();
    const supportsDrag = checkDragSupport();

    function checkCodespacesEnvironment() {
        // Check for GitHub Codespaces indicators
        return !!(
            typeof window !== 'undefined' && 
            (window.location?.hostname?.includes('github') ||
             window.location?.hostname?.includes('codespaces') ||
             window.navigator?.userAgent?.includes('Codespaces') ||
             document?.documentElement?.getAttribute('data-vscode-context') === 'codespace')
        );
    }

    function checkDragSupport() {
        // Test basic drag support
        try {
            const testDiv = document.createElement('div');
            testDiv.draggable = true;
            return 'draggable' in testDiv && 
                   'ondragstart' in testDiv && 
                   'ondrop' in testDiv &&
                   !isCodespaces; // Disable drag in Codespaces even if technically supported
        } catch (e) {
            return false;
        }
    }

    // Initialize the webview
    function initialize() {
        setupEventListeners();
        setupEnvironmentSpecificFeatures();
        console.log(`TextBricks webview initialized (Codespaces: ${isCodespaces}, Drag Support: ${supportsDrag})`);
    }

    function setupEnvironmentSpecificFeatures() {
        // Add visual indicators for Codespaces users
        if (isCodespaces) {
            addCodespacesIndicators();
            console.log('Codespaces environment detected - double-click to insert templates');
        }
        
        // Disable draggable attribute if drag is not supported
        if (!supportsDrag) {
            setTimeout(() => {
                document.querySelectorAll('.template-card[draggable="true"]').forEach(card => {
                    card.draggable = false;
                    card.style.cursor = 'pointer'; // Change cursor to indicate click action
                });
            }, 100);
        }
    }

    function addCodespacesIndicators() {
        // Add a subtle indicator to template cards
        const style = document.createElement('style');
        style.textContent = `
            .template-card:not([draggable="true"])::before {
                content: "👆 雙擊插入";
                position: absolute;
                top: 4px;
                right: 4px;
                font-size: 10px;
                background: rgba(0, 123, 255, 0.8);
                color: white;
                padding: 1px 4px;
                border-radius: 3px;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
                z-index: 10;
            }
            
            .template-card:not([draggable="true"]):hover::before {
                opacity: 1;
            }
            
            .codespaces-tip {
                background: #e3f2fd;
                border-left: 3px solid #2196f3;
                padding: 8px 12px;
                margin: 8px;
                border-radius: 4px;
                font-size: 12px;
                color: #1565c0;
            }
        `;
        document.head.appendChild(style);
        
        // Add a tip at the top of the panel
        setTimeout(() => {
            const container = document.querySelector('.templates-container') || document.body;
            const tip = document.createElement('div');
            tip.className = 'codespaces-tip';
            tip.innerHTML = '💡 <strong>Codespaces 提示：</strong>由於瀏覽器限制，請<strong>雙擊</strong>模板卡片來插入程式碼';
            container.insertBefore(tip, container.firstChild);
        }, 500);
    }

    function setupEventListeners() {
        // Handle template card interactions
        document.addEventListener('click', handleClick);
        
        // Handle drag and drop
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('dragend', handleDragEnd);
        
        // Handle button clicks
        document.addEventListener('click', handleButtonClick);
        
        // Handle category collapse/expand
        document.addEventListener('click', handleCategoryToggle);
        
        // Handle tooltip on preview buttons only
        document.addEventListener('mouseenter', handleMouseEnter, true);
        document.addEventListener('mouseleave', handleMouseLeave, true);
        
        // Handle global clicks to hide tooltip
        document.addEventListener('click', handleGlobalClick);
        
        // Handle language selection
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', handleLanguageChange);
        }
        
        // Keep tooltips open even on window blur - only close on mouse leave
    }

    function handleClick(event) {
        const templateCard = event.target.closest('.template-card');
        if (!templateCard) return;

        // Prevent default behavior for button clicks
        if (event.target.closest('.action-btn')) {
            return;
        }

        const templateId = templateCard.dataset.templateId;
        if (templateId) {
            // Single click - copy template
            copyTemplate(templateId);
            
            // Visual feedback
            templateCard.style.animation = 'none';
            setTimeout(() => {
                templateCard.style.animation = 'templateInsert 0.3s ease';
            }, 10);
        }
    }


    function showInsertionFeedback(templateCard, message) {
        const feedback = document.createElement('div');
        feedback.className = 'insertion-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4caf50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
        `;
        
        templateCard.style.position = 'relative';
        templateCard.appendChild(feedback);
        
        // Animate in
        setTimeout(() => feedback.style.opacity = '1', 10);
        
        // Remove after delay
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 200);
        }, 1500);
    }

    function handleButtonClick(event) {
        if (!event.target.closest('.action-btn')) return;
        
        event.stopPropagation(); // Prevent card click
        
        const button = event.target.closest('.action-btn');
        const templateCard = button.closest('.template-card');
        const templateId = templateCard.dataset.templateId;
        
        if (button.classList.contains('insert-btn')) {
            insertTemplate(templateId);
            // Visual feedback for insert button
            const icon = button.querySelector('.icon');
            const originalText = icon.textContent;
            icon.textContent = '✅';
            setTimeout(() => {
                icon.textContent = originalText;
            }, 1000);
        } else if (button.classList.contains('doc-btn')) {
            showDocumentation(templateId);
            // Visual feedback for documentation button
            const icon = button.querySelector('.icon');
            const originalText = icon.textContent;
            icon.textContent = '📖';
            button.style.opacity = '0.7';
            setTimeout(() => {
                icon.textContent = originalText;
                button.style.opacity = '';
            }, 1000);
        }
    }

    function handleDragStart(event) {
        const templateCard = event.target.closest('.template-card');
        if (!templateCard) return;

        // Check if drag is supported in current environment
        if (!supportsDrag) {
            event.preventDefault();
            console.log('Drag not supported - use double-click instead');
            
            // Show helpful message
            showInsertionFeedback(templateCard, '💡 請雙擊插入模板');
            return false;
        }

        const templateId = templateCard.dataset.templateId;
        const templateCode = templateCard.dataset.templateCode;
        
        if (templateId && templateCode) {
            isDragging = true;
            draggedTemplateId = templateId;
            
            try {
                // Set drag data with better browser compatibility
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'copy';
                    
                    // Set data in multiple formats for compatibility
                    event.dataTransfer.setData('text/plain', templateCode);
                    event.dataTransfer.setData('text', templateCode); // Fallback format
                    
                    try {
                        event.dataTransfer.setData('application/vscode-template', JSON.stringify({
                            id: templateId,
                            code: templateCode
                        }));
                    } catch (e) {
                        console.warn('Custom MIME type not supported, using text/plain only');
                    }
                    
                    // Visual feedback
                    templateCard.classList.add('dragging');
                    
                    // Set drag image with error handling
                    try {
                        const dragImage = createDragImage(templateCard);
                        event.dataTransfer.setDragImage(dragImage, 10, 10);
                    } catch (e) {
                        console.warn('Custom drag image not supported');
                    }
                }
                
                // Notify extension about drag start
                vscode.postMessage({
                    type: 'dragTemplate',
                    templateId: templateId,
                    text: templateCode
                });
                
                console.log('Started dragging template:', templateId);
                
            } catch (error) {
                console.error('Drag start failed:', error);
                event.preventDefault();
                showInsertionFeedback(templateCard, '❌ 拖曳失敗，請使用複製');
                return false;
            }
        }
    }

    function handleDragEnd(event) {
        const templateCard = event.target.closest('.template-card');
        if (templateCard) {
            templateCard.classList.remove('dragging');
        }
        
        isDragging = false;
        draggedTemplateId = null;
        
        console.log('Ended dragging template');
    }

    function createDragImage(templateCard) {
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

    function copyTemplate(templateId) {
        vscode.postMessage({
            type: 'copyTemplate',
            templateId: templateId
        });
        
        console.log('Copy template:', templateId);
    }

    function insertTemplate(templateId) {
        vscode.postMessage({
            type: 'insertTemplate',
            templateId: templateId
        });
        
        console.log('Insert template:', templateId);
    }

    function insertCodeSnippet(code, templateId) {
        vscode.postMessage({
            type: 'insertCodeSnippet',
            code: code,
            templateId: templateId
        });
        
        console.log('Insert code snippet with template context:', code.substring(0, 50) + '...', 'from template:', templateId);
    }

    function showDocumentation(templateId) {
        vscode.postMessage({
            type: 'showDocumentation',
            templateId: templateId
        });
        
        console.log('Show documentation for template:', templateId);
    }

    function handleLanguageChange(event) {
        const selectedLanguage = event.target.value;
        
        // Hide any open tooltips when language changes
        if (currentTooltip) {
            forceHideTooltip();
        }
        
        // Send message to extension
        vscode.postMessage({
            type: 'changeLanguage',
            languageId: selectedLanguage
        });
        
        console.log('Language changed to:', selectedLanguage);
    }


    function handleGlobalClick(event) {
        // Only hide tooltip if clicking outside of tooltip area
        const tooltip = event.target.closest('.template-tooltip');
        
        if (!tooltip && currentTooltip) {
            console.log('Global click outside tooltip - hiding');
            forceHideTooltip();
        }
    }
    

    // Category collapse/expand functionality
    function handleCategoryToggle(event) {
        const categoryHeader = event.target.closest('.category-header');
        if (!categoryHeader) return;
        
        event.stopPropagation();
        
        const category = categoryHeader.closest('.category');
        const templatesGrid = category.querySelector('.templates-grid');
        
        // Toggle collapsed state
        categoryHeader.classList.toggle('collapsed');
        templatesGrid.classList.toggle('collapsed');
        
        console.log('Toggle category:', category.dataset.level);
    }

    function handleMouseEnter(event) {
        // Check if event.target is a DOM element
        if (!event.target || typeof event.target.closest !== 'function') {
            return;
        }
        
        const previewBtn = event.target.closest('.preview-btn');
        const tooltip = event.target.closest('.template-tooltip');
        
        if (tooltip) {
            // Mouse entered tooltip - cancel hide timeout
            isTooltipHovered = true;
            if (tooltipHideTimeout) {
                clearTimeout(tooltipHideTimeout);
                tooltipHideTimeout = null;
            }
            return;
        }
        
        if (!previewBtn) return;
        
        const templateCard = previewBtn.closest('.template-card');
        if (!templateCard) return;
        
        // Hide any existing tooltip
        if (currentTooltip && currentPreviewBtn !== previewBtn) {
            hideTooltip();
        }
        
        currentPreviewBtn = previewBtn;
        isPreviewBtnHovered = true;
        
        // Clear any existing timeout
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        
        // Show tooltip after delay
        tooltipTimeout = setTimeout(() => {
            if (isPreviewBtnHovered && currentPreviewBtn === previewBtn) {
                showTooltip(templateCard, previewBtn);
            }
        }, 300);
    }

    function handleMouseLeave(event) {
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
        isPreviewBtnHovered = false;
        currentPreviewBtn = null;
        
        // Clear show timeout
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        
        // Only hide if not hovering tooltip
        if (!isTooltipHovered) {
            scheduleHideTooltip();
        }
    }

    function scheduleHideTooltip() {
        if (tooltipHideTimeout) {
            clearTimeout(tooltipHideTimeout);
        }
        
        tooltipHideTimeout = setTimeout(() => {
            // Only hide if mouse is not over tooltip or preview button
            if (!isTooltipHovered && !isPreviewBtnHovered) {
                hideTooltip();
            } else {
                // Reschedule check if still hovering
                scheduleHideTooltip();
            }
        }, 200);
    }


    function showTooltip(templateCard, previewBtn) {
        // Force hide any existing tooltip first to prevent stacking
        if (currentTooltip) {
            forceHideTooltip();
        }
        
        const templateId = templateCard.dataset.templateId;
        const templateCode = templateCard.dataset.templateCode;
        const title = templateCard.querySelector('.template-title').textContent;
        const description = templateCard.querySelector('.template-description').textContent;
        const languageTag = templateCard.querySelector('.language-tag').textContent;
        
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
                        ${hasDocumentation ? `<button class="tooltip-action-btn doc-btn" data-template-id="${templateId}" title="查看說明文檔">📖 說明</button>` : ''}
                        <button class="tooltip-action-btn insert-all-btn" data-template-id="${templateId}">➕ 插入</button>
                        <button class="tooltip-action-btn copy-all-btn" data-template-id="${templateId}">📋 複製</button>
                        <div class="tooltip-drag-handle" draggable="true" data-template-id="${templateId}" title="拖曳到編輯器">✋ 拖曳</div>
                    </div>
                </div>
                <button class="tooltip-close" title="關閉">✕</button>
            </div>
            <div class="tooltip-description">${escapeHtml(description)}</div>
            <div class="tooltip-code">
                <pre><code>${escapeHtml(templateCode)}</code></pre>
            </div>
            <div class="tooltip-footer">
                <span class="language-tag">${languageTag}</span>
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
        setupTooltipEventListeners(tooltip, templateId, templateCode);
        
        // Show tooltip with animation
        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });
        
        currentTooltip = tooltip;
        
        console.log('Show tooltip for:', templateId);
    }

    function hideTooltip() {
        if (currentTooltip) {
            currentTooltip.remove();
            currentTooltip = null;
        }
        
        // Reset states
        isTooltipHovered = false;
        isPreviewBtnHovered = false;
        currentPreviewBtn = null;
        
        // Clear timeouts
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        if (tooltipHideTimeout) {
            clearTimeout(tooltipHideTimeout);
            tooltipHideTimeout = null;
        }
    }

    function forceHideTooltip() {
        // Remove all tooltips from DOM
        document.querySelectorAll('.template-tooltip').forEach(tooltip => tooltip.remove());
        
        // Reset all states
        currentTooltip = null;
        isTooltipHovered = false;
        isPreviewBtnHovered = false;
        currentPreviewBtn = null;
        
        // Clear all timeouts
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        if (tooltipHideTimeout) {
            clearTimeout(tooltipHideTimeout);
            tooltipHideTimeout = null;
        }
    }


    function setupTooltipEventListeners(tooltip, templateId, templateCode) {
        // Handle close button
        const closeBtn = tooltip.querySelector('.tooltip-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            forceHideTooltip();
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
            const templateId = e.target.dataset.templateId;
            
            // Use stored selection or check current selection
            const selection = window.getSelection();
            const currentSelectedText = selection.toString().trim();
            const selectedText = storedSelection || currentSelectedText;
            
            console.log(`[DEBUG] Insert button clicked for template: ${templateId}`);
            console.log(`[DEBUG] Stored selection: "${storedSelection}"`);
            console.log(`[DEBUG] Current selection: "${currentSelectedText}"`);
            console.log(`[DEBUG] Final selected text: "${selectedText}"`);
            console.log(`[DEBUG] Selected text length:`, selectedText.length);
            
            if (selectedText && selectedText.length > 0) {
                // Insert selected text
                insertCodeSnippet(selectedText, templateId);
                console.log('[DEBUG] Inserting selected code snippet:', selectedText.substring(0, 50) + '...');
            } else {
                // Insert entire template
                insertTemplate(templateId);
                console.log('[DEBUG] Inserting entire template:', templateId);
            }
            
            // Clear stored selection
            storedSelection = null;
            
            // Visual feedback
            insertBtn.textContent = '✅ 已插入';
            insertBtn.classList.add('success');
            setTimeout(() => {
                insertBtn.textContent = '➕ 插入';
                insertBtn.classList.remove('success');
            }, 2000);
        });

        // Handle copy button
        const copyBtn = tooltip.querySelector('.copy-all-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const templateId = e.target.dataset.templateId;
            copyTemplate(templateId);
            
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
                const templateId = e.target.dataset.templateId;
                showDocumentation(templateId);
                
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
        
        // Handle drag handle
        const dragHandle = tooltip.querySelector('.tooltip-drag-handle');
        
        // Modify drag handle based on environment
        if (!supportsDrag) {
            dragHandle.draggable = false;
            dragHandle.textContent = '👆 點擊插入';
            dragHandle.title = '點擊插入到編輯器';
            dragHandle.style.cursor = 'pointer';
            
            // Add click handler for Codespaces
            dragHandle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Tooltip click inserting template in Codespaces:', templateId);
                
                // Send message to insert template with smart indentation
                vscode.postMessage({
                    type: 'copyCodeSnippet',
                    code: templateCode
                });
                
                // Visual feedback
                dragHandle.style.background = '#4caf50';
                dragHandle.textContent = '✅ 已插入';
                
                setTimeout(() => {
                    dragHandle.style.background = '';
                    dragHandle.textContent = '👆 點擊插入';
                }, 1500);
            });
        } else {
            // Normal drag behavior with improved compatibility
            dragHandle.addEventListener('dragstart', (e) => {
                if (templateId && templateCode) {
                    isDragging = true;
                    draggedTemplateId = templateId;
                    
                    try {
                        // Set drag data with better browser compatibility
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('text/plain', templateCode);
                        e.dataTransfer.setData('text', templateCode); // Fallback
                        
                        try {
                            e.dataTransfer.setData('application/vscode-template', JSON.stringify({
                                id: templateId,
                                code: templateCode
                            }));
                        } catch (err) {
                            console.warn('Custom MIME type not supported in tooltip drag');
                        }
                        
                        // Visual feedback
                        dragHandle.style.opacity = '0.5';
                        
                        // Notify extension about drag start
                        vscode.postMessage({
                            type: 'dragTemplate',
                            templateId: templateId,
                            text: templateCode
                        });
                        
                        console.log('Started dragging from tooltip drag handle:', templateId);
                        
                    } catch (error) {
                        console.error('Tooltip drag failed:', error);
                        e.preventDefault();
                        dragHandle.style.background = '#f44336';
                        dragHandle.textContent = '❌ 拖曳失敗';
                        setTimeout(() => {
                            dragHandle.style.background = '';
                            dragHandle.textContent = '✋ 拖曳';
                        }, 1500);
                    }
                }
            });
        }
        
        dragHandle.addEventListener('dragend', (e) => {
            // Reset visual feedback
            dragHandle.style.opacity = '';
            
            isDragging = false;
            draggedTemplateId = null;
            
            console.log('Ended dragging from tooltip drag handle');
        });
        
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
                let templateId = null;
                
                // Debug: log the codeArea and its context
                console.log('[DEBUG] codeArea:', codeArea);
                console.log('[DEBUG] codeArea parent:', codeArea.parentElement);
                console.log('[DEBUG] codeArea closest tooltip:', codeArea.closest('.tooltip'));
                
                // First try to find from parent elements with data-template-id
                const parentWithTemplateId = codeArea.closest('[data-template-id]');
                if (parentWithTemplateId) {
                    templateId = parentWithTemplateId.getAttribute('data-template-id');
                    console.log('[DEBUG] Found templateId from parent:', templateId);
                }
                
                // If not found, look in the tooltip for any element with data-template-id
                if (!templateId) {
                    const tooltipElement = codeArea.closest('.template-tooltip');
                    console.log('[DEBUG] Found tooltip element:', tooltipElement);
                    if (tooltipElement) {
                        const templateElements = tooltipElement.querySelectorAll('[data-template-id]');
                        console.log('[DEBUG] Template elements in tooltip:', templateElements);
                        if (templateElements.length > 0) {
                            templateId = templateElements[0].getAttribute('data-template-id');
                            console.log('[DEBUG] Found templateId from tooltip:', templateId);
                        }
                    }
                }
                
                console.log('[DEBUG] Final templateId:', templateId);
                
                // Send to extension for smart indentation processing
                vscode.postMessage({
                    type: 'copyCodeSnippet',
                    code: selectedText,
                    templateId: templateId
                });
                
                console.log('Copy selected code snippet with smart indentation:', selectedText.substring(0, 50) + '...', 'from template:', templateId);
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
                    let templateId = null;
                    
                    // First try to find from parent elements with data-template-id
                    const parentWithTemplateId = codeArea.closest('[data-template-id]');
                    if (parentWithTemplateId) {
                        templateId = parentWithTemplateId.getAttribute('data-template-id');
                    }
                    
                    // If not found, look in the tooltip for any element with data-template-id
                    if (!templateId) {
                        const tooltipElement = codeArea.closest('.template-tooltip');
                        if (tooltipElement) {
                            const templateElements = tooltipElement.querySelectorAll('[data-template-id]');
                            if (templateElements.length > 0) {
                                templateId = templateElements[0].getAttribute('data-template-id');
                            }
                        }
                    }
                    
                    // Send to extension for smart indentation processing
                    vscode.postMessage({
                        type: 'copyCodeSnippet',
                        code: selectedText,
                        templateId: templateId
                    });
                    
                    console.log('Copy selected code snippet via keyboard:', selectedText.substring(0, 50) + '...', 'from template:', templateId);
                }
                // If no text is selected, let the default behavior happen
            }
        });
        
        
        // Ensure tooltip hover state is properly maintained
        tooltip.addEventListener('mouseenter', () => {
            isTooltipHovered = true;
            if (tooltipHideTimeout) {
                clearTimeout(tooltipHideTimeout);
                tooltipHideTimeout = null;
            }
        });
        
        tooltip.addEventListener('mouseleave', () => {
            isTooltipHovered = false;
            scheduleHideTooltip();
        });
        
        // Prevent tooltip from closing when interacting inside
        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        tooltip.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    }


    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility functions for simple tooltips (different from template tooltips)
    function showSimpleTooltip(element, message) {
        // Create simple tooltip element
        const tooltip = document.createElement('div');
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 1000;
            pointer-events: none;
        `;
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - 30) + 'px';
        
        document.body.appendChild(tooltip);
        
        // Remove tooltip after delay
        setTimeout(() => {
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        }, 2000);
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Handle Escape key to clear any ongoing operations
        if (event.key === 'Escape') {
            // Force hide tooltip
            if (currentTooltip) {
                forceHideTooltip();
            }
            
            if (isDragging) {
                // Cancel drag operation
                isDragging = false;
                draggedTemplateId = null;
                
                // Remove dragging visual state
                const draggingCard = document.querySelector('.template-card.dragging');
                if (draggingCard) {
                    draggingCard.classList.remove('dragging');
                }
            }
        }
        
        // Handle Ctrl+C / Cmd+C on focused card
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            const focusedCard = document.querySelector('.template-card:focus');
            if (focusedCard) {
                event.preventDefault();
                const templateId = focusedCard.dataset.templateId;
                if (templateId) {
                    copyTemplate(templateId);
                }
            }
        }
    });

    // Make template cards focusable for keyboard navigation
    function makeFocusable() {
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach((card, index) => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Template: ${card.querySelector('.template-title').textContent}`);
            
            // Handle Enter key on focused cards
            card.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    const templateId = card.dataset.templateId;
                    if (templateId) {
                        // Only copy functionality - insert removed
                        copyTemplate(templateId);
                    }
                }
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initialize();
            makeFocusable();
        });
    } else {
        initialize();
        makeFocusable();
    }

    // Handle window messages (for future use)
    window.addEventListener('message', function(event) {
        const message = event.data;
        switch (message.type) {
            case 'refresh':
                // Handle refresh request
                location.reload();
                break;
            case 'theme-changed':
                // Handle theme change
                console.log('Theme changed');
                break;
        }
    });

})();