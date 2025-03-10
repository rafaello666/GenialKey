"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("../../compile/util");
var def = {
    keyword: ["maxContains", "minContains"],
    type: "array",
    schemaType: "number",
    code: function (_a) {
        var keyword = _a.keyword, parentSchema = _a.parentSchema, it = _a.it;
        if (parentSchema.contains === undefined) {
            (0, util_1.checkStrictMode)(it, "\"".concat(keyword, "\" without \"contains\" is ignored"));
        }
    },
};
exports.default = def;
