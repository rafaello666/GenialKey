"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getRequiredDef;
function getRequiredDef(keyword) {
    return function () { return ({
        keyword: keyword,
        type: "object",
        schemaType: "array",
        macro: function (schema) {
            var _a;
            if (schema.length === 0)
                return true;
            if (schema.length === 1)
                return { required: schema };
            var comb = keyword === "anyRequired" ? "anyOf" : "oneOf";
            return _a = {}, _a[comb] = schema.map(function (p) { return ({ required: [p] }); }), _a;
        },
        metaSchema: {
            type: "array",
            items: { type: "string" },
        },
    }); };
}
