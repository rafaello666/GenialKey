"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLimitDefinition = void 0;
var ajv_1 = require("ajv");
var codegen_1 = require("ajv/dist/compile/codegen");
var ops = codegen_1.operators;
var KWDs = {
    formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE },
};
var error = {
    message: function (_a) {
        var keyword = _a.keyword, schemaCode = _a.schemaCode;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["should be ", " ", ""], ["should be ", " ", ""])), KWDs[keyword].okStr, schemaCode);
    },
    params: function (_a) {
        var keyword = _a.keyword, schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{comparison: ", ", limit: ", "}"], ["{comparison: ", ", limit: ", "}"])), KWDs[keyword].okStr, schemaCode);
    },
};
exports.formatLimitDefinition = {
    keyword: Object.keys(KWDs),
    type: "string",
    schemaType: "string",
    $data: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, data = cxt.data, schemaCode = cxt.schemaCode, keyword = cxt.keyword, it = cxt.it;
        var opts = it.opts, self = it.self;
        if (!opts.validateFormats)
            return;
        var fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
        if (fCxt.$data)
            validate$DataFormat();
        else
            validateFormat();
        function validate$DataFormat() {
            var fmts = gen.scopeValue("formats", {
                ref: self.formats,
                code: opts.code.formats,
            });
            var fmt = gen.const("fmt", (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), fmts, fCxt.schemaCode));
            cxt.fail$data((0, codegen_1.or)((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["typeof ", " != \"object\""], ["typeof ", " != \"object\""])), fmt), (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " instanceof RegExp"], ["", " instanceof RegExp"])), fmt), (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["typeof ", ".compare != \"function\""], ["typeof ", ".compare != \"function\""])), fmt), compareCode(fmt)));
        }
        function validateFormat() {
            var format = fCxt.schema;
            var fmtDef = self.formats[format];
            if (!fmtDef || fmtDef === true)
                return;
            if (typeof fmtDef != "object" ||
                fmtDef instanceof RegExp ||
                typeof fmtDef.compare != "function") {
                throw new Error("\"".concat(keyword, "\": format \"").concat(format, "\" does not define \"compare\" function"));
            }
            var fmt = gen.scopeValue("formats", {
                key: format,
                ref: fmtDef,
                code: opts.code.formats ? (0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", "", ""], ["", "", ""])), opts.code.formats, (0, codegen_1.getProperty)(format)) : undefined,
            });
            cxt.fail$data(compareCode(fmt));
        }
        function compareCode(fmt) {
            return (0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", ".compare(", ", ", ") ", " 0"], ["", ".compare(", ", ", ") ", " 0"])), fmt, data, schemaCode, KWDs[keyword].fail);
        }
    },
    dependencies: ["format"],
};
var formatLimitPlugin = function (ajv) {
    ajv.addKeyword(exports.formatLimitDefinition);
    return ajv;
};
exports.default = formatLimitPlugin;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
