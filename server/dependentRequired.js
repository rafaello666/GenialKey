"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dependencies_1 = require("../applicator/dependencies");
var def = {
    keyword: "dependentRequired",
    type: "object",
    schemaType: "object",
    error: dependencies_1.error,
    code: function (cxt) { return (0, dependencies_1.validatePropertyDeps)(cxt); },
};
exports.default = def;
