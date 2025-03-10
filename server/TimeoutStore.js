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
exports.TimeoutStore = void 0;
var TimeoutStore = /** @class */ (function () {
    function TimeoutStore() {
        this._timeouts = new Map();
    }
    TimeoutStore.prototype.add = function (key, callback, ms) {
        if (ms === void 0) { ms = 140; }
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        this.remove(key);
        this._timeouts.set(key, window.setTimeout.apply(window, __spreadArray([callback, ms], args, false)));
    };
    TimeoutStore.prototype.remove = function (key) {
        var timeout = this._timeouts.get(key);
        if (timeout)
            window.clearTimeout(timeout);
    };
    TimeoutStore.prototype.clean = function () {
        this._timeouts.forEach(function (timeout) { return void window.clearTimeout(timeout); });
        this._timeouts.clear();
    };
    return TimeoutStore;
}());
exports.TimeoutStore = TimeoutStore;
