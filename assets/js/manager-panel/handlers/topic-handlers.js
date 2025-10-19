// Topic Handlers - 主題操作處理器
// 負責處理主題的 CRUD 操作

(function() {
    'use strict';

    /**
     * Topic Handlers 類
     * 處理主題相關的用戶操作
     */
    class TopicHandlers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 編輯主題
         */
        editTopic(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                this.context.openModal('topic', topic);
            }
        }

        /**
         * 重命名主題
         */
        renameTopic(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                const newName = prompt('請輸入新的主題名稱：', topic.name);
                if (newName && newName.trim() && newName !== topic.name) {
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'updateTopic',
                        topicPath: topicPath,
                        data: { ...topic, name: newName.trim() }
                    });
                }
            }
        }

        /**
         * 刪除主題
         */
        deleteTopic(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (!topic) return;

            const currentData = this.context.getCurrentData();

            // 使用改進的模板匹配邏輯來查找相關模板
            const topicName = topic.name;
            const possibleMatches = [
                topicName,
                topicPath,
            ];
            if (topic.parent) {
                possibleMatches.push(`${topic.parent}/${topicName}`);
            }

            const templates = currentData.templates?.filter(t => {
                return possibleMatches.some(match =>
                    t.topic === match ||
                    t.topic.endsWith(`/${topicName}`) ||
                    t.topic === topicName
                );
            }) || [];

            // 直接發送刪除請求，讓後端處理確認
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'deleteTopic',
                topicPath: topicPath,
                topicTitle: topic.title || topic.name,
                templateCount: templates.length
            });
        }

        /**
         * 複製主題
         */
        duplicateTopic(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                const newName = prompt('請輸入複製後的主題名稱：', `${topic.name} 副本`);
                if (newName && newName.trim()) {
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'duplicateTopic',
                        topicPath: topicPath,
                        newName: newName.trim()
                    });
                }
            }
        }

        /**
         * 複製主題（右鍵選單用）
         */
        copyTopic(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                // 創建副本數據
                const topicCopy = {
                    title: `${topic.title || topic.name} 副本`,
                    description: topic.description || '',
                    parent: topic.parent || null,
                    display: topic.display ? { ...topic.display } : null,
                    documentation: topic.documentation || ''
                };

                // 打開模態框，傳入副本數據作為預填值
                this.context.openModal('topic', topicCopy);
            }
        }

        /**
         * 移動主題到另一個父主題
         */
        moveTopic(topicPath, newParentPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'moveTopic',
                    topicPath: topicPath,
                    newParentPath: newParentPath
                });
            }
        }

        /**
         * 查看主題詳情
         */
        showTopicDetails(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                // Display topic details in the content panel
                const contentRenderer = this.context.getContentRenderer();
                contentRenderer.showContentDetails(topicPath, 'topic');
            }
        }

        /**
         * 查看主題文檔
         */
        viewTopicDocumentation(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic && topic.documentation) {
                this.context.showDocumentationModal(topic, 'topic');
            }
        }

        /**
         * 展開/摺疊主題
         */
        toggleTopicExpansion(topicPath) {
            const node = document.querySelector(`.tree-node[data-path="${topicPath}"]`);
            if (node) {
                const toggle = node.querySelector('.tree-toggle');
                if (toggle && !toggle.classList.contains('leaf')) {
                    toggle.click();
                }
            }
        }

        /**
         * 在主題中創建子主題
         */
        createSubTopic(parentTopicPath) {
            this.context.openModal('topic', { parent: parentTopicPath });
        }

        /**
         * 排序主題的子項
         */
        sortTopicChildren(topicPath, sortBy = 'name') {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'sortTopicChildren',
                topicPath: topicPath,
                sortBy: sortBy
            });
        }

        /**
         * 合併主題
         */
        mergeTopics(sourceTopicPath, targetTopicPath) {
            const sourceTopic = this.context.findTopicByPath(sourceTopicPath);
            const targetTopic = this.context.findTopicByPath(targetTopicPath);

            if (sourceTopic && targetTopic) {
                const confirmMessage = `確定要將主題「${sourceTopic.name}」合併到「${targetTopic.name}」嗎？\n源主題將被刪除，其內容將移到目標主題。`;

                if (confirm(confirmMessage)) {
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'mergeTopics',
                        sourceTopicPath: sourceTopicPath,
                        targetTopicPath: targetTopicPath
                    });
                }
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TopicHandlers;
    } else {
        window.TopicHandlers = TopicHandlers;
    }
})();
