import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

/**
 * InsertActions - 模板插入操作
 *
 * 負責處理模板的拖曳操作
 */
export class InsertActions {
    constructor(
        private readonly platform: VSCodePlatform
    ) {}

    /**
     * 處理模板拖曳
     */
    async handleDragTemplate(templatePath: string, text: string): Promise<void> {
        // This method is called during drag start - just log for now
        this.platform.logInfo(`Dragging template ${templatePath}: ${text.substring(0, 50)}...`, 'InsertActions');
    }
}
