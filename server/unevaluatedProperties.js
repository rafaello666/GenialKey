"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var names_1 = require("../../compile/names");
var error = {
    message: "must NOT have unevaluated properties",
    params: function (_a) {
        var params = _a.params;
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{unevaluatedProperty: ", "}"], ["{unevaluatedProperty: ", "}"])), params.unevaluatedProperty);
    },
};
var def = {
    keyword: "unevaluatedProperties",
    type: "object",
    schemaType: ["boolean", "object"],
    trackErrors: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, data = cxt.data, errsCount = cxt.errsCount, it = cxt.it;
        /* istanbul ignore if */
        if (!errsCount)
            throw new Error("ajv implementation error");
        var allErrors = it.allErrors, props = it.props;
        if (props instanceof codegen_1.Name) {
            gen.if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " !== true"], ["", " !== true"])), props), function () {
                return gen.forIn("key", data, function (key) {
                    return gen.if(unevaluatedDynamic(props, key), function () { return unevaluatedPropCode(key); });
                });
            });
        }
        else if (props !== true) {
            gen.forIn("key", data, function (key) {
                return props === undefined
                    ? unevaluatedPropCode(key)
                    : gen.if(unevaluatedStatic(props, key), function () { return unevaluatedPropCode(key); });
            });
        }
        it.props = true;
        cxt.ok((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), errsCount, names_1.default.errors));
        function unevaluatedPropCode(key) {
            if (schema === false) {
                cxt.setParams({ unevaluatedProperty: key });
                cxt.error();
                if (!allErrors)
                    gen.break();
                return;
            }
            if (!(0, util_1.alwaysValidSchema)(it, schema)) {
                var valid = gen.name("valid");
                cxt.subschema({
                    keyword: "unevaluatedProperties",
                    dataProp: key,
                    dataPropType: util_1.Type.Str,
                }, valid);
                if (!allErrors)
                    gen.if((0, codegen_1.not)(valid), function () { return gen.break(); });
            }
        }
        function unevaluatedDynamic(evaluatedProps, key) {
            return (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["!", " || !", "[", "]"], ["!", " || !", "[", "]"])), evaluatedProps, evaluatedProps, key);
        }
        function unevaluatedStatic(evaluatedProps, key) {
            var ps = [];
            for (var p in evaluatedProps) {
                if (evaluatedProps[p] === true)
                    ps.push((0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " !== ", ""], ["", " !== ", ""])), key, p));
            }
            return codegen_1.and.apply(void 0, ps);
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
