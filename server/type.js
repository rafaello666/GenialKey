"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intRange = void 0;
var codegen_1 = require("../../compile/codegen");
var timestamp_1 = require("../../runtime/timestamp");
var util_1 = require("../../compile/util");
var metadata_1 = require("./metadata");
var error_1 = require("./error");
exports.intRange = {
    int8: [-128, 127, 3],
    uint8: [0, 255, 3],
    int16: [-32768, 32767, 5],
    uint16: [0, 65535, 5],
    int32: [-2147483648, 2147483647, 10],
    uint32: [0, 4294967295, 10],
};
var error = {
    message: function (cxt) { return (0, error_1.typeErrorMessage)(cxt, cxt.schema); },
    params: function (cxt) { return (0, error_1.typeErrorParams)(cxt, cxt.schema); },
};
function timestampCode(cxt) {
    var gen = cxt.gen, data = cxt.data, it = cxt.it;
    var _a = it.opts, timestamp = _a.timestamp, allowDate = _a.allowDate;
    if (timestamp === "date")
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " instanceof Date "], ["", " instanceof Date "])), data);
    var vts = (0, util_1.useFunc)(gen, timestamp_1.default);
    var allowDateArg = allowDate ? (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject([", true"], [", true"]))) : codegen_1.nil;
    var validString = (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["typeof ", " == \"string\" && ", "(", "", ")"], ["typeof ", " == \"string\" && ", "(", "", ")"])), data, vts, data, allowDateArg);
    return timestamp === "string" ? validString : (0, codegen_1.or)((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " instanceof Date"], ["", " instanceof Date"])), data), validString);
}
var def = {
    keyword: "type",
    schemaType: "string",
    error: error,
    code: function (cxt) {
        (0, metadata_1.checkMetadata)(cxt);
        var data = cxt.data, schema = cxt.schema, parentSchema = cxt.parentSchema, it = cxt.it;
        var cond;
        switch (schema) {
            case "boolean":
            case "string":
                cond = (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["typeof ", " == ", ""], ["typeof ", " == ", ""])), data, schema);
                break;
            case "timestamp": {
                cond = timestampCode(cxt);
                break;
            }
            case "float32":
            case "float64":
                cond = (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["typeof ", " == \"number\""], ["typeof ", " == \"number\""])), data);
                break;
            default: {
                var sch = schema;
                cond = (0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["typeof ", " == \"number\" && isFinite(", ") && !(", " % 1)"], ["typeof ", " == \"number\" && isFinite(", ") && !(", " % 1)"])), data, data, data);
                if (!it.opts.int32range && (sch === "int32" || sch === "uint32")) {
                    if (sch === "uint32")
                        cond = (0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " && ", " >= 0"], ["", " && ", " >= 0"])), cond, data);
                }
                else {
                    var _a = exports.intRange[sch], min = _a[0], max = _a[1];
                    cond = (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", " && ", " >= ", " && ", " <= ", ""], ["", " && ", " >= ", " && ", " <= ", ""])), cond, data, min, data, max);
                }
            }
        }
        cxt.pass(parentSchema.nullable ? (0, codegen_1.or)((0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " === null"], ["", " === null"])), data), cond) : cond);
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
