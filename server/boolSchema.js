"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
exports.boolOrEmptySchema = boolOrEmptySchema;
var errors_1 = require("../errors");
var codegen_1 = require("../codegen");
var names_1 = require("../names");
var boolError = {
    message: "boolean schema is false",
};
function topBoolOrEmptySchema(it) {
    var gen = it.gen, schema = it.schema, validateName = it.validateName;
    if (schema === false) {
        falseSchemaError(it, false);
    }
    else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
    }
    else {
        gen.assign((0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ".errors"], ["", ".errors"])), validateName), null);
        gen.return(true);
    }
}
function boolOrEmptySchema(it, valid) {
    var gen = it.gen, schema = it.schema;
    if (schema === false) {
        gen.var(valid, false); // TODO var
        falseSchemaError(it);
    }
    else {
        gen.var(valid, true); // TODO var
    }
}
function falseSchemaError(it, overrideAllErrors) {
    var gen = it.gen, data = it.data;
    // TODO maybe some other interface should be used for non-keyword validation errors...
    var cxt = {
        gen: gen,
        keyword: "false schema",
        data: data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it: it,
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
}
var templateObject_1;
