"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDefaults = assignDefaults;
var codegen_1 = require("../codegen");
var util_1 = require("../util");
function assignDefaults(it, ty) {
    var _a = it.schema, properties = _a.properties, items = _a.items;
    if (ty === "object" && properties) {
        for (var key in properties) {
            assignDefault(it, key, properties[key].default);
        }
    }
    else if (ty === "array" && Array.isArray(items)) {
        items.forEach(function (sch, i) { return assignDefault(it, i, sch.default); });
    }
}
function assignDefault(it, prop, defaultValue) {
    var gen = it.gen, compositeRule = it.compositeRule, data = it.data, opts = it.opts;
    if (defaultValue === undefined)
        return;
    var childData = (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "", ""], ["", "", ""])), data, (0, codegen_1.getProperty)(prop));
    if (compositeRule) {
        (0, util_1.checkStrictMode)(it, "default is ignored for: ".concat(childData));
        return;
    }
    var condition = (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " === undefined"], ["", " === undefined"])), childData);
    if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " || ", " === null || ", " === \"\""], ["", " || ", " === null || ", " === \"\""])), condition, childData, childData);
    }
    // `${childData} === undefined` +
    // (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
    gen.if(condition, (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " = ", ""], ["", " = ", ""])), childData, (0, codegen_1.stringify)(defaultValue)));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
