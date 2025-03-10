"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var error = {
    message: function (_a) {
        var keyword = _a.keyword, schemaCode = _a.schemaCode;
        var comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must NOT have ", " than ", " properties"], ["must NOT have ", " than ", " properties"])), comp, schemaCode);
    },
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{limit: ", "}"], ["{limit: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error: error,
    code: function (cxt) {
        var keyword = cxt.keyword, data = cxt.data, schemaCode = cxt.schemaCode;
        var op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Object.keys(", ").length ", " ", ""], ["Object.keys(", ").length ", " ", ""])), data, op, schemaCode));
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3;
