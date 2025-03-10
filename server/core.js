"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenOptions = exports.CodeGen = exports.Code = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.JTDDataType = exports.SomeJTDSchemaType = exports.JTDSchemaType = exports.JSONSchemaType = exports.JSONType = exports.DefinedError = exports.KeywordCxt = exports.SchemaObjCxt = exports.SchemaCxt = exports.ErrorNoParams = exports.ErrorObject = exports.AnyValidateFunction = exports.AsyncValidateFunction = exports.ValidateFunction = exports.AnySchema = exports.AsyncSchema = exports.AnySchemaObject = exports.SchemaObject = exports.Schema = exports.Vocabulary = exports.FuncKeywordDefinition = exports.MacroKeywordDefinition = exports.CodeKeywordDefinition = exports.KeywordErrorDefinition = exports.KeywordDefinition = exports.AsyncFormatDefinition = exports.FormatDefinition = exports.Format = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "Format", { enumerable: true, get: function () { return types_1.Format; } });
Object.defineProperty(exports, "FormatDefinition", { enumerable: true, get: function () { return types_1.FormatDefinition; } });
Object.defineProperty(exports, "AsyncFormatDefinition", { enumerable: true, get: function () { return types_1.AsyncFormatDefinition; } });
Object.defineProperty(exports, "KeywordDefinition", { enumerable: true, get: function () { return types_1.KeywordDefinition; } });
Object.defineProperty(exports, "KeywordErrorDefinition", { enumerable: true, get: function () { return types_1.KeywordErrorDefinition; } });
Object.defineProperty(exports, "CodeKeywordDefinition", { enumerable: true, get: function () { return types_1.CodeKeywordDefinition; } });
Object.defineProperty(exports, "MacroKeywordDefinition", { enumerable: true, get: function () { return types_1.MacroKeywordDefinition; } });
Object.defineProperty(exports, "FuncKeywordDefinition", { enumerable: true, get: function () { return types_1.FuncKeywordDefinition; } });
Object.defineProperty(exports, "Vocabulary", { enumerable: true, get: function () { return types_1.Vocabulary; } });
Object.defineProperty(exports, "Schema", { enumerable: true, get: function () { return types_1.Schema; } });
Object.defineProperty(exports, "SchemaObject", { enumerable: true, get: function () { return types_1.SchemaObject; } });
Object.defineProperty(exports, "AnySchemaObject", { enumerable: true, get: function () { return types_1.AnySchemaObject; } });
Object.defineProperty(exports, "AsyncSchema", { enumerable: true, get: function () { return types_1.AsyncSchema; } });
Object.defineProperty(exports, "AnySchema", { enumerable: true, get: function () { return types_1.AnySchema; } });
Object.defineProperty(exports, "ValidateFunction", { enumerable: true, get: function () { return types_1.ValidateFunction; } });
Object.defineProperty(exports, "AsyncValidateFunction", { enumerable: true, get: function () { return types_1.AsyncValidateFunction; } });
Object.defineProperty(exports, "AnyValidateFunction", { enumerable: true, get: function () { return types_1.AnyValidateFunction; } });
Object.defineProperty(exports, "ErrorObject", { enumerable: true, get: function () { return types_1.ErrorObject; } });
Object.defineProperty(exports, "ErrorNoParams", { enumerable: true, get: function () { return types_1.ErrorNoParams; } });
var compile_1 = require("./compile");
Object.defineProperty(exports, "SchemaCxt", { enumerable: true, get: function () { return compile_1.SchemaCxt; } });
Object.defineProperty(exports, "SchemaObjCxt", { enumerable: true, get: function () { return compile_1.SchemaObjCxt; } });
var validate_1 = require("./compile/validate");
Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function () { return validate_1.KeywordCxt; } });
var errors_1 = require("./vocabularies/errors");
Object.defineProperty(exports, "DefinedError", { enumerable: true, get: function () { return errors_1.DefinedError; } });
var rules_1 = require("./compile/rules");
Object.defineProperty(exports, "JSONType", { enumerable: true, get: function () { return rules_1.JSONType; } });
var json_schema_1 = require("./types/json-schema");
Object.defineProperty(exports, "JSONSchemaType", { enumerable: true, get: function () { return json_schema_1.JSONSchemaType; } });
var jtd_schema_1 = require("./types/jtd-schema");
Object.defineProperty(exports, "JTDSchemaType", { enumerable: true, get: function () { return jtd_schema_1.JTDSchemaType; } });
Object.defineProperty(exports, "SomeJTDSchemaType", { enumerable: true, get: function () { return jtd_schema_1.SomeJTDSchemaType; } });
Object.defineProperty(exports, "JTDDataType", { enumerable: true, get: function () { return jtd_schema_1.JTDDataType; } });
var codegen_1 = require("./compile/codegen");
Object.defineProperty(exports, "_", { enumerable: true, get: function () { return codegen_1._; } });
Object.defineProperty(exports, "str", { enumerable: true, get: function () { return codegen_1.str; } });
Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return codegen_1.stringify; } });
Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return codegen_1.nil; } });
Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return codegen_1.Name; } });
Object.defineProperty(exports, "Code", { enumerable: true, get: function () { return codegen_1.Code; } });
Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return codegen_1.CodeGen; } });
Object.defineProperty(exports, "CodeGenOptions", { enumerable: true, get: function () { return codegen_1.CodeGenOptions; } });
var validation_error_1 = require("./runtime/validation_error");
var ref_error_1 = require("./compile/ref_error");
var rules_2 = require("./compile/rules");
var compile_2 = require("./compile");
var codegen_2 = require("./compile/codegen");
var resolve_1 = require("./compile/resolve");
var dataType_1 = require("./compile/validate/dataType");
var util_1 = require("./compile/util");
var $dataRefSchema = require("./refs/data.json");
var uri_1 = require("./runtime/uri");
var defaultRegExp = function (str, flags) { return new RegExp(str, flags); };
defaultRegExp.code = "new RegExp";
var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
var EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error",
]);
var removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now.",
};
var deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.',
};
var MAX_EXPRESSION = 200;
// eslint-disable-next-line complexity
function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    var s = o.strict;
    var _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
    var optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    var regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
    var uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
    return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? __assign(__assign({}, o.code), { optimize: optimize, regExp: regExp }) : { optimize: optimize, regExp: regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver: uriResolver,
    };
}
var Ajv = /** @class */ (function () {
    function Ajv(opts) {
        if (opts === void 0) { opts = {}; }
        this.schemas = {};
        this.refs = {};
        this.formats = {};
        this._compilations = new Set();
        this._loading = {};
        this._cache = new Map();
        opts = this.opts = __assign(__assign({}, opts), requiredOptions(opts));
        var _a = this.opts.code, es5 = _a.es5, lines = _a.lines;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5: es5, lines: lines });
        this.logger = getLogger(opts.logger);
        var formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_2.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
            addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
            addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
            this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
    }
    Ajv.prototype._addVocabularies = function () {
        this.addKeyword("$async");
    };
    Ajv.prototype._addDefaultMetaSchema = function () {
        var _a = this.opts, $data = _a.$data, meta = _a.meta, schemaId = _a.schemaId;
        var _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
            _dataRefSchema = __assign({}, $dataRefSchema);
            _dataRefSchema.id = _dataRefSchema.$id;
            delete _dataRefSchema.$id;
        }
        if (meta && $data)
            this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    };
    Ajv.prototype.defaultMeta = function () {
        var _a = this.opts, meta = _a.meta, schemaId = _a.schemaId;
        return (this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined);
    };
    Ajv.prototype.validate = function (schemaKeyRef, // key, ref or schema object
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    data // to be validated
    ) {
        var v;
        if (typeof schemaKeyRef == "string") {
            v = this.getSchema(schemaKeyRef);
            if (!v)
                throw new Error("no schema with key or ref \"".concat(schemaKeyRef, "\""));
        }
        else {
            v = this.compile(schemaKeyRef);
        }
        var valid = v(data);
        if (!("$async" in v))
            this.errors = v.errors;
        return valid;
    };
    Ajv.prototype.compile = function (schema, _meta) {
        var sch = this._addSchema(schema, _meta);
        return (sch.validate || this._compileSchemaEnv(sch));
    };
    Ajv.prototype.compileAsync = function (schema, meta) {
        if (typeof this.opts.loadSchema != "function") {
            throw new Error("options.loadSchema should be a function");
        }
        var loadSchema = this.opts.loadSchema;
        return runCompileAsync.call(this, schema, meta);
        function runCompileAsync(_schema, _meta) {
            return __awaiter(this, void 0, void 0, function () {
                var sch;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, loadMetaSchema.call(this, _schema.$schema)];
                        case 1:
                            _a.sent();
                            sch = this._addSchema(_schema, _meta);
                            return [2 /*return*/, sch.validate || _compileAsync.call(this, sch)];
                    }
                });
            });
        }
        function loadMetaSchema($ref) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!($ref && !this.getSchema($ref))) return [3 /*break*/, 2];
                            return [4 /*yield*/, runCompileAsync.call(this, { $ref: $ref }, true)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        }
        function _compileAsync(sch) {
            return __awaiter(this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 1, , 3]);
                            return [2 /*return*/, this._compileSchemaEnv(sch)];
                        case 1:
                            e_1 = _a.sent();
                            if (!(e_1 instanceof ref_error_1.default))
                                throw e_1;
                            checkLoaded.call(this, e_1);
                            return [4 /*yield*/, loadMissingSchema.call(this, e_1.missingSchema)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, _compileAsync.call(this, sch)];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        function checkLoaded(_a) {
            var ref = _a.missingSchema, missingRef = _a.missingRef;
            if (this.refs[ref]) {
                throw new Error("AnySchema ".concat(ref, " is loaded but ").concat(missingRef, " cannot be resolved"));
            }
        }
        function loadMissingSchema(ref) {
            return __awaiter(this, void 0, void 0, function () {
                var _schema;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, _loadSchema.call(this, ref)];
                        case 1:
                            _schema = _a.sent();
                            if (!!this.refs[ref]) return [3 /*break*/, 3];
                            return [4 /*yield*/, loadMetaSchema.call(this, _schema.$schema)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            if (!this.refs[ref])
                                this.addSchema(_schema, ref, meta);
                            return [2 /*return*/];
                    }
                });
            });
        }
        function _loadSchema(ref) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            p = this._loading[ref];
                            if (p)
                                return [2 /*return*/, p];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, , 3, 4]);
                            return [4 /*yield*/, (this._loading[ref] = loadSchema(ref))];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3:
                            delete this._loading[ref];
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
    };
    // Adds schema to the instance
    Ajv.prototype.addSchema = function (schema, // If array is passed, `key` will be ignored
    key, // Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
    _meta, // true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
    _validateSchema // false to skip schema validation. Used internally, option validateSchema should be used instead.
    ) {
        if (_validateSchema === void 0) { _validateSchema = this.opts.validateSchema; }
        if (Array.isArray(schema)) {
            for (var _i = 0, schema_1 = schema; _i < schema_1.length; _i++) {
                var sch = schema_1[_i];
                this.addSchema(sch, undefined, _meta, _validateSchema);
            }
            return this;
        }
        var id;
        if (typeof schema === "object") {
            var schemaId = this.opts.schemaId;
            id = schema[schemaId];
            if (id !== undefined && typeof id != "string") {
                throw new Error("schema ".concat(schemaId, " must be string"));
            }
        }
        key = (0, resolve_1.normalizeId)(key || id);
        this._checkUnique(key);
        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
        return this;
    };
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    Ajv.prototype.addMetaSchema = function (schema, key, // schema key
    _validateSchema // false to skip schema validation, can be used to override validateSchema option for meta-schema
    ) {
        if (_validateSchema === void 0) { _validateSchema = this.opts.validateSchema; }
        this.addSchema(schema, key, true, _validateSchema);
        return this;
    };
    //  Validate schema against its meta-schema
    Ajv.prototype.validateSchema = function (schema, throwOrLogError) {
        if (typeof schema == "boolean")
            return true;
        var $schema;
        $schema = schema.$schema;
        if ($schema !== undefined && typeof $schema != "string") {
            throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
            this.logger.warn("meta-schema not available");
            this.errors = null;
            return true;
        }
        var valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
            var message = "schema is invalid: " + this.errorsText();
            if (this.opts.validateSchema === "log")
                this.logger.error(message);
            else
                throw new Error(message);
        }
        return valid;
    };
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    Ajv.prototype.getSchema = function (keyRef) {
        var sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
            keyRef = sch;
        if (sch === undefined) {
            var schemaId = this.opts.schemaId;
            var root = new compile_2.SchemaEnv({ schema: {}, schemaId: schemaId });
            sch = compile_2.resolveSchema.call(this, root, keyRef);
            if (!sch)
                return;
            this.refs[keyRef] = sch;
        }
        return (sch.validate || this._compileSchemaEnv(sch));
    };
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    Ajv.prototype.removeSchema = function (schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
            this._removeAllSchemas(this.schemas, schemaKeyRef);
            this._removeAllSchemas(this.refs, schemaKeyRef);
            return this;
        }
        switch (typeof schemaKeyRef) {
            case "undefined":
                this._removeAllSchemas(this.schemas);
                this._removeAllSchemas(this.refs);
                this._cache.clear();
                return this;
            case "string": {
                var sch = getSchEnv.call(this, schemaKeyRef);
                if (typeof sch == "object")
                    this._cache.delete(sch.schema);
                delete this.schemas[schemaKeyRef];
                delete this.refs[schemaKeyRef];
                return this;
            }
            case "object": {
                var cacheKey = schemaKeyRef;
                this._cache.delete(cacheKey);
                var id = schemaKeyRef[this.opts.schemaId];
                if (id) {
                    id = (0, resolve_1.normalizeId)(id);
                    delete this.schemas[id];
                    delete this.refs[id];
                }
                return this;
            }
            default:
                throw new Error("ajv.removeSchema: invalid parameter");
        }
    };
    // add "vocabulary" - a collection of keywords
    Ajv.prototype.addVocabulary = function (definitions) {
        for (var _i = 0, definitions_1 = definitions; _i < definitions_1.length; _i++) {
            var def = definitions_1[_i];
            this.addKeyword(def);
        }
        return this;
    };
    Ajv.prototype.addKeyword = function (kwdOrDef, def // deprecated
    ) {
        var _this = this;
        var keyword;
        if (typeof kwdOrDef == "string") {
            keyword = kwdOrDef;
            if (typeof def == "object") {
                this.logger.warn("these parameters are deprecated, see docs for addKeyword");
                def.keyword = keyword;
            }
        }
        else if (typeof kwdOrDef == "object" && def === undefined) {
            def = kwdOrDef;
            keyword = def.keyword;
            if (Array.isArray(keyword) && !keyword.length) {
                throw new Error("addKeywords: keyword must be string or non-empty array");
            }
        }
        else {
            throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
            (0, util_1.eachItem)(keyword, function (kwd) { return addRule.call(_this, kwd); });
            return this;
        }
        keywordMetaschema.call(this, def);
        var definition = __assign(__assign({}, def), { type: (0, dataType_1.getJSONTypes)(def.type), schemaType: (0, dataType_1.getJSONTypes)(def.schemaType) });
        (0, util_1.eachItem)(keyword, definition.type.length === 0
            ? function (k) { return addRule.call(_this, k, definition); }
            : function (k) { return definition.type.forEach(function (t) { return addRule.call(_this, k, definition, t); }); });
        return this;
    };
    Ajv.prototype.getKeyword = function (keyword) {
        var rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
    };
    // Remove keyword
    Ajv.prototype.removeKeyword = function (keyword) {
        // TODO return type should be Ajv
        var RULES = this.RULES;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (var _i = 0, _a = RULES.rules; _i < _a.length; _i++) {
            var group = _a[_i];
            var i = group.rules.findIndex(function (rule) { return rule.keyword === keyword; });
            if (i >= 0)
                group.rules.splice(i, 1);
        }
        return this;
    };
    // Add format
    Ajv.prototype.addFormat = function (name, format) {
        if (typeof format == "string")
            format = new RegExp(format);
        this.formats[name] = format;
        return this;
    };
    Ajv.prototype.errorsText = function (errors, // optional array of validation errors
    _a // optional options with properties `separator` and `dataVar`
    ) {
        if (errors === void 0) { errors = this.errors; }
        var // optional array of validation errors
        _b = _a === void 0 ? {} : _a // optional options with properties `separator` and `dataVar`
        , _c = _b.separator, separator = _c === void 0 ? ", " : _c, _d = _b.dataVar, dataVar = _d === void 0 ? "data" : _d;
        if (!errors || errors.length === 0)
            return "No errors";
        return errors
            .map(function (e) { return "".concat(dataVar).concat(e.instancePath, " ").concat(e.message); })
            .reduce(function (text, msg) { return text + separator + msg; });
    };
    Ajv.prototype.$dataMetaSchema = function (metaSchema, keywordsJsonPointers) {
        var rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (var _i = 0, keywordsJsonPointers_1 = keywordsJsonPointers; _i < keywordsJsonPointers_1.length; _i++) {
            var jsonPointer = keywordsJsonPointers_1[_i];
            var segments = jsonPointer.split("/").slice(1); // first segment is an empty string
            var keywords = metaSchema;
            for (var _a = 0, segments_1 = segments; _a < segments_1.length; _a++) {
                var seg = segments_1[_a];
                keywords = keywords[seg];
            }
            for (var key in rules) {
                var rule = rules[key];
                if (typeof rule != "object")
                    continue;
                var $data = rule.definition.$data;
                var schema = keywords[key];
                if ($data && schema)
                    keywords[key] = schemaOrData(schema);
            }
        }
        return metaSchema;
    };
    Ajv.prototype._removeAllSchemas = function (schemas, regex) {
        for (var keyRef in schemas) {
            var sch = schemas[keyRef];
            if (!regex || regex.test(keyRef)) {
                if (typeof sch == "string") {
                    delete schemas[keyRef];
                }
                else if (sch && !sch.meta) {
                    this._cache.delete(sch.schema);
                    delete schemas[keyRef];
                }
            }
        }
    };
    Ajv.prototype._addSchema = function (schema, meta, baseId, validateSchema, addSchema) {
        if (validateSchema === void 0) { validateSchema = this.opts.validateSchema; }
        if (addSchema === void 0) { addSchema = this.opts.addUsedSchema; }
        var id;
        var schemaId = this.opts.schemaId;
        if (typeof schema == "object") {
            id = schema[schemaId];
        }
        else {
            if (this.opts.jtd)
                throw new Error("schema must be object");
            else if (typeof schema != "boolean")
                throw new Error("schema must be object or boolean");
        }
        var sch = this._cache.get(schema);
        if (sch !== undefined)
            return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        var localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_2.SchemaEnv({ schema: schema, schemaId: schemaId, meta: meta, baseId: baseId, localRefs: localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
            // TODO atm it is allowed to overwrite schemas without id (instead of not adding them)
            if (baseId)
                this._checkUnique(baseId);
            this.refs[baseId] = sch;
        }
        if (validateSchema)
            this.validateSchema(schema, true);
        return sch;
    };
    Ajv.prototype._checkUnique = function (id) {
        if (this.schemas[id] || this.refs[id]) {
            throw new Error("schema with key or id \"".concat(id, "\" already exists"));
        }
    };
    Ajv.prototype._compileSchemaEnv = function (sch) {
        if (sch.meta)
            this._compileMetaSchema(sch);
        else
            compile_2.compileSchema.call(this, sch);
        /* istanbul ignore if */
        if (!sch.validate)
            throw new Error("ajv implementation error");
        return sch.validate;
    };
    Ajv.prototype._compileMetaSchema = function (sch) {
        var currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
            compile_2.compileSchema.call(this, sch);
        }
        finally {
            this.opts = currentOpts;
        }
    };
    Ajv.ValidationError = validation_error_1.default;
    Ajv.MissingRefError = ref_error_1.default;
    return Ajv;
}());
exports.default = Ajv;
function checkOptions(checkOpts, options, msg, log) {
    if (log === void 0) { log = "error"; }
    for (var key in checkOpts) {
        var opt = key;
        if (opt in options)
            this.logger[log]("".concat(msg, ": option ").concat(key, ". ").concat(checkOpts[opt]));
    }
}
function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef); // TODO tests fail without this line
    return this.schemas[keyRef] || this.refs[keyRef];
}
function addInitialSchemas() {
    var optsSchemas = this.opts.schemas;
    if (!optsSchemas)
        return;
    if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
    else
        for (var key in optsSchemas)
            this.addSchema(optsSchemas[key], key);
}
function addInitialFormats() {
    for (var name_1 in this.opts.formats) {
        var format = this.opts.formats[name_1];
        if (format)
            this.addFormat(name_1, format);
    }
}
function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (var keyword in defs) {
        var def = defs[keyword];
        if (!def.keyword)
            def.keyword = keyword;
        this.addKeyword(def);
    }
}
function getMetaSchemaOptions() {
    var metaOpts = __assign({}, this.opts);
    for (var _i = 0, META_IGNORE_OPTIONS_1 = META_IGNORE_OPTIONS; _i < META_IGNORE_OPTIONS_1.length; _i++) {
        var opt = META_IGNORE_OPTIONS_1[_i];
        delete metaOpts[opt];
    }
    return metaOpts;
}
var noLogs = { log: function () { }, warn: function () { }, error: function () { } };
function getLogger(logger) {
    if (logger === false)
        return noLogs;
    if (logger === undefined)
        return console;
    if (logger.log && logger.warn && logger.error)
        return logger;
    throw new Error("logger must implement log, warn and error methods");
}
var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
function checkKeyword(keyword, def) {
    var RULES = this.RULES;
    (0, util_1.eachItem)(keyword, function (kwd) {
        if (RULES.keywords[kwd])
            throw new Error("Keyword ".concat(kwd, " is already defined"));
        if (!KEYWORD_NAME.test(kwd))
            throw new Error("Keyword ".concat(kwd, " has invalid name"));
    });
    if (!def)
        return;
    if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
    }
}
function addRule(keyword, definition, dataType) {
    var _this = this;
    var _a;
    var post = definition === null || definition === void 0 ? void 0 : definition.post;
    if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
    var RULES = this.RULES;
    var ruleGroup = post ? RULES.post : RULES.rules.find(function (_a) {
        var t = _a.type;
        return t === dataType;
    });
    if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
        return;
    var rule = {
        keyword: keyword,
        definition: __assign(__assign({}, definition), { type: (0, dataType_1.getJSONTypes)(definition.type), schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType) }),
    };
    if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
        ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach(function (kwd) { return _this.addKeyword(kwd); });
}
function addBeforeRule(ruleGroup, rule, before) {
    var i = ruleGroup.rules.findIndex(function (_rule) { return _rule.keyword === before; });
    if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
    }
    else {
        ruleGroup.rules.push(rule);
        this.logger.warn("rule ".concat(before, " is not defined"));
    }
}
function keywordMetaschema(def) {
    var metaSchema = def.metaSchema;
    if (metaSchema === undefined)
        return;
    if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
}
var $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
};
function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
}
