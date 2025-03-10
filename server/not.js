"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../compile/util");
var def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, it = cxt.it;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
            cxt.fail();
            return;
        }
        var valid = gen.name("valid");
        cxt.subschema({
            keyword: "not",
            compositeRule: true,
            createErrors: false,
            allErrors: false,
        }, valid);
        cxt.failResult(valid, function () { return cxt.reset(); }, function () { return cxt.error(); });
    },
    error: { message: "must NOT be valid" },
};
exports.default = def;
