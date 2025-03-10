"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var error = {
    message: "property name must be valid",
    params: function (_a) {
        var params = _a.params;
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{propertyName: ", "}"], ["{propertyName: ", "}"])), params.propertyName);
    },
};
var def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, data = cxt.data, it = cxt.it;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        var valid = gen.name("valid");
        gen.forIn("key", data, function (key) {
            cxt.setParams({ propertyName: key });
            cxt.subschema({
                keyword: "propertyNames",
                data: key,
                dataTypes: ["string"],
                propertyName: key,
                compositeRule: true,
            }, valid);
            gen.if((0, codegen_1.not)(valid), function () {
                cxt.error(true);
                if (!it.allErrors)
                    gen.break();
            });
        });
        cxt.ok(valid);
    },
};
exports.default = def;
var templateObject_1;
