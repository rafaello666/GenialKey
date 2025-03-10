"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var ops = codegen_1.operators;
var KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE },
};
var error = {
    message: function (_a) {
        var keyword = _a.keyword, schemaCode = _a.schemaCode;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must be ", " ", ""], ["must be ", " ", ""])), KWDs[keyword].okStr, schemaCode);
    },
    params: function (_a) {
        var keyword = _a.keyword, schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{comparison: ", ", limit: ", "}"], ["{comparison: ", ", limit: ", "}"])), KWDs[keyword].okStr, schemaCode);
    },
};
var def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error: error,
    code: function (cxt) {
        var keyword = cxt.keyword, data = cxt.data, schemaCode = cxt.schemaCode;
        cxt.fail$data((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " ", " ", " || isNaN(", ")"], ["", " ", " ", " || isNaN(", ")"])), data, KWDs[keyword].fail, schemaCode, data));
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3;
