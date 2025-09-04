"use strict";
/**
 * TextBricks 核心服務模組
 * 匯出所有平台無關的核心服務
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateEngine = exports.DocumentationService = exports.SearchService = exports.CodeOperationService = exports.FormattingEngine = exports.TextBricksEngine = void 0;
var TextBricksEngine_1 = require("./TextBricksEngine");
Object.defineProperty(exports, "TextBricksEngine", { enumerable: true, get: function () { return TextBricksEngine_1.TextBricksEngine; } });
var FormattingEngine_1 = require("./FormattingEngine");
Object.defineProperty(exports, "FormattingEngine", { enumerable: true, get: function () { return FormattingEngine_1.FormattingEngine; } });
var CodeOperationService_1 = require("./CodeOperationService");
Object.defineProperty(exports, "CodeOperationService", { enumerable: true, get: function () { return CodeOperationService_1.CodeOperationService; } });
var SearchService_1 = require("./SearchService");
Object.defineProperty(exports, "SearchService", { enumerable: true, get: function () { return SearchService_1.SearchService; } });
var DocumentationService_1 = require("./DocumentationService");
Object.defineProperty(exports, "DocumentationService", { enumerable: true, get: function () { return DocumentationService_1.DocumentationService; } });
// 向後兼容別名
var TextBricksEngine_2 = require("./TextBricksEngine");
Object.defineProperty(exports, "TemplateEngine", { enumerable: true, get: function () { return TextBricksEngine_2.TextBricksEngine; } });
//# sourceMappingURL=index.js.map