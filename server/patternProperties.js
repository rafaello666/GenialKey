"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var code_1 = require("../code");
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var util_2 = require("../../compile/util");
var def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, data = cxt.data, parentSchema = cxt.parentSchema, it = cxt.it;
        var opts = it.opts;
        var patterns = (0, code_1.allSchemaProperties)(schema);
        var alwaysValidPatterns = patterns.filter(function (p) {
            return (0, util_1.alwaysValidSchema)(it, schema[p]);
        });
        if (patterns.length === 0 ||
            (alwaysValidPatterns.length === patterns.length &&
                (!it.opts.unevaluated || it.props === true))) {
            return;
        }
        var checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        var valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
            it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        var props = it.props;
        validatePatternProperties();
        function validatePatternProperties() {
            for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                var pat = patterns_1[_i];
                if (checkProperties)
                    checkMatchingProperties(pat);
                if (it.allErrors) {
                    validateProperties(pat);
                }
                else {
                    gen.var(valid, true); // TODO var
                    validateProperties(pat);
                    gen.if(valid);
                }
            }
        }
        function checkMatchingProperties(pat) {
            for (var prop in checkProperties) {
                if (new RegExp(pat).test(prop)) {
                    (0, util_1.checkStrictMode)(it, "property ".concat(prop, " matches pattern ").concat(pat, " (use allowMatchingProperties)"));
                }
            }
        }
        function validateProperties(pat) {
            gen.forIn("key", data, function (key) {
                gen.if((0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ".test(", ")"], ["", ".test(", ")"])), (0, code_1.usePattern)(cxt, pat), key), function () {
                    var alwaysValid = alwaysValidPatterns.includes(pat);
                    if (!alwaysValid) {
                        cxt.subschema({
                            keyword: "patternProperties",
                            schemaProp: pat,
                            dataProp: key,
                            dataPropType: util_2.Type.Str,
                        }, valid);
                    }
                    if (it.opts.unevaluated && props !== true) {
                        gen.assign((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), props, key), true);
                    }
                    else if (!alwaysValid && !it.allErrors) {
                        // can short-circuit if `unevaluatedProperties` is not supported (opts.next === false)
                        // or if all properties were evaluated (props === true)
                        gen.if((0, codegen_1.not)(valid), function () { return gen.break(); });
                    }
                });
            });
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2;
