// Documentation Panel JavaScript - TextBricks VSCode Extension

(function() {
    'use strict';

    // Get VS Code API
    const vscode = acquireVsCodeApi();

    // DOM Elements
    let refreshBtn;
    let copyCodeBtn;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    function initialize() {
        // Get DOM elements
        refreshBtn = document.getElementById('refresh-btn');
        copyCodeBtn = document.getElementById('copy-code-btn');

        // Bind event listeners
        bindEventListeners();

        // Initialize syntax highlighting if available
        initializeSyntaxHighlighting();

        // Handle external links
        handleExternalLinks();

        console.log('Documentation panel initialized');
    }

    function bindEventListeners() {
        // Refresh button
        if (refreshBtn) {
            refreshBtn.addEventListener('click', handleRefresh);
        }

        // Copy code button
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', handleCopyCode);
        }

        // Handle keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Handle scroll to top functionality
        window.addEventListener('scroll', handleScroll);
    }

    function handleRefresh() {
        console.log('Refreshing documentation...');
        
        // Show loading state
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<span class="icon">⏳</span> 載入中...';
            refreshBtn.disabled = true;

            // Send refresh message to VS Code
            vscode.postMessage({ type: 'refresh' });

            // Reset button state after a delay (VS Code will reload the panel)
            setTimeout(() => {
                if (refreshBtn) {
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.disabled = false;
                }
            }, 2000);
        }
    }

    function handleCopyCode() {
        console.log('Copying template code...');
        
        // Show feedback
        if (copyCodeBtn) {
            const originalText = copyCodeBtn.innerHTML;
            copyCodeBtn.innerHTML = '<span class="icon">✅</span> 已複製';
            copyCodeBtn.disabled = true;

            // Send copy message to VS Code
            vscode.postMessage({ type: 'copyCode' });

            // Reset button state
            setTimeout(() => {
                if (copyCodeBtn) {
                    copyCodeBtn.innerHTML = originalText;
                    copyCodeBtn.disabled = false;
                }
            }, 2000);
        }
    }

    function handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + R: Refresh
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            handleRefresh();
        }

        // Ctrl/Cmd + C: Copy code (when no text is selected)
        if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !window.getSelection().toString()) {
            const activeElement = document.activeElement;
            if (activeElement === document.body || activeElement.tagName === 'BODY') {
                event.preventDefault();
                handleCopyCode();
            }
        }
    }

    function initializeSyntaxHighlighting() {
        // If highlight.js is available, configure it
        if (typeof hljs !== 'undefined') {
            try {
                // Configure highlight.js
                hljs.configure({
                    languages: ['c', 'python', 'javascript', 'typescript', 'html', 'css', 'json', 'bash'],
                    ignoreUnescapedHTML: true
                });

                // Highlight all code blocks
                document.querySelectorAll('pre code').forEach((block) => {
                    try {
                        hljs.highlightElement(block);
                    } catch (error) {
                        console.warn('Failed to highlight code block:', error);
                    }
                });

                console.log('Syntax highlighting initialized');
            } catch (error) {
                console.warn('Failed to initialize syntax highlighting:', error);
            }
        }
    }

    function handleExternalLinks() {
        // Handle all links in the documentation
        document.querySelectorAll('a[href]').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const url = link.getAttribute('href');
                
                if (url) {
                    handleLinkClick(url);
                }
            });
        });
    }

    // Global function for handling link clicks (called from generated HTML)
    window.handleLinkClick = function(url) {
        console.log('Opening external link:', url);
        
        // Send message to VS Code to handle external URL
        vscode.postMessage({ 
            type: 'openExternal', 
            url: url 
        });
    };

    function handleScroll() {
        // Add scroll-to-top functionality if needed
        // This could be implemented as a floating button for long documents
    }

    // Handle messages from VS Code extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'refresh-complete':
                console.log('Documentation refresh completed');
                break;
            
            case 'copy-complete':
                console.log('Code copy completed');
                break;
            
            case 'error':
                console.error('Documentation error:', message.error);
                showNotification('錯誤：' + message.error, 'error');
                break;
            
            case 'info':
                console.log('Documentation info:', message.message);
                showNotification(message.message, 'info');
                break;
        }
    });

    function showNotification(message, type = 'info') {
        // Create and show a temporary notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Styling
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '4px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Type-specific styling
        switch (type) {
            case 'error':
                notification.style.backgroundColor = 'var(--vscode-errorForeground, #f85149)';
                break;
            case 'success':
                notification.style.backgroundColor = 'var(--vscode-charts-green, #238636)';
                break;
            case 'warning':
                notification.style.backgroundColor = 'var(--vscode-charts-orange, #d1742f)';
                break;
            default:
                notification.style.backgroundColor = 'var(--vscode-textLink-foreground, #0969da)';
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Utility functions for enhanced functionality
    function addCopyButtonsToCodeBlocks() {
        // Add copy buttons to all code blocks
        document.querySelectorAll('pre code').forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;
            if (pre.querySelector('.copy-code-btn')) return; // Already has button

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-btn';
            copyButton.innerHTML = '<span class="icon">📋</span>';
            copyButton.title = '複製程式碼';
            
            Object.assign(copyButton.style, {
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'var(--vscode-button-background)',
                color: 'var(--vscode-button-foreground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: '0.7',
                transition: 'opacity 0.2s ease'
            });

            copyButton.addEventListener('click', () => {
                const code = codeBlock.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    copyButton.innerHTML = '<span class="icon">✅</span>';
                    setTimeout(() => {
                        copyButton.innerHTML = '<span class="icon">📋</span>';
                    }, 2000);
                    showNotification('程式碼已複製到剪貼簿', 'success');
                }).catch(err => {
                    console.error('Failed to copy code:', err);
                    showNotification('複製失敗', 'error');
                });
            });

            copyButton.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });

            copyButton.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0.7';
            });

            // Make sure the pre element is positioned relatively
            pre.style.position = 'relative';
            pre.appendChild(copyButton);
        });
    }

    // Initialize additional features when everything is loaded
    window.addEventListener('load', () => {
        addCopyButtonsToCodeBlocks();
    });

    // Export for debugging
    window.documentationPanel = {
        refresh: handleRefresh,
        copyCode: handleCopyCode,
        showNotification: showNotification
    };

})();