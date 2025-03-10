"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var error = {
    message: "must match exactly one schema in oneOf",
    params: function (_a) {
        var params = _a.params;
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{passingSchemas: ", "}"], ["{passingSchemas: ", "}"])), params.passing);
    },
};
var def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, parentSchema = cxt.parentSchema, it = cxt.it;
        /* istanbul ignore if */
        if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
            return;
        var schArr = schema;
        var valid = gen.let("valid", false);
        var passing = gen.let("passing", null);
        var schValid = gen.name("_valid");
        cxt.setParams({ passing: passing });
        // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas
        gen.block(validateOneOf);
        cxt.result(valid, function () { return cxt.reset(); }, function () { return cxt.error(true); });
        function validateOneOf() {
            schArr.forEach(function (sch, i) {
                var schCxt;
                if ((0, util_1.alwaysValidSchema)(it, sch)) {
                    gen.var(schValid, true);
                }
                else {
                    schCxt = cxt.subschema({
                        keyword: "oneOf",
                        schemaProp: i,
                        compositeRule: true,
                    }, schValid);
                }
                if (i > 0) {
                    gen
                        .if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " && ", ""], ["", " && ", ""])), schValid, valid))
                        .assign(valid, false)
                        .assign(passing, (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["[", ", ", "]"], ["[", ", ", "]"])), passing, i))
                        .else();
                }
                gen.if(schValid, function () {
                    gen.assign(valid, true);
                    gen.assign(passing, i);
                    if (schCxt)
                        cxt.mergeEvaluated(schCxt, codegen_1.Name);
                });
            });
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3;
