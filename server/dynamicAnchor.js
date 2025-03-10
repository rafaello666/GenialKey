"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicAnchor = dynamicAnchor;
var codegen_1 = require("../../compile/codegen");
var names_1 = require("../../compile/names");
var compile_1 = require("../../compile");
var ref_1 = require("../core/ref");
var def = {
    keyword: "$dynamicAnchor",
    schemaType: "string",
    code: function (cxt) { return dynamicAnchor(cxt, cxt.schema); },
};
function dynamicAnchor(cxt, anchor) {
    var gen = cxt.gen, it = cxt.it;
    it.schemaEnv.root.dynamicAnchors[anchor] = true;
    var v = (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "", ""], ["", "", ""])), names_1.default.dynamicAnchors, (0, codegen_1.getProperty)(anchor));
    var validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
    gen.if((0, codegen_1._)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["!", ""], ["!", ""])), v), function () { return gen.assign(v, validate); });
}
function _getValidate(cxt) {
    var _a = cxt.it, schemaEnv = _a.schemaEnv, schema = _a.schema, self = _a.self;
    var _b = schemaEnv.root, root = _b.root, baseId = _b.baseId, localRefs = _b.localRefs, meta = _b.meta;
    var schemaId = self.opts.schemaId;
    var sch = new compile_1.SchemaEnv({ schema: schema, schemaId: schemaId, root: root, baseId: baseId, localRefs: localRefs, meta: meta });
    compile_1.compileSchema.call(self, sch);
    return (0, ref_1.getValidate)(cxt, sch);
}
exports.default = def;
var templateObject_1, templateObject_2;
