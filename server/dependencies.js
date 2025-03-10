"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
exports.validatePropertyDeps = validatePropertyDeps;
exports.validateSchemaDeps = validateSchemaDeps;
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var code_1 = require("../code");
exports.error = {
    message: function (_a) {
        var _b = _a.params, property = _b.property, depsCount = _b.depsCount, deps = _b.deps;
        var property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must have ", " ", " when property ", " is present"], ["must have ", " ", " when property ", " is present"])), property_ies, deps, property);
    },
    params: function (_a) {
        var _b = _a.params, property = _b.property, depsCount = _b.depsCount, deps = _b.deps, missingProperty = _b.missingProperty;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{property: ", ",\n    missingProperty: ", ",\n    depsCount: ", ",\n    deps: ", "}"], ["{property: ", ",\n    missingProperty: ", ",\n    depsCount: ", ",\n    deps: ", "}"])), property, missingProperty, depsCount, deps);
    }, // TODO change to reference
};
var def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code: function (cxt) {
        var _a = splitDependencies(cxt), propDeps = _a[0], schDeps = _a[1];
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
    },
};
function splitDependencies(_a) {
    var schema = _a.schema;
    var propertyDeps = {};
    var schemaDeps = {};
    for (var key in schema) {
        if (key === "__proto__")
            continue;
        var deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
}
function validatePropertyDeps(cxt, propertyDeps) {
    if (propertyDeps === void 0) { propertyDeps = cxt.schema; }
    var gen = cxt.gen, data = cxt.data, it = cxt.it;
    if (Object.keys(propertyDeps).length === 0)
        return;
    var missing = gen.let("missing");
    var _loop_1 = function (prop) {
        var deps = propertyDeps[prop];
        if (deps.length === 0)
            return "continue";
        var hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
            property: prop,
            depsCount: deps.length,
            deps: deps.join(", "),
        });
        if (it.allErrors) {
            gen.if(hasProperty, function () {
                for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
                    var depProp = deps_1[_i];
                    (0, code_1.checkReportMissingProp)(cxt, depProp);
                }
            });
        }
        else {
            gen.if((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " && (", ")"], ["", " && (", ")"])), hasProperty, (0, code_1.checkMissingProp)(cxt, deps, missing)));
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
        }
    };
    for (var prop in propertyDeps) {
        _loop_1(prop);
    }
}
function validateSchemaDeps(cxt, schemaDeps) {
    if (schemaDeps === void 0) { schemaDeps = cxt.schema; }
    var gen = cxt.gen, data = cxt.data, keyword = cxt.keyword, it = cxt.it;
    var valid = gen.name("valid");
    var _loop_2 = function (prop) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
            return "continue";
        gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), function () {
            var schCxt = cxt.subschema({ keyword: keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
        }, function () { return gen.var(valid, true); } // TODO var
        );
        cxt.ok(valid);
    };
    for (var prop in schemaDeps) {
        _loop_2(prop);
    }
}
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3;
