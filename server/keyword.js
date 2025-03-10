"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.macroKeywordCode = macroKeywordCode;
exports.funcKeywordCode = funcKeywordCode;
exports.validSchemaType = validSchemaType;
exports.validateKeywordUsage = validateKeywordUsage;
var codegen_1 = require("../codegen");
var names_1 = require("../names");
var code_1 = require("../../vocabularies/code");
var errors_1 = require("../errors");
function macroKeywordCode(cxt, def) {
    var gen = cxt.gen, keyword = cxt.keyword, schema = cxt.schema, parentSchema = cxt.parentSchema, it = cxt.it;
    var macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    var schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
    var valid = gen.name("valid");
    cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: "".concat(it.errSchemaPath, "/").concat(keyword),
        topSchemaRef: schemaRef,
        compositeRule: true,
    }, valid);
    cxt.pass(valid, function () { return cxt.error(true); });
}
function funcKeywordCode(cxt, def) {
    var _a;
    var gen = cxt.gen, keyword = cxt.keyword, schema = cxt.schema, parentSchema = cxt.parentSchema, $data = cxt.$data, it = cxt.it;
    checkAsyncKeyword(it, def);
    var validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    var validateRef = useKeyword(gen, keyword, validate);
    var valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
    function validateKeyword() {
        if (def.errors === false) {
            assignValid();
            if (def.modifying)
                modifyData(cxt);
            reportErrs(function () { return cxt.error(); });
        }
        else {
            var ruleErrs_1 = def.async ? validateAsync() : validateSync();
            if (def.modifying)
                modifyData(cxt);
            reportErrs(function () { return addErrs(cxt, ruleErrs_1); });
        }
    }
    function validateAsync() {
        var ruleErrs = gen.let("ruleErrs", null);
        gen.try(function () { return assignValid((0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["await "], ["await "])))); }, function (e) {
            return gen.assign(valid, false).if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " instanceof ", ""], ["", " instanceof ", ""])), e, it.ValidationError), function () { return gen.assign(ruleErrs, (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ".errors"], ["", ".errors"])), e)); }, function () { return gen.throw(e); });
        });
        return ruleErrs;
    }
    function validateSync() {
        var validateErrs = (0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", ".errors"], ["", ".errors"])), validateRef);
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
    }
    function assignValid(_await) {
        if (_await === void 0) { _await = def.async ? (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["await "], ["await "]))) : codegen_1.nil; }
        var passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        var passSchema = !(("compile" in def && !$data) || def.schema === false);
        gen.assign(valid, (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", "", ""], ["", "", ""])), _await, (0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)), def.modifying);
    }
    function reportErrs(errors) {
        var _a;
        gen.if((0, codegen_1.not)((_a = def.valid) !== null && _a !== void 0 ? _a : valid), errors);
    }
}
function modifyData(cxt) {
    var gen = cxt.gen, data = cxt.data, it = cxt.it;
    gen.if(it.parentData, function () { return gen.assign(data, (0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), it.parentData, it.parentDataProperty)); });
}
function addErrs(cxt, errs) {
    var gen = cxt.gen;
    gen.if((0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Array.isArray(", ")"], ["Array.isArray(", ")"])), errs), function () {
        gen
            .assign(names_1.default.vErrors, (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", " === null ? ", " : ", ".concat(", ")"], ["", " === null ? ", " : ", ".concat(", ")"])), names_1.default.vErrors, errs, names_1.default.vErrors, errs))
            .assign(names_1.default.errors, (0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", ".length"], ["", ".length"])), names_1.default.vErrors));
        (0, errors_1.extendErrors)(cxt);
    }, function () { return cxt.error(); });
}
function checkAsyncKeyword(_a, def) {
    var schemaEnv = _a.schemaEnv;
    if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
}
function useKeyword(gen, keyword, result) {
    if (result === undefined)
        throw new Error("keyword \"".concat(keyword, "\" failed to compile"));
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
}
function validSchemaType(schema, schemaType, allowUndefined) {
    if (allowUndefined === void 0) { allowUndefined = false; }
    // TODO add tests
    return (!schemaType.length ||
        schemaType.some(function (st) {
            return st === "array"
                ? Array.isArray(schema)
                : st === "object"
                    ? schema && typeof schema == "object" && !Array.isArray(schema)
                    : typeof schema == st || (allowUndefined && typeof schema == "undefined");
        }));
}
function validateKeywordUsage(_a, def, keyword) {
    var schema = _a.schema, opts = _a.opts, self = _a.self, errSchemaPath = _a.errSchemaPath;
    /* istanbul ignore if */
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
    }
    var deps = def.dependencies;
    if (deps === null || deps === void 0 ? void 0 : deps.some(function (kwd) { return !Object.prototype.hasOwnProperty.call(schema, kwd); })) {
        throw new Error("parent schema must have dependencies of ".concat(keyword, ": ").concat(deps.join(",")));
    }
    if (def.validateSchema) {
        var valid = def.validateSchema(schema[keyword]);
        if (!valid) {
            var msg = "keyword \"".concat(keyword, "\" value is invalid at path \"").concat(errSchemaPath, "\": ") +
                self.errorsText(def.validateSchema.errors);
            if (opts.validateSchema === "log")
                self.logger.error(msg);
            else
                throw new Error(msg);
        }
    }
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
