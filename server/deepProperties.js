"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var deepProperties_1 = require("../definitions/deepProperties");
var deepProperties = function (ajv, opts) {
    return ajv.addKeyword((0, deepProperties_1.default)(opts));
};
exports.default = deepProperties;
module.exports = deepProperties;
