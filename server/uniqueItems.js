"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dataType_1 = require("../../compile/validate/dataType");
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var equal_1 = require("../../runtime/equal");
var error = {
    message: function (_a) {
        var _b = _a.params, i = _b.i, j = _b.j;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must NOT have duplicate items (items ## ", " and ", " are identical)"], ["must NOT have duplicate items (items ## ", " and ", " are identical)"])), j, i);
    },
    params: function (_a) {
        var _b = _a.params, i = _b.i, j = _b.j;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{i: ", ", j: ", "}"], ["{i: ", ", j: ", "}"])), i, j);
    },
};
var def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, data = cxt.data, $data = cxt.$data, schema = cxt.schema, parentSchema = cxt.parentSchema, schemaCode = cxt.schemaCode, it = cxt.it;
        if (!$data && !schema)
            return;
        var valid = gen.let("valid");
        var itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " === false"], ["", " === false"])), schemaCode));
        cxt.ok(valid);
        function validateUniqueItems() {
            var i = gen.let("i", (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", ".length"], ["", ".length"])), data));
            var j = gen.let("j");
            cxt.setParams({ i: i, j: j });
            gen.assign(valid, true);
            gen.if((0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " > 1"], ["", " > 1"])), i), function () { return (canOptimize() ? loopN : loopN2)(i, j); });
        }
        function canOptimize() {
            return itemTypes.length > 0 && !itemTypes.some(function (t) { return t === "object" || t === "array"; });
        }
        function loopN(i, j) {
            var item = gen.name("item");
            var wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
            var indices = gen.const("indices", (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["{}"], ["{}"]))));
            gen.for((0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject([";", "--;"], [";", "--;"])), i), function () {
                gen.let(item, (0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), data, i));
                gen.if(wrongType, (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["continue"], ["continue"]))));
                if (itemTypes.length > 1)
                    gen.if((0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["typeof ", " == \"string\""], ["typeof ", " == \"string\""])), item), (0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["", " += \"_\""], ["", " += \"_\""])), item));
                gen
                    .if((0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["typeof ", "[", "] == \"number\""], ["typeof ", "[", "] == \"number\""])), indices, item), function () {
                    gen.assign(j, (0, codegen_1._)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), indices, item));
                    cxt.error();
                    gen.assign(valid, false).break();
                })
                    .code((0, codegen_1._)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", "[", "] = ", ""], ["", "[", "] = ", ""])), indices, item, i));
            });
        }
        function loopN2(i, j) {
            var eql = (0, util_1.useFunc)(gen, equal_1.default);
            var outer = gen.name("outer");
            gen.label(outer).for((0, codegen_1._)(templateObject_15 || (templateObject_15 = __makeTemplateObject([";", "--;"], [";", "--;"])), i), function () {
                return gen.for((0, codegen_1._)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["", " = ", "; ", "--;"], ["", " = ", "; ", "--;"])), j, i, j), function () {
                    return gen.if((0, codegen_1._)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", "(", "[", "], ", "[", "])"], ["", "(", "[", "], ", "[", "])"])), eql, data, i, data, j), function () {
                        cxt.error();
                        gen.assign(valid, false).break(outer);
                    });
                });
            });
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17;
