/**
 * TreeBuilderService (前端版本)
 * 統一處理所有樹狀結構的構建
 */
class TreeBuilderService {
    /**
     * 構建完整的內容樹（主題 + 模板 + 連結）
     */
    buildContentTree(hierarchy, templates) {
        return hierarchy.map(node => this.buildTopicNode(node, templates, null));
    }

    /**
     * 構建單個主題節點（包含子主題、模板和連結）
     */
    buildTopicNode(hierarchyNode, templates, parentPath) {
        const topic = hierarchyNode.topic;
        const topicPath = this.getTopicPath(topic, parentPath);

        // 主題節點
        const node = {
            id: topicPath,
            name: topic.name,
            title: topic.title || topic.name,
            type: 'topic',
            path: topicPath,
            data: topic,
            children: [],
            expanded: !(topic.display?.collapsed),
            parent: parentPath || undefined
        };

        // 添加子主題
        if (hierarchyNode.children && hierarchyNode.children.length > 0) {
            node.children.push(
                ...hierarchyNode.children.map(child =>
                    this.buildTopicNode(child, templates, topicPath)
                )
            );
        }

        // 添加該主題下的模板
        const topicTemplates = templates.filter(t => t.topicPath === topicPath);
        topicTemplates.forEach(template => {
            node.children.push({
                id: `${topicPath}/templates/${template.name}`,
                name: template.name,
                title: template.title || template.name,
                type: 'template',
                path: `${topicPath}/templates/${template.name}`,
                data: template,
                children: [],
                parent: topicPath
            });
        });

        // 添加連結（如果有）
        if (topic.loadedLinks && topic.loadedLinks.length > 0) {
            topic.loadedLinks.forEach(link => {
                node.children.push({
                    id: `${topicPath}/links/${link.name}`,
                    name: link.name,
                    title: link.title || link.name,
                    type: 'link',
                    path: `${topicPath}/links/${link.name}`,
                    data: link,
                    children: [],
                    parent: topicPath
                });
            });
        }

        return node;
    }

    /**
     * 構建純主題樹（用於主題選擇器）
     */
    buildTopicOnlyTree(hierarchy) {
        return hierarchy.map(node => this.buildTopicOnlyNode(node, null));
    }

    /**
     * 構建單個純主題節點
     */
    buildTopicOnlyNode(hierarchyNode, parentPath) {
        const topic = hierarchyNode.topic;
        const topicPath = this.getTopicPath(topic, parentPath);

        const node = {
            id: topicPath,
            name: topic.name,
            title: topic.title || topic.name,
            type: 'topic',
            path: topicPath,
            data: topic,
            children: [],
            expanded: true,
            parent: parentPath || undefined
        };

        // 只添加子主題
        if (hierarchyNode.children && hierarchyNode.children.length > 0) {
            node.children.push(
                ...hierarchyNode.children.map(child =>
                    this.buildTopicOnlyNode(child, topicPath)
                )
            );
        }

        return node;
    }

    /**
     * 扁平化樹結構為列表
     */
    flattenTree(nodes) {
        const result = [];

        const flatten = (node) => {
            result.push(node);
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => flatten(child));
            }
        };

        nodes.forEach(node => flatten(node));
        return result;
    }

    /**
     * 在樹中查找節點
     */
    findNode(nodes, predicate) {
        for (const node of nodes) {
            if (predicate(node)) {
                return node;
            }
            if (node.children && node.children.length > 0) {
                const found = this.findNode(node.children, predicate);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * 根據路徑查找節點
     */
    findNodeByPath(nodes, path) {
        return this.findNode(nodes, node => node.path === path);
    }

    /**
     * 獲取節點的所有祖先
     */
    getAncestors(nodes, targetPath) {
        const ancestors = [];
        const parts = targetPath.split('/');

        for (let i = 1; i <= parts.length; i++) {
            const ancestorPath = parts.slice(0, i).join('/');
            const node = this.findNodeByPath(nodes, ancestorPath);
            if (node) {
                ancestors.push(node);
            }
        }

        return ancestors;
    }

    /**
     * 展開到指定節點
     */
    expandToNode(nodes, targetPath) {
        const ancestors = this.getAncestors(nodes, targetPath);
        ancestors.forEach(node => {
            node.expanded = true;
        });
    }

    /**
     * 獲取主題路徑
     */
    getTopicPath(topic, parentPath) {
        if (typeof topic.path === 'string') {
            return topic.path;
        }

        if (Array.isArray(topic.path)) {
            return topic.path.join('/');
        }

        // 如果沒有 path，使用 name 和 parent 構建
        if (parentPath) {
            return `${parentPath}/${topic.name}`;
        }

        return topic.name;
    }

    /**
     * 過濾樹節點
     */
    filterTree(nodes, predicate) {
        return nodes
            .map(node => {
                const matchesPredicate = predicate(node);
                const filteredChildren = this.filterTree(node.children || [], predicate);

                // 如果節點匹配或有匹配的子節點，保留此節點
                if (matchesPredicate || filteredChildren.length > 0) {
                    return {
                        ...node,
                        children: filteredChildren
                    };
                }

                return null;
            })
            .filter(node => node !== null);
    }

    /**
     * 統計樹的節點數量
     */
    countNodes(nodes, type) {
        let count = 0;

        const countRecursive = (node) => {
            if (!type || node.type === type) {
                count++;
            }
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => countRecursive(child));
            }
        };

        nodes.forEach(node => countRecursive(node));
        return count;
    }
}
