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
exports.dragConfigResolver = exports.DEFAULT_KEYBOARD_DISPLACEMENT = exports.DEFAULT_SWIPE_DURATION = exports.DEFAULT_SWIPE_DISTANCE = exports.DEFAULT_SWIPE_VELOCITY = exports.DEFAULT_DRAG_DELAY = exports.DEFAULT_PREVENT_SCROLL_DELAY = void 0;
var maths_1 = require("../utils/maths");
var coordinatesConfigResolver_1 = require("./coordinatesConfigResolver");
var support_1 = require("./support");
exports.DEFAULT_PREVENT_SCROLL_DELAY = 250;
exports.DEFAULT_DRAG_DELAY = 180;
exports.DEFAULT_SWIPE_VELOCITY = 0.5;
exports.DEFAULT_SWIPE_DISTANCE = 50;
exports.DEFAULT_SWIPE_DURATION = 250;
exports.DEFAULT_KEYBOARD_DISPLACEMENT = 10;
var DEFAULT_DRAG_AXIS_THRESHOLD = { mouse: 0, touch: 0, pen: 8 };
exports.dragConfigResolver = __assign(__assign({}, coordinatesConfigResolver_1.coordinatesConfigResolver), { device: function (_v, _k, _a) {
        var _b = _a.pointer, _c = _b === void 0 ? {} : _b, _d = _c.touch, touch = _d === void 0 ? false : _d, _e = _c.lock, lock = _e === void 0 ? false : _e, _f = _c.mouse, mouse = _f === void 0 ? false : _f;
        this.pointerLock = lock && support_1.SUPPORT.pointerLock;
        if (support_1.SUPPORT.touch && touch)
            return 'touch';
        if (this.pointerLock)
            return 'mouse';
        if (support_1.SUPPORT.pointer && !mouse)
            return 'pointer';
        if (support_1.SUPPORT.touch)
            return 'touch';
        return 'mouse';
    }, preventScrollAxis: function (value, _k, _a) {
        var preventScroll = _a.preventScroll;
        this.preventScrollDelay =
            typeof preventScroll === 'number'
                ? preventScroll
                : preventScroll || (preventScroll === undefined && value)
                    ? exports.DEFAULT_PREVENT_SCROLL_DELAY
                    : undefined;
        if (!support_1.SUPPORT.touchscreen || preventScroll === false)
            return undefined;
        return value ? value : preventScroll !== undefined ? 'y' : undefined;
    }, pointerCapture: function (_v, _k, _a) {
        var _b = _a.pointer, _c = _b === void 0 ? {} : _b, _d = _c.capture, capture = _d === void 0 ? true : _d, _e = _c.buttons, buttons = _e === void 0 ? 1 : _e, _f = _c.keys, keys = _f === void 0 ? true : _f;
        this.pointerButtons = buttons;
        this.keys = keys;
        return !this.pointerLock && this.device === 'pointer' && capture;
    }, threshold: function (value, _k, _a) {
        var _b = _a.filterTaps, filterTaps = _b === void 0 ? false : _b, _c = _a.tapsThreshold, tapsThreshold = _c === void 0 ? 3 : _c, _d = _a.axis, axis = _d === void 0 ? undefined : _d;
        // TODO add warning when value is 0 and filterTaps or axis is set
        var threshold = maths_1.V.toVector(value, filterTaps ? tapsThreshold : axis ? 1 : 0);
        this.filterTaps = filterTaps;
        this.tapsThreshold = tapsThreshold;
        return threshold;
    }, swipe: function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.velocity, velocity = _c === void 0 ? exports.DEFAULT_SWIPE_VELOCITY : _c, _d = _b.distance, distance = _d === void 0 ? exports.DEFAULT_SWIPE_DISTANCE : _d, _e = _b.duration, duration = _e === void 0 ? exports.DEFAULT_SWIPE_DURATION : _e;
        return {
            velocity: this.transform(maths_1.V.toVector(velocity)),
            distance: this.transform(maths_1.V.toVector(distance)),
            duration: duration
        };
    }, delay: function (value) {
        if (value === void 0) { value = 0; }
        switch (value) {
            case true:
                return exports.DEFAULT_DRAG_DELAY;
            case false:
                return 0;
            default:
                return value;
        }
    }, axisThreshold: function (value) {
        if (!value)
            return DEFAULT_DRAG_AXIS_THRESHOLD;
        return __assign(__assign({}, DEFAULT_DRAG_AXIS_THRESHOLD), value);
    }, keyboardDisplacement: function (value) {
        if (value === void 0) { value = exports.DEFAULT_KEYBOARD_DISPLACEMENT; }
        return value;
    } });
if (process.env.NODE_ENV === 'development') {
    Object.assign(exports.dragConfigResolver, {
        useTouch: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `useTouch` option has been renamed to `pointer.touch`. Use it as in `{ pointer: { touch: true } }`.");
            }
            return NaN;
        },
        experimental_preventWindowScrollY: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `experimental_preventWindowScrollY` option has been renamed to `preventScroll`.");
            }
            return NaN;
        },
        swipeVelocity: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `swipeVelocity` option has been renamed to `swipe.velocity`. Use it as in `{ swipe: { velocity: 0.5 } }`.");
            }
            return NaN;
        },
        swipeDistance: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `swipeDistance` option has been renamed to `swipe.distance`. Use it as in `{ swipe: { distance: 50 } }`.");
            }
            return NaN;
        },
        swipeDuration: function (value) {
            if (value !== undefined) {
                throw Error("[@use-gesture]: `swipeDuration` option has been renamed to `swipe.duration`. Use it as in `{ swipe: { duration: 250 } }`.");
            }
            return NaN;
        }
    });
}
