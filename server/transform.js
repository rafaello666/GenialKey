"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transform_1 = require("../definitions/transform");
var transform = function (ajv) { return ajv.addKeyword((0, transform_1.default)()); };
exports.default = transform;
module.exports = transform;
