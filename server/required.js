"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var code_1 = require("../code");
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var error = {
    message: function (_a) {
        var missingProperty = _a.params.missingProperty;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must have required property '", "'"], ["must have required property '", "'"])), missingProperty);
    },
    params: function (_a) {
        var missingProperty = _a.params.missingProperty;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{missingProperty: ", "}"], ["{missingProperty: ", "}"])), missingProperty);
    },
};
var def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, schemaCode = cxt.schemaCode, data = cxt.data, $data = cxt.$data, it = cxt.it;
        var opts = it.opts;
        if (!$data && schema.length === 0)
            return;
        var useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
            allErrorsMode();
        else
            exitOnErrorMode();
        if (opts.strictRequired) {
            var props = cxt.parentSchema.properties;
            var definedProperties = cxt.it.definedProperties;
            for (var _i = 0, schema_1 = schema; _i < schema_1.length; _i++) {
                var requiredKey = schema_1[_i];
                if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
                    var schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
                    var msg = "required property \"".concat(requiredKey, "\" is not defined at \"").concat(schemaPath, "\" (strictRequired)");
                    (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
                }
            }
        }
        function allErrorsMode() {
            if (useLoop || $data) {
                cxt.block$data(codegen_1.nil, loopAllRequired);
            }
            else {
                for (var _i = 0, schema_2 = schema; _i < schema_2.length; _i++) {
                    var prop = schema_2[_i];
                    (0, code_1.checkReportMissingProp)(cxt, prop);
                }
            }
        }
        function exitOnErrorMode() {
            var missing = gen.let("missing");
            if (useLoop || $data) {
                var valid_1 = gen.let("valid", true);
                cxt.block$data(valid_1, function () { return loopUntilMissing(missing, valid_1); });
                cxt.ok(valid_1);
            }
            else {
                gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
                (0, code_1.reportMissingProp)(cxt, missing);
                gen.else();
            }
        }
        function loopAllRequired() {
            gen.forOf("prop", schemaCode, function (prop) {
                cxt.setParams({ missingProperty: prop });
                gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), function () { return cxt.error(); });
            });
        }
        function loopUntilMissing(missing, valid) {
            cxt.setParams({ missingProperty: missing });
            gen.forOf(missing, schemaCode, function () {
                gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
                gen.if((0, codegen_1.not)(valid), function () {
                    cxt.error();
                    gen.break();
                });
            }, codegen_1.nil);
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2;
