"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typeof_1 = require("../definitions/typeof");
var typeofPlugin = function (ajv) { return ajv.addKeyword((0, typeof_1.default)()); };
exports.default = typeofPlugin;
module.exports = typeofPlugin;
