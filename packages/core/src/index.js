"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeOperationService = exports.SearchService = exports.DocumentationService = exports.TextBricksEngine = void 0;
// Core services
var TextBricksEngine_1 = require("./core/TextBricksEngine");
Object.defineProperty(exports, "TextBricksEngine", { enumerable: true, get: function () { return TextBricksEngine_1.TextBricksEngine; } });
var DocumentationService_1 = require("./core/DocumentationService");
Object.defineProperty(exports, "DocumentationService", { enumerable: true, get: function () { return DocumentationService_1.DocumentationService; } });
var SearchService_1 = require("./core/SearchService");
Object.defineProperty(exports, "SearchService", { enumerable: true, get: function () { return SearchService_1.SearchService; } });
var CodeOperationService_1 = require("./core/CodeOperationService");
Object.defineProperty(exports, "CodeOperationService", { enumerable: true, get: function () { return CodeOperationService_1.CodeOperationService; } });
// Platform interfaces
__exportStar(require("./interfaces/IEditor"), exports);
__exportStar(require("./interfaces/IUI"), exports);
__exportStar(require("./interfaces/IStorage"), exports);
__exportStar(require("./interfaces/IPlatform"), exports);
//# sourceMappingURL=index.js.map