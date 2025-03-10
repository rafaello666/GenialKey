"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var select_1 = require("../definitions/select");
var select = function (ajv, opts) {
    (0, select_1.default)(opts).forEach(function (d) { return ajv.addKeyword(d); });
    return ajv;
};
exports.default = select;
module.exports = select;
