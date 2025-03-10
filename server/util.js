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
exports.Type = exports.mergeEvaluated = void 0;
exports.toHash = toHash;
exports.alwaysValidSchema = alwaysValidSchema;
exports.checkUnknownRules = checkUnknownRules;
exports.schemaHasRules = schemaHasRules;
exports.schemaHasRulesButRef = schemaHasRulesButRef;
exports.schemaRefOrVal = schemaRefOrVal;
exports.unescapeFragment = unescapeFragment;
exports.escapeFragment = escapeFragment;
exports.escapeJsonPointer = escapeJsonPointer;
exports.unescapeJsonPointer = unescapeJsonPointer;
exports.eachItem = eachItem;
exports.evaluatedPropsToName = evaluatedPropsToName;
exports.setEvaluated = setEvaluated;
exports.useFunc = useFunc;
exports.getErrorPath = getErrorPath;
exports.checkStrictMode = checkStrictMode;
var codegen_1 = require("./codegen");
var code_1 = require("./codegen/code");
// TODO refactor to use Set
function toHash(arr) {
    var hash = {};
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var item = arr_1[_i];
        hash[item] = true;
    }
    return hash;
}
function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
        return schema;
    if (Object.keys(schema).length === 0)
        return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
}
function checkUnknownRules(it, schema) {
    if (schema === void 0) { schema = it.schema; }
    var opts = it.opts, self = it.self;
    if (!opts.strictSchema)
        return;
    if (typeof schema === "boolean")
        return;
    var rules = self.RULES.keywords;
    for (var key in schema) {
        if (!rules[key])
            checkStrictMode(it, "unknown keyword: \"".concat(key, "\""));
    }
}
function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
        return !schema;
    for (var key in schema)
        if (rules[key])
            return true;
    return false;
}
function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
        return !schema;
    for (var key in schema)
        if (key !== "$ref" && RULES.all[key])
            return true;
    return false;
}
function schemaRefOrVal(_a, schema, keyword, $data) {
    var topSchemaRef = _a.topSchemaRef, schemaPath = _a.schemaPath;
    if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
            return schema;
        if (typeof schema == "string")
            return (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ""], ["", ""])), schema);
    }
    return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", "", "", ""], ["", "", "", ""])), topSchemaRef, schemaPath, (0, codegen_1.getProperty)(keyword));
}
function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
}
function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
}
function escapeJsonPointer(str) {
    if (typeof str == "number")
        return "".concat(str);
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
}
function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
}
function eachItem(xs, f) {
    if (Array.isArray(xs)) {
        for (var _i = 0, xs_1 = xs; _i < xs_1.length; _i++) {
            var x = xs_1[_i];
            f(x);
        }
    }
    else {
        f(xs);
    }
}
function makeMergeEvaluated(_a) {
    var mergeNames = _a.mergeNames, mergeToName = _a.mergeToName, mergeValues = _a.mergeValues, resultToName = _a.resultToName;
    return function (gen, from, to, toName) {
        var res = to === undefined
            ? from
            : to instanceof codegen_1.Name
                ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to)
                : from instanceof codegen_1.Name
                    ? (mergeToName(gen, to, from), from)
                    : mergeValues(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
}
exports.mergeEvaluated = {
    props: makeMergeEvaluated({
        mergeNames: function (gen, from, to) {
            return gen.if((0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " !== true && ", " !== undefined"], ["", " !== true && ", " !== undefined"])), to, from), function () {
                gen.if((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " === true"], ["", " === true"])), from), function () { return gen.assign(to, true); }, function () { return gen.assign(to, (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " || {}"], ["", " || {}"])), to)).code((0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Object.assign(", ", ", ")"], ["Object.assign(", ", ", ")"])), to, from)); });
            });
        },
        mergeToName: function (gen, from, to) {
            return gen.if((0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " !== true"], ["", " !== true"])), to), function () {
                if (from === true) {
                    gen.assign(to, true);
                }
                else {
                    gen.assign(to, (0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " || {}"], ["", " || {}"])), to));
                    setEvaluated(gen, to, from);
                }
            });
        },
        mergeValues: function (from, to) { return (from === true ? true : __assign(__assign({}, from), to)); },
        resultToName: evaluatedPropsToName,
    }),
    items: makeMergeEvaluated({
        mergeNames: function (gen, from, to) {
            return gen.if((0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", " !== true && ", " !== undefined"], ["", " !== true && ", " !== undefined"])), to, from), function () {
                return gen.assign(to, (0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " === true ? true : ", " > ", " ? ", " : ", ""], ["", " === true ? true : ", " > ", " ? ", " : ", ""])), from, to, from, to, from));
            });
        },
        mergeToName: function (gen, from, to) {
            return gen.if((0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["", " !== true"], ["", " !== true"])), to), function () {
                return gen.assign(to, from === true ? true : (0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " > ", " ? ", " : ", ""], ["", " > ", " ? ", " : ", ""])), to, from, to, from));
            });
        },
        mergeValues: function (from, to) { return (from === true ? true : Math.max(from, to)); },
        resultToName: function (gen, items) { return gen.var("items", items); },
    }),
};
function evaluatedPropsToName(gen, ps) {
    if (ps === true)
        return gen.var("props", true);
    var props = gen.var("props", (0, codegen_1._)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["{}"], ["{}"]))));
    if (ps !== undefined)
        setEvaluated(gen, props, ps);
    return props;
}
function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach(function (p) { return gen.assign((0, codegen_1._)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", "", ""], ["", "", ""])), props, (0, codegen_1.getProperty)(p)), true); });
}
var snippets = {};
function useFunc(gen, f) {
    return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code)),
    });
}
var Type;
(function (Type) {
    Type[Type["Num"] = 0] = "Num";
    Type[Type["Str"] = 1] = "Str";
})(Type || (exports.Type = Type = {}));
function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    // let path
    if (dataProp instanceof codegen_1.Name) {
        var isNumber = dataPropType === Type.Num;
        return jsPropertySyntax
            ? isNumber
                ? (0, codegen_1._)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["\"[\" + ", " + \"]\""], ["\"[\" + ", " + \"]\""])), dataProp) : (0, codegen_1._)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["\"['\" + ", " + \"']\""], ["\"['\" + ", " + \"']\""])), dataProp)
            : isNumber
                ? (0, codegen_1._)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["\"/\" + ", ""], ["\"/\" + ", ""])), dataProp) : (0, codegen_1._)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["\"/\" + ", ".replace(/~/g, \"~0\").replace(/\\//g, \"~1\")"], ["\"/\" + ", ".replace(/~/g, \"~0\").replace(/\\\\//g, \"~1\")"])), dataProp); // TODO maybe use global escapePointer
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
}
function checkStrictMode(it, msg, mode) {
    if (mode === void 0) { mode = it.opts.strictSchema; }
    if (!mode)
        return;
    msg = "strict mode: ".concat(msg);
    if (mode === true)
        throw new Error(msg);
    it.self.logger.warn(msg);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18;
