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
exports.getSubschema = getSubschema;
exports.extendSubschemaData = extendSubschemaData;
exports.extendSubschemaMode = extendSubschemaMode;
var codegen_1 = require("../codegen");
var util_1 = require("../util");
function getSubschema(it, _a) {
    var keyword = _a.keyword, schemaProp = _a.schemaProp, schema = _a.schema, schemaPath = _a.schemaPath, errSchemaPath = _a.errSchemaPath, topSchemaRef = _a.topSchemaRef;
    if (keyword !== undefined && schema !== undefined) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
        var sch = it.schema[keyword];
        return schemaProp === undefined
            ? {
                schema: sch,
                schemaPath: (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "", ""], ["", "", ""])), it.schemaPath, (0, codegen_1.getProperty)(keyword)),
                errSchemaPath: "".concat(it.errSchemaPath, "/").concat(keyword),
            }
            : {
                schema: sch[schemaProp],
                schemaPath: (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", "", "", ""], ["", "", "", ""])), it.schemaPath, (0, codegen_1.getProperty)(keyword), (0, codegen_1.getProperty)(schemaProp)),
                errSchemaPath: "".concat(it.errSchemaPath, "/").concat(keyword, "/").concat((0, util_1.escapeFragment)(schemaProp)),
            };
    }
    if (schema !== undefined) {
        if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
            throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
            schema: schema,
            schemaPath: schemaPath,
            topSchemaRef: topSchemaRef,
            errSchemaPath: errSchemaPath,
        };
    }
    throw new Error('either "keyword" or "schema" must be passed');
}
function extendSubschemaData(subschema, it, _a) {
    var dataProp = _a.dataProp, dpType = _a.dataPropType, data = _a.data, dataTypes = _a.dataTypes, propertyName = _a.propertyName;
    if (data !== undefined && dataProp !== undefined) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    var gen = it.gen;
    if (dataProp !== undefined) {
        var errorPath = it.errorPath, dataPathArr = it.dataPathArr, opts = it.opts;
        var nextData = gen.let("data", (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", "", ""], ["", "", ""])), it.data, (0, codegen_1.getProperty)(dataProp)), true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", "", ""], ["", "", ""])), errorPath, (0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax));
        subschema.parentDataProperty = (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", ""], ["", ""])), dataProp);
        subschema.dataPathArr = __spreadArray(__spreadArray([], dataPathArr, true), [subschema.parentDataProperty], false);
    }
    if (data !== undefined) {
        var nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true); // replaceable if used once?
        dataContextProps(nextData);
        if (propertyName !== undefined)
            subschema.propertyName = propertyName;
        // TODO something is possibly wrong here with not changing parentDataProperty and not appending dataPathArr
    }
    if (dataTypes)
        subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = new Set();
        subschema.parentData = it.data;
        subschema.dataNames = __spreadArray(__spreadArray([], it.dataNames, true), [_nextData], false);
    }
}
function extendSubschemaMode(subschema, _a) {
    var jtdDiscriminator = _a.jtdDiscriminator, jtdMetadata = _a.jtdMetadata, compositeRule = _a.compositeRule, createErrors = _a.createErrors, allErrors = _a.allErrors;
    if (compositeRule !== undefined)
        subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
        subschema.createErrors = createErrors;
    if (allErrors !== undefined)
        subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator; // not inherited
    subschema.jtdMetadata = jtdMetadata; // not inherited
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
