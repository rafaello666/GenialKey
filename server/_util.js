"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaSchemaRef = metaSchemaRef;
exports.usePattern = usePattern;
var codegen_1 = require("ajv/dist/compile/codegen");
var META_SCHEMA_ID = "http://json-schema.org/schema";
function metaSchemaRef(_a) {
    var _b = _a === void 0 ? {} : _a, defaultMeta = _b.defaultMeta;
    return defaultMeta === false ? {} : { $ref: defaultMeta || META_SCHEMA_ID };
}
function usePattern(_a, pattern, flags) {
    var gen = _a.gen, opts = _a.it.opts;
    if (flags === void 0) { flags = opts.unicodeRegExp ? "u" : ""; }
    var rx = new RegExp(pattern, flags);
    return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["new RegExp(", ", ", ")"], ["new RegExp(", ", ", ")"])), pattern, flags),
    });
}
var templateObject_1;
