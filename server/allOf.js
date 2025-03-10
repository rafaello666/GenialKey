"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../compile/util");
var def = {
    keyword: "allOf",
    schemaType: "array",
    code: function (cxt) {
        var gen = cxt.gen, schema = cxt.schema, it = cxt.it;
        /* istanbul ignore if */
        if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
        var valid = gen.name("valid");
        schema.forEach(function (sch, i) {
            if ((0, util_1.alwaysValidSchema)(it, sch))
                return;
            var schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
            cxt.ok(valid);
            cxt.mergeEvaluated(schCxt);
        });
    },
};
exports.default = def;
