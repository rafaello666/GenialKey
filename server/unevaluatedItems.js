"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
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
    keyword: "unevaluatedItems",
    type: "array",
    schemaType: ["boolean", "object"],
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, data = cxt.data, it = cxt.it;
        var items = it.items || 0;
        if (items === true)
            return;
        var len = gen.const("len", (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ".length"], ["", ".length"])), data));
        if (schema === false) {
            cxt.setParams({ len: items });
            cxt.fail((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " > ", ""], ["", " > ", ""])), len, items));
        }
        else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            var valid_1 = gen.var("valid", (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " <= ", ""], ["", " <= ", ""])), len, items));
            gen.if((0, codegen_1.not)(valid_1), function () { return validateItems(valid_1, items); });
            cxt.ok(valid_1);
        }
        it.items = true;
        function validateItems(valid, from) {
            gen.forRange("i", from, len, function (i) {
                cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: util_1.Type.Num }, valid);
                if (!it.allErrors)
                    gen.if((0, codegen_1.not)(valid), function () { return gen.break(); });
            });
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
