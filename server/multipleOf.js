"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var error = {
    message: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must be multiple of ", ""], ["must be multiple of ", ""])), schemaCode);
    },
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{multipleOf: ", "}"], ["{multipleOf: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, data = cxt.data, schemaCode = cxt.schemaCode, it = cxt.it;
        // const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
        var prec = it.opts.multipleOfPrecision;
        var res = gen.let("res");
        var invalid = prec
            ? (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Math.abs(Math.round(", ") - ", ") > 1e-", ""], ["Math.abs(Math.round(", ") - ", ") > 1e-", ""])), res, res, prec) : (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " !== parseInt(", ")"], ["", " !== parseInt(", ")"])), res, res);
        cxt.fail$data((0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["(", " === 0 || (", " = ", "/", ", ", "))"], ["(", " === 0 || (", " = ", "/", ", ", "))"])), schemaCode, res, data, schemaCode, invalid));
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
