"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeError = typeError;
exports.typeErrorMessage = typeErrorMessage;
exports.typeErrorParams = typeErrorParams;
var codegen_1 = require("../../compile/codegen");
function typeError(t) {
    return {
        message: function (cxt) { return typeErrorMessage(cxt, t); },
        params: function (cxt) { return typeErrorParams(cxt, t); },
    };
}
function typeErrorMessage(_a, t) {
    var parentSchema = _a.parentSchema;
    return (parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.nullable) ? "must be ".concat(t, " or null") : "must be ".concat(t);
}
function typeErrorParams(_a, t) {
    var parentSchema = _a.parentSchema;
    return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{type: ", ", nullable: ", "}"], ["{type: ", ", nullable: ", "}"])), t, !!(parentSchema === null || parentSchema === void 0 ? void 0 : parentSchema.nullable));
}
var templateObject_1;
