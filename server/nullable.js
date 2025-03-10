"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNullable = checkNullable;
exports.checkNullableObject = checkNullableObject;
var codegen_1 = require("../../compile/codegen");
function checkNullable(_a, cond) {
    var gen = _a.gen, data = _a.data, parentSchema = _a.parentSchema;
    if (cond === void 0) { cond = codegen_1.nil; }
    var valid = gen.name("valid");
    if (parentSchema.nullable) {
        gen.let(valid, (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " === null"], ["", " === null"])), data));
        cond = (0, codegen_1.not)(valid);
    }
    else {
        gen.let(valid, false);
    }
    return [valid, cond];
}
function checkNullableObject(cxt, cond) {
    var _a = checkNullable(cxt, cond), valid = _a[0], cond_ = _a[1];
    return [valid, (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " && typeof ", " == \"object\" && !Array.isArray(", ")"], ["", " && typeof ", " == \"object\" && !Array.isArray(", ")"])), cond_, cxt.data, cxt.data)];
}
var templateObject_1, templateObject_2;
