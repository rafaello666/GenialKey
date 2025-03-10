"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineLatest = combineLatest;
var combineLatest_1 = require("../observable/combineLatest");
var lift_1 = require("../util/lift");
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var pipe_1 = require("../util/pipe");
var args_1 = require("../util/args");
/**
 * @deprecated Replaced with {@link combineLatestWith}. Will be removed in v8.
 */
function combineLatest() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = (0, args_1.popResultSelector)(args);
    return resultSelector
        ? (0, pipe_1.pipe)(combineLatest.apply(void 0, args), (0, mapOneOrManyArgs_1.mapOneOrManyArgs)(resultSelector))
        : (0, lift_1.operate)(function (source, subscriber) {
            (0, combineLatest_1.combineLatestInit)(__spreadArray([source], (0, argsOrArgArray_1.argsOrArgArray)(args), true))(subscriber);
        });
}
