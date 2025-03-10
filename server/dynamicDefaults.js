"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dynamicDefaults_1 = require("../definitions/dynamicDefaults");
var dynamicDefaults = function (ajv) { return ajv.addKeyword((0, dynamicDefaults_1.default)()); };
exports.default = dynamicDefaults;
module.exports = dynamicDefaults;
