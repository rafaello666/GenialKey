"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SAFE_INTEGER = exports.isSafeInteger = exports.isFiniteNumber = void 0;
// https://caniuse.com/mdn-javascript_builtins_number_isfinite
exports.isFiniteNumber = Number.isFinite ||
    function (value) {
        return typeof value === 'number' && isFinite(value);
    };
// https://caniuse.com/mdn-javascript_builtins_number_issafeinteger
exports.isSafeInteger = Number.isSafeInteger ||
    function (value) {
        return typeof value === 'number' && Math.abs(value) <= exports.MAX_SAFE_INTEGER;
    };
exports.MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
