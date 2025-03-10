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
        var params = _a.params;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must match \"", "\" schema"], ["must match \"", "\" schema"])), params.ifClause);
    },
    params: function (_a) {
        var params = _a.params;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{failingKeyword: ", "}"], ["{failingKeyword: ", "}"])), params.ifClause);
    },
};
var def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, parentSchema = cxt.parentSchema, it = cxt.it;
        if (parentSchema.then === undefined && parentSchema.else === undefined) {
            (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        var hasThen = hasSchema(it, "then");
        var hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
            return;
        var valid = gen.let("valid", true);
        var schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
            var ifClause = gen.let("ifClause");
            cxt.setParams({ ifClause: ifClause });
            gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        }
        else if (hasThen) {
            gen.if(schValid, validateClause("then"));
        }
        else {
            gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, function () { return cxt.error(true); });
        function validateIf() {
            var schCxt = cxt.subschema({
                keyword: "if",
                compositeRule: true,
                createErrors: false,
                allErrors: false,
            }, schValid);
            cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
            return function () {
                var schCxt = cxt.subschema({ keyword: keyword }, schValid);
                gen.assign(valid, schValid);
                cxt.mergeValidEvaluated(schCxt, valid);
                if (ifClause)
                    gen.assign(ifClause, (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ""], ["", ""])), keyword));
                else
                    cxt.setParams({ ifClause: keyword });
            };
        }
    },
};
function hasSchema(it, keyword) {
    var schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
}
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3;
