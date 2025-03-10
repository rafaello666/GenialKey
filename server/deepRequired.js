"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var deepRequired_1 = require("../definitions/deepRequired");
var deepRequired = function (ajv) { return ajv.addKeyword((0, deepRequired_1.default)()); };
exports.default = deepRequired;
module.exports = deepRequired;
