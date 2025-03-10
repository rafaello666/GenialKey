"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../compile/util");
var def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code: function (_a) {
        var keyword = _a.keyword, parentSchema = _a.parentSchema, it = _a.it;
        if (parentSchema.if === undefined)
            (0, util_1.checkStrictMode)(it, "\"".concat(keyword, "\" without \"if\" is ignored"));
    },
};
exports.default = def;
