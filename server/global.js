"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalSelf = void 0;
/** returns `undefined` is `self` is missing, e.g. in node */
exports.optionalSelf = typeof self !== 'undefined' ? self : undefined;
