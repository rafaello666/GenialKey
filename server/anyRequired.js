"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var anyRequired_1 = require("../definitions/anyRequired");
var anyRequired = function (ajv) { return ajv.addKeyword((0, anyRequired_1.default)()); };
exports.default = anyRequired;
module.exports = anyRequired;
