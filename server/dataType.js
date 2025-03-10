"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataType = void 0;
exports.getSchemaTypes = getSchemaTypes;
exports.getJSONTypes = getJSONTypes;
exports.coerceAndCheckDataType = coerceAndCheckDataType;
exports.checkDataType = checkDataType;
exports.checkDataTypes = checkDataTypes;
exports.reportTypeError = reportTypeError;
var rules_1 = require("../rules");
var applicability_1 = require("./applicability");
var errors_1 = require("../errors");
var codegen_1 = require("../codegen");
var util_1 = require("../util");
var DataType;
(function (DataType) {
    DataType[DataType["Correct"] = 0] = "Correct";
    DataType[DataType["Wrong"] = 1] = "Wrong";
})(DataType || (exports.DataType = DataType = {}));
function getSchemaTypes(schema) {
    var types = getJSONTypes(schema.type);
    var hasNull = types.includes("null");
    if (hasNull) {
        if (schema.nullable === false)
            throw new Error("type: null contradicts nullable: false");
    }
    else {
        if (!types.length && schema.nullable !== undefined) {
            throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
            types.push("null");
    }
    return types;
}
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
function getJSONTypes(ts) {
    var types = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types.every(rules_1.isJSONType))
        return types;
    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
}
function coerceAndCheckDataType(it, types) {
    var gen = it.gen, data = it.data, opts = it.opts;
    var coerceTo = coerceToTypes(types, opts.coerceTypes);
    var checkTypes = types.length > 0 &&
        !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
    if (checkTypes) {
        var wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, function () {
            if (coerceTo.length)
                coerceData(it, types, coerceTo);
            else
                reportTypeError(it);
        });
    }
    return checkTypes;
}
var COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
function coerceToTypes(types, coerceTypes) {
    return coerceTypes
        ? types.filter(function (t) { return COERCIBLE.has(t) || (coerceTypes === "array" && t === "array"); })
        : [];
}
function coerceData(it, types, coerceTo) {
    var gen = it.gen, data = it.data, opts = it.opts;
    var dataType = gen.let("dataType", (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["typeof ", ""], ["typeof ", ""])), data));
    var coerced = gen.let("coerced", (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["undefined"], ["undefined"]))));
    if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " == 'object' && Array.isArray(", ") && ", ".length == 1"], ["", " == 'object' && Array.isArray(", ") && ", ".length == 1"])), dataType, data, data), function () {
            return gen
                .assign(data, (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", "[0]"], ["", "[0]"])), data))
                .assign(dataType, (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["typeof ", ""], ["typeof ", ""])), data))
                .if(checkDataTypes(types, data, opts.strictNumbers), function () { return gen.assign(coerced, data); });
        });
    }
    gen.if((0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", " !== undefined"], ["", " !== undefined"])), coerced));
    for (var _i = 0, coerceTo_1 = coerceTo; _i < coerceTo_1.length; _i++) {
        var t = coerceTo_1[_i];
        if (COERCIBLE.has(t) || (t === "array" && opts.coerceTypes === "array")) {
            coerceSpecificType(t);
        }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " !== undefined"], ["", " !== undefined"])), coerced), function () {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
        switch (t) {
            case "string":
                gen
                    .elseIf((0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " == \"number\" || ", " == \"boolean\""], ["", " == \"number\" || ", " == \"boolean\""])), dataType, dataType))
                    .assign(coerced, (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\"\" + ", ""], ["\"\" + ", ""])), data))
                    .elseIf((0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " === null"], ["", " === null"])), data))
                    .assign(coerced, (0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["\"\""], ["\"\""]))));
                return;
            case "number":
                gen
                    .elseIf((0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " == \"boolean\" || ", " === null\n              || (", " == \"string\" && ", " && ", " == +", ")"], ["", " == \"boolean\" || ", " === null\n              || (", " == \"string\" && ", " && ", " == +", ")"])), dataType, data, dataType, data, data, data))
                    .assign(coerced, (0, codegen_1._)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["+", ""], ["+", ""])), data));
                return;
            case "integer":
                gen
                    .elseIf((0, codegen_1._)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", " === \"boolean\" || ", " === null\n              || (", " === \"string\" && ", " && ", " == +", " && !(", " % 1))"], ["", " === \"boolean\" || ", " === null\n              || (", " === \"string\" && ", " && ", " == +", " && !(", " % 1))"])), dataType, data, dataType, data, data, data, data))
                    .assign(coerced, (0, codegen_1._)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["+", ""], ["+", ""])), data));
                return;
            case "boolean":
                gen
                    .elseIf((0, codegen_1._)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["", " === \"false\" || ", " === 0 || ", " === null"], ["", " === \"false\" || ", " === 0 || ", " === null"])), data, data, data))
                    .assign(coerced, false)
                    .elseIf((0, codegen_1._)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", " === \"true\" || ", " === 1"], ["", " === \"true\" || ", " === 1"])), data, data))
                    .assign(coerced, true);
                return;
            case "null":
                gen.elseIf((0, codegen_1._)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["", " === \"\" || ", " === 0 || ", " === false"], ["", " === \"\" || ", " === 0 || ", " === false"])), data, data, data));
                gen.assign(coerced, null);
                return;
            case "array":
                gen
                    .elseIf((0, codegen_1._)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["", " === \"string\" || ", " === \"number\"\n              || ", " === \"boolean\" || ", " === null"], ["", " === \"string\" || ", " === \"number\"\n              || ", " === \"boolean\" || ", " === null"])), dataType, dataType, dataType, data))
                    .assign(coerced, (0, codegen_1._)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["[", "]"], ["[", "]"])), data));
        }
    }
}
function assignParentData(_a, expr) {
    var gen = _a.gen, parentData = _a.parentData, parentDataProperty = _a.parentDataProperty;
    // TODO use gen.property
    gen.if((0, codegen_1._)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["", " !== undefined"], ["", " !== undefined"])), parentData), function () {
        return gen.assign((0, codegen_1._)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), parentData, parentDataProperty), expr);
    });
}
function checkDataType(dataType, data, strictNums, correct) {
    if (correct === void 0) { correct = DataType.Correct; }
    var EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    var cond;
    switch (dataType) {
        case "null":
            return (0, codegen_1._)(templateObject_23 || (templateObject_23 = __makeTemplateObject(["", " ", " null"], ["", " ", " null"])), data, EQ);
        case "array":
            cond = (0, codegen_1._)(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Array.isArray(", ")"], ["Array.isArray(", ")"])), data);
            break;
        case "object":
            cond = (0, codegen_1._)(templateObject_25 || (templateObject_25 = __makeTemplateObject(["", " && typeof ", " == \"object\" && !Array.isArray(", ")"], ["", " && typeof ", " == \"object\" && !Array.isArray(", ")"])), data, data, data);
            break;
        case "integer":
            cond = numCond((0, codegen_1._)(templateObject_26 || (templateObject_26 = __makeTemplateObject(["!(", " % 1) && !isNaN(", ")"], ["!(", " % 1) && !isNaN(", ")"])), data, data));
            break;
        case "number":
            cond = numCond();
            break;
        default:
            return (0, codegen_1._)(templateObject_27 || (templateObject_27 = __makeTemplateObject(["typeof ", " ", " ", ""], ["typeof ", " ", " ", ""])), data, EQ, dataType);
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond) {
        if (_cond === void 0) { _cond = codegen_1.nil; }
        return (0, codegen_1.and)((0, codegen_1._)(templateObject_28 || (templateObject_28 = __makeTemplateObject(["typeof ", " == \"number\""], ["typeof ", " == \"number\""])), data), _cond, strictNums ? (0, codegen_1._)(templateObject_29 || (templateObject_29 = __makeTemplateObject(["isFinite(", ")"], ["isFinite(", ")"])), data) : codegen_1.nil);
    }
}
function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    var cond;
    var types = (0, util_1.toHash)(dataTypes);
    if (types.array && types.object) {
        var notObj = (0, codegen_1._)(templateObject_30 || (templateObject_30 = __makeTemplateObject(["typeof ", " != \"object\""], ["typeof ", " != \"object\""])), data);
        cond = types.null ? notObj : (0, codegen_1._)(templateObject_31 || (templateObject_31 = __makeTemplateObject(["!", " || ", ""], ["!", " || ", ""])), data, notObj);
        delete types.null;
        delete types.array;
        delete types.object;
    }
    else {
        cond = codegen_1.nil;
    }
    if (types.number)
        delete types.integer;
    for (var t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
}
var typeError = {
    message: function (_a) {
        var schema = _a.schema;
        return "must be ".concat(schema);
    },
    params: function (_a) {
        var schema = _a.schema, schemaValue = _a.schemaValue;
        return typeof schema == "string" ? (0, codegen_1._)(templateObject_32 || (templateObject_32 = __makeTemplateObject(["{type: ", "}"], ["{type: ", "}"])), schema) : (0, codegen_1._)(templateObject_33 || (templateObject_33 = __makeTemplateObject(["{type: ", "}"], ["{type: ", "}"])), schemaValue);
    },
};
function reportTypeError(it) {
    var cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
}
function getTypeErrorContext(it) {
    var gen = it.gen, data = it.data, schema = it.schema;
    var schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
        gen: gen,
        keyword: "type",
        data: data,
        schema: schema.type,
        schemaCode: schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it: it,
    };
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33;
