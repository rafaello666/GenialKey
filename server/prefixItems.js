"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var items_1 = require("./items");
var def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: function (cxt) { return (0, items_1.validateTuple)(cxt, "items"); },
};
exports.default = def;
