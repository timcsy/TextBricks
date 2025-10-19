// TextBricks Templates Panel - 模板面板主協調器
// 整合所有模組並協調它們之間的交互

(function() {
    'use strict';

    // VS Code API
    const vscode = acquireVsCodeApi();

    // Utility functions from TextBricksUtils
    console.log('[TextBricks] templates-panel.js starting, TextBricksUtils available:', !!window.TextBricksUtils);
    const utils = window.TextBricksUtils || {};

    // Environment detection
    const isCodespaces = checkCodespacesEnvironment();
    const supportsDrag = checkDragSupport();

    /**
     * Check if running in GitHub Codespaces
     */
    function checkCodespacesEnvironment() {
        return !!(
            typeof window !== 'undefined' &&
            (window.location?.hostname?.includes('github') ||
             window.location?.hostname?.includes('codespaces') ||
             window.navigator?.userAgent?.includes('Codespaces') ||
             document?.documentElement?.getAttribute('data-vscode-context') === 'codespace')
        );
    }

    /**
     * Check if drag and drop is supported
     */
    function checkDragSupport() {
        try {
            const testDiv = document.createElement('div');
            testDiv.draggable = true;
            return 'draggable' in testDiv &&
                   'ondragstart' in testDiv &&
                   'ondrop' in testDiv &&
                   !isCodespaces; // Disable drag in Codespaces
        } catch (e) {
            return false;
        }
    }

    /**
     * Context object for module communication
     */
    const context = {
        // Core getters
        getVSCode: () => vscode,
        getUtils: () => utils,
        getSupportsDrag: () => supportsDrag,
        getIsCodespaces: () => isCodespaces,

        // Module getters (set after initialization)
        getTemplateOperations: null,
        getDragDropHandler: null,
        getNavigationHandler: null,
        getPanelEventHandlers: null,
        getTooltipManager: null
    };

    // Initialize modules
    const templateOperations = new window.TemplateOperations(context);
    const dragDropHandler = new window.DragDropHandler(context);
    const navigationHandler = new window.NavigationHandler(context);
    const panelEventHandlers = new window.PanelEventHandlers(context);
    const tooltipManager = new window.TooltipManager(context);

    // Set module getters in context
    context.getTemplateOperations = () => templateOperations;
    context.getDragDropHandler = () => dragDropHandler;
    context.getNavigationHandler = () => navigationHandler;
    context.getPanelEventHandlers = () => panelEventHandlers;
    context.getTooltipManager = () => tooltipManager;

    /**
     * Setup environment-specific features
     */
    function setupEnvironmentSpecificFeatures() {
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

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Card clicks - delegated to PanelEventHandlers
        document.addEventListener('click', (e) => panelEventHandlers.handleClick(e));

        // Drag and drop - delegated to DragDropHandler
        document.addEventListener('dragstart', (e) => dragDropHandler.handleDragStart(e));
        document.addEventListener('dragend', (e) => dragDropHandler.handleDragEnd(e));

        // Button clicks - delegated to PanelEventHandlers
        document.addEventListener('click', (e) => panelEventHandlers.handleButtonClick(e));

        // Navigation - delegated to NavigationHandler
        document.addEventListener('click', (e) => navigationHandler.handleNavigationClick(e));
        document.addEventListener('click', (e) => navigationHandler.handleBreadcrumbClick(e));
        document.addEventListener('click', (e) => navigationHandler.handlePageNavigationClick(e));

        // Topic toggle - delegated to NavigationHandler
        document.addEventListener('click', (e) => navigationHandler.handleTopicToggle(e));

        // Collapse controls - delegated to NavigationHandler
        document.addEventListener('click', (e) => navigationHandler.handleCollapseControlClick(e));

        // Tabs and favorites - delegated to PanelEventHandlers
        document.addEventListener('click', (e) => panelEventHandlers.handleTabClick(e));
        document.addEventListener('click', (e) => panelEventHandlers.handleFavoriteClick(e));

        // Topic documentation - delegated to PanelEventHandlers
        document.addEventListener('click', (e) => panelEventHandlers.handleTopicDocumentationClick(e));

        // Tooltip - delegated to TooltipManager
        document.addEventListener('mouseenter', (e) => tooltipManager.handleMouseEnter(e), true);
        document.addEventListener('mouseleave', (e) => tooltipManager.handleMouseLeave(e), true);
        document.addEventListener('click', (e) => panelEventHandlers.handleGlobalClick(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboardShortcuts(event) {
        // Escape key - clear ongoing operations
        if (event.key === 'Escape') {
            // Force hide tooltip
            if (tooltipManager.getCurrentTooltip()) {
                tooltipManager.forceHideTooltip();
            }

            // Cancel drag operation
            if (dragDropHandler.getIsDragging()) {
                dragDropHandler.resetDragState();
            }
        }

        // Ctrl+C / Cmd+C on focused card
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            const focusedCard = document.querySelector('.template-card:focus');
            if (focusedCard) {
                event.preventDefault();
                const templatePath = focusedCard.dataset.templatePath;
                if (templatePath) {
                    templateOperations.copyTemplate(templatePath);
                }
            }
        }
    }

    /**
     * Make template cards focusable for keyboard navigation
     */
    function makeFocusable() {
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach((card, index) => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');

            // Safe title query with null check
            const titleElement = card.querySelector('.card-title, .template-title');
            const title = titleElement ? titleElement.textContent : 'Template';
            card.setAttribute('aria-label', `Template: ${title}`);

            // Handle Enter key on focused cards
            card.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    const templatePath = card.dataset.templatePath;
                    if (templatePath) {
                        templateOperations.copyTemplate(templatePath);
                    }
                }
            });
        });
    }

    /**
     * Initialize the webview
     */
    function initialize() {
        setupEventListeners();
        setupEnvironmentSpecificFeatures();
        scrollBreadcrumbToEnd();

        // Collapse all topics by default
        collapseAllTopicsOnInit();

        console.log(`TextBricks templates panel initialized (Codespaces: ${isCodespaces}, Drag Support: ${supportsDrag})`);
    }

    /**
     * 獲取當前主題路徑（從麵包屑的 active 項目）
     */
    function getCurrentTopicPath() {
        const activeBreadcrumb = document.querySelector('.breadcrumb-item.active');
        if (!activeBreadcrumb) return null;

        // Get the current topic path from the data attribute
        const currentPath = activeBreadcrumb.dataset.currentTopicPath;
        return currentPath || null;
    }

    /**
     * 初始化時設定收合狀態
     * 規則：
     * - 當前主題的剩餘模板區域（data-topic 與導航路徑相同）：展開
     * - 其他所有主題組：收合
     */
    function collapseAllTopicsOnInit() {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const currentTopicPath = getCurrentTopicPath();
            const topicHeaders = document.querySelectorAll('.topic-header');

            topicHeaders.forEach(header => {
                const topicGroup = header.closest('.topic-group');
                const templatesGrid = topicGroup.querySelector('.templates-grid');
                const recommendedContainer = topicGroup.querySelector('.recommended-templates-container');
                const topicDataPath = topicGroup.dataset.topic;

                // Check if this topic group matches the current navigation path
                // If yes, it represents the "remaining templates" for the current topic - expand it
                // Otherwise, collapse it
                const isCurrentTopicRemainingTemplates = currentTopicPath && topicDataPath === currentTopicPath;

                if (isCurrentTopicRemainingTemplates) {
                    // This is the current topic's remaining templates area: expand it and remove height limit
                    header.classList.remove('collapsed');
                    topicGroup.classList.add('current-topic-remaining');
                    if (templatesGrid) {
                        templatesGrid.classList.remove('collapsed');
                    }
                    if (recommendedContainer) {
                        recommendedContainer.classList.remove('collapsed');
                    }
                } else {
                    // All other topics: collapse them and ensure height limit
                    header.classList.add('collapsed');
                    topicGroup.classList.remove('current-topic-remaining');
                    if (templatesGrid) {
                        templatesGrid.classList.add('collapsed');
                    }
                    if (recommendedContainer) {
                        recommendedContainer.classList.add('collapsed');
                    }
                }
            });

            console.log(`Set initial collapse state (current topic: ${currentTopicPath})`);
        }, 0);
    }

    /**
     * 滾動麵包屑到最右邊（顯示當前位置）
     */
    function scrollBreadcrumbToEnd() {
        // 使用 setTimeout 確保 DOM 已經渲染完成
        setTimeout(() => {
            const breadcrumb = document.querySelector('.breadcrumb');
            if (breadcrumb) {
                breadcrumb.scrollLeft = breadcrumb.scrollWidth;
            }
        }, 100);
    }

    // Handle window messages from extension
    window.addEventListener('message', function(event) {
        const message = event.data;
        switch (message.type) {
            case 'refresh':
                // 在重新載入前滾動麵包屑（如果是局部刷新）
                scrollBreadcrumbToEnd();
                location.reload();
                break;
            case 'theme-changed':
                console.log('Theme changed');
                break;
            case 'favoriteToggled':
                panelEventHandlers.handleFavoriteToggled(message.itemId, message.isFavorite);
                break;
            case 'updateFavoritesContent':
                panelEventHandlers.updateFavoritesTabContent(message.content);
                break;
            case 'usageUpdated':
                // 動態更新使用次數
                updateUsageCount(message.itemPath, message.newCount);
                break;
        }
    });

    /**
     * 動態更新模板卡片的使用次數
     */
    function updateUsageCount(itemPath, newCount) {
        // 找到對應的模板卡片
        const cards = document.querySelectorAll('.template-card[data-template-path]');
        cards.forEach(card => {
            if (card.dataset.templatePath === itemPath) {
                // 找到使用次數元素
                const usageElement = card.querySelector('.usage-count');
                if (usageElement) {
                    usageElement.textContent = `已使用 ${newCount} 次`;
                }
            }
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

})();
