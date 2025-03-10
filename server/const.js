"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var equal_1 = require("../../runtime/equal");
var error = {
    message: "must be equal to constant",
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{allowedValue: ", "}"], ["{allowedValue: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: "const",
    $data: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, data = cxt.data, $data = cxt.$data, schemaCode = cxt.schemaCode, schema = cxt.schema;
        if ($data || (schema && typeof schema == "object")) {
            cxt.fail$data((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["!", "(", ", ", ")"], ["!", "(", ", ", ")"])), (0, util_1.useFunc)(gen, equal_1.default), data, schemaCode));
        }
        else {
            cxt.fail((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " !== ", ""], ["", " !== ", ""])), schema, data));
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3;
