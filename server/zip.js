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
exports.zip = zip;
var zip_1 = require("../observable/zip");
var lift_1 = require("../util/lift");
/**
 * @deprecated Replaced with {@link zipWith}. Will be removed in v8.
 */
function zip() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    return (0, lift_1.operate)(function (source, subscriber) {
        zip_1.zip.apply(void 0, __spreadArray([source], sources, false)).subscribe(subscriber);
    });
}
