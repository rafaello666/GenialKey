"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var code_1 = require("../code");
var additionalItems_1 = require("./additionalItems");
var error = {
    message: function (_a) {
        var len = _a.params.len;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must NOT have more than ", " items"], ["must NOT have more than ", " items"])), len);
    },
    params: function (_a) {
        var len = _a.params.len;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{limit: ", "}"], ["{limit: ", "}"])), len);
    },
};
var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: error,
    code: function (cxt) {
        var schema = cxt.schema, parentSchema = cxt.parentSchema, it = cxt.it;
        var prefixItems = parentSchema.prefixItems;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        if (prefixItems)
            (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
            cxt.ok((0, code_1.validateArray)(cxt));
    },
};
exports.default = def;
var templateObject_1, templateObject_2;
