"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getRangeDef;
function getRangeDef(keyword) {
    return function () { return ({
        keyword: keyword,
        type: "number",
        schemaType: "array",
        macro: function (_a) {
            var min = _a[0], max = _a[1];
            validateRangeSchema(min, max);
            return keyword === "range"
                ? { minimum: min, maximum: max }
                : { exclusiveMinimum: min, exclusiveMaximum: max };
        },
        metaSchema: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { type: "number" },
        },
    }); };
    function validateRangeSchema(min, max) {
        if (min > max || (keyword === "exclusiveRange" && min === max)) {
            throw new Error("There are no numbers in range");
        }
    }
}
