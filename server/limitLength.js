"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var ucs2length_1 = require("../../runtime/ucs2length");
var error = {
    message: function (_a) {
        var keyword = _a.keyword, schemaCode = _a.schemaCode;
        var comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must NOT have ", " than ", " characters"], ["must NOT have ", " than ", " characters"])), comp, schemaCode);
    },
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{limit: ", "}"], ["{limit: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error: error,
    code: function (cxt) {
        var keyword = cxt.keyword, data = cxt.data, schemaCode = cxt.schemaCode, it = cxt.it;
        var op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        var len = it.opts.unicode === false ? (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ".length"], ["", ".length"])), data) : (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", "(", ")"], ["", "(", ")"])), (0, util_1.useFunc)(cxt.gen, ucs2length_1.default), data);
        cxt.fail$data((0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " ", " ", ""], ["", " ", " ", ""])), len, op, schemaCode));
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
