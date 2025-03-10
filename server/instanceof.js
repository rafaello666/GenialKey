"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var instanceof_1 = require("../definitions/instanceof");
var instanceofPlugin = function (ajv) { return ajv.addKeyword((0, instanceof_1.default)()); };
exports.default = instanceofPlugin;
module.exports = instanceofPlugin;
