"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var patternRequired_1 = require("../definitions/patternRequired");
var patternRequired = function (ajv) { return ajv.addKeyword((0, patternRequired_1.default)()); };
exports.default = patternRequired;
module.exports = patternRequired;
