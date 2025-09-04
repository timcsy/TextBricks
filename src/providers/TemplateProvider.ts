import * as vscode from 'vscode';
import { TextBricksEngine } from '../core/TextBricksEngine';
import { Template, TemplateCategory } from '../models/Template';

export class TemplateProvider implements vscode.TreeDataProvider<TemplateTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateTreeItem | undefined | null | void> = new vscode.EventEmitter<TemplateTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private templateEngine: TextBricksEngine) {
        // Initialize template manager if needed
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TemplateTreeItem): Thenable<TemplateTreeItem[]> {
        if (!element) {
            // Return categories as root elements
            const categories = this.templateEngine.getCategories();
            return Promise.resolve(categories.map(category => new CategoryTreeItem(category)));
        } else if (element instanceof CategoryTreeItem) {
            // Return templates for this category
            const templates = this.templateEngine.getTemplatesByCategory(element.category.id);
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

export class CategoryTreeItem extends TemplateTreeItem {
    constructor(public readonly category: TemplateCategory) {
        super(category.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.tooltip = category.description;
        this.description = `Level ${category.level}`;
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