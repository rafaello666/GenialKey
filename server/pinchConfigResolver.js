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
exports.pinchConfigResolver = void 0;
var fn_1 = require("../utils/fn");
var maths_1 = require("../utils/maths");
var commonConfigResolver_1 = require("./commonConfigResolver");
var support_1 = require("./support");
exports.pinchConfigResolver = __assign(__assign({}, commonConfigResolver_1.commonConfigResolver), { device: function (_v, _k, _a) {
        var shared = _a.shared, _b = _a.pointer, _c = _b === void 0 ? {} : _b, _d = _c.touch, touch = _d === void 0 ? false : _d;
        // Only try to use gesture events when they are supported and domTarget is set
        // as React doesn't support gesture handlers.
        var sharedConfig = shared;
        if (sharedConfig.target && !support_1.SUPPORT.touch && support_1.SUPPORT.gesture)
            return 'gesture';
        if (support_1.SUPPORT.touch && touch)
            return 'touch';
        if (support_1.SUPPORT.touchscreen) {
            if (support_1.SUPPORT.pointer)
                return 'pointer';
            if (support_1.SUPPORT.touch)
                return 'touch';
        }
        // device is undefined and that's ok, we're going to use wheel to zoom.
    }, bounds: function (_v, _k, _a) {
        var _b = _a.scaleBounds, scaleBounds = _b === void 0 ? {} : _b, _c = _a.angleBounds, angleBounds = _c === void 0 ? {} : _c;
        var _scaleBounds = function (state) {
            var D = (0, fn_1.assignDefault)((0, fn_1.call)(scaleBounds, state), { min: -Infinity, max: Infinity });
            return [D.min, D.max];
        };
        var _angleBounds = function (state) {
            var A = (0, fn_1.assignDefault)((0, fn_1.call)(angleBounds, state), { min: -Infinity, max: Infinity });
            return [A.min, A.max];
        };
        if (typeof scaleBounds !== 'function' && typeof angleBounds !== 'function')
            return [_scaleBounds(), _angleBounds()];
        return function (state) { return [_scaleBounds(state), _angleBounds(state)]; };
    }, threshold: function (value, _k, config) {
        this.lockDirection = config.axis === 'lock';
        var threshold = maths_1.V.toVector(value, this.lockDirection ? [0.1, 3] : 0);
        return threshold;
    }, modifierKey: function (value) {
        if (value === undefined)
            return 'ctrlKey';
        return value;
    }, pinchOnWheel: function (value) {
        if (value === void 0) { value = true; }
        return value;
    } });
