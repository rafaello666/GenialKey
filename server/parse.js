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
exports.default = compileParser;
var types_1 = require("./types");
var __1 = require("..");
var codegen_1 = require("../codegen");
var ref_error_1 = require("../ref_error");
var names_1 = require("../names");
var code_1 = require("../../vocabularies/code");
var ref_1 = require("../../vocabularies/jtd/ref");
var type_1 = require("../../vocabularies/jtd/type");
var parseJson_1 = require("../../runtime/parseJson");
var util_1 = require("../util");
var timestamp_1 = require("../../runtime/timestamp");
var genParse = {
    elements: parseElements,
    values: parseValues,
    discriminator: parseDiscriminator,
    properties: parseProperties,
    optionalProperties: parseProperties,
    enum: parseEnum,
    type: parseType,
    ref: parseRef,
};
function compileParser(sch, definitions) {
    var _sch = __1.getCompilingSchema.call(this, sch);
    if (_sch)
        return _sch;
    var _a = this.opts.code, es5 = _a.es5, lines = _a.lines;
    var ownProperties = this.opts.ownProperties;
    var gen = new codegen_1.CodeGen(this.scope, { es5: es5, lines: lines, ownProperties: ownProperties });
    var parseName = gen.scopeName("parse");
    var cxt = {
        self: this,
        gen: gen,
        schema: sch.schema,
        schemaEnv: sch,
        definitions: definitions,
        data: names_1.default.data,
        parseName: parseName,
        char: gen.name("c"),
    };
    var sourceCode;
    try {
        this._compilations.add(sch);
        sch.parseName = parseName;
        parserFunction(cxt);
        gen.optimize(this.opts.code.optimize);
        var parseFuncCode = gen.toString();
        sourceCode = "".concat(gen.scopeRefs(names_1.default.scope), "return ").concat(parseFuncCode);
        var makeParse = new Function("".concat(names_1.default.scope), sourceCode);
        var parse = makeParse(this.scope.get());
        this.scope.value(parseName, { ref: parse });
        sch.parse = parse;
    }
    catch (e) {
        if (sourceCode)
            this.logger.error("Error compiling parser, function code:", sourceCode);
        delete sch.parse;
        delete sch.parseName;
        throw e;
    }
    finally {
        this._compilations.delete(sch);
    }
    return sch;
}
var undef = (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["undefined"], ["undefined"])));
function parserFunction(cxt) {
    var gen = cxt.gen, parseName = cxt.parseName, char = cxt.char;
    gen.func(parseName, (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", ", ", ", ", ""], ["", ", ", ", ", ""])), names_1.default.json, names_1.default.jsonPos, names_1.default.jsonPart), false, function () {
        gen.let(names_1.default.data);
        gen.let(char);
        gen.assign((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ".message"], ["", ".message"])), parseName), undef);
        gen.assign((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", ".position"], ["", ".position"])), parseName), undef);
        gen.assign(names_1.default.jsonPos, (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " || 0"], ["", " || 0"])), names_1.default.jsonPos));
        gen.const(names_1.default.jsonLen, (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", ".length"], ["", ".length"])), names_1.default.json));
        parseCode(cxt);
        skipWhitespace(cxt);
        gen.if(names_1.default.jsonPart, function () {
            gen.assign((0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", ".position"], ["", ".position"])), parseName), names_1.default.jsonPos);
            gen.return(names_1.default.data);
        });
        gen.if((0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), names_1.default.jsonPos, names_1.default.jsonLen), function () { return gen.return(names_1.default.data); });
        jsonSyntaxError(cxt);
    });
}
function parseCode(cxt) {
    var form;
    for (var _i = 0, jtdForms_1 = types_1.jtdForms; _i < jtdForms_1.length; _i++) {
        var key = jtdForms_1[_i];
        if (key in cxt.schema) {
            form = key;
            break;
        }
    }
    if (form)
        parseNullable(cxt, genParse[form]);
    else
        parseEmpty(cxt);
}
var parseBoolean = parseBooleanToken(true, parseBooleanToken(false, jsonSyntaxError));
function parseNullable(cxt, parseForm) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    if (!schema.nullable)
        return parseForm(cxt);
    tryParseToken(cxt, "null", parseForm, function () { return gen.assign(data, null); });
}
function parseElements(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    parseToken(cxt, "[");
    var ix = gen.let("i", 0);
    gen.assign(data, (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["[]"], ["[]"]))));
    parseItems(cxt, "]", function () {
        var el = gen.let("el");
        parseCode(__assign(__assign({}, cxt), { schema: schema.elements, data: el }));
        gen.assign((0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", "[", "++]"], ["", "[", "++]"])), data, ix), el);
    });
}
function parseValues(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    parseToken(cxt, "{");
    gen.assign(data, (0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["{}"], ["{}"]))));
    parseItems(cxt, "}", function () { return parseKeyValue(cxt, schema.values); });
}
function parseItems(cxt, endToken, block) {
    tryParseItems(cxt, endToken, block);
    parseToken(cxt, endToken);
}
function tryParseItems(cxt, endToken, block) {
    var gen = cxt.gen;
    gen.for((0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject([";", "<", " && ", "!==", ";"], [";", "<", " && ", "!==", ";"])), names_1.default.jsonPos, names_1.default.jsonLen, jsonSlice(1), endToken), function () {
        block();
        tryParseToken(cxt, ",", function () { return gen.break(); }, hasItem);
    });
    function hasItem() {
        tryParseToken(cxt, endToken, function () { }, jsonSyntaxError);
    }
}
function parseKeyValue(cxt, schema) {
    var gen = cxt.gen;
    var key = gen.let("key");
    parseString(__assign(__assign({}, cxt), { data: key }));
    parseToken(cxt, ":");
    parsePropertyValue(cxt, key, schema);
}
function parseDiscriminator(cxt) {
    var gen = cxt.gen, data = cxt.data, schema = cxt.schema;
    var discriminator = schema.discriminator, mapping = schema.mapping;
    parseToken(cxt, "{");
    gen.assign(data, (0, codegen_1._)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["{}"], ["{}"]))));
    var startPos = gen.const("pos", names_1.default.jsonPos);
    var value = gen.let("value");
    var tag = gen.let("tag");
    tryParseItems(cxt, "}", function () {
        var key = gen.let("key");
        parseString(__assign(__assign({}, cxt), { data: key }));
        parseToken(cxt, ":");
        gen.if((0, codegen_1._)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), key, discriminator), function () {
            parseString(__assign(__assign({}, cxt), { data: tag }));
            gen.assign((0, codegen_1._)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), data, key), tag);
            gen.break();
        }, function () { return parseEmpty(__assign(__assign({}, cxt), { data: value })); } // can be discarded/skipped
        );
    });
    gen.assign(names_1.default.jsonPos, startPos);
    gen.if((0, codegen_1._)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["", " === undefined"], ["", " === undefined"])), tag));
    parsingError(cxt, (0, codegen_1.str)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["discriminator tag not found"], ["discriminator tag not found"]))));
    for (var tagValue in mapping) {
        gen.elseIf((0, codegen_1._)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), tag, tagValue));
        parseSchemaProperties(__assign(__assign({}, cxt), { schema: mapping[tagValue] }), discriminator);
    }
    gen.else();
    parsingError(cxt, (0, codegen_1.str)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["discriminator value not in schema"], ["discriminator value not in schema"]))));
    gen.endIf();
}
function parseProperties(cxt) {
    var gen = cxt.gen, data = cxt.data;
    parseToken(cxt, "{");
    gen.assign(data, (0, codegen_1._)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["{}"], ["{}"]))));
    parseSchemaProperties(cxt);
}
function parseSchemaProperties(cxt, discriminator) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data;
    var properties = schema.properties, optionalProperties = schema.optionalProperties, additionalProperties = schema.additionalProperties;
    parseItems(cxt, "}", function () {
        var key = gen.let("key");
        parseString(__assign(__assign({}, cxt), { data: key }));
        parseToken(cxt, ":");
        gen.if(false);
        parseDefinedProperty(cxt, key, properties);
        parseDefinedProperty(cxt, key, optionalProperties);
        if (discriminator) {
            gen.elseIf((0, codegen_1._)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), key, discriminator));
            var tag = gen.let("tag");
            parseString(__assign(__assign({}, cxt), { data: tag })); // can be discarded, it is already assigned
        }
        gen.else();
        if (additionalProperties) {
            parseEmpty(__assign(__assign({}, cxt), { data: (0, codegen_1._)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), data, key) }));
        }
        else {
            parsingError(cxt, (0, codegen_1.str)(templateObject_23 || (templateObject_23 = __makeTemplateObject(["property ", " not allowed"], ["property ", " not allowed"])), key));
        }
        gen.endIf();
    });
    if (properties) {
        var hasProp_1 = (0, code_1.hasPropFunc)(gen);
        var allProps = codegen_1.and.apply(void 0, Object.keys(properties).map(function (p) { return (0, codegen_1._)(templateObject_24 || (templateObject_24 = __makeTemplateObject(["", ".call(", ", ", ")"], ["", ".call(", ", ", ")"])), hasProp_1, data, p); }));
        gen.if((0, codegen_1.not)(allProps), function () { return parsingError(cxt, (0, codegen_1.str)(templateObject_25 || (templateObject_25 = __makeTemplateObject(["missing required properties"], ["missing required properties"])))); });
    }
}
function parseDefinedProperty(cxt, key, schemas) {
    if (schemas === void 0) { schemas = {}; }
    var gen = cxt.gen;
    for (var prop in schemas) {
        gen.elseIf((0, codegen_1._)(templateObject_26 || (templateObject_26 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), key, prop));
        parsePropertyValue(cxt, key, schemas[prop]);
    }
}
function parsePropertyValue(cxt, key, schema) {
    parseCode(__assign(__assign({}, cxt), { schema: schema, data: (0, codegen_1._)(templateObject_27 || (templateObject_27 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), cxt.data, key) }));
}
function parseType(cxt) {
    var gen = cxt.gen, schema = cxt.schema, data = cxt.data, self = cxt.self;
    switch (schema.type) {
        case "boolean":
            parseBoolean(cxt);
            break;
        case "string":
            parseString(cxt);
            break;
        case "timestamp": {
            parseString(cxt);
            var vts = (0, util_1.useFunc)(gen, timestamp_1.default);
            var _a = self.opts, allowDate = _a.allowDate, parseDate = _a.parseDate;
            var notValid = allowDate ? (0, codegen_1._)(templateObject_28 || (templateObject_28 = __makeTemplateObject(["!", "(", ", true)"], ["!", "(", ", true)"])), vts, data) : (0, codegen_1._)(templateObject_29 || (templateObject_29 = __makeTemplateObject(["!", "(", ")"], ["!", "(", ")"])), vts, data);
            var fail = parseDate
                ? (0, codegen_1.or)(notValid, (0, codegen_1._)(templateObject_30 || (templateObject_30 = __makeTemplateObject(["(", " = new Date(", "), false)"], ["(", " = new Date(", "), false)"])), data, data), (0, codegen_1._)(templateObject_31 || (templateObject_31 = __makeTemplateObject(["isNaN(", ".valueOf())"], ["isNaN(", ".valueOf())"])), data))
                : notValid;
            gen.if(fail, function () { return parsingError(cxt, (0, codegen_1.str)(templateObject_32 || (templateObject_32 = __makeTemplateObject(["invalid timestamp"], ["invalid timestamp"])))); });
            break;
        }
        case "float32":
        case "float64":
            parseNumber(cxt);
            break;
        default: {
            var t = schema.type;
            if (!self.opts.int32range && (t === "int32" || t === "uint32")) {
                parseNumber(cxt, 16); // 2 ** 53 - max safe integer
                if (t === "uint32") {
                    gen.if((0, codegen_1._)(templateObject_33 || (templateObject_33 = __makeTemplateObject(["", " < 0"], ["", " < 0"])), data), function () { return parsingError(cxt, (0, codegen_1.str)(templateObject_34 || (templateObject_34 = __makeTemplateObject(["integer out of range"], ["integer out of range"])))); });
                }
            }
            else {
                var _b = type_1.intRange[t], min = _b[0], max = _b[1], maxDigits = _b[2];
                parseNumber(cxt, maxDigits);
                gen.if((0, codegen_1._)(templateObject_35 || (templateObject_35 = __makeTemplateObject(["", " < ", " || ", " > ", ""], ["", " < ", " || ", " > ", ""])), data, min, data, max), function () {
                    return parsingError(cxt, (0, codegen_1.str)(templateObject_36 || (templateObject_36 = __makeTemplateObject(["integer out of range"], ["integer out of range"]))));
                });
            }
        }
    }
}
function parseString(cxt) {
    parseToken(cxt, '"');
    parseWith(cxt, parseJson_1.parseJsonString);
}
function parseEnum(cxt) {
    var gen = cxt.gen, data = cxt.data, schema = cxt.schema;
    var enumSch = schema.enum;
    parseToken(cxt, '"');
    // TODO loopEnum
    gen.if(false);
    for (var _i = 0, enumSch_1 = enumSch; _i < enumSch_1.length; _i++) {
        var value = enumSch_1[_i];
        var valueStr = JSON.stringify(value).slice(1); // remove starting quote
        gen.elseIf((0, codegen_1._)(templateObject_37 || (templateObject_37 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), jsonSlice(valueStr.length), valueStr));
        gen.assign(data, (0, codegen_1.str)(templateObject_38 || (templateObject_38 = __makeTemplateObject(["", ""], ["", ""])), value));
        gen.add(names_1.default.jsonPos, valueStr.length);
    }
    gen.else();
    jsonSyntaxError(cxt);
    gen.endIf();
}
function parseNumber(cxt, maxDigits) {
    var gen = cxt.gen;
    skipWhitespace(cxt);
    gen.if((0, codegen_1._)(templateObject_39 || (templateObject_39 = __makeTemplateObject(["\"-0123456789\".indexOf(", ") < 0"], ["\"-0123456789\".indexOf(", ") < 0"])), jsonSlice(1)), function () { return jsonSyntaxError(cxt); }, function () { return parseWith(cxt, parseJson_1.parseJsonNumber, maxDigits); });
}
function parseBooleanToken(bool, fail) {
    return function (cxt) {
        var gen = cxt.gen, data = cxt.data;
        tryParseToken(cxt, "".concat(bool), function () { return fail(cxt); }, function () { return gen.assign(data, bool); });
    };
}
function parseRef(cxt) {
    var gen = cxt.gen, self = cxt.self, definitions = cxt.definitions, schema = cxt.schema, schemaEnv = cxt.schemaEnv;
    var ref = schema.ref;
    var refSchema = definitions[ref];
    if (!refSchema)
        throw new ref_error_1.default(self.opts.uriResolver, "", ref, "No definition ".concat(ref));
    if (!(0, ref_1.hasRef)(refSchema))
        return parseCode(__assign(__assign({}, cxt), { schema: refSchema }));
    var root = schemaEnv.root;
    var sch = compileParser.call(self, new __1.SchemaEnv({ schema: refSchema, root: root }), definitions);
    partialParse(cxt, getParser(gen, sch), true);
}
function getParser(gen, sch) {
    return sch.parse
        ? gen.scopeValue("parse", { ref: sch.parse })
        : (0, codegen_1._)(templateObject_40 || (templateObject_40 = __makeTemplateObject(["", ".parse"], ["", ".parse"])), gen.scopeValue("wrapper", { ref: sch }));
}
function parseEmpty(cxt) {
    parseWith(cxt, parseJson_1.parseJson);
}
function parseWith(cxt, parseFunc, args) {
    partialParse(cxt, (0, util_1.useFunc)(cxt.gen, parseFunc), args);
}
function partialParse(cxt, parseFunc, args) {
    var gen = cxt.gen, data = cxt.data;
    gen.assign(data, (0, codegen_1._)(templateObject_42 || (templateObject_42 = __makeTemplateObject(["", "(", ", ", "", ")"], ["", "(", ", ", "", ")"])), parseFunc, names_1.default.json, names_1.default.jsonPos, args ? (0, codegen_1._)(templateObject_41 || (templateObject_41 = __makeTemplateObject([", ", ""], [", ", ""])), args) : codegen_1.nil));
    gen.assign(names_1.default.jsonPos, (0, codegen_1._)(templateObject_43 || (templateObject_43 = __makeTemplateObject(["", ".position"], ["", ".position"])), parseFunc));
    gen.if((0, codegen_1._)(templateObject_44 || (templateObject_44 = __makeTemplateObject(["", " === undefined"], ["", " === undefined"])), data), function () { return parsingError(cxt, (0, codegen_1._)(templateObject_45 || (templateObject_45 = __makeTemplateObject(["", ".message"], ["", ".message"])), parseFunc)); });
}
function parseToken(cxt, tok) {
    tryParseToken(cxt, tok, jsonSyntaxError);
}
function tryParseToken(cxt, tok, fail, success) {
    var gen = cxt.gen;
    var n = tok.length;
    skipWhitespace(cxt);
    gen.if((0, codegen_1._)(templateObject_46 || (templateObject_46 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), jsonSlice(n), tok), function () {
        gen.add(names_1.default.jsonPos, n);
        success === null || success === void 0 ? void 0 : success(cxt);
    }, function () { return fail(cxt); });
}
function skipWhitespace(_a) {
    var gen = _a.gen, c = _a.char;
    gen.code((0, codegen_1._)(templateObject_47 || (templateObject_47 = __makeTemplateObject(["while((", "=", "[", "],", "===\" \"||", "===\"\\n\"||", "===\"\\r\"||", "===\"\\t\"))", "++;"], ["while((", "=", "[", "],", "===\" \"||", "===\"\\\\n\"||", "===\"\\\\r\"||", "===\"\\\\t\"))", "++;"])), c, names_1.default.json, names_1.default.jsonPos, c, c, c, c, names_1.default.jsonPos));
}
function jsonSlice(len) {
    return len === 1
        ? (0, codegen_1._)(templateObject_48 || (templateObject_48 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), names_1.default.json, names_1.default.jsonPos) : (0, codegen_1._)(templateObject_49 || (templateObject_49 = __makeTemplateObject(["", ".slice(", ", ", "+", ")"], ["", ".slice(", ", ", "+", ")"])), names_1.default.json, names_1.default.jsonPos, names_1.default.jsonPos, len);
}
function jsonSyntaxError(cxt) {
    parsingError(cxt, (0, codegen_1._)(templateObject_50 || (templateObject_50 = __makeTemplateObject(["\"unexpected token \" + ", "[", "]"], ["\"unexpected token \" + ", "[", "]"])), names_1.default.json, names_1.default.jsonPos));
}
function parsingError(_a, msg) {
    var gen = _a.gen, parseName = _a.parseName;
    gen.assign((0, codegen_1._)(templateObject_51 || (templateObject_51 = __makeTemplateObject(["", ".message"], ["", ".message"])), parseName), msg);
    gen.assign((0, codegen_1._)(templateObject_52 || (templateObject_52 = __makeTemplateObject(["", ".position"], ["", ".position"])), parseName), names_1.default.jsonPos);
    gen.return(undef);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41, templateObject_42, templateObject_43, templateObject_44, templateObject_45, templateObject_46, templateObject_47, templateObject_48, templateObject_49, templateObject_50, templateObject_51, templateObject_52;
