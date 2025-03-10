"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../compile/util");
var code_1 = require("../code");
var codegen_1 = require("../../compile/codegen");
var metadata_1 = require("./metadata");
var nullable_1 = require("./nullable");
var error_1 = require("./error");
var def = {
    keyword: "elements",
    schemaType: "object",
    error: (0, error_1.typeError)("array"),
    code: function (cxt) {
        (0, metadata_1.checkMetadata)(cxt);
        var gen = cxt.gen, data = cxt.data, schema = cxt.schema, it = cxt.it;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        var valid = (0, nullable_1.checkNullable)(cxt)[0];
        gen.if((0, codegen_1.not)(valid), function () {
            return gen.if((0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Array.isArray(", ")"], ["Array.isArray(", ")"])), data), function () { return gen.assign(valid, (0, code_1.validateArray)(cxt)); }, function () { return cxt.error(); });
        });
        cxt.ok(valid);
    },
};
exports.default = def;
var templateObject_1;
