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
        var _b = _a.params, min = _b.min, max = _b.max;
        return max === undefined
            ? (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must contain at least ", " valid item(s)"], ["must contain at least ", " valid item(s)"])), min) : (0, codegen_1.str)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["must contain at least ", " and no more than ", " valid item(s)"], ["must contain at least ", " and no more than ", " valid item(s)"])), min, max);
    },
    params: function (_a) {
        var _b = _a.params, min = _b.min, max = _b.max;
        return max === undefined ? (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["{minContains: ", "}"], ["{minContains: ", "}"])), min) : (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["{minContains: ", ", maxContains: ", "}"], ["{minContains: ", ", maxContains: ", "}"])), min, max);
    },
};
var def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, parentSchema = cxt.parentSchema, data = cxt.data, it = cxt.it;
        var min;
        var max;
        var minContains = parentSchema.minContains, maxContains = parentSchema.maxContains;
        if (it.opts.next) {
            min = minContains === undefined ? 1 : minContains;
            max = maxContains;
        }
        else {
            min = 1;
        }
        var len = gen.const("len", (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", ".length"], ["", ".length"])), data));
        cxt.setParams({ min: min, max: max });
        if (max === undefined && min === 0) {
            (0, util_1.checkStrictMode)(it, "\"minContains\" == 0 without \"maxContains\": \"contains\" keyword ignored");
            return;
        }
        if (max !== undefined && min > max) {
            (0, util_1.checkStrictMode)(it, "\"minContains\" > \"maxContains\" is always invalid");
            cxt.fail();
            return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
            var cond = (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), len, min);
            if (max !== undefined)
                cond = (0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " && ", " <= ", ""], ["", " && ", " <= ", ""])), cond, len, max);
            cxt.pass(cond);
            return;
        }
        it.items = true;
        var valid = gen.name("valid");
        if (max === undefined && min === 1) {
            validateItems(valid, function () { return gen.if(valid, function () { return gen.break(); }); });
        }
        else if (min === 0) {
            gen.let(valid, true);
            if (max !== undefined)
                gen.if((0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", ".length > 0"], ["", ".length > 0"])), data), validateItemsWithCount);
        }
        else {
            gen.let(valid, false);
            validateItemsWithCount();
        }
        cxt.result(valid, function () { return cxt.reset(); });
        function validateItemsWithCount() {
            var schValid = gen.name("_valid");
            var count = gen.let("count", 0);
            validateItems(schValid, function () { return gen.if(schValid, function () { return checkLimits(count); }); });
        }
        function validateItems(_valid, block) {
            gen.forRange("i", 0, len, function (i) {
                cxt.subschema({
                    keyword: "contains",
                    dataProp: i,
                    dataPropType: util_1.Type.Num,
                    compositeRule: true,
                }, _valid);
                block();
            });
        }
        function checkLimits(count) {
            gen.code((0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", "++"], ["", "++"])), count));
            if (max === undefined) {
                gen.if((0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), count, min), function () { return gen.assign(valid, true).break(); });
            }
            else {
                gen.if((0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["", " > ", ""], ["", " > ", ""])), count, max), function () { return gen.assign(valid, false).break(); });
                if (min === 1)
                    gen.assign(valid, true);
                else
                    gen.if((0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), count, min), function () { return gen.assign(valid, true); });
            }
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;
