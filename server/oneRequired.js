"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var oneRequired_1 = require("../definitions/oneRequired");
var oneRequired = function (ajv) { return ajv.addKeyword((0, oneRequired_1.default)()); };
exports.default = oneRequired;
module.exports = oneRequired;
