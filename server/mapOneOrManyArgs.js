"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOneOrManyArgs = mapOneOrManyArgs;
var map_1 = require("../operators/map");
var isArray = Array.isArray;
function callOrApply(fn, args) {
    return isArray(args) ? fn.apply(void 0, args) : fn(args);
}
/**
 * Used in several -- mostly deprecated -- situations where we need to
 * apply a list of arguments or a single argument to a result selector.
 */
function mapOneOrManyArgs(fn) {
    return (0, map_1.map)(function (args) { return callOrApply(fn, args); });
}
