"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var regexp_1 = require("../definitions/regexp");
var regexp = function (ajv) { return ajv.addKeyword((0, regexp_1.default)()); };
exports.default = regexp;
module.exports = regexp;
