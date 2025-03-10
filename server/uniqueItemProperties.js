"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uniqueItemProperties_1 = require("../definitions/uniqueItemProperties");
var uniqueItemProperties = function (ajv) { return ajv.addKeyword((0, uniqueItemProperties_1.default)()); };
exports.default = uniqueItemProperties;
module.exports = uniqueItemProperties;
