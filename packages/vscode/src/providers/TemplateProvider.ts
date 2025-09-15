import * as vscode from 'vscode';
import { TextBricksEngine } from '@textbricks/core';
import { Template } from '@textbricks/shared';

export class TemplateProvider implements vscode.TreeDataProvider<TemplateTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateTreeItem | undefined | null | void> = new vscode.EventEmitter<TemplateTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private templateEngine: TextBricksEngine) {
        // Initialize textbricks manager if needed
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TemplateTreeItem): Thenable<TemplateTreeItem[]> {
        if (!element) {
            // Return topics as root elements
            const topics = this.templateEngine.getTopics();
            return Promise.resolve(topics.map(topic => new TopicTreeItem(topic)));
        } else if (element instanceof TopicTreeItem) {
            // Return templates for this topic
            const templates = this.templateEngine.getTemplatesByTopic(element.topic);
            return Promise.resolve(templates.map(template => new TemplateTreeItemImpl(template)));
        }

        return Promise.resolve([]);
    }
}

export abstract class TemplateTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }
}

export class TopicTreeItem extends TemplateTreeItem {
    constructor(public readonly topic: string) {
        super(topic, vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = `${topic} 相關的模板`;
        this.description = topic;
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

export class TemplateTreeItemImpl extends TemplateTreeItem {
    constructor(public readonly template: Template) {
        super(template.title, vscode.TreeItemCollapsibleState.None);
        this.tooltip = template.description;
        this.description = template.description;
        this.iconPath = new vscode.ThemeIcon('code');
        
        // Add command to copy template on click
        this.command = {
            command: 'educode.copyTemplate',
            title: 'Copy Template',
            arguments: [template.id]
        };
    }
}