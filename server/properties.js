"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
exports.validateProperties = validateProperties;
var code_1 = require("../code");
var util_1 = require("../../compile/util");
var codegen_1 = require("../../compile/codegen");
var metadata_1 = require("./metadata");
var nullable_1 = require("./nullable");
var error_1 = require("./error");
var PropError;
(function (PropError) {
    PropError["Additional"] = "additional";
    PropError["Missing"] = "missing";
})(PropError || (PropError = {}));
exports.error = {
    message: function (cxt) {
        var params = cxt.params;
        return params.propError
            ? params.propError === PropError.Additional
                ? "must NOT have additional properties"
                : "must have property '".concat(params.missingProperty, "'")
            : (0, error_1.typeErrorMessage)(cxt, "object");
    },
    params: function (cxt) {
        var params = cxt.params;
        return params.propError
            ? params.propError === PropError.Additional
                ? (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["{error: ", ", additionalProperty: ", "}"], ["{error: ", ", additionalProperty: ", "}"])), params.propError, params.additionalProperty) : (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{error: ", ", missingProperty: ", "}"], ["{error: ", ", missingProperty: ", "}"])), params.propError, params.missingProperty)
            : (0, error_1.typeErrorParams)(cxt, "object");
    },
};
var def = {
    keyword: "properties",
    schemaType: "object",
    error: exports.error,
    code: validateProperties,
};
// const error: KeywordErrorDefinition = {
//   message: "should NOT have additional properties",
//   params: ({params}) => _`{additionalProperty: ${params.additionalProperty}}`,
// }
function validateProperties(cxt) {
    (0, metadata_1.checkMetadata)(cxt);
    var gen = cxt.gen, data = cxt.data, parentSchema = cxt.parentSchema, it = cxt.it;
    var additionalProperties = parentSchema.additionalProperties, nullable = parentSchema.nullable;
    if (it.jtdDiscriminator && nullable)
        throw new Error("JTD: nullable inside discriminator mapping");
    if (commonProperties()) {
        throw new Error("JTD: properties and optionalProperties have common members");
    }
    var _a = schemaProperties("properties"), allProps = _a[0], properties = _a[1];
    var _b = schemaProperties("optionalProperties"), allOptProps = _b[0], optProperties = _b[1];
    if (properties.length === 0 && optProperties.length === 0 && additionalProperties) {
        return;
    }
    var _c = it.jtdDiscriminator === undefined
        ? (0, nullable_1.checkNullableObject)(cxt, data)
        : [gen.let("valid", false), true], valid = _c[0], cond = _c[1];
    gen.if(cond, function () {
        return gen.assign(valid, true).block(function () {
            validateProps(properties, "properties", true);
            validateProps(optProperties, "optionalProperties");
            if (!additionalProperties)
                validateAdditional();
        });
    });
    cxt.pass(valid);
    function commonProperties() {
        var props = parentSchema.properties;
        var optProps = parentSchema.optionalProperties;
        if (!(props && optProps))
            return false;
        for (var p in props) {
            if (Object.prototype.hasOwnProperty.call(optProps, p))
                return true;
        }
        return false;
    }
    function schemaProperties(keyword) {
        var schema = parentSchema[keyword];
        var allPs = schema ? (0, code_1.allSchemaProperties)(schema) : [];
        if (it.jtdDiscriminator && allPs.some(function (p) { return p === it.jtdDiscriminator; })) {
            throw new Error("JTD: discriminator tag used in ".concat(keyword));
        }
        var ps = allPs.filter(function (p) { return !(0, util_1.alwaysValidSchema)(it, schema[p]); });
        return [allPs, ps];
    }
    function validateProps(props, keyword, required) {
        var _valid = gen.var("valid");
        var _loop_1 = function (prop) {
            gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), function () { return applyPropertySchema(prop, keyword, _valid); }, function () { return missingProperty(prop); });
            cxt.ok(_valid);
        };
        for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
            var prop = props_1[_i];
            _loop_1(prop);
        }
        function missingProperty(prop) {
            if (required) {
                gen.assign(_valid, false);
                cxt.error(false, { propError: PropError.Missing, missingProperty: prop }, { schemaPath: prop });
            }
            else {
                gen.assign(_valid, true);
            }
        }
    }
    function applyPropertySchema(prop, keyword, _valid) {
        cxt.subschema({
            keyword: keyword,
            schemaProp: prop,
            dataProp: prop,
        }, _valid);
    }
    function validateAdditional() {
        gen.forIn("key", data, function (key) {
            var addProp = isAdditional(key, allProps, "properties", it.jtdDiscriminator);
            var addOptProp = isAdditional(key, allOptProps, "optionalProperties");
            var extra = addProp === true ? addOptProp : addOptProp === true ? addProp : (0, codegen_1.and)(addProp, addOptProp);
            gen.if(extra, function () {
                if (it.opts.removeAdditional) {
                    gen.code((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["delete ", "[", "]"], ["delete ", "[", "]"])), data, key));
                }
                else {
                    cxt.error(false, { propError: PropError.Additional, additionalProperty: key }, { instancePath: key, parentSchema: true });
                    if (!it.opts.allErrors)
                        gen.break();
                }
            });
        });
    }
    function isAdditional(key, props, keyword, jtdDiscriminator) {
        var additional;
        if (props.length > 8) {
            // TODO maybe an option instead of hard-coded 8?
            var propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema[keyword], keyword);
            additional = (0, codegen_1.not)((0, code_1.isOwnProperty)(gen, propsSchema, key));
            if (jtdDiscriminator !== undefined) {
                additional = (0, codegen_1.and)(additional, (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " !== ", ""], ["", " !== ", ""])), key, jtdDiscriminator));
            }
        }
        else if (props.length || jtdDiscriminator !== undefined) {
            var ps = jtdDiscriminator === undefined ? props : [jtdDiscriminator].concat(props);
            additional = codegen_1.and.apply(void 0, ps.map(function (p) { return (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " !== ", ""], ["", " !== ", ""])), key, p); }));
        }
        else {
            additional = true;
        }
        return additional;
    }
}
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
