"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinatesConfigResolver = void 0;
var commonConfigResolver_1 = require("./commonConfigResolver");
var DEFAULT_AXIS_THRESHOLD = 0;
exports.coordinatesConfigResolver = __assign(__assign({}, commonConfigResolver_1.commonConfigResolver), { axis: function (_v, _k, _a) {
        var axis = _a.axis;
        this.lockDirection = axis === 'lock';
        if (!this.lockDirection)
            return axis;
    }, axisThreshold: function (value) {
        if (value === void 0) { value = DEFAULT_AXIS_THRESHOLD; }
        return value;
    }, bounds: function (value) {
        if (value === void 0) { value = {}; }
        if (typeof value === 'function') {
            // @ts-ignore
            return function (state) { return exports.coordinatesConfigResolver.bounds(value(state)); };
        }
        if ('current' in value) {
            return function () { return value.current; };
        }
        if (typeof HTMLElement === 'function' && value instanceof HTMLElement) {
            return value;
        }
        var _a = value, _b = _a.left, left = _b === void 0 ? -Infinity : _b, _c = _a.right, right = _c === void 0 ? Infinity : _c, _d = _a.top, top = _d === void 0 ? -Infinity : _d, _e = _a.bottom, bottom = _e === void 0 ? Infinity : _e;
        return [
            [left, right],
            [top, bottom]
        ];
    } });
