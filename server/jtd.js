"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.MissingRefError = exports.ValidationError = exports.CodeGenOptions = exports.CodeGen = exports.Code = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.JTDErrorObject = exports.KeywordCxt = exports.SchemaObjCxt = exports.SchemaCxt = exports.JTDParser = exports.ErrorNoParams = exports.ErrorObject = exports.AsyncValidateFunction = exports.ValidateFunction = exports.AnySchema = exports.AsyncSchema = exports.AnySchemaObject = exports.SchemaObject = exports.Schema = exports.Vocabulary = exports.FuncKeywordDefinition = exports.MacroKeywordDefinition = exports.CodeKeywordDefinition = exports.KeywordErrorDefinition = exports.KeywordDefinition = exports.AsyncFormatDefinition = exports.FormatDefinition = exports.Format = exports.Ajv = void 0;
var core_1 = require("./core");
var jtd_1 = require("./vocabularies/jtd");
var jtd_schema_1 = require("./refs/jtd-schema");
var serialize_1 = require("./compile/jtd/serialize");
var parse_1 = require("./compile/jtd/parse");
var META_SCHEMA_ID = "JTD-meta-schema";
var Ajv = /** @class */ (function (_super) {
    __extends(Ajv, _super);
    function Ajv(opts) {
        if (opts === void 0) { opts = {}; }
        return _super.call(this, __assign(__assign({}, opts), { jtd: true })) || this;
    }
    Ajv.prototype._addVocabularies = function () {
        _super.prototype._addVocabularies.call(this);
        this.addVocabulary(jtd_1.default);
    };
    Ajv.prototype._addDefaultMetaSchema = function () {
        _super.prototype._addDefaultMetaSchema.call(this);
        if (!this.opts.meta)
            return;
        this.addMetaSchema(jtd_schema_1.default, META_SCHEMA_ID, false);
    };
    Ajv.prototype.defaultMeta = function () {
        return (this.opts.defaultMeta =
            _super.prototype.defaultMeta.call(this) || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
    };
    Ajv.prototype.compileSerializer = function (schema) {
        var sch = this._addSchema(schema);
        return sch.serialize || this._compileSerializer(sch);
    };
    Ajv.prototype.compileParser = function (schema) {
        var sch = this._addSchema(schema);
        return (sch.parse || this._compileParser(sch));
    };
    Ajv.prototype._compileSerializer = function (sch) {
        serialize_1.default.call(this, sch, sch.schema.definitions || {});
        /* istanbul ignore if */
        if (!sch.serialize)
            throw new Error("ajv implementation error");
        return sch.serialize;
    };
    Ajv.prototype._compileParser = function (sch) {
        parse_1.default.call(this, sch, sch.schema.definitions || {});
        /* istanbul ignore if */
        if (!sch.parse)
            throw new Error("ajv implementation error");
        return sch.parse;
    };
    return Ajv;
}(core_1.default));
exports.Ajv = Ajv;
module.exports = exports = Ajv;
module.exports.Ajv = Ajv;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Ajv;
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
Object.defineProperty(exports, "ErrorObject", { enumerable: true, get: function () { return types_1.ErrorObject; } });
Object.defineProperty(exports, "ErrorNoParams", { enumerable: true, get: function () { return types_1.ErrorNoParams; } });
Object.defineProperty(exports, "JTDParser", { enumerable: true, get: function () { return types_1.JTDParser; } });
var compile_1 = require("./compile");
Object.defineProperty(exports, "SchemaCxt", { enumerable: true, get: function () { return compile_1.SchemaCxt; } });
Object.defineProperty(exports, "SchemaObjCxt", { enumerable: true, get: function () { return compile_1.SchemaObjCxt; } });
var validate_1 = require("./compile/validate");
Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function () { return validate_1.KeywordCxt; } });
var jtd_2 = require("./vocabularies/jtd");
Object.defineProperty(exports, "JTDErrorObject", { enumerable: true, get: function () { return jtd_2.JTDErrorObject; } });
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
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return validation_error_1.default; } });
var ref_error_1 = require("./compile/ref_error");
Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function () { return ref_error_1.default; } });
