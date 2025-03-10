"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var code_1 = require("../code");
var codegen_1 = require("../../compile/codegen");
var names_1 = require("../../compile/names");
var util_1 = require("../../compile/util");
var error = {
    message: "must NOT have additional properties",
    params: function (_a) {
        var params = _a.params;
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{additionalProperty: ", "}"], ["{additionalProperty: ", "}"])), params.additionalProperty);
    },
};
var def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, parentSchema = cxt.parentSchema, data = cxt.data, errsCount = cxt.errsCount, it = cxt.it;
        /* istanbul ignore if */
        if (!errsCount)
            throw new Error("ajv implementation error");
        var allErrors = it.allErrors, opts = it.opts;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
            return;
        var props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        var patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), errsCount, names_1.default.errors));
        function checkAdditionalProperties() {
            gen.forIn("key", data, function (key) {
                if (!props.length && !patProps.length)
                    additionalPropertyCode(key);
                else
                    gen.if(isAdditional(key), function () { return additionalPropertyCode(key); });
            });
        }
        function isAdditional(key) {
            var definedProp;
            if (props.length > 8) {
                // TODO maybe an option instead of hard-coded 8?
                var propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
                definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
            }
            else if (props.length) {
                definedProp = codegen_1.or.apply(void 0, props.map(function (p) { return (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), key, p); }));
            }
            else {
                definedProp = codegen_1.nil;
            }
            if (patProps.length) {
                definedProp = codegen_1.or.apply(void 0, __spreadArray([definedProp], patProps.map(function (p) { return (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", ".test(", ")"], ["", ".test(", ")"])), (0, code_1.usePattern)(cxt, p), key); }), false));
            }
            return (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key) {
            gen.code((0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["delete ", "[", "]"], ["delete ", "[", "]"])), data, key));
        }
        function additionalPropertyCode(key) {
            if (opts.removeAdditional === "all" || (opts.removeAdditional && schema === false)) {
                deleteAdditional(key);
                return;
            }
            if (schema === false) {
                cxt.setParams({ additionalProperty: key });
                cxt.error();
                if (!allErrors)
                    gen.break();
                return;
            }
            if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
                var valid = gen.name("valid");
                if (opts.removeAdditional === "failing") {
                    applyAdditionalSchema(key, valid, false);
                    gen.if((0, codegen_1.not)(valid), function () {
                        cxt.reset();
                        deleteAdditional(key);
                    });
                }
                else {
                    applyAdditionalSchema(key, valid);
                    if (!allErrors)
                        gen.if((0, codegen_1.not)(valid), function () { return gen.break(); });
                }
            }
        }
        function applyAdditionalSchema(key, valid, errors) {
            var subschema = {
                keyword: "additionalProperties",
                dataProp: key,
                dataPropType: util_1.Type.Str,
            };
            if (errors === false) {
                Object.assign(subschema, {
                    compositeRule: true,
                    createErrors: false,
                    allErrors: false,
                });
            }
            cxt.subschema(subschema, valid);
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
