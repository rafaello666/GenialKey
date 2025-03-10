"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var util_1 = require("../../compile/util");
var equal_1 = require("../../runtime/equal");
var error = {
    message: "must be equal to one of the allowed values",
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{allowedValues: ", "}"], ["{allowedValues: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error: error,
    code: function (cxt) {
        var gen = cxt.gen, data = cxt.data, $data = cxt.$data, schema = cxt.schema, schemaCode = cxt.schemaCode, it = cxt.it;
        if (!$data && schema.length === 0)
            throw new Error("enum must have non-empty array");
        var useLoop = schema.length >= it.opts.loopEnum;
        var eql;
        var getEql = function () { return (eql !== null && eql !== void 0 ? eql : (eql = (0, util_1.useFunc)(gen, equal_1.default))); };
        var valid;
        if (useLoop || $data) {
            valid = gen.let("valid");
            cxt.block$data(valid, loopEnum);
        }
        else {
            /* istanbul ignore if */
            if (!Array.isArray(schema))
                throw new Error("ajv implementation error");
            var vSchema_1 = gen.const("vSchema", schemaCode);
            valid = codegen_1.or.apply(void 0, schema.map(function (_x, i) { return equalCode(vSchema_1, i); }));
        }
        cxt.pass(valid);
        function loopEnum() {
            gen.assign(valid, false);
            gen.forOf("v", schemaCode, function (v) {
                return gen.if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", "(", ", ", ")"], ["", "(", ", ", ")"])), getEql(), data, v), function () { return gen.assign(valid, true).break(); });
            });
        }
        function equalCode(vSchema, i) {
            var sch = schema[i];
            return typeof sch === "object" && sch !== null
                ? (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", "(", ", ", "[", "])"], ["", "(", ", ", "[", "])"])), getEql(), data, vSchema, i) : (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), data, sch);
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
