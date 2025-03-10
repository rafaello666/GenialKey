"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicRef = dynamicRef;
var codegen_1 = require("../../compile/codegen");
var names_1 = require("../../compile/names");
var ref_1 = require("../core/ref");
var def = {
    keyword: "$dynamicRef",
    schemaType: "string",
    code: function (cxt) { return dynamicRef(cxt, cxt.schema); },
};
function dynamicRef(cxt, ref) {
    var gen = cxt.gen, keyword = cxt.keyword, it = cxt.it;
    if (ref[0] !== "#")
        throw new Error("\"".concat(keyword, "\" only supports hash fragment reference"));
    var anchor = ref.slice(1);
    if (it.allErrors) {
        _dynamicRef();
    }
    else {
        var valid = gen.let("valid", false);
        _dynamicRef(valid);
        cxt.ok(valid);
    }
    function _dynamicRef(valid) {
        // TODO the assumption here is that `recursiveRef: #` always points to the root
        // of the schema object, which is not correct, because there may be $id that
        // makes # point to it, and the target schema may not contain dynamic/recursiveAnchor.
        // Because of that 2 tests in recursiveRef.json fail.
        // This is a similar problem to #815 (`$id` doesn't alter resolution scope for `{ "$ref": "#" }`).
        // (This problem is not tested in JSON-Schema-Test-Suite)
        if (it.schemaEnv.root.dynamicAnchors[anchor]) {
            var v = gen.let("_v", (0, codegen_1._)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "", ""], ["", "", ""])), names_1.default.dynamicAnchors, (0, codegen_1.getProperty)(anchor)));
            gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
        }
        else {
            _callRef(it.validateName, valid)();
        }
    }
    function _callRef(validate, valid) {
        return valid
            ? function () {
                return gen.block(function () {
                    (0, ref_1.callRef)(cxt, validate);
                    gen.let(valid, true);
                });
            }
            : function () { return (0, ref_1.callRef)(cxt, validate); };
    }
}
exports.default = def;
var templateObject_1;
