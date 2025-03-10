"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var code_1 = require("../code");
var def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" },
};
exports.default = def;
