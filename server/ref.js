"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRef = hasRef;
var compile_1 = require("../../compile");
var codegen_1 = require("../../compile/codegen");
var ref_error_1 = require("../../compile/ref_error");
var names_1 = require("../../compile/names");
var ref_1 = require("../core/ref");
var metadata_1 = require("./metadata");
var def = {
    keyword: "ref",
    schemaType: "string",
    code: function (cxt) {
        (0, metadata_1.checkMetadata)(cxt);
        var gen = cxt.gen, data = cxt.data, ref = cxt.schema, parentSchema = cxt.parentSchema, it = cxt.it;
        var root = it.schemaEnv.root;
        var valid = gen.name("valid");
        if (parentSchema.nullable) {
            gen.var(valid, (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " === null"], ["", " === null"])), data));
            gen.if((0, codegen_1.not)(valid), validateJtdRef);
        }
        else {
            gen.var(valid, false);
            validateJtdRef();
        }
        cxt.ok(valid);
        function validateJtdRef() {
            var _a;
            var refSchema = (_a = root.schema.definitions) === null || _a === void 0 ? void 0 : _a[ref];
            if (!refSchema) {
                throw new ref_error_1.default(it.opts.uriResolver, "", ref, "No definition ".concat(ref));
            }
            if (hasRef(refSchema) || !it.opts.inlineRefs)
                callValidate(refSchema);
            else
                inlineRefSchema(refSchema);
        }
        function callValidate(schema) {
            var sch = compile_1.compileSchema.call(it.self, new compile_1.SchemaEnv({ schema: schema, root: root, schemaPath: "/definitions/".concat(ref) }));
            var v = (0, ref_1.getValidate)(cxt, sch);
            var errsCount = gen.const("_errs", names_1.default.errors);
            (0, ref_1.callRef)(cxt, v, sch, sch.$async);
            gen.assign(valid, (0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " === ", ""], ["", " === ", ""])), errsCount, names_1.default.errors));
        }
        function inlineRefSchema(schema) {
            var schName = gen.scopeValue("schema", it.opts.code.source === true ? { ref: schema, code: (0, codegen_1.stringify)(schema) } : { ref: schema });
            cxt.subschema({
                schema: schema,
                dataTypes: [],
                schemaPath: codegen_1.nil,
                topSchemaRef: schName,
                errSchemaPath: "/definitions/".concat(ref),
            }, valid);
        }
    },
};
function hasRef(schema) {
    for (var key in schema) {
        var sch = void 0;
        if (key === "ref" || (typeof (sch = schema[key]) == "object" && hasRef(sch)))
            return true;
    }
    return false;
}
exports.default = def;
var templateObject_1, templateObject_2;
