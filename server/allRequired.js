"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var allRequired_1 = require("../definitions/allRequired");
var allRequired = function (ajv) { return ajv.addKeyword((0, allRequired_1.default)()); };
exports.default = allRequired;
module.exports = allRequired;
