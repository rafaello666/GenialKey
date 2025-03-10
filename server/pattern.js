"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var code_1 = require("../code");
var codegen_1 = require("../../compile/codegen");
var error = {
    message: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must match pattern \"", "\""], ["must match pattern \"", "\""])), schemaCode);
    },
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{pattern: ", "}"], ["{pattern: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error: error,
    code: function (cxt) {
        var data = cxt.data, $data = cxt.$data, schema = cxt.schema, schemaCode = cxt.schemaCode, it = cxt.it;
        // TODO regexp should be wrapped in try/catchs
        var u = it.opts.unicodeRegExp ? "u" : "";
        var regExp = $data ? (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["(new RegExp(", ", ", "))"], ["(new RegExp(", ", ", "))"])), schemaCode, u) : (0, code_1.usePattern)(cxt, schema);
        cxt.fail$data((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["!", ".test(", ")"], ["!", ".test(", ")"])), regExp, data));
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
