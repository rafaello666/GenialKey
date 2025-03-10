"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dependencies_1 = require("./dependencies");
var def = {
    keyword: "dependentSchemas",
    type: "object",
    schemaType: "object",
    code: function (cxt) { return (0, dependencies_1.validateSchemaDeps)(cxt); },
};
exports.default = def;
