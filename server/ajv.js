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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingRefError = exports.ValidationError = exports.CodeGenOptions = exports.CodeGen = exports.Code = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.JSONSchemaType = exports.JSONType = exports.DefinedError = exports.KeywordCxt = exports.SchemaObjCxt = exports.SchemaCxt = exports.ErrorNoParams = exports.ErrorObject = exports.SchemaValidateFunction = exports.AsyncValidateFunction = exports.ValidateFunction = exports.AnySchema = exports.AsyncSchema = exports.AnySchemaObject = exports.SchemaObject = exports.Schema = exports.Vocabulary = exports.FuncKeywordDefinition = exports.MacroKeywordDefinition = exports.CodeKeywordDefinition = exports.KeywordErrorDefinition = exports.KeywordDefinition = exports.AsyncFormatDefinition = exports.FormatDefinition = exports.Format = exports.Ajv = void 0;
var core_1 = require("./core");
var draft7_1 = require("./vocabularies/draft7");
var discriminator_1 = require("./vocabularies/discriminator");
var draft7MetaSchema = require("./refs/json-schema-draft-07.json");
var META_SUPPORT_DATA = ["/properties"];
var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
var Ajv = /** @class */ (function (_super) {
    __extends(Ajv, _super);
    function Ajv() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ajv.prototype._addVocabularies = function () {
        var _this = this;
        _super.prototype._addVocabularies.call(this);
        draft7_1.default.forEach(function (v) { return _this.addVocabulary(v); });
        if (this.opts.discriminator)
            this.addKeyword(discriminator_1.default);
    };
    Ajv.prototype._addDefaultMetaSchema = function () {
        _super.prototype._addDefaultMetaSchema.call(this);
        if (!this.opts.meta)
            return;
        var metaSchema = this.opts.$data
            ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA)
            : draft7MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    };
    Ajv.prototype.defaultMeta = function () {
        return (this.opts.defaultMeta =
            _super.prototype.defaultMeta.call(this) || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
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
Object.defineProperty(exports, "SchemaValidateFunction", { enumerable: true, get: function () { return types_1.SchemaValidateFunction; } });
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
