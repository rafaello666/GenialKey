"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://github.com/ajv-validator/ajv/issues/889
var equal = require("fast-deep-equal");
equal.code = 'require("ajv/dist/runtime/equal").default';
exports.default = equal;
