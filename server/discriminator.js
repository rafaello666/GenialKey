"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var metadata_1 = require("./metadata");
var nullable_1 = require("./nullable");
var error_1 = require("./error");
var types_1 = require("../discriminator/types");
var error = {
    message: function (cxt) {
        var schema = cxt.schema, params = cxt.params;
        return params.discrError
            ? params.discrError === types_1.DiscrError.Tag
                ? "tag \"".concat(schema, "\" must be string")
                : "value of tag \"".concat(schema, "\" must be in mapping")
            : (0, error_1.typeErrorMessage)(cxt, "object");
    },
    params: function (cxt) {
        var schema = cxt.schema, params = cxt.params;
        return params.discrError
            ? (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{error: ", ", tag: ", ", tagValue: ", "}"], ["{error: ", ", tag: ", ", tagValue: ", "}"])), params.discrError, schema, params.tag) : (0, error_1.typeErrorParams)(cxt, "object");
    },
};
var def = {
    keyword: "discriminator",
    schemaType: "string",
    implements: ["mapping"],
    error: error,
    code: function (cxt) {
        (0, metadata_1.checkMetadata)(cxt);
        var gen = cxt.gen, data = cxt.data, schema = cxt.schema, parentSchema = cxt.parentSchema;
        var _a = (0, nullable_1.checkNullableObject)(cxt, data), valid = _a[0], cond = _a[1];
        gen.if(cond);
        validateDiscriminator();
        gen.elseIf((0, codegen_1.not)(valid));
        cxt.error();
        gen.endIf();
        cxt.ok(valid);
        function validateDiscriminator() {
            var tag = gen.const("tag", (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", "", ""], ["", "", ""])), data, (0, codegen_1.getProperty)(schema)));
            gen.if((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " === undefined"], ["", " === undefined"])), tag));
            cxt.error(false, { discrError: types_1.DiscrError.Tag, tag: tag });
            gen.elseIf((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["typeof ", " == \"string\""], ["typeof ", " == \"string\""])), tag));
            validateMapping(tag);
            gen.else();
            cxt.error(false, { discrError: types_1.DiscrError.Tag, tag: tag }, { instancePath: schema });
            gen.endIf();
        }
        function validateMapping(tag) {
            gen.if(false);
            for (var tagValue in parentSchema.mapping) {
                gen.elseIf((0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), tag, tagValue));
                gen.assign(valid, applyTagSchema(tagValue));
            }
            gen.else();
            cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag: tag }, { instancePath: schema, schemaPath: "mapping", parentSchema: true });
            gen.endIf();
        }
        function applyTagSchema(schemaProp) {
            var _valid = gen.name("valid");
            cxt.subschema({
                keyword: "mapping",
                schemaProp: schemaProp,
                jtdDiscriminator: schema,
            }, _valid);
            return _valid;
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
