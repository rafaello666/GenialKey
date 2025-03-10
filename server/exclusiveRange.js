"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var exclusiveRange_1 = require("../definitions/exclusiveRange");
var exclusiveRange = function (ajv) { return ajv.addKeyword((0, exclusiveRange_1.default)()); };
exports.default = exclusiveRange;
module.exports = exclusiveRange;
