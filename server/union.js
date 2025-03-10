"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var code_1 = require("../code");
var def = {
    keyword: "union",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in union" },
};
exports.default = def;
