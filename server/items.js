"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTuple = validateTuple;
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var code_1 = require("../code");
var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code: function (cxt) {
        var schema = cxt.schema, it = cxt.it;
        if (Array.isArray(schema))
            return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        cxt.ok((0, code_1.validateArray)(cxt));
    },
};
function validateTuple(cxt, extraItems, schArr) {
    if (schArr === void 0) { schArr = cxt.schema; }
    var gen = cxt.gen, parentSchema = cxt.parentSchema, data = cxt.data, keyword = cxt.keyword, it = cxt.it;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    var valid = gen.name("valid");
    var len = gen.const("len", (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ".length"], ["", ".length"])), data));
    schArr.forEach(function (sch, i) {
        if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
        gen.if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " > ", ""], ["", " > ", ""])), len, i), function () {
            return cxt.subschema({
                keyword: keyword,
                schemaProp: i,
                dataProp: i,
            }, valid);
        });
        cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
        var opts = it.opts, errSchemaPath = it.errSchemaPath;
        var l = schArr.length;
        var fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
            var msg = "\"".concat(keyword, "\" is ").concat(l, "-tuple, but minItems or maxItems/").concat(extraItems, " are not specified or different at path \"").concat(errSchemaPath, "\"");
            (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
    }
}
exports.default = def;
var templateObject_1, templateObject_2;
