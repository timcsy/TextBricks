"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationType = exports.TemplateItem = void 0;
class TemplateItem {
    constructor(template) {
        this.template = template;
    }
    format() {
        return this.template.code;
    }
    copy() {
        return this.template.code;
    }
}
exports.TemplateItem = TemplateItem;
// Documentation type enumeration
var DocumentationType;
(function (DocumentationType) {
    DocumentationType["MARKDOWN"] = "markdown";
    DocumentationType["FILE"] = "file";
    DocumentationType["URL"] = "url";
})(DocumentationType = exports.DocumentationType || (exports.DocumentationType = {}));
//# sourceMappingURL=Template.js.map