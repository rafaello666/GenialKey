"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prohibited_1 = require("../definitions/prohibited");
var prohibited = function (ajv) { return ajv.addKeyword((0, prohibited_1.default)()); };
exports.default = prohibited;
module.exports = prohibited;
