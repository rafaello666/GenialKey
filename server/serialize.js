"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = compileSerializer;
var types_1 = require("./types");
var __1 = require("..");
var codegen_1 = require("../codegen");
var ref_error_1 = require("../ref_error");
var names_1 = require("../names");
var code_1 = require("../../vocabularies/code");
var ref_1 = require("../../vocabularies/jtd/ref");
var util_1 = require("../util");
var quote_1 = require("../../runtime/quote");
var genSerialize = {
    elements: serializeElements,
    values: serializeValues,
    discriminator: serializeDiscriminator,
    properties: serializeProperties,
    optionalProperties: serializeProperties,
    enum: serializeString,
    type: serializeType,
    ref: serializeRef,
};
function compileSerializer(sch, definitions) {
    var _sch = __1.getCompilingSchema.call(this, sch);
    if (_sch)
        return _sch;
    var _a = this.opts.code, es5 = _a.es5, lines = _a.lines;
    var ownProperties = this.opts.ownProperties;
    var gen = new codegen_1.CodeGen(this.scope, { es5: es5, lines: lines, ownProperties: ownProperties });
    var serializeName = gen.scopeName("serialize");
    var cxt = {
        self: this,
        gen: gen,
        schema: sch.schema,
        schemaEnv: sch,
        definitions: definitions,
        data: names_1.default.data,
    };
    var sourceCode;
    try {
        this._compilations.add(sch);
        sch.serializeName = serializeName;
        gen.func(serializeName, names_1.default.data, false, function () {
            gen.let(names_1.default.json, (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""]))));
            serializeCode(cxt);
            gen.return(names_1.default.json);
        });
        gen.optimize(this.opts.code.optimize);
        var serializeFuncCode = gen.toString();
        sourceCode = "".concat(gen.scopeRefs(names_1.default.scope), "return ").concat(serializeFuncCode);
        var makeSerialize = new Function("".concat(names_1.default.scope), sourceCode);
        var serialize = makeSerialize(this.scope.get());
        this.scope.value(serializeName, { ref: serialize });
        sch.serialize = serialize;
    }
    catch (e) {
        if (sourceCode)
            this.logger.error("Error compiling serializer, function code:", sourceCode);
        delete sch.serialize;
        delete sch.serializeName;
        throw e;
    }
    finally {
        this._compilations.delete(sch);
    }
    return sch;
}
function serializeCode(cxt) {
    var form;
    for (var _i = 0, jtdForms_1 = types_1.jtdForms; _i < jtdForms_1.length; _i++) {
        var key = jtdForms_1[_i];
        if (key in cxt.schema) {
            form = key;
            break;
        }
    }
    serializeNullable(cxt, form ? genSerialize[form] : serializeEmpty);
}
function serializeNullable(cxt, serializeForm) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    if (!schema.nullable)
        return serializeForm(cxt);
    gen.if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " === undefined || ", " === null"], ["", " === undefined || ", " === null"])), data, data), function () { return gen.add(names_1.default.json, (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\"null\""], ["\"null\""])))); }, function () { return serializeForm(cxt); });
}
function serializeElements(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["["], ["["]))));
    var first = gen.let("first", true);
    gen.forOf("el", data, function (el) {
        addComma(cxt, first);
        serializeCode(__assign(__assign({}, cxt), { schema: schema.elements, data: el }));
    });
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["]"], ["]"]))));
}
function serializeValues(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["{"], ["{"]))));
    var first = gen.let("first", true);
    gen.forIn("key", data, function (key) { return serializeKeyValue(cxt, key, schema.values, first); });
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["}"], ["}"]))));
}
function serializeKeyValue(cxt, key, schema, first) {
    var gen = cxt.gen, data = cxt.data;
    addComma(cxt, first);
    serializeString(__assign(__assign({}, cxt), { data: key }));
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_8 || (templateObject_8 = __makeTemplateObject([":"], [":"]))));
    var value = gen.const("value", (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", "", ""], ["", "", ""])), data, (0, codegen_1.getProperty)(key)));
    serializeCode(__assign(__assign({}, cxt), { schema: schema, data: value }));
}
function serializeDiscriminator(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    var discriminator = schema.discriminator;
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["{", ":"], ["{", ":"])), JSON.stringify(discriminator)));
    var tag = gen.const("tag", (0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["", "", ""], ["", "", ""])), data, (0, codegen_1.getProperty)(discriminator)));
    serializeString(__assign(__assign({}, cxt), { data: tag }));
    gen.if(false);
    for (var tagValue in schema.mapping) {
        gen.elseIf((0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), tag, tagValue));
        var sch = schema.mapping[tagValue];
        serializeSchemaProperties(__assign(__assign({}, cxt), { schema: sch }), discriminator);
    }
    gen.endIf();
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["}"], ["}"]))));
}
function serializeProperties(cxt) {
    var gen = cxt.gen;
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["{"], ["{"]))));
    serializeSchemaProperties(cxt);
    gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["}"], ["}"]))));
}
function serializeSchemaProperties(cxt, discriminator) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    var properties = schema.properties, optionalProperties = schema.optionalProperties;
    var props = keys(properties);
    var optProps = keys(optionalProperties);
    var allProps = allProperties(props.concat(optProps));
    var first = !discriminator;
    var firstProp;
    for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
        var key = props_1[_i];
        if (first)
            first = false;
        else
            gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_16 || (templateObject_16 = __makeTemplateObject([","], [","]))));
        serializeProperty(key, properties[key], keyValue(key));
    }
    if (first)
        firstProp = gen.let("first", true);
    var _loop_1 = function (key) {
        var value = keyValue(key);
        gen.if((0, codegen_1.and)((0, codegen_1._)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", " !== undefined"], ["", " !== undefined"])), value), (0, code_1.isOwnProperty)(gen, data, key)), function () {
            addComma(cxt, firstProp);
            serializeProperty(key, optionalProperties[key], value);
        });
    };
    for (var _a = 0, optProps_1 = optProps; _a < optProps_1.length; _a++) {
        var key = optProps_1[_a];
        _loop_1(key);
    }
    if (schema.additionalProperties) {
        gen.forIn("key", data, function (key) {
            return gen.if(isAdditional(key, allProps), function () { return serializeKeyValue(cxt, key, {}, firstProp); });
        });
    }
    function keys(ps) {
        return ps ? Object.keys(ps) : [];
    }
    function allProperties(ps) {
        if (discriminator)
            ps.push(discriminator);
        if (new Set(ps).size !== ps.length) {
            throw new Error("JTD: properties/optionalProperties/disciminator overlap");
        }
        return ps;
    }
    function keyValue(key) {
        return gen.const("value", (0, codegen_1._)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["", "", ""], ["", "", ""])), data, (0, codegen_1.getProperty)(key)));
    }
    function serializeProperty(key, propSchema, value) {
        gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["", ":"], ["", ":"])), JSON.stringify(key)));
        serializeCode(__assign(__assign({}, cxt), { schema: propSchema, data: value }));
    }
    function isAdditional(key, ps) {
        return ps.length ? codegen_1.and.apply(void 0, ps.map(function (p) { return (0, codegen_1._)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["", " !== ", ""], ["", " !== ", ""])), key, p); })) : true;
    }
}
function serializeType(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    switch (schema.type) {
        case "boolean":
            gen.add(names_1.default.json, (0, codegen_1._)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["", " ? \"true\" : \"false\""], ["", " ? \"true\" : \"false\""])), data));
            break;
        case "string":
            serializeString(cxt);
            break;
        case "timestamp":
            gen.if((0, codegen_1._)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["", " instanceof Date"], ["", " instanceof Date"])), data), function () { return gen.add(names_1.default.json, (0, codegen_1._)(templateObject_23 || (templateObject_23 = __makeTemplateObject(["'\"' + ", ".toISOString() + '\"'"], ["'\"' + ", ".toISOString() + '\"'"])), data)); }, function () { return serializeString(cxt); });
            break;
        default:
            serializeNumber(cxt);
    }
}
function serializeString(_a) {
    var gen = _a.gen, data = _a.data;
    gen.add(names_1.default.json, (0, codegen_1._)(templateObject_24 || (templateObject_24 = __makeTemplateObject(["", "(", ")"], ["", "(", ")"])), (0, util_1.useFunc)(gen, quote_1.default), data));
}
function serializeNumber(_a) {
    var gen = _a.gen, data = _a.data;
    gen.add(names_1.default.json, (0, codegen_1._)(templateObject_25 || (templateObject_25 = __makeTemplateObject(["\"\" + ", ""], ["\"\" + ", ""])), data));
}
function serializeRef(cxt) {
    var gen = cxt.gen, self = cxt.self, data = cxt.data, definitions = cxt.definitions, schema = cxt.schema, schemaEnv = cxt.schemaEnv;
    var ref = schema.ref;
    var refSchema = definitions[ref];
    if (!refSchema)
        throw new ref_error_1.default(self.opts.uriResolver, "", ref, "No definition ".concat(ref));
    if (!(0, ref_1.hasRef)(refSchema))
        return serializeCode(__assign(__assign({}, cxt), { schema: refSchema }));
    var root = schemaEnv.root;
    var sch = compileSerializer.call(self, new __1.SchemaEnv({ schema: refSchema, root: root }), definitions);
    gen.add(names_1.default.json, (0, codegen_1._)(templateObject_26 || (templateObject_26 = __makeTemplateObject(["", "(", ")"], ["", "(", ")"])), getSerialize(gen, sch), data));
}
function getSerialize(gen, sch) {
    return sch.serialize
        ? gen.scopeValue("serialize", { ref: sch.serialize })
        : (0, codegen_1._)(templateObject_27 || (templateObject_27 = __makeTemplateObject(["", ".serialize"], ["", ".serialize"])), gen.scopeValue("wrapper", { ref: sch }));
}
function serializeEmpty(_a) {
    var gen = _a.gen, data = _a.data;
    gen.add(names_1.default.json, (0, codegen_1._)(templateObject_28 || (templateObject_28 = __makeTemplateObject(["JSON.stringify(", ")"], ["JSON.stringify(", ")"])), data));
}
function addComma(_a, first) {
    var gen = _a.gen;
    if (first) {
        gen.if(first, function () { return gen.assign(first, false); }, function () { return gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_29 || (templateObject_29 = __makeTemplateObject([","], [","])))); });
    }
    else {
        gen.add(names_1.default.json, (0, codegen_1.str)(templateObject_30 || (templateObject_30 = __makeTemplateObject([","], [","]))));
    }
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30;
