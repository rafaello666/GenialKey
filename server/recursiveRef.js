"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dynamicRef_1 = require("./dynamicRef");
var def = {
    keyword: "$recursiveRef",
    schemaType: "string",
    code: function (cxt) { return (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema); },
};
exports.default = def;
