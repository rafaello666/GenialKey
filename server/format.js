"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var codegen_1 = require("../../compile/codegen");
var error = {
    message: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1.str)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["must match format \"", "\""], ["must match format \"", "\""])), schemaCode);
    },
    params: function (_a) {
        var schemaCode = _a.schemaCode;
        return (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["{format: ", "}"], ["{format: ", "}"])), schemaCode);
    },
};
var def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error: error,
    code: function (cxt, ruleType) {
        var gen = cxt.gen, data = cxt.data, $data = cxt.$data, schema = cxt.schema, schemaCode = cxt.schemaCode, it = cxt.it;
        var opts = it.opts, errSchemaPath = it.errSchemaPath, schemaEnv = it.schemaEnv, self = it.self;
        if (!opts.validateFormats)
            return;
        if ($data)
            validate$DataFormat();
        else
            validateFormat();
        function validate$DataFormat() {
            var fmts = gen.scopeValue("formats", {
                ref: self.formats,
                code: opts.code.formats,
            });
            var fDef = gen.const("fDef", (0, codegen_1._)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", "[", "]"], ["", "[", "]"])), fmts, schemaCode));
            var fType = gen.let("fType");
            var format = gen.let("format");
            // TODO simplify
            gen.if((0, codegen_1._)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["typeof ", " == \"object\" && !(", " instanceof RegExp)"], ["typeof ", " == \"object\" && !(", " instanceof RegExp)"])), fDef, fDef), function () { return gen.assign(fType, (0, codegen_1._)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", ".type || \"string\""], ["", ".type || \"string\""])), fDef)).assign(format, (0, codegen_1._)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", ".validate"], ["", ".validate"])), fDef)); }, function () { return gen.assign(fType, (0, codegen_1._)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\"string\""], ["\"string\""])))).assign(format, fDef); });
            cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
            function unknownFmt() {
                if (opts.strictSchema === false)
                    return codegen_1.nil;
                return (0, codegen_1._)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " && !", ""], ["", " && !", ""])), schemaCode, format);
            }
            function invalidFmt() {
                var callFormat = schemaEnv.$async
                    ? (0, codegen_1._)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["(", ".async ? await ", "(", ") : ", "(", "))"], ["(", ".async ? await ", "(", ") : ", "(", "))"])), fDef, format, data, format, data) : (0, codegen_1._)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", "(", ")"], ["", "(", ")"])), format, data);
                var validData = (0, codegen_1._)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["(typeof ", " == \"function\" ? ", " : ", ".test(", "))"], ["(typeof ", " == \"function\" ? ", " : ", ".test(", "))"])), format, callFormat, format, data);
                return (0, codegen_1._)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " && ", " !== true && ", " === ", " && !", ""], ["", " && ", " !== true && ", " === ", " && !", ""])), format, format, fType, ruleType, validData);
            }
        }
        function validateFormat() {
            var formatDef = self.formats[schema];
            if (!formatDef) {
                unknownFormat();
                return;
            }
            if (formatDef === true)
                return;
            var _a = getFormat(formatDef), fmtType = _a[0], format = _a[1], fmtRef = _a[2];
            if (fmtType === ruleType)
                cxt.pass(validCondition());
            function unknownFormat() {
                if (opts.strictSchema === false) {
                    self.logger.warn(unknownMsg());
                    return;
                }
                throw new Error(unknownMsg());
                function unknownMsg() {
                    return "unknown format \"".concat(schema, "\" ignored in schema at path \"").concat(errSchemaPath, "\"");
                }
            }
            function getFormat(fmtDef) {
                var code = fmtDef instanceof RegExp
                    ? (0, codegen_1.regexpCode)(fmtDef)
                    : opts.code.formats
                        ? (0, codegen_1._)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["", "", ""], ["", "", ""])), opts.code.formats, (0, codegen_1.getProperty)(schema)) : undefined;
                var fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code: code });
                if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
                    return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", ".validate"], ["", ".validate"])), fmt)];
                }
                return ["string", fmtDef, fmt];
            }
            function validCondition() {
                if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
                    if (!schemaEnv.$async)
                        throw new Error("async format in sync schema");
                    return (0, codegen_1._)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["await ", "(", ")"], ["await ", "(", ")"])), fmtRef, data);
                }
                return typeof format == "function" ? (0, codegen_1._)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["", "(", ")"], ["", "(", ")"])), fmtRef, data) : (0, codegen_1._)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", ".test(", ")"], ["", ".test(", ")"])), fmtRef, data);
            }
        }
    },
};
exports.default = def;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17;
